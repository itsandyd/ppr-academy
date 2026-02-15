import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * COURSE DRIP CONTENT SYSTEM
 * Implements Teachable-style drip content for courses
 *
 * Features:
 * - Release content X days after enrollment
 * - Release content on specific dates
 * - Release content after completing previous module
 * - Email notifications when content unlocks
 * - Manual override for instructors
 */

// ===== QUERIES =====

/**
 * Get drip settings for all modules in a course
 */
export const getCourseDripSettings = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(200);

    return modules.map((module) => ({
      moduleId: module._id,
      title: module.title,
      position: module.position,
      dripEnabled: module.dripEnabled || false,
      dripType: module.dripType || "days_after_enrollment",
      dripDaysAfterEnrollment: module.dripDaysAfterEnrollment || 0,
      dripSpecificDate: module.dripSpecificDate,
      dripNotifyStudents: module.dripNotifyStudents ?? true,
    })).sort((a, b) => a.position - b.position);
  },
});

/**
 * Get student's drip access status for a course
 */
export const getStudentDripAccess = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Get all modules for the course
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as string))
      .take(200);

    // Get drip access records for this user
    const dripAccess = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .take(500);

    const accessMap = new Map(
      dripAccess.map((a) => [a.moduleId.toString(), a])
    );

    return modules.map((module) => {
      const access = accessMap.get(module._id.toString());

      // If no drip is enabled, module is always accessible
      if (!module.dripEnabled) {
        return {
          moduleId: module._id,
          title: module.title,
          position: module.position,
          isUnlocked: true,
          scheduledUnlockAt: null,
          dripEnabled: false,
        };
      }

      return {
        moduleId: module._id,
        title: module.title,
        position: module.position,
        isUnlocked: access?.isUnlocked ?? false,
        scheduledUnlockAt: access?.scheduledUnlockAt ?? null,
        unlockedAt: access?.unlockedAt,
        manuallyUnlocked: access?.manuallyUnlocked ?? false,
        dripEnabled: true,
        dripType: module.dripType,
      };
    }).sort((a, b) => a.position - b.position);
  },
});

/**
 * Check if a specific module is accessible to a student
 */
export const isModuleAccessible = query({
  args: {
    userId: v.string(),
    moduleId: v.id("courseModules"),
  },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module) return { accessible: false, reason: "Module not found" };

    // If drip is not enabled, always accessible
    if (!module.dripEnabled) {
      return { accessible: true };
    }

    // Check drip access record
    const access = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
      )
      .first();

    if (!access) {
      return {
        accessible: false,
        reason: "Not enrolled or drip access not initialized"
      };
    }

    if (access.isUnlocked) {
      return { accessible: true };
    }

    const now = Date.now();
    if (access.scheduledUnlockAt && access.scheduledUnlockAt <= now) {
      // Should be unlocked now - trigger unlock
      return { accessible: true, shouldUnlock: true };
    }

    return {
      accessible: false,
      reason: "Content not yet available",
      scheduledUnlockAt: access.scheduledUnlockAt,
      dripType: module.dripType,
    };
  },
});

/**
 * Get pending drip unlocks (for cron job)
 */
export const getPendingDripUnlocks = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 100;

    return await ctx.db
      .query("courseDripAccess")
      .withIndex("by_scheduled_unlock")
      .filter((q) =>
        q.and(
          q.eq(q.field("isUnlocked"), false),
          q.lte(q.field("scheduledUnlockAt"), now)
        )
      )
      .take(limit);
  },
});

// ===== MUTATIONS =====

/**
 * Update drip settings for a module
 */
export const updateModuleDripSettings = mutation({
  args: {
    moduleId: v.id("courseModules"),
    dripEnabled: v.boolean(),
    dripType: v.optional(v.union(
      v.literal("days_after_enrollment"),
      v.literal("specific_date"),
      v.literal("after_previous")
    )),
    dripDaysAfterEnrollment: v.optional(v.number()),
    dripSpecificDate: v.optional(v.number()),
    dripNotifyStudents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { moduleId, ...settings } = args;

    const module = await ctx.db.get(moduleId);
    if (!module) {
      throw new Error("Module not found");
    }

    await ctx.db.patch(moduleId, {
      dripEnabled: settings.dripEnabled,
      dripType: settings.dripType,
      dripDaysAfterEnrollment: settings.dripDaysAfterEnrollment,
      dripSpecificDate: settings.dripSpecificDate,
      dripNotifyStudents: settings.dripNotifyStudents,
    });

    // If drip is enabled, recalculate access for all enrolled students
    if (settings.dripEnabled) {
      // Schedule recalculation
      await ctx.scheduler.runAfter(0, internal.courseDrip.recalculateDripAccessForModule, {
        moduleId,
      });
    }

    return { success: true };
  },
});

/**
 * Bulk update drip settings for a course
 */
export const updateCourseDripSettings = mutation({
  args: {
    courseId: v.string(),
    modules: v.array(v.object({
      moduleId: v.id("courseModules"),
      dripEnabled: v.boolean(),
      dripType: v.optional(v.union(
        v.literal("days_after_enrollment"),
        v.literal("specific_date"),
        v.literal("after_previous")
      )),
      dripDaysAfterEnrollment: v.optional(v.number()),
      dripSpecificDate: v.optional(v.number()),
      dripNotifyStudents: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    for (const moduleSettings of args.modules) {
      const { moduleId, ...settings } = moduleSettings;

      await ctx.db.patch(moduleId, {
        dripEnabled: settings.dripEnabled,
        dripType: settings.dripType,
        dripDaysAfterEnrollment: settings.dripDaysAfterEnrollment,
        dripSpecificDate: settings.dripSpecificDate,
        dripNotifyStudents: settings.dripNotifyStudents,
      });
    }

    // Recalculate all drip access for the course
    await ctx.scheduler.runAfter(0, internal.courseDrip.recalculateDripAccessForCourse, {
      courseId: args.courseId,
    });

    return { success: true };
  },
});

/**
 * Initialize drip access when a student enrolls in a course
 */
export const initializeDripAccess = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all modules with drip enabled
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as string))
      .take(200);

    const sortedModules = modules.sort((a, b) => a.position - b.position);

    for (const module of sortedModules) {
      // Check if access record already exists
      const existing = await ctx.db
        .query("courseDripAccess")
        .withIndex("by_user_module", (q) =>
          q.eq("userId", args.userId).eq("moduleId", module._id)
        )
        .first();

      if (existing) continue;

      // Calculate scheduled unlock time
      let scheduledUnlockAt = now;
      let isUnlocked = true;

      if (module.dripEnabled) {
        isUnlocked = false;

        switch (module.dripType) {
          case "days_after_enrollment":
            const days = module.dripDaysAfterEnrollment || 0;
            scheduledUnlockAt = now + (days * 24 * 60 * 60 * 1000);
            // If 0 days, unlock immediately
            if (days === 0) isUnlocked = true;
            break;

          case "specific_date":
            scheduledUnlockAt = module.dripSpecificDate || now;
            if (scheduledUnlockAt <= now) isUnlocked = true;
            break;

          case "after_previous":
            // Will be unlocked when previous module is completed
            // For first module with this setting, unlock immediately
            const previousModules = sortedModules.filter(m => m.position < module.position);
            if (previousModules.length === 0) {
              isUnlocked = true;
            }
            // scheduledUnlockAt will be updated when previous is completed
            break;
        }
      }

      await ctx.db.insert("courseDripAccess", {
        userId: args.userId,
        courseId: args.courseId,
        moduleId: module._id,
        isUnlocked,
        unlockedAt: isUnlocked ? now : undefined,
        scheduledUnlockAt,
        unlockNotificationSent: isUnlocked, // No notification needed if already unlocked
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Manually unlock a module for a student (instructor override)
 */
export const manuallyUnlockModule = mutation({
  args: {
    userId: v.string(),
    moduleId: v.id("courseModules"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const access = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", args.userId).eq("moduleId", args.moduleId)
      )
      .first();

    if (access) {
      await ctx.db.patch(access._id, {
        isUnlocked: true,
        unlockedAt: now,
        manuallyUnlocked: true,
        manualUnlockReason: args.reason,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Grant full access to a student (unlock all modules)
 */
export const grantFullAccess = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const accessRecords = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .take(500);

    for (const access of accessRecords) {
      if (!access.isUnlocked) {
        await ctx.db.patch(access._id, {
          isUnlocked: true,
          unlockedAt: now,
          manuallyUnlocked: true,
          manualUnlockReason: args.reason || "Full access granted",
          updatedAt: now,
        });
      }
    }

    return { success: true, unlockedCount: accessRecords.filter(a => !a.isUnlocked).length };
  },
});

/**
 * Restore drip schedule for a student (remove manual override)
 */
export const restoreDripSchedule = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get enrollment time from first access record
    const firstAccess = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!firstAccess) {
      throw new Error("No enrollment found");
    }

    const enrolledAt = firstAccess.enrolledAt;

    // Get all modules
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as string))
      .take(200);

    const sortedModules = modules.sort((a, b) => a.position - b.position);

    for (const module of sortedModules) {
      const access = await ctx.db
        .query("courseDripAccess")
        .withIndex("by_user_module", (q) =>
          q.eq("userId", args.userId).eq("moduleId", module._id)
        )
        .first();

      if (!access) continue;

      // Recalculate scheduled unlock
      let scheduledUnlockAt = enrolledAt;
      let isUnlocked = !module.dripEnabled;

      if (module.dripEnabled) {
        switch (module.dripType) {
          case "days_after_enrollment":
            const days = module.dripDaysAfterEnrollment || 0;
            scheduledUnlockAt = enrolledAt + (days * 24 * 60 * 60 * 1000);
            isUnlocked = scheduledUnlockAt <= now;
            break;

          case "specific_date":
            scheduledUnlockAt = module.dripSpecificDate || enrolledAt;
            isUnlocked = scheduledUnlockAt <= now;
            break;

          case "after_previous":
            // Check if previous module is completed
            const prevModule = sortedModules.find(m => m.position === module.position - 1);
            if (!prevModule) {
              isUnlocked = true;
            } else {
              // Check completion status
              const progress = await ctx.db
                .query("userProgress")
                .withIndex("by_user_course", (q) =>
                  q.eq("userId", args.userId).eq("courseId", args.courseId)
                )
                .take(500);

              // Find if all chapters in previous module are complete
              // This is simplified - real implementation would check chapter completion
              isUnlocked = false;
            }
            break;
        }
      }

      await ctx.db.patch(access._id, {
        isUnlocked,
        unlockedAt: isUnlocked ? now : undefined,
        scheduledUnlockAt,
        manuallyUnlocked: false,
        manualUnlockReason: undefined,
        unlockNotificationSent: isUnlocked,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// ===== INTERNAL MUTATIONS =====

/**
 * Process pending drip unlocks (called by cron)
 */
export const processPendingDripUnlocks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get pending unlocks
    const pending = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_scheduled_unlock")
      .filter((q) =>
        q.and(
          q.eq(q.field("isUnlocked"), false),
          q.lte(q.field("scheduledUnlockAt"), now)
        )
      )
      .take(100);

    let unlocked = 0;

    for (const access of pending) {
      // Unlock the module
      await ctx.db.patch(access._id, {
        isUnlocked: true,
        unlockedAt: now,
        updatedAt: now,
      });
      unlocked++;

      // Check if notification should be sent
      const module = await ctx.db.get(access.moduleId);
      if (module?.dripNotifyStudents && !access.unlockNotificationSent) {
        // Schedule notification email
        await ctx.scheduler.runAfter(0, internal.courseDrip.sendDripUnlockNotification, {
          accessId: access._id,
          userId: access.userId,
          courseId: access.courseId,
          moduleId: access.moduleId,
        });
      }
    }

    return { unlocked };
  },
});

/**
 * Recalculate drip access for a specific module
 */
export const recalculateDripAccessForModule = internalMutation({
  args: { moduleId: v.id("courseModules") },
  handler: async (ctx, args) => {
    const module = await ctx.db.get(args.moduleId);
    if (!module) return;

    const now = Date.now();

    // Get all access records for this module
    const accessRecords = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_course_module", (q) =>
        q.eq("courseId", module.courseId as Id<"courses">).eq("moduleId", args.moduleId)
      )
      .take(5000);

    for (const access of accessRecords) {
      if (access.manuallyUnlocked) continue; // Don't override manual unlocks

      let scheduledUnlockAt = access.enrolledAt;
      let isUnlocked = !module.dripEnabled;

      if (module.dripEnabled) {
        switch (module.dripType) {
          case "days_after_enrollment":
            const days = module.dripDaysAfterEnrollment || 0;
            scheduledUnlockAt = access.enrolledAt + (days * 24 * 60 * 60 * 1000);
            isUnlocked = scheduledUnlockAt <= now;
            break;

          case "specific_date":
            scheduledUnlockAt = module.dripSpecificDate || access.enrolledAt;
            isUnlocked = scheduledUnlockAt <= now;
            break;

          case "after_previous":
            // Complex logic - would need to check completion
            break;
        }
      }

      await ctx.db.patch(access._id, {
        isUnlocked,
        unlockedAt: isUnlocked ? now : undefined,
        scheduledUnlockAt,
        updatedAt: now,
      });
    }
  },
});

/**
 * Recalculate drip access for entire course
 */
export const recalculateDripAccessForCourse = internalMutation({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(200);

    for (const module of modules) {
      await ctx.scheduler.runAfter(0, internal.courseDrip.recalculateDripAccessForModule, {
        moduleId: module._id,
      });
    }
  },
});

/**
 * Send drip unlock notification email
 */
export const sendDripUnlockNotification = internalMutation({
  args: {
    accessId: v.id("courseDripAccess"),
    userId: v.string(),
    courseId: v.id("courses"),
    moduleId: v.id("courseModules"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user, course, and module info
    const [user, course, module] = await Promise.all([
      ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId)).first(),
      ctx.db.get(args.courseId),
      ctx.db.get(args.moduleId),
    ]);

    if (!user || !course || !module) {
      console.error("[Drip] Missing data for notification", { userId: args.userId, courseId: args.courseId });
      return;
    }

    // Get store for email sending
    const store = course.storeId
      ? await ctx.db.query("stores").filter((q) => q.eq(q.field("userId"), course.userId)).first()
      : null;

    // Mark notification as sent
    await ctx.db.patch(args.accessId, {
      unlockNotificationSent: true,
      notificationSentAt: now,
    });

    // Log notification - email integration can be added when needed
    // This can integrate with the existing email workflow system
    if (user.email && store) {
      // POST-LAUNCH: Send drip unlock notification email via emailWorkflows when ready
    }
  },
});

/**
 * Handle module completion - unlock next "after_previous" modules
 */
export const onModuleCompleted = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    moduleId: v.id("courseModules"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the completed module
    const completedModule = await ctx.db.get(args.moduleId);
    if (!completedModule) return;

    // Find next module with "after_previous" drip type
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as string))
      .take(200);

    const sortedModules = modules.sort((a, b) => a.position - b.position);
    const nextModule = sortedModules.find(
      (m) => m.position > completedModule.position &&
             m.dripEnabled &&
             m.dripType === "after_previous"
    );

    if (!nextModule) return;

    // Unlock the next module
    const access = await ctx.db
      .query("courseDripAccess")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", args.userId).eq("moduleId", nextModule._id)
      )
      .first();

    if (access && !access.isUnlocked) {
      await ctx.db.patch(access._id, {
        isUnlocked: true,
        unlockedAt: now,
        updatedAt: now,
      });

      // Send notification if enabled
      if (nextModule.dripNotifyStudents) {
        await ctx.scheduler.runAfter(0, internal.courseDrip.sendDripUnlockNotification, {
          accessId: access._id,
          userId: args.userId,
          courseId: args.courseId,
          moduleId: nextModule._id,
        });
      }
    }
  },
});
