import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";

/**
 * Get social media accounts for a store
 */
export const getSocialAccounts = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

/**
 * Get Instagram access token for a user (for webhook use)
 */
export const getInstagramToken = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      username: v.string(),
      instagramId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get the user to find their Clerk ID
    const user = await ctx.db.get(args.userId);
    if (!user?.clerkId) {
      return null;
    }

    // Fetch current Instagram connection
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

    if (!socialAccount?.accessToken) {
      return null;
    }

    return {
      accessToken: socialAccount.accessToken, // Use main Instagram token, not Facebook Page token
      username: socialAccount.platformUsername || "",
      instagramId: socialAccount.platformUserId,
    };
  },
});

/**
 * Get posts scheduled to publish (stub)
 */
export const getPostsToPublish = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return [];
  },
});

/**
 * Update post status
 */
export const updatePostStatus = internalMutation({
  args: {
    postId: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Implement actual post status updates
    console.log("📊 Post status update:", args.postId, args.status);
    return null;
  },
});

/**
 * Refresh account token
 */
export const refreshAccountToken = internalMutation({
  args: {
    accountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Implement actual token refresh
    console.log("🔄 Token refresh for account:", args.accountId);
    return null;
  },
});

/**
 * Connect social account
 */
export const connectSocialAccount = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    platform: v.union(v.literal("instagram"), v.literal("facebook"), v.literal("twitter"), v.literal("linkedin"), v.literal("tiktok")),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    platformDisplayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    grantedScopes: v.array(v.string()),
    platformData: v.optional(v.any()),
  },
  returns: v.id("socialAccounts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("socialAccounts", {
      storeId: args.storeId,
      userId: args.userId,
      platform: args.platform,
      platformUserId: args.platformUserId,
      platformUsername: args.platformUsername,
      platformDisplayName: args.platformDisplayName,
      profileImageUrl: args.profileImageUrl,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      isActive: true,
      isConnected: true,
      grantedScopes: args.grantedScopes,
      platformData: args.platformData,
    });
  },
});

/**
 * Get scheduled posts (stub)
 */
export const getScheduledPosts = query({
  args: {
    storeId: v.string(),
    status: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return [];
  },
});

/**
 * Delete scheduled post (stub)
 */
export const deleteScheduledPost = mutation({
  args: {
    postId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return null;
  },
});