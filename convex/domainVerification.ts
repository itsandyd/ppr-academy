"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import dns from "dns/promises";

/**
 * Verify domain DNS configuration
 */
export const verifyDomainDNS = action({
  args: {
    storeId: v.id("stores"),
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    status: v.string(),
    aRecordValid: v.boolean(),
    cnameRecordValid: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const targetIP = "76.76.21.21"; // Vercel IP
      const targetCNAME = "cname.vercel-dns.com";
      
      let aRecordValid = false;
      let cnameRecordValid = false;

      // Check A record
      try {
        const aRecords = await dns.resolve4(args.domain);
        aRecordValid = aRecords.includes(targetIP);
      } catch (error) {
        // A record not found
      }

      // Check CNAME for www subdomain
      try {
        const cnameRecords = await dns.resolveCname(`www.${args.domain}`);
        cnameRecordValid = cnameRecords.some(record =>
          record.toLowerCase().includes('vercel') ||
          record.toLowerCase().includes(targetCNAME.toLowerCase())
        );
      } catch (error) {
        // CNAME not found
      }

      // Determine status
      let status = "pending";
      let message = "DNS records not found yet. Please wait a few minutes for DNS to propagate.";

      if (aRecordValid && cnameRecordValid) {
        status = "active";
        message = "Domain verified and active! Your custom domain is now live.";
        
        // Update store status to active
        await ctx.runMutation(internal.customDomains.updateDomainStatus, {
          storeId: args.storeId,
          status: "active",
        });
      } else if (aRecordValid || cnameRecordValid) {
        status = "verifying";
        message = `Partial verification: ${aRecordValid ? 'A record ✓' : 'A record ✗'}, ${cnameRecordValid ? 'CNAME ✓' : 'CNAME ✗'}. Still checking...`;
        
        await ctx.runMutation(internal.customDomains.updateDomainStatus, {
          storeId: args.storeId,
          status: "verifying",
        });
      }

      return {
        success: aRecordValid && cnameRecordValid,
        message,
        status,
        aRecordValid,
        cnameRecordValid,
      };
    } catch (error: any) {
      console.error("DNS verification error:", error);
      return {
        success: false,
        message: "Failed to verify DNS records. Please try again.",
        status: "pending",
        aRecordValid: false,
        cnameRecordValid: false,
      };
    }
  },
});

