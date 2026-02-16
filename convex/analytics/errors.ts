/**
 * Error Analytics - Queries for system errors and monitoring
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get recent error events from analytics
 */
export const getRecentErrors = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("analyticsEvents"),
      timestamp: v.number(),
      errorCode: v.string(),
      errorMessage: v.string(),
      userId: v.string(),
      storeId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Note: Using filter on full table scan due to TypeScript index limitations
    // In production, consider using by_event_type index: .withIndex("by_event_type", q => q.eq("eventType", "error"))
    const errors = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "error"))
      .order("desc")
      .take(limit);

    return errors.map((error) => ({
      _id: error._id,
      timestamp: error.timestamp,
      errorCode: error.metadata?.error_code || "UNKNOWN",
      errorMessage: error.metadata?.error_message || "No message",
      userId: error.userId,
      storeId: error.storeId,
    }));
  },
});

/**
 * Get error rate over time window
 */
export const getErrorRate = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.object({
    totalErrors: v.number(),
    totalEvents: v.number(),
    errorRate: v.number(),
  }),
  handler: async (ctx, args) => {
    // Note: Using filter due to TypeScript index limitations
    const errors = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.eq(q.field("eventType"), "error"),
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .take(5000);

    const allEvents = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .take(5000);

    const errorRate = allEvents.length > 0 
      ? (errors.length / allEvents.length) * 100 
      : 0;

    return {
      totalErrors: errors.length,
      totalEvents: allEvents.length,
      errorRate,
    };
  },
});

