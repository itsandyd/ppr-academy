import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// ============================================================================
// MESSAGE PERSISTENCE (for auto-saving AI responses)
// ============================================================================

/**
 * Internal mutation to save an AI response to the conversation
 * Called from actions to persist responses even if client disconnects
 */
export const saveAssistantMessage = internalMutation({
  args: {
    conversationId: v.string(), // Passed as string from action, cast to ID internally
    userId: v.string(),
    content: v.string(),
    citations: v.optional(v.array(v.object({
      id: v.number(),
      title: v.string(),
      sourceType: v.string(),
      sourceId: v.optional(v.string()),
    }))),
    facetsUsed: v.optional(v.array(v.string())),
    pipelineMetadata: v.optional(v.object({
      processingTimeMs: v.number(),
      totalChunksProcessed: v.number(),
      plannerModel: v.optional(v.string()),
      summarizerModel: v.optional(v.string()),
      finalWriterModel: v.optional(v.string()),
    })),
  },
  returns: v.union(v.id("aiMessages"), v.null()), // Can return null if duplicate
  handler: async (ctx, args) => {
    const now = Date.now();
    const conversationId = args.conversationId as any; // Cast string to ID
    
    // DEDUPLICATION: Check if this message was already saved
    // This prevents duplicates when both backend auto-save and frontend save occur
    const recentMessages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversationId_createdAt", (q) => 
        q.eq("conversationId", conversationId)
      )
      .order("desc")
      .take(3);
    
    const oneMinuteAgo = now - 60000;
    for (const msg of recentMessages) {
      if (
        msg.role === "assistant" &&
        msg.createdAt > oneMinuteAgo &&
        msg.content.substring(0, 200) === args.content.substring(0, 200)
      ) {
        console.log(`⏭️ Skipping duplicate assistant message (already saved)`);
        return msg._id;
      }
    }
    
    // Save the message
    const messageId = await ctx.db.insert("aiMessages", {
      conversationId,
      userId: args.userId,
      role: "assistant",
      content: args.content,
      citations: args.citations,
      facetsUsed: args.facetsUsed,
      pipelineMetadata: args.pipelineMetadata,
      createdAt: now,
    });

    // Update conversation metadata
    const conversation = await ctx.db.get(conversationId);
    if (conversation) {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        messageCount: conversation.messageCount + 1,
        updatedAt: now,
      });
    }

    console.log(`💾 Auto-saved AI response to conversation ${conversationId}`);
    return messageId;
  },
});

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

