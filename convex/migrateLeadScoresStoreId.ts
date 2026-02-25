/**
 * Migration: Backfill storeId on existing leadScores records.
 *
 * Before this change, leadScores had no storeId — all scores were global.
 * This migration assigns each existing record to the appropriate store by:
 *
 * 1. Looking up the admin resendConnection to find the platform's default storeId.
 * 2. Patching every leadScores record that has no storeId with the default storeId.
 *
 * This is safe and idempotent — records that already have a storeId are skipped.
 *
 * Run via: npx convex run migrateLeadScoresStoreId:backfillLeadScoresStoreId
 */

import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";

export const backfillLeadScoresStoreId = mutation({
  args: {
    defaultStoreId: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    patched: v.number(),
    skipped: v.number(),
    defaultStoreIdUsed: v.string(),
  }),
  handler: async (ctx, args) => {
    // Determine the default storeId to assign
    let defaultStoreId = args.defaultStoreId;

    if (!defaultStoreId) {
      // Try to find the admin resend connection — its userId is typically
      // the platform owner (Andrew) whose Clerk ID doubles as storeId
      const adminConnection = await ctx.db
        .query("resendConnections")
        .withIndex("by_type", (q) => q.eq("type", "admin"))
        .first();

      if (adminConnection) {
        defaultStoreId = adminConnection.userId;
      }
    }

    if (!defaultStoreId) {
      // Last resort: look at the first store in the stores table
      const firstStore = await ctx.db.query("stores").first();
      if (firstStore) {
        defaultStoreId = firstStore.userId;
      }
    }

    if (!defaultStoreId) {
      throw new Error(
        "Could not determine a default storeId. Pass one explicitly via the defaultStoreId arg."
      );
    }

    // Get all leadScores (batch of up to 5000)
    const allScores = await ctx.db.query("leadScores").take(5000);

    let patched = 0;
    let skipped = 0;

    for (const score of allScores) {
      if (score.storeId) {
        skipped++;
        continue;
      }

      await ctx.db.patch(score._id, {
        storeId: defaultStoreId,
      });
      patched++;
    }

    return {
      total: allScores.length,
      patched,
      skipped,
      defaultStoreIdUsed: defaultStoreId,
    };
  },
});
