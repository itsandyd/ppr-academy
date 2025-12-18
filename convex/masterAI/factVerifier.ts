"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { callLLM, safeParseJson } from "./llmClient";
import type { SummarizerOutput } from "./types";

// ============================================================================
// FACT VERIFICATION STAGE
// ============================================================================

export const factVerificationOutputValidator = v.object({
  verifiedClaims: v.array(v.object({
    claim: v.string(),
    status: v.union(
      v.literal("verified"),        // Supported by multiple sources
      v.literal("partially_verified"), // Some support, some gaps
      v.literal("unverified"),      // No supporting evidence found
      v.literal("conflicting"),     // Sources disagree
      v.literal("extrapolated")     // Logical extension, not directly stated
    ),
    confidence: v.number(), // 0-1
    supportingSources: v.array(v.object({
      type: v.union(v.literal("embedding"), v.literal("web")),
      title: v.string(),
      excerpt: v.optional(v.string()),
    })),
    conflictingInfo: v.optional(v.string()),
  })),
  overallConfidence: v.number(),
  suggestedCorrections: v.array(v.object({
    originalClaim: v.string(),
    correction: v.string(),
    reason: v.string(),
  })),
});

export type FactVerificationOutput = {
  verifiedClaims: Array<{
    claim: string;
    status: "verified" | "partially_verified" | "unverified" | "conflicting" | "extrapolated";
    confidence: number;
    supportingSources: Array<{
      type: "embedding" | "web";
      title: string;
      excerpt?: string;
    }>;
    conflictingInfo?: string;
  }>;
  overallConfidence: number;
  suggestedCorrections: Array<{
    originalClaim: string;
    correction: string;
    reason: string;
  }>;
};

/**
 * Verify factual claims in the generated content
 */
export const verifyFacts = internalAction({
  args: {
    claims: v.array(v.string()), // Key claims to verify
    summaries: v.array(v.object({
      facetName: v.string(),
      summary: v.string(),
      keyPoints: v.array(v.string()),
      sourceChunkIds: v.array(v.string()),
    })),
    webResearch: v.optional(v.array(v.object({
      facetName: v.string(),
      searchQuery: v.string(),
      results: v.array(v.object({
        title: v.string(),
        url: v.string(),
        content: v.string(),
        score: v.number(),
      })),
    }))),
  },
  returns: factVerificationOutputValidator,
  handler: async (ctx, args): Promise<FactVerificationOutput> => {
    const { claims, summaries, webResearch } = args;

    // Build context from summaries and web research
    let embeddingContext = "";
    for (const s of summaries) {
      embeddingContext += `\n## ${s.facetName}\n${s.summary}\nKey points: ${s.keyPoints.join("; ")}\n`;
    }

    let webContext = "";
    if (webResearch && webResearch.length > 0) {
      for (const wr of webResearch) {
        webContext += `\n## Web: ${wr.facetName}\n`;
        for (const r of wr.results) {
          webContext += `- ${r.title}: ${r.content.substring(0, 300)}...\n`;
        }
      }
    }

    const systemPrompt = `You are a fact verification expert. Your job is to verify factual claims against provided evidence.

For each claim, determine:
1. Is it directly supported by the knowledge base?
2. Is it supported by web research?
3. Are there any conflicting statements?
4. What's your confidence level?

Status definitions:
- "verified": Multiple sources clearly support this claim
- "partially_verified": Some support exists but evidence is incomplete
- "unverified": No supporting evidence found in sources
- "conflicting": Sources disagree on this claim
- "extrapolated": Logical inference, not directly stated anywhere

Be rigorous but fair. Mark creative extensions as "extrapolated" not "unverified".`;

    const userPrompt = `CLAIMS TO VERIFY:
${claims.map((c, i) => `${i + 1}. ${c}`).join("\n")}

KNOWLEDGE BASE CONTEXT:
${embeddingContext}

${webContext ? `WEB RESEARCH CONTEXT:\n${webContext}` : "No web research available."}

Verify each claim and respond with JSON:
{
  "verifiedClaims": [
    {
      "claim": "the original claim",
      "status": "verified|partially_verified|unverified|conflicting|extrapolated",
      "confidence": 0.0-1.0,
      "supportingSources": [
        {"type": "embedding|web", "title": "source title", "excerpt": "relevant excerpt"}
      ],
      "conflictingInfo": "if any conflicts exist"
    }
  ],
  "overallConfidence": 0.0-1.0,
  "suggestedCorrections": [
    {
      "originalClaim": "claim that needs correction",
      "correction": "corrected version",
      "reason": "why this correction is needed"
    }
  ]
}`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini", // Fast and cheap for verification
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for accuracy
        maxTokens: 3000, // Increased to handle multiple claims
        responseFormat: "json",
      });

      let parsed: any;
      try {
        parsed = safeParseJson(response.content);
      } catch (parseError) {
        console.warn("Fact verifier JSON parsing failed, returning neutral result:", parseError);
        return {
          verifiedClaims: claims.map((c) => ({
            claim: c,
            status: "unverified" as const,
            confidence: 0.5,
            supportingSources: [],
          })),
          overallConfidence: 0.5,
          suggestedCorrections: [],
        };
      }

      // Normalize and validate the LLM response
      const normalizedClaims = (parsed.verifiedClaims || []).map((claim: any) => {
        // Normalize supporting sources - map invalid types to valid ones
        const normalizedSources = (claim.supportingSources || []).map((source: any) => {
          let normalizedType: "embedding" | "web" = "embedding";
          const sourceType = (source.type || "").toLowerCase();
          
          // Map various LLM responses to valid types
          if (sourceType === "web" || sourceType.includes("web") || sourceType.includes("url") || sourceType.includes("http")) {
            normalizedType = "web";
          } else {
            // "embedding", "knowledge base", "database", etc. all map to "embedding"
            normalizedType = "embedding";
          }
          
          return {
            type: normalizedType,
            title: source.title || "Unknown Source",
            excerpt: source.excerpt,
          };
        });

        // Normalize status to valid values
        const validStatuses = ["verified", "partially_verified", "unverified", "conflicting", "extrapolated"] as const;
        const normalizedStatus = validStatuses.includes(claim.status) 
          ? claim.status 
          : "unverified";

        return {
          claim: claim.claim || "",
          status: normalizedStatus,
          confidence: typeof claim.confidence === "number" ? Math.max(0, Math.min(1, claim.confidence)) : 0.5,
          supportingSources: normalizedSources,
          conflictingInfo: claim.conflictingInfo,
        };
      });

      // Validate and return
      return {
        verifiedClaims: normalizedClaims,
        overallConfidence: typeof parsed.overallConfidence === "number" 
          ? Math.max(0, Math.min(1, parsed.overallConfidence)) 
          : 0.5,
        suggestedCorrections: parsed.suggestedCorrections || [],
      };
    } catch (error) {
      console.error("Fact verification error:", error);
      // Return neutral result on error
      return {
        verifiedClaims: claims.map((c) => ({
          claim: c,
          status: "unverified" as const,
          confidence: 0.5,
          supportingSources: [],
        })),
        overallConfidence: 0.5,
        suggestedCorrections: [],
      };
    }
  },
});

/**
 * Extract key claims from generated content for verification
 */
export const extractClaims = internalAction({
  args: {
    content: v.string(),
    maxClaims: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const systemPrompt = `You are a claim extraction expert. Extract the key factual claims from the provided content.

Focus on:
- Technical specifications (e.g., "attack time should be 20-30ms")
- Recommendations (e.g., "use ratio of 2:1 for gentle compression")
- Definitions (e.g., "the Glue Compressor is modeled after...")
- Causal claims (e.g., "increasing attack time will allow more transients through")

Skip:
- Obvious statements
- Purely subjective opinions without technical basis
- Meta statements about the response itself`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract up to ${args.maxClaims || 10} key factual claims from:\n\n${args.content}` },
        ],
        temperature: 0.3,
        responseFormat: "json",
      });

      const parsed = safeParseJson(response.content) as any;
      return Array.isArray(parsed.claims) ? parsed.claims : [];
    } catch (error) {
      console.error("Claim extraction error:", error);
      return [];
    }
  },
});

