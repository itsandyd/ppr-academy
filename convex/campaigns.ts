/**
 * Campaign Queries - Get creator's campaigns
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get campaigns created by this user
 */
export const getMyCampaigns = query({
  args: {
    userId: v.string(), // Clerk ID
  },
  returns: v.array(
    v.object({
      _id: v.id("campaigns"),
      name: v.string(),
      type: v.string(),
      status: v.string(),
      sentCount: v.optional(v.number()),
      deliveredCount: v.optional(v.number()),
      openedCount: v.optional(v.number()),
      clickedCount: v.optional(v.number()),
      convertedCount: v.optional(v.number()),
      scheduledAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { userId }) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .order("desc")
      .take(50);

    return campaigns.map((c) => ({
      _id: c._id,
      name: c.name,
      type: c.type,
      status: c.status,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount,
      openedCount: c.openedCount,
      clickedCount: c.clickedCount,
      convertedCount: c.convertedCount,
      scheduledAt: c.scheduledAt,
      sentAt: c.sentAt,
      createdAt: c.createdAt,
    }));
  },
});

