/**
 * Quick script to seed credit packages
 * Run this from the Convex dashboard or via a one-time mutation
 */

// You can run this in the Convex dashboard:
// 1. Go to your Convex dashboard
// 2. Navigate to Functions
// 3. Find "seedCreditPackages:seedDefaultPackages"
// 4. Click "Run" with empty args: {}

// OR paste this into the Convex dashboard REPL:

/*
const packages = [
  {
    name: "Mini Pack",
    credits: 25,
    priceUsd: 2.99,
    bonusCredits: 0,
    description: "Quick top-up for a few samples",
    isActive: true,
    stripePriceId: "price_mini",
    displayOrder: 0,
    badge: "",
    purchaseCount: 0,
  },
  {
    name: "Starter Pack",
    credits: 100,
    priceUsd: 9.99,
    bonusCredits: 0,
    description: "Perfect for trying out the marketplace",
    isActive: true,
    stripePriceId: "price_starter",
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
    stripePriceId: "price_pro",
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
    stripePriceId: "price_ultimate",
    displayOrder: 3,
    badge: "Best Value",
    purchaseCount: 0,
  },
];

// Insert each package
for (const pkg of packages) {
  await ctx.db.insert("creditPackages", pkg);
}

return { success: true, count: packages.length };
*/

export {};

