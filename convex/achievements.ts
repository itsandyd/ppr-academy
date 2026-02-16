import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
      .take(1000);

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
    const newLevel = Math.floor(newXP / 100) + 1;
    const oldLevel = Math.floor((xpRecord?.totalXP || 0) / 100) + 1;

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

    // Trigger expert level nudge if just reached level 8+
    if (newLevel >= 8 && oldLevel < 8) {
      await ctx.scheduler.runAfter(0, internal.conversionNudges.triggerExpertLevel, {
        userId: args.userId,
        level: newLevel,
        totalXP: newXP,
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
      // Get XP reward for this achievement
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

      // Check if not already unlocked
      const achievementRecord = await ctx.db
        .query("userAchievements")
        .withIndex("by_userId_and_achievementId", (q) =>
          q.eq("userId", args.userId).eq("achievementId", args.achievementId)
        )
        .unique();

      if (!achievementRecord?.unlocked) {
        // Unlock the achievement
        if (achievementRecord) {
          await ctx.db.patch(achievementRecord._id, {
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

        const newXP = (xpRecord?.totalXP || 0) + xpReward;

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
      }
    }

    return null;
  },
});

/**
 * Check and award achievement automatically (internal mutation for use in other mutations)
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

    const xpReward = xpRewards[args.achievementId] || 50;

    // Check if not already unlocked
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_and_achievementId", (q) =>
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .unique();

    if (existing?.unlocked) {
      return null; // Already unlocked
    }

    // Unlock the achievement
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

    const newXP = (xpRecord?.totalXP || 0) + xpReward;

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

    return null;
  },
});

// ============================================================================
// CREATOR XP SYSTEM
// ============================================================================

/**
 * XP rewards for creator actions
 */
const CREATOR_XP_REWARDS: Record<string, number> = {
  "first_store": 50,           // Creating first store
  "product_created": 25,       // Creating a product
  "product_published": 50,     // Publishing a product
  "course_created": 75,        // Creating a course
  "course_published": 100,     // Publishing a course
  "first_sale": 150,           // First sale ever
  "sale_completed": 10,        // Each sale
  "review_received": 25,       // Receiving a review
  "five_star_review": 50,      // 5-star review
  "student_enrolled": 15,      // Student enrolling
  "chapter_completed": 5,      // Student completes chapter
  "course_completed": 30,      // Student completes entire course
  "revenue_milestone_100": 200,  // $100 revenue
  "revenue_milestone_1000": 500, // $1000 revenue
  "revenue_milestone_10000": 1000, // $10000 revenue
  "ten_products": 150,         // 10 products created
  "hundred_students": 300,     // 100 total students
};

/**
 * Calculate creator level from XP
 */
function calculateCreatorLevel(xp: number): number {
  // Level formula: sqrt(xp / 100) + 1, capped at 100
  return Math.min(Math.floor(Math.sqrt(xp / 100)) + 1, 100);
}

/**
 * Get creator XP and level for a user
 */
export const getCreatorXP = query({
  args: { userId: v.string() },
  returns: v.object({
    creatorXP: v.number(),
    creatorLevel: v.number(),
    xpToNextLevel: v.number(),
    isCreator: v.boolean(),
    creatorSince: v.optional(v.number()),
    creatorBadges: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return {
        creatorXP: 0,
        creatorLevel: 0,
        xpToNextLevel: 100,
        isCreator: false,
        creatorSince: undefined,
        creatorBadges: [],
      };
    }

    const xp = user.creatorXP || 0;
    const level = calculateCreatorLevel(xp);
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const xpToNextLevel = nextLevelXP - xp;

    return {
      creatorXP: xp,
      creatorLevel: user.creatorLevel || level,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      isCreator: user.isCreator || false,
      creatorSince: user.creatorSince,
      creatorBadges: user.creatorBadges || [],
    };
  },
});

/**
 * Award creator XP for an action (internal mutation)
 */
export const awardCreatorXP = internalMutation({
  args: {
    userId: v.string(),
    action: v.string(), // Key from CREATOR_XP_REWARDS
    customXP: v.optional(v.number()), // Override default XP
  },
  returns: v.object({
    xpAwarded: v.number(),
    newTotal: v.number(),
    newLevel: v.number(),
    leveledUp: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const xpToAward = args.customXP ?? CREATOR_XP_REWARDS[args.action] ?? 10;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return { xpAwarded: 0, newTotal: 0, newLevel: 0, leveledUp: false };
    }

    const currentXP = user.creatorXP || 0;
    const currentLevel = user.creatorLevel || 1;
    const newTotal = currentXP + xpToAward;
    const newLevel = calculateCreatorLevel(newTotal);
    const leveledUp = newLevel > currentLevel;

    await ctx.db.patch(user._id, {
      creatorXP: newTotal,
      creatorLevel: newLevel,
      isCreator: true, // Ensure creator flag is set
    });

    // Track XP gain event for analytics
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "creator_xp_earned",
      timestamp: Date.now(),
      metadata: {
        action: args.action,
        xpAwarded: xpToAward,
        newTotal,
        newLevel,
        leveledUp,
      },
    });

    return {
      xpAwarded: xpToAward,
      newTotal,
      newLevel,
      leveledUp,
    };
  },
});

/**
 * Award a creator badge
 */
export const awardCreatorBadge = internalMutation({
  args: {
    userId: v.string(),
    badge: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) return false;

    const currentBadges = user.creatorBadges || [];
    if (currentBadges.includes(args.badge)) {
      return false; // Already has badge
    }

    await ctx.db.patch(user._id, {
      creatorBadges: [...currentBadges, args.badge],
    });

    return true;
  },
});

