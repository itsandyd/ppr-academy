/**
 * Analytics Event Tracking - Helper functions to track events
 * Call these functions after key user actions
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Track a signup event
 */
export const trackSignup = internalMutation({
  args: {
    userId: v.string(), // Clerk user ID
  },
  handler: async (ctx, { userId }) => {
    // Check if already tracked
    const existing = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventType", "signup")
      )
      .first();

    if (existing) return { tracked: false, reason: "already_exists" };

    await ctx.db.insert("analyticsEvents", {
      userId,
      eventType: "signup",
      timestamp: Date.now(),
      metadata: {},
    });

    return { tracked: true };
  },
});

/**
 * Track creator started (store created)
 */
export const trackCreatorStarted = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
  },
  handler: async (ctx, { userId, storeId }) => {
    const existing = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventType", "creator_started")
      )
      .first();

    if (existing) return { tracked: false, reason: "already_exists" };

    await ctx.db.insert("analyticsEvents", {
      userId,
      storeId,
      eventType: "creator_started",
      timestamp: Date.now(),
      metadata: {},
    });

    return { tracked: true };
  },
});

/**
 * Track creator published first product/course
 */
export const trackCreatorPublished = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("course"), v.literal("digitalProduct")),
  },
  handler: async (ctx, { userId, storeId, resourceId, resourceType }) => {
    // Only track first publish per store
    const existing = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_store_event", (q) =>
        q.eq("storeId", storeId).eq("eventType", "creator_published")
      )
      .first();

    if (existing) return { tracked: false, reason: "already_published" };

    await ctx.db.insert("analyticsEvents", {
      userId,
      storeId,
      eventType: "creator_published",
      resourceId,
      resourceType,
      timestamp: Date.now(),
      metadata: {},
    });

    return { tracked: true };
  },
});

/**
 * Track a purchase event
 */
export const trackPurchase = internalMutation({
  args: {
    userId: v.string(), // Buyer's user ID
    storeId: v.optional(v.string()),
    resourceId: v.string(),
    resourceType: v.union(v.literal("course"), v.literal("digitalProduct")),
    amount: v.number(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, { userId, storeId, resourceId, resourceType, amount, currency }) => {
    await ctx.db.insert("analyticsEvents", {
      userId,
      storeId,
      eventType: "purchase",
      resourceId,
      resourceType,
      timestamp: Date.now(),
      metadata: {
        value: amount,
        currency: currency || "USD",
      },
    });

    // Also track first_sale for the store if this is their first
    if (storeId) {
      const existingFirstSale = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_store_event", (q) =>
          q.eq("storeId", storeId).eq("eventType", "first_sale")
        )
        .first();

      if (!existingFirstSale) {
        // Get store owner
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("_id"), storeId))
          .first();

        if (store) {
          await ctx.db.insert("analyticsEvents", {
            userId: store.userId,
            storeId,
            eventType: "first_sale",
            resourceId,
            resourceType,
            timestamp: Date.now(),
            metadata: {
              value: amount,
              currency: currency || "USD",
            },
          });
        }
      }
    }

    return { tracked: true };
  },
});

/**
 * Track an enrollment event
 */
export const trackEnrollment = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.string(),
    storeId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, courseId, storeId }) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventType", "enrollment")
      )
      .filter((q) => q.eq(q.field("resourceId"), courseId))
      .first();

    if (existing) return { tracked: false, reason: "already_enrolled" };

    await ctx.db.insert("analyticsEvents", {
      userId,
      storeId,
      eventType: "enrollment",
      resourceId: courseId,
      resourceType: "course",
      timestamp: Date.now(),
      metadata: {},
    });

    return { tracked: true };
  },
});

/**
 * Track page view (for custom tracking beyond Vercel)
 */
export const trackPageView = internalMutation({
  args: {
    userId: v.optional(v.string()),
    storeId: v.optional(v.string()),
    page: v.string(),
    referrer: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { userId, storeId, page, referrer, source }) => {
    await ctx.db.insert("analyticsEvents", {
      userId: userId || "anonymous",
      storeId,
      eventType: "page_view",
      timestamp: Date.now(),
      metadata: {
        page,
        referrer,
        source,
      },
    });

    return { tracked: true };
  },
});
