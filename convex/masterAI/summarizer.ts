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
import { callLLM } from "./llmClient";

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

      const systemPrompt = `You are an expert knowledge synthesizer for a music production education platform. Your job is to distill raw content chunks into a focused, actionable summary.

Given content chunks related to "${bucket.facetName}" and the user's question:

1. **Extract Relevant Information**: Pull out only the parts directly relevant to the facet and question
2. **Merge & Deduplicate**: Combine overlapping information, resolve any conflicts
3. **Preserve Specifics**: Keep concrete techniques, parameter values, device names, routing patterns
4. **Structure Clearly**: Organize into a logical flow that's easy to understand
5. **Note Source References**: Track which chunks contributed to each point (use [1], [2], etc.)

IMPORTANT:
- Focus on actionable, practical knowledge
- Include specific values when mentioned (e.g., "set attack to 10-20ms")
- Don't pad with generic advice - be specific
- If chunks contain conflicting information, note both perspectives
- Aim for a summary a producer could skim in 60 seconds

Respond ONLY with valid JSON:
{
  "summary": "Dense, well-structured summary of the key knowledge...",
  "keyTechniques": ["specific technique 1", "specific technique 2"],
  "sourceChunkIds": ["chunk_id_1", "chunk_id_2"],
  "confidence": 0.85
}

Confidence should reflect:
- 0.9-1.0: Multiple sources agree, comprehensive coverage
- 0.7-0.9: Good coverage with some gaps
- 0.5-0.7: Limited or conflicting information
- <0.5: Very sparse or unclear information`;

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
          maxTokens: 1500,
          responseFormat: "json",
        });

        const parsed = JSON.parse(response.content);

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

