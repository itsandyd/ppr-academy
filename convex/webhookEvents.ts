import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

/**
 * Query to check if a Stripe event has already been processed.
 * Used for webhook idempotency.
 */
export const getWebhookEvent = query({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();
  },
});

/**
 * Record a webhook event after processing (success or failure).
 */
export const recordWebhookEvent = mutation({
  args: {
    stripeEventId: v.string(),
    eventType: v.string(),
    productType: v.optional(v.string()),
    status: v.union(v.literal("processed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if there's an existing record (e.g., a previously failed event being retried)
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();

    if (existing) {
      // Update the existing record (e.g., failed -> processed on retry)
      await ctx.db.patch(existing._id, {
        status: args.status,
        processedAt: Date.now(),
        error: args.error,
      });
      return existing._id;
    }

    return await ctx.db.insert("webhookEvents", {
      stripeEventId: args.stripeEventId,
      eventType: args.eventType,
      productType: args.productType,
      status: args.status,
      processedAt: Date.now(),
      error: args.error,
    });
  },
});

/**
 * Cleanup old webhook events (older than 30 days).
 * Can be called by a cron job or manually.
 */
export const cleanupOldWebhookEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldEvents = await ctx.db
      .query("webhookEvents")
      .filter((q) => q.lt(q.field("processedAt"), thirtyDaysAgo))
      .take(1000);

    let deleted = 0;
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
      deleted++;
    }

    return { deleted };
  },
});
