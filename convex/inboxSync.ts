"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Inbox Sync System
 * 
 * Fetches emails from inbox@pauseplayrepeat.com and matches them to creators
 */

/**
 * Fetch new replies from Resend inbox
 * Called by cron job every 15 minutes
 */
export const fetchInboxReplies = internalAction({
  args: {},
  returns: v.object({
    fetched: v.number(),
    matched: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Inbox Sync] RESEND_API_KEY not configured");
      return { fetched: 0, matched: 0, failed: 0 };
    }
    
    try {
      // NOTE: Resend doesn't have a direct "fetch inbox" API
      // You need to set up email forwarding in Resend:
      // inbox@pauseplayrepeat.com → forward to webhook
      
      // For now, we'll rely on webhooks to receive emails
      // This function serves as a backup/manual trigger
      
      return {
        fetched: 0,
        matched: 0,
        failed: 0,
      };
    } catch (error) {
      console.error("[Inbox Sync] Error:", error);
      return { fetched: 0, matched: 0, failed: 0 };
    }
  },
});

/**
 * Match a reply to the original creator/campaign
 */
export const matchReplyToCreator = internalAction({
  args: {
    replyId: v.id("emailReplies"),
  },
  returns: v.object({
    matched: v.boolean(),
    storeId: v.optional(v.id("stores")),
    confidence: v.string(),
  }),
  handler: async (ctx, args): Promise<{ matched: boolean; storeId?: Id<"stores">; confidence: string }> => {
    const reply: { fromEmail: string; inReplyTo?: string; subject: string } | null = await ctx.runMutation(internal.inboxHelpers.getReplyById, {
      replyId: args.replyId,
    });
    
    if (!reply) {
      return { matched: false, confidence: "none" };
    }
    
    let matchedStoreId: Id<"stores"> | undefined = undefined;
    let matchedCampaignId: Id<"resendCampaigns"> | undefined = undefined;
    let confidence: "high" | "medium" | "low" = "low";
    
    // Strategy 1: Match by In-Reply-To header (best!)
    if (reply.inReplyTo) {
      const originalEmail: { storeId?: Id<"stores">; campaignId?: Id<"resendCampaigns"> } | null = await ctx.runMutation(internal.inboxHelpers.findEmailByMessageId, {
        messageId: reply.inReplyTo,
      });
      
      if (originalEmail) {
        matchedStoreId = originalEmail.storeId;
        matchedCampaignId = originalEmail.campaignId;
        confidence = "high";
      }
    }
    
    // Strategy 2: Match by customer email → find their enrollments/purchases
    if (!matchedStoreId) {
      const customer: { storeId?: Id<"stores"> } | null = await ctx.runMutation(internal.inboxHelpers.findCustomerByEmail, {
        email: reply.fromEmail,
      });
      
      if (customer && customer.storeId) {
        matchedStoreId = customer.storeId;
        confidence = "medium";
      }
    }
    
    // Strategy 3: Parse subject line for store mention
    if (!matchedStoreId && reply.subject) {
      const storeMatch: { storeId: Id<"stores"> } | null = await ctx.runMutation(internal.inboxHelpers.findStoreInSubject, {
        subject: reply.subject,
      });
      
      if (storeMatch) {
        matchedStoreId = storeMatch.storeId;
        confidence = "low";
      }
    }
    
    // Update reply with match
    if (matchedStoreId) {
      await ctx.runMutation(internal.inboxHelpers.updateReplyMatch, {
        replyId: args.replyId,
        storeId: matchedStoreId,
        campaignId: matchedCampaignId,
        confidence,
      });
      
      // Log matching attempt
      await ctx.runMutation(internal.inboxHelpers.logMatchAttempt, {
        replyId: args.replyId,
        matched: true,
        storeId: matchedStoreId,
        confidence,
        strategy: reply.inReplyTo ? "messageId" : "email",
      });
    }
    
    return {
      matched: !!matchedStoreId,
      storeId: matchedStoreId,
      confidence,
    };
  },
});

