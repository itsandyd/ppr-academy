import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Check if user has Instagram connected
 */
export const isInstagramConnected = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      connected: v.boolean(),
      username: v.optional(v.string()),
      instagramId: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // First check new socialAccounts table (preferred)
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isConnected"), true)
        )
      )
      .first();

    if (socialAccount) {
      return {
        connected: true,
        username: socialAccount.platformUsername,
        instagramId: socialAccount.platformUserId,
        expiresAt: socialAccount.tokenExpiresAt,
      };
    }

    // Fallback to legacy integrations table
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!integration || !integration.isActive) {
      return { connected: false };
    }

    return {
      connected: true,
      username: integration.username,
      instagramId: integration.instagramId,
      expiresAt: integration.expiresAt,
    };
  },
});

/**
 * Get user's Instagram integration details
 */
export const getInstagramIntegration = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // First check new socialAccounts table (preferred)
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isConnected"), true)
        )
      )
      .first();

    if (socialAccount) {
      return socialAccount;
    }

    // Fallback to legacy integrations table
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return integration;
  },
});

