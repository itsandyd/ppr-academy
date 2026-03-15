"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * LEGACY NO-OP: Resend domain sync has been retired.
 * Email delivery is now handled exclusively via AWS SES.
 * These functions are kept as no-ops to avoid breaking callers.
 */

export const syncDomainsFromResend = action({
  args: {},
  returns: v.object({
    synced: v.number(),
    added: v.number(),
    updated: v.number(),
  }),
  handler: async (_ctx) => {
    console.warn("[DomainSync] No-op: Resend domain sync retired. Email is via AWS SES.");
    return { synced: 0, added: 0, updated: 0 };
  },
});

export const verifyDomainInResend = action({
  args: {
    domainId: v.id("emailDomains"),
  },
  returns: v.object({
    verified: v.boolean(),
    records: v.any(),
  }),
  handler: async (_ctx, _args): Promise<{ verified: boolean; records: any }> => {
    console.warn("[DomainSync] No-op: Resend domain verification retired. Email is via AWS SES.");
    return { verified: false, records: [] };
  },
});
