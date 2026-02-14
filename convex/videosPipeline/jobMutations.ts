import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Internal mutations for updating video job state during pipeline execution.
 * These are called from internalActions (Node.js runtime) via ctx.runMutation().
 */

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    status: v.union(
      v.literal("queued"),
      v.literal("gathering_context"),
      v.literal("generating_script"),
      v.literal("generating_assets"),
      v.literal("generating_voice"),
      v.literal("generating_code"),
      v.literal("rendering"),
      v.literal("post_processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      progress: args.progress,
    });
  },
});

export const updateJobImages = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    imageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      imageIds: args.imageIds,
    });
  },
});

export const updateJobAudio = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    audioId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      audioId: args.audioId,
    });
  },
});

export const updateJobError = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    error: v.string(),
    retryCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed" as const,
      error: args.error,
      retryCount: args.retryCount,
    });
  },
});

export const updateJobCompleted = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed" as const,
      progress: 100,
    });
  },
});

export const updateJobCode = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    generatedCode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      generatedCode: args.generatedCode,
    });
  },
});

export const updateJobVideo = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    videoId: v.id("_storage"),
    videoDuration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    renderDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      videoId: args.videoId,
      videoDuration: args.videoDuration,
      fileSize: args.fileSize,
      renderDuration: args.renderDuration,
    });
  },
});

export const updateJobPostProcess = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    thumbnailId: v.optional(v.id("_storage")),
    srtContent: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.thumbnailId) patch.thumbnailId = args.thumbnailId;
    if (args.srtContent) patch.srtContent = args.srtContent;
    if (args.caption) patch.caption = args.caption;
    await ctx.db.patch(args.jobId, patch);
  },
});

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
