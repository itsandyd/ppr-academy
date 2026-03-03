"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getMarketingResendClient,
  getMarketingAudienceId,
  ensureMarketingContact,
} from "./lib/resendClients";

/**
 * Sync a single contact to Resend's marketing audience.
 * Called when a new emailContact is created or updated.
 * Uses the marketing Resend API key (contacts are managed on the marketing plan).
 *
 * MARKETING CONTACT SYNC: This creates or updates the contact in Resend's
 * audience so they can receive broadcasts and be included in segments.
 * If RESEND_MARKETING_API_KEY is not set, this is a no-op (graceful fallback).
 */
export const syncContactToMarketing = internalAction({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    unsubscribed: v.optional(v.boolean()),
    properties: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Skip if marketing API key or audience ID is not configured
    if (!process.env.RESEND_MARKETING_API_KEY || !process.env.RESEND_MARKETING_AUDIENCE_ID) {
      return null;
    }

    if (args.unsubscribed) {
      // If explicitly unsubscribed, update rather than create
      try {
        const resend = getMarketingResendClient();
        await resend.contacts.update({
          audienceId: getMarketingAudienceId(),
          email: args.email,
          unsubscribed: true,
        });
      } catch (error: any) {
        console.error(`[MarketingSync] Failed to update unsubscribe for ${args.email}:`, error);
      }
      return null;
    }

    // Create or confirm contact exists in the marketing audience
    await ensureMarketingContact(args.email, args.firstName, args.lastName);
    return null;
  },
});

/**
 * Update a contact's unsubscribe status in Resend marketing audience.
 * Called when a contact unsubscribes from emails.
 *
 * MARKETING CONTACT SYNC: Reflects PPR's unsubscribe state back to Resend
 * so that broadcasts and segments respect the opt-out.
 */
export const updateContactUnsubscribe = internalAction({
  args: {
    email: v.string(),
    unsubscribed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!process.env.RESEND_MARKETING_API_KEY || !process.env.RESEND_MARKETING_AUDIENCE_ID) {
      return null;
    }

    try {
      const resend = getMarketingResendClient();

      await resend.contacts.update({
        audienceId: getMarketingAudienceId(),
        email: args.email,
        unsubscribed: args.unsubscribed,
      });
    } catch (error: any) {
      console.error(`[MarketingSync] Failed to update unsubscribe for ${args.email}:`, error);
    }

    return null;
  },
});

/**
 * Bulk sync existing emailContacts to Resend marketing audience.
 * Run this once after setting up the marketing plan to migrate existing contacts (~50,000).
 * Processes in batches to avoid rate limits.
 *
 * MARKETING CONTACT SYNC: One-time migration utility.
 *
 * Usage: npx convex run resendMarketingSync:syncExistingContacts
 * For pagination: npx convex run resendMarketingSync:syncExistingContacts '{"cursor":"<nextCursor>"}'
 */
export const syncExistingContacts = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    synced: v.number(),
    failed: v.number(),
    hasMore: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!process.env.RESEND_MARKETING_API_KEY || !process.env.RESEND_MARKETING_AUDIENCE_ID) {
      return { synced: 0, failed: 0, hasMore: false };
    }

    const batchSize = args.batchSize ?? 100;
    const resend = getMarketingResendClient();
    const audienceId = getMarketingAudienceId();

    // Get a batch of contacts from Convex
    const contacts = await ctx.runQuery(
      internal.emailContacts.getContactBatchForMarketingSync,
      { limit: batchSize, cursor: args.cursor }
    );

    let synced = 0;
    let failed = 0;

    for (const contact of contacts.items) {
      try {
        await resend.contacts.create({
          audienceId,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          unsubscribed: contact.status !== "subscribed",
        });
        synced++;

        // Rate limit: 10 req/s to Resend
        if (synced % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }
      } catch (error: any) {
        if (error?.statusCode === 409) {
          // Already exists — count as synced
          synced++;
        } else {
          console.error(`[MarketingSync] Failed to sync ${contact.email}:`, error);
          failed++;
        }
      }
    }

    return {
      synced,
      failed,
      hasMore: contacts.hasMore,
      nextCursor: contacts.nextCursor,
    };
  },
});
