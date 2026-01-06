import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CREDIT PACKAGES
// ============================================================================

const CREDIT_PACKAGES = [
  { id: "starter", credits: 10, price: 9.99, bonus: 0, popular: false },
  { id: "basic", credits: 25, price: 19.99, bonus: 5, popular: false },
  { id: "pro", credits: 50, price: 34.99, bonus: 15, popular: true },
  { id: "premium", credits: 100, price: 59.99, bonus: 35, popular: false },
  { id: "elite", credits: 250, price: 129.99, bonus: 100, popular: false },
] as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get user's credit balance
 */
export const getUserCredits = query({
  args: {},
  returns: v.union(
    v.object({
      balance: v.number(),
      lifetimeEarned: v.number(),
      lifetimeSpent: v.number(),
      lastUpdated: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      // Return default values - user needs to initialize credits via mutation
      return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      };
    }

    return {
      balance: userCredits.balance,
      lifetimeEarned: userCredits.lifetimeEarned,
      lifetimeSpent: userCredits.lifetimeSpent,
      lastUpdated: userCredits.lastUpdated,
    };
  },
});

/**
 * Get available credit packages
 */
export const getCreditPackages = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      credits: v.number(),
      price: v.number(),
      bonus: v.number(),
      popular: v.boolean(),
      totalCredits: v.number(),
      pricePerCredit: v.number(),
      savingsPercent: v.number(),
    })
  ),
  handler: async () => {
    const basePrice = 0.99; // $0.99 per credit baseline

    return CREDIT_PACKAGES.map((pkg) => {
      const totalCredits = pkg.credits + pkg.bonus;
      const pricePerCredit = pkg.price / totalCredits;
      const savingsPercent = Math.round(((basePrice - pricePerCredit) / basePrice) * 100);

      return {
        id: pkg.id,
        credits: pkg.credits,
        price: pkg.price,
        bonus: pkg.bonus,
        popular: pkg.popular,
        totalCredits,
        pricePerCredit: Number(pricePerCredit.toFixed(2)),
        savingsPercent: Math.max(0, savingsPercent),
      };
    });
  },
});

/**
 * Get credit transaction history
 */
export const getCreditTransactions = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    transactions: v.array(
      v.object({
        _id: v.id("creditTransactions"),
        _creationTime: v.number(),
        type: v.union(
          v.literal("purchase"),
          v.literal("spend"),
          v.literal("earn"),
          v.literal("bonus"),
          v.literal("refund")
        ),
        amount: v.number(),
        balance: v.number(),
        description: v.string(),
      })
    ),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const allTransactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const transactions = allTransactions.slice(offset, offset + limit).map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
      type: t.type,
      amount: t.amount,
      balance: t.balance,
      description: t.description,
    }));

    return {
      transactions,
      total: allTransactions.length,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Initialize user credits (internal use)
 */
export const initializeUserCredits = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.id("userCredits"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("userCredits", {
      userId: args.userId,
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      lastUpdated: Date.now(),
    });
  },
});

/**
 * Purchase credits (called after successful Stripe payment)
 */
export const purchaseCredits = mutation({
  args: {
    packageId: v.string(),
    stripePaymentId: v.string(),
    dollarAmount: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
    creditsAdded: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find the package
    const pkg = CREDIT_PACKAGES.find((p) => p.id === args.packageId);
    if (!pkg) {
      throw new Error("Invalid package");
    }

    const creditsToAdd = pkg.credits + pkg.bonus;

    // Get or create user credits
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      });
      userCredits = await ctx.db.get(creditsId);
      if (!userCredits) throw new Error("Failed to create credits");
    }

    // Update balance
    const newBalance = userCredits.balance + creditsToAdd;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      userId,
      type: "purchase",
      amount: creditsToAdd,
      balance: newBalance,
      description: `Purchased ${pkg.credits} credits${
        pkg.bonus > 0 ? ` (+${pkg.bonus} bonus)` : ""
      }`,
      metadata: {
        stripePaymentId: args.stripePaymentId,
        dollarAmount: args.dollarAmount,
        packageName: args.packageId,
      },
    });

    return {
      success: true,
      newBalance,
      creditsAdded: creditsToAdd,
    };
  },
});

/**
 * Award bonus credits (admin/promotional use)
 */
export const awardBonusCredits = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
  }),
  handler: async (ctx, args) => {
    // TODO: Add admin check here

    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      });
      userCredits = await ctx.db.get(creditsId);
      if (!userCredits) throw new Error("Failed to create credits");
    }

    const newBalance = userCredits.balance + args.amount;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lastUpdated: Date.now(),
    });

    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: "bonus",
      amount: args.amount,
      balance: newBalance,
      description: args.reason,
    });

    return {
      success: true,
      newBalance,
    };
  },
});

/**
 * Transfer credits (spend internally - called by purchase functions)
 */
export const spendCredits = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    relatedResourceId: v.optional(v.string()),
    relatedResourceType: v.optional(
      v.union(v.literal("sample"), v.literal("pack"), v.literal("credit_package"))
    ),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
    transactionId: v.id("creditTransactions"),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      throw new Error("No credits found");
    }

    if (userCredits.balance < args.amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = userCredits.balance - args.amount;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeSpent: userCredits.lifetimeSpent + args.amount,
      lastUpdated: Date.now(),
    });

    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      type: "spend",
      amount: -args.amount,
      balance: newBalance,
      description: args.description,
      relatedResourceId: args.relatedResourceId,
      relatedResourceType: args.relatedResourceType,
    });

    return {
      success: true,
      newBalance,
      transactionId,
    };
  },
});

/**
 * Earn credits (called when a creator makes a sale)
 */
export const earnCredits = mutation({
  args: {
    creatorId: v.string(),
    amount: v.number(),
    description: v.string(),
    relatedResourceId: v.optional(v.string()),
    relatedResourceType: v.optional(v.union(v.literal("sample"), v.literal("pack"))),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
  }),
  handler: async (ctx, args) => {
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.creatorId))
      .first();

    if (!userCredits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.creatorId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      });
      userCredits = await ctx.db.get(creditsId);
      if (!userCredits) throw new Error("Failed to create credits");
    }

    const newBalance = userCredits.balance + args.amount;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeEarned: userCredits.lifetimeEarned + args.amount,
      lastUpdated: Date.now(),
    });

    await ctx.db.insert("creditTransactions", {
      userId: args.creatorId,
      type: "earn",
      amount: args.amount,
      balance: newBalance,
      description: args.description,
      relatedResourceId: args.relatedResourceId,
      relatedResourceType: args.relatedResourceType,
    });

    return {
      success: true,
      newBalance,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for webhook use)
// ============================================================================

/**
 * Add credits to a user account (internal - for webhook use)
 * This does not require authentication since it's called from Stripe webhook
 */
export const addCredits = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("bonus"),
      v.literal("earn"),
      v.literal("refund")
    ),
    description: v.string(),
    metadata: v.optional(
      v.object({
        stripePaymentId: v.optional(v.string()),
        dollarAmount: v.optional(v.number()),
        packageName: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
    transactionId: v.id("creditTransactions"),
  }),
  handler: async (ctx, args) => {
    // Get or create user credits
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      });
      userCredits = await ctx.db.get(creditsId);
      if (!userCredits) throw new Error("Failed to create credits");
    }

    // Update balance
    const newBalance = userCredits.balance + args.amount;
    const updates: {
      balance: number;
      lifetimeEarned?: number;
      lastUpdated: number;
    } = {
      balance: newBalance,
      lastUpdated: Date.now(),
    };

    // Update lifetime earned for purchases and bonuses
    if (args.type === "purchase" || args.type === "bonus" || args.type === "earn") {
      updates.lifetimeEarned = userCredits.lifetimeEarned + args.amount;
    }

    await ctx.db.patch(userCredits._id, updates);

    // Record transaction
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      balance: newBalance,
      description: args.description,
      metadata: args.metadata,
    });

    return {
      success: true,
      newBalance,
      transactionId,
    };
  },
});
