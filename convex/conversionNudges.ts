import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Conversion Funnel Nudges System
 *
 * Tracks learner journey milestones and triggers contextual creator nudges:
 * 1. First Course Enrolled → "You could teach this"
 * 2. 5+ Lessons Completed → "Share your progress"
 * 3. Course Completed → "Ready to teach?" (existing)
 * 4. Certificate Earned → "Showcase credentials"
 * 5. Expert Level (L8+) → "Your expertise is valuable"
 * 6. Viewed 3+ Creator Profiles → "Start your store"
 * 7. Leaderboard Visit → "Join Top Creators"
 */

// ============================================================
// NUDGE CREATION & QUERIES
// ============================================================

/**
 * Get active nudges for a user (not dismissed)
 */
export const getActiveNudges = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const nudges = await ctx.db
      .query("userNudges")
      .withIndex("by_userId_and_dismissed", (q: any) =>
        q.eq("userId", args.userId).eq("dismissed", false)
      )
      .collect();

    return nudges;
  },
});

/**
 * Get the most relevant nudge for display (prioritized)
 */
export const getPriorityNudge = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check if user is already a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) {
      return null; // Don't show become_creator nudges to creators
    }

    const nudges = await ctx.db
      .query("userNudges")
      .withIndex("by_userId_and_dismissed", (q: any) =>
        q.eq("userId", args.userId).eq("dismissed", false)
      )
      .collect();

    if (nudges.length === 0) return null;

    // Priority order for nudge contexts (higher priority first)
    const priorityOrder = [
      "certificate_earned",
      "course_completed",
      "expert_level",
      "lessons_milestone",
      "first_enrollment",
      "leaderboard_visit",
      "creator_profile_views",
      "share_progress",
      "returning_learner",
      "default",
    ];

    // Sort by priority
    const sorted = nudges.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.nudgeContext);
      const bIndex = priorityOrder.indexOf(b.nudgeContext);
      return aIndex - bIndex;
    });

    return sorted[0];
  },
});

/**
 * Dismiss a nudge
 */
export const dismissNudge = mutation({
  args: {
    nudgeId: v.id("userNudges"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const nudge = await ctx.db.get(args.nudgeId);
    if (!nudge || nudge.userId !== args.userId) return;

    await ctx.db.patch(args.nudgeId, {
      dismissed: true,
      dismissedAt: Date.now(),
    });

    // Track dismissal
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "nudge_dismissed",
      timestamp: Date.now(),
      metadata: {
        nudgeType: nudge.nudgeType,
        nudgeContext: nudge.nudgeContext,
      },
    });
  },
});

/**
 * Mark nudge as shown (for tracking impressions)
 */
export const markNudgeShown = mutation({
  args: {
    nudgeId: v.id("userNudges"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const nudge = await ctx.db.get(args.nudgeId);
    if (!nudge || nudge.userId !== args.userId || nudge.shown) return;

    await ctx.db.patch(args.nudgeId, {
      shown: true,
      shownAt: Date.now(),
    });

    // Track impression
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "nudge_shown",
      timestamp: Date.now(),
      metadata: {
        nudgeType: nudge.nudgeType,
        nudgeContext: nudge.nudgeContext,
      },
    });
  },
});

/**
 * Mark nudge as converted (user became a creator)
 */
export const markNudgeConverted = mutation({
  args: {
    userId: v.string(),
    nudgeContext: v.string(),
  },
  handler: async (ctx, args) => {
    const nudges = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .collect();

    for (const nudge of nudges) {
      if (!nudge.converted) {
        await ctx.db.patch(nudge._id, {
          converted: true,
          convertedAt: Date.now(),
        });
      }
    }

    // Track conversion
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "nudge_converted",
      timestamp: Date.now(),
      metadata: {
        lastNudgeContext: args.nudgeContext,
      },
    });
  },
});

// ============================================================
// TRIGGER 1: FIRST COURSE ENROLLED
// ============================================================

/**
 * Trigger when user enrolls in their first course
 * "You could teach this" - subtle prompt
 */
export const triggerFirstEnrollment = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Check if user already has this nudge
    const existing = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "first_enrollment"))
      .first();

    if (existing) return null;

    // Check if user is a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) return null;

    // Get course info
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    // Check if this is actually their first enrollment
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .collect();

    if (enrollments.length > 1) return null; // Not their first

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "first_enrollment",
      contextData: {
        courseName: course.title,
        courseId: args.courseId,
        courseCategory: course.category,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    // Track event
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "conversion_nudge_triggered",
      timestamp: Date.now(),
      metadata: {
        nudgeContext: "first_enrollment",
        courseName: course.title,
      },
    });

    return nudgeId;
  },
});

// ============================================================
// TRIGGER 2: 5+ LESSONS COMPLETED
// ============================================================

/**
 * Trigger when user completes 5+ lessons total
 * "Share your progress" prompt
 */
export const triggerLessonsMilestone = internalMutation({
  args: {
    userId: v.string(),
    lessonCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Only trigger at exactly 5, 10, 25, 50 lessons
    const milestones = [5, 10, 25, 50, 100];
    if (!milestones.includes(args.lessonCount)) return null;

    // Check if already have this exact milestone nudge
    const existing = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "lessons_milestone"))
      .collect();

    const hasMilestone = existing.some(
      (n: any) => n.contextData?.lessonCount === args.lessonCount
    );
    if (hasMilestone) return null;

    // Check if user is a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) return null;

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "lessons_milestone",
      contextData: {
        lessonCount: args.lessonCount,
        milestone: `${args.lessonCount} lessons completed!`,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    // Track event
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "conversion_nudge_triggered",
      timestamp: Date.now(),
      metadata: {
        nudgeContext: "lessons_milestone",
        lessonCount: args.lessonCount,
      },
    });

    return nudgeId;
  },
});

// ============================================================
// TRIGGER 3: SHARE PROGRESS PROMPT
// ============================================================

/**
 * Create a share progress nudge for users actively learning
 */
export const triggerShareProgress = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    progressPercentage: v.number(),
  },
  handler: async (ctx, args) => {
    // Only trigger at 25%, 50%, 75% progress
    const progressMilestones = [25, 50, 75];
    const nearMilestone = progressMilestones.find(
      (m) => Math.abs(args.progressPercentage - m) < 2
    );
    if (!nearMilestone) return null;

    // Check if already shown for this course at this milestone
    const existing = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "share_progress"))
      .collect();

    const hasThisMilestone = existing.some(
      (n: any) =>
        n.contextData?.courseId === args.courseId &&
        n.contextData?.progressPercentage === nearMilestone
    );
    if (hasThisMilestone) return null;

    // Get course info
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "share_progress",
      contextData: {
        courseId: args.courseId,
        courseName: course.title,
        progressPercentage: nearMilestone,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    return nudgeId;
  },
});

// ============================================================
// TRIGGER 4: CERTIFICATE EARNED - SHOWCASE CREDENTIALS
// ============================================================

/**
 * Trigger when user earns a certificate
 * "Showcase your credentials" CTA
 */
export const triggerCertificateShowcase = internalMutation({
  args: {
    userId: v.string(),
    certificateId: v.string(),
    courseName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) return null;

    // Check how many certificates user has
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "certificate_earned",
      contextData: {
        certificateId: args.certificateId,
        courseName: args.courseName,
        totalCertificates: certificates.length,
        isMultiple: certificates.length > 1,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    // Track event
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "conversion_nudge_triggered",
      timestamp: Date.now(),
      metadata: {
        nudgeContext: "certificate_earned",
        certificateCount: certificates.length,
      },
    });

    return nudgeId;
  },
});

// ============================================================
// TRIGGER 5: EXPERT LEVEL (L8+)
// ============================================================

/**
 * Trigger when user reaches expert level (L8+)
 * "Your expertise is valuable" prompt
 */
export const triggerExpertLevel = internalMutation({
  args: {
    userId: v.string(),
    level: v.number(),
    totalXP: v.number(),
  },
  handler: async (ctx, args) => {
    // Only trigger at level 8 or above
    if (args.level < 8) return null;

    // Check if already have expert level nudge
    const existing = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "expert_level"))
      .first();

    if (existing) return null;

    // Check if user is a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) return null;

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "expert_level",
      contextData: {
        level: args.level,
        totalXP: args.totalXP,
        expertTitle: getExpertTitle(args.level),
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    // Track event
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "conversion_nudge_triggered",
      timestamp: Date.now(),
      metadata: {
        nudgeContext: "expert_level",
        level: args.level,
      },
    });

    return nudgeId;
  },
});

function getExpertTitle(level: number): string {
  if (level >= 15) return "Master";
  if (level >= 12) return "Expert";
  if (level >= 10) return "Advanced";
  return "Skilled";
}

// ============================================================
// TRIGGER 6: VIEWED 3+ CREATOR PROFILES
// ============================================================

/**
 * Track creator profile views and trigger nudge at 3+
 * "Start your store" banner
 */
export const trackCreatorProfileView = mutation({
  args: {
    userId: v.string(),
    creatorId: v.string(),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    // Get or create profile view tracking
    const existingTracking = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "creator_profile_views"))
      .first();

    const viewedProfiles: string[] = existingTracking?.contextData?.viewedProfiles || [];

    // Add this profile if not already viewed
    if (!viewedProfiles.includes(args.creatorId)) {
      viewedProfiles.push(args.creatorId);
    }

    // If we have an existing nudge, update it
    if (existingTracking) {
      await ctx.db.patch(existingTracking._id, {
        contextData: {
          ...existingTracking.contextData,
          viewedProfiles,
          viewCount: viewedProfiles.length,
        },
      });

      // If just reached 3, mark as ready to show
      if (viewedProfiles.length === 3 && !existingTracking.shown) {
        await ctx.db.insert("analyticsEvents", {
          userId: args.userId,
          eventType: "conversion_nudge_triggered",
          timestamp: Date.now(),
          metadata: {
            nudgeContext: "creator_profile_views",
            viewCount: 3,
          },
        });
      }

      return existingTracking._id;
    }

    // Create new tracking nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "creator_profile_views",
      contextData: {
        viewedProfiles,
        viewCount: viewedProfiles.length,
        triggerThreshold: 3,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    return nudgeId;
  },
});

/**
 * Get creator profile view nudge if ready (3+ views)
 */
export const getCreatorProfileViewNudge = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const nudge = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "creator_profile_views"))
      .first();

    if (!nudge) return null;

    // Only return if threshold reached and not dismissed
    const viewCount = nudge.contextData?.viewCount || 0;
    if (viewCount >= 3 && !nudge.dismissed) {
      return nudge;
    }

    return null;
  },
});

// ============================================================
// TRIGGER 7: LEADERBOARD VISIT
// ============================================================

/**
 * Track leaderboard page visit and create nudge
 * "Join Top Creators" CTA
 */
export const trackLeaderboardVisit = mutation({
  args: {
    userId: v.string(),
    leaderboardType: v.optional(v.string()), // "creators", "students", "streaks"
  },
  handler: async (ctx, args) => {
    // Check if already have leaderboard nudge (only show once)
    const existing = await ctx.db
      .query("userNudges")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("nudgeContext"), "leaderboard_visit"))
      .first();

    if (existing) {
      // Update visit count
      const visitCount = (existing.contextData?.visitCount || 0) + 1;
      await ctx.db.patch(existing._id, {
        contextData: {
          ...existing.contextData,
          visitCount,
          lastVisit: Date.now(),
        },
      });
      return existing._id;
    }

    // Check if user is a creator
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (user?.isCreator) return null;

    // Get user's current rank on student leaderboard
    const xpRecord = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();

    const userXP = xpRecord?.totalXP || 0;
    const userLevel = Math.floor(userXP / 100) + 1;

    // Create the nudge
    const nudgeId = await ctx.db.insert("userNudges", {
      userId: args.userId,
      nudgeType: "become_creator",
      nudgeContext: "leaderboard_visit",
      contextData: {
        visitCount: 1,
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        leaderboardType: args.leaderboardType || "all",
        userLevel,
        userXP,
      },
      dismissed: false,
      createdAt: Date.now(),
    });

    // Track event
    await ctx.db.insert("analyticsEvents", {
      userId: args.userId,
      eventType: "conversion_nudge_triggered",
      timestamp: Date.now(),
      metadata: {
        nudgeContext: "leaderboard_visit",
        leaderboardType: args.leaderboardType,
      },
    });

    return nudgeId;
  },
});

// ============================================================
// UTILITY: CHECK ALL TRIGGERS ON USER ACTIVITY
// ============================================================

/**
 * Call this after any significant user activity to check for trigger conditions
 */
export const checkConversionTriggers = internalMutation({
  args: {
    userId: v.string(),
    activityType: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const triggeredNudges: string[] = [];

    // Get user data
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    // Skip all checks if user is already a creator
    if (user?.isCreator) return { triggered: [] };

    // Get user XP and level
    const xpRecord = await ctx.db
      .query("userXP")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();

    const totalXP = xpRecord?.totalXP || 0;
    const level = Math.floor(totalXP / 100) + 1;

    // Check expert level trigger (L8+)
    if (level >= 8) {
      const result = await ctx.runMutation(internal.conversionNudges.triggerExpertLevel, {
        userId: args.userId,
        level,
        totalXP,
      });
      if (result) triggeredNudges.push("expert_level");
    }

    // Check lessons milestone
    if (args.activityType === "lesson_completed") {
      const completedLessons = await ctx.db
        .query("userProgress")
        .withIndex("by_user_completed", (q: any) =>
          q.eq("userId", args.userId).eq("isCompleted", true)
        )
        .collect();

      const lessonCount = completedLessons.length;
      const result = await ctx.runMutation(internal.conversionNudges.triggerLessonsMilestone, {
        userId: args.userId,
        lessonCount,
      });
      if (result) triggeredNudges.push("lessons_milestone");
    }

    return { triggered: triggeredNudges };
  },
});
