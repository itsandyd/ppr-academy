import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// MUTATIONS & QUERIES (moved from scriptIllustrations.ts to allow Node.js)
// ============================================================================

export const createJob = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    scriptText: v.string(),
    scriptTitle: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    sourceId: v.optional(v.string()),
    totalSentences: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scriptIllustrationJobs", {
      userId: args.userId,
      storeId: args.storeId,
      scriptText: args.scriptText,
      scriptTitle: args.scriptTitle,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      status: "pending",
      totalSentences: args.totalSentences,
      processedSentences: 0,
      failedSentences: 0,
      illustrationIds: [],
      createdAt: Date.now(),
    });
  },
});

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      startedAt: args.status === "processing" ? Date.now() : undefined,
    });
  },
});

export const updateJobProgress = internalMutation({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
    processedSentences: v.number(),
    illustrationIds: v.array(v.id("scriptIllustrations")),
    errors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      processedSentences: args.processedSentences,
      illustrationIds: args.illustrationIds,
      failedSentences: args.errors.length,
      errors: args.errors,
    });
  },
});

export const completeJob = internalMutation({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
    illustrationIds: v.array(v.id("scriptIllustrations")),
    errors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      illustrationIds: args.illustrationIds,
      errors: args.errors,
      failedSentences: args.errors.length,
      completedAt: Date.now(),
    });
  },
});

export const createIllustration = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    scriptId: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    sentence: v.string(),
    sentenceIndex: v.number(),
    illustrationPrompt: v.string(),
    generationModel: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scriptIllustrations", {
      userId: args.userId,
      storeId: args.storeId,
      scriptId: args.scriptId,
      sourceType: args.sourceType,
      sentence: args.sentence,
      sentenceIndex: args.sentenceIndex,
      illustrationPrompt: args.illustrationPrompt,
      imageUrl: "", // Will be updated after generation
      generationModel: args.generationModel,
      generationStatus: "generating",
      createdAt: Date.now(),
    });
  },
});

export const updateIllustrationImage = internalMutation({
  args: {
    illustrationId: v.id("scriptIllustrations"),
    imageUrl: v.string(),
    storageId: v.id("_storage"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.illustrationId, {
      imageUrl: args.imageUrl,
      imageStorageId: args.storageId,
      generationStatus: args.status,
      generatedAt: Date.now(),
    });
  },
});

export const updateIllustrationStatus = internalMutation({
  args: {
    illustrationId: v.id("scriptIllustrations"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.illustrationId, {
      generationStatus: args.status,
      generationError: args.error,
    });
  },
});

export const updateIllustrationEmbedding = internalMutation({
  args: {
    illustrationId: v.id("scriptIllustrations"),
    embedding: v.array(v.number()),
    embeddingModel: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.illustrationId, {
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
    });
  },
});

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = internalQuery({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Create a complete illustration record with image and embedding
 * Used for lead magnet images that are generated and approved in one step
 */
export const createCompleteIllustration = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    scriptId: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    sentence: v.string(),
    sentenceIndex: v.number(),
    illustrationPrompt: v.string(),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    embedding: v.optional(v.array(v.number())),
    embeddingModel: v.optional(v.string()),
    generationModel: v.string(),
    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scriptIllustrations", {
      userId: args.userId,
      storeId: args.storeId,
      scriptId: args.scriptId,
      sourceType: args.sourceType,
      sentence: args.sentence,
      sentenceIndex: args.sentenceIndex,
      illustrationPrompt: args.illustrationPrompt,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      generationModel: args.generationModel,
      generationStatus: args.generationStatus,
      createdAt: Date.now(),
      generatedAt: Date.now(),
    });
  },
});

