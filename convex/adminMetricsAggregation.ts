import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================================
// Internal queries — each counts one table so we stay within query limits
// ============================================================================

export const countUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(10000);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newUsersThisMonth = users.filter((u) => u._creationTime > thirtyDaysAgo).length;
    const creators = users.filter((u) => u.isCreator === true).length;

    // Build daily signups for last 30 days
    const dailySignups: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      dailySignups[dateStr] = users.filter(
        (u) => u._creationTime >= dayStart && u._creationTime < dayEnd
      ).length;
    }

    return {
      totalUsers: users.length,
      totalCreators: creators,
      newUsersThisMonth,
      dailySignups,
    };
  },
});

export const countCourses = internalQuery({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").take(10000);
    return {
      totalCourses: courses.length,
      totalPublishedCourses: courses.filter((c) => c.isPublished).length,
    };
  },
});

export const countProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").take(10000);
    return { totalProducts: products.length };
  },
});

export const countStores = internalQuery({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").take(10000);
    return { totalStores: stores.length };
  },
});

export const countEnrollments = internalQuery({
  args: {},
  handler: async (ctx) => {
    const enrollments = await ctx.db.query("enrollments").take(10000);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Active users from recent enrollments
    const recentEnrollments = enrollments.filter((e) => e._creationTime > thirtyDaysAgo);
    const activeEnrollmentUserIds = new Set(recentEnrollments.map((e) => e.userId));

    // Build daily enrollments for last 30 days
    const dailyEnrollments: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      dailyEnrollments[dateStr] = enrollments.filter(
        (e) => e._creationTime >= dayStart && e._creationTime < dayEnd
      ).length;
    }

    return {
      totalEnrollments: enrollments.length,
      activeEnrollmentUserIds: Array.from(activeEnrollmentUserIds),
      dailyEnrollments,
    };
  },
});

export const countPurchases = internalQuery({
  args: {},
  handler: async (ctx) => {
    const purchases = await ctx.db.query("purchases").take(10000);
    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const recentCompleted = completedPurchases.filter((p) => p._creationTime > thirtyDaysAgo);
    const monthlyRevenue = recentCompleted.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Active users from recent purchases
    const activePurchaseUserIds = new Set(recentCompleted.map((p) => p.userId));

    // Average order value
    const averageOrderValue =
      completedPurchases.length > 0
        ? totalRevenue / completedPurchases.length
        : 0;

    // Repeat purchase rate
    const purchasesByUser = new Map<string, number>();
    for (const purchase of completedPurchases) {
      const count = purchasesByUser.get(purchase.userId) || 0;
      purchasesByUser.set(purchase.userId, count + 1);
    }
    const uniqueBuyers = purchasesByUser.size;
    const repeatBuyers = Array.from(purchasesByUser.values()).filter((c) => c > 1).length;
    const repeatPurchaseRate = uniqueBuyers > 0 ? (repeatBuyers / uniqueBuyers) * 100 : 0;

    // Cart abandonment rate
    const incompletePurchases = purchases.filter(
      (p) => p.status !== "completed" && p.status !== "refunded"
    );
    const cartAbandonmentRate =
      purchases.length > 0 ? (incompletePurchases.length / purchases.length) * 100 : 0;

    // Build daily revenue and purchase counts for last 30 days
    const dailyRevenue: Record<string, number> = {};
    const dailyPurchaseCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayPurchases = completedPurchases.filter(
        (p) => p._creationTime >= dayStart && p._creationTime < dayEnd
      );
      dailyRevenue[dateStr] = dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      dailyPurchaseCounts[dateStr] = dayPurchases.length;
    }

    return {
      totalPurchases: completedPurchases.length,
      totalRevenue,
      monthlyRevenue,
      activePurchaseUserIds: Array.from(activePurchaseUserIds),
      averageOrderValue,
      repeatPurchaseRate,
      cartAbandonmentRate,
      dailyRevenue,
      dailyPurchaseCounts,
    };
  },
});

// ============================================================================
// Upsert mutation — writes the single metrics row
// ============================================================================

export const updateMetrics = internalMutation({
  args: {
    totalUsers: v.number(),
    totalCreators: v.number(),
    totalCourses: v.number(),
    totalPublishedCourses: v.number(),
    totalProducts: v.number(),
    totalStores: v.number(),
    totalEnrollments: v.number(),
    totalPurchases: v.number(),
    totalRevenue: v.number(),
    monthlyRevenue: v.number(),
    platformFees: v.number(),
    activeUsers: v.number(),
    newUsersThisMonth: v.number(),
    dailySignups: v.any(),
    dailyRevenue: v.any(),
    dailyPurchaseCounts: v.any(),
    dailyEnrollments: v.any(),
    averageOrderValue: v.number(),
    repeatPurchaseRate: v.number(),
    cartAbandonmentRate: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("adminMetrics").first();

    const data = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("adminMetrics", data);
    }
  },
});

// ============================================================================
// Aggregation action — orchestrates all the counting queries
// ============================================================================

export const aggregateAdminMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    // Run all counting queries in parallel
    const [userData, courseData, productData, storeData, enrollmentData, purchaseData] =
      await Promise.all([
        ctx.runQuery(internal.adminMetricsAggregation.countUsers),
        ctx.runQuery(internal.adminMetricsAggregation.countCourses),
        ctx.runQuery(internal.adminMetricsAggregation.countProducts),
        ctx.runQuery(internal.adminMetricsAggregation.countStores),
        ctx.runQuery(internal.adminMetricsAggregation.countEnrollments),
        ctx.runQuery(internal.adminMetricsAggregation.countPurchases),
      ]);

    // Merge active user sets from enrollments and purchases
    const activeUserIds = new Set([
      ...enrollmentData.activeEnrollmentUserIds,
      ...purchaseData.activePurchaseUserIds,
    ]);

    await ctx.runMutation(internal.adminMetricsAggregation.updateMetrics, {
      totalUsers: userData.totalUsers,
      totalCreators: userData.totalCreators,
      totalCourses: courseData.totalCourses,
      totalPublishedCourses: courseData.totalPublishedCourses,
      totalProducts: productData.totalProducts,
      totalStores: storeData.totalStores,
      totalEnrollments: enrollmentData.totalEnrollments,
      totalPurchases: purchaseData.totalPurchases,
      totalRevenue: purchaseData.totalRevenue,
      monthlyRevenue: purchaseData.monthlyRevenue,
      platformFees: 0, // Platform fees not tracked separately yet
      activeUsers: activeUserIds.size,
      newUsersThisMonth: userData.newUsersThisMonth,
      dailySignups: userData.dailySignups,
      dailyRevenue: purchaseData.dailyRevenue,
      dailyPurchaseCounts: purchaseData.dailyPurchaseCounts,
      dailyEnrollments: enrollmentData.dailyEnrollments,
      averageOrderValue: purchaseData.averageOrderValue,
      repeatPurchaseRate: purchaseData.repeatPurchaseRate,
      cartAbandonmentRate: purchaseData.cartAbandonmentRate,
    });
  },
});

// ============================================================================
// One-time seed — call after deployment to populate initial data
// ============================================================================

export const seedInitialMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.adminMetricsAggregation.aggregateAdminMetrics);
  },
});
