"use node";

import { action, internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { callLLM, safeParseJson } from "./llmClient";
import { type ModelId } from "./types";

const DEFAULT_MODEL: ModelId = "gemini-2.5-flash";
const BATCH_SIZE = 5; // Process 5 chapters at a time

// ============================================================================
// VIRALITY SCORING PROMPT
// ============================================================================

const VIRALITY_SCORING_PROMPT = `You are an expert social media analyst specializing in educational content virality on TikTok, Instagram, and YouTube.

Analyze the following social media scripts and provide a virality score from 1-10.

# SCORING CRITERIA

## Engagement Potential (40% weight)
Score based on:
- Does it have a scroll-stopping hook? (curiosity, controversy, FOMO)
- Does it address a specific pain point that resonates emotionally?
- Does it include a hot take or controversial statement?
- Does it create "I need to save this" urgency?
- Is there a clear call-to-action?

## Educational Value (35% weight)
Score based on:
- Does it provide specific, actionable tips (not generic advice)?
- Does it promise and deliver clear outcomes?
- Is the information valuable and not commonly known?
- Does it teach something most people in the niche don't know?
- Are there concrete examples or step-by-step instructions?

## Trend Alignment (25% weight)
Score based on:
- Does it follow current short-form video formats (lists, before/after, reveals)?
- Is the pacing appropriate (quick cuts, frequent line breaks)?
- Does it use proven content structures (numbered tips, contrarian takes, secrets)?
- Is the hook format similar to trending content?

# SCORING GUIDE
- 9-10: Viral potential. Multiple scroll-stopping elements, unique insight, perfect format
- 7-8: High performing. Strong hook, good value, solid format
- 5-6: Average. Decent content but missing standout elements
- 3-4: Below average. Weak hook, generic advice, or poor format
- 1-2: Low potential. Multiple fundamental issues

# OUTPUT FORMAT (JSON ONLY)
{
  "viralityScore": <number 1-10>,
  "engagementPotential": <number 1-10>,
  "educationalValue": <number 1-10>,
  "trendAlignment": <number 1-10>,
  "reasoning": "<2-3 sentences explaining the score and what makes it strong or weak>"
}

# SCRIPTS TO ANALYZE

## TikTok Script:
{tiktokScript}

## Combined Script:
{combinedScript}

## Source Content Summary:
{sourceContentSnippet}
`;

// ============================================================================
// ACCOUNT MATCHING PROMPT
// ============================================================================

const ACCOUNT_MATCHING_PROMPT = `You are an expert social media strategist. Match this educational script to the most appropriate account profile based on content alignment.

# AVAILABLE ACCOUNT PROFILES
{accountProfiles}

# SCRIPT DETAILS
Course: {courseTitle}
Chapter: {chapterTitle}

## Combined Script:
{combinedScript}

# MATCHING CRITERIA
1. Topic relevance - Does the script topic align with the account's defined topics/niche?
2. Audience fit - Does the content suit the account's target audience?
3. Topic coverage - How many of the account's topics does this script touch on?

# OUTPUT FORMAT (JSON ONLY)
{
  "suggestedAccountProfileId": "<profile_id or null if no good match>",
  "matchScore": <number 1-100>,
  "topicMatches": ["<list of matching topics from the account profile>"],
  "reasoning": "<1-2 sentences explaining the match>"
}

If no account is a good fit (matchScore would be below 30), return null for suggestedAccountProfileId.
`;

// ============================================================================
// JOB MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Start a script generation job
 */
export const startScriptGeneration = action({
  args: {
    storeId: v.string(),
    userId: v.string(),
    jobType: v.union(
      v.literal("full_scan"),
      v.literal("course_scan"),
      v.literal("incremental")
    ),
    courseId: v.optional(v.id("courses")),
  },
  returns: v.id("scriptGenerationJobs"),
  handler: async (ctx, args) => {
    console.log(`🚀 Starting script generation job: ${args.jobType}`);

    // Create the job
    const jobId = await ctx.runMutation(internal.masterAI.socialScriptAgent.createJob, {
      storeId: args.storeId,
      userId: args.userId,
      jobType: args.jobType,
      courseId: args.courseId,
    });

    // Get chapters to process
    const chapters = await ctx.runQuery(internal.masterAI.socialScriptAgent.getChaptersToProcess, {
      userId: args.userId,
      jobType: args.jobType,
      courseId: args.courseId,
    });

    console.log(`📚 Found ${chapters.length} chapters to process`);

    if (chapters.length === 0) {
      await ctx.runMutation(internal.masterAI.socialScriptAgent.completeJob, {
        jobId,
        scriptsGenerated: 0,
      });
      return jobId;
    }

    // Update job with total chapters
    await ctx.runMutation(internal.masterAI.socialScriptAgent.updateJobProgress, {
      jobId,
      totalChapters: chapters.length,
      processedChapters: 0,
    });

    // Schedule the first batch
    const firstBatch = chapters.slice(0, BATCH_SIZE);
    const batchId = `batch-${Date.now()}`;

    await ctx.scheduler.runAfter(0, internal.masterAI.socialScriptAgent.processChapterBatch, {
      jobId,
      chapterIds: firstBatch.map((c) => c.chapterId),
      batchId,
      batchIndex: 0,
      totalBatches: Math.ceil(chapters.length / BATCH_SIZE),
    });

    return jobId;
  },
});

/**
 * Get job status
 */
export const getJobStatus = action({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(api.masterAI.socialScriptAgent.getJob, {
      jobId: args.jobId,
    });
  },
});

// ============================================================================
// INTERNAL ACTIONS FOR BATCH PROCESSING
// ============================================================================

/**
 * Process a batch of chapters
 */
export const processChapterBatch = internalAction({
  args: {
    jobId: v.id("scriptGenerationJobs"),
    chapterIds: v.array(v.id("courseChapters")),
    batchId: v.string(),
    batchIndex: v.number(),
    totalBatches: v.number(),
  },
  handler: async (ctx, args) => {
    const { jobId, chapterIds, batchId, batchIndex, totalBatches } = args;

    console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (${chapterIds.length} chapters)`);

    // Get job info
    const job = await ctx.runQuery(internal.masterAI.socialScriptAgent.getJobInternal, {
      jobId,
    });

    if (!job || job.status === "cancelled") {
      console.log("Job cancelled, stopping batch processing");
      return;
    }

    // Update job status to processing
    await ctx.runMutation(internal.masterAI.socialScriptAgent.updateJobStatus, {
      jobId,
      status: "processing",
      currentBatchId: batchId,
    });

    // Get account profiles for matching
    const accountProfiles = await ctx.runQuery(
      internal.masterAI.socialScriptAgent.getAccountProfiles,
      { storeId: job.storeId }
    );

    // Process chapters in parallel
    const results = await Promise.allSettled(
      chapterIds.map((chapterId) =>
        processChapter(ctx, {
          storeId: job.storeId,
          userId: job.userId,
          chapterId,
          accountProfiles,
          generationBatchId: batchId,
        })
      )
    );

    // Count results
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`   ✅ Batch complete: ${succeeded} succeeded, ${failed} failed`);

    // Update job progress
    const newProcessed = (job.processedChapters || 0) + chapterIds.length;
    const newFailed = (job.failedChapters || 0) + failed;
    const newGenerated = (job.scriptsGenerated || 0) + succeeded;

    await ctx.runMutation(internal.masterAI.socialScriptAgent.updateJobProgress, {
      jobId,
      processedChapters: newProcessed,
      failedChapters: newFailed,
      scriptsGenerated: newGenerated,
    });

    // Check if there are more batches
    const nextBatchIndex = batchIndex + 1;
    if (nextBatchIndex < totalBatches) {
      // Get all chapters and calculate next batch
      const allChapters = await ctx.runQuery(
        internal.masterAI.socialScriptAgent.getChaptersToProcess,
        {
          userId: job.userId,
          jobType: job.jobType,
          courseId: job.courseId,
        }
      );

      const nextBatchStart = nextBatchIndex * BATCH_SIZE;
      const nextBatchChapters = allChapters
        .slice(nextBatchStart, nextBatchStart + BATCH_SIZE)
        .map((c) => c.chapterId);

      if (nextBatchChapters.length > 0) {
        // Schedule next batch with a small delay
        await ctx.scheduler.runAfter(
          2000,
          internal.masterAI.socialScriptAgent.processChapterBatch,
          {
            jobId,
            chapterIds: nextBatchChapters,
            batchId: `batch-${Date.now()}`,
            batchIndex: nextBatchIndex,
            totalBatches,
          }
        );
      }
    } else {
      // All batches complete
      await ctx.runMutation(internal.masterAI.socialScriptAgent.completeJob, {
        jobId,
        scriptsGenerated: newGenerated,
      });
    }
  },
});

/**
 * Process a single chapter (generate scripts, score, match)
 */
async function processChapter(
  ctx: any,
  args: {
    storeId: string;
    userId: string;
    chapterId: Id<"courseChapters">;
    accountProfiles: any[];
    generationBatchId: string;
  }
) {
  const { storeId, userId, chapterId, accountProfiles, generationBatchId } = args;

  // Get chapter and course info
  const chapterInfo = await ctx.runQuery(
    internal.masterAI.socialScriptAgent.getChapterInfo,
    { chapterId }
  );

  if (!chapterInfo || !chapterInfo.chapter) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  const { chapter, course, modulePosition, lessonPosition } = chapterInfo;

  // Extract content from chapter (description/content)
  const sourceContent = chapter.description || "";
  if (sourceContent.length < 100) {
    console.log(`   ⏭️ Skipping chapter "${chapter.title}" - content too short`);
    throw new Error("Content too short");
  }

  console.log(`   📝 Processing: ${course.title} > ${chapter.title}`);

  // Generate platform scripts using existing function
  const scripts = await ctx.runAction(api.masterAI.socialMediaGenerator.generatePlatformScripts, {
    sourceContent,
    courseTitle: course.title,
    chapterTitle: chapter.title,
  });

  // Combine scripts
  const combined = await ctx.runAction(api.masterAI.socialMediaGenerator.combineScripts, {
    tiktokScript: scripts.tiktokScript,
    youtubeScript: scripts.youtubeScript,
    instagramScript: scripts.instagramScript,
  });

  // Score virality
  const viralityAnalysis = await scoreVirality(ctx, {
    tiktokScript: scripts.tiktokScript,
    combinedScript: combined.combinedScript,
    sourceContentSnippet: sourceContent.slice(0, 500),
  });

  // Match to account
  let accountMatch = null;
  if (accountProfiles.length > 0) {
    accountMatch = await matchToAccount(ctx, {
      combinedScript: combined.combinedScript,
      courseTitle: course.title,
      chapterTitle: chapter.title,
      accountProfiles,
    });
  }

  // Calculate chapter position (e.g., 1.2 for module 1, chapter 2)
  const chapterPosition =
    (modulePosition || 1) + (chapter.position || 0) / 10;

  // Store the generated script
  const scriptId = await ctx.runMutation(
    internal.generatedScripts.createGeneratedScript,
    {
      storeId,
      userId,
      courseId: course._id,
      chapterId: chapter._id,
      moduleId: chapterInfo.moduleId,
      lessonId: chapterInfo.lessonId,
      courseTitle: course.title,
      chapterTitle: chapter.title,
      chapterPosition,
      sourceContentSnippet: sourceContent.slice(0, 500),
      tiktokScript: scripts.tiktokScript,
      youtubeScript: scripts.youtubeScript,
      instagramScript: scripts.instagramScript,
      combinedScript: combined.combinedScript,
      viralityScore: viralityAnalysis.viralityScore,
      viralityAnalysis: {
        engagementPotential: viralityAnalysis.engagementPotential,
        educationalValue: viralityAnalysis.educationalValue,
        trendAlignment: viralityAnalysis.trendAlignment,
        reasoning: viralityAnalysis.reasoning,
      },
      suggestedAccountProfileId: accountMatch?.suggestedAccountProfileId,
      topicMatch: accountMatch?.topicMatches,
      accountMatchScore: accountMatch?.matchScore,
      generationBatchId,
    }
  );

  console.log(
    `   ✅ Created script for "${chapter.title}" - Virality: ${viralityAnalysis.viralityScore}/10`
  );

  return scriptId;
}

/**
 * Score virality of scripts
 */
async function scoreVirality(
  ctx: any,
  args: {
    tiktokScript: string;
    combinedScript: string;
    sourceContentSnippet: string;
  }
) {
  const prompt = VIRALITY_SCORING_PROMPT.replace("{tiktokScript}", args.tiktokScript)
    .replace("{combinedScript}", args.combinedScript)
    .replace("{sourceContentSnippet}", args.sourceContentSnippet);

  const response = await callLLM({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 500,
  });

  const parsed = safeParseJson(response.content);

  return {
    viralityScore: parsed?.viralityScore || 5,
    engagementPotential: parsed?.engagementPotential || 5,
    educationalValue: parsed?.educationalValue || 5,
    trendAlignment: parsed?.trendAlignment || 5,
    reasoning: parsed?.reasoning || "Unable to analyze",
  };
}

/**
 * Match script to account profile
 */
async function matchToAccount(
  ctx: any,
  args: {
    combinedScript: string;
    courseTitle: string;
    chapterTitle: string;
    accountProfiles: any[];
  }
) {
  // Format account profiles for prompt
  const profilesText = args.accountProfiles
    .map(
      (p) =>
        `ID: ${p._id}\nName: ${p.name}\nDescription: ${p.description}\nPlatform: ${p.platform}\nTopics: ${p.topics.join(", ")}\nTarget Audience: ${p.targetAudience || "Not specified"}\n---`
    )
    .join("\n");

  const prompt = ACCOUNT_MATCHING_PROMPT.replace("{accountProfiles}", profilesText)
    .replace("{courseTitle}", args.courseTitle)
    .replace("{chapterTitle}", args.chapterTitle)
    .replace("{combinedScript}", args.combinedScript);

  const response = await callLLM({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 500,
  });

  const parsed = safeParseJson(response.content);

  if (!parsed || !parsed.suggestedAccountProfileId) {
    return null;
  }

  return {
    suggestedAccountProfileId: parsed.suggestedAccountProfileId as Id<"socialAccountProfiles">,
    matchScore: parsed.matchScore || 0,
    topicMatches: parsed.topicMatches || [],
    reasoning: parsed.reasoning || "",
  };
}

// ============================================================================
// INTERNAL MUTATIONS FOR JOB MANAGEMENT
// ============================================================================

export const createJob = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    jobType: v.union(
      v.literal("full_scan"),
      v.literal("course_scan"),
      v.literal("incremental")
    ),
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
    if (args.status === "processing" && !updates.startedAt) {
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

    const recentScripts = scripts.filter(
      (s) => s.generationBatchId?.startsWith("batch-")
    );

    const avgScore =
      recentScripts.length > 0
        ? recentScripts.reduce((sum, s) => sum + s.viralityScore, 0) /
          recentScripts.length
        : 0;

    await ctx.db.patch(args.jobId, {
      status: "completed",
      completedAt: Date.now(),
      scriptsGenerated: args.scriptsGenerated || job.scriptsGenerated,
      averageViralityScore: Math.round(avgScore * 10) / 10,
      updatedAt: Date.now(),
    });

    console.log(`🎉 Job completed! Generated ${args.scriptsGenerated || 0} scripts`);
  },
});

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

import { internalQuery, query } from "../_generated/server";

export const getJob = query({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

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
    jobType: v.union(
      v.literal("full_scan"),
      v.literal("course_scan"),
      v.literal("incremental")
    ),
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

    const course = await ctx.db.get(chapter.courseId);
    if (!course) return null;

    // Get module/lesson position if available
    let modulePosition = 1;
    let moduleId: string | undefined;
    let lessonId: string | undefined;

    if (chapter.lessonId) {
      lessonId = chapter.lessonId as string;
      // Could fetch lesson for more position info if needed
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

// ============================================================================
// USER-FACING QUERIES FOR JOB STATUS
// ============================================================================

export const getActiveJobs = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("scriptGenerationJobs")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "processing")
      )
      .collect();

    // Also get queued jobs
    const queuedJobs = await ctx.db
      .query("scriptGenerationJobs")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "queued")
      )
      .collect();

    return [...jobs, ...queuedJobs];
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
