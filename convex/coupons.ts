import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * COUPON & DISCOUNT CODE SYSTEM
 * Handles promotional codes, discounts, and usage tracking
 */

// ===== QUERIES =====

export const validateCoupon = query({
  args: {
    code: v.string(),
    userId: v.string(),
    itemType: v.optional(v.union(v.literal("course"), v.literal("product"), v.literal("subscription"))),
    itemId: v.optional(v.string()),
    purchaseAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find coupon by code (case-insensitive)
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      return { valid: false, error: "Coupon code not found" };
    }

    // Check if active
    if (!coupon.isActive) {
      return { valid: false, error: "This coupon is no longer active" };
    }

    const now = Date.now();

    // Check validity period
    if (now < coupon.validFrom) {
      return { valid: false, error: "This coupon is not yet valid" };
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return { valid: false, error: "This coupon has expired" };
    }

    // Check max uses
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }

    // Check per-user limit
    if (coupon.maxUsesPerUser) {
      const userUsages = await ctx.db
        .query("couponUsages")
        .withIndex("by_user", (q: any) => 
          q.eq("userId", args.userId).eq("couponId", coupon._id)
        )
        .collect();

      if (userUsages.length >= coupon.maxUsesPerUser) {
        return { valid: false, error: "You have already used this coupon the maximum number of times" };
      }
    }

    // Check if first-time customer only
    if (coupon.firstTimeOnly) {
      // Check if user has made any previous purchases
      const previousPurchases = await ctx.db
        .query("purchases")
        .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
        .first();

      if (previousPurchases) {
        return { valid: false, error: "This coupon is only valid for first-time customers" };
      }
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && args.purchaseAmount) {
      if (args.purchaseAmount < coupon.minPurchaseAmount) {
        return {
          valid: false,
          error: `Minimum purchase amount is ${(coupon.minPurchaseAmount / 100).toFixed(2)} ${coupon.currency || "USD"}`,
        };
      }
    }

    // Check applicability to item type
    if (args.itemType && coupon.applicableTo !== "all") {
      if (coupon.applicableTo === "courses" && args.itemType !== "course") {
        return { valid: false, error: "This coupon is only valid for courses" };
      }
      if (coupon.applicableTo === "products" && args.itemType !== "product") {
        return { valid: false, error: "This coupon is only valid for digital products" };
      }
      if (coupon.applicableTo === "subscriptions" && args.itemType !== "subscription") {
        return { valid: false, error: "This coupon is only valid for subscriptions" };
      }

      // Check specific items
      if (coupon.applicableTo === "specific_items" && args.itemId) {
        const isApplicable =
          (args.itemType === "course" && coupon.specificCourseIds?.includes(args.itemId as Id<"courses">)) ||
          (args.itemType === "product" && coupon.specificProductIds?.includes(args.itemId as Id<"digitalProducts">)) ||
          (args.itemType === "subscription" && coupon.specificPlanIds?.includes(args.itemId as Id<"subscriptionPlans">));

        if (!isApplicable) {
          return { valid: false, error: "This coupon is not valid for this item" };
        }
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (args.purchaseAmount) {
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((args.purchaseAmount * coupon.discountValue) / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      // Ensure discount doesn't exceed purchase amount
      discountAmount = Math.min(discountAmount, args.purchaseAmount);
    }

    return {
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        currency: coupon.currency,
        stackable: coupon.stackable,
      },
      discountAmount,
      finalAmount: args.purchaseAmount ? args.purchaseAmount - discountAmount : 0,
    };
  },
});

export const getCouponsByStore = query({
  args: { 
    storeId: v.id("stores"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let coupons = await ctx.db
      .query("coupons")
      .withIndex("by_store", (q: any) => q.eq("storeId", args.storeId))
      .collect();

    if (!args.includeInactive) {
      coupons = coupons.filter((c) => c.isActive);
    }

    // Enrich with usage stats
    const enriched = await Promise.all(
      coupons.map(async (coupon) => {
        const usages = await ctx.db
          .query("couponUsages")
          .withIndex("by_coupon", (q: any) => q.eq("couponId", coupon._id))
          .collect();

        const totalRevenue = usages.reduce((sum, u) => sum + u.discountApplied, 0);

        return {
          ...coupon,
          totalUsages: usages.length,
          totalDiscountGiven: totalRevenue,
          remainingUses: coupon.maxUses ? coupon.maxUses - coupon.currentUses : null,
        };
      })
    );

    return enriched;
  },
});

export const getCouponDetails = query({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) return null;

    const usages = await ctx.db
      .query("couponUsages")
      .withIndex("by_coupon", (q: any) => q.eq("couponId", args.couponId))
      .collect();

    const totalDiscountGiven = usages.reduce((sum, u) => sum + u.discountApplied, 0);

    return {
      ...coupon,
      totalUsages: usages.length,
      totalDiscountGiven,
      recentUsages: usages.slice(-10),
    };
  },
});

export const getUserCouponUsages = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const usages = await ctx.db
      .query("couponUsages")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    // Enrich with coupon details
    const enriched = await Promise.all(
      usages.map(async (usage) => {
        const coupon = await ctx.db.get(usage.couponId);
        return { ...usage, coupon };
      })
    );

    return enriched;
  },
});

// ===== MUTATIONS =====

export const createCoupon = mutation({
  args: {
    code: v.string(),
    storeId: v.id("stores"),
    creatorId: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    discountValue: v.number(),
    currency: v.optional(v.string()),
    applicableTo: v.union(
      v.literal("all"),
      v.literal("courses"),
      v.literal("products"),
      v.literal("subscriptions"),
      v.literal("specific_items")
    ),
    specificCourseIds: v.optional(v.array(v.id("courses"))),
    specificProductIds: v.optional(v.array(v.id("digitalProducts"))),
    specificPlanIds: v.optional(v.array(v.id("subscriptionPlans"))),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
    firstTimeOnly: v.optional(v.boolean()),
    stackable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if code already exists (case-insensitive)
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("A coupon with this code already exists");
    }

    const now = Date.now();

    const couponId = await ctx.db.insert("coupons", {
      code: args.code.toUpperCase(),
      storeId: args.storeId,
      creatorId: args.creatorId,
      discountType: args.discountType,
      discountValue: args.discountValue,
      currency: args.currency,
      applicableTo: args.applicableTo,
      specificCourseIds: args.specificCourseIds,
      specificProductIds: args.specificProductIds,
      specificPlanIds: args.specificPlanIds,
      maxUses: args.maxUses,
      currentUses: 0,
      maxUsesPerUser: args.maxUsesPerUser,
      minPurchaseAmount: args.minPurchaseAmount,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      isActive: true,
      firstTimeOnly: args.firstTimeOnly || false,
      stackable: args.stackable || false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, couponId };
  },
});

export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    discountValue: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    stackable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { couponId, ...updates } = args;

    await ctx.db.patch(couponId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deactivateCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.couponId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const applyCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    userId: v.string(),
    discountApplied: v.number(),
    orderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Record usage
    await ctx.db.insert("couponUsages", {
      couponId: args.couponId,
      userId: args.userId,
      orderId: args.orderId,
      discountApplied: args.discountApplied,
      usedAt: Date.now(),
    });

    // Increment usage count
    await ctx.db.patch(args.couponId, {
      currentUses: coupon.currentUses + 1,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Check if it has been used
    const usages = await ctx.db
      .query("couponUsages")
      .withIndex("by_coupon", (q: any) => q.eq("couponId", args.couponId))
      .collect();

    if (usages.length > 0) {
      // Soft delete by deactivating
      await ctx.db.patch(args.couponId, {
        isActive: false,
        updatedAt: Date.now(),
      });
      return { success: true, message: "Coupon deactivated (has usage history)" };
    }

    // Hard delete if never used
    await ctx.db.delete(args.couponId);
    return { success: true, message: "Coupon deleted" };
  },
});

export const bulkCreateCoupons = mutation({
  args: {
    storeId: v.id("stores"),
    creatorId: v.string(),
    prefix: v.string(),
    count: v.number(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    discountValue: v.number(),
    currency: v.optional(v.string()),
    applicableTo: v.union(
      v.literal("all"),
      v.literal("courses"),
      v.literal("products"),
      v.literal("subscriptions")
    ),
    maxUsesPerCoupon: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.count > 100) {
      throw new Error("Maximum 100 coupons per bulk creation");
    }

    const now = Date.now();
    const couponIds: Id<"coupons">[] = [];

    for (let i = 0; i < args.count; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${args.prefix}${randomSuffix}`;

      const couponId = await ctx.db.insert("coupons", {
        code,
        storeId: args.storeId,
        creatorId: args.creatorId,
        discountType: args.discountType,
        discountValue: args.discountValue,
        currency: args.currency,
        applicableTo: args.applicableTo,
        maxUses: args.maxUsesPerCoupon,
        currentUses: 0,
        maxUsesPerUser: 1, // Each code can only be used once per user in bulk
        validFrom: args.validFrom,
        validUntil: args.validUntil,
        isActive: true,
        firstTimeOnly: false,
        stackable: false,
        createdAt: now,
        updatedAt: now,
      });

      couponIds.push(couponId);
    }

    return { success: true, created: couponIds.length, couponIds };
  },
});

