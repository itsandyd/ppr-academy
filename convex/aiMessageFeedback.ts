import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// AI MESSAGE FEEDBACK - Upvotes/Downvotes
// ============================================================================

export const feedbackTagValidator = v.union(
  v.literal("accurate"),
  v.literal("helpful"),
  v.literal("creative"),
  v.literal("well_written"),
  v.literal("inaccurate"),
  v.literal("unhelpful"),
  v.literal("off_topic"),
  v.literal("too_long"),
  v.literal("too_short")
);

/**
 * Submit feedback (upvote/downvote) on an AI message
 */
export const submitFeedback = mutation({
  args: {
    messageId: v.id("aiMessages"),
    conversationId: v.id("aiConversations"),
    userId: v.string(),
    vote: v.union(v.literal("up"), v.literal("down")),
    reason: v.optional(v.string()),
    tags: v.optional(v.array(feedbackTagValidator)),
  },
  returns: v.id("aiMessageFeedback"),
  handler: async (ctx, args) => {
    // Check if user already submitted feedback for this message
    const existing = await ctx.db
      .query("aiMessageFeedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      // Update existing feedback
      await ctx.db.patch(existing._id, {
        vote: args.vote,
        reason: args.reason,
        tags: args.tags,
      });
      return existing._id;
    }

    // Create new feedback
    return await ctx.db.insert("aiMessageFeedback", {
      messageId: args.messageId,
      conversationId: args.conversationId,
      userId: args.userId,
      vote: args.vote,
      reason: args.reason,
      tags: args.tags,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get feedback for a specific message
 */
export const getFeedbackForMessage = query({
  args: {
    messageId: v.id("aiMessages"),
    userId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("aiMessageFeedback"),
      vote: v.union(v.literal("up"), v.literal("down")),
      reason: v.optional(v.string()),
      tags: v.optional(v.array(feedbackTagValidator)),
    })
  ),
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("aiMessageFeedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!feedback) return null;

    return {
      _id: feedback._id,
      vote: feedback.vote,
      reason: feedback.reason,
      tags: feedback.tags,
    };
  },
});

/**
 * Get aggregate feedback stats for analytics
 */
export const getFeedbackStats = query({
  args: {
    userId: v.optional(v.string()), // Filter by user if provided
  },
  returns: v.object({
    totalFeedback: v.number(),
    upvotes: v.number(),
    downvotes: v.number(),
    topTags: v.array(v.object({
      tag: v.string(),
      count: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    let feedbackQuery = ctx.db.query("aiMessageFeedback");
    
    if (args.userId) {
      feedbackQuery = feedbackQuery.withIndex("by_userId", (q) => q.eq("userId", args.userId));
    }
    
    const allFeedback = await feedbackQuery.collect();

    let upvotes = 0;
    let downvotes = 0;
    const tagCounts: Record<string, number> = {};

    for (const f of allFeedback) {
      if (f.vote === "up") upvotes++;
      else downvotes++;

      if (f.tags) {
        for (const tag of f.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFeedback: allFeedback.length,
      upvotes,
      downvotes,
      topTags,
    };
  },
});

/**
 * Remove feedback from a message
 */
export const removeFeedback = mutation({
  args: {
    messageId: v.id("aiMessages"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiMessageFeedback")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});

/**
 * Get feedback for all messages in a conversation (for displaying in chat)
 */
export const getFeedbackForConversation = query({
  args: {
    conversationId: v.id("aiConversations"),
    userId: v.string(),
  },
  returns: v.array(v.object({
    messageId: v.id("aiMessages"),
    vote: v.union(v.literal("up"), v.literal("down")),
  })),
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("aiMessageFeedback")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return feedback.map((f) => ({
      messageId: f.messageId,
      vote: f.vote,
    }));
  },
});

