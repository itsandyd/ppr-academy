import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";

/**
 * Platform-wide stats for email personalization
 */
export interface PlatformEmailStats {
  newCoursesCount: number;
  latestCourseName: string;
  newSamplePacksCount: number;
  newCreatorsCount: number;
  topCourseThisWeek: string;
  totalCourses: number;
  totalSamplePacks: number;
  totalCreators: number;
}

/**
 * User stats for email personalization
 * These stats can be used in email templates with {{variableName}} syntax
 */
export interface UserEmailStats {
  // Basic info
  firstName: string;
  name: string;
  email: string;

  // Learning stats
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;

  // Engagement stats
  level: number;
  xp: number;
  streak: number;

  // Purchase stats
  purchaseCount: number;
  totalSpent: number;

  // Creator stats (if applicable)
  isCreator: boolean;
  storeName: string;
  storeSlug: string;
  productsCreated: number;
  coursesCreated: number;
  totalEarnings: number;

  // Dates
  memberSince: string;
  daysSinceJoined: number;
  lastActiveDate: string;
  daysSinceLastActive: number;
}

/**
 * Get comprehensive user stats for email personalization
 * Used by both admin and creator email systems
 */
export const getUserStatsForEmail = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<UserEmailStats | null> => {
    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    // Get enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    // Get completed courses/lessons from userProgress
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    const completedChapters = userProgress.filter((p) => p.isCompleted === true);

    // Get unique completed courses
    const completedCourseIds = new Set(
      completedChapters
        .filter((p) => p.courseId)
        .map((p) => p.courseId)
    );

    // Get purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get user's store if they're a creator
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // If creator, get their products and courses
    let productsCreated = 0;
    let coursesCreated = 0;
    let totalEarnings = 0;

    if (store) {
      const products = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .take(500);
      productsCreated = products.length;

      const creatorCourses = await ctx.db
        .query("courses")
        .withIndex("by_instructorId", (q) => q.eq("instructorId", args.userId))
        .take(500);
      coursesCreated = creatorCourses.length;

      // Get earnings from creator's sales
      const creatorSales = await ctx.db
        .query("purchases")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id.toString()))
        .take(5000);
      totalEarnings = creatorSales
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    // Get XP data
    const xpData = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // Get learning streak
    const streakData = await ctx.db
      .query("learningStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Calculate dates
    const createdAt = user._creationTime;
    const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceJoined = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

    // Calculate last active from progress and purchases
    const progressTimes = userProgress.map((p) => p.completedAt || p.lastAccessedAt || 0);
    const purchaseTimes = purchases.map((p) => p._creationTime || 0);
    const allTimes = [...progressTimes, ...purchaseTimes, createdAt].filter((t) => t > 0);
    const lastActivity = allTimes.length > 0 ? Math.max(...allTimes) : createdAt;

    const lastActiveDate = new Date(lastActivity).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceLastActive = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

    // Calculate level from XP (simple formula: every 100 XP = 1 level)
    const totalXP = xpData?.totalXP || 0;
    const level = Math.floor(totalXP / 100) + 1;

    // Build the stats object
    const firstName = user.firstName || user.name?.split(" ")[0] || "there";
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "there";

    return {
      // Basic info
      firstName,
      name,
      email: user.email || "",

      // Learning stats
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCourseIds.size,
      lessonsCompleted: completedChapters.length,

      // Engagement stats
      level,
      xp: totalXP,
      streak: streakData?.currentStreak || 0,

      // Purchase stats
      purchaseCount: completedPurchases.length,
      totalSpent: totalSpent / 100, // Convert cents to dollars

      // Creator stats
      isCreator: user.isCreator || !!store,
      storeName: store?.name || "",
      storeSlug: store?.slug || "",
      productsCreated,
      coursesCreated,
      totalEarnings: totalEarnings / 100, // Convert cents to dollars

      // Dates
      memberSince,
      daysSinceJoined,
      lastActiveDate,
      daysSinceLastActive,
    };
  },
});

/**
 * Internal version for use in email actions
 */
export const internalGetUserStatsForEmail = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<UserEmailStats | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    const completedChapters = userProgress.filter((p) => p.isCompleted === true);
    const completedCourseIds = new Set(
      completedChapters.filter((p) => p.courseId).map((p) => p.courseId)
    );

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5000);

    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    let productsCreated = 0;
    let coursesCreated = 0;
    let totalEarnings = 0;

    if (store) {
      const products = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .take(500);
      productsCreated = products.length;

      const creatorCourses = await ctx.db
        .query("courses")
        .withIndex("by_instructorId", (q) => q.eq("instructorId", args.userId))
        .take(500);
      coursesCreated = creatorCourses.length;

      const creatorSales = await ctx.db
        .query("purchases")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id.toString()))
        .take(5000);
      totalEarnings = creatorSales
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    const xpData = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const streakData = await ctx.db
      .query("learningStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const createdAt = user._creationTime;
    const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceJoined = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

    const progressTimes = userProgress.map((p) => p.completedAt || p.lastAccessedAt || 0);
    const purchaseTimes = purchases.map((p) => p._creationTime || 0);
    const allTimes = [...progressTimes, ...purchaseTimes, createdAt].filter((t) => t > 0);
    const lastActivity = allTimes.length > 0 ? Math.max(...allTimes) : createdAt;

    const lastActiveDate = new Date(lastActivity).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceLastActive = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

    const totalXP = xpData?.totalXP || 0;
    const level = Math.floor(totalXP / 100) + 1;

    const firstName = user.firstName || user.name?.split(" ")[0] || "there";
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "there";

    return {
      firstName,
      name,
      email: user.email || "",
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCourseIds.size,
      lessonsCompleted: completedChapters.length,
      level,
      xp: totalXP,
      streak: streakData?.currentStreak || 0,
      purchaseCount: completedPurchases.length,
      totalSpent: totalSpent / 100,
      isCreator: user.isCreator || !!store,
      storeName: store?.name || "",
      storeSlug: store?.slug || "",
      productsCreated,
      coursesCreated,
      totalEarnings: totalEarnings / 100,
      memberSince,
      daysSinceJoined,
      lastActiveDate,
      daysSinceLastActive,
    };
  },
});

/**
 * Get stats for a batch of users (for campaign sending)
 */
export const getUserStatsBatch = internalQuery({
  args: {
    userIds: v.array(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<Record<string, UserEmailStats>> => {
    const statsMap: Record<string, UserEmailStats> = {};

    for (const userId of args.userIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
        .first();

      if (!user) continue;

      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(5000);

      const userProgress = await ctx.db
        .query("userProgress")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(5000);

      const completedChapters = userProgress.filter((p) => p.isCompleted === true);
      const completedCourseIds = new Set(
        completedChapters.filter((p) => p.courseId).map((p) => p.courseId)
      );

      const purchases = await ctx.db
        .query("purchases")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(5000);

      const completedPurchases = purchases.filter((p) => p.status === "completed");
      const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      const store = await ctx.db
        .query("stores")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      let productsCreated = 0;
      let coursesCreated = 0;
      let totalEarnings = 0;

      if (store) {
        const products = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(500);
        productsCreated = products.length;

        const creatorCourses = await ctx.db
          .query("courses")
          .withIndex("by_instructorId", (q) => q.eq("instructorId", userId))
          .take(500);
        coursesCreated = creatorCourses.length;

        const creatorSales = await ctx.db
          .query("purchases")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id.toString()))
          .take(5000);
        totalEarnings = creatorSales
          .filter((s) => s.status === "completed")
          .reduce((sum, s) => sum + (s.amount || 0), 0);
      }

      const xpData = await ctx.db
        .query("userXP")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      const streakData = await ctx.db
        .query("learningStreaks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      const createdAt = user._creationTime;
      const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const daysSinceJoined = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

      const progressTimes = userProgress.map((p) => p.completedAt || p.lastAccessedAt || 0);
      const purchaseTimes = purchases.map((p) => p._creationTime || 0);
      const allTimes = [...progressTimes, ...purchaseTimes, createdAt].filter((t) => t > 0);
      const lastActivity = allTimes.length > 0 ? Math.max(...allTimes) : createdAt;

      const lastActiveDate = new Date(lastActivity).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const daysSinceLastActive = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

      const totalXP = xpData?.totalXP || 0;
      const level = Math.floor(totalXP / 100) + 1;

      const firstName = user.firstName || user.name?.split(" ")[0] || "there";
      const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "there";

      statsMap[userId] = {
        firstName,
        name,
        email: user.email || "",
        coursesEnrolled: enrollments.length,
        coursesCompleted: completedCourseIds.size,
        lessonsCompleted: completedChapters.length,
        level,
        xp: totalXP,
        streak: streakData?.currentStreak || 0,
        purchaseCount: completedPurchases.length,
        totalSpent: totalSpent / 100,
        isCreator: user.isCreator || !!store,
        storeName: store?.name || "",
        storeSlug: store?.slug || "",
        productsCreated,
        coursesCreated,
        totalEarnings: totalEarnings / 100,
        memberSince,
        daysSinceJoined,
        lastActiveDate,
        daysSinceLastActive,
      };
    }

    return statsMap;
  },
});

/**
 * Get user stats by email address (for workflow emails)
 * This is needed because workflows store customerEmail, not userId
 */
export const getUserStatsForEmailByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<UserEmailStats | null> => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || !user.clerkId) {
      return null;
    }

    const userId = user.clerkId;

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(5000);

    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(5000);

    const completedChapters = userProgress.filter((p) => p.isCompleted === true);
    const completedCourseIds = new Set(
      completedChapters.filter((p) => p.courseId).map((p) => p.courseId)
    );

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(5000);

    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const totalSpent = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    let productsCreated = 0;
    let coursesCreated = 0;
    let totalEarnings = 0;

    if (store) {
      const products = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .take(500);
      productsCreated = products.length;

      const creatorCourses = await ctx.db
        .query("courses")
        .withIndex("by_instructorId", (q) => q.eq("instructorId", userId))
        .take(500);
      coursesCreated = creatorCourses.length;

      const creatorSales = await ctx.db
        .query("purchases")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id.toString()))
        .take(5000);
      totalEarnings = creatorSales
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + (s.amount || 0), 0);
    }

    const xpData = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const streakData = await ctx.db
      .query("learningStreaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const createdAt = user._creationTime;
    const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceJoined = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

    const progressTimes = userProgress.map((p) => p.completedAt || p.lastAccessedAt || 0);
    const purchaseTimes = purchases.map((p) => p._creationTime || 0);
    const allTimes = [...progressTimes, ...purchaseTimes, createdAt].filter((t) => t > 0);
    const lastActivity = allTimes.length > 0 ? Math.max(...allTimes) : createdAt;

    const lastActiveDate = new Date(lastActivity).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const daysSinceLastActive = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

    const totalXP = xpData?.totalXP || 0;
    const level = Math.floor(totalXP / 100) + 1;

    const firstName = user.firstName || user.name?.split(" ")[0] || "there";
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "there";

    return {
      firstName,
      name,
      email: user.email || "",
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCourseIds.size,
      lessonsCompleted: completedChapters.length,
      level,
      xp: totalXP,
      streak: streakData?.currentStreak || 0,
      purchaseCount: completedPurchases.length,
      totalSpent: totalSpent / 100,
      isCreator: user.isCreator || !!store,
      storeName: store?.name || "",
      storeSlug: store?.slug || "",
      productsCreated,
      coursesCreated,
      totalEarnings: totalEarnings / 100,
      memberSince,
      daysSinceJoined,
      lastActiveDate,
      daysSinceLastActive,
    };
  },
});

/**
 * Get platform-wide stats for email personalization
 * Used for dynamic content like "X new courses added this week"
 */
export const getPlatformStatsForEmail = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx): Promise<PlatformEmailStats> => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all courses (bounded)
    const allCourses = await ctx.db.query("courses").take(1000);
    const publishedCourses = allCourses.filter((c) => c.isPublished);

    // New courses in last 7 days
    const newCourses = publishedCourses.filter(
      (c) => c._creationTime > sevenDaysAgo
    );
    const latestCourse = publishedCourses.sort(
      (a, b) => (b._creationTime || 0) - (a._creationTime || 0)
    )[0];

    // Get all digital products (bounded)
    const allProducts = await ctx.db.query("digitalProducts").take(1000);
    const publishedProducts = allProducts.filter((p) => p.isPublished);
    const newProducts = publishedProducts.filter(
      (p) => p._creationTime > sevenDaysAgo
    );

    // Get creators (users with stores, bounded)
    const allStores = await ctx.db.query("stores").take(500);
    const newStores = allStores.filter(
      (s) => s._creationTime > thirtyDaysAgo
    );

    // Get most popular course this week (by enrollments, bounded)
    const recentEnrollments = await ctx.db
      .query("enrollments")
      .filter((q) => q.gte(q.field("_creationTime"), sevenDaysAgo))
      .take(5000);

    // Count enrollments per course
    const courseEnrollmentCounts: Record<string, number> = {};
    for (const enrollment of recentEnrollments) {
      const courseId = enrollment.courseId?.toString() || "";
      if (courseId) {
        courseEnrollmentCounts[courseId] = (courseEnrollmentCounts[courseId] || 0) + 1;
      }
    }

    // Find top course
    let topCourseThisWeek = "Production Essentials";
    let maxEnrollments = 0;
    for (const [courseId, count] of Object.entries(courseEnrollmentCounts)) {
      if (count > maxEnrollments) {
        maxEnrollments = count;
        const course = allCourses.find((c) => c._id.toString() === courseId);
        if (course?.title) {
          topCourseThisWeek = course.title;
        }
      }
    }

    // If no recent enrollments, pick a random published course
    if (maxEnrollments === 0 && publishedCourses.length > 0) {
      topCourseThisWeek = publishedCourses[Math.floor(Math.random() * publishedCourses.length)].title || "Production Essentials";
    }

    return {
      newCoursesCount: newCourses.length,
      latestCourseName: latestCourse?.title || "",
      newSamplePacksCount: newProducts.length,
      newCreatorsCount: newStores.length,
      topCourseThisWeek,
      totalCourses: publishedCourses.length,
      totalSamplePacks: publishedProducts.length,
      totalCreators: allStores.length,
    };
  },
});
