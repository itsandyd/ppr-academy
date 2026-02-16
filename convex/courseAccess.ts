import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * COURSE ACCESS CONTROL
 * Unified access checking for courses, chapters, and related content
 * Handles: purchases, bundles, free previews, follow gates
 */

// Access types for different scenarios
export type AccessType =
  | "purchased"
  | "bundle"
  | "membership"
  | "ppr_pro"
  | "free_preview"
  | "follow_gate"
  | "creator"
  | "admin"
  | "no_access";

export interface AccessResult {
  hasAccess: boolean;
  accessType: AccessType;
  purchaseDate?: number;
  expiresAt?: number;
  bundleId?: string;
  requiresFollowGate?: boolean;
  followGateCompleted?: boolean;
}

// ===== MAIN ACCESS QUERIES =====

/**
 * Check if user can access a specific chapter
 * This is the primary access check for course content
 */
export const canAccessChapter = query({
  args: {
    userId: v.optional(v.string()),
    courseId: v.id("courses"),
    chapterId: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    accessType: v.string(),
    reason: v.optional(v.string()),
    requiresFollowGate: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course || course.deletedAt) {
      return { hasAccess: false, accessType: "no_access", reason: "course_not_found" };
    }

    // Get the chapter
    const chapter = await ctx.db
      .query("courseChapters")
      .filter((q) =>
        q.and(
          q.eq(q.field("_id"), args.chapterId),
          q.eq(q.field("courseId"), args.courseId)
        )
      )
      .first();

    if (!chapter) {
      return { hasAccess: false, accessType: "no_access", reason: "chapter_not_found" };
    }

    // Check if chapter is free preview
    if (chapter.isFree === true) {
      return { hasAccess: true, accessType: "free_preview" };
    }

    // If no user, no access to paid content
    if (!args.userId) {
      return { hasAccess: false, accessType: "no_access", reason: "not_authenticated" };
    }

    // Store userId in a const for type narrowing
    const userId = args.userId;

    // Check if user is the course creator
    if (course.userId === userId || course.instructorId === userId) {
      return { hasAccess: true, accessType: "creator" };
    }

    // Check for PPR Pro membership (platform-level, grants access to ALL courses)
    const pprProAccess = await checkPprProAccess(ctx, userId);
    if (pprProAccess) {
      return { hasAccess: true, accessType: "ppr_pro" };
    }

    // Check for direct purchase
    const directPurchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (directPurchase) {
      return { hasAccess: true, accessType: "purchased", purchaseDate: directPurchase._creationTime };
    }

    // Check for bundle purchase that includes this course
    const bundleAccess = await checkBundleAccess(ctx, userId, args.courseId);
    if (bundleAccess.hasAccess) {
      return bundleAccess;
    }

    // Check for membership/subscription access
    const membershipAccess = await checkMembershipCourseAccess(ctx, userId, course);
    if (membershipAccess) {
      return { hasAccess: true, accessType: "membership" };
    }

    // Check for follow gate access (free course with follow requirements)
    if (course.followGateEnabled && course.price === 0) {
      const followGateCompleted = await checkFollowGateCompletion(ctx, userId, args.courseId);
      if (followGateCompleted) {
        return { hasAccess: true, accessType: "follow_gate" };
      }
      return {
        hasAccess: false,
        accessType: "no_access",
        reason: "follow_gate_required",
        requiresFollowGate: true,
      };
    }

    return { hasAccess: false, accessType: "no_access", reason: "not_purchased" };
  },
});

/**
 * Check full course access (for accessing course overview, chapter list, etc.)
 */
export const canAccessCourse = query({
  args: {
    userId: v.optional(v.string()),
    courseId: v.id("courses"),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    accessType: v.string(),
    purchaseDate: v.optional(v.number()),
    freeChaptersCount: v.optional(v.number()),
    totalChapters: v.optional(v.number()),
    requiresFollowGate: v.optional(v.boolean()),
    followGateConfig: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.deletedAt) {
      return { hasAccess: false, accessType: "no_access" };
    }

    // Count chapters
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(1000);

    const totalChapters = chapters.length;
    const freeChaptersCount = chapters.filter((ch) => ch.isFree === true).length;

    // No user = only free chapters accessible
    if (!args.userId) {
      return {
        hasAccess: freeChaptersCount > 0,
        accessType: freeChaptersCount > 0 ? "free_preview" : "no_access",
        freeChaptersCount,
        totalChapters,
      };
    }

    // Store userId in a const for type narrowing
    const userId = args.userId;

    // Course creator has full access
    if (course.userId === userId || course.instructorId === userId) {
      return {
        hasAccess: true,
        accessType: "creator",
        freeChaptersCount,
        totalChapters,
      };
    }

    // PPR Pro membership check (platform-level, grants access to ALL courses)
    const pprProAccessCourse = await checkPprProAccess(ctx, userId);
    if (pprProAccessCourse) {
      return {
        hasAccess: true,
        accessType: "ppr_pro",
        freeChaptersCount,
        totalChapters,
      };
    }

    // Direct purchase check
    const directPurchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (directPurchase) {
      return {
        hasAccess: true,
        accessType: "purchased",
        purchaseDate: directPurchase._creationTime,
        freeChaptersCount,
        totalChapters,
      };
    }

    // Bundle purchase check
    const bundleAccess = await checkBundleAccess(ctx, userId, args.courseId);
    if (bundleAccess.hasAccess) {
      return {
        ...bundleAccess,
        freeChaptersCount,
        totalChapters,
      };
    }

    // Membership/subscription access check
    const membershipAccess = await checkMembershipCourseAccess(ctx, userId, course);
    if (membershipAccess) {
      return {
        hasAccess: true,
        accessType: "membership",
        freeChaptersCount,
        totalChapters,
      };
    }

    // Follow gate check for free courses
    if (course.followGateEnabled && course.price === 0) {
      const followGateCompleted = await checkFollowGateCompletion(ctx, userId, args.courseId);
      if (followGateCompleted) {
        return {
          hasAccess: true,
          accessType: "follow_gate",
          freeChaptersCount,
          totalChapters,
        };
      }
      return {
        hasAccess: false,
        accessType: "no_access",
        requiresFollowGate: true,
        followGateConfig: {
          requirements: course.followGateRequirements,
          socialLinks: course.followGateSocialLinks,
          message: course.followGateMessage,
        },
        freeChaptersCount,
        totalChapters,
      };
    }

    // No access, but can view free chapters
    return {
      hasAccess: false,
      accessType: "no_access",
      freeChaptersCount,
      totalChapters,
    };
  },
});

/**
 * Get accessible chapters for a user
 * Returns list of chapter IDs the user can access
 */
export const getAccessibleChapters = query({
  args: {
    userId: v.optional(v.string()),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.deletedAt) {
      return { accessibleChapterIds: [], hasFullAccess: false };
    }

    // Get all published chapters
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(1000);

    // If no user, only return free chapters
    if (!args.userId) {
      const freeChapters = chapters.filter((ch) => ch.isFree === true);
      return {
        accessibleChapterIds: freeChapters.map((ch) => ch._id),
        hasFullAccess: false,
      };
    }

    // Store userId in a const for type narrowing
    const userId = args.userId;

    // Check for full access
    const hasFullAccess = await checkFullCourseAccess(ctx, userId, course);

    if (hasFullAccess) {
      return {
        accessibleChapterIds: chapters.map((ch) => ch._id),
        hasFullAccess: true,
      };
    }

    // Only free chapters
    const freeChapters = chapters.filter((ch) => ch.isFree === true);
    return {
      accessibleChapterIds: freeChapters.map((ch) => ch._id),
      hasFullAccess: false,
    };
  },
});

// ===== INTERNAL QUERIES =====

/**
 * Internal query to check course access (for use in other mutations)
 */
export const checkCourseAccessInternal = internalQuery({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.deletedAt) {
      return { hasAccess: false, reason: "course_not_found" };
    }

    return { hasAccess: await checkFullCourseAccess(ctx, args.userId, course) };
  },
});

// ===== HELPER FUNCTIONS =====

/**
 * Check if user has access through a bundle purchase
 */
async function checkBundleAccess(
  ctx: any,
  userId: string,
  courseId: Id<"courses">
): Promise<{ hasAccess: boolean; accessType: AccessType; bundleId?: string; purchaseDate?: number }> {
  // Get all bundles that include this course
  const bundles = await ctx.db
    .query("bundles")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .take(1000);

  const bundlesWithCourse = bundles.filter((b: any) =>
    b.courseIds?.includes(courseId)
  );

  if (bundlesWithCourse.length === 0) {
    return { hasAccess: false, accessType: "no_access" };
  }

  // Check if user has purchased any of these bundles
  for (const bundle of bundlesWithCourse) {
    const bundlePurchase = await ctx.db
      .query("purchases")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("bundleId"), bundle._id),
          q.eq(q.field("status"), "completed")
        )
      )
      .first();

    if (bundlePurchase) {
      return {
        hasAccess: true,
        accessType: "bundle",
        bundleId: bundle._id,
        purchaseDate: bundlePurchase._creationTime,
      };
    }
  }

  return { hasAccess: false, accessType: "no_access" };
}

/**
 * Check if user has completed follow gate requirements for a course
 *
 * Note: Follow gate tracking for courses currently uses the purchases table
 * with status="completed" and amount=0 for free courses with completed follow gates.
 * This differs from digitalProducts which use the followGateSubmissions table.
 *
 * POST-LAUNCH: Consider adding a dedicated courseFollowGateSubmissions table for better tracking
 */
async function checkFollowGateCompletion(
  ctx: any,
  userId: string,
  courseId: Id<"courses">
): Promise<boolean> {
  // For courses, follow gate completion is tracked via a zero-amount purchase record
  // This is created when user completes the follow gate requirements
  const followGatePurchase = await ctx.db
    .query("purchases")
    .withIndex("by_user_course", (q: any) =>
      q.eq("userId", userId).eq("courseId", courseId)
    )
    .filter((q: any) =>
      q.and(
        q.eq(q.field("status"), "completed"),
        q.eq(q.field("amount"), 0)
      )
    )
    .first();

  return !!followGatePurchase;
}

/**
 * Check if user has an active PPR Pro subscription
 */
async function checkPprProAccess(
  ctx: any,
  userId: string
): Promise<boolean> {
  const subscription = await ctx.db
    .query("pprProSubscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .filter((q: any) =>
      q.or(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("status"), "trialing")
      )
    )
    .first();
  return !!subscription;
}

/**
 * Check if user has full access to a course
 */
async function checkFullCourseAccess(
  ctx: any,
  userId: string,
  course: any
): Promise<boolean> {
  // Creator/instructor has full access
  if (course.userId === userId || course.instructorId === userId) {
    return true;
  }

  // PPR Pro membership
  const pprProFull = await checkPprProAccess(ctx, userId);
  if (pprProFull) {
    return true;
  }

  // Direct purchase
  const directPurchase = await ctx.db
    .query("purchases")
    .withIndex("by_user_course", (q: any) =>
      q.eq("userId", userId).eq("courseId", course._id)
    )
    .filter((q: any) => q.eq(q.field("status"), "completed"))
    .first();

  if (directPurchase) {
    return true;
  }

  // Bundle purchase
  const bundleAccess = await checkBundleAccess(ctx, userId, course._id);
  if (bundleAccess.hasAccess) {
    return true;
  }

  // Membership/subscription access
  const membershipAccess = await checkMembershipCourseAccess(ctx, userId, course);
  if (membershipAccess) {
    return true;
  }

  // Follow gate completion for free courses
  if (course.followGateEnabled && course.price === 0) {
    return await checkFollowGateCompletion(ctx, userId, course._id);
  }

  return false;
}

/**
 * Check if user has access to a course through an active membership subscription
 */
async function checkMembershipCourseAccess(
  ctx: any,
  userId: string,
  course: any
): Promise<boolean> {
  const creatorId = course.userId;

  // Find active subscription to this creator
  const subscription = await ctx.db
    .query("userCreatorSubscriptions")
    .withIndex("by_user_creator", (q: any) =>
      q.eq("userId", userId).eq("creatorId", creatorId)
    )
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .first();

  if (!subscription) return false;

  // Get the tier
  const tier = await ctx.db.get(subscription.tierId);
  if (!tier) return false;

  // If tier has unlimited courses (maxCourses is undefined/null), grant access
  if (tier.maxCourses === undefined || tier.maxCourses === null) {
    return true;
  }

  // Check if this specific course is included in the tier's content access rules
  const accessRule = await ctx.db
    .query("contentAccess")
    .withIndex("by_resourceId", (q: any) => q.eq("resourceId", course._id))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("resourceType"), "course"),
        q.eq(q.field("requiredTierId"), subscription.tierId)
      )
    )
    .first();

  return !!accessRule;
}

// ===== FOLLOW GATE MUTATIONS =====

/**
 * Complete follow gate requirements for a course
 * Called when user completes all follow requirements
 * Creates a zero-amount purchase record to grant access
 */
export const completeFollowGate = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    email: v.string(),
    name: v.optional(v.string()),
    completedRequirements: v.object({
      email: v.optional(v.boolean()),
      instagram: v.optional(v.boolean()),
      tiktok: v.optional(v.boolean()),
      youtube: v.optional(v.boolean()),
      spotify: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    alreadyCompleted: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!course.followGateEnabled) {
      return { success: false, error: "Course does not have follow gate enabled" };
    }

    // Check if already completed
    const existingAccess = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (existingAccess) {
      return { success: true, alreadyCompleted: true };
    }

    // Verify requirements are met
    const requirements = course.followGateRequirements;
    if (requirements) {
      const errors: string[] = [];
      if (requirements.requireEmail && !args.completedRequirements.email) {
        errors.push("Email");
      }
      if (requirements.requireInstagram && !args.completedRequirements.instagram) {
        errors.push("Instagram follow");
      }
      if (requirements.requireTiktok && !args.completedRequirements.tiktok) {
        errors.push("TikTok follow");
      }
      if (requirements.requireYoutube && !args.completedRequirements.youtube) {
        errors.push("YouTube follow");
      }
      if (requirements.requireSpotify && !args.completedRequirements.spotify) {
        errors.push("Spotify follow");
      }
      if (errors.length > 0) {
        return { success: false, error: `Missing requirements: ${errors.join(", ")}` };
      }
    }

    // Create a zero-amount purchase record to grant access
    await ctx.db.insert("purchases", {
      userId: args.userId,
      courseId: args.courseId,
      productType: "course",
      amount: 0,
      currency: "usd",
      status: "completed",
      accessGranted: true,
      storeId: course.storeId || course.userId, // Use storeId or fallback to creator's userId
      adminUserId: course.userId, // Course creator
    });

    return { success: true };
  },
});

/**
 * Validate follow gate requirements without completing (for UI validation)
 */
export const validateFollowGateRequirements = query({
  args: {
    courseId: v.id("courses"),
    completedRequirements: v.object({
      email: v.optional(v.boolean()),
      instagram: v.optional(v.boolean()),
      tiktok: v.optional(v.boolean()),
      youtube: v.optional(v.boolean()),
      spotify: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    isValid: v.boolean(),
    missingRequirements: v.array(v.string()),
    requirements: v.optional(v.any()),
    socialLinks: v.optional(v.any()),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || !course.followGateEnabled) {
      return {
        isValid: false,
        missingRequirements: [],
        message: "Course does not have follow gate enabled",
      };
    }

    const requirements = course.followGateRequirements;
    const missingRequirements: string[] = [];

    if (requirements) {
      if (requirements.requireEmail && !args.completedRequirements.email) {
        missingRequirements.push("email");
      }
      if (requirements.requireInstagram && !args.completedRequirements.instagram) {
        missingRequirements.push("instagram");
      }
      if (requirements.requireTiktok && !args.completedRequirements.tiktok) {
        missingRequirements.push("tiktok");
      }
      if (requirements.requireYoutube && !args.completedRequirements.youtube) {
        missingRequirements.push("youtube");
      }
      if (requirements.requireSpotify && !args.completedRequirements.spotify) {
        missingRequirements.push("spotify");
      }
    }

    return {
      isValid: missingRequirements.length === 0,
      missingRequirements,
      requirements: course.followGateRequirements,
      socialLinks: course.followGateSocialLinks,
      message: course.followGateMessage,
    };
  },
});
