import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "../_generated/server";

/**
 * Save Instagram integration after OAuth
 * NOW SAVES TO socialAccounts (unified system)
 */
export const saveIntegration = internalMutation({
  args: {
    token: v.string(),
    expiresAt: v.number(),
    instagramId: v.string(),
    username: v.string(),
    userId: v.id("users"),
    profilePictureUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the user to find their Clerk ID and storeId
    const user = await ctx.db.get(args.userId);
    if (!user?.clerkId) {
      console.error("❌ User not found or missing clerkId");
      throw new Error("User not found");
    }

    // Get user's store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", user.clerkId))
      .first();

    if (!store) {
      console.error("❌ No store found for user");
      throw new Error("No store found. Please set up your store first.");
    }

    // Check if socialAccount already exists for this user/platform
    const existingSocialAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user.clerkId),
          q.eq(q.field("platform"), "instagram")
        )
      )
      .first();

    if (existingSocialAccount) {
      // Update existing socialAccount
      await ctx.db.patch(existingSocialAccount._id, {
        accessToken: args.token,
        tokenExpiresAt: args.expiresAt,
        platformUserId: args.instagramId,
        platformUsername: args.username,
        profileImageUrl: args.profilePictureUrl,
        isActive: true,
        isConnected: true,
        lastVerified: Date.now(),
        connectionError: undefined,
        platformData: {
          instagramBusinessAccountId: args.instagramId,
        },
      });
      console.log("✅ Instagram socialAccount updated for user:", user.clerkId);
    } else {
      // Create new socialAccount
      await ctx.db.insert("socialAccounts", {
        storeId: store._id,
        userId: user.clerkId,
        platform: "instagram",
        platformUserId: args.instagramId,
        platformUsername: args.username,
        profileImageUrl: args.profilePictureUrl,
        accessToken: args.token,
        tokenExpiresAt: args.expiresAt,
        isActive: true,
        isConnected: true,
        lastVerified: Date.now(),
        grantedScopes: [
          "instagram_basic",
          "instagram_content_publish",
          "instagram_manage_comments",
          "instagram_manage_messages",
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_metadata",
          "pages_messaging",
          "pages_manage_engagement",
          "business_management",
        ],
        platformData: {
          instagramBusinessAccountId: args.instagramId,
        },
      });
      console.log("✅ Instagram socialAccount created for user:", user.clerkId);
    }

    // Also update legacy integrations table for backwards compatibility (temporarily)
    const existingIntegration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingIntegration) {
      await ctx.db.patch(existingIntegration._id, {
        token: args.token,
        expiresAt: args.expiresAt,
        instagramId: args.instagramId,
        username: args.username,
        isActive: true,
        lastVerified: Date.now(),
      });
    } else {
      await ctx.db.insert("integrations", {
        userId: args.userId,
        name: "INSTAGRAM",
        token: args.token,
        expiresAt: args.expiresAt,
        instagramId: args.instagramId,
        username: args.username,
        isActive: true,
        lastVerified: Date.now(),
      });
    }
    
    return null;
  },
});

/**
 * Get integration for user (internal)
 * UNIFIED: Checks socialAccounts first, falls back to legacy integrations
 */
export const getIntegration = internalQuery({
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
      // Return in unified format
      return {
        _id: socialAccount._id,
        source: "socialAccounts", // Track where data came from
        // Legacy format fields for compatibility
        instagramId: socialAccount.platformData?.instagramBusinessAccountId || socialAccount.platformUserId,
        username: socialAccount.platformUsername,
        token: socialAccount.accessToken,
        expiresAt: socialAccount.tokenExpiresAt,
        isActive: socialAccount.isActive,
        // New format fields
        platformUserId: socialAccount.platformUserId,
        platformUsername: socialAccount.platformUsername,
        accessToken: socialAccount.accessToken,
        tokenExpiresAt: socialAccount.tokenExpiresAt,
        platformData: socialAccount.platformData,
        storeId: socialAccount.storeId,
        userId: socialAccount.userId,
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
        source: "integrations", // Track where data came from
      };
    }

    return null;
  },
});

/**
 * Update Instagram access token
 * UNIFIED: Updates both socialAccounts and legacy integrations
 */
export const updateToken = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    // Update socialAccounts if exists
    if (user?.clerkId) {
      const socialAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), user.clerkId),
            q.eq(q.field("platform"), "instagram")
          )
        )
        .first();

      if (socialAccount) {
        await ctx.db.patch(socialAccount._id, {
          accessToken: args.token,
          tokenExpiresAt: args.expiresAt,
          lastVerified: Date.now(),
          connectionError: undefined,
        });
        console.log("✅ socialAccount token updated");
      }
    }

    // Also update legacy integrations
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        token: args.token,
        expiresAt: args.expiresAt,
        lastVerified: Date.now(),
      });
      console.log("✅ Legacy integration token updated");
    }

    return null;
  },
});

/**
 * Manually update Instagram token with a working token from Graph API Explorer
 * This bypasses the broken OAuth flow
 */
export const updateInstagramToken = mutation({
  args: {
    username: v.string(), // "abletonppr" or "pauseplayrepeat"
    token: v.string(), // The new token from Graph API Explorer
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Find the integration by username
      const integration = await ctx.db
        .query("integrations")
        .filter((q) => q.eq(q.field("username"), args.username))
        .first();

      if (!integration) {
        return {
          success: false,
          message: `No integration found for @${args.username}`,
        };
      }

      // Update the token (set expiry to 60 days from now for long-lived tokens)
      const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000); // 60 days
      await ctx.db.patch(integration._id, {
        token: args.token,
        expiresAt,
        lastVerified: Date.now(),
      });

      console.log(`✅ Token manually updated for @${args.username}`);
      return {
        success: true,
        message: `Token updated for @${args.username}. Will expire in 60 days.`,
      };
    } catch (error) {
      console.error("❌ Token update error:", error);
      return {
        success: false,
        message: "Failed to update token.",
      };
    }
  },
});

/**
 * Disconnect Instagram integration (public mutation)
 * UNIFIED: Removes from both socialAccounts and legacy integrations
 */
export const disconnectInstagram = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db.get(args.userId);
      let disconnected = false;

      // Delete from socialAccounts if exists
      if (user?.clerkId) {
        const socialAccount = await ctx.db
          .query("socialAccounts")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), user.clerkId),
              q.eq(q.field("platform"), "instagram")
            )
          )
          .first();

        if (socialAccount) {
          await ctx.db.delete(socialAccount._id);
          console.log("✅ Instagram socialAccount deleted for user:", user.clerkId);
          disconnected = true;
        }
      }

      // Delete from legacy integrations
      const integration = await ctx.db
        .query("integrations")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();

      if (integration) {
        await ctx.db.delete(integration._id);
        console.log("✅ Legacy Instagram integration deleted for user:", args.userId);
        disconnected = true;
      }

      if (disconnected) {
        return {
          success: true,
          message: "Instagram disconnected. You can now reconnect with a fresh token.",
        };
      }

      return {
        success: false,
        message: "No Instagram connection found to disconnect.",
      };
    } catch (error) {
      console.error("❌ Disconnect error:", error);
      return {
        success: false,
        message: "Failed to disconnect Instagram.",
      };
    }
  },
});
