"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  chatSettingsValidator,
  summarizerOutputValidator,
  ideaGeneratorOutputValidator,
  criticOutputValidator,
  MODEL_PRESETS,
  type ChatSettings,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
  type CriticOutput,
  type ModelId,
} from "./types";
import { callLLM, safeParseJson } from "./llmClient";

// ============================================================================
// CRITIC STAGE
// ============================================================================

/**
 * Critic Stage
 * 
 * Reviews the assembled context before final generation.
 * Checks for contradictions, validates quality, and curates ideas.
 */
export const reviewContent = internalAction({
  args: {
    summarizerOutput: summarizerOutputValidator,
    ideaGeneratorOutput: v.optional(ideaGeneratorOutputValidator),
    settings: chatSettingsValidator,
    originalQuestion: v.string(),
  },
  returns: criticOutputValidator,
  handler: async (ctx, args): Promise<CriticOutput> => {
    const { summarizerOutput, ideaGeneratorOutput, settings, originalQuestion } = args;
    
    // Skip if critic is disabled
    if (!settings.enableCritic) {
      // Return a pass-through approval
      return {
        approved: true,
        overallQuality: 0.8,
        issues: [],
        recommendations: [],
        ideasToInclude: ideaGeneratorOutput?.ideas.map(i => i.technique) || [],
        ideasToExclude: [],
      };
    }

    // Get the model for this stage
    const modelId = getModelForStage("critic", settings);

    // Build context from summaries
    const summariesContext = summarizerOutput.summaries
      .map(s => `## ${s.facetName} (confidence: ${s.confidence})\n${s.summary}`)
      .join("\n\n");

    // Build ideas context if available
    let ideasContext = "";
    if (ideaGeneratorOutput && ideaGeneratorOutput.ideas.length > 0) {
      ideasContext = "\n\n## Generated Ideas\n" + ideaGeneratorOutput.ideas
        .map(i => `- **${i.technique}** [${i.confidence}]: ${i.description}${i.risk ? ` (Risk: ${i.risk})` : ""}`)
        .join("\n");
    }

    const systemPrompt = `You are a quality assurance expert for a music production education platform. Your job is to review content before it's presented to users and catch issues that make content feel "AI-generated" rather than professionally written.

Review the following content for:

1. **Contradictions**: Do any summaries contradict each other?

2. **Gaps**: Is there missing information needed to fully answer the question?

3. **Inaccuracies**: Are there any statements that seem technically incorrect?
   ESPECIALLY watch for:
   - Oversimplified technical explanations that might invite pedantic correction
   - Device/gear classifications stated as absolutes when behavior is more nuanced
   - Technical claims without specific ranges or values (e.g., "fast attack" without ms values)
   - Statements presented as universal rules that actually have exceptions

4. **Style Issues - AI Content Red Flags**:
   - ABSOLUTE LANGUAGE: "always", "never", "night and day", "completely transforms", "universal rule", "you'll never confuse again"
   - SALESY HYPERBOLE: "game-changer", "secret weapon", "takes your mix to the next level"
   - METAPHOR STACKING: Multiple metaphors in quick succession (persuasion/coercion/scissors in one paragraph)
   - REPETITION: Same concept explained 2-3 times with different words
   - VAGUE TECHNICAL CLAIMS: "experiment with settings" instead of specific ranges
   - MISSING LEVEL MATCHING: A/B exercises without precise loudness matching instructions

5. **Missing Practical Elements** (flag as gaps if missing):
   - Decision rules (if X → do Y)
   - "What to listen for" checklists
   - Real-world mix examples (not just test tones)
   - Specific plugin/device names and settings

For ideas specifically, evaluate:
- Are they grounded in the summarized knowledge?
- Are the confidence levels appropriate?
- Which ideas should definitely be included vs. excluded?

IMPORTANT:
- Be constructive, not just critical
- Focus on issues that would confuse or mislead the user
- AI slop detection is IMPORTANT - flag absolute language and repetition
- Approve if content is "good enough" even if not perfect
- Suggest SPECIFIC replacements for absolute language (e.g., "always" → "typically")

Respond ONLY with valid JSON:
{
  "approved": true,
  "overallQuality": 0.85,
  "issues": [
    {
      "type": "contradiction|gap|inaccuracy|style",
      "description": "What the issue is",
      "severity": "low|medium|high",
      "suggestion": "How to address it"
    }
  ],
  "recommendations": [
    "General recommendation for the final response"
  ],
  "ideasToInclude": ["technique name to include"],
  "ideasToExclude": ["technique name to exclude"]
}`;

    const userPrompt = `Original Question: "${originalQuestion}"

Content to Review:

${summariesContext}
${ideasContext}

Evaluate this content for quality and provide your review.`;

    try {
      const response = await callLLM({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 5000, // Increased further - critics write verbose feedback
        responseFormat: "json",
      });

      let parsed: any;
      try {
        parsed = safeParseJson(response.content) as any;
      } catch (parseError) {
        console.warn("Critic JSON parsing failed, using default approval:", parseError);
        // Default to approved with medium quality when parsing fails
        return {
          approved: true,
          overallQuality: 0.7,
          issues: [],
          recommendations: [],
          ideasToInclude: [],
          ideasToExclude: [],
        };
      }

      const issues = (parsed.issues || []).map((issue: any) => ({
        type: validateIssueType(issue.type),
        description: issue.description || "",
        severity: validateSeverity(issue.severity),
        suggestion: issue.suggestion || undefined,
      }));

      return {
        approved: parsed.approved !== false, // Default to approved
        overallQuality: typeof parsed.overallQuality === "number" 
          ? Math.min(1, Math.max(0, parsed.overallQuality)) 
          : 0.7,
        issues,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        ideasToInclude: Array.isArray(parsed.ideasToInclude) ? parsed.ideasToInclude : [],
        ideasToExclude: Array.isArray(parsed.ideasToExclude) ? parsed.ideasToExclude : [],
      };
    } catch (error) {
      console.error("Error in critic review:", error);
      
      // Return approval on error to not block the pipeline
      return {
        approved: true,
        overallQuality: 0.7,
        issues: [],
        recommendations: [],
        ideasToInclude: ideaGeneratorOutput?.ideas.map(i => i.technique) || [],
        ideasToExclude: [],
      };
    }
  },
});

// Validate issue type
function validateIssueType(type: string): CriticOutput["issues"][0]["type"] {
  const valid = ["contradiction", "gap", "inaccuracy", "style"];
  if (valid.includes(type)) {
    return type as CriticOutput["issues"][0]["type"];
  }
  return "style";
}

// Validate severity
function validateSeverity(sev: string): "low" | "medium" | "high" {
  const valid = ["low", "medium", "high"];
  if (valid.includes(sev)) {
    return sev as "low" | "medium" | "high";
  }
  return "low";
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

