import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Internal mutations for storing video scripts during pipeline execution.
 */

export const storeScript = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    totalDuration: v.number(),
    voiceoverScript: v.string(),
    scenes: v.array(
      v.object({
        id: v.string(),
        duration: v.number(),
        voiceover: v.optional(v.string()),
        onScreenText: v.object({
          headline: v.optional(v.string()),
          subhead: v.optional(v.string()),
          bulletPoints: v.optional(v.array(v.string())),
          emphasis: v.optional(v.array(v.string())),
        }),
        visualDirection: v.string(),
        mood: v.string(),
      })
    ),
    colorPalette: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
    }),
    imagePrompts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("videoScripts", {
      jobId: args.jobId,
      totalDuration: args.totalDuration,
      voiceoverScript: args.voiceoverScript,
      scenes: args.scenes,
      colorPalette: args.colorPalette,
      imagePrompts: args.imagePrompts,
    });
  },
});

export const linkScriptToJob = internalMutation({
  args: {
    jobId: v.id("videoJobs"),
    scriptId: v.id("videoScripts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      scriptId: args.scriptId,
    });
  },
});
