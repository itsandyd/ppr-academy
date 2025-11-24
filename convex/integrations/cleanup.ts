import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Cleanup old integration records that conflict with new socialAccounts
 */
export const cleanupOldIntegrations = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find old integration records for this user
    const oldIntegrations = await ctx.db
      .query("integrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const integration of oldIntegrations) {
      await ctx.db.delete(integration._id);
      console.log(`🗑️ Deleted old integration: ${integration.username} (${integration.name})`);
    }

    console.log(`✅ Cleaned up ${oldIntegrations.length} old integration records`);
    return null;
  },
});
