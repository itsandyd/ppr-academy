import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Connect a custom domain to a store
 */
export const connectCustomDomain = mutation({
  args: {
    storeId: v.id("stores"),
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Validate domain format
    const domain = args.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    if (!domain || domain.length < 4) {
      return { success: false, message: "Invalid domain format" };
    }

    // Check if domain is already taken
    const existingStore = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("customDomain"), domain))
      .first();

    if (existingStore && existingStore._id !== args.storeId) {
      return { success: false, message: "This domain is already connected to another store" };
    }

    // Update store with custom domain
    await ctx.db.patch(args.storeId, {
      customDomain: domain,
      domainStatus: "pending", // Waiting for DNS verification
    });

    return {
      success: true,
      message: `Domain ${domain} connected! Add the DNS records to complete setup.`,
    };
  },
});

/**
 * Verify domain DNS configuration
 */
export const verifyCustomDomain = mutation({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    
    if (!store?.customDomain) {
      return { success: false, message: "No domain configured", status: "none" };
    }

    // In production, you would check DNS here via an action
    // For now, we'll simulate verification
    
    // TODO: Implement actual DNS verification
    // This would be an action that calls a DNS lookup service
    
    return {
      success: true,
      message: "Verification in progress. This can take 5-60 minutes.",
      status: "verifying",
    };
  },
});

/**
 * Remove custom domain
 */
export const removeCustomDomain = mutation({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storeId, {
      customDomain: undefined,
      domainStatus: undefined,
    });

    return {
      success: true,
      message: "Custom domain removed successfully",
    };
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

