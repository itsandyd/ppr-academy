import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
 * Checks both socialAccounts and integrations tables
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
      console.log("❌ getInstagramToken: No user found for ID:", args.userId);
      return null;
    }

    console.log("🔍 getInstagramToken: Looking for Instagram token for user:", user.email || user.clerkId);

    // First, check the integrations table (used by automations)
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("name"), "INSTAGRAM"))
      .first();

    if (integration?.token) {
      console.log("✅ getInstagramToken: Found token in integrations table");
      return {
        accessToken: integration.token,
        username: integration.username || "",
        instagramId: integration.instagramId || "",
      };
    }

    // Fallback: check socialAccounts table (used by scheduling)
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

    if (socialAccount?.accessToken) {
      console.log("✅ getInstagramToken: Found token in socialAccounts table");
      return {
        accessToken: socialAccount.accessToken,
        username: socialAccount.platformUsername || "",
        instagramId: socialAccount.platformUserId,
      };
    }

    console.log("❌ getInstagramToken: No Instagram token found in either table");
    return null;
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
 * Refresh account token using helper function (avoids circular dependencies)
 */
export const refreshAccountToken = mutation({
  args: {
    accountId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Direct implementation to avoid circular dependencies
      const account = await ctx.db.get(args.accountId as Id<"socialAccounts">);
      
      if (!account) {
        return {
          success: false,
          message: "Account not found",
        };
      }

      // Mark account as needing refresh
      await ctx.db.patch(args.accountId as Id<"socialAccounts">, {
        lastVerified: Date.now(),
        connectionError: "Token needs refresh - click reconnect for updated permissions",
        isActive: false, // Force user to reconnect
      });

      return {
        success: true,
        message: `Token refresh requested for @${account.platformUsername}`,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        message: "Failed to refresh token",
      };
    }
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

/**
 * Disconnect/remove a social account
 */
export const disconnectSocialAccount = mutation({
  args: {
    accountId: v.id("socialAccounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify the account exists and belongs to this user
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.userId !== args.userId) {
      throw new Error("Not authorized to delete this account");
    }
    
    // Delete the social account
    await ctx.db.delete(args.accountId);
    
    return null;
  },
});

/**
 * Update account label
 */
export const updateAccountLabel = mutation({
  args: {
    accountId: v.id("socialAccounts"),
    userId: v.string(),
    label: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify the account exists and belongs to this user
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.userId !== args.userId) {
      throw new Error("Not authorized to update this account");
    }
    
    // Update the label
    await ctx.db.patch(args.accountId, {
      accountLabel: args.label,
    });
    
    return null;
  },
});