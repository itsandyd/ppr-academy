import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// ============================================================================
// SOCIAL DM HELPER QUERIES (moved from socialDM.ts - Node.js runtime)
// ============================================================================

/**
 * Get social account by ID (internal)
 */
export const getAccountById = internalQuery({
  args: { accountId: v.id("socialAccounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

/**
 * Get social account by platform user ID (internal)
 */
export const getAccountByPlatformUserId = internalQuery({
  args: {
    platform: v.string(),
    platformUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), args.platform),
          q.eq(q.field("platformUserId"), args.platformUserId),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
  },
});

/**
 * Get Twitter account token for a user
 */
export const getTwitterToken = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("platform"), "twitter"),
          q.eq(q.field("isConnected"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
  },
});

/**
 * Get Facebook account token for a user
 */
export const getFacebookToken = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("platform"), "facebook"),
          q.eq(q.field("isConnected"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
  },
});

/**
 * Log a sent DM for analytics and debugging
 */
export const logDM = internalMutation({
  args: {
    accountId: v.id("socialAccounts"),
    platform: v.string(),
    recipientId: v.string(),
    message: v.string(),
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
    automationId: v.optional(v.string()),
    workflowExecutionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // No-op: logging removed
  },
});
