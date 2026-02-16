import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";


/**
 * Centralized Access Control Service
 * 
 * This module provides a unified way to check access permissions across the platform.
 * It supports multiple access methods:
 * - Free content (always accessible)
 * - Purchase-based access (one-time payment)
 * - Subscription-based access (recurring payments to creators)
 * 
 * Benefits:
 * - Single source of truth for all access control logic
 * - Easy to audit and maintain
 * - Consistent permission checking across the app
 */

/**
 * Internal helper to check if a user has an active subscription to a creator
 */
export const hasSubscriptionAccess = internalQuery({
  args: {
    userId: v.string(),
    creatorId: v.string(),
    tierId: v.optional(v.id("creatorSubscriptionTiers")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check for active subscription
    const subscription = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_user_creator", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) return false;

    // If no specific tier required, any active subscription grants access
    if (!args.tierId) return true;

    // Check tier hierarchy (Pro subscribers get Basic content, etc.)
    const userTier = await ctx.db.get(subscription.tierId);
    const requiredTier = await ctx.db.get(args.tierId);
    
    if (!userTier || !requiredTier) return false;

    // Tier hierarchy: Higher price = higher tier
    // Users with higher tiers get access to lower tier content
    return userTier.priceMonthly >= requiredTier.priceMonthly;
  },
});

/**
 * Check if a user has access to a specific resource (course or product)
 * 
 * This is the main entry point for access control checks.
 * Use this function whenever you need to verify if a user can access content.
 * 
 * @example
 * const access = await ctx.runQuery(api.accessControl.checkResourceAccess, {
 *   userId: user.id,
 *   resourceId: course._id,
 *   resourceType: "course"
 * });
 * 
 * if (!access.hasAccess) {
 *   throw new Error("Access denied");
 * }
 */
export const checkResourceAccess = query({
  args: {
    userId: v.string(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("course"), v.literal("product")),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    reason: v.string(), // "purchase", "subscription", "free", "denied"
    expiresAt: v.optional(v.number()),
    metadata: v.optional(v.object({
      accessType: v.optional(v.string()),
      tierName: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    // Get access configuration for this resource
    const accessConfig = await ctx.db
      .query("contentAccess")
      .withIndex("by_resource_type", (q) =>
        q.eq("resourceId", args.resourceId).eq("resourceType", args.resourceType)
      )
      .first();

    // Free content - always accessible
    if (!accessConfig || accessConfig.accessType === "free") {
      return { 
        hasAccess: true, 
        reason: "free",
        metadata: { accessType: "free" }
      };
    }

    // Check for direct purchase
    if (accessConfig.accessType === "purchase") {
      const queryIndex = args.resourceType === "course" ? "by_user_course" : "by_user_product";
      const purchase = await ctx.db
        .query("purchases")
        .withIndex(queryIndex, (q) => {
          const query = q.eq("userId", args.userId);
          return args.resourceType === "course"
            ? query.eq("courseId", args.resourceId as Id<"courses">)
            : query.eq("productId", args.resourceId as Id<"digitalProducts">);
        })
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (purchase) {
        return {
          hasAccess: true,
          reason: "purchase",
          expiresAt: purchase.accessExpiresAt,
          metadata: { accessType: "purchase" }
        };
      }
    }

    // Check for subscription access
    if (accessConfig.accessType === "subscription") {
      const hasAccess: boolean = await ctx.runQuery(
        // @ts-ignore - type instantiation is excessively deep
        (internal as any).accessControl.hasSubscriptionAccess,
        {
          userId: args.userId,
          creatorId: accessConfig.creatorId,
          tierId: accessConfig.requiredTierId,
        }
      );

      if (hasAccess) {
        const subscription = await ctx.db
          .query("userCreatorSubscriptions")
          .withIndex("by_user_creator", (q) =>
            q.eq("userId", args.userId).eq("creatorId", accessConfig.creatorId)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        let tierName = undefined;
        if (subscription) {
          const tier = await ctx.db.get(subscription.tierId);
          tierName = tier?.tierName;
        }

        return {
          hasAccess: true,
          reason: "subscription",
          expiresAt: subscription?.currentPeriodEnd,
          metadata: { 
            accessType: "subscription",
            tierName 
          }
        };
      }
    }

    return { 
      hasAccess: false, 
      reason: "denied",
      metadata: { accessType: accessConfig.accessType }
    };
  },
});

/**
 * Get all active subscriptions for a user
 * Useful for displaying user's subscription management page
 */
export const getUserSubscriptions = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    subscriptionId: v.id("userCreatorSubscriptions"),
    creatorId: v.string(),
    creatorName: v.optional(v.string()),
    tierName: v.string(),
    priceMonthly: v.number(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .take(1000);

    const result = [];
    for (const sub of subscriptions) {
      const tier = await ctx.db.get(sub.tierId);
      const creator = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", sub.creatorId))
        .first();

      if (tier) {
        result.push({
          subscriptionId: sub._id,
          creatorId: sub.creatorId,
          creatorName: creator?.name || creator?.firstName || "Unknown Creator",
          tierName: tier.tierName,
          priceMonthly: tier.priceMonthly,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        });
      }
    }

    return result;
  },
});

/**
 * Get all courses/products a user has access to via subscription
 */
export const getSubscriptionAccessibleContent = query({
  args: { 
    userId: v.string(),
    resourceType: v.optional(v.union(v.literal("course"), v.literal("product")))
  },
  returns: v.array(v.string()), // Returns array of resource IDs
  handler: async (ctx, args) => {
    // Get all active subscriptions for the user
    const subscriptions = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .take(1000);

    if (subscriptions.length === 0) return [];

    // Get all content from creators user is subscribed to
    const accessibleContent: string[] = [];
    
    for (const subscription of subscriptions) {
      // Query content access for this creator
      const contentAccessRecords = await ctx.db
        .query("contentAccess")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", subscription.creatorId))
        .filter((q) => q.eq(q.field("accessType"), "subscription"))
        .take(1000);

      for (const access of contentAccessRecords) {
        // Filter by resource type if specified
        if (args.resourceType && access.resourceType !== args.resourceType) {
          continue;
        }

        // Check tier access
        if (access.requiredTierId) {
          const hasAccess: boolean = await ctx.runQuery(
            // @ts-ignore - type instantiation is excessively deep
            (internal as any).accessControl.hasSubscriptionAccess,
            {
              userId: args.userId,
              creatorId: subscription.creatorId,
              tierId: access.requiredTierId,
            }
          );
          
          if (hasAccess) {
            accessibleContent.push(access.resourceId);
          }
        } else {
          // No specific tier required - any subscription works
          accessibleContent.push(access.resourceId);
        }
      }
    }

    return accessibleContent;
  },
});



