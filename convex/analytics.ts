import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== EVENT TRACKING ====================

// Track user event
export const trackEvent = mutation({
  args: { 
    userId: v.string(),
    eventType: v.union(
      v.literal("course_viewed"),
      v.literal("course_enrolled"),
      v.literal("chapter_started"),
      v.literal("chapter_completed"),
      v.literal("course_completed"),
      v.literal("video_played"),
      v.literal("video_paused"),
      v.literal("video_progress"),
      v.literal("checkout_started"),
      v.literal("purchase_completed"),
      v.literal("refund_requested"),
      v.literal("question_asked"),
      v.literal("answer_posted"),
      v.literal("comment_posted"),
      v.literal("content_liked"),
      v.literal("certificate_shared"),
      v.literal("course_reviewed"),
      v.literal("login"),
      v.literal("logout"),
      v.literal("profile_updated")
    ),
    courseId: v.optional(v.id("courses")),
    chapterId: v.optional(v.string()),
    productId: v.optional(v.id("digitalProducts")),
    metadata: v.optional(v.any()),
    sessionId: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert("userEvents", {
        userId: args.userId,
        eventType: args.eventType,
        courseId: args.courseId,
        chapterId: args.chapterId,
        productId: args.productId,
        metadata: args.metadata,
        timestamp: Date.now(),
        sessionId: args.sessionId,
        deviceType: args.deviceType,
        browserInfo: args.browserInfo,
      });

      return { success: true };
    } catch (error) {
      console.error("Error tracking event:", error);
      return { success: false };
    }
  },
});

// Track video analytics
export const trackVideoAnalytics = mutation({
  args: {
    chapterId: v.string(),
    courseId: v.id("courses"),
    userId: v.string(),
    watchDuration: v.number(),
    videoDuration: v.number(),
    percentWatched: v.number(),
    dropOffPoint: v.optional(v.number()),
    completedWatch: v.boolean(),
    rewatches: v.number(),
    playbackSpeed: v.optional(v.number()),
    qualitySetting: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert("videoAnalytics", {
        chapterId: args.chapterId,
        courseId: args.courseId,
        userId: args.userId,
        watchDuration: args.watchDuration,
        videoDuration: args.videoDuration,
        percentWatched: args.percentWatched,
        dropOffPoint: args.dropOffPoint,
        completedWatch: args.completedWatch,
        rewatches: args.rewatches,
        playbackSpeed: args.playbackSpeed,
        qualitySetting: args.qualitySetting,
        timestamp: Date.now(),
        sessionId: args.sessionId,
      });

      return { success: true };
    } catch (error) {
      console.error("Error tracking video analytics:", error);
      return { success: false };
    }
  },
});

// Update learning streak
export const updateLearningStreak = mutation({
  args: { userId: v.string() },
  returns: v.object({
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalDaysActive: v.number(),
  }),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get existing streak
    const existing = await ctx.db
      .query("learningStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing) {
      // Create new streak
      const newStreak = {
        userId: args.userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        totalDaysActive: 1,
        totalHoursLearned: 0,
        streakMilestones: [],
        updatedAt: Date.now(),
      };
      
      await ctx.db.insert("learningStreaks", newStreak);
      
      return {
        currentStreak: 1,
        longestStreak: 1,
        totalDaysActive: 1,
      };
    }

    // Check if today is already counted
    if (existing.lastActivityDate === today) {
      return {
        currentStreak: existing.currentStreak,
        longestStreak: existing.longestStreak,
        totalDaysActive: existing.totalDaysActive,
      };
    }

    // Check if streak continues or breaks
    const lastDate = new Date(existing.lastActivityDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak: number;
    if (daysDiff === 1) {
      // Streak continues
      newCurrentStreak = existing.currentStreak + 1;
    } else {
      // Streak breaks, start new
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(existing.longestStreak, newCurrentStreak);
    const newTotalDaysActive = existing.totalDaysActive + 1;

    // Update streak milestones
    const streakMilestones = existing.streakMilestones;
    const milestones = [7, 30, 100, 365];
    for (const milestone of milestones) {
      if (newCurrentStreak >= milestone && !streakMilestones.includes(milestone)) {
        streakMilestones.push(milestone);
      }
    }

    await ctx.db.patch(existing._id, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      totalDaysActive: newTotalDaysActive,
      streakMilestones,
      updatedAt: Date.now(),
    });
    
    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalDaysActive: newTotalDaysActive,
    };
  },
});

// ==================== QUERIES ====================

// Get user events
export const getUserEvents = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("userEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit) as any;
    }

    const events = await query.collect();
    
    if (args.eventType) {
      return events.filter(e => e.eventType === args.eventType);
    }
    
    return events;
  },
});

// Get course analytics for creator
export const getCourseAnalytics = query({
  args: {
    courseId: v.id("courses"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("courseAnalytics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId));

    const analytics = await query.collect();
    
    if (args.startDate && args.endDate) {
      return analytics.filter(a => 
        a.date >= args.startDate! && a.date <= args.endDate!
      );
    }
    
    return analytics;
  },
});

// Get creator revenue analytics
export const getRevenueAnalytics = query({
  args: {
    creatorId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("revenueAnalytics")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId));

    const analytics = await query.collect();
    
    if (args.startDate && args.endDate) {
      return analytics.filter(a => 
        a.date >= args.startDate! && a.date <= args.endDate!
      );
    }
    
    return analytics;
  },
});

// Get student progress
export const getStudentProgress = query({
  args: {
    userId: v.string(),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    if (args.courseId) {
      return await ctx.db
        .query("studentProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId).eq("courseId", args.courseId!))
        .unique();
    }
    
    return await ctx.db
      .query("studentProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get learning streak
export const getLearningStreak = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// Get chapter analytics
export const getChapterAnalytics = query({
  args: {
    courseId: v.id("courses"),
    chapterId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.chapterId) {
      return await ctx.db
        .query("chapterAnalytics")
        .withIndex("by_chapter", (q) => q.eq("chapterId", args.chapterId!))
        .unique();
    }
    
    return await ctx.db
      .query("chapterAnalytics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// Get video analytics for chapter
export const getVideoAnalytics = query({
  args: {
    chapterId: v.string(),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("videoAnalytics")
      .withIndex("by_chapter", (q) => q.eq("chapterId", args.chapterId))
      .collect();
    
    return analytics;
  },
});

// Get recommendations for user
export const getRecommendations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    // Check if expired
    if (recommendations && recommendations.expiresAt < Date.now()) {
      return null; // Trigger regeneration
    }

    return recommendations;
  },
});

// Get at-risk students for a course
export const getAtRiskStudents = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentProgress")
      .withIndex("by_risk", (q) => q.eq("isAtRisk", true))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
          .collect();
  },
});

// Get course completion rate
export const getCourseCompletionRate = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const allProgress = await ctx.db
      .query("studentProgress")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .collect();
      
    if (allProgress.length === 0) {
      return { completionRate: 0, totalStudents: 0, completedStudents: 0 };
    }

    const completedStudents = allProgress.filter(p => p.completionPercentage === 100).length;
    const completionRate = (completedStudents / allProgress.length) * 100;

    return {
      completionRate: Math.round(completionRate),
      totalStudents: allProgress.length,
      completedStudents,
    };
  },
});

// Get drop-off points for a course
export const getCourseDropOffPoints = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const chapterAnalytics = await ctx.db
      .query("chapterAnalytics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Sort by drop-off rate descending
    return chapterAnalytics
      .sort((a, b) => b.dropOffRate - a.dropOffRate)
      .slice(0, 5); // Top 5 drop-off points
  },
});

// ==================== CREATOR ANALYTICS ====================

export const getCreatorAnalytics = query({
  args: {
    userId: v.string(), // Clerk ID
    timeRange: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
  },
  returns: v.object({
    overview: v.object({
      totalRevenue: v.number(),
      totalSales: v.number(),
      totalViews: v.number(),
      conversionRate: v.number(),
      totalProducts: v.number(),
      publishedProducts: v.number(),
      totalStudents: v.number(),
      avgRating: v.number(),
    }),
    revenueData: v.array(v.object({
      period: v.string(),
      revenue: v.number(),
    })),
    topProducts: v.array(v.object({
      _id: v.id("courses"),
      title: v.string(),
      type: v.string(),
      revenue: v.number(),
      sales: v.number(),
      views: v.number(),
      rating: v.number(),
    })),
    audienceInsights: v.object({
      topCountries: v.array(v.object({
        country: v.string(),
        percentage: v.number(),
      })),
      ageGroups: v.array(v.object({
        range: v.string(),
        percentage: v.number(),
      })),
      deviceTypes: v.array(v.object({
        type: v.string(),
        percentage: v.number(),
      })),
    }),
  }),
  handler: async (ctx, args) => {
    // Get all courses by this creator
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const courseIds = courses.map(c => c._id);

    // Get analytics for all courses
    const courseAnalytics = await Promise.all(
      courseIds.map(id => 
        ctx.db
          .query("courseAnalytics")
          .withIndex("by_course", (q) => q.eq("courseId", id))
          .first()
      )
    );

    const validAnalytics = courseAnalytics.filter(a => a !== null);

    // Calculate overview metrics
    const totalRevenue = validAnalytics.reduce((sum, a) => sum + (a?.revenue || 0), 0);
    const totalSales = validAnalytics.reduce((sum, a) => sum + (a?.enrollments || 0), 0);
    const totalViews = validAnalytics.reduce((sum, a) => sum + (a?.views || 0), 0);
    const avgRating = validAnalytics.length > 0
      ? validAnalytics.reduce((sum, a) => sum + (a?.avgRating || 0), 0) / validAnalytics.length
      : 0;

    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
    const publishedCourses = courses.filter(c => c.isPublished).length;

    // Mock revenue data (should be calculated from actual transactions)
    const revenueData = [
      { period: "Week 1", revenue: totalRevenue * 0.2 },
      { period: "Week 2", revenue: totalRevenue * 0.25 },
      { period: "Week 3", revenue: totalRevenue * 0.3 },
      { period: "Week 4", revenue: totalRevenue * 0.25 },
    ];

    // Top products
    const topProducts = courses
      .map((course, i) => {
        const analytics = validAnalytics[i];
        return {
          _id: course._id,
          title: course.title,
          type: "course",
          revenue: analytics?.revenue || 0,
          sales: analytics?.enrollments || 0,
          views: analytics?.views || 0,
          rating: analytics?.avgRating || 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Mock audience insights
    const audienceInsights = {
      topCountries: [
        { country: "United States", percentage: 45 },
        { country: "United Kingdom", percentage: 20 },
        { country: "Canada", percentage: 15 },
        { country: "Germany", percentage: 10 },
        { country: "Australia", percentage: 10 },
      ],
      ageGroups: [
        { range: "18-24", percentage: 25 },
        { range: "25-34", percentage: 40 },
        { range: "35-44", percentage: 20 },
        { range: "45+", percentage: 15 },
      ],
      deviceTypes: [
        { type: "Desktop", percentage: 60 },
        { type: "Mobile", percentage: 30 },
        { type: "Tablet", percentage: 10 },
      ],
    };

    return {
      overview: {
        totalRevenue,
        totalSales,
        totalViews,
        conversionRate,
        totalProducts: courses.length,
        publishedProducts: publishedCourses,
        totalStudents: totalSales,
        avgRating,
      },
      revenueData,
      topProducts,
      audienceInsights,
    };
  },
});

export const getProductAnalytics = query({
  args: { userId: v.string() }, // Clerk ID
  returns: v.null(),
  handler: async (ctx, args) => {
    // Placeholder for product-specific analytics
    return null;
  },
});

/**
 * Get metrics for a specific product (course or digital product)
 * Returns real view counts, sales, revenue, and conversion rates
 */
export const getProductMetrics = query({
  args: {
    productId: v.string(),
    productType: v.union(v.literal("course"), v.literal("digitalProduct")),
  },
  returns: v.object({
    views: v.number(),
    sales: v.number(),
    revenue: v.number(),
    conversionRate: v.number(),
    reviewCount: v.number(),
    averageRating: v.number(),
  }),
  handler: async (ctx, args) => {
    let views = 0;
    let sales = 0;
    let revenue = 0;
    let reviewCount = 0;
    let averageRating = 0;

    if (args.productType === "course") {
      // Get views from productViews or analyticsEvents
      const viewEvents = await ctx.db
        .query("productViews")
        .withIndex("by_resourceId", (q) => q.eq("resourceId", args.productId))
        .collect();
      views = viewEvents.length;

      // Get sales from purchases
      const purchases = await ctx.db
        .query("purchases")
        .filter((q) =>
          q.and(
            q.eq(q.field("courseId"), args.productId),
            q.eq(q.field("status"), "completed")
          )
        )
        .collect();
      sales = purchases.length;
      revenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

      // Get reviews from courseReviews
      const reviews = await ctx.db
        .query("courseReviews")
        .filter((q) => q.eq(q.field("courseId"), args.productId))
        .collect();
      reviewCount = reviews.length;
      if (reviews.length > 0) {
        averageRating =
          Math.round(
            (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              reviews.length) *
              10
          ) / 10;
      }
    } else {
      // Digital product metrics
      const viewEvents = await ctx.db
        .query("productViews")
        .withIndex("by_resourceId", (q) => q.eq("resourceId", args.productId))
        .collect();
      views = viewEvents.length;

      const purchases = await ctx.db
        .query("purchases")
        .filter((q) =>
          q.and(
            q.eq(q.field("productId"), args.productId),
            q.eq(q.field("status"), "completed")
          )
        )
        .collect();
      sales = purchases.length;
      revenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

      // Get reviews from productReviews
      const reviews = await ctx.db
        .query("productReviews")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId))
        .collect();
      reviewCount = reviews.length;
      if (reviews.length > 0) {
        averageRating =
          Math.round(
            (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              reviews.length) *
              10
          ) / 10;
      }
    }

    // Calculate conversion rate (sales / views * 100)
    const conversionRate = views > 0 ? Math.round((sales / views) * 1000) / 10 : 0;

    return {
      views,
      sales,
      revenue,
      conversionRate,
      reviewCount,
      averageRating,
    };
  },
});

/**
 * Get creator engagement rate
 * Calculates: (active students in last 7 days / total enrolled students) * 100
 */
export const getCreatorEngagementRate = query({
  args: { userId: v.string() },
  returns: v.object({
    engagementRate: v.number(),
    activeStudents: v.number(),
    totalStudents: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all courses by this creator
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (courses.length === 0) {
      return { engagementRate: 0, activeStudents: 0, totalStudents: 0 };
    }

    const courseIds = courses.map(c => c._id);

    // Get all enrollments for these courses
    const allEnrollments: { userId: string; courseId: string }[] = [];
    for (const courseId of courseIds) {
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId as any))
        .collect();
      allEnrollments.push(...enrollments.map(e => ({ userId: e.userId, courseId: e.courseId })));
    }

    const totalStudents = new Set(allEnrollments.map(e => e.userId)).size;

    if (totalStudents === 0) {
      return { engagementRate: 0, activeStudents: 0, totalStudents: 0 };
    }

    // Get activity in last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Check user events for activity
    const activeUserIds = new Set<string>();

    for (const courseId of courseIds) {
      const recentEvents = await ctx.db
        .query("userEvents")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .filter((q) => q.gte(q.field("timestamp"), sevenDaysAgo))
        .collect();

      recentEvents.forEach(event => activeUserIds.add(event.userId));
    }

    const activeStudents = activeUserIds.size;
    const engagementRate = totalStudents > 0
      ? Math.round((activeStudents / totalStudents) * 100)
      : 0;

    return {
      engagementRate,
      activeStudents,
      totalStudents,
    };
  },
});

/**
 * Get creator revenue over time (last 30 days)
 * For charts on the creator dashboard
 */
export const getCreatorRevenueOverTime = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      revenue: v.number(),
      sales: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const numDays = args.days || 30;

    // Get creator's store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!store) {
      // Return empty data for numDays
      const emptyData = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        emptyData.push({
          date: date.toISOString().split("T")[0],
          revenue: 0,
          sales: 0,
        });
      }
      return emptyData;
    }

    // Get all purchases for this store
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .collect();

    const completedPurchases = purchases.filter((p) => p.status === "completed");

    // Group by date
    const revenueData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayPurchases = completedPurchases.filter(
        (p) => p._creationTime >= dayStart && p._creationTime < dayEnd
      );

      const dailyRevenue = dayPurchases.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      revenueData.push({
        date: dateStr,
        revenue: dailyRevenue / 100, // Convert cents to dollars
        sales: dayPurchases.length,
      });
    }

    return revenueData;
  },
});

/**
 * Get creator's course performance comparison
 */
export const getCreatorCoursePerformance = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      courseId: v.string(),
      title: v.string(),
      enrollments: v.number(),
      revenue: v.number(),
      completionRate: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all courses by this creator
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const coursePerformance = await Promise.all(
      courses.map(async (course) => {
        // Get enrollments
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id as any))
          .collect();

        // Calculate completion rate (students who finished / total enrolled)
        const completedCount = enrollments.filter(
          (e) => (e.progress || 0) >= 100
        ).length;
        const completionRate =
          enrollments.length > 0
            ? Math.round((completedCount / enrollments.length) * 100)
            : 0;

        // Calculate revenue
        const revenue = (course.price || 0) * enrollments.length;

        return {
          courseId: course._id,
          title: course.title,
          enrollments: enrollments.length,
          revenue,
          completionRate,
        };
      })
    );

    // Sort by enrollments descending
    return coursePerformance.sort((a, b) => b.enrollments - a.enrollments);
  },
});

/**
 * Get recent activity for creator's live feed
 * Combines purchases, enrollments, and course completions
 */
export const getCreatorRecentActivity = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      type: v.union(
        v.literal("purchase"),
        v.literal("enrollment"),
        v.literal("completion")
      ),
      title: v.string(),
      description: v.string(),
      amount: v.optional(v.number()),
      timestamp: v.number(),
      userInfo: v.optional(
        v.object({
          name: v.optional(v.string()),
          email: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const maxItems = args.limit || 20;
    const activities: Array<{
      id: string;
      type: "purchase" | "enrollment" | "completion";
      title: string;
      description: string;
      amount?: number;
      timestamp: number;
      userInfo?: { name?: string; email?: string };
    }> = [];

    // Get creator's store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (store) {
      // Get recent purchases
      const purchases = await ctx.db
        .query("purchases")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .order("desc")
        .take(maxItems);

      for (const purchase of purchases) {
        if (purchase.status === "completed") {
          // Get product/course title
          let productTitle = "Product";
          if (purchase.courseId) {
            const course = await ctx.db.get(purchase.courseId);
            productTitle = course?.title || "Course";
          } else if (purchase.productId) {
            const product = await ctx.db.get(purchase.productId);
            productTitle = product?.title || "Digital Product";
          }

          // Get buyer info
          const buyer = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
            .first();

          activities.push({
            id: purchase._id,
            type: "purchase",
            title: productTitle,
            description: `New purchase`,
            amount: (purchase.amount || 0) / 100,
            timestamp: purchase._creationTime,
            userInfo: buyer
              ? {
                  name: buyer.name || undefined,
                  email: buyer.email || undefined,
                }
              : undefined,
          });
        }
      }
    }

    // Get creator's courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const course of courses) {
      // Get recent enrollments
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id as any))
        .order("desc")
        .take(10);

      for (const enrollment of enrollments) {
        // Get user info
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", enrollment.userId))
          .first();

        activities.push({
          id: enrollment._id,
          type: "enrollment",
          title: course.title,
          description: "New student enrolled",
          timestamp: enrollment._creationTime,
          userInfo: user
            ? {
                name: user.name || undefined,
                email: user.email || undefined,
              }
            : undefined,
        });

        // Check for completions
        if ((enrollment.progress || 0) >= 100) {
          activities.push({
            id: `${enrollment._id}-complete`,
            type: "completion",
            title: course.title,
            description: "Course completed",
            timestamp: enrollment._creationTime + 1, // Slightly after enrollment
            userInfo: user
              ? {
                  name: user.name || undefined,
                  email: user.email || undefined,
                }
              : undefined,
          });
        }
      }
    }

    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxItems);
  },
});

/**
 * Get creator's video analytics across all courses
 * Shows watch duration, completion rates, drop-off points, rewatches
 */
export const getCreatorVideoAnalytics = query({
  args: { userId: v.string() },
  returns: v.object({
    totalWatchTime: v.number(),
    avgCompletionRate: v.number(),
    totalViews: v.number(),
    chapters: v.array(
      v.object({
        chapterId: v.string(),
        chapterTitle: v.string(),
        courseTitle: v.string(),
        totalWatchTime: v.number(),
        avgPercentWatched: v.number(),
        viewCount: v.number(),
        completionCount: v.number(),
        completionRate: v.number(),
        avgDropOffPoint: v.number(),
        rewatchCount: v.number(),
      })
    ),
    dropOffHotspots: v.array(
      v.object({
        chapterId: v.string(),
        chapterTitle: v.string(),
        courseTitle: v.string(),
        dropOffRate: v.number(),
        avgDropOffPoint: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Get only first 3 courses by this creator to avoid reading too much data
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(3);

    if (courses.length === 0) {
      return {
        totalWatchTime: 0,
        avgCompletionRate: 0,
        totalViews: 0,
        chapters: [],
        dropOffHotspots: [],
      };
    }

    // Build chapter lookup from courseChapters table (limit to 10 per course)
    const chapterLookup: Record<string, { title: string; courseTitle: string; order: number }> = {};
    for (const course of courses) {
      const chapters = await ctx.db
        .query("courseChapters")
        .filter((q) => q.eq(q.field("courseId"), course._id))
        .take(10);

      chapters.forEach((chapter, index) => {
        chapterLookup[chapter._id] = {
          title: chapter.title,
          courseTitle: course.title,
          order: chapter.position || index,
        };
      });
    }

    // Get video analytics (limit to 50 per course)
    const allVideoAnalytics = [];
    for (const course of courses) {
      const analytics = await ctx.db
        .query("videoAnalytics")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .take(50);
      allVideoAnalytics.push(...analytics);
    }

    if (allVideoAnalytics.length === 0) {
      return {
        totalWatchTime: 0,
        avgCompletionRate: 0,
        totalViews: 0,
        chapters: [],
        dropOffHotspots: [],
      };
    }

    // Aggregate by chapter
    const chapterStats: Record<string, {
      totalWatchTime: number;
      totalPercentWatched: number;
      viewCount: number;
      completionCount: number;
      dropOffPoints: number[];
      rewatchCount: number;
    }> = {};

    for (const va of allVideoAnalytics) {
      if (!chapterStats[va.chapterId]) {
        chapterStats[va.chapterId] = {
          totalWatchTime: 0,
          totalPercentWatched: 0,
          viewCount: 0,
          completionCount: 0,
          dropOffPoints: [],
          rewatchCount: 0,
        };
      }

      const stats = chapterStats[va.chapterId];
      stats.totalWatchTime += va.watchDuration;
      stats.totalPercentWatched += va.percentWatched;
      stats.viewCount += 1;
      if (va.completedWatch) stats.completionCount += 1;
      if (va.dropOffPoint) stats.dropOffPoints.push(va.dropOffPoint);
      stats.rewatchCount += va.rewatches;
    }

    // Build chapter results
    const chapters = Object.entries(chapterStats)
      .map(([chapterId, stats]) => {
        const chapterInfo = chapterLookup[chapterId] || {
          title: "Unknown Chapter",
          courseTitle: "Unknown Course",
          order: 999,
        };
        const avgDropOff =
          stats.dropOffPoints.length > 0
            ? stats.dropOffPoints.reduce((a, b) => a + b, 0) / stats.dropOffPoints.length
            : 0;

        return {
          chapterId,
          chapterTitle: chapterInfo.title,
          courseTitle: chapterInfo.courseTitle,
          totalWatchTime: Math.round(stats.totalWatchTime / 60), // Convert to minutes
          avgPercentWatched: Math.round(stats.totalPercentWatched / stats.viewCount),
          viewCount: stats.viewCount,
          completionCount: stats.completionCount,
          completionRate: Math.round((stats.completionCount / stats.viewCount) * 100),
          avgDropOffPoint: Math.round(avgDropOff),
          rewatchCount: stats.rewatchCount,
        };
      })
      .sort((a, b) => b.viewCount - a.viewCount);

    // Calculate totals
    const totalWatchTime = chapters.reduce((sum, c) => sum + c.totalWatchTime, 0);
    const totalViews = chapters.reduce((sum, c) => sum + c.viewCount, 0);
    const avgCompletionRate =
      chapters.length > 0
        ? Math.round(chapters.reduce((sum, c) => sum + c.completionRate, 0) / chapters.length)
        : 0;

    // Find drop-off hotspots (chapters with low completion rates)
    const dropOffHotspots = chapters
      .filter((c) => c.completionRate < 50 && c.viewCount >= 5)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5)
      .map((c) => ({
        chapterId: c.chapterId,
        chapterTitle: c.chapterTitle,
        courseTitle: c.courseTitle,
        dropOffRate: 100 - c.completionRate,
        avgDropOffPoint: c.avgDropOffPoint,
      }));

    return {
      totalWatchTime,
      avgCompletionRate,
      totalViews,
      chapters: chapters.slice(0, 10), // Top 10 by views
      dropOffHotspots,
    };
  },
});

/**
 * Get student progress overview for a creator
 * Shows all enrolled students, their progress, and at-risk indicators
 */
export const getCreatorStudentProgress = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    totalStudents: v.number(),
    activeStudents: v.number(),
    atRiskStudents: v.number(),
    avgProgress: v.number(),
    students: v.array(
      v.object({
        id: v.string(),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        courseTitle: v.string(),
        progress: v.number(),
        lastActivity: v.optional(v.number()),
        isAtRisk: v.boolean(),
        enrolledAt: v.number(),
        streak: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const maxStudents = args.limit || 20;

    // Get all courses by this creator
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (courses.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        atRiskStudents: 0,
        avgProgress: 0,
        students: [],
      };
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Collect all enrollments with course context
    const allStudentData: Array<{
      id: string;
      name?: string;
      email?: string;
      courseTitle: string;
      progress: number;
      lastActivity?: number;
      isAtRisk: boolean;
      enrolledAt: number;
      streak?: number;
    }> = [];

    for (const course of courses) {
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id as any))
        .collect();

      for (const enrollment of enrollments) {
        // Get user info
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", enrollment.userId))
          .first();

        // Get learning streak
        const streak = await ctx.db
          .query("learningStreaks")
          .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
          .first();

        // Get last activity
        const lastEvent = await ctx.db
          .query("userEvents")
          .withIndex("by_user", (q) => q.eq("userId", enrollment.userId))
          .order("desc")
          .first();

        const progress = enrollment.progress || 0;
        const lastActivity = lastEvent?.timestamp;
        const isAtRisk =
          progress < 25 &&
          (!lastActivity || lastActivity < sevenDaysAgo) &&
          enrollment._creationTime < sevenDaysAgo;

        allStudentData.push({
          id: enrollment.userId,
          name: user?.name || undefined,
          email: user?.email || undefined,
          courseTitle: course.title,
          progress,
          lastActivity,
          isAtRisk,
          enrolledAt: enrollment._creationTime,
          streak: streak?.currentStreak,
        });
      }
    }

    // Calculate metrics
    const uniqueStudentIds = new Set(allStudentData.map((s) => s.id));
    const totalStudents = uniqueStudentIds.size;
    const activeStudents = allStudentData.filter(
      (s) => s.lastActivity && s.lastActivity >= sevenDaysAgo
    ).length;
    const atRiskStudents = allStudentData.filter((s) => s.isAtRisk).length;
    const avgProgress =
      allStudentData.length > 0
        ? Math.round(
            allStudentData.reduce((sum, s) => sum + s.progress, 0) /
              allStudentData.length
          )
        : 0;

    // Sort by last activity (most recent first), then by at-risk status
    const sortedStudents = allStudentData
      .sort((a, b) => {
        // At-risk students first
        if (a.isAtRisk && !b.isAtRisk) return -1;
        if (!a.isAtRisk && b.isAtRisk) return 1;
        // Then by last activity
        return (b.lastActivity || 0) - (a.lastActivity || 0);
      })
      .slice(0, maxStudents);

    return {
      totalStudents,
      activeStudents,
      atRiskStudents,
      avgProgress,
      students: sortedStudents,
    };
  },
});