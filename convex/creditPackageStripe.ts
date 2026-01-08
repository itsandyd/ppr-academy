"use node";

import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  });
}

/**
 * Create Stripe products and prices for all credit packages
 * This should be run once to set up permanent Stripe products
 */
export const syncCreditPackagesToStripe = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    results: v.array(v.object({
      packageName: v.string(),
      stripeProductId: v.optional(v.string()),
      stripePriceId: v.optional(v.string()),
      error: v.optional(v.string()),
    })),
  }),
  handler: async (ctx) => {
    const stripe = getStripe();

    // Get all credit packages from database
    const packages = await ctx.runQuery(internal.creditPackageStripe.getAllCreditPackages, {});

    if (!packages || packages.length === 0) {
      return {
        success: false,
        message: "No credit packages found in database",
        results: [],
      };
    }

    const results: Array<{
      packageName: string;
      stripeProductId?: string;
      stripePriceId?: string;
      error?: string;
    }> = [];

    for (const pkg of packages) {
      try {
        // Check if this package already has valid Stripe IDs
        if (pkg.stripePriceId && pkg.stripePriceId.startsWith("price_") && pkg.stripePriceId.length > 20) {
          // Verify the price exists in Stripe
          try {
            const existingPrice = await stripe.prices.retrieve(pkg.stripePriceId);
            if (existingPrice && existingPrice.active) {
              results.push({
                packageName: pkg.name,
                stripeProductId: existingPrice.product as string,
                stripePriceId: pkg.stripePriceId,
              });
              console.log(`✅ ${pkg.name} already has valid Stripe price: ${pkg.stripePriceId}`);
              continue;
            }
          } catch {
            // Price doesn't exist, create new one
            console.log(`⚠️ ${pkg.name} has invalid Stripe price, creating new one`);
          }
        }

        // Create Stripe product
        const product = await stripe.products.create({
          name: `PPR Academy - ${pkg.name}`,
          description: pkg.description || `${pkg.credits} credits${pkg.bonusCredits ? ` + ${pkg.bonusCredits} bonus` : ""} for PPR Academy`,
          metadata: {
            type: "credit_package",
            packageId: pkg._id,
            credits: pkg.credits.toString(),
            bonusCredits: (pkg.bonusCredits || 0).toString(),
          },
        });

        console.log(`✅ Created Stripe product for ${pkg.name}: ${product.id}`);

        // Create Stripe price
        const priceInCents = Math.round(pkg.priceUsd * 100);
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceInCents,
          currency: "usd",
          metadata: {
            type: "credit_package",
            packageId: pkg._id,
            packageName: pkg.name,
          },
        });

        console.log(`✅ Created Stripe price for ${pkg.name}: ${price.id}`);

        // Update database with Stripe IDs
        await ctx.runMutation(internal.creditPackageStripe.updatePackageStripeIds, {
          packageId: pkg._id,
          stripeProductId: product.id,
          stripePriceId: price.id,
        });

        results.push({
          packageName: pkg.name,
          stripeProductId: product.id,
          stripePriceId: price.id,
        });
      } catch (error: any) {
        console.error(`❌ Failed to sync ${pkg.name}:`, error);
        results.push({
          packageName: pkg.name,
          error: error.message || "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.stripePriceId).length;
    const failCount = results.filter(r => r.error).length;

    return {
      success: failCount === 0,
      message: `Synced ${successCount}/${packages.length} packages. ${failCount} failed.`,
      results,
    };
  },
});

/**
 * Get Stripe price ID for a credit package
 * Returns the stored price ID or null if not set
 */
export const getPackageStripePriceId = action({
  args: {
    packageId: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const pkg = await ctx.runQuery(internal.creditPackageStripe.getCreditPackageById, {
      packageId: args.packageId as Id<"creditPackages">,
    });

    if (!pkg) {
      return null;
    }

    // Validate that the price ID looks real (not a placeholder)
    if (pkg.stripePriceId && pkg.stripePriceId.startsWith("price_") && pkg.stripePriceId.length > 20) {
      return pkg.stripePriceId;
    }

    return null;
  },
});

/**
 * Create a checkout session using the stored Stripe price ID
 * Falls back to creating on-the-fly if no valid price ID exists
 */
export const createCreditCheckoutSession = action({
  args: {
    packageId: v.string(),
    userId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    checkoutUrl: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const stripe = getStripe();

    // Get package details
    const pkg = await ctx.runQuery(internal.creditPackageStripe.getCreditPackageById, {
      packageId: args.packageId as Id<"creditPackages">,
    });

    if (!pkg) {
      return { success: false, error: "Package not found" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      let priceId = pkg.stripePriceId;

      // If no valid price ID, create on-the-fly (fallback)
      if (!priceId || !priceId.startsWith("price_") || priceId.length < 20) {
        console.log(`⚠️ Creating on-the-fly price for ${pkg.name} (no stored price ID)`);

        const product = await stripe.products.create({
          name: `PPR Academy - ${pkg.name}`,
          description: pkg.description,
          metadata: {
            type: "credit_package",
            packageId: pkg._id,
          },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(pkg.priceUsd * 100),
          currency: "usd",
        });

        priceId = price.id;

        // Save for future use
        await ctx.runMutation(internal.creditPackageStripe.updatePackageStripeIds, {
          packageId: pkg._id,
          stripeProductId: product.id,
          stripePriceId: price.id,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/credits/purchase`,
        customer_email: args.customerEmail,
        metadata: {
          productType: "credit_package",
          packageId: pkg._id,
          packageName: pkg.name,
          credits: pkg.credits.toString(),
          bonusCredits: (pkg.bonusCredits || 0).toString(),
          userId: args.userId,
          priceUsd: pkg.priceUsd.toString(),
        },
      });

      return {
        success: true,
        checkoutUrl: session.url || undefined,
        sessionId: session.id,
      };
    } catch (error: any) {
      console.error("❌ Credit checkout error:", error);
      return {
        success: false,
        error: error.message || "Failed to create checkout session",
      };
    }
  },
});

// ============================================================================
// INTERNAL QUERIES & MUTATIONS
// ============================================================================

/**
 * Get all credit packages (internal)
 */
export const getAllCreditPackages = internalQuery({
  args: {},
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
  handler: async (ctx, args) => {
    await ctx.db.patch(args.packageId, {
      stripePriceId: args.stripePriceId,
    });
    console.log(`✅ Updated ${args.packageId} with Stripe price: ${args.stripePriceId}`);
  },
});
