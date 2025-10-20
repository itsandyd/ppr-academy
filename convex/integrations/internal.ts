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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Get current user from Clerk
    // For now, this is a placeholder - you'll need to pass userId
    
    // Check if integration already exists
    // If exists, update. If not, create.
    
    console.log("✅ Instagram integration saved (TODO: implement full logic)");
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

