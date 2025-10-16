import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get top creators by revenue
 */
export const getTopCreators = query({
  args: {
    limit: v.optional(v.number()),
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all-time")))
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    totalRevenue: v.number(),
    productCount: v.number(),
    studentCount: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    // TODO: Implement real revenue aggregation
    // For now, return mock data structure
    
    // Get all users with clerkId
    const users = await ctx.db.query("users").collect();
    const usersWithClerkId = users.filter(user => user.clerkId);
    
    // Mock leaderboard data - only include users with clerkId
    const leaderboard = usersWithClerkId.slice(0, limit).map((user, index) => ({
      userId: user.clerkId!, // Now guaranteed to exist
      rank: index + 1,
      totalRevenue: Math.floor(Math.random() * 10000),
      productCount: Math.floor(Math.random() * 20),
      studentCount: Math.floor(Math.random() * 100),
      name: user.firstName || user.email || "Creator",
      avatar: user.imageUrl,
      badge: index === 0 ? "Top Seller" : index < 3 ? "Rising Star" : undefined
    }));

    return leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },
});

/**
 * Get top students by XP
 */
export const getTopStudents = query({
  args: {
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    totalXP: v.number(),
    coursesCompleted: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get all user XP records
    const xpRecords = await ctx.db
      .query("userXP")
      .order("desc")
      .take(limit);

    const leaderboard = await Promise.all(
      xpRecords.map(async (xp, index) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", xp.userId))
          .unique();

        return {
          userId: xp.userId,
          rank: index + 1,
          totalXP: xp.totalXP,
          coursesCompleted: 0, // TODO: Calculate from enrollments
          name: user?.firstName || user?.email || "Student",
          avatar: user?.imageUrl,
          badge: index === 0 ? "Scholar" : undefined
        };
      })
    );

    return leaderboard;
  },
});

/**
 * Get most active users by login streak
 */
export const getMostActive = query({
  args: {
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    userId: v.string(),
    rank: v.number(),
    streak: v.number(),
    name: v.string(),
    avatar: v.optional(v.string()),
    badge: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // TODO: Implement real streak tracking
    // For now, return mock data
    const users = await ctx.db.query("users").collect();
    const usersWithClerkId = users.filter(user => user.clerkId);
    
    const leaderboard = usersWithClerkId.slice(0, limit).map((user, index) => ({
      userId: user.clerkId!, // Now guaranteed to exist
      rank: index + 1,
      streak: Math.floor(Math.random() * 45) + 1,
      name: user.firstName || user.email || "User",
      avatar: user.imageUrl,
      badge: index === 0 ? "🔥" : undefined
    }));

    return leaderboard.sort((a, b) => b.streak - a.streak)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },
});

/**
 * Get user's leaderboard position
 */
export const getUserPosition = query({
  args: {
    userId: v.string(),
    leaderboardType: v.union(v.literal("creators"), v.literal("students"), v.literal("active"))
  },
  returns: v.object({
    rank: v.number(),
    percentile: v.number()
  }),
  handler: async (ctx, args) => {
    // TODO: Implement actual ranking logic
    // For now, return mock position
    return {
      rank: 45,
      percentile: 82 // Top 18%
    };
  },
});

