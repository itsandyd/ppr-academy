"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Resend Domain Sync
 * 
 * Syncs domains from Resend to PPR Academy admin dashboard
 */

/**
 * Sync all domains from Resend API
 */
export const syncDomainsFromResend = action({
  args: {},
  returns: v.object({
    synced: v.number(),
    added: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    
    // Fetch domains from Resend API
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    const resendDomains = result.data || [];
    
    let added = 0;
    let updated = 0;
    
    for (const resendDomain of resendDomains) {
      // Map Resend status to our status
      const status = resendDomain.status === "verified" ? "active" : "pending";
      
      // Check if domain exists in our DB
      const existing = await ctx.runMutation(internal.resendDomainHelpers.findDomainByName, {
        domain: resendDomain.name,
      });
      
      if (existing) {
        // Update existing domain
        await ctx.runMutation(internal.resendDomainHelpers.updateDomainFromResend, {
          domainId: existing._id,
          resendDomainId: resendDomain.id,
          status,
          region: resendDomain.region,
          createdAt: new Date(resendDomain.created_at).getTime(),
        });
        updated++;
      } else {
        // Add new domain
        await ctx.runMutation(internal.resendDomainHelpers.createDomainFromResend, {
          domain: resendDomain.name,
          resendDomainId: resendDomain.id,
          status,
          region: resendDomain.region,
          createdAt: new Date(resendDomain.created_at).getTime(),
        });
        added++;
      }
    }
    
    return {
      synced: resendDomains.length,
      added,
      updated,
    };
  },
});

/**
 * Verify a specific domain in Resend
 */
export const verifyDomainInResend = action({
  args: {
    domainId: v.id("emailDomains"),
  },
  returns: v.object({
    verified: v.boolean(),
    records: v.any(),
  }),
  handler: async (ctx, args): Promise<{ verified: boolean; records: any }> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    
    // Get domain from DB
    const domain: { resendDomainId?: string } | null = await ctx.runMutation(
      internal.resendDomainHelpers.getDomainById, 
      { domainId: args.domainId }
    );
    
    if (!domain?.resendDomainId) {
      throw new Error("Domain not synced with Resend");
    }
    
    // Call Resend verify API
    const response: Response = await fetch(
      `https://api.resend.com/domains/${domain.resendDomainId}/verify`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }
    
    const result: any = await response.json();
    
    // Update domain status based on verification
    const allVerified: boolean = result.records?.every((r: any) => r.status === "verified") || false;
    
    if (allVerified) {
      await ctx.runMutation(internal.resendDomainHelpers.markDomainActive, {
        domainId: args.domainId,
      });
    }
    
    return {
      verified: allVerified,
      records: result.records || [],
    };
  },
});

