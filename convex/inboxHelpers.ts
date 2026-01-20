import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Helper functions for inbox reply matching
 */

export const getReplyById = internalMutation({
  args: { replyId: v.id("emailReplies") },
  returns: v.union(v.null(), v.object({
    fromEmail: v.string(),
    inReplyTo: v.optional(v.string()),
    subject: v.string(),
  })),
  handler: async (ctx, args) => {
    const reply = await ctx.db.get(args.replyId);
    if (!reply) return null;
    
    return {
      fromEmail: reply.fromEmail,
      inReplyTo: reply.inReplyTo,
      subject: reply.subject,
    };
  },
});

export const findEmailByMessageId = internalMutation({
  args: { messageId: v.string() },
  returns: v.union(v.null(), v.object({
    storeId: v.optional(v.id("stores")),
    campaignId: v.optional(v.id("resendCampaigns")),
  })),
  handler: async (ctx, args) => {
    // Search in resendLogs for original email (using index for faster lookup)
    const log = await ctx.db
      .query("resendLogs")
      .withIndex("by_resend_id", q => q.eq("resendEmailId", args.messageId))
      .first();
    
    if (log && log.connectionId) {
      // Get connection to find store
      const connection = await ctx.db.get(log.connectionId);
      
      return {
        storeId: connection?.storeId,
        campaignId: log.campaignId,
      };
    }
    
    return null;
  },
});

export const findCustomerByEmail = internalMutation({
  args: { email: v.string() },
  returns: v.union(v.null(), v.object({
    storeId: v.optional(v.id("stores")),
  })),
  handler: async (ctx, args) => {
    // Find customer in customers table (using index for faster lookup)
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
    
    if (customer) {
      return { storeId: customer.storeId as any };
    }
    
    return null;
  },
});

export const findStoreInSubject = internalMutation({
  args: { subject: v.string() },
  returns: v.union(v.null(), v.object({
    storeId: v.id("stores"),
  })),
  handler: async (ctx, args) => {
    // Get all stores
    const stores = await ctx.db.query("stores").collect();
    
    const subjectLower = args.subject.toLowerCase();
    
    // Look for store name or slug in subject
    for (const store of stores) {
      if (
        subjectLower.includes(store.name.toLowerCase()) ||
        subjectLower.includes(store.slug.toLowerCase())
      ) {
        return { storeId: store._id };
      }
    }
    
    return null;
  },
});

export const updateReplyMatch = internalMutation({
  args: {
    replyId: v.id("emailReplies"),
    storeId: v.id("stores"),
    campaignId: v.optional(v.id("resendCampaigns")),
    confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.replyId, {
      storeId: args.storeId,
      matchConfidence: args.confidence,
    });
    return null;
  },
});

export const logMatchAttempt = internalMutation({
  args: {
    replyId: v.id("emailReplies"),
    matched: v.boolean(),
    storeId: v.optional(v.id("stores")),
    confidence: v.string(),
    strategy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("replyMatchingLog", {
      replyId: args.replyId,
      attemptedAt: Date.now(),
      matchingStrategy: args.strategy,
      matched: args.matched,
      matchedStoreId: args.storeId,
      confidence: args.confidence,
    });
    return null;
  },
});

