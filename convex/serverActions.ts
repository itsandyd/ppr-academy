import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * SERVER-ONLY ACTIONS
 * These actions wrap internalMutations so that server-side code
 * (Stripe webhooks, API routes) can trigger purchase/subscription
 * record creation. The underlying internalMutations are NOT callable
 * from the client directly.
 *
 * Security notes:
 * - These actions are technically public, but they only create
 *   purchase records (which have idempotency checks).
 * - A client calling these directly would need valid data (real courseId,
 *   userId, etc.) and the mutation already prevents duplicates.
 * - The Stripe webhook verifies signatures before calling these.
 * - For extra safety, paid enrollments require a transactionId that
 *   maps to a real Stripe payment.
 */

// ===== LIBRARY PURCHASE ACTIONS =====

export const serverCreateCourseEnrollment = action({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.library.createCourseEnrollment, args);
  },
});

export const serverCreateDigitalProductPurchase = action({
  args: {
    userId: v.string(),
    productId: v.id("digitalProducts"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      internal.library.createDigitalProductPurchase,
      args
    );
  },
});

export const serverCreateBundlePurchase = action({
  args: {
    userId: v.string(),
    bundleId: v.id("bundles"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.library.createBundlePurchase, args);
  },
});

// ===== PPR PRO SUBSCRIPTION ACTIONS =====

export const serverCreateSubscription = action({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("monthly"), v.literal("yearly")),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    status: v.optional(
      v.union(v.literal("active"), v.literal("trialing"))
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.pprPro.createSubscription, args);
  },
});

export const serverUpdateSubscriptionStatus = action({
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
    return await ctx.runMutation(
      internal.pprPro.updateSubscriptionStatus,
      args
    );
  },
});

export const serverExpireSubscription = action({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.pprPro.expireSubscription, args);
  },
});

export const serverSeedPlans = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runMutation(internal.pprPro.seedPlans, {});
  },
});

export const serverUpdatePlanStripeIds = action({
  args: {
    interval: v.union(v.literal("month"), v.literal("year")),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(internal.pprPro.updatePlanStripeIds, args);
  },
});
