import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Get all credit packages (internal)
 */
export const getAllCreditPackages = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("creditPackages").collect();
  },
});

/**
 * Get a credit package by ID (internal)
 */
export const getCreditPackageById = internalQuery({
  args: {
    packageId: v.id("creditPackages"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.packageId);
  },
});

/**
 * Update Stripe IDs for a credit package (internal)
 */
export const updatePackageStripeIds = internalMutation({
  args: {
    packageId: v.id("creditPackages"),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.db.patch(args.packageId, {
      stripePriceId: args.stripePriceId,
    });
    return null;
  },
});
