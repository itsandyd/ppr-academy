import { mutation } from "./_generated/server";

/**
 * Seed default credit packages
 * Run this once to populate the database with credit packages
 */
export const seedDefaultPackages = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if packages already exist
    const existing = await ctx.db.query("creditPackages").collect();
    if (existing.length > 0) {
      return { success: false, message: "Packages already exist", count: existing.length };
    }

    const packages = [
      {
        name: "Starter Pack",
        credits: 100,
        priceUsd: 9.99,
        bonusCredits: 0,
        description: "Perfect for trying out the marketplace",
        isActive: true,
        stripePriceId: "price_starter", // TODO: Replace with real Stripe price ID
        displayOrder: 1,
        badge: "Getting Started",
        purchaseCount: 0,
      },
      {
        name: "Pro Pack",
        credits: 500,
        priceUsd: 39.99,
        bonusCredits: 50,
        description: "Most popular choice for active producers",
        isActive: true,
        stripePriceId: "price_pro", // TODO: Replace with real Stripe price ID
        displayOrder: 2,
        badge: "Most Popular",
        purchaseCount: 0,
      },
      {
        name: "Ultimate Pack",
        credits: 1200,
        priceUsd: 89.99,
        bonusCredits: 200,
        description: "Best value for serious sample collectors",
        isActive: true,
        stripePriceId: "price_ultimate", // TODO: Replace with real Stripe price ID
        displayOrder: 3,
        badge: "Best Value",
        purchaseCount: 0,
      },
      {
        name: "Mini Pack",
        credits: 25,
        priceUsd: 2.99,
        bonusCredits: 0,
        description: "Quick top-up for a few samples",
        isActive: true,
        stripePriceId: "price_mini", // TODO: Replace with real Stripe price ID
        displayOrder: 0,
        purchaseCount: 0,
      },
    ];

    const ids = [];
    for (const pkg of packages) {
      const id = await ctx.db.insert("creditPackages", pkg);
      ids.push(id);
    }

    return { 
      success: true, 
      message: `Created ${ids.length} credit packages`,
      packageIds: ids 
    };
  },
});

