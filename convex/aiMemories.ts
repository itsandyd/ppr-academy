import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// MEMORY QUERIES
// ============================================================================

/**
 * Get all memories for a user
 */
export const getUserMemories = query({
  args: {
    userId: v.string(),
    type: v.optional(v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("skill_level"),
      v.literal("context"),
      v.literal("correction")
    )),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("aiMemories"),
    _creationTime: v.number(),
    userId: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
    type: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("skill_level"),
      v.literal("context"),
      v.literal("correction")
    ),
    sourceConversationId: v.optional(v.id("aiConversations")),
    sourceMessageId: v.optional(v.id("aiMessages")),
    importance: v.number(),
    accessCount: v.number(),
    lastAccessedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Use separate query paths to avoid TypeScript issues with query builder reassignment
    let memories;
    if (args.type) {
      memories = await ctx.db
        .query("aiMemories")
        .withIndex("by_userId_type", (q) =>
          q.eq("userId", args.userId).eq("type", args.type!)
        )
        .order("desc")
        .take(1000);
    } else {
      memories = await ctx.db
        .query("aiMemories")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(1000);
    }

    // Filter out archived unless requested
    if (!args.includeArchived) {
      memories = memories.filter(m => !m.archived);
    }

    // Filter out expired memories
    const now = Date.now();
    memories = memories.filter(m => !m.expiresAt || m.expiresAt > now);

    // Sort by importance then recency
    memories.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return b.updatedAt - a.updatedAt;
    });

    // Remove embedding from response (too large)
    return memories.slice(0, limit).map(m => ({
      _id: m._id,
      _creationTime: m._creationTime,
      userId: m.userId,
      content: m.content,
      summary: m.summary,
      type: m.type,
      sourceConversationId: m.sourceConversationId,
      sourceMessageId: m.sourceMessageId,
      importance: m.importance,
      accessCount: m.accessCount,
      lastAccessedAt: m.lastAccessedAt,
      expiresAt: m.expiresAt,
      archived: m.archived,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  },
});

/**
 * Get relevant memories for context injection
 * Returns memories formatted for the AI pipeline
 */
export const getRelevantMemories = query({
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
      .take(1000);

    // Filter active memories
    const now = Date.now();
    const activeMemories = memories.filter(m => 
      !m.archived && (!m.expiresAt || m.expiresAt > now)
    );

    // Return top memories by importance
    return activeMemories.slice(0, limit).map(m => ({
      content: m.content,
      type: m.type,
      importance: m.importance,
    }));
  },
});

// ============================================================================
// MEMORY MUTATIONS
// ============================================================================

/**
 * Create a new memory
 */
export const createMemory = mutation({
  args: {
    userId: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
    type: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("skill_level"),
      v.literal("context"),
      v.literal("correction")
    ),
    sourceConversationId: v.optional(v.id("aiConversations")),
    sourceMessageId: v.optional(v.id("aiMessages")),
    importance: v.optional(v.number()), // 1-10, defaults to 5
    expiresAt: v.optional(v.number()), // Optional expiration
  },
  returns: v.id("aiMemories"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const memoryId = await ctx.db.insert("aiMemories", {
      userId: args.userId,
      content: args.content,
      summary: args.summary || args.content.substring(0, 100),
      type: args.type,
      sourceConversationId: args.sourceConversationId,
      sourceMessageId: args.sourceMessageId,
      importance: args.importance || 5,
      accessCount: 0,
      expiresAt: args.expiresAt,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    return memoryId;
  },
});

/**
 * Update a memory's content or importance
 */
export const updateMemory = mutation({
  args: {
    memoryId: v.id("aiMemories"),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    importance: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    
    if (args.content !== undefined) updates.content = args.content;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.importance !== undefined) updates.importance = args.importance;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;

    await ctx.db.patch(args.memoryId, updates);
    return null;
  },
});

/**
 * Mark a memory as accessed (for recency tracking)
 */
export const markMemoryAccessed = mutation({
  args: {
    memoryId: v.id("aiMemories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (memory) {
      await ctx.db.patch(args.memoryId, {
        accessCount: memory.accessCount + 1,
        lastAccessedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Archive a memory
 */
export const archiveMemory = mutation({
  args: {
    memoryId: v.id("aiMemories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      archived: true,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Delete a memory
 */
export const deleteMemory = mutation({
  args: {
    memoryId: v.id("aiMemories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
    return null;
  },
});

/**
 * Boost memory importance (when user confirms it's useful)
 */
export const boostMemoryImportance = mutation({
  args: {
    memoryId: v.id("aiMemories"),
    boost: v.optional(v.number()), // Default +1
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (memory) {
      const newImportance = Math.min(10, memory.importance + (args.boost || 1));
      await ctx.db.patch(args.memoryId, {
        importance: newImportance,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Clear all memories for a user (with optional type filter)
 */
export const clearMemories = mutation({
  args: {
    userId: v.string(),
    type: v.optional(v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("skill_level"),
      v.literal("context"),
      v.literal("correction")
    )),
  },
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    // Use separate query paths to avoid TypeScript issues with query builder reassignment
    const memories = args.type
      ? await ctx.db
          .query("aiMemories")
          .withIndex("by_userId_type", (q) =>
            q.eq("userId", args.userId).eq("type", args.type!)
          )
          .take(1000)
      : await ctx.db
          .query("aiMemories")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .take(1000);
    
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    return { deleted: memories.length };
  },
});

// ============================================================================
// MEMORY EXTRACTION (for automatic memory creation)
// ============================================================================

// These types represent what the LLM extracts from conversations
const extractedMemoryValidator = v.object({
  content: v.string(),
  type: v.union(
    v.literal("preference"),
    v.literal("fact"),
    v.literal("skill_level"),
    v.literal("context"),
    v.literal("correction")
  ),
  importance: v.number(),
  summary: v.string(),
});

/**
 * Internal mutation to save extracted memories
 */
export const saveExtractedMemories = internalMutation({
  args: {
    userId: v.string(),
    conversationId: v.id("aiConversations"),
    memories: v.array(extractedMemoryValidator),
  },
  returns: v.object({
    created: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;

    for (const memory of args.memories) {
      await ctx.db.insert("aiMemories", {
        userId: args.userId,
        content: memory.content,
        summary: memory.summary,
        type: memory.type,
        sourceConversationId: args.conversationId,
        importance: memory.importance,
        accessCount: 0,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return { created };
  },
});

