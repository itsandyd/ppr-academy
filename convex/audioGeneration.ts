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
      // @ts-ignore - Type instantiation depth issue with Convex internal types
      const generateAudioRef = internal.audioGeneration.generateAudio;
      await ctx.scheduler.runAfter(
        0,
        generateAudioRef,
        {
          chapterId: args.chapterId,
        }
      );

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

      // Store the generated audio URL or fallback to base64 data
      const audioUrl = result.audioUrl || result.audioData;
      await ctx.runMutation(internal.audioGeneration.updateAudioGenerationStatus, {
        chapterId: args.chapterId,
        status: "completed",
        audioUrl: audioUrl,
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
    audioData: v.optional(v.string()), // base64 audio data (fallback)
    audioUrl: v.optional(v.string()), // preferred: actual file URL
    metadata: v.object({
      voiceName: v.string(),
      wordCount: v.optional(v.number()),
      estimatedDuration: v.optional(v.number()),
      audioSize: v.optional(v.number()),
      isSimulated: v.optional(v.boolean()),
      isBase64Fallback: v.optional(v.boolean()),
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

      // Update the chapter with the generated audio URL or data
      const audioUrlToStore = args.audioUrl || args.audioData;
      if (!audioUrlToStore) {
        return { success: false, error: "No audio URL or data provided" };
      }
      
      await ctx.db.patch(args.chapterId, {
        generatedAudioUrl: audioUrlToStore,
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

// Step 1: Generate audio only (no metadata)
export const generateTextToSoundEffect = action({
  args: {
    description: v.string(),
    duration: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    filePath: v.optional(v.string()),
    storageId: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    format: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ 
    success: boolean; 
    filePath?: string; 
    storageId?: string;
    audioUrl?: string; 
    format?: string;
    fileSize?: number;
    error?: string 
  }> => {
    try {
      // Generate sound effect (Node.js action handles ElevenLabs + Convex storage upload)
      const result = await ctx.runAction(internal.sampleGeneration.generateSoundEffectFromText, {
        description: args.description,
        duration: args.duration,
      });
      
      // Return all the fields we need for publishing
      return {
        success: result.success,
        filePath: result.filePath,
        storageId: result.storageId ? String(result.storageId) : undefined,
        audioUrl: result.audioUrl,
        format: result.format,
        fileSize: result.fileSize,
        error: result.error,
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate audio",
      };
    }
  },
});

// Step 2: Save to marketplace with metadata (uses existing storage)
export const saveSampleToMarketplace = action({
  args: {
    userId: v.string(),
    storeId: v.string(),
    storageId: v.id("_storage"),
    audioUrl: v.string(),
    title: v.string(),
    description: v.string(),
    duration: v.number(),
    format: v.string(),
    fileSize: v.number(),
    genre: v.string(),
    category: v.union(
      v.literal("drums"),
      v.literal("bass"),
      v.literal("synth"),
      v.literal("vocals"),
      v.literal("fx"),
      v.literal("melody"),
      v.literal("loops"),
      v.literal("one-shots")
    ),
    tags: v.array(v.string()),
    creditPrice: v.number(),
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    try {
      // Audio is already in Convex storage from step 1, just create the DB record
      const fileName = `${args.title.toLowerCase().replace(/\s+/g, '_')}.${args.format}`;
      
      // Create sample record
      const sampleId: Id<"audioSamples"> = await ctx.runMutation(internal.audioGeneration.createSampleRecord, {
        userId: args.userId,
        storeId: args.storeId,
        title: args.title,
        description: args.description,
        storageId: args.storageId,
        fileUrl: args.audioUrl,
        fileName,
        fileSize: args.fileSize,
        duration: args.duration,
        format: args.format,
        genre: args.genre,
        category: args.category,
        tags: args.tags,
        creditPrice: args.creditPrice,
        licenseType: args.licenseType,
      });
      
      console.log(`✅ Sample published: ${args.title} (${sampleId})`);
      
      // Get the created sample
      const sample: any = await ctx.runQuery(internal.audioGeneration.getSampleById, {
        sampleId,
      });
      
      return sample;
      
    } catch (error: any) {
      console.error("❌ Error saving sample:", error);
      throw new Error(error.message || "Failed to save sample");
    }
  },
});

// LEGACY: Generate AI-powered sample using ElevenLabs (all-in-one)
export const generateAISample = action({
  args: {
    userId: v.string(),
    storeId: v.string(),
    description: v.string(),
    title: v.string(),
    duration: v.number(),
    genre: v.string(),
    category: v.union(
      v.literal("drums"),
      v.literal("bass"),
      v.literal("synth"),
      v.literal("vocals"),
      v.literal("fx"),
      v.literal("melody"),
      v.literal("loops"),
      v.literal("one-shots")
    ),
    tags: v.array(v.string()),
    creditPrice: v.number(),
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log("🎵 Generating AI sample:", args.title);
      
      // Generate sound effect using ElevenLabs via Node.js action
      const elevenlabsResult: { success: boolean; filePath?: string; error?: string } = 
        await ctx.runAction(internal.sampleGeneration.generateSoundEffectFromText, {
          description: args.description,
          duration: args.duration,
        });
      
      if (!elevenlabsResult.success || !elevenlabsResult.filePath) {
        throw new Error(elevenlabsResult.error || "Failed to generate sound effect");
      }
      
      // Read the generated audio file
      const fs = await import("fs/promises");
      const path = await import("path");
      const audioBuffer: Buffer = await fs.readFile(elevenlabsResult.filePath);
      
      // Get file stats
      const stats: { size: number } = await fs.stat(elevenlabsResult.filePath);
      const fileSize: number = stats.size;
      
      // Extract filename
      const fileName = path.basename(elevenlabsResult.filePath);
      const format = path.extname(fileName).slice(1); // Remove the dot
      
      // Store file in Convex storage - convert Buffer to Uint8Array
      const storageId = await ctx.storage.store(
        new Blob([new Uint8Array(audioBuffer)], { type: `audio/${format}` })
      );
      
      // Get storage URL
      const fileUrl = await ctx.storage.getUrl(storageId);
      
      if (!fileUrl) {
        throw new Error("Failed to get storage URL");
      }
      
      // Create sample record
      const sampleId: Id<"audioSamples"> = await ctx.runMutation(internal.audioGeneration.createSampleRecord, {
        userId: args.userId,
        storeId: args.storeId,
        title: args.title,
        description: args.description,
        storageId,
        fileUrl,
        fileName,
        fileSize,
        duration: args.duration,
        format,
        genre: args.genre,
        category: args.category,
        tags: args.tags,
        creditPrice: args.creditPrice,
        licenseType: args.licenseType,
      });
      
      // Clean up temporary file
      await fs.unlink(elevenlabsResult.filePath).catch((err: Error) => 
        console.warn("Failed to delete temp file:", err)
      );
      
      console.log("✅ AI sample created:", sampleId);
      
      // Get the created sample
      const sample: any = await ctx.runQuery(internal.audioGeneration.getSampleById, {
        sampleId,
      });
      
      return sample;
      
    } catch (error: any) {
      console.error("❌ Error generating AI sample:", error);
      throw new Error(error.message || "Failed to generate AI sample");
    }
  },
});

// Internal action to call ElevenLabs API
// Note: callElevenLabsSFX is now in audioGenerationNode.ts (Node.js action)

// Internal mutation to create sample record
export const createSampleRecord = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    duration: v.number(),
    format: v.string(),
    genre: v.string(),
    category: v.union(
      v.literal("drums"),
      v.literal("bass"),
      v.literal("synth"),
      v.literal("vocals"),
      v.literal("fx"),
      v.literal("melody"),
      v.literal("loops"),
      v.literal("one-shots")
    ),
    tags: v.array(v.string()),
    creditPrice: v.number(),
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
  },
  returns: v.id("audioSamples"),
  handler: async (ctx, args) => {
    const sampleId = await ctx.db.insert("audioSamples", {
      userId: args.userId,
      storeId: args.storeId,
      title: args.title,
      description: args.description,
      storageId: args.storageId,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      duration: args.duration,
      format: args.format,
      genre: args.genre,
      category: args.category,
      tags: args.tags,
      creditPrice: args.creditPrice,
      licenseType: args.licenseType,
      isPublished: true, // Auto-publish admin-created samples
      downloads: 0,
      plays: 0,
      favorites: 0,
    });
    
    return sampleId;
  },
});

// Internal query to get sample by ID
export const getSampleById = internalQuery({
  args: {
    sampleId: v.id("audioSamples"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sampleId);
  },
});
