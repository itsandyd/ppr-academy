import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// ============================================================================
// WEB RESEARCH MUTATIONS (non-Node.js)
// ============================================================================

/**
 * Internal mutation to create a web research embedding
 * Deduplicates by URL - won't create if the same URL already exists
 */
export const createWebEmbedding = internalMutation({
  args: {
    userId: v.string(),
    content: v.string(),
    title: v.string(),
    url: v.string(),
    category: v.string(),
    facetName: v.string(),
    sourceConversationId: v.optional(v.id("aiConversations")),
  },
  returns: v.union(v.id("embeddings"), v.null()),
  handler: async (ctx, args) => {
    // Check if this URL already exists in embeddings (deduplication)
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.url))
      .first();

    if (existing) {
      console.log(`⏭️ Skipping duplicate web research: ${args.url}`);
      return null; // Already indexed
    }

    // Create the embedding document (embedding vector will be generated separately)
    const embeddingId = await ctx.db.insert("embeddings", {
      userId: args.userId,
      content: args.content,
      title: args.title,
      category: args.category,
      sourceType: "document", // Use document for web research
      sourceId: args.url,
      metadata: {
        type: "web_research",
        url: args.url,
        facetName: args.facetName,
        sourceConversationId: args.sourceConversationId,
        addedAt: Date.now(),
      },
      embedding: [], // Will be populated by the embedding generation
    });

    console.log(`✅ Indexed new web research: ${args.title}`);

    // Schedule embedding generation
    await ctx.scheduler.runAfter(0, internal.rag.generateEmbedding, {
      embeddingId,
      content: args.content,
    });

    return embeddingId;
  },
});

