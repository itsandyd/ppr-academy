"use node";

import { action, internalAction } from "../_generated/server";
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

const VIRALITY_SCORING_PROMPT = `You are an extremely critical social media analyst. Your job is to harshly evaluate scripts and identify weaknesses. Most content is mediocre - be honest about it.

IMPORTANT: You must use the FULL range of scores. A score of 5 is AVERAGE, not bad. Most scripts should score between 3-7. Only exceptional scripts get 8+.

# SCORING CRITERIA (be harsh)

## Engagement Potential (40% weight)
Deduct points for:
- Generic hooks like "Here's how to..." or "Did you know..." (-2 points)
- No controversy or hot take (-1 point)
- Weak or missing call-to-action (-1 point)
- No emotional trigger or pain point (-2 points)
Award points for:
- Pattern interrupt or unexpected opening (+2)
- Controversial/contrarian angle (+2)
- Creates genuine FOMO or urgency (+1)

## Educational Value (35% weight)
Deduct points for:
- Generic advice anyone could give (-3 points)
- No specific numbers, steps, or examples (-2 points)
- Information easily found on Google (-2 points)
Award points for:
- Insider knowledge or unique perspective (+2)
- Specific actionable steps with details (+2)
- Counter-intuitive insight (+2)

## Trend Alignment (25% weight)
Deduct points for:
- Long paragraphs instead of punchy lines (-2 points)
- No clear structure (lists, before/after, etc.) (-1 point)
- Sounds like a blog post, not a video script (-2 points)
Award points for:
- Viral format (numbered tips, "stop doing X", secrets revealed) (+2)
- Appropriate pacing for short-form (+1)

# CALIBRATED SCORING (use this distribution)
- 9-10: Exceptional (top 5%). Would genuinely go viral. Multiple unique elements.
- 7-8: Strong (top 20%). Clear hook, real value, good format. Minor weaknesses.
- 5-6: Average (middle 50%). Decent but forgettable. Missing standout elements.
- 3-4: Weak (bottom 25%). Generic advice, poor hook, or wrong format.
- 1-2: Poor (bottom 5%). Multiple fundamental problems.

BE CRITICAL. If the hook is generic, score engagement 4-5 max. If it's common knowledge, score educational value 3-5 max.

# OUTPUT FORMAT (JSON ONLY)
{
  "viralityScore": <number 1-10>,
  "engagementPotential": <number 1-10>,
  "educationalValue": <number 1-10>,
  "trendAlignment": <number 1-10>,
  "reasoning": "<2-3 sentences. Start with the biggest weakness, then note any strengths.>"
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
// @ts-ignore - Convex type inference issue
export const startScriptGeneration = action({
  args: {
    storeId: v.string(),
    userId: v.string(),
    jobType: v.union(v.literal("full_scan"), v.literal("course_scan"), v.literal("incremental")),
    courseId: v.optional(v.id("courses")),
  },
  returns: v.id("scriptGenerationJobs"),
  handler: async (ctx, args): Promise<Id<"scriptGenerationJobs">> => {
    // Create the job
    // @ts-ignore - Convex type inference depth issue
    const jobId = await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.createJob, {
      storeId: args.storeId,
      userId: args.userId,
      jobType: args.jobType,
      courseId: args.courseId,
    });

    // Get chapters to process
    const chapters = await ctx.runQuery(
      internal.masterAI.socialScriptAgentMutations.getChaptersToProcess,
      {
        userId: args.userId,
        jobType: args.jobType,
        courseId: args.courseId,
      }
    );

    if (chapters.length === 0) {
      await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.completeJob, {
        jobId,
        scriptsGenerated: 0,
      });
      return jobId;
    }

    // Update job with total chapters
    await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.updateJobProgress, {
      jobId,
      totalChapters: chapters.length,
      processedChapters: 0,
    });

    // Schedule the first batch
    const firstBatch = chapters.slice(0, BATCH_SIZE);
    const batchId = `batch-${Date.now()}`;

    await ctx.scheduler.runAfter(0, internal.masterAI.socialScriptAgent.processChapterBatch, {
      jobId,
      chapterIds: firstBatch.map((c: any) => c.chapterId),
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
// @ts-ignore - Convex type inference issue
export const getJobStatus = action({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  // @ts-ignore - Convex type inference issue
  handler: async (ctx, args) => {
    return await ctx.runQuery(api.masterAI.socialScriptAgentMutations.getJobById, {
      jobId: args.jobId,
    });
  },
});

/**
 * Cancel a job that's stuck or running
 */
export const cancelJob = action({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.cancelJob, {
      jobId: args.jobId,
    });
  },
});

/**
 * Resume a stalled job from where it left off
 */
// @ts-ignore - Convex type inference issue
export const resumeJob = action({
  args: {
    jobId: v.id("scriptGenerationJobs"),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // Get the job
    const job = await ctx.runQuery(internal.masterAI.socialScriptAgentMutations.getJobInternal, {
      jobId: args.jobId,
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Only allow resuming processing jobs that appear stalled
    if (job.status !== "processing") {
      throw new Error("Job is not in processing state");
    }

    // Check if job is stalled (no update in last 2 minutes)
    const stalledThreshold = 2 * 60 * 1000; // 2 minutes
    const timeSinceUpdate = Date.now() - job.updatedAt;
    if (timeSinceUpdate < stalledThreshold) {
      throw new Error("Job is still active. Wait 2 minutes before resuming.");
    }

    // Get remaining chapters to process
    const allChapters = await ctx.runQuery(
      internal.masterAI.socialScriptAgentMutations.getChaptersToProcess,
      {
        userId: job.userId,
        jobType: job.jobType,
        courseId: job.courseId,
      }
    );

    // Calculate remaining batches
    const processedCount = job.processedChapters || 0;
    const totalChapters = job.totalChapters || allChapters.length;
    const totalBatches = Math.ceil(totalChapters / BATCH_SIZE);
    const currentBatchIndex = Math.floor(processedCount / BATCH_SIZE);

    // Get chapters for next batch (skip already processed)
    const nextBatchStart = currentBatchIndex * BATCH_SIZE;
    const nextBatchChapters = allChapters
      .slice(nextBatchStart, nextBatchStart + BATCH_SIZE)
      .map((c: any) => c.chapterId);

    if (nextBatchChapters.length === 0) {
      // No more chapters, mark as complete
      await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.completeJob, {
        jobId: args.jobId,
        scriptsGenerated: job.scriptsGenerated,
      });
      return true;
    }

    // Schedule the next batch
    await ctx.scheduler.runAfter(0, internal.masterAI.socialScriptAgent.processChapterBatch, {
      jobId: args.jobId,
      chapterIds: nextBatchChapters,
      batchId: `batch-resume-${Date.now()}`,
      batchIndex: currentBatchIndex,
      totalBatches,
    });

    return true;
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

    // Get job info
    const job = await ctx.runQuery(internal.masterAI.socialScriptAgentMutations.getJobInternal, {
      jobId,
    });

    if (!job || job.status === "cancelled") {
      return;
    }

    // Update job status to processing
    await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.updateJobStatus, {
      jobId,
      status: "processing",
      currentBatchId: batchId,
    });

    // Get account profiles for matching
    const accountProfiles = await ctx.runQuery(
      internal.masterAI.socialScriptAgentMutations.getAccountProfiles,
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
    // Update job progress
    const newProcessed = (job.processedChapters || 0) + chapterIds.length;
    const newFailed = (job.failedChapters || 0) + failed;
    const newGenerated = (job.scriptsGenerated || 0) + succeeded;

    await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.updateJobProgress, {
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
        internal.masterAI.socialScriptAgentMutations.getChaptersToProcess,
        {
          userId: job.userId,
          jobType: job.jobType,
          courseId: job.courseId,
        }
      );

      const nextBatchStart = nextBatchIndex * BATCH_SIZE;
      const nextBatchChapters = allChapters
        .slice(nextBatchStart, nextBatchStart + BATCH_SIZE)
        .map((c: any) => c.chapterId);

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
      await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.completeJob, {
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
    internal.masterAI.socialScriptAgentMutations.getChapterInfo,
    { chapterId }
  );

  if (!chapterInfo || !chapterInfo.chapter) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  const { chapter, course, modulePosition, lessonPosition } = chapterInfo;

  // Extract content from chapter (description/content)
  const sourceContent = chapter.description || "";
  if (sourceContent.length < 100) {
    throw new Error("Content too short");
  }

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
  const chapterPosition = (modulePosition || 1) + (chapter.position || 0) / 10;

  // Store the generated script
  const scriptId = await ctx.runMutation(internal.generatedScripts.createGeneratedScript, {
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
  });

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

  const parsed = safeParseJson(response.content) as {
    viralityScore?: number;
    engagementPotential?: number;
    educationalValue?: number;
    trendAlignment?: number;
    reasoning?: string;
  } | null;

  return {
    viralityScore: parsed?.viralityScore || 5,
    engagementPotential: parsed?.engagementPotential || 5,
    educationalValue: parsed?.educationalValue || 5,
    trendAlignment: parsed?.trendAlignment || 5,
    reasoning: parsed?.reasoning || "Unable to analyze",
  };
}

// ============================================================================
// RESCORING FUNCTIONS
// ============================================================================

const RESCORE_BATCH_SIZE = 10; // Process 10 scripts at a time
const RESCORE_PAGE_SIZE = 50; // Fetch 50 scripts at a time from DB

/**
 * Start rescoring all scripts for a store
 * Uses pagination to avoid loading too many bytes
 */
export const startRescoring = action({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let rescored = 0;
    let total = 0;
    let cursor: any = undefined;
    let pageNumber = 0;

    // Process scripts in pages to avoid memory limits
    while (true) {
      pageNumber++;

      // Get a page of scripts
      const result = await ctx.runQuery(
        internal.masterAI.socialScriptAgentMutations.getScriptsForRescoring,
        { storeId: args.storeId, limit: RESCORE_PAGE_SIZE, cursor }
      );

      const scripts = result.scripts;

      if (scripts.length === 0) {
        if (total === 0) {
          return { rescored: 0, total: 0 };
        }
        break;
      }

      total += scripts.length;

      // Process this page in batches
      const batches = [];
      for (let i = 0; i < scripts.length; i += RESCORE_BATCH_SIZE) {
        batches.push(scripts.slice(i, i + RESCORE_BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        // Process batch in parallel
        const results = await Promise.allSettled(
          batch.map((script: any) => rescoreScript(ctx, script))
        );

        rescored += results.filter((r) => r.status === "fulfilled").length;
      }

      // Check if there are more pages
      if (!result.hasMore) {
        break;
      }

      cursor = result.nextCursor;
    }

    return { rescored, total };
  },
});

/**
 * Rescore a single script
 */
async function rescoreScript(ctx: any, script: any) {
  // Score virality with new criteria
  const viralityAnalysis = await scoreVirality(ctx, {
    tiktokScript: script.tiktokScript,
    combinedScript: script.combinedScript,
    sourceContentSnippet: script.sourceContentSnippet || "",
  });

  // Update the script
  await ctx.runMutation(internal.masterAI.socialScriptAgentMutations.updateScriptVirality, {
    scriptId: script._id,
    viralityScore: viralityAnalysis.viralityScore,
    viralityAnalysis: {
      engagementPotential: viralityAnalysis.engagementPotential,
      educationalValue: viralityAnalysis.educationalValue,
      trendAlignment: viralityAnalysis.trendAlignment,
      reasoning: viralityAnalysis.reasoning,
    },
  });

  return viralityAnalysis.viralityScore;
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

  const parsed = safeParseJson(response.content) as {
    suggestedAccountProfileId?: string;
    matchScore?: number;
    topicMatches?: string[];
    reasoning?: string;
  } | null;

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
