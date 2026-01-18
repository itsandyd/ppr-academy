import { internalMutation, internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ============================================================================
// INTERNAL MUTATIONS FOR JOB MANAGEMENT
// ============================================================================

export const createJob = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    jobType: v.union(v.literal("full_scan"), v.literal("course_scan"), v.literal("incremental")),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("scriptGenerationJobs", {
      storeId: args.storeId,
      userId: args.userId,
      jobType: args.jobType,
      courseId: args.courseId,
      status: "queued",
      totalChapters: 0,
      processedChapters: 0,
      failedChapters: 0,
      scriptsGenerated: 0,
      errorCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateJobProgress = internalMutation({
  args: {
    jobId: v.id("scriptGenerationJobs"),
    totalChapters: v.optional(v.number()),
    processedChapters: v.optional(v.number()),
    failedChapters: v.optional(v.number()),
    scriptsGenerated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    await ctx.db.patch(jobId, filteredUpdates);
  },
});

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("scriptGenerationJobs"),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    currentBatchId: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.currentBatchId) updates.currentBatchId = args.currentBatchId;
    if (args.lastError) {
      updates.lastError = args.lastError;
      const job = await ctx.db.get(args.jobId);
      updates.errorCount = (job?.errorCount || 0) + 1;
    }
    if (args.status === "processing") {
      const job = await ctx.db.get(args.jobId);
      if (!job?.startedAt) updates.startedAt = Date.now();
    }
    await ctx.db.patch(args.jobId, updates);
  },
});

export const completeJob = internalMutation({
  args: {
    jobId: v.id("scriptGenerationJobs"),
    scriptsGenerated: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    // Calculate average virality score
    const scripts = await ctx.db
      .query("generatedScripts")
      .withIndex("by_storeId", (q) => q.eq("storeId", job.storeId))
      .collect();

    const recentScripts = scripts.filter((s) => s.generationBatchId?.startsWith("batch-"));

    const avgScore =
      recentScripts.length > 0
        ? recentScripts.reduce((sum, s) => sum + s.viralityScore, 0) / recentScripts.length
        : 0;

    await ctx.db.patch(args.jobId, {
      status: "completed",
      completedAt: Date.now(),
      scriptsGenerated: args.scriptsGenerated || job.scriptsGenerated,
      averageViralityScore: Math.round(avgScore * 10) / 10,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// QUERIES FOR JOB STATUS
// ============================================================================

export const getActiveJobs = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("scriptGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.or(q.eq(q.field("status"), "queued"), q.eq(q.field("status"), "processing")))
      .order("desc")
      .take(5);

    return jobs;
  },
});

export const getJobById = query({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getRecentJobs = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("scriptGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);

    return jobs;
  },
});

/**
 * Cancel a stuck or running job
 */
export const cancelJob = internalMutation({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    // Only allow cancelling queued or processing jobs
    if (job.status !== "queued" && job.status !== "processing") {
      return;
    }

    await ctx.db.patch(args.jobId, {
      status: "cancelled",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

export const getJobInternal = internalQuery({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getChaptersToProcess = internalQuery({
  args: {
    userId: v.string(),
    jobType: v.union(v.literal("full_scan"), v.literal("course_scan"), v.literal("incremental")),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    // Get user's courses
    let courses;
    if (args.jobType === "course_scan" && args.courseId) {
      const course = await ctx.db.get(args.courseId);
      courses = course ? [course] : [];
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
    }

    // Get all chapters from these courses
    const allChapters: {
      chapterId: Id<"courseChapters">;
      courseId: Id<"courses">;
    }[] = [];

    for (const course of courses) {
      const chapters = await ctx.db
        .query("courseChapters")
        .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
        .collect();

      for (const chapter of chapters) {
        // For incremental, check if we already have a script for this chapter
        if (args.jobType === "incremental") {
          const existingScript = await ctx.db
            .query("generatedScripts")
            .withIndex("by_chapterId", (q) => q.eq("chapterId", chapter._id))
            .first();

          if (existingScript) continue;
        }

        allChapters.push({
          chapterId: chapter._id,
          courseId: course._id,
        });
      }
    }

    return allChapters;
  },
});

export const getAccountProfiles = internalQuery({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccountProfiles")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

export const getChapterInfo = internalQuery({
  args: {
    chapterId: v.id("courseChapters"),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;

    const course = await ctx.db.get(chapter.courseId as Id<"courses">);
    if (!course) return null;

    // Get module/lesson position if available
    let modulePosition = 1;
    let moduleId: string | undefined;
    let lessonId: string | undefined;

    if (chapter.lessonId) {
      lessonId = chapter.lessonId as string;
    }

    return {
      chapter,
      course,
      modulePosition,
      moduleId,
      lessonId,
    };
  },
});
