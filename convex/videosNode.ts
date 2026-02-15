"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Main pipeline orchestrator (Node.js runtime — required for external API calls).
 *
 * Runs each step in sequence, with image + voice generation in parallel.
 *
 * Progress:
 *   gathering_context:  10%
 *   generating_script:  25%
 *   generating_assets:  40%  (parallel with voice)
 *   generating_voice:   55%  (parallel with assets)
 *   generating_code:    70%
 *   rendering:          85%
 *   completed:          100%
 */
export const runPipeline = internalAction({
  args: {
    jobId: v.id("videoJobs"),
  },
  handler: async (ctx, args) => {
    const { jobId } = args;

    try {
      // ── Step 1: Gather Context ──────────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "gathering_context",
        progress: 10,
      });

      const context = await ctx.runQuery(
        internal.videosPipeline.gatherContext.gatherContext,
        { jobId }
      );

      // ── Step 2: Generate Script ─────────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "generating_script",
        progress: 25,
      });

      const scriptResult = await ctx.runAction(
        internal.videosPipeline.generateScript.generateScript,
        { jobId, context }
      );

      // ── Steps 3+4: Generate Assets + Voice (parallel) ──────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "generating_assets",
        progress: 40,
      });

      // Run image and voice generation in parallel
      const [imageResult, voiceResult] = await Promise.all([
        ctx.runAction(internal.videosPipeline.generateImages.generateImages, {
          jobId,
          imagePrompts: scriptResult.imagePrompts,
          aspectRatio: context.aspectRatio,
        }),
        ctx.runAction(internal.videosPipeline.generateVoice.generateVoice, {
          jobId,
          voiceoverScript: scriptResult.voiceoverScript,
          voiceId: context.voiceId,
        }),
      ]);

      // Update progress after parallel step
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "generating_voice",
        progress: 55,
      });

      // Resolve image storage IDs to URLs for the code generator
      const imageUrls: string[] = [];
      for (const storageId of imageResult.storageIds) {
        if (!storageId) continue;
        const url = await ctx.storage.getUrl(storageId);
        if (url) imageUrls.push(url);
      }

      // Resolve audio URL if available
      let audioUrl: string | undefined;
      if (voiceResult.audioStorageId) {
        const url = await ctx.storage.getUrl(voiceResult.audioStorageId);
        if (url) audioUrl = url;
      }

      // ── Step 5: Generate Code ─────────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "generating_code",
        progress: 70,
      });

      const audioData = (!voiceResult.skipped && audioUrl)
        ? {
            audioUrl,
            duration: voiceResult.duration || context.targetDuration,
            words: voiceResult.words,
          }
        : undefined;

      const fps = 30;
      const totalFrames = context.targetDuration * fps;
      const dimensionMap: Record<string, { width: number; height: number }> = {
        "9:16": { width: 1080, height: 1920 },
        "16:9": { width: 1920, height: 1080 },
        "1:1": { width: 1080, height: 1080 },
      };
      const dimensions = dimensionMap[context.aspectRatio] || { width: 1080, height: 1920 };

      // Check if this is an iteration — fetch parent's code if available
      const currentJob = await ctx.runQuery(internal.videos.getJobInternal, { jobId });
      let previousCode: string | undefined;
      let iterationFeedback: string | undefined;
      if (currentJob?.parentJobId) {
        const parentJob = await ctx.runQuery(internal.videos.getJobInternal, {
          jobId: currentJob.parentJobId,
        });
        previousCode = parentJob?.generatedCode ?? undefined;
        iterationFeedback = currentJob.iterationPrompt ?? undefined;
      }

      const codeResult = await ctx.runAction(
        internal.videosPipeline.generateCode.generateCode,
        {
          jobId,
          scriptId: scriptResult.scriptId,
          imageUrls,
          audioData,
          aspectRatio: context.aspectRatio,
          targetDuration: context.targetDuration,
          previousCode,
          iterationFeedback,
        }
      );

      // ── Step 6: Render Video ──────────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "rendering",
        progress: 75,
      });

      const renderResult = await ctx.runAction(
        internal.videosPipeline.renderVideo.renderVideo,
        {
          jobId,
          generatedCode: codeResult.code,
          imageUrls,
          audioUrl,
          totalFrames,
          width: dimensions.width,
          height: dimensions.height,
        }
      );

      // ── Step 7: Post-Processing ───────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobStatus, {
        jobId,
        status: "post_processing",
        progress: 95,
      });

      const postResult = await ctx.runAction(
        internal.videosPipeline.postProcess.postProcess,
        {
          jobId,
          generatedCode: codeResult.code,
          imageUrls,
          audioUrl,
          totalFrames,
          width: dimensions.width,
          height: dimensions.height,
          scriptId: scriptResult.scriptId,
          audioWords: voiceResult.words,
        }
      );

      // ── Step 8: Complete ──────────────────────────────────────────
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobCompleted, {
        jobId,
      });
    } catch (err: any) {
      console.error("❌ Pipeline failed:", err.message);

      // Get current retry count
      const job = await ctx.runQuery(internal.videos.getJobInternal, { jobId });
      const retryCount = (job?.retryCount ?? 0) + 1;

      // Mark as failed
      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobError, {
        jobId,
        error: err.message || "Unknown pipeline error",
        retryCount,
      });

      // Retry if under limit
      if (retryCount < 3) {
        await ctx.scheduler.runAfter(5000, internal.videosNode.runPipeline, { jobId });
      }
    }
  },
});
