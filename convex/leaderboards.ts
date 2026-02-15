import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get top creators by revenue (using real purchase data)
 */
export const getTopCreators = query({
  args: {
    limit: v.optional(v.number()),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time")))
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    totalRevenue: v.number(),
    productCount: v.number(),
    studentCount: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const period = args.period || "all-time";

    // Calculate period start time
    const now = Date.now();
    let periodStart = 0;
    if (period === "weekly") {
      periodStart = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === "monthly") {
      periodStart = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Get all stores
    const stores = await ctx.db.query("stores").take(10000);

    // Get all purchases (filtered by period if needed)
    const allPurchases = await ctx.db.query("purchases").take(10000);
    const filteredPurchases = period === "all-time"
      ? allPurchases
      : allPurchases.filter(p => p._creationTime >= periodStart);

    // Get all products and courses to map to stores
    const products = await ctx.db.query("digitalProducts").take(10000);
    const courses = await ctx.db.query("courses").take(10000);

    // Aggregate revenue by store
    const storeRevenue: Record<string, { revenue: number; students: Set<string>; productCount: number }> = {};

    for (const store of stores) {
      const storeProducts = products.filter(p => p.storeId === store._id);
      const storeCourses = courses.filter(c => c.storeId === store._id);
      const storeProductIds = storeProducts.map(p => p._id);
      const storeCourseIds = storeCourses.map(c => c._id);

      const storePurchases = filteredPurchases.filter(p =>
        (p.productId && storeProductIds.includes(p.productId)) ||
        (p.courseId && storeCourseIds.includes(p.courseId))
      );

      const revenue = storePurchases.reduce((sum, purchase) => {
        if (purchase.productId) {
          const product = storeProducts.find(p => p._id === purchase.productId);
          return sum + (product?.price || 0);
        }
        if (purchase.courseId) {
          const course = storeCourses.find(c => c._id === purchase.courseId);
          return sum + (course?.price || 0);
        }
        return sum;
      }, 0);

      if (store.userId) {
        storeRevenue[store.userId] = {
          revenue,
          students: new Set(storePurchases.map(p => p.userId)),
          productCount: storeProducts.length + storeCourses.length
        };
      }
    }

    // Get user details and build leaderboard
    const users = await ctx.db.query("users").take(10000);
    const leaderboard = Object.entries(storeRevenue)
      .filter(([_, data]) => data.revenue > 0 || data.productCount > 0)
      .map(([userId, data]) => {
        const user = users.find(u => u.clerkId === userId);
        return {
          userId,
          rank: 0,
          totalRevenue: data.revenue,
          productCount: data.productCount,
          studentCount: data.students.size,
          name: user?.firstName || user?.email || "Creator",
          avatar: user?.imageUrl,
          badge: undefined as string | undefined
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        badge: index === 0 ? "Top Seller" : index < 3 ? "Rising Star" : undefined
      }));

    return leaderboard;
  },
});

/**
 * Get top students by XP
 */
export const getTopStudents = query({
  args: {
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    totalXP: v.number(),
    coursesCompleted: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get all user XP records
    const xpRecords = await ctx.db
      .query("userXP")
      .order("desc")
      .take(limit);

    const leaderboard = await Promise.all(
      xpRecords.map(async (xp, index) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", xp.userId))
          .unique();

        // Calculate completed courses from enrollments (progress >= 100)
        const completedEnrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_userId", (q) => q.eq("userId", xp.userId))
          .filter((q) => q.gte(q.field("progress"), 100))
          .take(500);

        return {
          userId: xp.userId,
          rank: index + 1,
          totalXP: xp.totalXP,
          coursesCompleted: completedEnrollments.length,
          name: user?.firstName || user?.email || "Student",
          avatar: user?.imageUrl,
          badge: index === 0 ? "Scholar" : undefined
        };
      })
    );

    return leaderboard;
  },
});

/**
 * Get most active users by learning streak (using real streak data)
 */
export const getMostActive = query({
  args: {
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    streak: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all learning streaks, sorted by current streak
    const streaks = await ctx.db
      .query("learningStreaks")
      .withIndex("by_current_streak")
      .order("desc")
      .take(limit * 2); // Get extra in case some users don't exist

    // Get user details for each streak
    const users = await ctx.db.query("users").take(10000);

    const leaderboard = streaks
      .filter(streak => streak.currentStreak > 0)
      .map(streak => {
        const user = users.find(u => u.clerkId === streak.userId);
        if (!user) return null;

        return {
          userId: streak.userId,
          rank: 0,
          streak: streak.currentStreak,
          name: user.firstName || user.email || "User",
          avatar: user.imageUrl,
          badge: undefined as string | undefined
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        badge: index === 0 ? "🔥" : entry.streak >= 30 ? "⭐" : entry.streak >= 7 ? "✨" : undefined
      }));

    return leaderboard;
  },
});

/**
 * Get user's leaderboard position (using real data)
 */
export const getUserPosition = query({
  args: {
    userId: v.string(),
    leaderboardType: v.union(v.literal("creators"), v.literal("students"), v.literal("active"))
  },
  returns: v.object({
    rank: v.number(),
    percentile: v.number()
  }),
  handler: async (ctx, args) => {
    if (args.leaderboardType === "students") {
      // Get all XP records sorted by totalXP
      const allXP = await ctx.db.query("userXP").take(10000);
      const sorted = allXP.sort((a, b) => b.totalXP - a.totalXP);
      const userIndex = sorted.findIndex(xp => xp.userId === args.userId);

      if (userIndex === -1 || sorted.length === 0) {
        return { rank: 0, percentile: 0 };
      }

      const rank = userIndex + 1;
      const percentile = Math.round(((sorted.length - rank) / sorted.length) * 100);
      return { rank, percentile };
    }

    if (args.leaderboardType === "active") {
      // Get all streaks sorted by currentStreak
      const allStreaks = await ctx.db.query("learningStreaks").take(10000);
      const sorted = allStreaks.sort((a, b) => b.currentStreak - a.currentStreak);
      const userIndex = sorted.findIndex(s => s.userId === args.userId);

      if (userIndex === -1 || sorted.length === 0) {
        return { rank: 0, percentile: 0 };
      }

      const rank = userIndex + 1;
      const percentile = Math.round(((sorted.length - rank) / sorted.length) * 100);
      return { rank, percentile };
    }

    // For creators, calculate based on store revenue
    const stores = await ctx.db.query("stores").take(10000);
    const userStore = stores.find(s => s.userId === args.userId);

    if (!userStore) {
      return { rank: 0, percentile: 0 };
    }

    // Get all purchases and calculate revenue per store
    const purchases = await ctx.db.query("purchases").take(10000);
    const products = await ctx.db.query("digitalProducts").take(10000);
    const courses = await ctx.db.query("courses").take(10000);

    const storeRevenues = stores.map(store => {
      const storeProducts = products.filter(p => p.storeId === store._id);
      const storeCourses = courses.filter(c => c.storeId === store._id);
      const storeProductIds = storeProducts.map(p => p._id);
      const storeCourseIds = storeCourses.map(c => c._id);

      const storePurchases = purchases.filter(p =>
        (p.productId && storeProductIds.includes(p.productId)) ||
        (p.courseId && storeCourseIds.includes(p.courseId))
      );

      const revenue = storePurchases.reduce((sum, purchase) => {
        if (purchase.productId) {
          const product = storeProducts.find(p => p._id === purchase.productId);
          return sum + (product?.price || 0);
        }
        if (purchase.courseId) {
          const course = storeCourses.find(c => c._id === purchase.courseId);
          return sum + (course?.price || 0);
        }
        return sum;
      }, 0);

      return { storeId: store._id, userId: store.userId, revenue };
    });

    const sorted = storeRevenues.sort((a, b) => b.revenue - a.revenue);
    const userIndex = sorted.findIndex(s => s.userId === args.userId);

    if (userIndex === -1 || sorted.length === 0) {
      return { rank: 0, percentile: 0 };
    }

    const rank = userIndex + 1;
    const percentile = Math.round(((sorted.length - rank) / sorted.length) * 100);
    return { rank, percentile };
  },
});

