"use node";

import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
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

      console.log(`🎙️ Transcribing video for post: ${args.postId}`);
      
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
      if ('text' in response && typeof response.text === 'string') {
        // Single channel response (SpeechToTextChunkResponseModel)
        transcript = response.text;
      } else if ('transcripts' in response && Array.isArray(response.transcripts)) {
        // Multichannel response - combine all transcripts
        transcript = response.transcripts
          .map((t: any) => t.text || "")
          .filter((t: string) => t.trim())
          .join(" ");
      }
      
      if (!transcript || transcript.trim().length === 0) {
        console.log(`📝 No speech detected in video: ${args.postId}`);
        return { success: true, transcript: "" };
      }

      console.log(`✅ Transcribed ${transcript.length} characters for post: ${args.postId}`);
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
        error: error.message || "Failed to transcribe video" 
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
  handler: async (ctx, args) => {
    try {
      // Skip GLOBAL marker posts (they're not real content)
      if (args.mediaType === "GLOBAL" || args.postId === "ALL_POSTS_AND_FUTURE") {
        console.log("⏭️ Skipping GLOBAL marker post");
        return { success: true };
      }

      let transcript = "";
      
      // Transcribe video posts
      if (args.mediaType === "VIDEO" && args.mediaUrl) {
        console.log(`🎬 Processing video post: ${args.postId}`);
        
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
        console.log(`⏭️ No meaningful content for post: ${args.postId}`);
        return { success: true };
      }

      const combinedContent = contentParts.join("\n\n");
      
      // Generate a descriptive title
      const title = generatePostTitle(args.caption, args.mediaType);

      console.log(`📊 Creating embedding for post ${args.postId} (${combinedContent.length} chars)`);

      // Create the embedding record and schedule generation
      const embeddingId = await ctx.runMutation(internal.socialPostEmbeddings.createSocialPostEmbedding, {
        content: combinedContent,
        userId: args.userId,
        title,
        postId: args.postId,
        automationId: args.automationId,
        mediaType: args.mediaType,
        permalink: args.permalink,
        hasTranscript: transcript.length > 0,
      });

      // Schedule embedding vector generation
      await ctx.scheduler.runAfter(0, internal.rag.generateEmbedding, {
        embeddingId,
        content: combinedContent,
      });

      console.log(`✅ Embedding created for post: ${args.postId}`);
      return { success: true, embeddingId };

    } catch (error: any) {
      console.error(`❌ Failed to process post ${args.postId}:`, error);
      return { 
        success: false, 
        error: error.message || "Failed to process social post" 
      };
    }
  },
});

/**
 * Create embedding record for social post
 */
export const createSocialPostEmbedding = internalMutation({
  args: {
    content: v.string(),
    userId: v.string(),
    title: v.string(),
    postId: v.string(),
    automationId: v.id("automations"),
    mediaType: v.string(),
    permalink: v.optional(v.string()),
    hasTranscript: v.boolean(),
  },
  returns: v.id("embeddings"),
  handler: async (ctx, args) => {
    // Check if embedding already exists for this post
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.postId))
      .first();

    if (existing) {
      // Update existing embedding
      await ctx.db.patch(existing._id, {
        content: args.content,
        title: args.title,
        embedding: [], // Will be regenerated
        metadata: {
          postId: args.postId,
          automationId: args.automationId,
          mediaType: args.mediaType,
          permalink: args.permalink,
          hasTranscript: args.hasTranscript,
          updatedAt: Date.now(),
        },
      });
      console.log(`📝 Updated existing embedding for post: ${args.postId}`);
      return existing._id;
    }

    // Create new embedding
    const embeddingId = await ctx.db.insert("embeddings", {
      content: args.content,
      embedding: [], // Will be populated by generateEmbedding action
      userId: args.userId,
      title: args.title,
      category: "social",
      sourceType: "socialPost",
      sourceId: args.postId,
      metadata: {
        postId: args.postId,
        automationId: args.automationId,
        mediaType: args.mediaType,
        permalink: args.permalink,
        hasTranscript: args.hasTranscript,
        createdAt: Date.now(),
      },
    });

    return embeddingId;
  },
});

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
    const posts = await ctx.runQuery(internal.socialPostEmbeddings.getPostsForAutomation, {
      automationId: args.automationId,
    });

    console.log(`📦 Processing ${posts.length} posts for automation ${args.automationId}`);

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

    console.log(`✅ Processed: ${processed}, Failed: ${failed}, Skipped: ${skipped}`);
    return { processed, failed, skipped };
  },
});

/**
 * Get posts for an automation (internal query)
 */
export const getPostsForAutomation = internalQuery({
  args: {
    automationId: v.id("automations"),
  },
  returns: v.array(v.object({
    _id: v.id("posts"),
    postId: v.string(),
    caption: v.optional(v.string()),
    media: v.string(),
    mediaType: v.union(
      v.literal("IMAGE"),
      v.literal("VIDEO"),
      v.literal("CAROUSEL_ALBUM"),
      v.literal("GLOBAL")
    ),
    permalink: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
      .collect();
  },
});

/**
 * Get social post embeddings for a user (for Smart AI context)
 */
export const getSocialPostEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("embeddings"),
    content: v.string(),
    title: v.optional(v.string()),
    embedding: v.array(v.number()),
    sourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("embeddings")
      .withIndex("by_user_sourceType", (q) => 
        q.eq("userId", args.userId).eq("sourceType", "socialPost")
      )
      .take(limit);
  },
});

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
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 3;
      const threshold = args.threshold || 0.5;

      // Get user's social post embeddings
      const embeddings = await ctx.runQuery(
        internal.socialPostEmbeddings.getSocialPostEmbeddings,
        { userId: args.userId, limit: 100 }
      );

      if (embeddings.length === 0) {
        console.log("📭 No social post embeddings found for user");
        return { context: "", matchCount: 0 };
      }

      console.log(`🔍 Searching ${embeddings.length} social post embeddings for: "${args.query.substring(0, 50)}..."`);

      // Generate embedding for the query
      const queryEmbedding = await generateQueryEmbedding(args.query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.warn("⚠️ Failed to generate query embedding");
        return { context: "", matchCount: 0 };
      }

      // Calculate similarity scores
      const withSimilarity = embeddings
        .filter(e => e.embedding && e.embedding.length > 0)
        .map(embedding => ({
          ...embedding,
          similarity: cosineSimilarity(queryEmbedding, embedding.embedding),
        }))
        .filter(e => e.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      if (withSimilarity.length === 0) {
        console.log("📭 No relevant social post context found above threshold");
        return { context: "", matchCount: 0 };
      }

      console.log(`✅ Found ${withSimilarity.length} relevant posts (top similarity: ${withSimilarity[0].similarity.toFixed(3)})`);

      // Build context string from top matches
      const contextParts = withSimilarity.map((item, index) => {
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

/**
 * Delete embeddings when posts are removed from automation
 */
export const deleteSocialPostEmbedding = internalMutation({
  args: {
    postId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.postId))
      .first();

    if (embedding) {
      await ctx.db.delete(embedding._id);
      console.log(`🗑️ Deleted embedding for post: ${args.postId}`);
    }

    return null;
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Clean Instagram caption - remove excessive hashtags while keeping meaningful content
 */
function cleanInstagramCaption(caption: string): string {
  // Split into lines
  const lines = caption.split('\n');
  const cleanLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip lines that are mostly hashtags (>50% hashtags)
    const words = trimmed.split(/\s+/);
    const hashtagCount = words.filter(w => w.startsWith('#')).length;
    
    if (words.length > 0 && hashtagCount / words.length <= 0.5) {
      // Remove hashtags from the line but keep the rest
      const cleanLine = trimmed
        .split(/\s+/)
        .filter(w => !w.startsWith('#'))
        .join(' ')
        .trim();
      
      if (cleanLine) {
        cleanLines.push(cleanLine);
      }
    }
  }
  
  return cleanLines.join(' ').trim();
}

/**
 * Generate a descriptive title for the post
 */
function generatePostTitle(caption: string | undefined, mediaType: string): string {
  const typeLabel = mediaType === "VIDEO" ? "Reel" : 
                    mediaType === "CAROUSEL_ALBUM" ? "Carousel" : "Post";
  
  if (!caption) {
    return `Instagram ${typeLabel}`;
  }
  
  // Extract first meaningful sentence/phrase
  const cleaned = cleanInstagramCaption(caption);
  if (!cleaned) {
    return `Instagram ${typeLabel}`;
  }
  
  // Truncate to ~50 chars for title
  const truncated = cleaned.length > 50 
    ? cleaned.substring(0, 47) + "..." 
    : cleaned;
    
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

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return (data as any)?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('Error generating query embedding:', error);
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

