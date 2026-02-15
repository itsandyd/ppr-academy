/**
 * Creator Plans Management System
 * 
 * This module handles the freemium creator plan system with four tiers:
 * - FREE: Basic link-in-bio (5 links max)
 * - CREATOR: Link-in-bio + courses + coaching + digital products
 * - CREATOR PRO: Everything + email campaigns + automations + advanced analytics (PAID)
 * - EARLY ACCESS: Grandfathered unlimited access for early adopters (FREE)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Plan feature limits configuration
// Updated January 2025 with progressive tiers for better revenue optimization
export const PLAN_LIMITS = {
  free: {
    maxLinks: 5,
    maxProducts: 1, // 1 total product (course or digital product) to try the platform
    maxCoachingSessions: 0,
    canUseEmailCampaigns: false,
    canUseAutomations: false,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: false,
    canUseSocialScheduling: false,
    canUseFollowGates: false,
    canChargeMoney: false, // Products must be free (price = $0)
    maxEmailSends: 0,
    showPlatformBranding: true,
    canUseTeams: false,
    maxTeamMembers: 0,
  },
  starter: {
    maxLinks: 15,
    maxProducts: 15, // 15 total products (courses + digital products)
    maxCoachingSessions: 20,
    canUseEmailCampaigns: true,
    canUseAutomations: false,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: false,
    canUseSocialScheduling: false,
    canUseFollowGates: false,
    canChargeMoney: true,
    maxEmailSends: 500,
    showPlatformBranding: true,
    canUseTeams: false,
    maxTeamMembers: 0,
  },
  creator: {
    maxLinks: 50,
    maxProducts: 50, // 50 total products
    maxCoachingSessions: -1, // unlimited
    canUseEmailCampaigns: true,
    canUseAutomations: false,
    canUseCustomDomain: false,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    canChargeMoney: true,
    maxEmailSends: 2500,
    showPlatformBranding: false,
    canUseTeams: false,
    maxTeamMembers: 0,
  },
  creator_pro: {
    maxLinks: -1, // unlimited
    maxProducts: -1, // unlimited
    maxCoachingSessions: -1,
    canUseEmailCampaigns: true,
    canUseAutomations: true,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    canChargeMoney: true,
    maxEmailSends: 10000,
    showPlatformBranding: false,
    canUseTeams: false,
    maxTeamMembers: 1,
  },
  business: {
    maxLinks: -1,
    maxProducts: -1, // unlimited
    maxCoachingSessions: -1,
    canUseEmailCampaigns: true,
    canUseAutomations: true,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    canChargeMoney: true,
    maxEmailSends: -1, // unlimited
    showPlatformBranding: false,
    canUseTeams: true,
    maxTeamMembers: 10,
  },
  early_access: {
    maxLinks: -1, // unlimited
    maxProducts: -1, // unlimited
    maxCoachingSessions: -1, // unlimited
    canUseEmailCampaigns: true,
    canUseAutomations: true,
    canUseCustomDomain: true,
    canUseAdvancedAnalytics: true,
    canUseSocialScheduling: true,
    canUseFollowGates: true,
    canChargeMoney: true,
    maxEmailSends: -1, // unlimited
    showPlatformBranding: false,
    canUseTeams: true,
    maxTeamMembers: -1, // unlimited
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
      "1 product (free only)",
      "Basic analytics",
      "Public creator profile",
    ],
  },
  starter: {
    name: "Starter",
    monthlyPrice: 1200, // $12/month
    yearlyPrice: 10800, // $108/year ($9/month - save 25%)
    description: "Start selling your products",
    features: [
      "Everything in Free",
      "Up to 15 links",
      "Up to 15 products",
      "Up to 20 coaching sessions",
      "Email campaigns (500/month)",
      "Email support",
    ],
  },
  creator: {
    name: "Creator",
    monthlyPrice: 2900, // $29/month
    yearlyPrice: 28800, // $288/year ($24/month - save 17%)
    description: "For serious creators",
    features: [
      "Everything in Starter",
      "Up to 50 links",
      "Up to 50 products",
      "Unlimited coaching sessions",
      "Email campaigns (2,500/month)",
      "Social media scheduling",
      "Follow gates",
      "Advanced analytics",
      "No platform branding",
      "Priority email support",
    ],
  },
  creator_pro: {
    name: "Pro",
    monthlyPrice: 7900, // $79/month
    yearlyPrice: 70800, // $708/year ($59/month - save 25%)
    description: "Full power for professionals",
    features: [
      "Everything in Creator",
      "Unlimited links",
      "Unlimited products",
      "Email campaigns (10,000/month)",
      "Email automation workflows",
      "Custom domain",
      "API access",
      "Priority support",
    ],
  },
  business: {
    name: "Business",
    monthlyPrice: 14900, // $149/month
    yearlyPrice: 142800, // $1,428/year ($119/month - save 20%)
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Unlimited email sends",
      "Team collaboration (up to 10 members)",
      "White-label options",
      "Advanced integrations",
      "SLA guarantee",
      "Dedicated success manager",
    ],
  },
  early_access: {
    name: "Early Access",
    monthlyPrice: 0, // Free - grandfathered
    yearlyPrice: 0,
    description: "Grandfathered unlimited access for early supporters",
    features: [
      "Unlimited everything (forever free!)",
      "Unlimited links",
      "Unlimited products",
      "Unlimited coaching sessions",
      "Unlimited email sends",
      "Email automation workflows",
      "Custom domain",
      "Social media scheduling",
      "Follow gates",
      "Advanced analytics",
      "No platform branding",
      "Team collaboration",
      "Priority support",
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
      plan: v.union(v.literal("free"), v.literal("starter"), v.literal("creator"), v.literal("creator_pro"), v.literal("business"), v.literal("early_access")),
      effectivePlan: v.union(v.literal("free"), v.literal("starter"), v.literal("creator"), v.literal("creator_pro"), v.literal("business"), v.literal("early_access")),
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
      earlyAccessExpiresAt: v.optional(v.number()),
      earlyAccessExpired: v.boolean(),
      daysUntilExpiration: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;

    const storedPlan = store.plan || "free"; // Default to free plan
    const now = Date.now();

    // Check if early access has expired
    const earlyAccessExpired = storedPlan === "early_access" &&
      store.earlyAccessExpiresAt &&
      store.earlyAccessExpiresAt < now;

    // Effective plan is free if early access expired
    const effectivePlan = earlyAccessExpired ? "free" : storedPlan;

    const limits = PLAN_LIMITS[effectivePlan];
    const pricing = PLAN_PRICING[effectivePlan];

    // Calculate days until expiration for early access users
    let daysUntilExpiration: number | undefined;
    if (storedPlan === "early_access" && store.earlyAccessExpiresAt && !earlyAccessExpired) {
      daysUntilExpiration = Math.ceil((store.earlyAccessExpiresAt - now) / (1000 * 60 * 60 * 24));
    }

    return {
      plan: storedPlan, // Original stored plan
      effectivePlan, // Plan after considering expiration
      limits,
      pricing,
      isActive: store.subscriptionStatus === "active" || store.subscriptionStatus === "trialing" || effectivePlan === "free" || (effectivePlan === "early_access" && !earlyAccessExpired),
      subscriptionStatus: store.subscriptionStatus,
      trialEndsAt: store.trialEndsAt,
      earlyAccessExpiresAt: store.earlyAccessExpiresAt,
      earlyAccessExpired: earlyAccessExpired || false,
      daysUntilExpiration,
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
    clerkId: v.optional(v.string()), // Add clerkId to check for admin
  },
  returns: v.object({
    hasAccess: v.boolean(),
    currentUsage: v.optional(v.number()),
    limit: v.optional(v.number()),
    requiresPlan: v.optional(v.union(v.literal("starter"), v.literal("creator"), v.literal("creator_pro"))),
    isAdmin: v.optional(v.boolean()), // Add admin flag to response
    earlyAccessExpired: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { hasAccess: false };
    }

    // Check if user is admin - admins bypass all paywalls
    if (args.clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();

      if (user?.admin === true) {
        // Admin has access to everything
        return {
          hasAccess: true,
          currentUsage: 0,
          limit: -1, // Unlimited
          isAdmin: true,
        };
      }
    }

    const storedPlan = store.plan || "free"; // Default to free plan
    const now = Date.now();

    // Check if early access has expired
    const earlyAccessExpired = storedPlan === "early_access" &&
      store.earlyAccessExpiresAt &&
      store.earlyAccessExpiresAt < now;

    // Use effective plan for feature access
    const plan = earlyAccessExpired ? "free" : storedPlan;
    const limits = PLAN_LIMITS[plan];

    // Check specific features
    switch (args.feature) {
      case "links": {
        const linkCount = await ctx.db
          .query("linkInBioLinks")
          .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
          .take(5000)
          .then((links) => links.length);

        const requiresUpgrade = plan === "free" && linkCount >= limits.maxLinks;
        
        return {
          hasAccess: limits.maxLinks === -1 || linkCount < limits.maxLinks,
          currentUsage: linkCount,
          limit: limits.maxLinks,
          requiresPlan: (requiresUpgrade ? "starter" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };
      }

      case "courses":
      case "products": {
        // Count both courses and digital products together (unified product limit)
        const [courseCount, digitalProductCount] = await Promise.all([
          ctx.db
            .query("courses")
            .withIndex("by_userId", (q) => q.eq("userId", store.userId))
            .take(5000)
            .then((courses) => courses.length),
          ctx.db
            .query("digitalProducts")
            .withIndex("by_userId", (q) => q.eq("userId", store.userId))
            .take(5000)
            .then((products) => products.length),
        ]);

        const totalCount = courseCount + digitalProductCount;

        // -1 = unlimited, 0 = none allowed, >0 = limited
        const hasAccess = limits.maxProducts === -1 || (limits.maxProducts > 0 && totalCount < limits.maxProducts);

        return {
          hasAccess,
          currentUsage: totalCount,
          limit: limits.maxProducts,
          requiresPlan: (!hasAccess ? "starter" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };
      }

      case "email_campaigns":
        return {
          hasAccess: limits.canUseEmailCampaigns,
          requiresPlan: (!limits.canUseEmailCampaigns ? "starter" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      case "automations":
        return {
          hasAccess: limits.canUseAutomations,
          requiresPlan: (!limits.canUseAutomations ? "creator_pro" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      case "custom_domain":
        return {
          hasAccess: limits.canUseCustomDomain,
          requiresPlan: (!limits.canUseCustomDomain ? "creator_pro" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      case "social_scheduling":
        return {
          hasAccess: limits.canUseSocialScheduling,
          requiresPlan: (!limits.canUseSocialScheduling ? "creator" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      case "follow_gates":
        return {
          hasAccess: limits.canUseFollowGates,
          requiresPlan: (!limits.canUseFollowGates ? "creator" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      case "paid_products":
        return {
          hasAccess: limits.canChargeMoney,
          requiresPlan: (!limits.canChargeMoney ? "starter" : undefined) as "starter" | "creator" | "creator_pro" | undefined,
        };

      default:
        return { hasAccess: true };
    }
  },
});

/**
 * Update store visibility settings
 * Admins can always toggle visibility regardless of plan
 */
export const updateStoreVisibility = mutation({
  args: {
    storeId: v.id("stores"),
    isPublic: v.boolean(),
    isPublishedProfile: v.optional(v.boolean()),
    clerkId: v.optional(v.string()), // Add clerkId to check for admin
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    // Check if user is admin
    let isAdmin = false;
    if (args.clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();
      isAdmin = user?.admin === true;
    }

    // Check if user has permission (admin or paid plan)
    const plan = store.plan || "free";
    if (!isAdmin && plan === "free" && args.isPublic) {
      return {
        success: false,
        message: "Public profile visibility requires Creator or Creator Pro plan. Please upgrade to continue.",
      };
    }

    const updateData: any = {
      isPublic: args.isPublic,
    };

    if (args.isPublishedProfile !== undefined) {
      updateData.isPublishedProfile = args.isPublishedProfile;
    }

    await ctx.db.patch(args.storeId, updateData);

    const message = isAdmin 
      ? `Profile is now ${args.isPublic ? "public" : "private"} (admin override)`
      : `Profile is now ${args.isPublic ? "public" : "private"}`;

    return {
      success: true,
      message,
    };
  },
});

/**
 * Initialize a new store with early_access plan (grandfathered)
 */
export const initializeStorePlan = mutation({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    // Only initialize if no plan is set
    if (!store.plan) {
      await ctx.db.patch(args.storeId, {
        plan: "free", // Default to free plan
        planStartedAt: Date.now(),
        isPublic: true, // Public by default
        isPublishedProfile: true,
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
    plan: v.union(v.literal("starter"), v.literal("creator"), v.literal("creator_pro"), v.literal("business")),
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
    await requireStoreOwner(ctx, args.storeId);
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
    downgradeToPlan: v.optional(v.union(v.literal("free"), v.literal("starter"), v.literal("creator"), v.literal("creator_pro"), v.literal("business"))),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
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
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("creator"), v.literal("creator_pro"), v.literal("business"), v.literal("early_access")),
    usage: v.object({
      links: v.object({ current: v.number(), limit: v.number() }),
      products: v.object({ current: v.number(), limit: v.number() }), // Combined courses + digital products
      emailsSentThisMonth: v.object({ current: v.number(), limit: v.number() }),
    }),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const plan = store.plan || "free"; // Default to free plan
    const limits = PLAN_LIMITS[plan];

    // Get current usage (courses + digital products counted together)
    const [linkCount, courseCount, digitalProductCount] = await Promise.all([
      ctx.db
        .query("linkInBioLinks")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .take(5000)
        .then((links) => links.length),
      ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .take(5000)
        .then((courses) => courses.length),
      ctx.db
        .query("digitalProducts")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .take(5000)
        .then((products) => products.length),
    ]);

    const totalProducts = courseCount + digitalProductCount;
    const emailsSentThisMonth = store.emailConfig?.emailsSentThisMonth || 0;

    return {
      plan,
      usage: {
        links: {
          current: linkCount,
          limit: limits.maxLinks,
        },
        products: {
          current: totalProducts,
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

// ============== EARLY ACCESS SUNSET MANAGEMENT ==============

/**
 * Get all early access stores (admin only)
 */
export const getEarlyAccessStores = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.array(v.object({
    storeId: v.id("stores"),
    storeName: v.string(),
    storeSlug: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    planStartedAt: v.optional(v.number()),
    earlyAccessExpiresAt: v.optional(v.number()),
    isExpired: v.boolean(),
    daysUntilExpiration: v.optional(v.number()),
    productCount: v.number(),
    courseCount: v.number(),
    totalRevenue: v.number(),
  })),
  handler: async (ctx, args) => {
    // Check admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user?.admin) {
      return [];
    }

    const now = Date.now();

    // Get all early access stores
    const allStores = await ctx.db.query("stores").take(10000);
    const earlyAccessStores = allStores.filter(s => s.plan === "early_access");

    // Get stats for each store
    const results = await Promise.all(
      earlyAccessStores.map(async (store) => {
        const storeUser = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
          .first();

        const products = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(5000);

        const courses = await ctx.db
          .query("courses")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .take(10000);

        // Calculate revenue
        const allPurchases = await ctx.db.query("purchases").take(10000);
        const productIds = products.map(p => p._id);
        const courseIds = courses.map(c => c._id);
        const storePurchases = allPurchases.filter(p =>
          (p.productId && productIds.includes(p.productId)) ||
          (p.courseId && courseIds.includes(p.courseId))
        );
        const totalRevenue = storePurchases.reduce((sum, p) => sum + p.amount, 0);

        const isExpired = store.earlyAccessExpiresAt
          ? store.earlyAccessExpiresAt < now
          : false;

        const daysUntilExpiration = store.earlyAccessExpiresAt && !isExpired
          ? Math.ceil((store.earlyAccessExpiresAt - now) / (1000 * 60 * 60 * 24))
          : undefined;

        return {
          storeId: store._id,
          storeName: store.name,
          storeSlug: store.slug,
          userId: store.userId,
          userName: storeUser?.name || storeUser?.firstName,
          userEmail: storeUser?.email,
          planStartedAt: store.planStartedAt,
          earlyAccessExpiresAt: store.earlyAccessExpiresAt,
          isExpired,
          daysUntilExpiration,
          productCount: products.length,
          courseCount: courses.length,
          totalRevenue,
        };
      })
    );

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
});

/**
 * Set early access expiration for a specific store (admin only)
 */
export const setEarlyAccessExpiration = mutation({
  args: {
    clerkId: v.string(),
    storeId: v.id("stores"),
    expiresAt: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.admin) {
      return { success: false, message: "Admin access required" };
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    if (store.plan !== "early_access") {
      return { success: false, message: "Store is not on early access plan" };
    }

    await ctx.db.patch(args.storeId, {
      earlyAccessExpiresAt: args.expiresAt,
    });

    const expirationDate = new Date(args.expiresAt).toLocaleDateString();
    return {
      success: true,
      message: `Early access expiration set to ${expirationDate}`,
    };
  },
});

/**
 * Set early access expiration for ALL early access stores (admin only)
 * This is for the mass sunset operation
 */
export const sunsetAllEarlyAccess = mutation({
  args: {
    clerkId: v.string(),
    daysUntilExpiration: v.number(), // e.g., 90 days from now
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    affectedStores: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.admin) {
      return { success: false, message: "Admin access required", affectedStores: 0 };
    }

    const expiresAt = Date.now() + (args.daysUntilExpiration * 24 * 60 * 60 * 1000);

    // Get all early access stores without expiration set
    const allStores = await ctx.db.query("stores").take(10000);
    const earlyAccessStores = allStores.filter(
      s => s.plan === "early_access" && !s.earlyAccessExpiresAt
    );

    // Set expiration for each
    await Promise.all(
      earlyAccessStores.map(store =>
        ctx.db.patch(store._id, { earlyAccessExpiresAt: expiresAt })
      )
    );

    const expirationDate = new Date(expiresAt).toLocaleDateString();
    return {
      success: true,
      message: `Set expiration to ${expirationDate} for ${earlyAccessStores.length} stores`,
      affectedStores: earlyAccessStores.length,
    };
  },
});

/**
 * Admin: Directly set a store's plan (bypasses Stripe)
 * Use for testing, special access, or fixing issues
 */
export const adminSetStorePlan = mutation({
  args: {
    clerkId: v.string(),
    storeId: v.id("stores"),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("creator"),
      v.literal("creator_pro"),
      v.literal("business"),
      v.literal("early_access")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.admin) {
      return { success: false, message: "Admin access required" };
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    const previousPlan = store.plan || "free";

    await ctx.db.patch(args.storeId, {
      plan: args.plan,
      planStartedAt: Date.now(),
      subscriptionStatus: "active", // Mark as active for admin overrides
    });

    return {
      success: true,
      message: `Plan changed from ${previousPlan} to ${args.plan}`,
    };
  },
});

/**
 * Admin: Get store by user ID (for admin panel)
 */
export const adminGetStoreByUserId = query({
  args: {
    clerkId: v.string(),
    targetUserId: v.string(),
  },
  returns: v.union(
    v.object({
      storeId: v.id("stores"),
      storeName: v.string(),
      storeSlug: v.string(),
      plan: v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("creator"),
        v.literal("creator_pro"),
        v.literal("business"),
        v.literal("early_access")
      ),
      productCount: v.number(),
      courseCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Check admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user?.admin) {
      return null;
    }

    // Find store for target user
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), args.targetUserId))
      .first();

    if (!store) {
      return null;
    }

    // Get product counts
    const [courseCount, productCount] = await Promise.all([
      ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
        .take(5000)
        .then((c) => c.length),
      ctx.db
        .query("digitalProducts")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
        .take(5000)
        .then((p) => p.length),
    ]);

    return {
      storeId: store._id,
      storeName: store.name,
      storeSlug: store.slug,
      plan: store.plan || "free",
      productCount,
      courseCount,
    };
  },
});

/**
 * Extend early access for a specific store (admin only)
 * For special cases where we want to reward loyal users
 */
export const extendEarlyAccess = mutation({
  args: {
    clerkId: v.string(),
    storeId: v.id("stores"),
    additionalDays: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    newExpirationDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.admin) {
      return { success: false, message: "Admin access required" };
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    if (store.plan !== "early_access") {
      return { success: false, message: "Store is not on early access plan" };
    }

    // Calculate new expiration
    const now = Date.now();
    const currentExpiration = store.earlyAccessExpiresAt || now;
    const baseDate = currentExpiration > now ? currentExpiration : now;
    const newExpiration = baseDate + (args.additionalDays * 24 * 60 * 60 * 1000);

    await ctx.db.patch(args.storeId, {
      earlyAccessExpiresAt: newExpiration,
    });

    const expirationDate = new Date(newExpiration).toLocaleDateString();
    return {
      success: true,
      message: `Extended early access to ${expirationDate}`,
      newExpirationDate: newExpiration,
    };
  },
});

