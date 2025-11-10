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

