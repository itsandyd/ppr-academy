import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Internal helper mutations for Resend domain sync
 * (Separated from Node.js actions)
 */

export const findDomainByName = internalMutation({
  args: { domain: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("emailDomains"),
    })
  ),
  handler: async (ctx, args) => {
    const domain = await ctx.db
      .query("emailDomains")
      .filter(q => q.eq(q.field("domain"), args.domain))
      .first();
    
    return domain ? { _id: domain._id } : null;
  },
});

export const updateDomainFromResend = internalMutation({
  args: {
    domainId: v.id("emailDomains"),
    resendDomainId: v.string(),
    status: v.string(),
    region: v.string(),
    createdAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain) return null;
    
    await ctx.db.patch(args.domainId, {
      resendDomainId: args.resendDomainId,
      status: args.status as any,
    });
    
    return null;
  },
});

export const createDomainFromResend = internalMutation({
  args: {
    domain: v.string(),
    resendDomainId: v.string(),
    status: v.string(),
    region: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("emailDomains"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailDomains", {
      domain: args.domain,
      type: "shared",
      status: args.status as any,
      resendDomainId: args.resendDomainId,
      dnsRecords: {
        spf: { record: "", verified: args.status === "active" },
        dkim: [],
        dmarc: { record: "", verified: args.status === "active" },
      },
      reputation: {
        score: 100,
        status: "excellent",
        lastUpdated: Date.now(),
      },
      rateLimits: {
        dailyLimit: 10000,
        hourlyLimit: 1000,
        currentDailyUsage: 0,
        currentHourlyUsage: 0,
        resetAt: Date.now() + 24 * 60 * 60 * 1000,
      },
      createdBy: "resend_sync",
      createdAt: args.createdAt,
    });
  },
});

export const getDomainById = internalMutation({
  args: { domainId: v.id("emailDomains") },
  returns: v.union(
    v.null(),
    v.object({
      resendDomainId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    return domain ? { resendDomainId: domain.resendDomainId } : null;
  },
});

export const markDomainActive = internalMutation({
  args: { domainId: v.id("emailDomains") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.domainId, {
      status: "active",
    });
    return null;
  },
});

