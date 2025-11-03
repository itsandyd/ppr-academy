/**
 * Creator Pipeline Queries - CRM-style tracking of creator journey
 * Used primarily in admin dashboard for managing creator relationships
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Get creators by pipeline stage
 */
export const getCreatorsByStage = query({
  args: {
    stage: v.optional(
      v.union(
        v.literal("prospect"),
        v.literal("invited"),
        v.literal("signed_up"),
        v.literal("drafting"),
        v.literal("published"),
        v.literal("first_sale"),
        v.literal("active"),
        v.literal("churn_risk")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("creatorPipeline"),
      userId: v.string(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      stage: v.string(),
      daw: v.optional(v.string()),
      instagramHandle: v.optional(v.string()),
      tiktokHandle: v.optional(v.string()),
      audienceSize: v.optional(v.number()),
      niche: v.optional(v.string()),
      totalRevenue: v.optional(v.number()),
      productCount: v.optional(v.number()),
      lastTouchAt: v.optional(v.number()),
      lastTouchType: v.optional(v.string()),
      nextStepNote: v.optional(v.string()),
      assignedTo: v.optional(v.string()),
      daysSinceLastTouch: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { stage }) => {
    let creators;
    
    if (stage) {
      creators = await ctx.db
        .query("creatorPipeline")
        .withIndex("by_stage_and_updatedAt", (q) =>
          q.eq("stage", stage)
        )
        .collect();
    } else {
      creators = await ctx.db.query("creatorPipeline").collect();
    }
    
    // Enrich with user data
    const enriched = await Promise.all(
      creators.map(async (creator) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", creator.userId))
          .first();
        
        const daysSinceLastTouch = creator.lastTouchAt
          ? Math.floor((Date.now() - creator.lastTouchAt) / (24 * 60 * 60 * 1000))
          : undefined;
        
        return {
          _id: creator._id,
          userId: creator.userId,
          userName: user?.name || user?.firstName || "Unknown",
          userEmail: user?.email,
          userAvatar: user?.imageUrl,
          stage: creator.stage,
          daw: creator.daw,
          instagramHandle: creator.instagramHandle,
          tiktokHandle: creator.tiktokHandle,
          audienceSize: creator.audienceSize,
          niche: creator.niche,
          totalRevenue: creator.totalRevenue,
          productCount: creator.productCount,
          lastTouchAt: creator.lastTouchAt,
          lastTouchType: creator.lastTouchType,
          nextStepNote: creator.nextStepNote,
          assignedTo: creator.assignedTo,
          daysSinceLastTouch,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Get creators who are stuck (need outreach)
 */
export const getStuckCreators = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("creatorPipeline"),
      userId: v.string(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      stage: v.string(),
      daysSinceStep: v.number(),
      recommendedAction: v.string(),
    })
  ),
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    // Get creators in drafting stage for 3+ days
    const drafting = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_stage_and_updatedAt", (q) => q.eq("stage", "drafting"))
      .filter((q) => q.lt(q.field("draftingAt"), threeDaysAgo))
      .collect();
    
    // Get creators who haven't had first sale 14+ days after publishing
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const noSale = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_stage_and_updatedAt", (q) => q.eq("stage", "published"))
      .filter((q) => q.lt(q.field("publishedAt"), fourteenDaysAgo))
      .collect();
    
    const allStuck = [...drafting, ...noSale];
    
    // Enrich with user data
    const enriched = await Promise.all(
      allStuck.map(async (creator) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", creator.userId))
          .first();
        
        const daysSinceStep = creator.draftingAt
          ? Math.floor((Date.now() - creator.draftingAt) / (24 * 60 * 60 * 1000))
          : creator.publishedAt
          ? Math.floor((Date.now() - creator.publishedAt) / (24 * 60 * 60 * 1000))
          : 0;
        
        const recommendedAction =
          creator.stage === "drafting"
            ? "Send setup help email + scheduling link"
            : "Review marketing strategy + promotional tips";
        
        return {
          _id: creator._id,
          userId: creator.userId,
          userName: user?.name || user?.firstName || "Unknown",
          userEmail: user?.email,
          stage: creator.stage,
          daysSinceStep,
          recommendedAction,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Update creator pipeline stage
 */
export const updateCreatorStage = mutation({
  args: {
    creatorId: v.id("creatorPipeline"),
    newStage: v.union(
      v.literal("prospect"),
      v.literal("invited"),
      v.literal("signed_up"),
      v.literal("drafting"),
      v.literal("published"),
      v.literal("first_sale"),
      v.literal("active"),
      v.literal("churn_risk")
    ),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { creatorId, newStage, note }) => {
    const creator = await ctx.db.get(creatorId);
    
    if (!creator) {
      throw new Error("Creator not found");
    }
    
    // Update stage and timestamp
    const updates: Record<string, any> = {
      stage: newStage,
      updatedAt: Date.now(),
    };
    
    // Update stage-specific timestamp
    switch (newStage) {
      case "invited":
        updates.invitedAt = Date.now();
        break;
      case "signed_up":
        updates.signedUpAt = Date.now();
        break;
      case "drafting":
        updates.draftingAt = Date.now();
        break;
      case "published":
        updates.publishedAt = Date.now();
        break;
      case "first_sale":
        updates.firstSaleAt = Date.now();
        break;
    }
    
    if (note) {
      updates.nextStepNote = note;
    }
    
    await ctx.db.patch(creatorId, updates);
    
    return null;
  },
});

/**
 * Add touch point to creator record
 */
export const addCreatorTouch = mutation({
  args: {
    creatorId: v.id("creatorPipeline"),
    touchType: v.union(
      v.literal("dm"),
      v.literal("email"),
      v.literal("comment"),
      v.literal("call")
    ),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { creatorId, touchType, note }) => {
    await ctx.db.patch(creatorId, {
      lastTouchAt: Date.now(),
      lastTouchType: touchType,
      nextStepNote: note,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

/**
 * Create or update creator pipeline entry
 */
export const upsertCreatorPipeline = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.id("stores")),
    stage: v.union(
      v.literal("prospect"),
      v.literal("invited"),
      v.literal("signed_up"),
      v.literal("drafting"),
      v.literal("published"),
      v.literal("first_sale"),
      v.literal("active"),
      v.literal("churn_risk")
    ),
    metadata: v.optional(
      v.object({
        daw: v.optional(v.string()),
        instagramHandle: v.optional(v.string()),
        tiktokHandle: v.optional(v.string()),
        audienceSize: v.optional(v.number()),
        niche: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("creatorPipeline"),
  handler: async (ctx, { userId, storeId, stage, metadata }) => {
    // Check if creator pipeline entry exists
    const existing = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        stage,
        updatedAt: Date.now(),
        ...metadata,
      });
      return existing._id;
    } else {
      // Create new
      const now = Date.now();
      return await ctx.db.insert("creatorPipeline", {
        userId,
        storeId,
        stage,
        createdAt: now,
        updatedAt: now,
        ...metadata,
      });
    }
  },
});

/**
 * Get pipeline stats (counts by stage)
 */
export const getPipelineStats = query({
  args: {},
  returns: v.object({
    prospect: v.number(),
    invited: v.number(),
    signed_up: v.number(),
    drafting: v.number(),
    published: v.number(),
    first_sale: v.number(),
    active: v.number(),
    churn_risk: v.number(),
  }),
  handler: async (ctx) => {
    const allCreators = await ctx.db.query("creatorPipeline").collect();
    
    const stats = {
      prospect: 0,
      invited: 0,
      signed_up: 0,
      drafting: 0,
      published: 0,
      first_sale: 0,
      active: 0,
      churn_risk: 0,
    };
    
    for (const creator of allCreators) {
      stats[creator.stage]++;
    }
    
    return stats;
  },
});

