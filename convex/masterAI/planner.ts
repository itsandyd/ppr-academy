"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { 
  chatSettingsValidator, 
  plannerOutputValidator,
  MODEL_PRESETS,
  AVAILABLE_MODELS,
  type ChatSettings,
  type PlannerOutput,
  type ModelId,
} from "./types";
import { callLLM } from "./llmClient";

/**
 * Planner Stage
 * 
 * Analyzes the user's question and decomposes it into facets for targeted retrieval.
 * This is the first stage in the Master AI pipeline.
 */
export const analyzeQuestion = internalAction({
  args: {
    question: v.string(),
    settings: chatSettingsValidator,
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  returns: plannerOutputValidator,
  handler: async (ctx, args): Promise<PlannerOutput> => {
    const { question, settings, conversationContext } = args;
    
    // Get the model for this stage
    const modelId = getModelForStage("planner", settings);
    
    const systemPrompt = `You are an expert question analyzer for a music production education platform. Your job is to decompose complex questions into searchable facets.

Given a user's question about music production, sound design, mixing, or related topics:

1. **Identify the Intent**: What is the user ultimately trying to achieve?

2. **Classify the Question Type**:
   - "technical": Specific how-to about tools, parameters, techniques
   - "conceptual": Understanding theory, principles, or "why" questions
   - "workflow": Step-by-step processes or project organization
   - "creative": Artistic choices, style emulation, sound design exploration
   - "troubleshooting": Fixing problems, debugging issues
   - "comparison": Comparing tools, techniques, or approaches

3. **Decompose into Facets** (max ${settings.maxFacets} facets):
   Each facet should represent a distinct knowledge area needed to fully answer the question.
   For each facet, provide:
   - name: Short identifier (e.g., "sound_design", "mixing", "arrangement")
   - description: What this facet covers
   - queryHint: Search-optimized text to find relevant content
   - tags: Relevant categories/topics for filtering
   - priority: 1-5 (5 = most important for answering)

4. **Generate Search Strategies**:
   For each facet, create a targeted search query that combines the original question context with the facet focus.

IMPORTANT: 
- Keep facets focused and non-overlapping
- Prioritize facets that directly address the core question
- Include practical/technique facets alongside conceptual ones
- Consider the user's likely skill level based on question complexity

Respond ONLY with valid JSON matching this structure:
{
  "intent": "string describing what user wants to achieve",
  "questionType": "technical|conceptual|workflow|creative|troubleshooting|comparison",
  "facets": [
    {
      "name": "facet_name",
      "description": "what this facet covers",
      "queryHint": "search-optimized text",
      "tags": ["tag1", "tag2"],
      "priority": 5
    }
  ],
  "searchStrategies": [
    {
      "facetName": "facet_name",
      "query": "full search query for this facet",
      "filters": {
        "sourceTypes": ["course", "chapter"],
        "categories": ["optional category filter"]
      }
    }
  ]
}`;

    // Build messages with conversation context if available
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add conversation context for follow-up questions
    if (conversationContext && conversationContext.length > 0) {
      // Add last few exchanges for context (limit to avoid token bloat)
      const recentContext = conversationContext.slice(-4);
      for (const msg of recentContext) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
      messages.push({
        role: "user",
        content: `Based on our conversation, analyze this follow-up question:\n\n"${question}"`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this question:\n\n"${question}"`,
      });
    }

    try {
      const response = await callLLM({
        model: modelId,
        messages,
        temperature: 0.3, // Lower temperature for structured output
        maxTokens: 1500,
        responseFormat: "json",
      });

      // Parse the JSON response
      const parsed = JSON.parse(response.content);
      
      // Validate and ensure we have required fields
      const output: PlannerOutput = {
        intent: parsed.intent || "General question",
        questionType: validateQuestionType(parsed.questionType),
        facets: (parsed.facets || []).slice(0, settings.maxFacets).map((f: any) => ({
          name: f.name || "general",
          description: f.description || "",
          queryHint: f.queryHint || question,
          tags: Array.isArray(f.tags) ? f.tags : [],
          priority: typeof f.priority === "number" ? Math.min(5, Math.max(1, f.priority)) : 3,
        })),
        searchStrategies: (parsed.searchStrategies || []).map((s: any) => ({
          facetName: s.facetName || "general",
          query: s.query || question,
          filters: {
            sourceTypes: Array.isArray(s.filters?.sourceTypes) ? s.filters.sourceTypes : undefined,
            categories: Array.isArray(s.filters?.categories) ? s.filters.categories : undefined,
          },
        })),
      };

      // Ensure we have at least one facet
      if (output.facets.length === 0) {
        output.facets = [{
          name: "general",
          description: "General knowledge about the topic",
          queryHint: question,
          tags: [],
          priority: 5,
        }];
        output.searchStrategies = [{
          facetName: "general",
          query: question,
          filters: {},
        }];
      }

      return output;
    } catch (error) {
      console.error("Planner error:", error);
      
      // Return a fallback single-facet plan
      return {
        intent: "Answer user question",
        questionType: "technical",
        facets: [{
          name: "general",
          description: "General knowledge about the topic",
          queryHint: question,
          tags: [],
          priority: 5,
        }],
        searchStrategies: [{
          facetName: "general",
          query: question,
          filters: {},
        }],
      };
    }
  },
});

// Helper to get the model ID for a pipeline stage
function getModelForStage(
  stage: "planner" | "summarizer" | "ideaGenerator" | "critic" | "finalWriter",
  settings: ChatSettings
): ModelId {
  // Check for custom model override
  if (settings.customModels?.[stage]) {
    return settings.customModels[stage]!;
  }
  // Use preset
  const preset = MODEL_PRESETS[settings.preset];
  return preset[stage];
}

// Validate question type
function validateQuestionType(type: string): PlannerOutput["questionType"] {
  const validTypes = ["technical", "conceptual", "workflow", "creative", "troubleshooting", "comparison"];
  if (validTypes.includes(type)) {
    return type as PlannerOutput["questionType"];
  }
  return "technical";
}

