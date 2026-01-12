import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Status validator for generated scripts
const scriptStatusValidator = v.union(
  v.literal("generated"),
  v.literal("reviewed"),
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("archived")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get generated scripts with filtering and pagination
 */
export const getGeneratedScripts = query({
  args: {
    storeId: v.string(),
    status: v.optional(scriptStatusValidator),
    accountProfileId: v.optional(v.id("socialAccountProfiles")),
    courseId: v.optional(v.id("courses")),
    minViralityScore: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let scripts;

    // Query based on most specific filter available
    if (args.accountProfileId) {
      scripts = await ctx.db
        .query("generatedScripts")
        .withIndex("by_suggestedAccountProfileId", (q) =>
          q.eq("suggestedAccountProfileId", args.accountProfileId)
        )
        .collect();
    } else if (args.status) {
      scripts = await ctx.db
        .query("generatedScripts")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.storeId).eq("status", args.status!)
        )
        .collect();
    } else {
      scripts = await ctx.db
        .query("generatedScripts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .collect();
    }

    // Apply additional filters
    let filtered = scripts;

    if (args.status && args.accountProfileId) {
      filtered = filtered.filter((s) => s.status === args.status);
    }

    if (args.courseId) {
      filtered = filtered.filter((s) => s.courseId === args.courseId);
    }

    if (args.minViralityScore !== undefined) {
      filtered = filtered.filter(
        (s) => s.viralityScore >= args.minViralityScore!
      );
    }

    // Sort by virality score descending
    filtered.sort((a, b) => b.viralityScore - a.viralityScore);

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    return {
      scripts: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    };
  },
});

/**
 * Get a single script by ID
 */
export const getScriptById = query({
  args: {
    scriptId: v.id("generatedScripts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scriptId);
  },
});

/**
 * Get scripts by course
 */
export const getScriptsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedScripts")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

/**
 * Get scripts for a specific account profile
 */
export const getScriptsForAccount = query({
  args: {
    accountProfileId: v.id("socialAccountProfiles"),
    status: v.optional(scriptStatusValidator),
  },
  handler: async (ctx, args) => {
    let scripts = await ctx.db
      .query("generatedScripts")
      .withIndex("by_suggestedAccountProfileId", (q) =>
        q.eq("suggestedAccountProfileId", args.accountProfileId)
      )
      .collect();

    if (args.status) {
      scripts = scripts.filter((s) => s.status === args.status);
    }

    // Sort by virality score descending
    scripts.sort((a, b) => b.viralityScore - a.viralityScore);

    return scripts;
  },
});

/**
 * Get script stats for a store
 */
export const getScriptStats = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("generatedScripts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const stats = {
      total: scripts.length,
      byStatus: {
        generated: 0,
        reviewed: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        archived: 0,
      },
      averageViralityScore: 0,
      topPerformers: 0, // Score >= 8
      withFeedback: 0,
      averagePredictionAccuracy: 0,
    };

    let totalViralityScore = 0;
    let totalPredictionAccuracy = 0;
    let scriptsWithAccuracy = 0;

    for (const script of scripts) {
      stats.byStatus[script.status]++;
      totalViralityScore += script.viralityScore;

      if (script.viralityScore >= 8) {
        stats.topPerformers++;
      }

      if (script.userFeedback || script.actualPerformance) {
        stats.withFeedback++;
      }

      if (script.predictionAccuracy !== undefined) {
        totalPredictionAccuracy += script.predictionAccuracy;
        scriptsWithAccuracy++;
      }
    }

    stats.averageViralityScore =
      scripts.length > 0 ? totalViralityScore / scripts.length : 0;
    stats.averagePredictionAccuracy =
      scriptsWithAccuracy > 0
        ? totalPredictionAccuracy / scriptsWithAccuracy
        : 0;

    return stats;
  },
});

/**
 * Get feedback summary for AI improvement
 */
export const getFeedbackSummary = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const scripts = await ctx.db
      .query("generatedScripts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Filter scripts with feedback
    const scriptsWithFeedback = scripts.filter(
      (s) => s.userFeedback || s.actualPerformance
    );

    // Aggregate what worked and what didn't
    const whatWorked: Record<string, number> = {};
    const whatDidntWork: Record<string, number> = {};
    let positiveCount = 0;
    let mixedCount = 0;
    let negativeCount = 0;

    for (const script of scriptsWithFeedback) {
      if (script.userFeedback) {
        // Count audience reactions
        if (script.userFeedback.audienceReaction === "positive") positiveCount++;
        else if (script.userFeedback.audienceReaction === "mixed") mixedCount++;
        else if (script.userFeedback.audienceReaction === "negative")
          negativeCount++;

        // Aggregate what worked
        for (const item of script.userFeedback.whatWorked || []) {
          whatWorked[item] = (whatWorked[item] || 0) + 1;
        }

        // Aggregate what didn't work
        for (const item of script.userFeedback.whatDidntWork || []) {
          whatDidntWork[item] = (whatDidntWork[item] || 0) + 1;
        }
      }
    }

    // Sort by frequency
    const sortedWhatWorked = Object.entries(whatWorked)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const sortedWhatDidntWork = Object.entries(whatDidntWork)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calculate average prediction accuracy
    const scriptsWithAccuracy = scriptsWithFeedback.filter(
      (s) => s.predictionAccuracy !== undefined
    );
    const avgAccuracy =
      scriptsWithAccuracy.length > 0
        ? scriptsWithAccuracy.reduce(
            (sum, s) => sum + (s.predictionAccuracy || 0),
            0
          ) / scriptsWithAccuracy.length
        : 0;

    return {
      totalWithFeedback: scriptsWithFeedback.length,
      audienceReactions: {
        positive: positiveCount,
        mixed: mixedCount,
        negative: negativeCount,
      },
      whatWorkedMost: sortedWhatWorked,
      whatDidntWorkMost: sortedWhatDidntWork,
      averagePredictionAccuracy: avgAccuracy,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update script status
 */
export const updateScriptStatus = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
    status: scriptStatusValidator,
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    await ctx.db.patch(args.scriptId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Assign script to account profile
 */
export const assignScriptToAccount = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
    accountProfileId: v.id("socialAccountProfiles"),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    const profile = await ctx.db.get(args.accountProfileId);
    if (!profile) {
      throw new Error("Account profile not found");
    }

    await ctx.db.patch(args.scriptId, {
      suggestedAccountProfileId: args.accountProfileId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Archive a script
 */
export const archiveScript = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    await ctx.db.patch(args.scriptId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Link script to social media post
 */
export const linkScriptToPost = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
    socialMediaPostId: v.id("socialMediaPosts"),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    await ctx.db.patch(args.scriptId, {
      socialMediaPostId: args.socialMediaPostId,
      status: "in_progress",
      updatedAt: Date.now(),
    });

    // Also update the social media post to link back
    await ctx.db.patch(args.socialMediaPostId, {
      generatedScriptId: args.scriptId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Submit performance feedback (metrics from published post)
 */
export const submitPerformanceFeedback = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    saves: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    // Calculate engagement rate if views are provided
    let engagementRate: number | undefined;
    if (args.views && args.views > 0) {
      const totalEngagements =
        (args.likes || 0) +
        (args.comments || 0) +
        (args.shares || 0) +
        (args.saves || 0);
      engagementRate = (totalEngagements / args.views) * 100;
    }

    // Calculate performance score (1-10) based on metrics
    // This is a simplified scoring - can be made more sophisticated
    let performanceScore = 5; // Default average
    if (engagementRate !== undefined) {
      if (engagementRate >= 10) performanceScore = 10;
      else if (engagementRate >= 7) performanceScore = 9;
      else if (engagementRate >= 5) performanceScore = 8;
      else if (engagementRate >= 3) performanceScore = 7;
      else if (engagementRate >= 2) performanceScore = 6;
      else if (engagementRate >= 1) performanceScore = 5;
      else if (engagementRate >= 0.5) performanceScore = 4;
      else performanceScore = 3;
    }

    // Calculate prediction accuracy (how close was our virality score)
    const predictionAccuracy =
      100 - Math.abs(script.viralityScore - performanceScore) * 10;

    await ctx.db.patch(args.scriptId, {
      actualPerformance: {
        views: args.views,
        likes: args.likes,
        comments: args.comments,
        shares: args.shares,
        saves: args.saves,
        engagementRate,
        performanceScore,
        capturedAt: Date.now(),
      },
      predictionAccuracy,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      performanceScore,
      predictionAccuracy,
    };
  },
});

/**
 * Submit user feedback
 */
export const submitUserFeedback = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    audienceReaction: v.optional(
      v.union(v.literal("positive"), v.literal("mixed"), v.literal("negative"))
    ),
    whatWorked: v.optional(v.array(v.string())),
    whatDidntWork: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    await ctx.db.patch(args.scriptId, {
      userFeedback: {
        rating: args.rating,
        notes: args.notes,
        audienceReaction: args.audienceReaction,
        whatWorked: args.whatWorked,
        whatDidntWork: args.whatDidntWork,
        submittedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a script (only if not scheduled or in use)
 */
export const deleteScript = mutation({
  args: {
    scriptId: v.id("generatedScripts"),
  },
  handler: async (ctx, args) => {
    const script = await ctx.db.get(args.scriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    // Check if scheduled
    if (script.status === "scheduled" || script.status === "in_progress") {
      throw new Error(
        "Cannot delete a script that is scheduled or in progress"
      );
    }

    // Check if linked to a social media post
    if (script.socialMediaPostId) {
      throw new Error("Cannot delete a script linked to a social media post");
    }

    // Check for calendar entries
    const calendarEntry = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_generatedScriptId", (q) =>
        q.eq("generatedScriptId", args.scriptId)
      )
      .first();

    if (calendarEntry) {
      throw new Error("Cannot delete a script with calendar entries");
    }

    await ctx.db.delete(args.scriptId);
    return { success: true };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for AI agent)
// ============================================================================

/**
 * Create a generated script (used by AI agent)
 */
export const createGeneratedScript = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    courseId: v.id("courses"),
    chapterId: v.id("courseChapters"),
    moduleId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    courseTitle: v.string(),
    chapterTitle: v.string(),
    chapterPosition: v.number(),
    sourceContentSnippet: v.string(),
    tiktokScript: v.string(),
    youtubeScript: v.string(),
    instagramScript: v.string(),
    combinedScript: v.string(),
    suggestedCta: v.optional(v.string()),
    suggestedKeyword: v.optional(v.string()),
    viralityScore: v.number(),
    viralityAnalysis: v.object({
      engagementPotential: v.number(),
      educationalValue: v.number(),
      trendAlignment: v.number(),
      reasoning: v.string(),
    }),
    suggestedAccountProfileId: v.optional(v.id("socialAccountProfiles")),
    topicMatch: v.optional(v.array(v.string())),
    accountMatchScore: v.optional(v.number()),
    generationBatchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const scriptId = await ctx.db.insert("generatedScripts", {
      storeId: args.storeId,
      userId: args.userId,
      courseId: args.courseId,
      chapterId: args.chapterId,
      moduleId: args.moduleId,
      lessonId: args.lessonId,
      courseTitle: args.courseTitle,
      chapterTitle: args.chapterTitle,
      chapterPosition: args.chapterPosition,
      sourceContentSnippet: args.sourceContentSnippet,
      tiktokScript: args.tiktokScript,
      youtubeScript: args.youtubeScript,
      instagramScript: args.instagramScript,
      combinedScript: args.combinedScript,
      suggestedCta: args.suggestedCta,
      suggestedKeyword: args.suggestedKeyword,
      viralityScore: args.viralityScore,
      viralityAnalysis: args.viralityAnalysis,
      suggestedAccountProfileId: args.suggestedAccountProfileId,
      topicMatch: args.topicMatch,
      accountMatchScore: args.accountMatchScore,
      status: "generated",
      generatedAt: now,
      generationBatchId: args.generationBatchId,
      createdAt: now,
      updatedAt: now,
    });

    return scriptId;
  },
});
