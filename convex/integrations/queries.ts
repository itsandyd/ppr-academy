import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Check if user has Instagram connected
 * UNIFIED: Primary source is socialAccounts, fallback to legacy integrations
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
      source: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get the user to find their Clerk ID
    const user = await ctx.db.get(args.userId);
    if (!user?.clerkId) {
      return { connected: false };
    }

    // Check socialAccounts table (primary source)
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user.clerkId),
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isConnected"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (socialAccount) {
      return {
        connected: true,
        username: socialAccount.platformUsername,
        instagramId: socialAccount.platformData?.instagramBusinessAccountId || socialAccount.platformUserId,
        expiresAt: socialAccount.tokenExpiresAt,
        source: "socialAccounts",
      };
    }

    // Fallback to legacy integrations table
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (integration?.isActive) {
      return {
        connected: true,
        username: integration.username,
        instagramId: integration.instagramId,
        expiresAt: integration.expiresAt,
        source: "integrations",
      };
    }

    return { connected: false };
  },
});

/**
 * Get user's Instagram integration details
 * UNIFIED: Primary source is socialAccounts, fallback to legacy integrations
 */
export const getInstagramIntegration = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // Get the user to find their Clerk ID
    const user = await ctx.db.get(args.userId);
    if (!user?.clerkId) {
      return null;
    }

    // Check socialAccounts table (primary source)
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user.clerkId),
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isConnected"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (socialAccount) {
      // Return in unified format with legacy compatibility
      return {
        _id: socialAccount._id,
        source: "socialAccounts",
        // Unified fields
        platform: socialAccount.platform,
        platformUserId: socialAccount.platformUserId,
        platformUsername: socialAccount.platformUsername,
        profileImageUrl: socialAccount.profileImageUrl,
        accessToken: socialAccount.accessToken,
        tokenExpiresAt: socialAccount.tokenExpiresAt,
        isActive: socialAccount.isActive,
        isConnected: socialAccount.isConnected,
        lastVerified: socialAccount.lastVerified,
        storeId: socialAccount.storeId,
        platformData: socialAccount.platformData,
        grantedScopes: socialAccount.grantedScopes,
        // Legacy compatibility fields
        instagramId: socialAccount.platformData?.instagramBusinessAccountId || socialAccount.platformUserId,
        username: socialAccount.platformUsername,
        token: socialAccount.accessToken,
        expiresAt: socialAccount.tokenExpiresAt,
      };
    }

    // Fallback to legacy integrations table
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (integration) {
      return {
        ...integration,
        source: "integrations",
      };
    }

    return null;
  },
});
