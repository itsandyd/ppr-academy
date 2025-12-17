import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract topic from a prompt like "Create me a course on X"
 */
function extractTopicFromPrompt(prompt: string): string {
  const patterns = [
    /create (?:me )?a course (?:on|about) (.+)/i,
    /course (?:on|about) (.+)/i,
    /teach (?:me )?(?:about )?(.+)/i,
    /learn (?:about )?(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback: use the whole prompt as topic
  return prompt.length > 100 ? prompt.substring(0, 100) + "..." : prompt;
}

// =============================================================================
// PUBLIC MUTATIONS
// =============================================================================

/**
 * Add a course creation request to the queue
 */
export const addToQueue = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    prompt: v.string(),
    skillLevel: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    targetModules: v.optional(v.number()),
    targetLessonsPerModule: v.optional(v.number()),
    priority: v.optional(v.number()),
  },
  returns: v.id("aiCourseQueue"),
  handler: async (ctx, args) => {
    // Extract topic from prompt (basic extraction)
    const topic = extractTopicFromPrompt(args.prompt);
    
    const queueId = await ctx.db.insert("aiCourseQueue", {
      userId: args.userId,
      storeId: args.storeId,
      prompt: args.prompt,
      topic,
      skillLevel: args.skillLevel || "intermediate",
      targetModules: args.targetModules || 4,
      targetLessonsPerModule: args.targetLessonsPerModule || 3,
      status: "queued",
      createdAt: Date.now(),
      priority: args.priority || 0,
    });
    
    return queueId;
  },
});

/**
 * Add multiple course requests to the queue at once
 */
export const addBatchToQueue = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    prompts: v.array(v.object({
      prompt: v.string(),
      skillLevel: v.optional(v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )),
      targetModules: v.optional(v.number()),
      targetLessonsPerModule: v.optional(v.number()),
    })),
  },
  returns: v.array(v.id("aiCourseQueue")),
  handler: async (ctx, args) => {
    const queueIds: Id<"aiCourseQueue">[] = [];
    
    for (let i = 0; i < args.prompts.length; i++) {
      const item = args.prompts[i];
      const topic = extractTopicFromPrompt(item.prompt);
      
      const queueId = await ctx.db.insert("aiCourseQueue", {
        userId: args.userId,
        storeId: args.storeId,
        prompt: item.prompt,
        topic,
        skillLevel: item.skillLevel || "intermediate",
        targetModules: item.targetModules || 4,
        targetLessonsPerModule: item.targetLessonsPerModule || 3,
        status: "queued",
        createdAt: Date.now(),
        priority: args.prompts.length - i, // Earlier items get higher priority
      });
      
      queueIds.push(queueId);
    }
    
    return queueIds;
  },
});

// =============================================================================
// PUBLIC QUERIES
// =============================================================================

/**
 * Get all queue items for a user
 */
export const getQueueItems = query({
  args: {
    userId: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("aiCourseQueue")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    // Filter by status if provided
    if (args.status) {
      return items.filter(item => item.status === args.status);
    }
    
    return items;
  },
});

/**
 * Get a specific queue item with its outline
 */
export const getQueueItemWithOutline = query({
  args: {
    queueId: v.id("aiCourseQueue"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const queueItem = await ctx.db.get(args.queueId);
    if (!queueItem) return null;
    
    let outline = null;
    if (queueItem.outlineId) {
      outline = await ctx.db.get(queueItem.outlineId);
    }
    
    let course = null;
    if (queueItem.courseId) {
      course = await ctx.db.get(queueItem.courseId);
    }
    
    return {
      ...queueItem,
      outline,
      course,
    };
  },
});

/**
 * Get an outline by ID
 */
export const getOutline = query({
  args: {
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.outlineId);
  },
});

/**
 * Export outline as JSON
 */
export const exportOutlineAsJson = query({
  args: {
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const outline = await ctx.db.get(args.outlineId);
    if (!outline) return null;
    
    return {
      id: outline._id,
      title: outline.title,
      description: outline.description,
      topic: outline.topic,
      skillLevel: outline.skillLevel,
      estimatedDuration: outline.estimatedDuration,
      totalChapters: outline.totalChapters,
      expandedChapters: outline.expandedChapters,
      outline: outline.outline,
      chapterStatus: outline.chapterStatus,
      generatedAt: new Date(outline.createdAt).toISOString(),
    };
  },
});

// =============================================================================
// PUBLIC MUTATIONS
// =============================================================================

/**
 * Delete a queue item
 */
export const deleteQueueItem = mutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const queueItem = await ctx.db.get(args.queueId);
    if (!queueItem || queueItem.userId !== args.userId) {
      return false;
    }
    
    // Delete associated outline if exists
    if (queueItem.outlineId) {
      await ctx.db.delete(queueItem.outlineId);
    }
    
    await ctx.db.delete(args.queueId);
    return true;
  },
});

/**
 * Update queue item status
 */
export const updateQueueStatus = mutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    status: v.union(
      v.literal("queued"),
      v.literal("generating_outline"),
      v.literal("outline_ready"),
      v.literal("expanding_content"),
      v.literal("ready_to_create"),
      v.literal("creating_course"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    progress: v.optional(v.object({
      currentStep: v.string(),
      totalSteps: v.number(),
      completedSteps: v.number(),
      currentChapter: v.optional(v.string()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    
    if (args.error) updates.error = args.error;
    if (args.progress) updates.progress = args.progress;
    
    if (args.status === "generating_outline" && !updates.startedAt) {
      updates.startedAt = Date.now();
    }
    
    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }
    
    await ctx.db.patch(args.queueId, updates);
    return null;
  },
});

/**
 * Update an outline
 */
export const updateOutline = mutation({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    outline: v.optional(v.any()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.outline) updates.outline = args.outline;
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    updates.isEdited = true;
    
    await ctx.db.patch(args.outlineId, updates);
    return null;
  },
});

// =============================================================================
// INTERNAL QUERIES
// =============================================================================

export const getQueueItemInternal = internalQuery({
  args: {
    queueId: v.id("aiCourseQueue"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.queueId);
  },
});

export const getNextQueuedItem = internalQuery({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query("aiCourseQueue")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .take(10);
    
    // Filter by userId if provided
    const filtered = args.userId 
      ? items.filter(item => item.userId === args.userId)
      : items;
    
    // Sort by priority (descending) then by createdAt (ascending)
    filtered.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
    
    return filtered[0] || null;
  },
});

export const getOutlineInternal = internalQuery({
  args: {
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.outlineId);
  },
});

// =============================================================================
// INTERNAL MUTATIONS
// =============================================================================

export const saveOutline = internalMutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    userId: v.string(),
    storeId: v.string(),
    title: v.string(),
    description: v.string(),
    topic: v.string(),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedDuration: v.optional(v.number()),
    outline: v.any(),
    totalChapters: v.number(),
    chapterStatus: v.array(v.object({
      moduleIndex: v.number(),
      lessonIndex: v.number(),
      chapterIndex: v.number(),
      title: v.string(),
      hasDetailedContent: v.boolean(),
      wordCount: v.optional(v.number()),
    })),
    generationModel: v.optional(v.string()),
    generationTimeMs: v.optional(v.number()),
  },
  returns: v.id("aiCourseOutlines"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiCourseOutlines", {
      queueId: args.queueId,
      userId: args.userId,
      storeId: args.storeId,
      title: args.title,
      description: args.description,
      topic: args.topic,
      skillLevel: args.skillLevel,
      estimatedDuration: args.estimatedDuration,
      outline: args.outline,
      totalChapters: args.totalChapters,
      expandedChapters: 0,
      chapterStatus: args.chapterStatus,
      generationModel: args.generationModel,
      generationTimeMs: args.generationTimeMs,
      isEdited: false,
      createdAt: Date.now(),
    });
  },
});

export const linkOutlineToQueue = internalMutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, {
      outlineId: args.outlineId,
      status: "outline_ready",
    });
    return null;
  },
});

export const linkCourseToQueue = internalMutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, {
      courseId: args.courseId,
    });
    return null;
  },
});

export const updateOutlineContent = internalMutation({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    outline: v.any(),
    chapterStatus: v.array(v.object({
      moduleIndex: v.number(),
      lessonIndex: v.number(),
      chapterIndex: v.number(),
      title: v.string(),
      hasDetailedContent: v.boolean(),
      wordCount: v.optional(v.number()),
    })),
    expandedChapters: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outlineId, {
      outline: args.outline,
      chapterStatus: args.chapterStatus,
      expandedChapters: args.expandedChapters,
    });
    return null;
  },
});

