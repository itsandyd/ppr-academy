import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Vercel's CNAME target for custom domains
const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

/**
 * Connect a custom domain to a store
 */
export const connectCustomDomain = action({
  args: {
    storeId: v.id("stores"),
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // Validate domain format
    const domain = args.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    if (!domain || domain.length < 4) {
      return { success: false, message: "Invalid domain format" };
    }

    // Check if domain is already taken
    const existingStore: { available: boolean } = await ctx.runQuery(internal.customDomains.checkDomainAvailability, {
      domain,
      storeId: args.storeId,
    });

    if (!existingStore.available) {
      return { success: false, message: "This domain is already connected to another store" };
    }

    // Add domain to Vercel automatically
    let vercelResult: { success: boolean; message: string };
    try {
      vercelResult = await ctx.runAction((internal as any).vercelDomainManager.addDomainToVercel, {
        domain,
        storeId: args.storeId,
      });
    } catch (error) {
      // Fallback if vercelDomainManager not registered yet
      console.log("Vercel API not available, skipping auto-add");
      vercelResult = { success: true, message: "Manual Vercel setup required" };
    }

    if (!vercelResult.success) {
      return {
        success: false,
        message: `Failed to add domain: ${vercelResult.message}`,
      };
    }

    // Update store with custom domain
    await ctx.runMutation(internal.customDomains.updateStoreDomain, {
      storeId: args.storeId,
      domain,
      status: "pending",
    });

    return {
      success: true,
      message: `Domain ${domain} connected! Add the DNS records to complete setup.`,
    };
  },
});

/**
 * Check if domain is available (internal)
 */
export const checkDomainAvailability = internalQuery({
  args: {
    domain: v.string(),
    storeId: v.id("stores"),
  },
  returns: v.object({
    available: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existingStore = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("customDomain"), args.domain))
      .first();

    const available = !existingStore || existingStore._id === args.storeId;
    return { available };
  },
});

/**
 * Update store domain (internal)
 */
export const updateStoreDomain = internalMutation({
  args: {
    storeId: v.id("stores"),
    domain: v.string(),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storeId, {
      customDomain: args.domain,
      domainStatus: args.status,
    });
    return null;
  },
});

/**
 * Verify domain DNS configuration
 * Uses DNS lookup to check if domain is correctly configured
 */
export const verifyCustomDomain = action({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    status: v.string(),
    dnsRecords: v.optional(v.object({
      cname: v.optional(v.string()),
      aRecords: v.optional(v.array(v.string())),
    })),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    status: string;
    dnsRecords?: { cname?: string; aRecords?: string[] };
  }> => {
    // Get store domain
    const store = await ctx.runQuery(internal.customDomains.getStoreDomain, {
      storeId: args.storeId,
    });

    if (!store?.customDomain) {
      return { success: false, message: "No domain configured", status: "none" };
    }

    const domain = store.customDomain;

    try {
      // Use DNS over HTTPS (DoH) for DNS lookup - works in Convex actions
      const dnsResult = await performDNSLookup(domain);

      // Check if CNAME points to Vercel
      const hasValidCNAME = dnsResult.cname?.toLowerCase().includes('vercel') ||
                           dnsResult.cname?.toLowerCase() === VERCEL_CNAME_TARGET;

      // Check if A records point to Vercel IPs (76.76.21.21)
      const vercelIPs = ['76.76.21.21', '76.76.21.22', '76.76.21.98', '76.76.21.123'];
      const hasValidARecord = dnsResult.aRecords?.some(ip => vercelIPs.includes(ip));

      if (hasValidCNAME || hasValidARecord) {
        // DNS is correctly configured
        await ctx.runMutation(internal.customDomains.updateDomainStatus, {
          storeId: args.storeId,
          status: "verified",
        });

        return {
          success: true,
          message: "Domain verified successfully! Your custom domain is now active.",
          status: "verified",
          dnsRecords: dnsResult,
        };
      } else {
        // DNS not configured correctly
        await ctx.runMutation(internal.customDomains.updateDomainStatus, {
          storeId: args.storeId,
          status: "pending",
        });

        return {
          success: false,
          message: `DNS not configured. Please add a CNAME record pointing to ${VERCEL_CNAME_TARGET}`,
          status: "pending",
          dnsRecords: dnsResult,
        };
      }
    } catch (error) {
      console.error("DNS verification error:", error);

      // Keep status as pending if DNS lookup fails
      await ctx.runMutation(internal.customDomains.updateDomainStatus, {
        storeId: args.storeId,
        status: "pending",
      });

      return {
        success: false,
        message: "Could not verify DNS. Please ensure your DNS records are configured and try again in a few minutes.",
        status: "pending",
      };
    }
  },
});

/**
 * Perform DNS lookup using DNS over HTTPS (Cloudflare)
 */
async function performDNSLookup(domain: string): Promise<{ cname?: string; aRecords?: string[] }> {
  const result: { cname?: string; aRecords?: string[] } = {};

  try {
    // Query CNAME records via Cloudflare DoH
    const cnameResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (cnameResponse.ok) {
      const cnameData = await cnameResponse.json() as { Answer?: Array<{ data: string }> };
      if (cnameData.Answer && cnameData.Answer.length > 0) {
        // Remove trailing dot from CNAME if present
        result.cname = cnameData.Answer[0].data.replace(/\.$/, '');
      }
    }
  } catch (e) {
    console.log("CNAME lookup failed:", e);
  }

  try {
    // Query A records via Cloudflare DoH
    const aResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (aResponse.ok) {
      const aData = await aResponse.json() as { Answer?: Array<{ data: string }> };
      if (aData.Answer && aData.Answer.length > 0) {
        result.aRecords = aData.Answer.map((record) => record.data);
      }
    }
  } catch (e) {
    console.log("A record lookup failed:", e);
  }

  return result;
}

/**
 * Remove custom domain
 */
export const removeCustomDomain = action({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current domain
    const store = await ctx.runQuery(internal.customDomains.getStoreDomain, {
      storeId: args.storeId,
    });

    if (store?.customDomain) {
      // Remove from Vercel automatically
      try {
        await ctx.runAction((internal as any).vercelDomainManager.removeDomainFromVercel, {
          domain: store.customDomain,
        });
      } catch (error) {
        console.log("Vercel API not available, skipping auto-remove");
      }
    }

    // Remove from database
    await ctx.runMutation(internal.customDomains.clearStoreDomain, {
      storeId: args.storeId,
    });

    return {
      success: true,
      message: "Custom domain removed successfully",
    };
  },
});

/**
 * Get store domain (internal)
 */
export const getStoreDomain = internalQuery({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.union(
    v.object({
      customDomain: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;
    return {
      customDomain: (store as any).customDomain,
    };
  },
});

/**
 * Clear store domain (internal)
 */
export const clearStoreDomain = internalMutation({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storeId, {
      customDomain: undefined,
      domainStatus: undefined,
    });
    return null;
  },
});

/**
 * Update domain status (internal - called by verification action)
 */
export const updateDomainStatus = internalMutation({
  args: {
    storeId: v.id("stores"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storeId, {
      domainStatus: args.status,
    });
    return null;
  },
});

/**
 * Get store by custom domain (for middleware lookup)
 */
export const getStoreByCustomDomain = query({
  args: { domain: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("stores"),
      slug: v.string(),
      name: v.string(),
      userId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const domain = args.domain.toLowerCase().replace('www.', '');
    
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("customDomain"), domain))
      .first();

    if (!store) return null;

    return {
      _id: store._id,
      slug: store.slug,
      name: store.name,
      userId: store.userId,
    };
  },
});

