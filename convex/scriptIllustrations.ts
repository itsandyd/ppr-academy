"use node";

import { action, internalAction } from "./_generated/server";
// Note: Mutations and queries have been moved to scriptIllustrationMutations.ts
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { createFalClient } from "@fal-ai/client";
import OpenAI from "openai";

// ============================================================================
// SCRIPT-TO-ILLUSTRATION GENERATION
// ============================================================================

/**
 * Main action to generate illustrations from a script
 * Takes long-form text, splits into sentences, generates prompts, creates images,
 * and generates embeddings for semantic search
 */
type GenerateScriptIllustrationsResult = {
  success: boolean;
  jobId?: Id<"scriptIllustrationJobs">;
  totalSentences: number;
  message?: string;
  error?: string;
};

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
  handler: async (ctx, args): Promise<GenerateScriptIllustrationsResult> => {
    console.log(`🎨 Starting script illustration generation for user ${args.userId}`);

    try {
      // Check FAL API key is configured (it's read from FAL_KEY env var automatically)
      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) {
        throw new Error("FAL_KEY not configured in environment");
      }

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
      // @ts-ignore Convex type instantiation too deep
      const jobId: Id<"scriptIllustrationJobs"> = await ctx.runMutation(
        internal.scriptIllustrationMutations.createJob,
        {
          userId: args.userId,
          storeId: args.storeId,
          scriptText: args.scriptText,
          scriptTitle: args.scriptTitle,
          sourceType: args.sourceType,
          sourceId: args.sourceId,
          totalSentences: sentences.length,
        }
      );

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
    await ctx.runMutation(internal.scriptIllustrationMutations.updateJobStatus, {
      jobId: args.jobId,
      status: "processing",
    });

    const illustrationIds: Id<"scriptIllustrations">[] = [];
    const errors: string[] = [];
    let processed = 0;

    for (let i = 0; i < args.sentences.length; i++) {
      const sentence = args.sentences[i];

      try {
        console.log(
          `\n📸 [${i + 1}/${args.sentences.length}] Processing: "${sentence.substring(0, 50)}..."`
        );

        // Generate illustration prompt from sentence
        const prompt = await generateIllustrationPrompt(sentence);
        console.log(`   Prompt: "${prompt.substring(0, 80)}..."`);

        // Create illustration record (pending)
        const illustrationId = await ctx.runMutation(
          internal.scriptIllustrationMutations.createIllustration,
          {
            userId: args.userId,
            storeId: args.storeId,
            scriptId: args.scriptId,
            sourceType: args.sourceType,
            sentence,
            sentenceIndex: i,
            illustrationPrompt: prompt,
            generationModel: args.imageModel,
          }
        );

        // Generate image using FAL
        try {
          const imageResult = await generateImageWithFAL(prompt, args.imageModel);
          console.log(`   ✅ Image generated successfully`);

          // Upload to Convex storage
          const storageId = await uploadImageToConvex(ctx, imageResult.url);
          const imageUrl = await ctx.runQuery(internal.scriptIllustrationMutations.getStorageUrl, {
            storageId,
          });

          if (!imageUrl) {
            throw new Error("Failed to get storage URL for image");
          }

          console.log(`   ☁️ Uploaded to storage: ${storageId}`);

          // Update illustration with image
          await ctx.runMutation(internal.scriptIllustrationMutations.updateIllustrationImage, {
            illustrationId,
            imageUrl,
            storageId,
            status: "completed",
          });

          // Generate embedding if requested
          if (args.generateEmbeddings) {
            try {
              const embedding = await generateImageEmbedding(imageUrl);
              await ctx.runMutation(
                internal.scriptIllustrationMutations.updateIllustrationEmbedding,
                {
                  illustrationId,
                  embedding,
                  embeddingModel: "clip-vit-base-patch32",
                }
              );
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
          await ctx.runMutation(internal.scriptIllustrationMutations.updateIllustrationStatus, {
            illustrationId,
            status: "failed",
            error: genError.message,
          });
          errors.push(`Sentence ${i + 1}: ${genError.message}`);
        }

        // Update job progress
        await ctx.runMutation(internal.scriptIllustrationMutations.updateJobProgress, {
          jobId: args.jobId,
          processedSentences: processed,
          illustrationIds,
          errors,
        });

        // Rate limiting - avoid overwhelming FAL API
        if (i < args.sentences.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing sentence ${i + 1}:`, error);
        errors.push(`Sentence ${i + 1}: ${error.message}`);
      }
    }

    // Mark job as complete
    await ctx.runMutation(internal.scriptIllustrationMutations.completeJob, {
      jobId: args.jobId,
      illustrationIds,
      errors,
    });

    console.log(
      `\n🎉 Job complete! Processed: ${processed}/${args.sentences.length}, Errors: ${errors.length}`
    );
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
  text = text.replace(/\s+/g, " ").trim();

  // Split on sentence boundaries (., !, ?)
  // Handle common abbreviations like "Dr.", "Mr.", "etc."
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => {
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
      { role: "user", content: sentence },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0].message.content || sentence;
}

/**
 * Generate image using FAL AI
 */
async function generateImageWithFAL(
  prompt: string,
  model: string
): Promise<{ url: string; seed?: number }> {
  console.log(`   🎨 Calling FAL API with model: ${model}`);

  try {
    // Create FAL client - it reads FAL_KEY from environment automatically
    const falClient = createFalClient();

    const result = await falClient.run(model, {
      input: {
        prompt,
        image_size: "landscape_16_9", // Good for course materials
        num_inference_steps: 4, // Fast generation (schnell is optimized for this)
        num_images: 1,
      },
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
  const uploadUrl = await ctx.runMutation(
    internal.scriptIllustrationMutations.generateUploadUrl,
    {}
  );

  // Upload to Convex
  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = (await uploadResult.json()) as { storageId: Id<"_storage"> };
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
              text: "Describe this image in detail for semantic search purposes. Focus on objects, concepts, colors, composition, and mood. Be concise but thorough.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
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

// Note: All mutations and queries have been moved to scriptIllustrationMutations.ts
// to allow this file to use "use node";
