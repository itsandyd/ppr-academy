"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  chatSettingsValidator,
  retrieverOutputValidator,
  summarizerOutputValidator,
  MODEL_PRESETS,
  type ChatSettings,
  type RetrieverOutput,
  type SummarizerOutput,
  type Summary,
  type ModelId,
} from "./types";
import { callLLM, safeParseJson } from "./llmClient";

// ============================================================================
// SUMMARIZER STAGE
// ============================================================================

/**
 * Summarizer Stage
 * 
 * Compresses raw chunks from each bucket into dense, actionable summaries.
 * Preserves key techniques and creates a clean knowledge map.
 */
export const summarizeContent = internalAction({
  args: {
    retrieverOutput: retrieverOutputValidator,
    settings: chatSettingsValidator,
    originalQuestion: v.string(),
  },
  returns: summarizerOutputValidator,
  handler: async (ctx, args): Promise<SummarizerOutput> => {
    const { retrieverOutput, settings, originalQuestion } = args;
    
    // Get the model for this stage
    const modelId = getModelForStage("summarizer", settings);
    
    const summaries: Summary[] = [];

    // Process each bucket in parallel
    const summaryPromises = retrieverOutput.buckets.map(async (bucket) => {
      if (bucket.chunks.length === 0) {
        return null;
      }

      // Build context from chunks
      const chunksContext = bucket.chunks
        .map((chunk, index) => {
          const title = chunk.title || `Source ${index + 1}`;
          return `[${index + 1}] ${title}:\n${chunk.content}`;
        })
        .join("\n\n---\n\n");

      const systemPrompt = `You are an expert knowledge synthesizer. Distill raw content chunks into a focused, actionable summary.

For "${bucket.facetName}" facet:
1. Extract only relevant information for the facet and question
2. Merge & deduplicate overlapping info
3. Preserve specifics: techniques, values, device names, routing patterns
4. Note source references using [1], [2], etc.

Focus on actionable knowledge. Include specific values (e.g., "attack: 10-20ms"). Be specific, not generic.

YOU MUST RESPOND WITH VALID JSON ONLY. No markdown. No explanations. Just the JSON object:
{"summary":"your summary here","keyTechniques":["technique 1"],"sourceChunkIds":["id1"],"confidence":0.85}

Confidence: 0.9-1.0 = comprehensive, 0.7-0.9 = good with gaps, 0.5-0.7 = limited, <0.5 = sparse`;

      const userPrompt = `Original Question: "${originalQuestion}"

Facet: ${bucket.facetName}

Content Chunks (${bucket.chunks.length} total):

${chunksContext}

Synthesize a focused summary for this facet.`;

      try {
        const response = await callLLM({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          maxTokens: 2500, // Increased to handle longer summaries
          responseFormat: "json",
        });

        let parsed: any;
        try {
          parsed = safeParseJson(response.content) as any;
        } catch (parseError) {
          console.warn(`Summarizer JSON parsing failed for ${bucket.facetName}, using fallback:`, parseError);
          // Create fallback from raw response - clean up markdown formatting
          const cleanContent = response.content
            .replace(/^#+\s+.*$/gm, '') // Remove markdown headers
            .replace(/\*\*/g, '')       // Remove bold markers
            .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
            .trim();
          parsed = { 
            summary: cleanContent.substring(0, 2000), // Keep more content 
            keyTechniques: [], 
            confidence: 0.5 
          };
        }

        return {
          facetName: bucket.facetName,
          summary: parsed.summary || "No summary generated",
          keyTechniques: Array.isArray(parsed.keyTechniques) ? parsed.keyTechniques : [],
          sourceChunkIds: bucket.chunks.map(c => c.id),
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
        };
      } catch (error) {
        console.error(`Error summarizing facet ${bucket.facetName}:`, error);
        
        // Fallback: create a basic summary from chunk titles
        return {
          facetName: bucket.facetName,
          summary: bucket.chunks
            .slice(0, 3)
            .map(c => c.content.substring(0, 200))
            .join("\n\n"),
          keyTechniques: [],
          sourceChunkIds: bucket.chunks.map(c => c.id),
          confidence: 0.3,
        };
      }
    });

    // Wait for all summaries
    const results = await Promise.all(summaryPromises);

    // Filter out nulls
    for (const result of results) {
      if (result) {
        summaries.push(result);
      }
    }

    return { summaries };
  },
});

// Helper to get the model ID for a pipeline stage
function getModelForStage(
  stage: "planner" | "summarizer" | "ideaGenerator" | "critic" | "finalWriter",
  settings: ChatSettings
): ModelId {
  if (settings.customModels?.[stage]) {
    return settings.customModels[stage]!;
  }
  const preset = MODEL_PRESETS[settings.preset];
  return preset[stage];
}

