import { query } from "./_generated/server";
import { v } from "convex/values";

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
      .collect();

    // Get all published courses for this store
    const courses = await ctx.db
      .query("courses")
      .filter((q) => 
        q.and(
          q.eq(q.field("storeId"), args.storeId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    // Count free and paid products
    const freeProducts = products.filter(p => (p.price || 0) === 0).length;
    const paidProducts = products.filter(p => (p.price || 0) > 0).length;
    const freeCourses = courses.filter(c => (c.price || 0) === 0).length;
    const paidCourses = courses.filter(c => (c.price || 0) > 0).length;

    // Get all purchases for products in this store
    const productIds = products.map(p => p._id);
    const courseIds = courses.map(c => c._id);
    
    const allPurchases = await ctx.db.query("purchases").collect();
    
    // Filter purchases for this store's products and courses
    const productPurchases = allPurchases.filter(p => 
      p.productId && productIds.includes(p.productId)
    );
    const coursePurchases = allPurchases.filter(p => 
      p.courseId && courseIds.includes(p.courseId)
    );

    // Calculate total revenue
    const productRevenue = productPurchases.reduce((sum, purchase) => {
      const product = products.find(p => p._id === purchase.productId);
      return sum + (product?.price || 0);
    }, 0);

    const courseRevenue = coursePurchases.reduce((sum, purchase) => {
      const course = courses.find(c => c._id === purchase.courseId);
      return sum + (course?.price || 0);
    }, 0);

    // Get unique users who have purchased/enrolled
    const uniqueCustomers = new Set([
      ...productPurchases.map(p => p.userId),
      ...coursePurchases.map(p => p.userId)
    ]);

    return {
      totalProducts: products.length,
      totalCourses: courses.length,
      totalEnrollments: coursePurchases.length,
      totalDownloads: productPurchases.length,
      totalRevenue: productRevenue + courseRevenue,
      averageRating: 4.8, // TODO: Calculate from actual reviews when available
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
      .collect();

    // Get all published courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => 
        q.and(
          q.eq(q.field("storeId"), args.storeId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    // Get all purchases
    const productIds = products.map(p => p._id);
    const courseIds = courses.map(c => c._id);
    
    const allPurchases = await ctx.db.query("purchases").collect();
    
    const storePurchases = allPurchases.filter(p => 
      (p.productId && productIds.includes(p.productId)) ||
      (p.courseId && courseIds.includes(p.courseId))
    );

    // Get unique students
    const uniqueStudents = new Set(storePurchases.map(p => p.userId));

    return {
      totalItems: products.length + courses.length,
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
      .collect();

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

