import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all achievements for a user
 */
export const getUserAchievements = query({
  args: { 
    userId: v.string() // Clerk ID
  },
  returns: v.array(v.object({
    achievementId: v.string(),
    unlocked: v.boolean(),
    progress: v.optional(v.object({
      current: v.number(),
      target: v.number()
    })),
    unlockedAt: v.optional(v.number()),
    _id: v.id("userAchievements")
  })),
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return userAchievements.map(achievement => ({
      achievementId: achievement.achievementId,
      unlocked: achievement.unlocked,
      progress: achievement.progress,
      unlockedAt: achievement.unlockedAt,
      _id: achievement._id
    }));
  },
});

/**
 * Get user's total XP
 */
export const getUserXP = query({
  args: { 
    userId: v.string() 
  },
  returns: v.object({
    totalXP: v.number(),
    level: v.number(),
    xpToNextLevel: v.number()
  }),
  handler: async (ctx, args) => {
    const xpRecord = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!xpRecord) {
      return {
        totalXP: 0,
        level: 1,
        xpToNextLevel: 100
      };
    }

    // Calculate level (100 XP per level, increasing)
    const level = Math.floor(xpRecord.totalXP / 100) + 1;
    const xpToNextLevel = (level * 100) - xpRecord.totalXP;

    return {
      totalXP: xpRecord.totalXP,
      level,
      xpToNextLevel
    };
  },
});

/**
 * Unlock an achievement for a user
 */
export const unlockAchievement = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
    xpReward: v.number()
  },
  returns: v.object({
    unlocked: v.boolean(),
    newXP: v.number()
  }),
  handler: async (ctx, args) => {
    // Check if already unlocked
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_and_achievementId", (q) => 
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .unique();

    if (existing && existing.unlocked) {
      return { unlocked: false, newXP: 0 };
    }

    // Create or update achievement record
    if (existing) {
      await ctx.db.patch(existing._id, {
        unlocked: true,
        unlockedAt: Date.now(),
        progress: undefined
      });
    } else {
      await ctx.db.insert("userAchievements", {
        userId: args.userId,
        achievementId: args.achievementId,
        unlocked: true,
        unlockedAt: Date.now()
      });
    }

    // Award XP
    const xpRecord = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const newXP = (xpRecord?.totalXP || 0) + args.xpReward;

    if (xpRecord) {
      await ctx.db.patch(xpRecord._id, {
        totalXP: newXP,
        lastXPGain: Date.now()
      });
    } else {
      await ctx.db.insert("userXP", {
        userId: args.userId,
        totalXP: newXP,
        lastXPGain: Date.now()
      });
    }

    return { unlocked: true, newXP };
  },
});

/**
 * Update achievement progress
 */
export const updateAchievementProgress = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
    current: v.number(),
    target: v.number()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_and_achievementId", (q) => 
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .unique();

    const progress = {
      current: args.current,
      target: args.target
    };

    if (existing) {
      await ctx.db.patch(existing._id, { progress });
    } else {
      await ctx.db.insert("userAchievements", {
        userId: args.userId,
        achievementId: args.achievementId,
        unlocked: false,
        progress
      });
    }

    // Auto-unlock if progress reached target
    if (args.current >= args.target) {
      // Get XP reward for this achievement (hardcoded for now)
      const xpRewards: Record<string, number> = {
        "first-product": 50,
        "first-sale": 100,
        "revenue-100": 150,
        "revenue-1000": 300,
        "ten-products": 200,
        "five-star-review": 100,
        "100-students": 250,
        "7-day-streak": 75,
        "30-day-streak": 500,
        "top-seller": 1000,
        "first-course": 25,
        "first-completion": 100,
        "five-courses": 250,
        "first-certificate": 100,
        "student-streak-7": 50,
        "community-contributor": 150
      };

      const xpReward = xpRewards[args.achievementId] || 50;
      // @ts-expect-error - Deep type instantiation limitation with Convex function references
      await ctx.runMutation(api.achievements.unlockAchievement, {
        userId: args.userId,
        achievementId: args.achievementId,
        xpReward
      });
    }

    return null;
  },
});

/**
 * Check and award achievement automatically
 */
export const checkAndAwardAchievement = internalMutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
    condition: v.boolean() // Whether achievement should be awarded
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.condition) return null;

    const xpRewards: Record<string, number> = {
      "first-product": 50,
      "first-sale": 100,
      "revenue-100": 150,
      "revenue-1000": 300,
      "ten-products": 200,
      "five-star-review": 100,
      "100-students": 250,
      "7-day-streak": 75,
      "30-day-streak": 500,
      "top-seller": 1000,
      "first-course": 25,
      "first-completion": 100,
      "five-courses": 250,
      "first-certificate": 100,
      "student-streak-7": 50,
      "community-contributor": 150
    };

    await ctx.runMutation(api.achievements.unlockAchievement, {
      userId: args.userId,
      achievementId: args.achievementId,
      xpReward: xpRewards[args.achievementId] || 50
    });

    return null;
  },
});

// Helper to import in mutations
import { api } from "./_generated/api";

