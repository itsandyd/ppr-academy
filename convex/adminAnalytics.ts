import { v } from "convex/values";
import { query } from "./_generated/server";

// Get platform-wide overview statistics
export const getPlatformOverview = query({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    totalCourses: v.number(),
    totalProducts: v.number(),
    totalRevenue: v.number(),
    activeUsers: v.number(),
    publishedCourses: v.number(),
    totalEnrollments: v.number(),
    totalStores: v.number(),
  }),
  handler: async (ctx) => {
    // Fetch all data
    const users = await ctx.db.query("users").collect();
    const courses = await ctx.db.query("courses").collect();
    const digitalProducts = await ctx.db.query("digitalProducts").collect();
    const enrollments = await ctx.db.query("enrollments").collect();
    const stores = await ctx.db.query("stores").collect();
    
    // Calculate active users (users with activity in last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentEnrollments = enrollments.filter(e => e._creationTime > thirtyDaysAgo);
    const activeUserIds = new Set(recentEnrollments.map(e => e.userId));
    
    // Calculate total revenue from course analytics
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    const totalRevenue = courseAnalytics.reduce((sum, ca) => sum + (ca.revenue || 0), 0);
    
    return {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalProducts: digitalProducts.length,
      totalRevenue,
      activeUsers: activeUserIds.size,
      publishedCourses: courses.filter(c => c.isPublished).length,
      totalEnrollments: enrollments.length,
      totalStores: stores.length,
    };
  },
});

// Get revenue data over time (last 30 days)
export const getRevenueOverTime = query({
  args: {},
  returns: v.array(v.object({
    date: v.string(),
    revenue: v.number(),
  })),
  handler: async (ctx) => {
    // Get all course analytics
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    
    // For now, create mock daily revenue data
    // In production, you'd track actual transaction timestamps
    const days = 30;
    const revenueData = [];
    const totalRevenue = courseAnalytics.reduce((sum, ca) => sum + (ca.revenue || 0), 0);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      // Distribute revenue with some variance
      const dailyRevenue = (totalRevenue / days) * (0.7 + Math.random() * 0.6);
      revenueData.push({
        date: dateStr,
        revenue: Math.round(dailyRevenue * 100) / 100,
      });
    }
    
    return revenueData;
  },
});

// Get top performing courses
export const getTopCourses = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    courseId: v.id("courses"),
    title: v.string(),
    revenue: v.number(),
    enrollments: v.number(),
    rating: v.number(),
    views: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    
    // Sort by revenue
    const sortedAnalytics = courseAnalytics
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, limit);
    
    const topCourses = [];
    for (const analytics of sortedAnalytics) {
      const course = await ctx.db.get(analytics.courseId);
      if (course) {
        topCourses.push({
          courseId: course._id,
          title: course.title,
          revenue: analytics.revenue || 0,
          enrollments: analytics.enrollments || 0,
          rating: analytics.avgRating || 0,
          views: analytics.views || 0,
        });
      }
    }
    
    return topCourses;
  },
});

// Get top creators by revenue
export const getTopCreators = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    userId: v.string(),
    name: v.string(),
    totalRevenue: v.number(),
    courseCount: v.number(),
    totalEnrollments: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const courses = await ctx.db.query("courses").collect();
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    
    // Group by creator
    const creatorMap = new Map<string, {
      userId: string;
      name: string;
      totalRevenue: number;
      courseCount: number;
      totalEnrollments: number;
    }>();
    
    for (const course of courses) {
      const analytics = courseAnalytics.find(ca => ca.courseId === course._id);
      const revenue = analytics?.revenue || 0;
      const enrollments = analytics?.enrollments || 0;
      
      if (!creatorMap.has(course.userId)) {
        // Get creator name
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", course.userId))
          .first();
        
        creatorMap.set(course.userId, {
          userId: course.userId,
          name: user?.name || user?.firstName || "Unknown Creator",
          totalRevenue: revenue,
          courseCount: 1,
          totalEnrollments: enrollments,
        });
      } else {
        const creator = creatorMap.get(course.userId)!;
        creator.totalRevenue += revenue;
        creator.courseCount += 1;
        creator.totalEnrollments += enrollments;
      }
    }
    
    // Sort by revenue and limit
    const topCreators = Array.from(creatorMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
    
    return topCreators;
  },
});

// Get user growth over time (last 30 days)
export const getUserGrowth = query({
  args: {},
  returns: v.array(v.object({
    date: v.string(),
    newUsers: v.number(),
    totalUsers: v.number(),
  })),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Group users by creation date
    const days = 30;
    const growthData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      // Count users created on this day
      const newUsersCount = users.filter(u => 
        u._creationTime >= dayStart && u._creationTime < dayEnd
      ).length;
      
      // Count total users up to this day
      const totalUsersCount = users.filter(u => u._creationTime < dayEnd).length;
      
      growthData.push({
        date: dateStr,
        newUsers: newUsersCount,
        totalUsers: totalUsersCount,
      });
    }
    
    return growthData;
  },
});

// Get category distribution
export const getCategoryDistribution = query({
  args: {},
  returns: v.array(v.object({
    category: v.string(),
    count: v.number(),
    revenue: v.number(),
  })),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    
    for (const course of courses) {
      const category = course.category || "Uncategorized";
      const analytics = courseAnalytics.find(ca => ca.courseId === course._id);
      const revenue = analytics?.revenue || 0;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 1, revenue });
      } else {
        const cat = categoryMap.get(category)!;
        cat.count += 1;
        cat.revenue += revenue;
      }
    }
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      revenue: data.revenue,
    })).sort((a, b) => b.count - a.count);
  },
});

// Get recent activity (last 50 events)
export const getRecentActivity = query({
  args: {},
  returns: v.array(v.object({
    type: v.string(),
    description: v.string(),
    timestamp: v.number(),
    userId: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const activities = [];
    
    // Get recent enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .order("desc")
      .take(20);
    
    for (const enrollment of enrollments) {
      // courseId is stored as string ID
      let courseTitle = "Unknown Course";
      try {
        const course = await ctx.db.get(enrollment.courseId as any);
        if (course && 'title' in course) {
          courseTitle = course.title as string;
        }
      } catch (e) {
        // If it fails, courseId might be invalid
      }
      
      activities.push({
        type: "enrollment",
        description: `New enrollment in "${courseTitle}"`,
        timestamp: enrollment._creationTime,
        userId: enrollment.userId,
      });
    }
    
    // Get recent courses
    const courses = await ctx.db
      .query("courses")
      .order("desc")
      .take(20);
    
    for (const course of courses) {
      if (course.isPublished) {
        activities.push({
          type: "course_published",
          description: `Course "${course.title}" published`,
          timestamp: course._creationTime,
          userId: course.userId,
        });
      }
    }
    
    // Sort by timestamp and take top 50
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  },
});

