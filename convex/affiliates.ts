import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireStoreOwner, requireAuth } from "./lib/auth";

/**
 * AFFILIATE PROGRAM
 * Handles affiliate registration, tracking, commissions, and payouts
 */

// ===== QUERIES =====

export const getAffiliateByCode = query({
  args: { affiliateCode: v.string() },
  handler: async (ctx, args) => {
    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_code", (q: any) => q.eq("affiliateCode", args.affiliateCode))
      .first();

    if (!affiliate || affiliate.status !== "active") {
      return null;
    }

    return affiliate;
  },
});

export const getAffiliateByUser = query({
  args: { 
    userId: v.string(),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let query = ctx.db
      .query("affiliates")
      .withIndex("by_affiliate_user", (q: any) => q.eq("affiliateUserId", args.userId));

    const affiliates = await query.collect();

    if (args.storeId) {
      return affiliates.find((a) => a.storeId === args.storeId) || null;
    }

    return affiliates;
  },
});

export const getAffiliatesByStore = query({
  args: { 
    storeId: v.id("stores"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("suspended"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    let affiliates = await ctx.db
      .query("affiliates")
      .withIndex("by_store", (q: any) => q.eq("storeId", args.storeId))
      .collect();

    if (args.status) {
      affiliates = affiliates.filter((a) => a.status === args.status);
    }

    return affiliates.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
});

export const getAffiliateStats = query({
  args: { affiliateId: v.id("affiliates") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const affiliate = await ctx.db.get(args.affiliateId);
    if (!affiliate) return null;

    // Get sales
    const sales = await ctx.db
      .query("affiliateSales")
      .withIndex("by_affiliate", (q: any) => q.eq("affiliateId", args.affiliateId))
      .collect();

    const pendingSales = sales.filter((s) => s.commissionStatus === "pending");
    const approvedSales = sales.filter((s) => s.commissionStatus === "approved");
    const paidSales = sales.filter((s) => s.commissionStatus === "paid");

    const pendingCommission = pendingSales.reduce((sum, s) => sum + s.commissionAmount, 0);
    const approvedCommission = approvedSales.reduce((sum, s) => sum + s.commissionAmount, 0);
    const paidCommission = paidSales.reduce((sum, s) => sum + s.commissionAmount, 0);

    // Get clicks
    const totalClicks = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_affiliate", (q: any) => q.eq("affiliateId", args.affiliateId))
      .collect();

    const convertedClicks = totalClicks.filter((c) => c.converted);

    // Calculate conversion rate
    const conversionRate = totalClicks.length > 0 
      ? (convertedClicks.length / totalClicks.length) * 100 
      : 0;

    // Recent sales
    const recentSales = sales
      .sort((a, b) => b.saleDate - a.saleDate)
      .slice(0, 10);

    return {
      ...affiliate,
      stats: {
        totalClicks: totalClicks.length,
        convertedClicks: convertedClicks.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        pendingCommission,
        approvedCommission,
        paidCommission,
        totalEarnings: affiliate.totalCommissionEarned,
        availableForPayout: approvedCommission,
      },
      recentSales,
    };
  },
});

export const getAffiliateSales = query({
  args: {
    affiliateId: v.id("affiliates"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("paid"),
      v.literal("reversed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let sales = await ctx.db
      .query("affiliateSales")
      .withIndex("by_affiliate", (q: any) => q.eq("affiliateId", args.affiliateId))
      .collect();

    if (args.status) {
      sales = sales.filter((s) => s.commissionStatus === args.status);
    }

    sales = sales.sort((a, b) => b.saleDate - a.saleDate);

    if (args.limit) {
      sales = sales.slice(0, args.limit);
    }

    return sales;
  },
});

export const getAffiliatePayouts = query({
  args: { affiliateId: v.id("affiliates") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const payouts = await ctx.db
      .query("affiliatePayouts")
      .withIndex("by_affiliate", (q: any) => q.eq("affiliateId", args.affiliateId))
      .collect();

    return payouts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getAffiliateClicks = query({
  args: {
    affiliateId: v.id("affiliates"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let clicks = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_affiliate", (q: any) => q.eq("affiliateId", args.affiliateId))
      .collect();

    if (args.startDate) {
      clicks = clicks.filter((c) => c.clickedAt >= args.startDate!);
    }
    if (args.endDate) {
      clicks = clicks.filter((c) => c.clickedAt <= args.endDate!);
    }

    return clicks.sort((a, b) => b.clickedAt - a.clickedAt);
  },
});

// ===== MUTATIONS =====

export const applyForAffiliate = mutation({
  args: {
    affiliateUserId: v.string(),
    storeId: v.id("stores"),
    creatorId: v.string(),
    affiliateCode: v.optional(v.string()),
    applicationNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // Check if already an affiliate
    const existing = await ctx.db
      .query("affiliates")
      .withIndex("by_affiliate_user", (q: any) => q.eq("affiliateUserId", args.affiliateUserId))
      .filter((q: any) => q.eq(q.field("storeId"), args.storeId))
      .first();

    if (existing) {
      throw new Error("You have already applied for this affiliate program");
    }

    // Generate unique affiliate code
    let code = args.affiliateCode?.toUpperCase() || 
               args.affiliateUserId.substring(0, 8).toUpperCase();
    
    // Check if code exists
    let codeExists = await ctx.db
      .query("affiliates")
      .withIndex("by_code", (q: any) => q.eq("affiliateCode", code))
      .first();

    // Add random suffix if needed
    while (codeExists) {
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      code = `${code}${suffix}`;
      codeExists = await ctx.db
        .query("affiliates")
        .withIndex("by_code", (q: any) => q.eq("affiliateCode", code))
        .first();
    }

    const now = Date.now();

    const affiliateId = await ctx.db.insert("affiliates", {
      affiliateUserId: args.affiliateUserId,
      storeId: args.storeId,
      creatorId: args.creatorId,
      affiliateCode: code,
      commissionRate: 20, // Default 20%
      commissionType: "percentage",
      status: "pending",
      totalClicks: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      cookieDuration: 30, // 30 days default
      applicationNote: args.applicationNote,
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, affiliateId, affiliateCode: code };
  },
});

export const approveAffiliate = mutation({
  args: {
    affiliateId: v.id("affiliates"),
    commissionRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const affiliate = await ctx.db.get(args.affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    await ctx.db.patch(args.affiliateId, {
      status: "active",
      commissionRate: args.commissionRate || affiliate.commissionRate,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const rejectAffiliate = mutation({
  args: {
    affiliateId: v.id("affiliates"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.affiliateId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const suspendAffiliate = mutation({
  args: { affiliateId: v.id("affiliates") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.affiliateId, {
      status: "suspended",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateAffiliateSettings = mutation({
  args: {
    affiliateId: v.id("affiliates"),
    commissionRate: v.optional(v.number()),
    payoutMethod: v.optional(v.union(v.literal("stripe"), v.literal("paypal"), v.literal("manual"))),
    payoutEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { affiliateId, ...updates } = args;

    await ctx.db.patch(affiliateId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const trackAffiliateClick = mutation({
  args: {
    affiliateCode: v.string(),
    visitorId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrerUrl: v.optional(v.string()),
    landingPage: v.string(),
  },
  handler: async (ctx, args) => {
    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_code", (q: any) => q.eq("affiliateCode", args.affiliateCode))
      .first();

    if (!affiliate || affiliate.status !== "active") {
      return { success: false, error: "Invalid or inactive affiliate code" };
    }

    const now = Date.now();

    await ctx.db.insert("affiliateClicks", {
      affiliateId: affiliate._id,
      affiliateCode: args.affiliateCode,
      visitorId: args.visitorId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      referrerUrl: args.referrerUrl,
      landingPage: args.landingPage,
      converted: false,
      clickedAt: now,
    });

    // Update affiliate stats
    await ctx.db.patch(affiliate._id, {
      totalClicks: affiliate.totalClicks + 1,
      updatedAt: now,
    });

    return { success: true, cookieDuration: affiliate.cookieDuration };
  },
});

export const recordAffiliateSale = mutation({
  args: {
    affiliateCode: v.string(),
    customerId: v.string(),
    storeId: v.id("stores"),
    orderId: v.string(),
    orderAmount: v.number(),
    itemType: v.union(v.literal("course"), v.literal("product"), v.literal("subscription")),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_code", (q: any) => q.eq("affiliateCode", args.affiliateCode))
      .first();

    if (!affiliate || affiliate.status !== "active") {
      return { success: false, error: "Invalid or inactive affiliate code" };
    }

    const now = Date.now();

    // Calculate commission
    let commissionAmount = 0;
    if (affiliate.commissionType === "percentage") {
      commissionAmount = Math.round((args.orderAmount * affiliate.commissionRate) / 100);
    } else {
      commissionAmount = affiliate.fixedCommissionAmount || 0;
    }

    // Create sale record
    const saleId = await ctx.db.insert("affiliateSales", {
      affiliateId: affiliate._id,
      affiliateUserId: affiliate.affiliateUserId,
      customerId: args.customerId,
      storeId: args.storeId,
      orderId: args.orderId,
      orderAmount: args.orderAmount,
      commissionRate: affiliate.commissionRate,
      commissionAmount,
      commissionStatus: "pending",
      isPaid: false,
      itemType: args.itemType,
      itemId: args.itemId,
      saleDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update affiliate stats
    await ctx.db.patch(affiliate._id, {
      totalSales: affiliate.totalSales + 1,
      totalRevenue: affiliate.totalRevenue + args.orderAmount,
      totalCommissionEarned: affiliate.totalCommissionEarned + commissionAmount,
      updatedAt: now,
    });

    // Mark click as converted
    const recentClick = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_code", (q: any) => q.eq("affiliateCode", args.affiliateCode))
      .filter((q: any) => q.eq(q.field("converted"), false))
      .order("desc")
      .first();

    if (recentClick) {
      await ctx.db.patch(recentClick._id, {
        converted: true,
        orderId: args.orderId,
      });
    }

    return { success: true, saleId, commissionAmount };
  },
});

export const approveSale = mutation({
  args: { saleId: v.id("affiliateSales") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const sale = await ctx.db.get(args.saleId);
    if (!sale) {
      throw new Error("Sale not found");
    }

    await ctx.db.patch(args.saleId, {
      commissionStatus: "approved",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const reverseSale = mutation({
  args: { saleId: v.id("affiliateSales") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const sale = await ctx.db.get(args.saleId);
    if (!sale) {
      throw new Error("Sale not found");
    }

    const affiliate = await ctx.db.get(sale.affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Update sale status
    await ctx.db.patch(args.saleId, {
      commissionStatus: "reversed",
      updatedAt: Date.now(),
    });

    // Adjust affiliate stats
    await ctx.db.patch(sale.affiliateId, {
      totalSales: Math.max(0, affiliate.totalSales - 1),
      totalRevenue: Math.max(0, affiliate.totalRevenue - sale.orderAmount),
      totalCommissionEarned: Math.max(0, affiliate.totalCommissionEarned - sale.commissionAmount),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const createAffiliatePayout = mutation({
  args: {
    affiliateId: v.id("affiliates"),
    saleIds: v.array(v.id("affiliateSales")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const affiliate = await ctx.db.get(args.affiliateId);
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Get approved sales
    const sales = await Promise.all(
      args.saleIds.map((id) => ctx.db.get(id))
    );

    const validSales = sales.filter(
      (s): s is NonNullable<typeof s> => s !== null && s.commissionStatus === "approved" && !s.isPaid
    );

    if (validSales.length === 0) {
      throw new Error("No valid sales for payout");
    }

    const totalAmount = validSales.reduce((sum, s) => sum + s.commissionAmount, 0);
    const now = Date.now();

    // Create payout
    const payoutId = await ctx.db.insert("affiliatePayouts", {
      affiliateId: args.affiliateId,
      affiliateUserId: affiliate.affiliateUserId,
      storeId: affiliate.storeId,
      creatorId: affiliate.creatorId,
      amount: totalAmount,
      currency: "USD",
      status: "pending",
      payoutMethod: affiliate.payoutMethod || "manual",
      salesIncluded: args.saleIds,
      totalSales: validSales.length,
      createdAt: now,
      updatedAt: now,
    });

    // Mark sales as paid
    await Promise.all(
      validSales.map((sale) =>
        ctx.db.patch(sale._id, {
          commissionStatus: "paid",
          isPaid: true,
          paidAt: now,
          payoutId,
          updatedAt: now,
        })
      )
    );

    // Update affiliate stats
    await ctx.db.patch(args.affiliateId, {
      totalCommissionPaid: affiliate.totalCommissionPaid + totalAmount,
      updatedAt: now,
    });

    return { success: true, payoutId, amount: totalAmount };
  },
});

export const completeAffiliatePayout = mutation({
  args: {
    payoutId: v.id("affiliatePayouts"),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.payoutId, {
      status: "completed",
      transactionId: args.transactionId,
      payoutDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const failAffiliatePayout = mutation({
  args: {
    payoutId: v.id("affiliatePayouts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) {
      throw new Error("Payout not found");
    }

    // Revert sales to approved status
    await Promise.all(
      payout.salesIncluded.map((saleId) =>
        ctx.db.patch(saleId, {
          commissionStatus: "approved",
          isPaid: false,
          paidAt: undefined,
          payoutId: undefined,
          updatedAt: Date.now(),
        })
      )
    );

    // Update affiliate stats
    const affiliate = await ctx.db.get(payout.affiliateId);
    if (affiliate) {
      await ctx.db.patch(payout.affiliateId, {
        totalCommissionPaid: Math.max(0, affiliate.totalCommissionPaid - payout.amount),
        updatedAt: Date.now(),
      });
    }

    // Update payout
    await ctx.db.patch(args.payoutId, {
      status: "failed",
      failureReason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});





