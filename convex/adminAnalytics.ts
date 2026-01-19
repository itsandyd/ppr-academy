import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to verify admin access
async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) {
    throw new Error("Unauthorized: Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || user.admin !== true) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

// Get platform-wide overview statistics
export const getPlatformOverview = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    totalUsers: v.number(),
    totalCourses: v.number(),
    totalProducts: v.number(),
    totalRevenue: v.number(),
    activeUsers: v.number(),
    publishedCourses: v.number(),
    totalEnrollments: v.number(),
    totalStores: v.number(),
    totalPurchases: v.number(),
    revenueThisMonth: v.number(),
    newUsersThisMonth: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    // Fetch all data
    const users = await ctx.db.query("users").collect();
    const courses = await ctx.db.query("courses").collect();
    const digitalProducts = await ctx.db.query("digitalProducts").collect();
    const enrollments = await ctx.db.query("enrollments").collect();
    const stores = await ctx.db.query("stores").collect();
    const purchases = await ctx.db.query("purchases").collect();

    // Calculate total revenue from completed purchases
    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate revenue this month
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentPurchases = completedPurchases.filter((p) => p._creationTime > thirtyDaysAgo);
    const revenueThisMonth = recentPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate active users (users with activity in last 30 days)
    const recentEnrollments = enrollments.filter((e) => e._creationTime > thirtyDaysAgo);
    const activeUserIds = new Set([
      ...recentEnrollments.map((e) => e.userId),
      ...recentPurchases.map((p) => p.userId),
    ]);

    // New users this month
    const newUsersThisMonth = users.filter((u) => u._creationTime > thirtyDaysAgo).length;

    return {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalProducts: digitalProducts.length,
      totalRevenue: totalRevenue / 100, // Convert from cents to dollars
      activeUsers: activeUserIds.size,
      publishedCourses: courses.filter((c) => c.isPublished).length,
      totalEnrollments: enrollments.length,
      totalStores: stores.length,
      totalPurchases: completedPurchases.length,
      revenueThisMonth: revenueThisMonth / 100,
      newUsersThisMonth,
    };
  },
});

// Get revenue data over time (last 30 days)
export const getRevenueOverTime = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      revenue: v.number(),
      purchases: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    // Get all completed purchases
    const purchases = await ctx.db.query("purchases").collect();
    const completedPurchases = purchases.filter((p) => p.status === "completed");

    // Group purchases by date
    const days = 30;
    const revenueData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      // Filter purchases for this day
      const dayPurchases = completedPurchases.filter(
        (p) => p._creationTime >= dayStart && p._creationTime < dayEnd
      );

      const dailyRevenue = dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      revenueData.push({
        date: dateStr,
        revenue: dailyRevenue / 100, // Convert cents to dollars
        purchases: dayPurchases.length,
      });
    }

    return revenueData;
  },
});

// Get top performing courses
export const getTopCourses = query({
  args: {
    clerkId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      courseId: v.id("courses"),
      title: v.string(),
      revenue: v.number(),
      enrollments: v.number(),
      rating: v.number(),
      views: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
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
    clerkId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      totalRevenue: v.number(),
      courseCount: v.number(),
      totalEnrollments: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
    const limit = args.limit || 10;
    const courses = await ctx.db.query("courses").collect();
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();

    // Group by creator
    const creatorMap = new Map<
      string,
      {
        userId: string;
        name: string;
        totalRevenue: number;
        courseCount: number;
        totalEnrollments: number;
      }
    >();

    for (const course of courses) {
      const analytics = courseAnalytics.find((ca) => ca.courseId === course._id);
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
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      newUsers: v.number(),
      totalUsers: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
    const users = await ctx.db.query("users").collect();

    // Group users by creation date
    const days = 30;
    const growthData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      // Count users created on this day
      const newUsersCount = users.filter(
        (u) => u._creationTime >= dayStart && u._creationTime < dayEnd
      ).length;

      // Count total users up to this day
      const totalUsersCount = users.filter((u) => u._creationTime < dayEnd).length;

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
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      category: v.string(),
      count: v.number(),
      revenue: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
    const courses = await ctx.db.query("courses").collect();
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();

    const categoryMap = new Map<string, { count: number; revenue: number }>();

    for (const course of courses) {
      const category = course.category || "Uncategorized";
      const analytics = courseAnalytics.find((ca) => ca.courseId === course._id);
      const revenue = analytics?.revenue || 0;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 1, revenue });
      } else {
        const cat = categoryMap.get(category)!;
        cat.count += 1;
        cat.revenue += revenue;
      }
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count);
  },
});

// Get recent activity (last 50 events)
export const getRecentActivity = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      type: v.string(),
      description: v.string(),
      timestamp: v.number(),
      userId: v.optional(v.string()),
      amount: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      userId?: string;
      amount?: number;
    }> = [];

    // Get recent purchases (most important activity)
    const purchases = await ctx.db.query("purchases").order("desc").take(30);

    for (const purchase of purchases) {
      if (purchase.status !== "completed") continue;

      let productName = "Unknown Product";
      if (purchase.courseId) {
        try {
          const course = await ctx.db.get(purchase.courseId);
          if (course) productName = course.title;
        } catch {
          // Ignore errors
        }
      } else if (purchase.productId) {
        try {
          const product = await ctx.db.get(purchase.productId);
          if (product) productName = product.title;
        } catch {
          // Ignore errors
        }
      }

      activities.push({
        type: "purchase",
        description: `Purchase: "${productName}" for $${((purchase.amount || 0) / 100).toFixed(2)}`,
        timestamp: purchase._creationTime,
        userId: purchase.userId,
        amount: purchase.amount,
      });
    }

    // Get recent enrollments
    const enrollments = await ctx.db.query("enrollments").order("desc").take(20);

    for (const enrollment of enrollments) {
      let courseTitle = "Unknown Course";
      try {
        const course = await ctx.db.get(enrollment.courseId as any);
        if (course && "title" in course) {
          courseTitle = course.title as string;
        }
      } catch {
        // Ignore errors
      }

      activities.push({
        type: "enrollment",
        description: `New enrollment in "${courseTitle}"`,
        timestamp: enrollment._creationTime,
        userId: enrollment.userId,
      });
    }

    // Get recent user signups
    const users = await ctx.db.query("users").order("desc").take(15);

    for (const user of users) {
      activities.push({
        type: "user_signup",
        description: `New user: ${user.name || user.firstName || user.email || "Anonymous"}`,
        timestamp: user._creationTime,
        userId: user.clerkId,
      });
    }

    // Get recent published courses
    const courses = await ctx.db.query("courses").order("desc").take(15);

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
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  },
});

// Get all creators with their products and courses (admin only)
export const getAllCreatorsWithProducts = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      email: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      stores: v.array(
        v.object({
          _id: v.id("stores"),
          name: v.string(),
          slug: v.string(),
          isPublic: v.boolean(),
        })
      ),
      courses: v.array(
        v.object({
          _id: v.id("courses"),
          title: v.string(),
          price: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          storeId: v.optional(v.string()),
        })
      ),
      digitalProducts: v.array(
        v.object({
          _id: v.id("digitalProducts"),
          title: v.string(),
          price: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          productType: v.optional(v.string()),
          storeId: v.optional(v.string()),
        })
      ),
      totalRevenue: v.number(),
      totalEnrollments: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Get all stores, courses, products, and analytics
    const stores = await ctx.db.query("stores").collect();
    const courses = await ctx.db.query("courses").collect();
    const digitalProducts = await ctx.db.query("digitalProducts").collect();
    const courseAnalytics = await ctx.db.query("courseAnalytics").collect();
    const enrollments = await ctx.db.query("enrollments").collect();

    // Build creator data
    const creatorsWithProducts = [];

    for (const user of users) {
      if (!user.clerkId) continue; // Skip users without Clerk ID

      // Get user's stores
      const userStores = stores.filter((s) => s.userId === user.clerkId);

      // Get user's courses (courses use Clerk ID)
      const userCourses = courses.filter((c) => c.userId === user.clerkId);

      // Get user's digital products (products use Convex user ID)
      const userProducts = digitalProducts.filter((p) => p.userId === user._id);

      // Calculate total revenue from course analytics
      const userRevenue = userCourses.reduce((sum, course) => {
        const analytics = courseAnalytics.find((ca) => ca.courseId === course._id);
        return sum + (analytics?.revenue || 0);
      }, 0);

      // Calculate total enrollments
      const userEnrollments = enrollments.filter((e) =>
        userCourses.some((c) => c._id === e.courseId)
      ).length;

      // Only include creators who have stores, courses, or products
      if (userStores.length > 0 || userCourses.length > 0 || userProducts.length > 0) {
        creatorsWithProducts.push({
          userId: user.clerkId,
          name: user.name || user.firstName || user.email || "Unknown",
          email: user.email,
          imageUrl: user.imageUrl,
          stores: userStores.map((s) => ({
            _id: s._id,
            name: s.name || "Unnamed Store",
            slug: s.slug,
            isPublic: s.isPublic || false,
          })),
          courses: userCourses.map((c) => ({
            _id: c._id,
            title: c.title,
            price: c.price,
            isPublished: c.isPublished,
            storeId: c.storeId,
          })),
          digitalProducts: userProducts.map((p) => ({
            _id: p._id,
            title: p.title,
            price: p.price,
            isPublished: p.isPublished,
            productType: p.productType,
            storeId: p.storeId,
          })),
          totalRevenue: userRevenue,
          totalEnrollments: userEnrollments,
        });
      }
    }

    // Sort by total revenue (descending)
    return creatorsWithProducts.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
});

// ============================================================================
// ADMIN EMAIL QUERIES - For emailing creators
// ============================================================================

/**
 * Get all creators with their email info for admin email system
 */
export const getCreatorsForEmail = query({
  args: {
    clerkId: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      clerkId: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
      courseCount: v.number(),
      productCount: v.number(),
      totalRevenue: v.number(),
      lastActive: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const stores = await ctx.db.query("stores").collect();
    const courses = await ctx.db.query("courses").collect();
    const products = await ctx.db.query("digitalProducts").collect();
    const purchases = await ctx.db.query("purchases").collect();

    const creators = [];

    for (const store of stores) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      if (!user || !user.email || !user.clerkId) continue;

      // Apply search filter
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        const nameMatch = (user.name || "").toLowerCase().includes(searchLower);
        const emailMatch = (user.email || "").toLowerCase().includes(searchLower);
        const storeMatch = (store.name || "").toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch && !storeMatch) continue;
      }

      const userCourses = courses.filter((c) => c.userId === store.userId);
      const userProducts = products.filter((p) => p.storeId === store._id);
      const userPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );
      const totalRevenue = userPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      creators.push({
        _id: user._id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        storeName: store.name,
        storeSlug: store.slug,
        courseCount: userCourses.length,
        productCount: userProducts.length,
        totalRevenue: totalRevenue / 100,
        lastActive: user._creationTime,
      });
    }

    // Sort by total revenue
    creators.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Apply limit
    if (args.limit) {
      return creators.slice(0, args.limit);
    }

    return creators;
  },
});

/**
 * Get creator email stats for admin dashboard
 */
export const getCreatorEmailStats = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    totalCreators: v.number(),
    creatorsWithEmail: v.number(),
    activeCreators: v.number(),
    newCreatorsThisMonth: v.number(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const stores = await ctx.db.query("stores").collect();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    let totalCreators = 0;
    let creatorsWithEmail = 0;
    let activeCreators = 0;
    let newCreatorsThisMonth = 0;

    for (const store of stores) {
      totalCreators++;

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      if (user?.email) {
        creatorsWithEmail++;
      }

      if (store._creationTime > thirtyDaysAgo) {
        newCreatorsThisMonth++;
      }

      // Check if creator is active (has courses or products)
      const hasCourses = await ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .first();
      const hasProducts = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .first();

      if (hasCourses || hasProducts) {
        activeCreators++;
      }
    }

    return {
      totalCreators,
      creatorsWithEmail,
      activeCreators,
      newCreatorsThisMonth,
    };
  },
});
