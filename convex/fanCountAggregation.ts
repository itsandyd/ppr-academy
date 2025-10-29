import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Background job to count all customers for each store
 * Runs periodically to provide accurate total counts without hitting query limits
 */

// Public action to manually trigger count for a specific store
export const triggerCountForStore = action({
  args: { storeId: v.string() },
  returns: v.object({
    success: v.boolean(),
    total: v.optional(v.number()),
    message: v.string(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; total?: number; message: string }> => {
    try {
      // Count in multiple batches to avoid the 32k read limit
      let total = 0;
      let leads = 0;
      let paying = 0;
      let subscriptions = 0;
      
      let cursor: string | null = null;
      let isDone = false;
      let batchNumber = 0;
      
      while (!isDone) {
        const batchResult: { 
          count: number; 
          leads: number; 
          paying: number; 
          subscriptions: number; 
          continueCursor: string;
          isDone: boolean;
        } = await ctx.runQuery(
          internal.fanCountAggregation.countFansBatch, 
          { 
            storeId: args.storeId,
            cursor,
          }
        );
        
        total += batchResult.count;
        leads += batchResult.leads;
        paying += batchResult.paying;
        subscriptions += batchResult.subscriptions;
        cursor = batchResult.continueCursor;
        isDone = batchResult.isDone;
        batchNumber++;
        
        // Safety: Stop after 20 batches (100k fans)
        if (batchNumber > 20) {
          break;
        }
      }
      
      await ctx.runMutation(internal.fanCountAggregation.storeFanCounts, {
        storeId: args.storeId,
        totalCount: total,
        leads: leads,
        paying: paying,
        subscriptions: subscriptions,
      });

      return {
        success: true,
        total: total,
        message: `Successfully counted ${total} fans`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to count fans: ${error.message}`,
      };
    }
  },
});

// Count a batch of fans (called multiple times by the action)
export const countFansBatch = internalQuery({
  args: { 
    storeId: v.string(),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    count: v.number(),
    leads: v.number(),
    paying: v.number(),
    subscriptions: v.number(),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Use pagination to get a safe batch
    const result = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("asc")
      .paginate({ numItems: 5000, cursor: args.cursor });
    
    let leads = 0;
    let paying = 0;
    let subscriptions = 0;
    
    for (const customer of result.page) {
      if (customer.type === "lead") leads++;
      else if (customer.type === "paying") paying++;
      else if (customer.type === "subscription") subscriptions++;
    }
    
    return {
      count: result.page.length,
      leads,
      paying,
      subscriptions,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

// Cron handler to update all store fan counts
export const updateAllStoreFanCounts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get all unique store IDs
    const stores = await ctx.runQuery(internal.fanCountAggregation.getAllStoreIds);
    
    // Count fans for each store
    for (const storeId of stores) {
      try {
        const counts = await ctx.runQuery(internal.fanCountAggregation.countAllFans, { storeId });
        await ctx.runMutation(internal.fanCountAggregation.storeFanCounts, {
          storeId,
          totalCount: counts.total,
          leads: counts.leads,
          paying: counts.paying,
          subscriptions: counts.subscriptions,
        });
      } catch (error) {
        console.error(`Failed to count fans for store ${storeId}:`, error);
      }
    }

    return null;
  },
});

// Get all store IDs
export const getAllStoreIds = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").collect();
    return stores.map(s => s._id);
  },
});

// Store the aggregated counts
export const storeFanCounts = internalMutation({
  args: {
    storeId: v.string(),
    totalCount: v.number(),
    leads: v.number(),
    paying: v.number(),
    subscriptions: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if count record exists
    const existing = await ctx.db
      .query("fanCounts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalCount: args.totalCount,
        leads: args.leads,
        paying: args.paying,
        subscriptions: args.subscriptions,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("fanCounts", {
        storeId: args.storeId,
        totalCount: args.totalCount,
        leads: args.leads,
        paying: args.paying,
        subscriptions: args.subscriptions,
        lastUpdated: Date.now(),
      });
    }

    return null;
  },
});

// Count all customers for a store (called by background job)
// Uses batched counting to avoid exceeding read limits
export const countAllFans = internalQuery({
  args: { storeId: v.string() },
  returns: v.object({
    total: v.number(),
    leads: v.number(),
    paying: v.number(),
    subscriptions: v.number(),
  }),
  handler: async (ctx, args) => {
    let total = 0;
    let leads = 0;
    let paying = 0;
    let subscriptions = 0;
    let hasMore = true;
    let cursor: string | null = null;

    // Use pagination to count in batches (max 5000 per batch to stay under 32K limit)
    while (hasMore) {
      const batch = await ctx.db
        .query("customers")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .paginate({ cursor: cursor, numItems: 5000 });

      // Count this batch
      for (const customer of batch.page) {
        total++;
        if (customer.type === "lead") leads++;
        else if (customer.type === "paying") paying++;
        else if (customer.type === "subscription") subscriptions++;
      }

      hasMore = !batch.isDone;
      cursor = batch.continueCursor;
    }

    return { total, leads, paying, subscriptions };
  },
});

