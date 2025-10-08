// Marketplace queries for the hybrid homepage
// Provides featured content, platform stats, and creator spotlight

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get featured content (mix of courses and products)
 * Returns up to `limit` featured items that have been marked as featured
 */
export const getFeaturedContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()), // We'll use v.any() since we're combining different types
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    // Get featured courses (if they have a featured field)
    const allCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(3);

    // Get featured products (if they have a featured field)
    const allProducts = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(3);

    // Combine and tag with content type
    const combined: Array<any> = [
      ...allCourses.map(c => ({ ...c, contentType: 'course' })),
      ...allProducts.map(p => ({ ...p, contentType: 'product' })),
    ];

    // Shuffle and limit
    return combined
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  },
});

/**
 * Get platform statistics for social proof
 * Returns counts of creators, courses, products, and students
 */
export const getPlatformStats = query({
  args: {},
  returns: v.object({
    totalCreators: v.number(),
    totalCourses: v.number(),
    totalProducts: v.number(),
    totalStudents: v.number(),
  }),
  handler: async (ctx) => {
    // Count unique stores (creators)
    const stores = await ctx.db.query("stores").collect();
    const totalCreators = stores.length;

    // Count published courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    const totalCourses = courses.length;

    // Count published products
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    const totalProducts = products.length;

    // Count unique students (users who have made purchases)
    const purchases = await ctx.db.query("purchases").collect();
    const uniqueStudents = new Set(purchases.map(p => p.userId));
    const totalStudents = uniqueStudents.size;

    return {
      totalCreators,
      totalCourses,
      totalProducts,
      totalStudents,
    };
  },
});

/**
 * Get creator spotlight - features a top creator
 * Rotates based on most products or can be manually selected
 */
export const getCreatorSpotlight = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      slug: v.string(),
      bio: v.optional(v.string()),
      avatar: v.optional(v.string()),
      totalProducts: v.number(),
      totalStudents: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // Get all stores
    const stores = await ctx.db.query("stores").collect();
    
    if (stores.length === 0) {
      return null;
    }

    // Calculate stats for each store
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        // Count published courses
        const coursesCount = await ctx.db
          .query("courses")
          .filter((q) => 
            q.and(
              q.eq(q.field("storeId"), store._id),
              q.eq(q.field("isPublished"), true)
            )
          )
          .collect()
          .then(c => c.length);

        // Count published products
        const productsCount = await ctx.db
          .query("digitalProducts")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect()
          .then(p => p.length);

        // Count unique students for this store
        const storePurchases = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect();
        const uniqueStudents = new Set(storePurchases.map(p => p.userId));

        return {
          store,
          totalProducts: coursesCount + productsCount,
          totalStudents: uniqueStudents.size,
        };
      })
    );

    // Sort by total products (most active creator)
    storesWithStats.sort((a, b) => b.totalProducts - a.totalProducts);

    const topStore = storesWithStats[0];
    if (!topStore || topStore.totalProducts === 0) {
      return null;
    }

    // Get user info for this store
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), topStore.store.userId))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name || "Creator",
      slug: topStore.store.slug,
      bio: user.bio,
      avatar: user.imageUrl,
      totalProducts: topStore.totalProducts,
      totalStudents: topStore.totalStudents,
    };
  },
});

