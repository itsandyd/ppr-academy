"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  chatSettingsValidator,
  summarizerOutputValidator,
  ideaGeneratorOutputValidator,
  MODEL_PRESETS,
  type ChatSettings,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
  type Idea,
  type ModelId,
} from "./types";
import { callLLM } from "./llmClient";

// ============================================================================
// IDEA GENERATOR STAGE
// ============================================================================

/**
 * Idea Generator Stage
 * 
 * Takes the summarized knowledge and extrapolates new techniques,
 * creative variations, and cross-facet insights.
 */
export const generateIdeas = internalAction({
  args: {
    summarizerOutput: summarizerOutputValidator,
    settings: chatSettingsValidator,
    originalQuestion: v.string(),
  },
  returns: ideaGeneratorOutputValidator,
  handler: async (ctx, args): Promise<IdeaGeneratorOutput> => {
    const { summarizerOutput, settings, originalQuestion } = args;
    
    // Skip if creative mode is disabled
    if (!settings.enableCreativeMode) {
      return {
        ideas: [],
        crossFacetInsights: [],
      };
    }

    // Get the model for this stage
    const modelId = getModelForStage("ideaGenerator", settings);

    // Build context from all summaries
    const summariesContext = summarizerOutput.summaries
      .map(s => {
        const techniques = s.keyTechniques.length > 0 
          ? `\nKey Techniques: ${s.keyTechniques.join(", ")}` 
          : "";
        return `## ${s.facetName}\n${s.summary}${techniques}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are a creative music production mentor with deep knowledge of sound design, mixing, and production workflows. Your job is to extrapolate NEW ideas that extend beyond the provided knowledge base.

Given the user's question and the summarized knowledge from their course content:

1. **Propose New Techniques**: Suggest approaches that follow the same principles but aren't explicitly covered
2. **Cross-Pollinate**: Combine ideas across facets to create novel workflows
3. **Identify Experiments**: Suggest things worth trying that push boundaries
4. **Note Confidence**: Be honest about what's directly supported vs. extrapolated

For each idea, classify as:
- "supported": Directly follows from the provided content
- "extrapolated": Logical extension of the principles, plausible
- "experimental": Creative stretch, worth trying but less certain

IMPORTANT:
- Ground ideas in the established principles from the summaries
- Be specific and actionable, not vague
- Flag potential risks or "what could go wrong"
- Aim for 3-7 high-quality ideas, not quantity
- Look for interesting connections BETWEEN facets

Respond ONLY with valid JSON:
{
  "ideas": [
    {
      "technique": "Name of the technique",
      "description": "Detailed explanation of what to do and why",
      "confidence": "supported|extrapolated|experimental",
      "risk": "What could go wrong or things to watch out for",
      "relatedFacets": ["facet1", "facet2"]
    }
  ],
  "crossFacetInsights": [
    "Insight about how facets connect or interact"
  ]
}`;

    const userPrompt = `Original Question: "${originalQuestion}"

Summarized Knowledge Base:

${summariesContext}

Based on this knowledge, generate creative ideas and techniques that extend beyond what's explicitly covered. Think like a mentor who's helping the student go further.`;

    try {
      const response = await callLLM({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7, // Higher temperature for creativity
        maxTokens: 2000,
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);

      const ideas: Idea[] = (parsed.ideas || []).map((idea: any) => ({
        technique: idea.technique || "Unnamed technique",
        description: idea.description || "",
        confidence: validateConfidence(idea.confidence),
        risk: idea.risk || undefined,
        relatedFacets: Array.isArray(idea.relatedFacets) ? idea.relatedFacets : [],
      }));

      const crossFacetInsights = Array.isArray(parsed.crossFacetInsights) 
        ? parsed.crossFacetInsights 
        : [];

      return {
        ideas,
        crossFacetInsights,
      };
    } catch (error) {
      console.error("Error generating ideas:", error);
      return {
        ideas: [],
        crossFacetInsights: [],
      };
    }
  },
});

// Validate confidence level
function validateConfidence(conf: string): Idea["confidence"] {
  const valid = ["supported", "extrapolated", "experimental"];
  if (valid.includes(conf)) {
    return conf as Idea["confidence"];
  }
  return "extrapolated";
}

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

