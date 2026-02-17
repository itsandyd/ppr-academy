import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin, requireStoreOwner } from "./lib/auth";

/**
 * TAX, CURRENCY, REFUNDS & PAYOUTS
 * Supporting utilities for the monetization system
 */

// ===== TAX RATES =====

export const getTaxRate = query({
  args: {
    country: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let taxRate = await ctx.db
      .query("taxRates")
      .withIndex("by_country_state", (q: any) => 
        q.eq("country", args.country).eq("state", args.state)
      )
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!taxRate && args.state) {
      // Fallback to country-level tax
      taxRate = await ctx.db
        .query("taxRates")
        .withIndex("by_country", (q: any) => 
          q.eq("country", args.country).eq("isActive", true)
        )
        .first();
    }

    return taxRate;
  },
});

export const calculateTax = query({
  args: {
    amount: v.number(),
    country: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taxRate = await ctx.db
      .query("taxRates")
      .withIndex("by_country_state", (q: any) => 
        q.eq("country", args.country).eq("state", args.state)
      )
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!taxRate) {
      return { taxAmount: 0, totalAmount: args.amount, taxRate: 0 };
    }

    const taxAmount = Math.round((args.amount * taxRate.taxRate) / 100);
    const totalAmount = args.amount + taxAmount;

    return {
      taxAmount,
      totalAmount,
      taxRate: taxRate.taxRate,
      taxName: taxRate.taxName,
    };
  },
});

export const createTaxRate = mutation({
  args: {
    country: v.string(),
    state: v.optional(v.string()),
    taxName: v.string(),
    taxRate: v.number(),
    taxType: v.union(v.literal("vat"), v.literal("gst"), v.literal("sales_tax")),
    stripeTaxCodeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();

    const taxRateId = await ctx.db.insert("taxRates", {
      country: args.country,
      state: args.state,
      taxName: args.taxName,
      taxRate: args.taxRate,
      taxType: args.taxType,
      isActive: true,
      effectiveFrom: now,
      stripeTaxCodeId: args.stripeTaxCodeId,
    });

    return { success: true, taxRateId };
  },
});

// ===== CURRENCY RATES =====

export const getCurrencyRate = query({
  args: {
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const rate = await ctx.db
      .query("currencyRates")
      .withIndex("by_pair", (q: any) => 
        q.eq("baseCurrency", args.from).eq("targetCurrency", args.to)
      )
      .order("desc")
      .first();

    return rate;
  },
});

export const convertCurrency = query({
  args: {
    amount: v.number(),
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.from === args.to) {
      return { amount: args.amount, rate: 1 };
    }

    const rate = await ctx.db
      .query("currencyRates")
      .withIndex("by_pair", (q: any) => 
        q.eq("baseCurrency", args.from).eq("targetCurrency", args.to)
      )
      .order("desc")
      .first();

    if (!rate) {
      throw new Error(`No exchange rate found for ${args.from} to ${args.to}`);
    }

    const convertedAmount = Math.round(args.amount * rate.rate);

    return { amount: convertedAmount, rate: rate.rate };
  },
});

export const updateCurrencyRate = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    rate: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();

    const rateId = await ctx.db.insert("currencyRates", {
      baseCurrency: args.from,
      targetCurrency: args.to,
      rate: args.rate,
      lastUpdated: now,
      source: args.source,
    });

    return { success: true, rateId };
  },
});

// ===== REFUNDS =====

export const requestRefund = mutation({
  args: {
    orderId: v.string(),
    storeId: v.id("stores"),
    creatorId: v.string(),
    itemType: v.union(
      v.literal("course"),
      v.literal("product"),
      v.literal("subscription"),
      v.literal("bundle")
    ),
    itemId: v.string(),
    originalAmount: v.number(),
    refundAmount: v.number(),
    reason: v.string(),
    revokeAccess: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;
    const now = Date.now();
    const refundType = args.refundAmount === args.originalAmount ? "full" : "partial";

    const refundId = await ctx.db.insert("refunds", {
      orderId: args.orderId,
      userId,
      storeId: args.storeId,
      creatorId: args.creatorId,
      itemType: args.itemType,
      itemId: args.itemId,
      originalAmount: args.originalAmount,
      refundAmount: args.refundAmount,
      refundType,
      reason: args.reason,
      status: "requested",
      requestedBy: userId,
      revokeAccess: args.revokeAccess || true,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, refundId };
  },
});

export const approveRefund = mutation({
  args: {
    refundId: v.id("refunds"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    await ctx.db.patch(args.refundId, {
      status: "approved",
      approvedBy: identity.subject,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const processRefund = mutation({
  args: {
    refundId: v.id("refunds"),
    stripeRefundId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();

    await ctx.db.patch(args.refundId, {
      status: "processed",
      stripeRefundId: args.stripeRefundId,
      processedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const denyRefund = mutation({
  args: {
    refundId: v.id("refunds"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireAdmin(ctx);
    await ctx.db.patch(args.refundId, {
      status: "denied",
      approvedBy: identity.subject,
      denialReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getRefundsByStore = query({
  args: {
    storeId: v.id("stores"),
    status: v.optional(v.union(
      v.literal("requested"),
      v.literal("approved"),
      v.literal("processed"),
      v.literal("denied"),
      v.literal("canceled")
    )),
  },
  handler: async (ctx, args) => {
    let refunds = await ctx.db
      .query("refunds")
      .withIndex("by_store", (q: any) => q.eq("storeId", args.storeId))
      .take(1000);

    if (args.status) {
      refunds = refunds.filter((r) => r.status === args.status);
    }

    return refunds.sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

export const getUserRefunds = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const refunds = await ctx.db
      .query("refunds")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .take(1000);

    return refunds.sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

// ===== CREATOR PAYOUTS =====

export const getCreatorPayouts = query({
  args: {
    creatorId: v.string(),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("on_hold")
    )),
  },
  handler: async (ctx, args) => {
    let payouts = await ctx.db
      .query("creatorPayouts")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", args.creatorId))
      .take(1000);

    if (args.status) {
      payouts = payouts.filter((p) => p.status === args.status);
    }

    return payouts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createCreatorPayout = mutation({
  args: {
    creatorId: v.string(),
    storeId: v.id("stores"),
    amount: v.number(),
    currency: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    payoutMethod: v.string(),
    stripeConnectAccountId: v.optional(v.string()),
    totalSales: v.number(),
    grossRevenue: v.number(),
    platformFee: v.number(),
    paymentProcessingFee: v.number(),
    refunds: v.number(),
    netPayout: v.number(),
    taxWithheld: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();

    const payoutId = await ctx.db.insert("creatorPayouts", {
      creatorId: args.creatorId,
      storeId: args.storeId,
      amount: args.amount,
      currency: args.currency,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      status: "pending",
      payoutMethod: args.payoutMethod,
      stripeConnectAccountId: args.stripeConnectAccountId,
      totalSales: args.totalSales,
      grossRevenue: args.grossRevenue,
      platformFee: args.platformFee,
      paymentProcessingFee: args.paymentProcessingFee,
      refunds: args.refunds,
      netPayout: args.netPayout,
      taxWithheld: args.taxWithheld,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, payoutId };
  },
});

export const completeCreatorPayout = mutation({
  args: {
    payoutId: v.id("creatorPayouts"),
    stripeTransferId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();

    await ctx.db.patch(args.payoutId, {
      status: "completed",
      stripeTransferId: args.stripeTransferId,
      payoutDate: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const failCreatorPayout = mutation({
  args: {
    payoutId: v.id("creatorPayouts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.payoutId, {
      status: "failed",
      failureReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getPayoutSchedule = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    const schedule = await ctx.db
      .query("payoutSchedules")
      .withIndex("by_creator", (q: any) => q.eq("creatorId", args.creatorId))
      .first();

    return schedule;
  },
});

export const createPayoutSchedule = mutation({
  args: {
    storeId: v.id("stores"),
    frequency: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    minimumPayout: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireStoreOwner(ctx, args.storeId);
    const creatorId = identity.subject;
    const now = Date.now();

    // Calculate next payout date
    let nextPayoutDate = now;
    if (args.frequency === "weekly") {
      nextPayoutDate += 7 * 24 * 60 * 60 * 1000;
    } else if (args.frequency === "biweekly") {
      nextPayoutDate += 14 * 24 * 60 * 60 * 1000;
    } else {
      nextPayoutDate += 30 * 24 * 60 * 60 * 1000;
    }

    const scheduleId = await ctx.db.insert("payoutSchedules", {
      creatorId,
      storeId: args.storeId,
      frequency: args.frequency,
      dayOfWeek: args.dayOfWeek,
      dayOfMonth: args.dayOfMonth,
      minimumPayout: args.minimumPayout,
      isActive: true,
      nextPayoutDate,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, scheduleId };
  },
});

export const updatePayoutSchedule = mutation({
  args: {
    scheduleId: v.id("payoutSchedules"),
    frequency: v.optional(v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly"))),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    minimumPayout: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) {
      throw new Error("Payout schedule not found");
    }
    if (schedule.creatorId !== identity.subject) {
      throw new Error("Unauthorized: you don't own this payout schedule");
    }

    const { scheduleId, ...updates } = args;

    await ctx.db.patch(scheduleId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ===== PENDING EARNINGS =====

export const getCreatorPendingEarnings = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    // Get all completed purchases for this creator that haven't been paid out
    const purchases = await ctx.db
      .query("purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("isPaidOut"), false)
        )
      )
      .take(1000);

    // Filter to this creator's purchases
    const creatorPurchases = [];
    for (const purchase of purchases) {
      // Get the product/course to find the creator
      let creatorMatches = false;

      if (purchase.productId) {
        const product = await ctx.db.get(purchase.productId);
        if (product && (product as any).userId === args.creatorId) {
          creatorMatches = true;
        }
      } else if (purchase.courseId) {
        const course = await ctx.db.get(purchase.courseId);
        if (course && course.userId === args.creatorId) {
          creatorMatches = true;
        }
      }

      if (creatorMatches) {
        creatorPurchases.push(purchase);
      }
    }

    // Calculate totals
    const platformFeePercent = 10; // 10% platform fee
    const stripeFeePercent = 2.9;
    const stripeFeeFixed = 30; // $0.30 in cents

    let grossRevenue = 0;
    let platformFees = 0;
    let processingFees = 0;
    let refunds = 0;

    for (const purchase of creatorPurchases) {
      const amount = purchase.amount;
      grossRevenue += amount;
      platformFees += Math.round(amount * platformFeePercent / 100);
      processingFees += Math.round(amount * stripeFeePercent / 100) + stripeFeeFixed;
    }

    const netEarnings = grossRevenue - platformFees - processingFees - refunds;

    return {
      grossRevenue,
      platformFees,
      processingFees,
      refunds,
      netEarnings,
      totalSales: creatorPurchases.length,
      purchaseIds: creatorPurchases.map((p) => p._id),
    };
  },
});

export const markPurchasesAsPaidOut = mutation({
  args: {
    purchaseIds: v.array(v.id("purchases")),
    payoutId: v.id("creatorPayouts"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    for (const purchaseId of args.purchaseIds) {
      await ctx.db.patch(purchaseId, {
        isPaidOut: true,
        payoutId: args.payoutId,
        paidOutAt: Date.now(),
      });
    }
    return { success: true };
  },
});

// Process a payout (called by API route with Stripe)
export const processPayoutRequest = mutation({
  args: {
    creatorId: v.string(),
    storeId: v.id("stores"),
    amount: v.number(),
    currency: v.string(),
    stripeConnectAccountId: v.string(),
    purchaseIds: v.array(v.id("purchases")),
    grossRevenue: v.number(),
    platformFee: v.number(),
    processingFee: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const periodStart = now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const periodEnd = now;

    // Create payout record
    const payoutId = await ctx.db.insert("creatorPayouts", {
      creatorId: args.creatorId,
      storeId: args.storeId,
      amount: args.amount,
      currency: args.currency,
      periodStart,
      periodEnd,
      status: "processing",
      payoutMethod: "stripe_connect",
      stripeConnectAccountId: args.stripeConnectAccountId,
      totalSales: args.purchaseIds.length,
      grossRevenue: args.grossRevenue,
      platformFee: args.platformFee,
      paymentProcessingFee: args.processingFee,
      refunds: 0,
      netPayout: args.amount,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, payoutId };
  },
});

// ===== REFERRALS =====

export const createReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;
    // Generate unique referral code
    const code = userId.substring(0, 8).toUpperCase() +
                 Math.random().toString(36).substring(2, 6).toUpperCase();

    const now = Date.now();
    const expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 1 year

    const referralId = await ctx.db.insert("referrals", {
      referrerUserId: userId,
      referredUserId: "", // Will be filled when someone uses the code
      referralCode: code,
      status: "pending",
      rewardType: "credits",
      rewardAmount: 1000, // 1000 credits = $10
      rewardReferrer: 1000,
      rewardReferred: 500,
      hasReferredMadePurchase: false,
      expiresAt,
      createdAt: now,
    });

    return { success: true, referralId, code };
  },
});

export const applyReferralCode = mutation({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const referredUserId = identity.subject;
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_code", (q: any) => q.eq("referralCode", args.referralCode))
      .first();

    if (!referral) {
      throw new Error("Invalid referral code");
    }

    if (referral.status !== "pending") {
      throw new Error("Referral code already used");
    }

    const now = Date.now();

    if (referral.expiresAt && now > referral.expiresAt) {
      throw new Error("Referral code expired");
    }

    await ctx.db.patch(referral._id, {
      referredUserId,
      status: "completed",
      createdAt: now,
    });

    return { success: true, reward: referral.rewardReferred };
  },
});

export const getUserReferrals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q: any) => q.eq("referrerUserId", args.userId))
      .take(1000);

    return referrals.sort((a, b) => b.createdAt - a.createdAt);
  },
});





