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
    let q = ctx.db.query("scriptIllustrations");

    // Apply filters - need to use filter instead of chained withIndex
    // because we can only use one index at a time
    if (args.userId) {
      q = q.withIndex("by_userId", (qb) => qb.eq("userId", args.userId));
    } else if (args.scriptId) {
      q = q.withIndex("by_scriptId", (qb) => qb.eq("scriptId", args.scriptId));
    } else if (args.sourceType) {
      q = q.withIndex("by_sourceType", (qb) => qb.eq("sourceType", args.sourceType));
    }

    const illustrations = await q
      .filter((qf) => qf.neq(qf.field("embedding"), undefined))
      .take(args.limit ?? 100);

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
      .collect();
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

