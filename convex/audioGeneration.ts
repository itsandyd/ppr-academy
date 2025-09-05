import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Start audio generation for a chapter
export const startAudioGeneration = mutation({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the chapter
      const chapter = await ctx.db.get(args.chapterId);
      if (!chapter) {
        return { success: false, message: "Chapter not found" };
      }

      // Get the course to verify ownership
      const course = await ctx.db.get(chapter.courseId as Id<"courses">);
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, message: "Not authenticated" };
      }
      if (!course || course.userId !== identity.subject) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if audio is already being generated
      if (chapter.audioGenerationStatus === "generating") {
        return { success: false, message: "Audio generation already in progress" };
      }

      // Update status to generating
      await ctx.db.patch(args.chapterId, {
        audioGenerationStatus: "generating",
        audioGenerationError: undefined,
      });

      // Schedule the audio generation action
      await ctx.scheduler.runAfter(0, internal.audioGeneration.generateAudio, {
        chapterId: args.chapterId,
      });

      return { success: true, message: "Audio generation started" };
    } catch (error) {
      console.error("Error starting audio generation:", error);
      return { success: false, message: "Failed to start audio generation" };
    }
  },
});

// Internal action to generate audio using ElevenLabs
export const generateAudio = internalAction({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get the chapter content
      const chapter = await ctx.runQuery(internal.audioGeneration.getChapterContent, {
        chapterId: args.chapterId,
      });

      if (!chapter) {
        await ctx.runMutation(internal.audioGeneration.updateAudioGenerationStatus, {
          chapterId: args.chapterId,
          status: "failed",
          error: "Chapter not found",
        });
        return null;
      }

      // Call our existing API route for audio generation
      const response = await fetch(`${process.env.CONVEX_SITE_URL}/api/generate-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: chapter.description || "",
          chapterId: args.chapterId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        await ctx.runMutation(internal.audioGeneration.updateAudioGenerationStatus, {
          chapterId: args.chapterId,
          status: "failed",
          error: errorData.error || `HTTP ${response.status}`,
        });
        return null;
      }

      const result = await response.json();

      // Store the generated audio file (for now, we'll store the base64 data URL)
      // In a production environment, you'd want to upload this to Convex file storage
      await ctx.runMutation(internal.audioGeneration.updateAudioGenerationStatus, {
        chapterId: args.chapterId,
        status: "completed",
        audioUrl: result.audioData,
        generatedAt: Date.now(),
      });

    } catch (error) {
      console.error("Audio generation error:", error);
      await ctx.runMutation(internal.audioGeneration.updateAudioGenerationStatus, {
        chapterId: args.chapterId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return null;
  },
});

// Internal query to get chapter content
export const getChapterContent = internalQuery({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.union(
    v.object({
      _id: v.id("courseChapters"),
      title: v.string(),
      description: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) {
      return null;
    }

    return {
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
    };
  },
});

// Internal mutation to update audio generation status
export const updateAudioGenerationStatus = internalMutation({
  args: {
    chapterId: v.id("courseChapters"),
    status: v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      audioGenerationStatus: args.status,
    };

    if (args.error !== undefined) {
      updates.audioGenerationError = args.error;
    }

    if (args.audioUrl) {
      updates.generatedAudioUrl = args.audioUrl;
    }

    if (args.generatedAt) {
      updates.audioGeneratedAt = args.generatedAt;
    }

    await ctx.db.patch(args.chapterId, updates);
    return null;
  },
});

// Query to get audio generation status
export const getAudioGenerationStatus = query({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.union(
    v.object({
      status: v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed")),
      audioUrl: v.optional(v.string()),
      error: v.optional(v.string()),
      generatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) {
      return null;
    }

    // Verify ownership
    const course = await ctx.db.get(chapter.courseId as Id<"courses">);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !course || course.userId !== identity.subject) {
      return null;
    }

    return {
      status: chapter.audioGenerationStatus || "pending",
      audioUrl: chapter.generatedAudioUrl,
      error: chapter.audioGenerationError,
      generatedAt: chapter.audioGeneratedAt,
    };
  },
});

// Start video generation for a chapter
export const startVideoGeneration = mutation({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the chapter
      const chapter = await ctx.db.get(args.chapterId);
      if (!chapter) {
        return { success: false, message: "Chapter not found" };
      }

      // Get the course to verify ownership
      const course = await ctx.db.get(chapter.courseId as Id<"courses">);
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, message: "Not authenticated" };
      }
      if (!course || course.userId !== identity.subject) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if audio is generated first
      if (!chapter.generatedAudioUrl) {
        return { success: false, message: "Audio must be generated first" };
      }

      // Check if video is already being generated
      if (chapter.videoGenerationStatus === "generating") {
        return { success: false, message: "Video generation already in progress" };
      }

      // Update status to generating
      await ctx.db.patch(args.chapterId, {
        videoGenerationStatus: "generating",
        videoGenerationError: undefined,
      });

      // Schedule the video generation action
      await ctx.scheduler.runAfter(0, internal.audioGeneration.generateVideo, {
        chapterId: args.chapterId,
      });

      return { success: true, message: "Video generation started" };
    } catch (error) {
      console.error("Error starting video generation:", error);
      return { success: false, message: "Failed to start video generation" };
    }
  },
});

// Internal action to generate video (placeholder for now)
export const generateVideo = internalAction({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // For now, this is a placeholder that simulates video generation
      // In a real implementation, you would:
      // 1. Extract images from the chapter content
      // 2. Get the generated audio
      // 3. Use a video generation service to combine them
      // 4. Store the resulting video

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Mark as completed (placeholder)
      await ctx.runMutation(internal.audioGeneration.updateVideoGenerationStatus, {
        chapterId: args.chapterId,
        status: "completed",
        videoUrl: "placeholder-video-url",
        generatedAt: Date.now(),
      });

    } catch (error) {
      console.error("Video generation error:", error);
      await ctx.runMutation(internal.audioGeneration.updateVideoGenerationStatus, {
        chapterId: args.chapterId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return null;
  },
});

// Internal mutation to update video generation status
export const updateVideoGenerationStatus = internalMutation({
  args: {
    chapterId: v.id("courseChapters"),
    status: v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed")),
    error: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      videoGenerationStatus: args.status,
    };

    if (args.error !== undefined) {
      updates.videoGenerationError = args.error;
    }

    if (args.videoUrl) {
      updates.generatedVideoUrl = args.videoUrl;
    }

    if (args.generatedAt) {
      updates.videoGeneratedAt = args.generatedAt;
    }

    await ctx.db.patch(args.chapterId, updates);
    return null;
  },
});

// Mutation to save generated audio data to a chapter (for ChapterDialog)
export const saveGeneratedAudioToChapter = mutation({
  args: {
    chapterId: v.id("courseChapters"),
    audioData: v.string(), // base64 audio data
    metadata: v.object({
      voiceName: v.string(),
      wordCount: v.optional(v.number()),
      estimatedDuration: v.optional(v.number()),
      audioSize: v.optional(v.number()),
      isSimulated: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, error: "Unauthorized" };
      }

      // Verify chapter ownership
      const chapter = await ctx.db.get(args.chapterId);
      if (!chapter) {
        return { success: false, error: "Chapter not found" };
      }

      const course = await ctx.db.get(chapter.courseId as Id<"courses">);
      if (!course || course.userId !== identity.subject) {
        return { success: false, error: "Unauthorized" };
      }

      // Update the chapter with the generated audio data
      await ctx.db.patch(args.chapterId, {
        generatedAudioUrl: args.audioData,
        audioGenerationStatus: "completed" as const,
        audioGeneratedAt: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error saving generated audio:", error);
      return { 
        success: false, 
        error: "Failed to save generated audio to chapter" 
      };
    }
  },
});
