"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * LEGACY NO-OP: Resend marketing audience sync has been retired.
 * Email delivery is now handled exclusively via AWS SES.
 * These functions are kept as no-ops to avoid breaking callers.
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
  handler: async (_ctx, _args) => {
    // No-op: Resend marketing audience no longer exists. Email is via AWS SES.
    return null;
  },
});

export const updateContactUnsubscribe = internalAction({
  args: {
    email: v.string(),
    unsubscribed: v.boolean(),
  },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    // No-op: Resend marketing audience no longer exists. Email is via AWS SES.
    return null;
  },
});

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
  handler: async (_ctx, _args) => {
    console.warn("[MarketingSync] No-op: Resend marketing audience no longer exists. Email is via AWS SES.");
    return { synced: 0, failed: 0, hasMore: false };
  },
});
