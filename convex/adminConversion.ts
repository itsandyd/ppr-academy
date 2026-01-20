import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Admin Conversion Optimization Queries
 * Track funnels, cart abandonment, and conversion metrics
 */

// Helper to verify admin status
async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) return;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || !user.admin) {
    throw new Error("Unauthorized - Admin access required");
  }
  return user;
}

/**
 * Get purchase funnel analytics
 */
export const getPurchaseFunnel = query({
  args: {
    clerkId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  returns: v.object({
    steps: v.array(
      v.object({
        name: v.string(),
        count: v.number(),
        conversionRate: v.number(),
        dropOffRate: v.number(),
      })
    ),
    overallConversion: v.number(),
    averageTimeToConvert: v.number(),
  }),
  handler: async (ctx, { clerkId, days = 30 }) => {
    await verifyAdmin(ctx, clerkId);

    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    // Get all users created in period
    const users = await ctx.db.query("users").collect();
    const recentUsers = users.filter((u) => u._creationTime >= startTime);

    // Get enrollments in period
    const enrollments = await ctx.db.query("enrollments").collect();
    const recentEnrollments = enrollments.filter((e) => e._creationTime >= startTime);

    // Get purchases in period
    const purchases = await ctx.db.query("purchases").collect();
    const recentPurchases = purchases.filter(
      (p) => p._creationTime >= startTime && p.status === "completed"
    );

    // Get course views (from analytics events if available)
    const analyticsEvents = await ctx.db.query("analyticsEvents").collect();
    const courseViews = analyticsEvents.filter(
      (e) => e.timestamp >= startTime && e.eventType === "course_view"
    );

    // Calculate funnel steps
    const visitCount = recentUsers.length + courseViews.length; // Approximate
    const signupCount = recentUsers.length;
    const viewCount = new Set(courseViews.map((v) => v.userId)).size;
    const enrollCount = new Set(recentEnrollments.map((e) => e.userId)).size;
    const purchaseCount = new Set(recentPurchases.map((p) => p.userId)).size;

    const steps = [
      {
        name: "Visit",
        count: visitCount,
        conversionRate: 100,
        dropOffRate: 0,
      },
      {
        name: "Sign Up",
        count: signupCount,
        conversionRate: visitCount > 0 ? (signupCount / visitCount) * 100 : 0,
        dropOffRate: visitCount > 0 ? ((visitCount - signupCount) / visitCount) * 100 : 0,
      },
      {
        name: "View Course",
        count: viewCount,
        conversionRate: signupCount > 0 ? (viewCount / signupCount) * 100 : 0,
        dropOffRate: signupCount > 0 ? ((signupCount - viewCount) / signupCount) * 100 : 0,
      },
      {
        name: "Enroll",
        count: enrollCount,
        conversionRate: viewCount > 0 ? (enrollCount / viewCount) * 100 : 0,
        dropOffRate: viewCount > 0 ? ((viewCount - enrollCount) / viewCount) * 100 : 0,
      },
      {
        name: "Purchase",
        count: purchaseCount,
        conversionRate: enrollCount > 0 ? (purchaseCount / enrollCount) * 100 : 0,
        dropOffRate: enrollCount > 0 ? ((enrollCount - purchaseCount) / enrollCount) * 100 : 0,
      },
    ];

    return {
      steps,
      overallConversion: visitCount > 0 ? (purchaseCount / visitCount) * 100 : 0,
      averageTimeToConvert: 0, // Would need event timestamps
    };
  },
});

/**
 * Get conversion metrics summary
 */
export const getConversionMetrics = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    visitToSignup: v.number(),
    signupToEnroll: v.number(),
    enrollToPurchase: v.number(),
    overallConversion: v.number(),
    averageOrderValue: v.number(),
    cartAbandonmentRate: v.number(),
    repeatPurchaseRate: v.number(),
  }),
  handler: async (ctx, { clerkId }) => {
    await verifyAdmin(ctx, clerkId);

    const users = await ctx.db.query("users").collect();
    const enrollments = await ctx.db.query("enrollments").collect();
    const purchases = await ctx.db.query("purchases").collect();
    const completedPurchases = purchases.filter((p) => p.status === "completed");

    const totalUsers = users.length;
    const usersWithEnrollments = new Set(enrollments.map((e) => e.userId)).size;
    const usersWithPurchases = new Set(completedPurchases.map((p) => p.userId)).size;

    // Calculate average order value
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const averageOrderValue = completedPurchases.length > 0
      ? totalRevenue / completedPurchases.length
      : 0;

    // Calculate repeat purchase rate
    const purchasesByUser = new Map<string, number>();
    for (const purchase of completedPurchases) {
      const count = purchasesByUser.get(purchase.userId) || 0;
      purchasesByUser.set(purchase.userId, count + 1);
    }
    const repeatBuyers = Array.from(purchasesByUser.values()).filter((c) => c > 1).length;
    const repeatPurchaseRate = usersWithPurchases > 0
      ? (repeatBuyers / usersWithPurchases) * 100
      : 0;

    // Estimate cart abandonment (non-completed purchases vs completed)
    const incompletePurchases = purchases.filter(
      (p) => p.status !== "completed" && p.status !== "refunded"
    );
    const cartAbandonmentRate = purchases.length > 0
      ? (incompletePurchases.length / purchases.length) * 100
      : 0;

    return {
      visitToSignup: 100, // Would need analytics tracking
      signupToEnroll: totalUsers > 0 ? (usersWithEnrollments / totalUsers) * 100 : 0,
      enrollToPurchase: usersWithEnrollments > 0
        ? (usersWithPurchases / usersWithEnrollments) * 100
        : 0,
      overallConversion: totalUsers > 0 ? (usersWithPurchases / totalUsers) * 100 : 0,
      averageOrderValue,
      cartAbandonmentRate,
      repeatPurchaseRate,
    };
  },
});

/**
 * Get abandoned carts/purchases
 */
export const getAbandonedCarts = query({
  args: {
    clerkId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      productType: v.string(),
      productName: v.string(),
      amount: v.number(),
      abandonedAt: v.number(),
      daysSinceAbandoned: v.number(),
    })
  ),
  handler: async (ctx, { clerkId, days = 30 }) => {
    await verifyAdmin(ctx, clerkId);

    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    // Get non-completed purchases as "abandoned carts"
    const purchases = await ctx.db.query("purchases").collect();
    const abandonedPurchases = purchases.filter(
      (p) =>
        p.status !== "completed" &&
        p.status !== "refunded" &&
        p._creationTime >= startTime
    );

    const results = [];

    for (const purchase of abandonedPurchases) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
        .first();

      let productName = "Unknown";
      let productType = "unknown";

      if (purchase.courseId) {
        productType = "course";
        const course = await ctx.db.get(purchase.courseId);
        productName = course?.title || "Unknown Course";
      } else if (purchase.productId) {
        productType = "product";
        const product = await ctx.db.get(purchase.productId);
        productName = product?.title || "Unknown Product";
      }

      results.push({
        userId: purchase.userId,
        userName: user?.name || user?.firstName,
        userEmail: user?.email,
        productType,
        productName,
        amount: (purchase.amount || 0) / 100,
        abandonedAt: purchase._creationTime,
        daysSinceAbandoned: Math.floor((now - purchase._creationTime) / (24 * 60 * 60 * 1000)),
      });
    }

    return results.sort((a, b) => b.abandonedAt - a.abandonedAt);
  },
});

/**
 * Get coupon performance for admin dashboard
 */
export const getCouponPerformance = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    totalCoupons: v.number(),
    activeCoupons: v.number(),
    totalUsages: v.number(),
    totalDiscountGiven: v.number(),
    topCoupons: v.array(
      v.object({
        code: v.string(),
        usageCount: v.number(),
        discountGiven: v.number(),
        conversionRate: v.number(),
        isActive: v.boolean(),
      })
    ),
    recentUsages: v.array(
      v.object({
        code: v.string(),
        userName: v.optional(v.string()),
        discountApplied: v.number(),
        usedAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, { clerkId }) => {
    await verifyAdmin(ctx, clerkId);

    const coupons = await ctx.db.query("coupons").collect();
    const couponUsages = await ctx.db.query("couponUsages").collect();

    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const totalUsages = couponUsages.length;
    const totalDiscountGiven = couponUsages.reduce((sum, u) => sum + u.discountApplied, 0) / 100;

    // Calculate per-coupon stats
    const couponStats = new Map<
      string,
      { code: string; usageCount: number; discountGiven: number; isActive: boolean }
    >();

    for (const coupon of coupons) {
      couponStats.set(coupon._id, {
        code: coupon.code,
        usageCount: 0,
        discountGiven: 0,
        isActive: coupon.isActive,
      });
    }

    for (const usage of couponUsages) {
      const stats = couponStats.get(usage.couponId);
      if (stats) {
        stats.usageCount++;
        stats.discountGiven += usage.discountApplied / 100;
      }
    }

    const topCoupons = Array.from(couponStats.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((s) => ({
        ...s,
        conversionRate: 0, // Would need view tracking
      }));

    // Recent usages
    const recentUsages = [];
    const sortedUsages = couponUsages.sort((a, b) => b.usedAt - a.usedAt).slice(0, 10);

    for (const usage of sortedUsages) {
      const coupon = coupons.find((c) => c._id === usage.couponId);
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", usage.userId))
        .first();

      recentUsages.push({
        code: coupon?.code || "Unknown",
        userName: user?.name || user?.firstName,
        discountApplied: usage.discountApplied / 100,
        usedAt: usage.usedAt,
      });
    }

    return {
      totalCoupons,
      activeCoupons,
      totalUsages,
      totalDiscountGiven,
      topCoupons,
      recentUsages,
    };
  },
});

/**
 * Get conversion by traffic source
 */
export const getConversionBySource = query({
  args: {
    clerkId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      source: v.string(),
      visitors: v.number(),
      signups: v.number(),
      purchases: v.number(),
      revenue: v.number(),
      conversionRate: v.number(),
    })
  ),
  handler: async (ctx, { clerkId, days = 30 }) => {
    await verifyAdmin(ctx, clerkId);

    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    // Get analytics events with UTM data
    const events = await ctx.db.query("analyticsEvents").collect();
    const recentEvents = events.filter((e) => e.timestamp >= startTime);

    // Group by source (using metadata if available)
    const sourceData = new Map<
      string,
      { visitors: Set<string>; signups: number; purchases: number; revenue: number }
    >();

    for (const event of recentEvents) {
      // Try to get source from metadata
      const metadata = event.metadata as Record<string, any> | undefined;
      const source = metadata?.utmSource || metadata?.referrer || "direct";

      if (!sourceData.has(source)) {
        sourceData.set(source, {
          visitors: new Set(),
          signups: 0,
          purchases: 0,
          revenue: 0,
        });
      }

      const data = sourceData.get(source)!;

      if (event.userId || event.sessionId) {
        data.visitors.add(event.userId || event.sessionId || "");
      }

      if (event.eventType === "signup") {
        data.signups++;
      }

      if (event.eventType === "purchase") {
        data.purchases++;
        data.revenue += (metadata?.value || 0) / 100;
      }
    }

    return Array.from(sourceData.entries())
      .map(([source, data]) => ({
        source,
        visitors: data.visitors.size,
        signups: data.signups,
        purchases: data.purchases,
        revenue: data.revenue,
        conversionRate: data.visitors.size > 0
          ? (data.purchases / data.visitors.size) * 100
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  },
});
