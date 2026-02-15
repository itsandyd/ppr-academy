import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Detect what's changed in a course since last notification
export const detectCourseChanges = query({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    hasChanges: v.boolean(),
    enrolledStudentCount: v.number(), // How many will receive notification
    currentState: v.object({
      totalModules: v.number(),
      totalLessons: v.number(),
      totalChapters: v.number(),
      modulesList: v.array(v.string()),
    }),
    lastNotification: v.optional(v.object({
      sentAt: v.number(),
      title: v.string(),
      message: v.string(),
      snapshot: v.object({
        totalModules: v.number(),
        totalLessons: v.number(),
        totalChapters: v.number(),
      }),
    })),
    changes: v.optional(v.object({
      newModules: v.number(),
      newLessons: v.number(),
      newChapters: v.number(),
      newModulesList: v.array(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    // Get course
    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== args.userId) {
      throw new Error("Course not found or unauthorized");
    }

    // Get current course state
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(200);

    let totalLessons = 0;
    let totalChapters = 0;
    const modulesList: string[] = [];

    for (const module of modules) {
      modulesList.push(module.title);

      const lessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
        .take(200);

      totalLessons += lessons.length;

      for (const lesson of lessons) {
        const chapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .take(200);

        totalChapters += chapters.length;
      }
    }

    const currentState = {
      totalModules: modules.length,
      totalLessons,
      totalChapters,
      modulesList,
    };

    // Get enrolled students (who will receive the notification)
    const enrollments = await ctx.db
      .query("purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("status"), "completed")
        )
      )
      .take(5000);

    const uniqueStudentIds = Array.from(new Set(enrollments.map(e => e.userId)));
    const enrolledStudentCount = uniqueStudentIds.length;

    // Get last notification sent for this course
    const lastNotification = await ctx.db
      .query("courseNotifications")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();

    if (!lastNotification) {
      // No previous notifications - everything is "new"
      return {
        hasChanges: true,
        enrolledStudentCount,
        currentState,
        lastNotification: undefined,
        changes: {
          newModules: currentState.totalModules,
          newLessons: currentState.totalLessons,
          newChapters: currentState.totalChapters,
          newModulesList: modulesList,
        },
      };
    }

    // Calculate changes since last notification
    const changes = {
      newModules: currentState.totalModules - lastNotification.courseSnapshot.totalModules,
      newLessons: currentState.totalLessons - lastNotification.courseSnapshot.totalLessons,
      newChapters: currentState.totalChapters - lastNotification.courseSnapshot.totalChapters,
      newModulesList: modulesList.filter(
        (m) => !lastNotification.changes.modulesList?.includes(m)
      ),
    };

    const hasChanges = changes.newModules > 0 || changes.newLessons > 0 || changes.newChapters > 0;

    return {
      hasChanges,
      enrolledStudentCount,
      currentState,
      lastNotification: {
        sentAt: lastNotification.sentAt,
        title: lastNotification.title,
        message: lastNotification.message,
        snapshot: lastNotification.courseSnapshot,
      },
      changes: hasChanges ? changes : undefined,
    };
  },
});

// Send course update notification to all enrolled students
export const sendCourseUpdateNotification = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    emailSubject: v.optional(v.string()),
    emailPreview: v.optional(v.string()),
    sendEmail: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    notificationId: v.optional(v.id("courseNotifications")),
    recipientCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify ownership
    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== args.userId) {
      return {
        success: false,
        recipientCount: 0,
        error: "Course not found or unauthorized",
      };
    }

    // Get current course state for snapshot
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(200);

    let totalLessons = 0;
    let totalChapters = 0;
    const modulesList: string[] = [];

    for (const module of modules) {
      modulesList.push(module.title);

      const lessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
        .take(200);

      totalLessons += lessons.length;

      for (const lesson of lessons) {
        const chapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .take(200);

        totalChapters += chapters.length;
      }
    }

    // Get last notification to calculate changes
    const lastNotification = await ctx.db
      .query("courseNotifications")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();

    const changes = lastNotification ? {
      newModules: modules.length - lastNotification.courseSnapshot.totalModules,
      newLessons: totalLessons - lastNotification.courseSnapshot.totalLessons,
      newChapters: totalChapters - lastNotification.courseSnapshot.totalChapters,
      updatedContent: true,
      modulesList: modulesList.filter(
        (m) => !lastNotification.changes.modulesList?.includes(m)
      ),
    } : {
      newModules: modules.length,
      newLessons: totalLessons,
      newChapters: totalChapters,
      updatedContent: true,
      modulesList,
    };

    // Get all enrolled students (only students who have purchased this course)
    // This ensures notifications are only sent to paying students who have access
    const enrollments = await ctx.db
      .query("purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("status"), "completed")
        )
      )
      .take(5000);

    // Get unique student IDs (in case of duplicate purchases)
    const studentIds = Array.from(new Set(enrollments.map(e => e.userId)));

    // Create course notification record
    const notificationId = await ctx.db.insert("courseNotifications", {
      courseId: args.courseId,
      creatorId: args.userId,
      title: args.title,
      message: args.message,
      changes,
      courseSnapshot: {
        totalModules: modules.length,
        totalLessons,
        totalChapters,
      },
      sentAt: Date.now(),
      recipientCount: studentIds.length,
      emailSent: args.sendEmail,
    });

    // Get creator info for sender display
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    // Send individual notifications to each student
    for (const studentId of studentIds) {
      await ctx.db.insert("notifications", {
        userId: studentId,
        title: args.title,
        message: args.message,
        type: "info",
        read: false,
        createdAt: Date.now(),
        link: `/courses/${course.slug}`,
        actionLabel: "View Course",
        emailSent: args.sendEmail,
        // Sender information
        senderType: "creator",
        senderId: args.userId,
        senderName: creator?.name || creator?.firstName || "Course Creator",
        senderAvatar: creator?.imageUrl,
      });
    }

    // If email should be sent, schedule email action
    if (args.sendEmail && args.emailSubject && args.emailPreview) {
      await ctx.scheduler.runAfter(0, internal.courseNotifications.sendCourseUpdateEmails, {
        courseId: args.courseId,
        studentIds,
        emailSubject: args.emailSubject,
        emailPreview: args.emailPreview,
        emailBody: args.message,
        courseSlug: course.slug || "",
      });
    }

    return {
      success: true,
      notificationId,
      recipientCount: studentIds.length,
    };
  },
});

// Get notification history for a course
export const getCourseNotificationHistory = query({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("courseNotifications"),
    title: v.string(),
    message: v.string(),
    sentAt: v.number(),
    recipientCount: v.number(),
    changes: v.object({
      newModules: v.number(),
      newLessons: v.number(),
      newChapters: v.number(),
      updatedContent: v.boolean(),
      modulesList: v.optional(v.array(v.string())),
    }),
    emailSent: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    // Verify ownership
    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== args.userId) {
      return [];
    }

    const notifications = await ctx.db
      .query("courseNotifications")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .take(1000);

    return notifications.map(n => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      sentAt: n.sentAt,
      recipientCount: n.recipientCount,
      changes: n.changes,
      emailSent: n.emailSent,
    }));
  },
});

// Get notification stats for a course
export const getCourseNotificationStats = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    totalSent: v.number(),
    totalRecipients: v.number(),
    lastSentAt: v.optional(v.number()),
    averageRecipients: v.number(),
  }),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("courseNotifications")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(1000);

    const totalSent = notifications.length;
    const totalRecipients = notifications.reduce((sum, n) => sum + n.recipientCount, 0);
    const lastSentAt = notifications.length > 0 
      ? Math.max(...notifications.map(n => n.sentAt))
      : undefined;
    const averageRecipients = totalSent > 0 ? Math.round(totalRecipients / totalSent) : 0;

    return {
      totalSent,
      totalRecipients,
      lastSentAt,
      averageRecipients,
    };
  },
});

