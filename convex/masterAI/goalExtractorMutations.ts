import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Validator for the conversation goal structure
 */
export const conversationGoalValidator = v.object({
  originalIntent: v.string(),
  deliverableType: v.optional(v.string()),
  keyConstraints: v.optional(v.array(v.string())),
  extractedAt: v.number(),
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
export const getConversationGoal = internalQuery({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.union(conversationGoalValidator, v.null()),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation?.conversationGoal || null;
  },
});

