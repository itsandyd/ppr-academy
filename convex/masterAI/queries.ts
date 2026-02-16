import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// RETRIEVER QUERIES (non-Node.js)
// ============================================================================

/**
 * Internal query to get ALL embeddings (optionally filtered by source types/categories)
 * NOTE: No userId filtering - this searches the ENTIRE knowledge base
 */
export const getFilteredEmbeddings = internalQuery({
  args: {
    sourceTypes: v.optional(v.array(v.union(
      v.literal("course"),
      v.literal("chapter"),
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom"),
      v.literal("socialPost")
    ))),
    categories: v.optional(v.array(v.string())),
    limit: v.optional(v.number()), // Optional limit for performance
  },
  returns: v.array(v.object({
    _id: v.id("embeddings"),
    content: v.string(),
    title: v.optional(v.string()),
    embedding: v.array(v.number()),
    userId: v.string(),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"),
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom"),
      v.literal("socialPost")
    )),
    sourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    // Use take() with a limit to avoid 16MB read limit
    // Each embedding with 1536 floats is ~6KB, so 100 embeddings = ~600KB (safe)
    const maxToFetch = args.limit || 100;
    
    const embeddings = await ctx.db
      .query("embeddings")
      .take(maxToFetch);
    
    // Filter results
    let filtered = embeddings.filter(e => 
      e.embedding && Array.isArray(e.embedding) && e.embedding.length > 0
    );
    
    // Apply sourceType filter if provided
    if (args.sourceTypes && args.sourceTypes.length > 0) {
      filtered = filtered.filter(e => 
        e.sourceType && args.sourceTypes!.includes(e.sourceType)
      );
    }
    
    // Apply category filter if provided
    if (args.categories && args.categories.length > 0) {
      filtered = filtered.filter(e => 
        e.category && args.categories!.includes(e.category)
      );
    }

    // Map to exclude _creationTime (Convex adds it automatically but validator doesn't include it)
    return filtered.map(e => ({
      _id: e._id,
      content: e.content,
      title: e.title,
      embedding: e.embedding,
      userId: e.userId,
      category: e.category,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      metadata: e.metadata,
    }));
  },
});

// ============================================================================
// USER MEMORY QUERIES (for memory manager)
// ============================================================================

/**
 * Get user memories for the pipeline (internal query to avoid circular refs)
 */
export const getUserMemoriesInternal = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    content: v.string(),
    type: v.string(),
    importance: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const memories = await ctx.db
      .query("aiMemories")
      .withIndex("by_userId_importance", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(500);

    // Filter active memories (not archived, not expired)
    const now = Date.now();
    const activeMemories = memories.filter(m => 
      !m.archived && (!m.expiresAt || m.expiresAt > now)
    );

    return activeMemories.slice(0, limit).map(m => ({
      content: m.content,
      type: m.type,
      importance: m.importance,
    }));
  },
});

// ============================================================================
// EMBEDDING STATS
// ============================================================================

/**
 * Get embedding stats for debugging
 */
export const getEmbeddingStats = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    bySourceType: v.record(v.string(), v.number()),
    byCategory: v.record(v.string(), v.number()),
    sample: v.optional(v.object({
      title: v.optional(v.string()),
      content: v.string(),
      sourceType: v.optional(v.string()),
    })),
  }),
  handler: async (ctx) => {
    const embeddings = await ctx.db.query("embeddings").take(500);
    
    const bySourceType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    for (const e of embeddings) {
      const st = e.sourceType || "unknown";
      bySourceType[st] = (bySourceType[st] || 0) + 1;
      
      const cat = e.category || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    
    return {
      total: embeddings.length,
      bySourceType,
      byCategory,
      sample: embeddings.length > 0 ? {
        title: embeddings[0].title,
        content: embeddings[0].content.substring(0, 200),
        sourceType: embeddings[0].sourceType,
      } : undefined,
    };
  },
});
