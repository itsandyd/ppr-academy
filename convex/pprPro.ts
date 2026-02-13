import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

/**
 * PPR PRO CONSUMER MEMBERSHIP
 * Platform-level subscription for learners to access ALL courses.
 * Separate from creator plans and per-store memberships.
 */

// ===== QUERIES =====

/**
 * Check if a user has an active PPR Pro subscription
 */
export const isPprProMember = query({
  args: {
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing")
        )
      )
      .first();
    return !!subscription;
  },
});

/**
 * Get the user's PPR Pro subscription details
 */
export const getSubscription = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
  },
});

/**
 * Get subscription by Stripe subscription ID
 */
export const getByStripeSubscriptionId = query({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
  },
});

// ===== INTERNAL QUERIES =====

/**
 * Internal: Check if user is PPR Pro member (for use in other Convex functions)
 */
export const isPprProMemberInternal = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing")
        )
      )
      .first();
    return !!subscription;
  },
});

// ===== MUTATIONS =====

/**
 * Create a new PPR Pro subscription (called from webhook)
 */
export const createSubscription = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("monthly"), v.literal("yearly")),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("trialing")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Check for existing active subscription
    const existing = await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing")
        )
      )
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        status: args.status || "active",
        cancelAtPeriodEnd: false,
      });
      return existing._id;
    }

    return await ctx.db.insert("pprProSubscriptions", {
      userId: args.userId,
      plan: args.plan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      status: args.status || "active",
      cancelAtPeriodEnd: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update subscription status (called from webhook on subscription.updated)
 */
export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("expired"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    plan: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error("PPR Pro subscription not found:", args.stripeSubscriptionId);
      return;
    }

    const updates: Record<string, any> = {
      status: args.status,
    };

    if (args.currentPeriodStart !== undefined) {
      updates.currentPeriodStart = args.currentPeriodStart;
    }
    if (args.currentPeriodEnd !== undefined) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }
    if (args.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    }
    if (args.plan !== undefined) {
      updates.plan = args.plan;
    }

    await ctx.db.patch(subscription._id, updates);
  },
});

/**
 * Mark subscription as expired (called from webhook on subscription.deleted)
 */
export const expireSubscription = mutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pprProSubscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error("PPR Pro subscription not found for expiry:", args.stripeSubscriptionId);
      return;
    }

    await ctx.db.patch(subscription._id, {
      status: "expired",
      cancelAtPeriodEnd: false,
    });
  },
});
