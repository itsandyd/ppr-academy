"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// ============================================
// SOCIAL POST EMBEDDINGS
// Transcribe video audio + embed captions for AI context
// ============================================

/**
 * Transcribe video audio using ElevenLabs Scribe API
 * Uses cloudStorageUrl to avoid downloading video
 */
export const transcribeVideoAudio = internalAction({
  args: {
    videoUrl: v.string(),
    postId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    transcript: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.warn("⚠️ ELEVENLABS_API_KEY not configured, skipping transcription");
        return { success: false, error: "ElevenLabs API key not configured" };
      }

      const elevenlabs = new ElevenLabsClient({ apiKey });

      // Use cloudStorageUrl to transcribe directly from Instagram CDN
      const response = await elevenlabs.speechToText.convert({
        modelId: "scribe_v1",
        cloudStorageUrl: args.videoUrl,
        languageCode: "en", // Default to English, can be made dynamic
        tagAudioEvents: false, // Don't need (laughter) etc for social posts
      });

      // Extract the transcript text
      // Response can be SpeechToTextChunkResponseModel, MultichannelSpeechToTextResponseModel, or WebhookResponseModel
      let transcript = "";
      if ("text" in response && typeof response.text === "string") {
        // Single channel response (SpeechToTextChunkResponseModel)
        transcript = response.text;
      } else if ("transcripts" in response && Array.isArray(response.transcripts)) {
        // Multichannel response - combine all transcripts
        transcript = response.transcripts
          .map((t: any) => t.text || "")
          .filter((t: string) => t.trim())
          .join(" ");
      }

      if (!transcript || transcript.trim().length === 0) {
        return { success: true, transcript: "" };
      }

      return { success: true, transcript };
    } catch (error: any) {
      console.error(`❌ Transcription failed for post ${args.postId}:`, error);

      // Handle specific ElevenLabs errors
      if (error.message?.includes("invalid_api_key")) {
        return { success: false, error: "Invalid ElevenLabs API key" };
      }
      if (error.message?.includes("quota")) {
        return { success: false, error: "ElevenLabs quota exceeded" };
      }

      return {
        success: false,
        error: error.message || "Failed to transcribe video",
      };
    }
  },
});

/**
 * Process a social post and create embeddings
 * Combines caption + video transcription (if available)
 */
export const processSocialPostEmbedding = internalAction({
  args: {
    postId: v.string(),
    caption: v.optional(v.string()),
    mediaUrl: v.string(),
    mediaType: v.union(
      v.literal("IMAGE"),
      v.literal("VIDEO"),
      v.literal("CAROUSEL_ALBUM"),
      v.literal("GLOBAL")
    ),
    automationId: v.id("automations"),
    userId: v.string(), // Clerk ID
    permalink: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    embeddingId: v.optional(v.id("embeddings")),
    error: v.optional(v.string()),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    try {
      // Skip GLOBAL marker posts (they're not real content)
      if (args.mediaType === "GLOBAL" || args.postId === "ALL_POSTS_AND_FUTURE") {
        return { success: true };
      }

      let transcript = "";

      // Transcribe video posts
      if (args.mediaType === "VIDEO" && args.mediaUrl) {
        const transcriptionResult = await ctx.runAction(
          internal.socialPostEmbeddings.transcribeVideoAudio,
          {
            videoUrl: args.mediaUrl,
            postId: args.postId,
          }
        );

        if (transcriptionResult.success && transcriptionResult.transcript) {
          transcript = transcriptionResult.transcript;
        } else if (transcriptionResult.error) {
          console.warn(`⚠️ Transcription failed: ${transcriptionResult.error}`);
        }
      }

      // Build combined content for embedding
      const contentParts: string[] = [];

      if (args.caption && args.caption.trim()) {
        // Clean caption - remove excessive hashtags for cleaner embeddings
        const cleanCaption = cleanInstagramCaption(args.caption);
        if (cleanCaption) {
          contentParts.push(`Caption: ${cleanCaption}`);
        }
      }

      if (transcript && transcript.trim()) {
        contentParts.push(`Transcript: ${transcript}`);
      }

      // Skip if no meaningful content
      if (contentParts.length === 0) {
        return { success: true };
      }

      const combinedContent = contentParts.join("\n\n");

      // Generate a descriptive title
      const title = generatePostTitle(args.caption, args.mediaType);

      // Create the embedding record and schedule generation
      const embeddingId = await ctx.runMutation(
        internal.socialPostEmbeddingsMutations.createSocialPostEmbedding,
        {
          content: combinedContent,
          userId: args.userId,
          title,
          postId: args.postId,
          automationId: args.automationId,
          mediaType: args.mediaType,
          permalink: args.permalink,
          hasTranscript: transcript.length > 0,
        }
      );

      // Schedule embedding vector generation
      await ctx.scheduler.runAfter(0, internal.rag.generateEmbedding, {
        embeddingId,
        content: combinedContent,
      });

      return { success: true, embeddingId };
    } catch (error: any) {
      console.error(`❌ Failed to process post ${args.postId}:`, error);
      return {
        success: false,
        error: error.message || "Failed to process social post",
      };
    }
  },
});

// Note: createSocialPostEmbedding has been moved to socialPostEmbeddingsMutations.ts
// because mutations cannot be defined in Node.js files (with "use node")

/**
 * Batch process all posts for an automation
 * Called when posts are saved to an automation
 */
export const processAutomationPosts = internalAction({
  args: {
    automationId: v.id("automations"),
    userId: v.string(),
  },
  returns: v.object({
    processed: v.number(),
    failed: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all posts for this automation
    const posts = await ctx.runQuery(internal.socialPostEmbeddingsMutations.getPostsForAutomation, {
      automationId: args.automationId,
    });

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const post of posts) {
      // Skip GLOBAL marker
      if (post.postId === "ALL_POSTS_AND_FUTURE" || post.mediaType === "GLOBAL") {
        skipped++;
        continue;
      }

      try {
        const result = await ctx.runAction(
          internal.socialPostEmbeddings.processSocialPostEmbedding,
          {
            postId: post.postId,
            caption: post.caption,
            mediaUrl: post.media,
            mediaType: post.mediaType,
            automationId: args.automationId,
            userId: args.userId,
            permalink: post.permalink,
          }
        );

        if (result.success) {
          processed++;
        } else {
          failed++;
          console.error(`Failed to process post ${post.postId}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        console.error(`Error processing post ${post.postId}:`, error);
      }
    }

    return { processed, failed, skipped };
  },
});

// Note: getPostsForAutomation has been moved to socialPostEmbeddingsMutations.ts
// because queries cannot be defined in Node.js files (with "use node")

// Note: getSocialPostEmbeddings has been moved to socialPostEmbeddingsMutations.ts
// because queries cannot be defined in Node.js files (with "use node")

/**
 * Search social posts by semantic similarity
 * Returns the most relevant posts for a given query
 */
export const searchSocialPostContext = internalAction({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  returns: v.object({
    context: v.string(),
    matchCount: v.number(),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    try {
      const limit = args.limit || 3;
      const threshold = args.threshold || 0.5;

      // Get user's social post embeddings
      const embeddings = await ctx.runQuery(
        internal.socialPostEmbeddingsMutations.getSocialPostEmbeddings,
        { userId: args.userId, limit: 100 }
      );

      if (embeddings.length === 0) {
        return { context: "", matchCount: 0 };
      }

      // Generate embedding for the query
      const queryEmbedding = await generateQueryEmbedding(args.query);

      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.warn("⚠️ Failed to generate query embedding");
        return { context: "", matchCount: 0 };
      }

      // Calculate similarity scores
      const withSimilarity = embeddings
        .filter((e: any) => e.embedding && e.embedding.length > 0)
        .map((embedding: any) => ({
          ...embedding,
          similarity: cosineSimilarity(queryEmbedding, embedding.embedding),
        }))
        .filter((e: any) => e.similarity >= threshold)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit);

      if (withSimilarity.length === 0) {
        return { context: "", matchCount: 0 };
      }

      // Build context string from top matches
      const contextParts = withSimilarity.map((item: any, index: number) => {
        const title = item.title || `Post ${index + 1}`;
        return `[${title}]\n${item.content}`;
      });

      return {
        context: contextParts.join("\n\n---\n\n"),
        matchCount: withSimilarity.length,
      };
    } catch (error) {
      console.error("❌ Error searching social post context:", error);
      return { context: "", matchCount: 0 };
    }
  },
});

// Note: deleteSocialPostEmbedding has been moved to socialPostEmbeddingsMutations.ts
// because mutations cannot be defined in Node.js files (with "use node")

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Clean Instagram caption - remove excessive hashtags while keeping meaningful content
 */
function cleanInstagramCaption(caption: string): string {
  // Split into lines
  const lines = caption.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip lines that are mostly hashtags (>50% hashtags)
    const words = trimmed.split(/\s+/);
    const hashtagCount = words.filter((w) => w.startsWith("#")).length;

    if (words.length > 0 && hashtagCount / words.length <= 0.5) {
      // Remove hashtags from the line but keep the rest
      const cleanLine = trimmed
        .split(/\s+/)
        .filter((w) => !w.startsWith("#"))
        .join(" ")
        .trim();

      if (cleanLine) {
        cleanLines.push(cleanLine);
      }
    }
  }

  return cleanLines.join(" ").trim();
}

/**
 * Generate a descriptive title for the post
 */
function generatePostTitle(caption: string | undefined, mediaType: string): string {
  const typeLabel =
    mediaType === "VIDEO" ? "Reel" : mediaType === "CAROUSEL_ALBUM" ? "Carousel" : "Post";

  if (!caption) {
    return `Instagram ${typeLabel}`;
  }

  // Extract first meaningful sentence/phrase
  const cleaned = cleanInstagramCaption(caption);
  if (!cleaned) {
    return `Instagram ${typeLabel}`;
  }

  // Truncate to ~50 chars for title
  const truncated = cleaned.length > 50 ? cleaned.substring(0, 47) + "..." : cleaned;

  return `${typeLabel}: ${truncated}`;
}

// ============================================
// EMBEDDING HELPER FUNCTIONS
// ============================================

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a query using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OpenAI API key not found, using placeholder embedding");
      return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return (data as any)?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error("Error generating query embedding:", error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
