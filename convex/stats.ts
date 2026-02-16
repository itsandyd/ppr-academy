import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get platform-wide statistics for public display
 */
export const getPlatformStats = query({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    totalCourses: v.number(),
    totalCreators: v.number(),
    totalProducts: v.number(),
  }),
  handler: async (ctx) => {
    // Count total users
    const users = await ctx.db.query("users").take(10000);
    const totalUsers = users.length;

    // Count total published courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(10000);
    const totalCourses = courses.length;

    // Count total stores (creators)
    const stores = await ctx.db.query("stores").take(10000);
    const totalCreators = stores.length;

    // Count total published digital products
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(10000);
    const totalProducts = products.length;

    return {
      totalUsers,
      totalCourses,
      totalCreators,
      totalProducts,
    };
  },
});

