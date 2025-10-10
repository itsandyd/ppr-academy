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