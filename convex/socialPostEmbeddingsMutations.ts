import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// DATABASE OPERATIONS FOR SOCIAL POST EMBEDDINGS
// These must be in a separate file without "use node"
// because mutations/queries cannot run in Node.js
// ============================================

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

