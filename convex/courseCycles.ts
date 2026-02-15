import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Course Cycle Config CRUD Operations
// ============================================================================

/**
 * Create a new course cycle configuration
 */
export const createCourseCycleConfig = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    courseIds: v.array(v.id("courses")),
    courseTimings: v.array(
      v.object({
        courseId: v.id("courses"),
        timingMode: v.union(v.literal("fixed"), v.literal("engagement")),
        nurtureEmailCount: v.number(),
        nurtureDelayDays: v.number(),
        pitchEmailCount: v.number(),
        pitchDelayDays: v.number(),
        purchaseCheckDelayDays: v.number(),
        engagementWaitDays: v.optional(v.number()),
        minEngagementActions: v.optional(v.number()),
      })
    ),
    loopOnCompletion: v.boolean(),
    differentContentOnSecondCycle: v.boolean(),
  },
  returns: v.id("courseCycleConfigs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("courseCycleConfigs", {
      ...args,
      isActive: false, // Start inactive until emails are generated
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get a course cycle config by ID
 */
export const getCourseCycleConfig = query({
  args: {
    configId: v.id("courseCycleConfigs"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) return null;

    // Enrich with course details
    const coursesWithDetails = await Promise.all(
      config.courseIds.map(async (courseId) => {
        const course = await ctx.db.get(courseId);
        return course
          ? {
              _id: course._id,
              title: course.title,
              imageUrl: course.imageUrl,
              price: course.price,
            }
          : null;
      })
    );

    return {
      ...config,
      courses: coursesWithDetails.filter(Boolean),
    };
  },
});

/**
 * Internal query for getting config (for use in actions)
 */
export const getConfig = internalQuery({
  args: {
    configId: v.id("courseCycleConfigs"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});

/**
 * List all course cycle configs for a store
 */
export const listCourseCycleConfigs = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("courseCycleConfigs")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    // Enrich with course counts and email generation status
    return Promise.all(
      configs.map(async (config) => {
        const emailCount = await ctx.db
          .query("courseCycleEmails")
          .withIndex("by_courseCycleConfigId", (q) =>
            q.eq("courseCycleConfigId", config._id)
          )
          .take(500);

        return {
          ...config,
          courseCount: config.courseIds.length,
          generatedEmailCount: emailCount.length,
        };
      })
    );
  },
});

/**
 * Update a course cycle config
 */
export const updateCourseCycleConfig = mutation({
  args: {
    configId: v.id("courseCycleConfigs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    courseIds: v.optional(v.array(v.id("courses"))),
    courseTimings: v.optional(
      v.array(
        v.object({
          courseId: v.id("courses"),
          timingMode: v.union(v.literal("fixed"), v.literal("engagement")),
          nurtureEmailCount: v.number(),
          nurtureDelayDays: v.number(),
          pitchEmailCount: v.number(),
          pitchDelayDays: v.number(),
          purchaseCheckDelayDays: v.number(),
          engagementWaitDays: v.optional(v.number()),
          minEngagementActions: v.optional(v.number()),
        })
      )
    ),
    loopOnCompletion: v.optional(v.boolean()),
    differentContentOnSecondCycle: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { configId, ...updates } = args;

    const existing = await ctx.db.get(configId);
    if (!existing) throw new Error("Course cycle config not found");

    await ctx.db.patch(configId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a course cycle config and its emails
 */
export const deleteCourseCycleConfig = mutation({
  args: {
    configId: v.id("courseCycleConfigs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all associated emails
    const emails = await ctx.db
      .query("courseCycleEmails")
      .withIndex("by_courseCycleConfigId", (q) =>
        q.eq("courseCycleConfigId", args.configId)
      )
      .take(500);

    for (const email of emails) {
      await ctx.db.delete(email._id);
    }

    // Delete the config
    await ctx.db.delete(args.configId);
  },
});

/**
 * Toggle active status
 */
export const toggleCourseCycleActive = mutation({
  args: {
    configId: v.id("courseCycleConfigs"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Course cycle config not found");

    const newStatus = !config.isActive;
    await ctx.db.patch(args.configId, {
      isActive: newStatus,
      updatedAt: Date.now(),
    });

    return newStatus;
  },
});

// ============================================================================
// Course Cycle Email Operations
// ============================================================================

/**
 * Save a generated cycle email
 */
export const saveCycleEmail = internalMutation({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    emailType: v.union(v.literal("nurture"), v.literal("pitch")),
    emailIndex: v.number(),
    cycleNumber: v.number(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    generatedFromLesson: v.optional(v.string()),
  },
  returns: v.id("courseCycleEmails"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("courseCycleEmails", {
      ...args,
      generatedAt: Date.now(),
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
    });
  },
});

/**
 * Get cycle email for sending
 */
export const getCycleEmail = internalQuery({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    emailType: v.union(v.literal("nurture"), v.literal("pitch")),
    emailIndex: v.number(),
    cycleNumber: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("courseCycleEmails")
      .withIndex("by_courseId_type_cycle", (q) =>
        q
          .eq("courseId", args.courseId)
          .eq("emailType", args.emailType)
          .eq("cycleNumber", args.cycleNumber)
      )
      .take(500);

    // Find the email with matching config and index
    return emails.find(
      (e) =>
        e.courseCycleConfigId === args.courseCycleConfigId &&
        e.emailIndex === args.emailIndex
    );
  },
});

/**
 * List all emails for a course cycle config
 */
export const listCycleEmails = query({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("courseCycleEmails")
      .withIndex("by_courseCycleConfigId", (q) =>
        q.eq("courseCycleConfigId", args.courseCycleConfigId)
      )
      .take(500);

    // Group by course
    const courseGroups: Record<string, typeof emails> = {};
    for (const email of emails) {
      const key = email.courseId;
      if (!courseGroups[key]) courseGroups[key] = [];
      courseGroups[key].push(email);
    }

    // Enrich with course details
    const result = await Promise.all(
      Object.entries(courseGroups).map(async ([courseId, courseEmails]) => {
        const course = await ctx.db.get(courseId as Id<"courses">);
        return {
          courseId,
          courseName: course?.title || "Unknown Course",
          emails: courseEmails.sort((a, b) => {
            if (a.emailType !== b.emailType) {
              return a.emailType === "nurture" ? -1 : 1;
            }
            return a.emailIndex - b.emailIndex;
          }),
        };
      })
    );

    return result;
  },
});

/**
 * Update email content
 */
export const updateCycleEmail = mutation({
  args: {
    emailId: v.id("courseCycleEmails"),
    subject: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    textContent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { emailId, ...updates } = args;
    await ctx.db.patch(emailId, updates);
  },
});

/**
 * Track email sent
 */
export const trackEmailSent = internalMutation({
  args: {
    emailId: v.id("courseCycleEmails"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (email) {
      await ctx.db.patch(args.emailId, {
        sentCount: (email.sentCount || 0) + 1,
      });
    }
  },
});

/**
 * Track email opened
 */
export const trackEmailOpened = internalMutation({
  args: {
    emailId: v.id("courseCycleEmails"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (email) {
      await ctx.db.patch(args.emailId, {
        openedCount: (email.openedCount || 0) + 1,
      });
    }
  },
});

/**
 * Track email clicked
 */
export const trackEmailClicked = internalMutation({
  args: {
    emailId: v.id("courseCycleEmails"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (email) {
      await ctx.db.patch(args.emailId, {
        clickedCount: (email.clickedCount || 0) + 1,
      });
    }
  },
});

/**
 * Delete all emails for a course in a config (for regeneration)
 */
export const deleteCourseEmails = mutation({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("courseCycleEmails")
      .withIndex("by_courseCycleConfigId", (q) =>
        q.eq("courseCycleConfigId", args.courseCycleConfigId)
      )
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .take(500);

    for (const email of emails) {
      await ctx.db.delete(email._id);
    }

    return emails.length;
  },
});

// ============================================================================
// Execution Helpers
// ============================================================================

/**
 * Get user's purchased courses from the cycle config
 */
export const getUserPurchasedCourses = internalQuery({
  args: {
    customerEmail: v.string(),
    courseIds: v.array(v.id("courses")),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user || !user.clerkId) return [];

    // Check purchases for each course
    const purchasedIds: string[] = [];

    for (const courseId of args.courseIds) {
      const purchase = await ctx.db
        .query("purchases")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", user.clerkId!).eq("courseId", courseId)
        )
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (purchase) {
        purchasedIds.push(courseId);
      }
    }

    return purchasedIds;
  },
});

/**
 * Check if user has purchased a specific course
 */
export const checkCoursePurchase = internalQuery({
  args: {
    customerEmail: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();

    if (!user || !user.clerkId) return false;

    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", user.clerkId!).eq("courseId", args.courseId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    return !!purchase;
  },
});

/**
 * Get available courses for cycle configuration
 */
export const getAvailableCoursesForCycle = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Get all published courses for this store
    const courses = await ctx.db
      .query("courses")
      .filter((q) =>
        q.and(
          q.eq(q.field("storeId"), args.storeId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    // Get module counts for each course
    return Promise.all(
      courses.map(async (c) => {
        const modules = await ctx.db
          .query("courseModules")
          .filter((q) => q.eq(q.field("courseId"), c._id))
          .take(200);

        return {
          _id: c._id,
          title: c.title,
          imageUrl: c.imageUrl,
          price: c.price,
          moduleCount: modules.length,
        };
      })
    );
  },
});

// ============================================================================
// AI Generation Helpers (used by courseCycleAI.ts)
// ============================================================================

interface CourseContentForAI {
  title: string;
  description: string;
  price: number;
  skillLevel?: string;
  modules: {
    title: string;
    description?: string;
    lessons: {
      title: string;
      description?: string;
      chapters: {
        title: string;
        description?: string;
      }[];
    }[];
  }[];
}

/**
 * Get course content for AI generation
 */
export const getCourseContentForAI = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<CourseContentForAI | null> => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    // Get modules
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .take(200);

    // Sort by position
    modules.sort((a, b) => a.position - b.position);

    // Get lessons and chapters for each module
    const modulesWithContent = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("courseLessons")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
          .take(200);

        lessons.sort((a, b) => a.position - b.position);

        const lessonsWithChapters = await Promise.all(
          lessons.map(async (lesson) => {
            const chapters = await ctx.db
              .query("courseChapters")
              .filter((q) => q.eq(q.field("lessonId"), lesson._id))
              .take(200);

            chapters.sort((a, b) => a.position - b.position);

            return {
              title: lesson.title,
              description: lesson.description,
              chapters: chapters.map((c) => ({
                title: c.title,
                description: c.description,
              })),
            };
          })
        );

        return {
          title: module.title,
          description: module.description,
          lessons: lessonsWithChapters,
        };
      })
    );

    return {
      title: course.title,
      description: course.description || "",
      price: course.price || 0,
      skillLevel: course.skillLevel,
      modules: modulesWithContent,
    };
  },
});

/**
 * Delete emails for a specific course/cycle (internal mutation for regeneration)
 */
export const deleteEmailsForCycle = internalMutation({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    cycleNumber: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("courseCycleEmails")
      .withIndex("by_courseCycleConfigId", (q) =>
        q.eq("courseCycleConfigId", args.courseCycleConfigId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("cycleNumber"), args.cycleNumber)
        )
      )
      .take(500);

    for (const email of emails) {
      await ctx.db.delete(email._id);
    }

    return emails.length;
  },
});
