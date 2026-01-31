import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * COURSE PROGRESS TRACKING
 * Centralized mutations for tracking course progress with automatic certificate issuance
 */

// ===== QUERIES =====

/**
 * Get overall course progress for a user
 * Returns completion percentage, completed chapters count, and total chapters
 */
export const getCourseProgress = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.object({
    totalChapters: v.number(),
    completedChapters: v.number(),
    completionPercentage: v.number(),
    isComplete: v.boolean(),
    hasCertificate: v.boolean(),
    totalTimeSpent: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all published chapters for this course
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    const totalChapters = chapters.length;

    if (totalChapters === 0) {
      return {
        totalChapters: 0,
        completedChapters: 0,
        completionPercentage: 0,
        isComplete: false,
        hasCertificate: false,
        totalTimeSpent: 0,
      };
    }

    // Get completed progress records for this user and course
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course_completed", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId).eq("isCompleted", true)
      )
      .collect();

    // Create a set of completed chapter IDs for efficient lookup
    const completedChapterIds = new Set(progressRecords.map((p) => p.chapterId));

    // Count how many of the published chapters are completed
    const completedChapters = chapters.filter((ch) =>
      completedChapterIds.has(ch._id)
    ).length;

    const completionPercentage = Math.round((completedChapters / totalChapters) * 100);
    const isComplete = completionPercentage === 100;

    // Calculate total time spent
    const totalTimeSpent = progressRecords.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );

    // Check if user already has a certificate
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_user_and_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    return {
      totalChapters,
      completedChapters,
      completionPercentage,
      isComplete,
      hasCertificate: !!certificate,
      totalTimeSpent,
    };
  },
});

/**
 * Get progress for all courses a user has started
 */
export const getUserCourseProgressList = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all progress records for user
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Group by courseId
    const courseIds = [...new Set(progressRecords.map((p) => p.courseId).filter(Boolean))] as Id<"courses">[];

    const courseProgressList = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await ctx.db.get(courseId);
        if (!course || course.deletedAt) return null;

        // Get published chapters
        const chapters = await ctx.db
          .query("courseChapters")
          .filter((q) =>
            q.and(
              q.eq(q.field("courseId"), courseId),
              q.eq(q.field("isPublished"), true)
            )
          )
          .collect();

        const totalChapters = chapters.length;
        if (totalChapters === 0) return null;

        // Get completed records for this course
        const completedRecords = progressRecords.filter(
          (p) => p.courseId === courseId && p.isCompleted
        );
        const completedChapterIds = new Set(completedRecords.map((p) => p.chapterId));
        const completedChapters = chapters.filter((ch) =>
          completedChapterIds.has(ch._id)
        ).length;

        const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

        // Get last accessed
        const lastAccessedRecord = progressRecords
          .filter((p) => p.courseId === courseId && p.lastAccessedAt)
          .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))[0];

        return {
          courseId,
          courseTitle: course.title,
          courseImage: course.imageUrl,
          slug: course.slug,
          totalChapters,
          completedChapters,
          completionPercentage,
          isComplete: completionPercentage === 100,
          lastAccessedAt: lastAccessedRecord?.lastAccessedAt,
        };
      })
    );

    return courseProgressList.filter(Boolean);
  },
});

// ===== INTERNAL QUERIES =====

/**
 * Internal query to calculate course progress
 * Used by mutations to check completion status
 */
export const calculateCourseProgressInternal = internalQuery({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Get all published chapters
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) =>
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    const totalChapters = chapters.length;
    if (totalChapters === 0) {
      return { totalChapters: 0, completedChapters: 0, completionPercentage: 0 };
    }

    // Get completed progress
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course_completed", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId).eq("isCompleted", true)
      )
      .collect();

    const completedChapterIds = new Set(progressRecords.map((p) => p.chapterId));
    const completedChapters = chapters.filter((ch) =>
      completedChapterIds.has(ch._id)
    ).length;

    const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

    // Calculate total time spent
    const totalTimeSpent = progressRecords.reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );

    return { totalChapters, completedChapters, completionPercentage, totalTimeSpent };
  },
});

// ===== MUTATIONS =====

/**
 * Mark a chapter as complete and check for course completion
 * This is the main entry point for progress tracking
 * Automatically triggers certificate generation when course is 100% complete
 */
export const markChapterComplete = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    chapterId: v.string(),
    moduleId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    timeSpent: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    progressId: Id<"userProgress">;
    courseComplete: boolean;
    completionPercentage: number;
    certificateIssued: boolean;
  }> => {
    // Check if progress record exists
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_chapter", (q) =>
        q.eq("userId", args.userId).eq("chapterId", args.chapterId)
      )
      .unique();

    const wasAlreadyComplete = existingProgress?.isCompleted === true;
    const now = Date.now();

    let progressId: Id<"userProgress">;

    if (existingProgress) {
      // Update existing record
      await ctx.db.patch(existingProgress._id, {
        isCompleted: true,
        completedAt: existingProgress.completedAt || now,
        timeSpent: (existingProgress.timeSpent || 0) + (args.timeSpent || 0),
        lastAccessedAt: now,
      });
      progressId = existingProgress._id;
    } else {
      // Create new progress record
      progressId = await ctx.db.insert("userProgress", {
        userId: args.userId,
        courseId: args.courseId,
        moduleId: args.moduleId,
        lessonId: args.lessonId,
        chapterId: args.chapterId,
        isCompleted: true,
        completedAt: now,
        timeSpent: args.timeSpent,
        lastAccessedAt: now,
      });
    }

    // Calculate current progress
    const progress = await ctx.runQuery(internal.courseProgress.calculateCourseProgressInternal, {
      userId: args.userId,
      courseId: args.courseId,
    });

    let certificateIssued = false;

    // If just completed the course (not already complete before), trigger certificate
    if (progress.completionPercentage === 100 && !wasAlreadyComplete) {
      // Schedule certificate issuance
      await ctx.scheduler.runAfter(0, internal.courseProgress.checkAndIssueCertificate, {
        userId: args.userId,
        courseId: args.courseId,
        totalChapters: progress.totalChapters,
        completedChapters: progress.completedChapters,
        totalTimeSpent: progress.totalTimeSpent || 0,
      });
      certificateIssued = true;
    }

    return {
      progressId,
      courseComplete: progress.completionPercentage === 100,
      completionPercentage: progress.completionPercentage,
      certificateIssued,
    };
  },
});

/**
 * Update time spent on a chapter without marking complete
 */
export const updateChapterTimeSpent = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    chapterId: v.string(),
    timeSpent: v.number(),
  },
  handler: async (ctx, args) => {
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_chapter", (q) =>
        q.eq("userId", args.userId).eq("chapterId", args.chapterId)
      )
      .unique();

    const now = Date.now();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        timeSpent: (existingProgress.timeSpent || 0) + args.timeSpent,
        lastAccessedAt: now,
      });
    } else {
      await ctx.db.insert("userProgress", {
        userId: args.userId,
        courseId: args.courseId,
        chapterId: args.chapterId,
        timeSpent: args.timeSpent,
        lastAccessedAt: now,
        isCompleted: false,
      });
    }
  },
});

// ===== INTERNAL MUTATIONS =====

/**
 * Check course completion and issue certificate if eligible
 * Called automatically when a course reaches 100% completion
 */
export const checkAndIssueCertificate = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    totalChapters: v.number(),
    completedChapters: v.number(),
    totalTimeSpent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify 100% completion
    if (args.completedChapters < args.totalChapters) {
      console.log("Course not yet complete, skipping certificate");
      return { success: false, reason: "course_not_complete" };
    }

    // Check if certificate already exists
    const existingCertificate = await ctx.db
      .query("certificates")
      .withIndex("by_user_and_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (existingCertificate) {
      console.log("Certificate already exists for this user and course");
      return {
        success: true,
        alreadyExists: true,
        certificateId: existingCertificate.certificateId
      };
    }

    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      console.error("User not found for certificate generation");
      return { success: false, reason: "user_not_found" };
    }

    // Get course details
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      console.error("Course not found for certificate generation");
      return { success: false, reason: "course_not_found" };
    }

    // Get instructor details
    let instructorName = "PPR Academy";
    let instructorId = course.userId;

    if (course.instructorId) {
      const instructor = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", course.instructorId!))
        .first();
      if (instructor) {
        instructorName = instructor.name || instructorName;
        instructorId = instructor.clerkId || course.userId;
      }
    }

    // Generate certificate
    const certificateId = generateCertificateId();
    const verificationCode = generateVerificationCode();
    const now = Date.now();

    await ctx.db.insert("certificates", {
      userId: args.userId,
      userName: user.name || "Student",
      userEmail: user.email || "",
      courseId: args.courseId,
      courseTitle: course.title,
      instructorName,
      instructorId,
      certificateId,
      completionDate: now,
      issueDate: now,
      totalChapters: args.totalChapters,
      completedChapters: args.completedChapters,
      completionPercentage: 100,
      timeSpent: args.totalTimeSpent,
      verificationCode,
      isValid: true,
      createdAt: now,
      verificationCount: 0,
    });

    console.log(`Certificate issued: ${certificateId} for user ${args.userId} course ${args.courseId}`);

    // Schedule completion notification email
    await ctx.scheduler.runAfter(0, internal.courseProgress.sendCompletionNotification, {
      userId: args.userId,
      courseId: args.courseId,
      certificateId,
      verificationCode,
    });

    // Track creator nudge opportunity (for users who aren't creators yet)
    if (!user.isCreator) {
      await ctx.db.insert("analyticsEvents", {
        userId: args.userId,
        eventType: "creator_nudge_triggered",
        timestamp: now,
        metadata: {
          nudgeContext: "course_completed",
          courseName: course.title,
          courseId: args.courseId,
        },
      });

      // Store the nudge for the user to see on their dashboard
      const existingNudge = await ctx.db
        .query("userNudges" as any)
        .withIndex("by_userId" as any, (q: any) => q.eq("userId", args.userId))
        .first();

      if (!existingNudge) {
        await ctx.db.insert("userNudges" as any, {
          userId: args.userId,
          nudgeType: "become_creator",
          nudgeContext: "course_completed",
          contextData: {
            courseName: course.title,
            courseId: args.courseId,
          },
          dismissed: false,
          createdAt: now,
        });
      }
    }

    return {
      success: true,
      certificateId,
      verificationCode
    };
  },
});

/**
 * Send course completion notification email
 */
export const sendCompletionNotification = internalMutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    certificateId: v.string(),
    verificationCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user?.email) {
      console.log("No email found for completion notification");
      return;
    }

    // Get course details
    const course = await ctx.db.get(args.courseId);
    if (!course) return;

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "success",
      title: "Course Completed!",
      message: `Congratulations! You've completed "${course.title}" and earned a certificate. Your certificate ID is ${args.certificateId}.`,
      read: false,
      createdAt: Date.now(),
      link: `/certificates/${args.certificateId}`,
      actionLabel: "View Certificate",
      senderType: "platform",
      senderName: "PPR Academy",
    });

    // TODO: Integrate with email service (Resend/SendGrid)
    // For now, just log the notification
    console.log(`Completion notification sent to ${user.email} for course ${course.title}`);
  },
});

// ===== HELPER FUNCTIONS =====

function generateCertificateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
