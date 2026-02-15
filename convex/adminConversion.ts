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

    // Get recent users (scoped by _creationTime)
    const allUsers = await ctx.db.query("users").take(10000);
    const recentUsers = allUsers.filter((u) => u._creationTime >= startTime);

    // Get recent enrollments (scoped by _creationTime)
    const allEnrollments = await ctx.db.query("enrollments").take(10000);
    const recentEnrollments = allEnrollments.filter((e) => e._creationTime >= startTime);

    // Get recent completed purchases (scoped)
    const allPurchases = await ctx.db.query("purchases").take(10000);
    const recentPurchases = allPurchases.filter(
      (p) => p._creationTime >= startTime && p.status === "completed"
    );

    // Get course views from analytics events (scoped by timestamp index)
    const analyticsEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .take(10000);
    const courseViews = analyticsEvents.filter(
      (e) => e.eventType === "course_view"
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

    // Use pre-aggregated metrics for AOV, repeat rate, and cart abandonment
    const metrics = await ctx.db.query("adminMetrics").first();

    if (!metrics) {
      return {
        visitToSignup: 0,
        signupToEnroll: 0,
        enrollToPurchase: 0,
        overallConversion: 0,
        averageOrderValue: 0,
        cartAbandonmentRate: 0,
        repeatPurchaseRate: 0,
      };
    }

    // For signup-to-enroll and enroll-to-purchase, we still need unique user counts
    // from enrollments and purchases, but we can use the aggregated totals
    const totalUsers = metrics.totalUsers;

    // We need unique enrolling/purchasing users — load only enrollments + purchases
    const enrollments = await ctx.db.query("enrollments").take(10000);
    const purchases = await ctx.db.query("purchases").take(10000);
    const completedPurchases = purchases.filter((p) => p.status === "completed");

    const usersWithEnrollments = new Set(enrollments.map((e) => e.userId)).size;
    const usersWithPurchases = new Set(completedPurchases.map((p) => p.userId)).size;

    return {
      visitToSignup: 100, // Would need analytics tracking
      signupToEnroll: totalUsers > 0 ? (usersWithEnrollments / totalUsers) * 100 : 0,
      enrollToPurchase: usersWithEnrollments > 0
        ? (usersWithPurchases / usersWithEnrollments) * 100
        : 0,
      overallConversion: totalUsers > 0 ? (usersWithPurchases / totalUsers) * 100 : 0,
      averageOrderValue: (metrics.averageOrderValue || 0) / 100,
      cartAbandonmentRate: metrics.cartAbandonmentRate || 0,
      repeatPurchaseRate: metrics.repeatPurchaseRate || 0,
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

    // Get non-completed purchases as "abandoned carts" — scope by status index
    const pendingPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(10000);
    const abandonedPurchases = pendingPurchases.filter(
      (p) => p._creationTime >= startTime
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

    const coupons = await ctx.db.query("coupons").take(10000);
    const couponUsages = await ctx.db.query("couponUsages").take(10000);

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

    // Get analytics events with UTM data — scoped by timestamp index
    const recentEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .take(10000);

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
