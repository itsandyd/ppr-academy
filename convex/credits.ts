import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get user's current credit balance
 */
export const getUserCredits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return null if not authenticated (instead of throwing)
      return null;
    }
    const userId = identity.subject;

    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      // Initialize with 0 credits if not exists
      return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
      };
    }

    return userCredits;
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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit + offset);

    return transactions.slice(offset);
  },
});

/**
 * Get available credit packages
 */
export const getCreditPackages = query({
  args: {},
  handler: async (ctx) => {
    const packages = await ctx.db
      .query("creditPackages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();

    return packages.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get credit stats for creator dashboard
 */
export const getCreatorCreditStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get user credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Get earnings this month
    const now = Date.now();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyTransactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", userId).eq("type", "earn")
      )
      .filter((q) => q.gte(q.field("_creationTime"), monthStart.getTime()))
      .collect();

    const monthlyEarnings = monthlyTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    return {
      balance: userCredits?.balance || 0,
      lifetimeEarned: userCredits?.lifetimeEarned || 0,
      monthlyEarnings,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Initialize user credits (called on first access)
 */
export const initializeUserCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Check if already exists
    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new
    const creditsId = await ctx.db.insert("userCredits", {
      userId,
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      lastUpdated: Date.now(),
    });

    return creditsId;
  },
});

/**
 * Add credits to user account (for purchases or bonuses)
 */
export const addCredits = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    type: v.union(v.literal("purchase"), v.literal("bonus")),
    description: v.string(),
    metadata: v.optional(
      v.object({
        stripePaymentId: v.optional(v.string()),
        dollarAmount: v.optional(v.number()),
        packageName: v.optional(v.string()),
      })
    ),
  },
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
      if (!userCredits) throw new Error("Failed to create user credits");
    }

    // Update balance
    const newBalance = userCredits.balance + args.amount;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      balance: newBalance,
      description: args.description,
      metadata: args.metadata,
    });

    return { success: true, newBalance };
  },
});

/**
 * Spend credits on a sample or pack
 */
export const spendCredits = mutation({
  args: {
    amount: v.number(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("sample"), v.literal("pack")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get user credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits) {
      throw new Error("User credits not found");
    }

    if (userCredits.balance < args.amount) {
      throw new Error("Insufficient credits");
    }

    // Update balance and lifetime spent
    const newBalance = userCredits.balance - args.amount;
    const newLifetimeSpent = userCredits.lifetimeSpent + args.amount;

    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeSpent: newLifetimeSpent,
      lastUpdated: Date.now(),
    });

    // Record transaction
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      type: "spend",
      amount: -args.amount,
      balance: newBalance,
      description: args.description,
      relatedResourceId: args.resourceId,
      relatedResourceType: args.resourceType,
    });

    return { success: true, newBalance, transactionId };
  },
});

/**
 * Credit creator when their sample/pack is purchased
 */
export const creditCreator = mutation({
  args: {
    creatorId: v.string(),
    amount: v.number(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("sample"), v.literal("pack")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create creator credits
    let creatorCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.creatorId))
      .first();

    if (!creatorCredits) {
      const creditsId = await ctx.db.insert("userCredits", {
        userId: args.creatorId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: Date.now(),
      });
      creatorCredits = await ctx.db.get(creditsId);
      if (!creatorCredits) throw new Error("Failed to create creator credits");
    }

    // Calculate platform fee (10%)
    const platformFee = Math.floor(args.amount * 0.1);
    const creatorEarnings = args.amount - platformFee;

    // Update creator balance
    const newBalance = creatorCredits.balance + creatorEarnings;
    const newLifetimeEarned = creatorCredits.lifetimeEarned + creatorEarnings;

    await ctx.db.patch(creatorCredits._id, {
      balance: newBalance,
      lifetimeEarned: newLifetimeEarned,
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.creatorId,
      type: "earn",
      amount: creatorEarnings,
      balance: newBalance,
      description: args.description,
      relatedResourceId: args.resourceId,
      relatedResourceType: args.resourceType,
    });

    return { success: true, creatorEarnings, platformFee };
  },
});

/**
 * Refund credits (admin function or failed transaction)
 */
export const refundCredits = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    description: v.string(),
    originalTransactionId: v.optional(v.id("creditTransactions")),
  },
  handler: async (ctx, args) => {
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits) {
      throw new Error("User credits not found");
    }

    // Add credits back
    const newBalance = userCredits.balance + args.amount;

    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lastUpdated: Date.now(),
    });

    // Record refund transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: "refund",
      amount: args.amount,
      balance: newBalance,
      description: args.description,
    });

    return { success: true, newBalance };
  },
});

