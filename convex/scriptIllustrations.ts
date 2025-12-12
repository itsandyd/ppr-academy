"use node";

import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import * as fal from "@fal-ai/client";
import OpenAI from "openai";

// ============================================================================
// SCRIPT-TO-ILLUSTRATION GENERATION
// ============================================================================

/**
 * Main action to generate illustrations from a script
 * Takes long-form text, splits into sentences, generates prompts, creates images,
 * and generates embeddings for semantic search
 */
export const generateScriptIllustrations = action({
  args: {
    userId: v.string(),
    scriptText: v.string(),
    scriptTitle: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    sourceId: v.optional(v.string()),
    storeId: v.optional(v.string()),
    // Generation options
    imageModel: v.optional(v.string()), // Default: "fal-ai/flux/schnell"
    generateEmbeddings: v.optional(v.boolean()), // Default: true
    skipEmptySentences: v.optional(v.boolean()), // Default: true
  },
  returns: v.object({
    success: v.boolean(),
    jobId: v.optional(v.id("scriptIllustrationJobs")),
    totalSentences: v.number(),
    message: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🎨 Starting script illustration generation for user ${args.userId}`);
    
    try {
      // Configure FAL client
      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) {
        throw new Error("FAL_KEY not configured in environment");
      }
      fal.config({ credentials: falApiKey });

      // Split script into sentences
      const sentences = splitIntoSentences(args.scriptText, args.skipEmptySentences ?? true);
      console.log(`📝 Split script into ${sentences.length} sentences`);

      if (sentences.length === 0) {
        return {
          success: false,
          totalSentences: 0,
          error: "No valid sentences found in script",
        };
      }

      // Create a job to track progress
      const jobId = await ctx.runMutation(internal.scriptIllustrations.createJob, {
        userId: args.userId,
        storeId: args.storeId,
        scriptText: args.scriptText,
        scriptTitle: args.scriptTitle,
        sourceType: args.sourceType,
        sourceId: args.sourceId,
        totalSentences: sentences.length,
      });

      console.log(`📋 Created job ${jobId}`);

      // Process each sentence (run in background)
      ctx.scheduler.runAfter(0, internal.scriptIllustrations.processSentences, {
        jobId,
        sentences,
        userId: args.userId,
        storeId: args.storeId,
        scriptId: args.sourceId,
        sourceType: args.sourceType,
        imageModel: args.imageModel ?? "fal-ai/flux/schnell",
        generateEmbeddings: args.generateEmbeddings ?? true,
      });

      return {
        success: true,
        jobId,
        totalSentences: sentences.length,
        message: `Started generation of ${sentences.length} illustrations`,
      };

    } catch (error: any) {
      console.error("❌ Error starting illustration generation:", error);
      return {
        success: false,
        totalSentences: 0,
        error: error.message,
      };
    }
  },
});

/**
 * Internal action to process sentences and generate illustrations
 */
export const processSentences = internalAction({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
    sentences: v.array(v.string()),
    userId: v.string(),
    storeId: v.optional(v.string()),
    scriptId: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    imageModel: v.string(),
    generateEmbeddings: v.boolean(),
  },
  handler: async (ctx, args) => {
    console.log(`🔄 Processing ${args.sentences.length} sentences for job ${args.jobId}`);

    // Update job status to processing
    await ctx.runMutation(internal.scriptIllustrations.updateJobStatus, {
      jobId: args.jobId,
      status: "processing",
    });

    const illustrationIds: Id<"scriptIllustrations">[] = [];
    const errors: string[] = [];
    let processed = 0;

    for (let i = 0; i < args.sentences.length; i++) {
      const sentence = args.sentences[i];
      
      try {
        console.log(`\n📸 [${i + 1}/${args.sentences.length}] Processing: "${sentence.substring(0, 50)}..."`);

        // Generate illustration prompt from sentence
        const prompt = await generateIllustrationPrompt(sentence);
        console.log(`   Prompt: "${prompt.substring(0, 80)}..."`);

        // Create illustration record (pending)
        const illustrationId = await ctx.runMutation(internal.scriptIllustrations.createIllustration, {
          userId: args.userId,
          storeId: args.storeId,
          scriptId: args.scriptId,
          sourceType: args.sourceType,
          sentence,
          sentenceIndex: i,
          illustrationPrompt: prompt,
          generationModel: args.imageModel,
        });

        // Generate image using FAL
        try {
          const imageResult = await generateImageWithFAL(prompt, args.imageModel);
          console.log(`   ✅ Image generated successfully`);

          // Upload to Convex storage
          const storageId = await uploadImageToConvex(ctx, imageResult.url);
          const imageUrl = await ctx.runQuery(internal.scriptIllustrations.getStorageUrl, {
            storageId,
          });

          console.log(`   ☁️ Uploaded to storage: ${storageId}`);

          // Update illustration with image
          await ctx.runMutation(internal.scriptIllustrations.updateIllustrationImage, {
            illustrationId,
            imageUrl,
            storageId,
            status: "completed",
          });

          // Generate embedding if requested
          if (args.generateEmbeddings) {
            try {
              const embedding = await generateImageEmbedding(imageUrl);
              await ctx.runMutation(internal.scriptIllustrations.updateIllustrationEmbedding, {
                illustrationId,
                embedding,
                embeddingModel: "clip-vit-base-patch32",
              });
              console.log(`   🧮 Embedding generated (${embedding.length} dimensions)`);
            } catch (embError: any) {
              console.error(`   ⚠️ Failed to generate embedding: ${embError.message}`);
              errors.push(`Sentence ${i + 1} embedding: ${embError.message}`);
            }
          }

          illustrationIds.push(illustrationId);
          processed++;

        } catch (genError: any) {
          console.error(`   ❌ Image generation failed: ${genError.message}`);
          await ctx.runMutation(internal.scriptIllustrations.updateIllustrationStatus, {
            illustrationId,
            status: "failed",
            error: genError.message,
          });
          errors.push(`Sentence ${i + 1}: ${genError.message}`);
        }

        // Update job progress
        await ctx.runMutation(internal.scriptIllustrations.updateJobProgress, {
          jobId: args.jobId,
          processedSentences: processed,
          illustrationIds,
          errors,
        });

        // Rate limiting - avoid overwhelming FAL API
        if (i < args.sentences.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.error(`   ❌ Error processing sentence ${i + 1}:`, error);
        errors.push(`Sentence ${i + 1}: ${error.message}`);
      }
    }

    // Mark job as complete
    await ctx.runMutation(internal.scriptIllustrations.completeJob, {
      jobId: args.jobId,
      illustrationIds,
      errors,
    });

    console.log(`\n🎉 Job complete! Processed: ${processed}/${args.sentences.length}, Errors: ${errors.length}`);
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Split text into sentences, handling common edge cases
 */
function splitIntoSentences(text: string, skipEmpty: boolean = true): string[] {
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Split on sentence boundaries (., !, ?)
  // Handle common abbreviations like "Dr.", "Mr.", "etc."
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => {
      if (skipEmpty && s.length === 0) return false;
      // Filter out very short fragments (likely abbreviations)
      if (s.length < 10) return false;
      return true;
    });

  return sentences;
}

/**
 * Generate an illustration prompt from a sentence using GPT-4
 */
async function generateIllustrationPrompt(sentence: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an expert at creating visual illustration prompts for AI image generation.
Given a sentence from a script or course, create a clear, detailed prompt for generating an illustration that represents the key concept.

Guidelines:
- Focus on the main concept or action in the sentence
- Use visual, descriptive language
- Keep it concise (1-2 sentences max)
- Make it suitable for AI image generation (FLUX, Stable Diffusion, etc.)
- Avoid abstract concepts that are hard to visualize
- Include style hints (e.g., "professional diagram", "minimalist illustration", "photorealistic")

Example:
Input: "The compressor reduces the dynamic range by attenuating loud sounds above the threshold."
Output: "Professional diagram showing audio waveform being compressed, with visual representation of threshold line and gain reduction, technical illustration style with clean lines and labels"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap for prompt generation
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: sentence }
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0].message.content || sentence;
}

/**
 * Generate image using FAL AI
 */
async function generateImageWithFAL(prompt: string, model: string): Promise<{ url: string; seed?: number }> {
  console.log(`   🎨 Calling FAL API with model: ${model}`);
  
  try {
    const result = await fal.subscribe(model, {
      input: {
        prompt,
        image_size: "landscape_16_9", // Good for course materials
        num_inference_steps: 4, // Fast generation (schnell is optimized for this)
        num_images: 1,
      },
      logs: false,
    });

    const imageData = result.data as any;
    
    if (!imageData?.images?.[0]?.url) {
      throw new Error("No image URL in FAL response");
    }

    return {
      url: imageData.images[0].url,
      seed: imageData.seed,
    };
  } catch (error: any) {
    console.error("FAL API error:", error);
    throw new Error(`FAL generation failed: ${error.message}`);
  }
}

/**
 * Upload image to Convex storage from URL
 */
async function uploadImageToConvex(ctx: any, imageUrl: string): Promise<Id<"_storage">> {
  console.log(`   📥 Downloading image from: ${imageUrl}`);
  
  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  // Get upload URL
  const uploadUrl = await ctx.runMutation(internal.scriptIllustrations.generateUploadUrl, {});

  // Upload to Convex
  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = await uploadResult.json();
  return storageId;
}

/**
 * Generate image embedding using OpenAI's CLIP-based model
 * Note: OpenAI doesn't directly expose image embeddings, so we use text embeddings
 * of a detailed description of the image. For true image embeddings, you'd need
 * to use a dedicated service or run CLIP locally.
 */
async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // For now, we'll generate embeddings from the image's caption/alt text
  // In production, you'd want to use a proper image embedding model
  // or OpenAI's vision API to describe the image first, then embed that description
  
  try {
    // Use GPT-4V to describe the image
    const description = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail for semantic search purposes. Focus on objects, concepts, colors, composition, and mood. Be concise but thorough."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 300,
    });

    const imageDescription = description.choices[0].message.content || "";

    // Generate text embedding from description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: imageDescription,
    });

    return embeddingResponse.data[0].embedding;

  } catch (error: any) {
    console.error("Error generating image embedding:", error);
    throw error;
  }
}

// ============================================================================
// MUTATIONS & QUERIES
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

