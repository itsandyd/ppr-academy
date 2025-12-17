"use node";

import { internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { callLLM, safeParseJson } from "./llmClient";

// ============================================================================
// CONVERSATION GOAL EXTRACTOR
// ============================================================================
// This module prevents context drift in long conversations by extracting
// and persisting the original intent from the first message.
// The goal is injected into EVERY subsequent AI call, ensuring the AI
// never "forgets" what the conversation is about.
// ============================================================================

/**
 * Validator for the conversation goal structure
 */
export const conversationGoalValidator = v.object({
  originalIntent: v.string(),
  deliverableType: v.optional(v.string()),
  keyConstraints: v.optional(v.array(v.string())),
  extractedAt: v.number(),
});

export type ConversationGoal = {
  originalIntent: string;
  deliverableType?: string;
  keyConstraints?: string[];
  extractedAt: number;
};

/**
 * Extract the core goal from the first message of a conversation.
 * This should be called once when a conversation starts.
 */
export const extractGoalFromMessage = internalAction({
  args: {
    message: v.string(),
    conversationId: v.optional(v.id("aiConversations")),
  },
  returns: conversationGoalValidator,
  handler: async (ctx, args): Promise<ConversationGoal> => {
    console.log("🎯 Extracting conversation goal from first message...");

    const systemPrompt = `You are a goal extraction system. Your job is to identify the CORE INTENT of what a user wants to accomplish from their initial message.

This extracted goal will be used to keep an AI assistant on track throughout a long conversation. Even after many back-and-forth exchanges about details, corrections, and refinements, the AI needs to remember the original purpose.

Analyze the user's message and extract:

1. **originalIntent**: A clear, concise statement of what they're trying to accomplish. This should be specific enough to anchor future responses.
   - Good: "Create a course about Tourist's production style in Ableton Live 12"
   - Bad: "Help with a course" (too vague)

2. **deliverableType**: What TYPE of thing are they creating/doing?
   - Examples: "course", "outline", "lesson", "tutorial", "analysis", "troubleshooting", "explanation"
   - Use null if they're just asking a question without a deliverable

3. **keyConstraints**: The specific requirements, topics, or constraints that MUST be maintained throughout the conversation
   - Examples: ["Tourist style", "Ableton Live 12", "UK garage", "emotional pads"]
   - These are the details the AI should NEVER forget or drift away from

RESPOND ONLY WITH VALID JSON:
{
  "originalIntent": "Clear statement of what user wants to accomplish",
  "deliverableType": "course|outline|lesson|tutorial|analysis|explanation|null",
  "keyConstraints": ["constraint1", "constraint2", "constraint3"]
}`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract the goal from this message:\n\n"${args.message}"` },
        ],
        temperature: 0.2,
        maxTokens: 500,
        responseFormat: "json",
      });

      const parsed = safeParseJson(response.content) as any;

      const goal: ConversationGoal = {
        originalIntent: parsed.originalIntent || args.message.substring(0, 200),
        deliverableType: parsed.deliverableType || undefined,
        keyConstraints: Array.isArray(parsed.keyConstraints) ? parsed.keyConstraints : undefined,
        extractedAt: Date.now(),
      };

      console.log(`   ✅ Goal extracted: "${goal.originalIntent}"`);
      console.log(`   📦 Deliverable: ${goal.deliverableType || "none"}`);
      console.log(`   🔒 Constraints: ${goal.keyConstraints?.join(", ") || "none"}`);

      // If we have a conversationId, save the goal
      if (args.conversationId) {
        await ctx.runMutation(internal.masterAI.goalExtractor.saveConversationGoal, {
          conversationId: args.conversationId,
          goal,
        });
      }

      return goal;
    } catch (error) {
      console.error("Goal extraction failed:", error);
      // Fallback: use the message itself as the goal
      return {
        originalIntent: args.message.substring(0, 200),
        extractedAt: Date.now(),
      };
    }
  },
});

/**
 * Save the extracted goal to a conversation
 */
export const saveConversationGoal = internalMutation({
  args: {
    conversationId: v.id("aiConversations"),
    goal: conversationGoalValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      conversationGoal: args.goal,
    });
    console.log(`💾 Saved conversation goal to ${args.conversationId}`);
    return null;
  },
});

/**
 * Get the goal for a conversation (for use in queries)
 */
export const getConversationGoal = internalMutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.union(conversationGoalValidator, v.null()),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation?.conversationGoal || null;
  },
});

/**
 * Format the conversation goal for injection into system prompts.
 * This should be called by the planner, summarizer, and finalWriter.
 */
export function formatGoalForPrompt(goal: ConversationGoal | null | undefined): string {
  if (!goal) return "";

  let prompt = `\n=== CONVERSATION GOAL (NEVER DRIFT FROM THIS) ===\n`;
  prompt += `ORIGINAL INTENT: ${goal.originalIntent}\n`;

  if (goal.deliverableType) {
    prompt += `DELIVERABLE TYPE: ${goal.deliverableType}\n`;
  }

  if (goal.keyConstraints && goal.keyConstraints.length > 0) {
    prompt += `KEY CONSTRAINTS (must maintain):\n`;
    for (const constraint of goal.keyConstraints) {
      prompt += `  • ${constraint}\n`;
    }
  }

  prompt += `\nIMPORTANT: Every response must serve this original goal. When providing details, corrections, or refinements, always connect them back to this core intent. Do NOT drift into tangential topics or forget the specific context (${goal.keyConstraints?.join(", ") || "as stated above"}).\n`;
  prompt += `=================================================\n`;

  return prompt;
}

/**
 * Check if a response is drifting from the conversation goal
 * This can be used by the critic to flag potential drift
 */
export const checkForGoalDrift = internalAction({
  args: {
    goal: conversationGoalValidator,
    response: v.string(),
    currentQuestion: v.string(),
  },
  returns: v.object({
    isDrifting: v.boolean(),
    driftScore: v.number(), // 0-1, where 1 is completely off-topic
    explanation: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    isDrifting: boolean;
    driftScore: number;
    explanation?: string;
  }> => {
    const systemPrompt = `You are a conversation drift detector. Given:
1. The ORIGINAL GOAL of a conversation
2. The CURRENT QUESTION being asked
3. A RESPONSE that was generated

Determine if the response is staying on track with the original goal, or if it has drifted into tangential territory.

Consider:
- Is the response still serving the original intent?
- Does it maintain the key constraints (topics, tools, style)?
- Is it adding value toward the deliverable, or going off on a tangent?

RESPOND ONLY WITH VALID JSON:
{
  "isDrifting": true/false,
  "driftScore": 0.0-1.0 (0 = perfectly on track, 1 = completely off topic),
  "explanation": "Brief explanation if drifting"
}`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `ORIGINAL GOAL: ${args.goal.originalIntent}
KEY CONSTRAINTS: ${args.goal.keyConstraints?.join(", ") || "none specified"}
DELIVERABLE: ${args.goal.deliverableType || "none specified"}

CURRENT QUESTION: ${args.currentQuestion}

RESPONSE TO CHECK:
${args.response.substring(0, 2000)}`,
          },
        ],
        temperature: 0.1,
        maxTokens: 200,
        responseFormat: "json",
      });

      const parsed = safeParseJson(response.content) as any;

      return {
        isDrifting: parsed.isDrifting === true,
        driftScore: typeof parsed.driftScore === "number" ? parsed.driftScore : 0,
        explanation: parsed.explanation,
      };
    } catch (error) {
      console.error("Drift check failed:", error);
      return {
        isDrifting: false,
        driftScore: 0,
      };
    }
  },
});

