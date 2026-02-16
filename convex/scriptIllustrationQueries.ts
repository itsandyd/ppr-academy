import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// INTERNAL QUERIES (called by actions in scriptIllustrationSearch.ts)
// ============================================================================

export const getAllIllustrationsWithEmbeddings = internalQuery({
  args: {
    userId: v.optional(v.string()),
    scriptId: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    // Use separate query paths for each filter type
    // because Convex query builder type changes after withIndex
    let illustrations;
    
    if (args.userId) {
      const userId = args.userId;
      illustrations = await ctx.db
        .query("scriptIllustrations")
        .withIndex("by_userId", (qb) => qb.eq("userId", userId))
        .filter((qf) => qf.neq(qf.field("embedding"), undefined))
        .take(limit);
    } else if (args.scriptId) {
      const scriptId = args.scriptId;
      illustrations = await ctx.db
        .query("scriptIllustrations")
        .withIndex("by_scriptId", (qb) => qb.eq("scriptId", scriptId))
        .filter((qf) => qf.neq(qf.field("embedding"), undefined))
        .take(limit);
    } else if (args.sourceType) {
      const sourceType = args.sourceType;
      illustrations = await ctx.db
        .query("scriptIllustrations")
        .withIndex("by_sourceType", (qb) => qb.eq("sourceType", sourceType))
        .filter((qf) => qf.neq(qf.field("embedding"), undefined))
        .take(limit);
    } else {
      illustrations = await ctx.db
        .query("scriptIllustrations")
        .filter((qf) => qf.neq(qf.field("embedding"), undefined))
        .take(limit);
    }

    return illustrations;
  },
});

export const getIllustrationById = internalQuery({
  args: {
    illustrationId: v.id("scriptIllustrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.illustrationId);
  },
});

// ============================================================================
// PUBLIC QUERIES FOR UI
// ============================================================================

/**
 * Get all illustrations for a script/job
 */
export const getIllustrationsByScript = query({
  args: {
    scriptId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scriptIllustrations")
      .withIndex("by_scriptId_and_sentenceIndex", (q) => q.eq("scriptId", args.scriptId))
      .order("asc")
      .take(500);
  },
});

/**
 * Get illustration job status
 */
export const getJobStatus = query({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    return {
      status: job.status,
      totalSentences: job.totalSentences,
      processedSentences: job.processedSentences,
      failedSentences: job.failedSentences,
      progress: job.totalSentences > 0 
        ? Math.round((job.processedSentences / job.totalSentences) * 100)
        : 0,
      errors: job.errors || [],
    };
  },
});

/**
 * Get user's illustration jobs
 */
export const getUserJobs = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scriptIllustrationJobs")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

