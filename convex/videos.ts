import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ─── Public Mutations ───────────────────────────────────────────────────────

/**
 * Start a new video generation job.
 * Creates a job record and kicks off the pipeline.
 */
export const generate = mutation({
  args: {
    prompt: v.string(),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    storeId: v.optional(v.id("stores")),
    style: v.optional(v.string()),
    targetDuration: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
    voiceId: v.optional(v.string()),
  },
  returns: v.id("videoJobs"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Look up the user by their Clerk subject
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // If no storeId provided, try to find the user's store
    let storeId = args.storeId;
    if (!storeId) {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_userId", (q) => q.eq("userId", user.clerkId ?? ""))
        .first();
      storeId = store?._id;
    }

    const jobId = await ctx.db.insert("videoJobs", {
      creatorId: user._id,
      prompt: args.prompt,
      courseId: args.courseId,
      productId: args.productId,
      storeId: storeId,
      style: args.style || "modern",
      targetDuration: args.targetDuration || 60,
      aspectRatio: args.aspectRatio || "9:16",
      voiceId: args.voiceId,
      status: "queued",
      progress: 0,
      version: 1,
      retryCount: 0,
    });

    // Kick off the pipeline
    await ctx.scheduler.runAfter(0, internal.videosNode.runPipeline, { jobId });

    return jobId;
  },
});

/**
 * Iterate on an existing video with feedback.
 * Creates a new job linked to the parent for context.
 */
export const iterate = mutation({
  args: {
    jobId: v.id("videoJobs"),
    feedback: v.string(),
  },
  returns: v.id("videoJobs"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const original = await ctx.db.get(args.jobId);
    if (!original) throw new Error("Original job not found");

    const newJobId = await ctx.db.insert("videoJobs", {
      creatorId: original.creatorId,
      storeId: original.storeId,
      courseId: original.courseId,
      productId: original.productId,
      prompt: `${original.prompt}\n\nIteration feedback: ${args.feedback}`,
      style: original.style,
      targetDuration: original.targetDuration,
      aspectRatio: original.aspectRatio,
      voiceId: original.voiceId,
      status: "queued",
      progress: 0,
      parentJobId: args.jobId,
      iterationPrompt: args.feedback,
      version: original.version + 1,
      retryCount: 0,
    });

    await ctx.scheduler.runAfter(0, internal.videosNode.runPipeline, { jobId: newJobId });

    return newJobId;
  },
});

// ─── Public Queries ─────────────────────────────────────────────────────────

/**
 * Get real-time generation progress for a job.
 */
export const getProgress = query({
  args: { jobId: v.id("videoJobs") },
  returns: v.object({
    status: v.string(),
    progress: v.number(),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    scriptId: v.optional(v.id("videoScripts")),
  }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    return {
      status: job.status,
      progress: job.progress,
      videoUrl: job.videoId ? (await ctx.storage.getUrl(job.videoId)) ?? undefined : undefined,
      thumbnailUrl: job.thumbnailId
        ? (await ctx.storage.getUrl(job.thumbnailId)) ?? undefined
        : undefined,
      error: job.error,
      scriptId: job.scriptId,
    };
  },
});

/**
 * List video jobs for the current user.
 */
export const listJobs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("videoJobs")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .order("desc")
      .take(20);
  },
});

/**
 * Get the script for a video job.
 */
export const getScript = query({
  args: { scriptId: v.id("videoScripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scriptId);
  },
});

/**
 * Get full job detail (for the progress/detail page).
 */
export const getJob = query({
  args: { jobId: v.id("videoJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    const videoUrl = job.videoId
      ? (await ctx.storage.getUrl(job.videoId)) ?? undefined
      : undefined;
    const thumbnailUrl = job.thumbnailId
      ? (await ctx.storage.getUrl(job.thumbnailId)) ?? undefined
      : undefined;

    // Resolve image URLs
    const imageUrls: string[] = [];
    if (job.imageIds) {
      for (const id of job.imageIds) {
        const url = await ctx.storage.getUrl(id);
        if (url) imageUrls.push(url);
      }
    }

    let audioUrl: string | undefined;
    if (job.audioId) {
      audioUrl = (await ctx.storage.getUrl(job.audioId)) ?? undefined;
    }

    return {
      ...job,
      videoUrl,
      thumbnailUrl,
      imageUrls,
      audioUrl,
    };
  },
});

/**
 * List video jobs for a specific store (for Video Studio grid).
 */
export const getJobsByStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const jobs = await ctx.db
      .query("videoJobs")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(50);

    // Resolve thumbnail URLs
    const withUrls = await Promise.all(
      jobs.map(async (job) => {
        const thumbnailUrl = job.thumbnailId
          ? (await ctx.storage.getUrl(job.thumbnailId)) ?? undefined
          : undefined;
        const videoUrl = job.videoId
          ? (await ctx.storage.getUrl(job.videoId)) ?? undefined
          : undefined;
        return { ...job, thumbnailUrl, videoUrl };
      })
    );

    return withUrls;
  },
});

/**
 * Get version history for a video (parent chain).
 */
export const getVersionHistory = query({
  args: { jobId: v.id("videoJobs") },
  handler: async (ctx, args) => {
    // Walk up the parent chain to find the root
    let rootId = args.jobId;
    let current = await ctx.db.get(args.jobId);
    while (current?.parentJobId) {
      rootId = current.parentJobId;
      current = await ctx.db.get(current.parentJobId);
    }

    // Now collect all versions from the root downward
    const versions: Array<{
      _id: any;
      version: number;
      iterationPrompt?: string;
      status: string;
      _creationTime: number;
    }> = [];

    // Start from root
    const root = await ctx.db.get(rootId);
    if (root) {
      versions.push({
        _id: root._id,
        version: root.version,
        iterationPrompt: root.iterationPrompt,
        status: root.status,
        _creationTime: root._creationTime,
      });
    }

    // Find all children by walking forward
    let parentId = rootId;
    while (true) {
      const children = await ctx.db
        .query("videoJobs")
        .filter((q) => q.eq(q.field("parentJobId"), parentId))
        .collect();
      if (children.length === 0) break;
      // Take the most recent child (in case of multiple retries)
      const child = children.sort(
        (a, b) => b._creationTime - a._creationTime
      )[0];
      versions.push({
        _id: child._id,
        version: child.version,
        iterationPrompt: child.iterationPrompt,
        status: child.status,
        _creationTime: child._creationTime,
      });
      parentId = child._id;
    }

    return versions;
  },
});

/**
 * Get user's courses for the video studio dropdown.
 */
export const getCreatorCourses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_instructorId", (q) =>
        q.eq("instructorId", user.clerkId ?? "")
      )
      .collect();

    return courses.map((c) => ({
      _id: c._id,
      title: c.title,
    }));
  },
});

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Internal query to read job state (used during error handling in runPipeline).
 */
export const getJobInternal = internalQuery({
  args: { jobId: v.id("videoJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

/**
 * Internal query to read script data (used by generateCode and postProcess).
 */
export const getScriptInternal = internalQuery({
  args: { scriptId: v.id("videoScripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scriptId);
  },
});
