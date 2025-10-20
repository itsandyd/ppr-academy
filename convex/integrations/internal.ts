import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

/**
 * Save Instagram integration after OAuth
 */
export const saveIntegration = internalMutation({
  args: {
    token: v.string(),
    expiresAt: v.number(),
    instagramId: v.string(),
    username: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if integration already exists for this user
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        token: args.token,
        expiresAt: args.expiresAt,
        instagramId: args.instagramId,
        username: args.username,
        isActive: true,
        lastVerified: Date.now(),
      });
      console.log("✅ Instagram integration updated");
    } else {
      // Create new integration
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
      console.log("✅ Instagram integration created");
    }
    
    return null;
  },
});

/**
 * Get integration for user (internal)
 */
export const getIntegration = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return integration;
  },
});

/**
 * Update Instagram access token
 */
export const updateToken = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!integration) {
      console.error("❌ No integration found to update");
      return null;
    }

    await ctx.db.patch(integration._id, {
      token: args.token,
      expiresAt: args.expiresAt,
      lastVerified: Date.now(),
    });

    console.log("✅ Token updated");
    return null;
  },
});

