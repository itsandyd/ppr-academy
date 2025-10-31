/**
 * Creator Plans Management System
 * 
 * This module handles the freemium creator plan system with three tiers:
 * - FREE: Basic link-in-bio (5 links max)
 * - CREATOR: Link-in-bio + courses + coaching + digital products
 * - CREATOR PRO: Everything + email campaigns + automations + advanced analytics
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Plan feature limits configuration
export const PLAN_LIMITS = {
  free: {
    maxLinks: 5,
    maxCourses: 3, // Allow 3 courses to try the platform
    maxProducts: 3, // Allow 3 products to try the platform
    maxCoachingSessions: 10, // Allow limited coaching sessions
    canUseEmailCampaigns: true, // Allow basic email campaigns
    canUseAutomations: false,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: false,
    canUseSocialScheduling: false,
    canUseFollowGates: false,
    maxEmailSends: 100, // 100 emails per month
    showPlatformBranding: true,
  },
  creator: {
    maxLinks: 20,
    maxCourses: -1, // unlimited
    maxProducts: -1, // unlimited
    maxCoachingSessions: -1, // unlimited
    canUseEmailCampaigns: true,
    canUseAutomations: false,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    maxEmailSends: 1000, // 1,000 emails per month
    showPlatformBranding: false,
  },
  creator_pro: {
    maxLinks: -1, // unlimited
    maxCourses: -1,
    maxProducts: -1,
    maxCoachingSessions: -1,
    canUseEmailCampaigns: true,
    canUseAutomations: true,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    maxEmailSends: -1, // unlimited
    showPlatformBranding: false,
  },
} as const;

export const PLAN_PRICING = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started",
    features: [
      "Custom link-in-bio page",
      "Up to 5 links",
      "Up to 3 courses",
      "Up to 3 digital products",
      "Up to 10 coaching sessions",
      "Basic email campaigns (100/month)",
      "Basic analytics",
      "Public creator profile",
    ],
  },
  creator: {
    name: "Creator",
    monthlyPrice: 2900, // $29/month
    yearlyPrice: 29000, // $290/year (save ~17%)
    description: "For creators ready to monetize",
    features: [
      "Everything in Free",
      "Up to 20 links",
      "Unlimited courses",
      "Unlimited digital products",
      "Unlimited coaching sessions",
      "Email campaigns (1,000/month)",
      "Social media scheduling",
      "Follow gates",
      "Advanced analytics",
      "No platform branding",
    ],
  },
  creator_pro: {
    name: "Creator Pro",
    monthlyPrice: 9900, // $99/month
    yearlyPrice: 95000, // $950/year (save ~20%)
    description: "Full power for professionals",
    features: [
      "Everything in Creator",
      "Unlimited links",
      "Unlimited email sends",
      "Email automation workflows",
      "Custom domain",
      "Priority support",
      "Advanced integrations",
    ],
  },
} as const;

/**
 * Get the current plan for a store
 */
export const getStorePlan = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.union(
    v.object({
      plan: v.union(v.literal("free"), v.literal("creator"), v.literal("creator_pro")),
      limits: v.any(),
      pricing: v.any(),
      isActive: v.boolean(),
      subscriptionStatus: v.optional(v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("incomplete")
      )),
      trialEndsAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;

    const plan = store.plan || "free";
    const limits = PLAN_LIMITS[plan];
    const pricing = PLAN_PRICING[plan];

    return {
      plan,
      limits,
      pricing,
      isActive: store.subscriptionStatus === "active" || store.subscriptionStatus === "trialing" || plan === "free",
      subscriptionStatus: store.subscriptionStatus,
      trialEndsAt: store.trialEndsAt,
    };
  },
});

/**
 * Check if a store has access to a specific feature
 */
export const checkFeatureAccess = query({
  args: {
    storeId: v.id("stores"),
    feature: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    currentUsage: v.optional(v.number()),
    limit: v.optional(v.number()),
    requiresPlan: v.optional(v.union(v.literal("creator"), v.literal("creator_pro"))),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { hasAccess: false };
    }

    const plan = store.plan || "free";
    const limits = PLAN_LIMITS[plan];

    // Check specific features
    switch (args.feature) {
      case "links": {
        const linkCount = await ctx.db
          .query("linkInBioLinks")
          .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
          .collect()
          .then((links) => links.length);

        const requiresUpgrade = plan === "free" && linkCount >= limits.maxLinks;
        
        return {
          hasAccess: limits.maxLinks === -1 || linkCount < limits.maxLinks,
          currentUsage: linkCount,
          limit: limits.maxLinks,
          requiresPlan: (requiresUpgrade ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };
      }

      case "courses": {
        const courseCount = await ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((courses) => courses.length);

        const requiresUpgrade = limits.maxCourses > 0 && courseCount >= limits.maxCourses;

        return {
          hasAccess: limits.maxCourses === -1 || courseCount < limits.maxCourses,
          currentUsage: courseCount,
          limit: limits.maxCourses,
          requiresPlan: (requiresUpgrade ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };
      }

      case "products": {
        const productCount = await ctx.db
          .query("digitalProducts")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((products) => products.length);

        const requiresUpgrade = limits.maxProducts > 0 && productCount >= limits.maxProducts;

        return {
          hasAccess: limits.maxProducts === -1 || productCount < limits.maxProducts,
          currentUsage: productCount,
          limit: limits.maxProducts,
          requiresPlan: (requiresUpgrade ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };
      }

      case "email_campaigns":
        return {
          hasAccess: limits.canUseEmailCampaigns,
          requiresPlan: (!limits.canUseEmailCampaigns ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };

      case "automations":
        return {
          hasAccess: limits.canUseAutomations,
          requiresPlan: (!limits.canUseAutomations ? "creator_pro" : undefined) as "creator" | "creator_pro" | undefined,
        };

      case "custom_domain":
        return {
          hasAccess: limits.canUseCustomDomain,
          requiresPlan: (!limits.canUseCustomDomain ? "creator_pro" : undefined) as "creator" | "creator_pro" | undefined,
        };

      case "social_scheduling":
        return {
          hasAccess: limits.canUseSocialScheduling,
          requiresPlan: (!limits.canUseSocialScheduling ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };

      case "follow_gates":
        return {
          hasAccess: limits.canUseFollowGates,
          requiresPlan: (!limits.canUseFollowGates ? "creator" : undefined) as "creator" | "creator_pro" | undefined,
        };

      default:
        return { hasAccess: true };
    }
  },
});

/**
 * Update store visibility settings
 */
export const updateStoreVisibility = mutation({
  args: {
    storeId: v.id("stores"),
    isPublic: v.boolean(),
    isPublishedProfile: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    const updateData: any = {
      isPublic: args.isPublic,
    };

    if (args.isPublishedProfile !== undefined) {
      updateData.isPublishedProfile = args.isPublishedProfile;
    }

    await ctx.db.patch(args.storeId, updateData);

    return {
      success: true,
      message: `Profile is now ${args.isPublic ? "public" : "private"}`,
    };
  },
});

/**
 * Initialize a new store with free plan
 */
export const initializeStorePlan = mutation({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    // Only initialize if no plan is set
    if (!store.plan) {
      await ctx.db.patch(args.storeId, {
        plan: "free",
        planStartedAt: Date.now(),
        isPublic: false, // Private by default
        isPublishedProfile: false,
        subscriptionStatus: "active",
      });
    }

    return { success: true };
  },
});

/**
 * Upgrade store to a paid plan (called from Stripe webhook)
 */
export const upgradePlan = mutation({
  args: {
    storeId: v.id("stores"),
    plan: v.union(v.literal("creator"), v.literal("creator_pro")),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete")
    ),
    trialEndsAt: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    await ctx.db.patch(args.storeId, {
      plan: args.plan,
      planStartedAt: Date.now(),
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      trialEndsAt: args.trialEndsAt,
    });

    return {
      success: true,
      message: `Successfully upgraded to ${PLAN_PRICING[args.plan].name}`,
    };
  },
});

/**
 * Downgrade or cancel plan (called from Stripe webhook)
 */
export const updateSubscriptionStatus = mutation({
  args: {
    storeId: v.id("stores"),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete")
    ),
    downgradeToPlan: v.optional(v.union(v.literal("free"), v.literal("creator"), v.literal("creator_pro"))),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const updateData: any = {
      subscriptionStatus: args.subscriptionStatus,
    };

    // If subscription is canceled, downgrade to free
    if (args.subscriptionStatus === "canceled" || args.downgradeToPlan) {
      updateData.plan = args.downgradeToPlan || "free";
    }

    await ctx.db.patch(args.storeId, updateData);

    return { success: true };
  },
});

/**
 * Get plan usage statistics for a store
 */
export const getPlanUsageStats = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    plan: v.union(v.literal("free"), v.literal("creator"), v.literal("creator_pro")),
    usage: v.object({
      links: v.object({ current: v.number(), limit: v.number() }),
      courses: v.object({ current: v.number(), limit: v.number() }),
      products: v.object({ current: v.number(), limit: v.number() }),
      emailsSentThisMonth: v.object({ current: v.number(), limit: v.number() }),
    }),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const plan = store.plan || "free";
    const limits = PLAN_LIMITS[plan];

    // Get current usage
    const [linkCount, courseCount, productCount] = await Promise.all([
      ctx.db
        .query("linkInBioLinks")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .collect()
        .then((links) => links.length),
      ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .collect()
        .then((courses) => courses.length),
      ctx.db
        .query("digitalProducts")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .collect()
        .then((products) => products.length),
    ]);

    const emailsSentThisMonth = store.emailConfig?.emailsSentThisMonth || 0;

    return {
      plan,
      usage: {
        links: {
          current: linkCount,
          limit: limits.maxLinks,
        },
        courses: {
          current: courseCount,
          limit: limits.maxCourses,
        },
        products: {
          current: productCount,
          limit: limits.maxProducts,
        },
        emailsSentThisMonth: {
          current: emailsSentThisMonth,
          limit: limits.maxEmailSends,
        },
      },
    };
  },
});

