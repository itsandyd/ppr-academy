import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get social proof data for a course
 */
export const getCourseSocialProof = query({
  args: { courseId: v.id("courses") },
  returns: v.object({
    totalEnrollments: v.number(),
    enrollmentsThisWeek: v.number(),
    enrollmentsThisMonth: v.number(),
    recentEnrollments: v.array(v.object({
      firstName: v.optional(v.string()),
      enrolledAt: v.number(),
    })),
    averageRating: v.number(),
    totalReviews: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get purchases for this course using index
    const coursePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(5000);

    const completedPurchases = coursePurchases.filter(p => p.status === "completed");
    const weeklyPurchases = completedPurchases.filter(p => p._creationTime >= oneWeekAgo);
    const monthlyPurchases = completedPurchases.filter(p => p._creationTime >= oneMonthAgo);

    // Get recent enrollments with user names (last 5)
    const recentPurchases = completedPurchases
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    const recentEnrollments = await Promise.all(
      recentPurchases.map(async (purchase) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
          .first();

        return {
          firstName: user?.firstName || undefined,
          enrolledAt: purchase._creationTime,
        };
      })
    );

    // Get course reviews for real rating data
    const reviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(1000);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return {
      totalEnrollments: completedPurchases.length,
      enrollmentsThisWeek: weeklyPurchases.length,
      enrollmentsThisMonth: monthlyPurchases.length,
      recentEnrollments,
      averageRating,
      totalReviews,
    };
  },
});

/**
 * Get social proof data for a digital product
 */
export const getProductSocialProof = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.object({
    totalPurchases: v.number(),
    purchasesThisWeek: v.number(),
    purchasesThisMonth: v.number(),
    recentPurchases: v.array(v.object({
      firstName: v.optional(v.string()),
      purchasedAt: v.number(),
    })),
    averageRating: v.number(),
    totalReviews: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get purchases for this product using index
    const productPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(5000);

    const completedPurchases = productPurchases.filter(p => p.status === "completed");
    const weeklyPurchases = completedPurchases.filter(p => p._creationTime >= oneWeekAgo);
    const monthlyPurchases = completedPurchases.filter(p => p._creationTime >= oneMonthAgo);

    // Get recent purchases with user names (last 5)
    const recentPurchasesList = completedPurchases
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    const recentPurchases = await Promise.all(
      recentPurchasesList.map(async (purchase) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
          .first();

        return {
          firstName: user?.firstName || undefined,
          purchasedAt: purchase._creationTime,
        };
      })
    );

    // Get reviews for this product using index
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(1000);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : 0;

    return {
      totalPurchases: completedPurchases.length,
      purchasesThisWeek: weeklyPurchases.length,
      purchasesThisMonth: monthlyPurchases.length,
      recentPurchases,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    };
  },
});

/**
 * Get comprehensive statistics for a store
 */
export const getStoreStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    totalProducts: v.number(),
    totalCourses: v.number(),
    totalEnrollments: v.number(),
    totalDownloads: v.number(),
    totalRevenue: v.number(),
    averageRating: v.number(),
    followerCount: v.number(),
    freeProducts: v.number(),
    paidProducts: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all published products for this store
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);

    // Get all published courses for this store using index
    const allStoreCourses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);
    const courses = allStoreCourses.filter((c) => c.isPublished === true);

    // Count free and paid products
    const freeProducts = products.filter(p => (p.price || 0) === 0).length;
    const paidProducts = products.filter(p => (p.price || 0) > 0).length;
    const freeCourses = courses.filter(c => (c.price || 0) === 0).length;
    const paidCourses = courses.filter(c => (c.price || 0) > 0).length;

    // Get purchases scoped to this store using index
    const storePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(2000);

    const productIds = products.map(p => p._id);
    const courseIds = courses.map(c => c._id);

    // Filter purchases for this store's products and courses
    const productPurchases = storePurchases.filter(p =>
      p.productId && productIds.includes(p.productId)
    );
    const coursePurchases = storePurchases.filter(p =>
      p.courseId && courseIds.includes(p.courseId)
    );

    // Calculate total revenue from actual purchase amounts
    const productRevenue = productPurchases.reduce((sum, purchase) => {
      return sum + (purchase.amount || 0);
    }, 0);

    const courseRevenue = coursePurchases.reduce((sum, purchase) => {
      return sum + (purchase.amount || 0);
    }, 0);

    // Get unique users who have purchased/enrolled
    const uniqueCustomers = new Set([
      ...productPurchases.map(p => p.userId),
      ...coursePurchases.map(p => p.userId)
    ]);

    // Calculate average rating from product reviews
    const allReviews = await Promise.all(
      productIds.map(productId =>
        ctx.db.query("productReviews")
          .withIndex("by_productId", q => q.eq("productId", productId))
          .take(1000)
      )
    );
    const flatReviews = allReviews.flat().filter(r => r.rating !== undefined);
    const averageRating = flatReviews.length > 0
      ? flatReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / flatReviews.length
      : 0;

    return {
      totalProducts: products.length,
      totalCourses: courses.length,
      totalEnrollments: coursePurchases.length,
      totalDownloads: productPurchases.length,
      totalRevenue: productRevenue + courseRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      followerCount: uniqueCustomers.size,
      freeProducts: freeProducts + freeCourses,
      paidProducts: paidProducts + paidCourses,
    };
  },
});

/**
 * Get quick stats for store header display
 */
export const getQuickStoreStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    totalItems: v.number(),
    totalStudents: v.number(),
    totalSales: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all published products
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);

    // Get all published courses using index
    const allCourses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);
    const courses = allCourses.filter((c) => c.isPublished === true);

    // Get all published bundles
    const bundles = await ctx.db
      .query("bundles")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId as any).eq("isPublished", true))
      .take(500);

    // Get purchases scoped to this store using index
    const productIds = products.map(p => p._id);
    const courseIds = courses.map(c => c._id);
    const bundleIds = bundles.map(b => b._id);

    const storePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(2000);

    // Get unique students
    const uniqueStudents = new Set(storePurchases.map(p => p.userId));

    return {
      totalItems: products.length + courses.length + bundles.length,
      totalStudents: uniqueStudents.size,
      totalSales: storePurchases.length,
    };
  },
});

/**
 * Get student roster for a store - all students who have purchased from this store
 */
export const getStoreStudents = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      clerkId: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      totalPurchases: v.number(),
      totalSpent: v.number(),
      coursesEnrolled: v.number(),
      productsOwned: v.number(),
      firstPurchaseDate: v.number(),
      lastPurchaseDate: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all purchases for this store
    const allPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_store_status", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(5000);

    // Group purchases by user
    const userPurchasesMap = new Map<string, typeof allPurchases>();

    for (const purchase of allPurchases) {
      const existing = userPurchasesMap.get(purchase.userId) || [];
      existing.push(purchase);
      userPurchasesMap.set(purchase.userId, existing);
    }

    // Build student list with aggregated data
    const students: Array<{
      clerkId: string;
      name: string | undefined;
      email: string | undefined;
      imageUrl: string | undefined;
      totalPurchases: number;
      totalSpent: number;
      coursesEnrolled: number;
      productsOwned: number;
      firstPurchaseDate: number;
      lastPurchaseDate: number;
    }> = [];

    for (const [userId, purchases] of userPurchasesMap) {
      // Get user details
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
        .first();

      const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
      const coursesEnrolled = purchases.filter(p => p.productType === "course").length;
      const productsOwned = purchases.filter(p => p.productType !== "course").length;
      const purchaseDates = purchases.map(p => p._creationTime);

      students.push({
        clerkId: userId,
        name: user?.name || undefined,
        email: user?.email || undefined,
        imageUrl: user?.imageUrl || undefined,
        totalPurchases: purchases.length,
        totalSpent,
        coursesEnrolled,
        productsOwned,
        firstPurchaseDate: Math.min(...purchaseDates),
        lastPurchaseDate: Math.max(...purchaseDates),
      });
    }

    // Sort by total spent (highest first) and limit
    return students
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },
});

/**
 * Get students with their course progress for a store
 */
export const getStudentsWithProgress = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  // Note: returns validator removed to avoid TypeScript deep recursion issue
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all courses for this store using index
    const storeCourses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    const courseIds = storeCourses.map((c) => c._id);

    // Get all purchases for this store
    const allPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_store_status", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(2000);

    // Get chapter counts per course using index
    const courseChaptersMap = new Map<string, number>();

    for (const course of storeCourses) {
      const chapters = await ctx.db
        .query("courseChapters")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .take(200);
      courseChaptersMap.set(course._id, chapters.length);
    }

    // Get user progress per course using index
    const allUserProgress: Array<any> = [];
    for (const course of storeCourses) {
      const progress = await ctx.db
        .query("userProgress")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .take(5000);
      allUserProgress.push(...progress);
    }

    // Group purchases by user
    const userPurchasesMap = new Map<string, typeof allPurchases>();
    for (const purchase of allPurchases) {
      const existing = userPurchasesMap.get(purchase.userId) || [];
      existing.push(purchase);
      userPurchasesMap.set(purchase.userId, existing);
    }

    // Get all digital products for this store to resolve product names
    const storeProducts = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    // Build student list with progress data
    const students: Array<{
      clerkId: string;
      name: string | undefined;
      email: string | undefined;
      imageUrl: string | undefined;
      totalPurchases: number;
      totalSpent: number;
      coursesEnrolled: number;
      productsOwned: number;
      firstPurchaseDate: number;
      lastPurchaseDate: number;
      overallProgress: number;
      coursesCompleted: number;
      chaptersCompleted: number;
      totalChapters: number;
      lastActivityAt: number | undefined;
      courseProgress: Array<{
        courseId: string;
        courseTitle: string;
        progress: number;
        chaptersCompleted: number;
        totalChapters: number;
        lastAccessedAt: number | undefined;
        enrolledAt: number;
      }>;
      products: Array<{
        productId: string;
        productTitle: string;
        productType: string;
        purchasedAt: number;
      }>;
    }> = [];

    for (const [userId, purchases] of userPurchasesMap) {
      // Get user details
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
        .first();

      const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
      const coursePurchases = purchases.filter((p) => p.productType === "course");
      const coursesEnrolled = coursePurchases.length;
      const productsOwned = purchases.filter((p) => p.productType !== "course").length;
      const purchaseDates = purchases.map((p) => p._creationTime);

      // Calculate progress for each enrolled course
      const courseProgress: Array<{
        courseId: string;
        courseTitle: string;
        progress: number;
        chaptersCompleted: number;
        totalChapters: number;
        lastAccessedAt: number | undefined;
        enrolledAt: number;
      }> = [];

      let totalChaptersCompleted = 0;
      let totalChaptersAll = 0;
      let lastActivityAt: number | undefined;
      let coursesCompleted = 0;

      for (const purchase of coursePurchases) {
        if (!purchase.courseId) continue;

        const course = storeCourses.find((c) => c._id === purchase.courseId);
        if (!course) continue;

        const totalChapters = courseChaptersMap.get(course._id) || 0;
        totalChaptersAll += totalChapters;

        // Get user's progress for this course
        const userCourseProgress = allUserProgress.filter(
          (p) => p.userId === userId && p.courseId === course._id
        );

        const completedChapters = userCourseProgress.filter((p) => p.isCompleted).length;
        totalChaptersCompleted += completedChapters;

        const progressPercent =
          totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        if (progressPercent === 100) {
          coursesCompleted++;
        }

        // Get last accessed time for this course
        const courseLastAccessed = userCourseProgress
          .map((p) => p.lastAccessedAt || 0)
          .sort((a, b) => b - a)[0];

        if (courseLastAccessed && (!lastActivityAt || courseLastAccessed > lastActivityAt)) {
          lastActivityAt = courseLastAccessed;
        }

        courseProgress.push({
          courseId: course._id,
          courseTitle: course.title,
          progress: progressPercent,
          chaptersCompleted: completedChapters,
          totalChapters,
          lastAccessedAt: courseLastAccessed || undefined,
          enrolledAt: purchase._creationTime,
        });
      }

      const overallProgress =
        totalChaptersAll > 0
          ? Math.round((totalChaptersCompleted / totalChaptersAll) * 100)
          : 0;

      // Build products array with all purchased items (courses and digital products)
      const products: Array<{
        productId: string;
        productTitle: string;
        productType: string;
        purchasedAt: number;
      }> = [];

      for (const purchase of purchases) {
        if (purchase.productType === "course" && purchase.courseId) {
          const course = storeCourses.find((c) => c._id === purchase.courseId);
          if (course) {
            products.push({
              productId: course._id,
              productTitle: course.title,
              productType: "course",
              purchasedAt: purchase._creationTime,
            });
          }
        } else if (purchase.productId) {
          const product = storeProducts.find((p) => p._id === purchase.productId);
          if (product) {
            products.push({
              productId: product._id,
              productTitle: product.title,
              productType: purchase.productType || "digitalProduct",
              purchasedAt: purchase._creationTime,
            });
          }
        }
      }

      students.push({
        clerkId: userId,
        name: user?.name || undefined,
        email: user?.email || undefined,
        imageUrl: user?.imageUrl || undefined,
        totalPurchases: purchases.length,
        totalSpent,
        coursesEnrolled,
        productsOwned,
        firstPurchaseDate: Math.min(...purchaseDates),
        lastPurchaseDate: Math.max(...purchaseDates),
        overallProgress,
        coursesCompleted,
        chaptersCompleted: totalChaptersCompleted,
        totalChapters: totalChaptersAll,
        lastActivityAt,
        courseProgress: courseProgress.sort((a, b) => b.enrolledAt - a.enrolledAt),
        products: products.sort((a, b) => b.purchasedAt - a.purchasedAt),
      });
    }

    // Sort by last activity (most recent first)
    return students
      .sort((a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0))
      .slice(0, limit);
  },
});

/**
 * Get detailed progress for a specific student in a store
 */
export const getStudentDetailedProgress = query({
  args: {
    storeId: v.string(),
    studentId: v.string(),
  },
  // Note: returns validator removed to avoid TypeScript deep recursion issue
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.studentId))
      .first();

    // Get all courses for this store using index
    const storeCourses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    // Get student's purchases for this store's courses
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_store_status", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(q.eq(q.field("userId"), args.studentId), q.eq(q.field("status"), "completed"))
      )
      .take(2000);

    const coursePurchases = purchases.filter((p) => p.productType === "course" && p.courseId);

    if (coursePurchases.length === 0) {
      return null;
    }

    // Get user's progress
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.studentId))
      .take(10000);

    const courses: Array<{
      courseId: string;
      courseTitle: string;
      courseSlug: string | undefined;
      courseImageUrl: string | undefined;
      enrolledAt: number;
      progress: number;
      chaptersCompleted: number;
      totalChapters: number;
      timeSpent: number;
      lastAccessedAt: number | undefined;
    }> = [];

    let totalTimeSpent = 0;
    let totalChaptersCompleted = 0;
    let totalCoursesCompleted = 0;

    for (const purchase of coursePurchases) {
      const course = storeCourses.find((c) => c._id === purchase.courseId);
      if (!course) continue;

      // Get chapters for this course using index
      const courseChapters = await ctx.db
        .query("courseChapters")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .take(200);

      let courseTimeSpent = 0;
      let courseChaptersCompleted = 0;
      let courseLastAccessed: number | undefined;

      for (const chapter of courseChapters) {
        const progress = userProgress.find((p) => p.chapterId === chapter._id);
        const isCompleted = progress?.isCompleted || false;
        const timeSpent = progress?.timeSpent || 0;

        if (isCompleted) {
          courseChaptersCompleted++;
          totalChaptersCompleted++;
        }

        courseTimeSpent += timeSpent;
        totalTimeSpent += timeSpent;

        if (progress?.lastAccessedAt) {
          if (!courseLastAccessed || progress.lastAccessedAt > courseLastAccessed) {
            courseLastAccessed = progress.lastAccessedAt;
          }
        }
      }

      const courseProgress =
        courseChapters.length > 0
          ? Math.round((courseChaptersCompleted / courseChapters.length) * 100)
          : 0;

      if (courseProgress === 100) {
        totalCoursesCompleted++;
      }

      courses.push({
        courseId: course._id,
        courseTitle: course.title,
        courseSlug: course.slug,
        courseImageUrl: course.imageUrl,
        enrolledAt: purchase._creationTime,
        progress: courseProgress,
        chaptersCompleted: courseChaptersCompleted,
        totalChapters: courseChapters.length,
        timeSpent: courseTimeSpent,
        lastAccessedAt: courseLastAccessed,
      });
    }

    const averageProgress =
      courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
        : 0;

    return {
      student: {
        clerkId: args.studentId,
        name: user?.name,
        email: user?.email,
        imageUrl: user?.imageUrl,
      },
      courses: courses.sort((a, b) => b.enrolledAt - a.enrolledAt),
      stats: {
        totalCoursesEnrolled: courses.length,
        totalCoursesCompleted,
        totalChaptersCompleted,
        totalTimeSpent,
        averageProgress,
      },
    };
  },
});

