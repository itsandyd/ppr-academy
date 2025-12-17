import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

// =============================================================================
// TYPES
// =============================================================================

interface CourseOutlineModule {
  title: string;
  description: string;
  orderIndex: number;
  lessons: CourseOutlineLesson[];
}

interface CourseOutlineLesson {
  title: string;
  description: string;
  orderIndex: number;
  chapters: CourseOutlineChapter[];
}

interface CourseOutlineChapter {
  title: string;
  content: string; // Brief outline or full content
  duration: number;
  orderIndex: number;
  hasDetailedContent?: boolean;
  wordCount?: number;
}

interface CourseOutline {
  course: {
    title: string;
    description: string;
    category: string;
    skillLevel: "beginner" | "intermediate" | "advanced";
    estimatedDuration: number;
  };
  modules: CourseOutlineModule[];
}

// =============================================================================
// QUEUE MANAGEMENT - PUBLIC MUTATIONS
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
    let query = ctx.db
      .query("aiCourseQueue")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    const items = await query.take(args.limit || 50);
    
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

// =============================================================================
// OUTLINE GENERATION
// =============================================================================

/**
 * Generate a course outline for a queue item (action)
 */
export const generateOutline = action({
  args: {
    queueId: v.id("aiCourseQueue"),
  },
  returns: v.object({
    success: v.boolean(),
    outlineId: v.optional(v.id("aiCourseOutlines")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get queue item
    const queueItem = await ctx.runQuery(internal.aiCourseBuilder.getQueueItemInternal, {
      queueId: args.queueId,
    });
    
    if (!queueItem) {
      return { success: false, error: "Queue item not found" };
    }
    
    // Update status to generating
    await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
      queueId: args.queueId,
      status: "generating_outline",
    });
    
    const startTime = Date.now();
    
    try {
      // Generate outline using OpenAI
      const outline = await generateCourseOutlineWithAI({
        topic: queueItem.topic || queueItem.prompt,
        skillLevel: queueItem.skillLevel || "intermediate",
        targetModules: queueItem.targetModules || 4,
        targetLessonsPerModule: queueItem.targetLessonsPerModule || 3,
        prompt: queueItem.prompt,
      });
      
      // Calculate chapter status
      const chapterStatus = [];
      let totalChapters = 0;
      
      for (let mi = 0; mi < outline.modules.length; mi++) {
        const module = outline.modules[mi];
        for (let li = 0; li < module.lessons.length; li++) {
          const lesson = module.lessons[li];
          for (let ci = 0; ci < lesson.chapters.length; ci++) {
            const chapter = lesson.chapters[ci];
            chapterStatus.push({
              moduleIndex: mi,
              lessonIndex: li,
              chapterIndex: ci,
              title: chapter.title,
              hasDetailedContent: false, // Outline only has brief content
              wordCount: chapter.content?.split(' ').length || 0,
            });
            totalChapters++;
          }
        }
      }
      
      // Save outline to database
      const outlineId = await ctx.runMutation(internal.aiCourseBuilder.saveOutline, {
        queueId: args.queueId,
        userId: queueItem.userId,
        storeId: queueItem.storeId,
        title: outline.course.title,
        description: outline.course.description,
        topic: queueItem.topic || queueItem.prompt,
        skillLevel: outline.course.skillLevel,
        estimatedDuration: outline.course.estimatedDuration,
        outline: outline,
        totalChapters,
        chapterStatus,
        generationModel: "gpt-4o",
        generationTimeMs: Date.now() - startTime,
      });
      
      // Update queue item with outline ID and status
      await ctx.runMutation(internal.aiCourseBuilder.linkOutlineToQueue, {
        queueId: args.queueId,
        outlineId,
      });
      
      return { success: true, outlineId };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
        queueId: args.queueId,
        status: "failed",
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Process the next queued item (called by scheduler or manually)
 */
export const processNextInQueue = action({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.object({
    processed: v.boolean(),
    queueId: v.optional(v.id("aiCourseQueue")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get next queued item
    const nextItem = await ctx.runQuery(internal.aiCourseBuilder.getNextQueuedItem, {
      userId: args.userId,
    });
    
    if (!nextItem) {
      return { processed: false, error: "No items in queue" };
    }
    
    // Generate outline for this item
    const result = await ctx.runAction(api.aiCourseBuilder.generateOutline, {
      queueId: nextItem._id,
    });
    
    return {
      processed: result.success,
      queueId: nextItem._id,
      error: result.error,
    };
  },
});

// =============================================================================
// CHAPTER CONTENT EXPANSION
// =============================================================================

/**
 * Expand a specific chapter with detailed content
 */
export const expandChapterContent = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    moduleIndex: v.number(),
    lessonIndex: v.number(),
    chapterIndex: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get outline
    const outline = await ctx.runQuery(internal.aiCourseBuilder.getOutlineInternal, {
      outlineId: args.outlineId,
    });
    
    if (!outline) {
      return { success: false, error: "Outline not found" };
    }
    
    const outlineData = outline.outline as CourseOutline;
    const module = outlineData.modules[args.moduleIndex];
    const lesson = module?.lessons[args.lessonIndex];
    const chapter = lesson?.chapters[args.chapterIndex];
    
    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }
    
    try {
      // Generate detailed content
      const detailedContent = await generateChapterContentWithAI({
        topic: outline.topic,
        skillLevel: outline.skillLevel,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        chapterTitle: chapter.title,
        chapterOutline: chapter.content,
      });
      
      // Update the outline with the new content
      outlineData.modules[args.moduleIndex].lessons[args.lessonIndex].chapters[args.chapterIndex] = {
        ...chapter,
        content: detailedContent,
        hasDetailedContent: true,
        wordCount: detailedContent.split(' ').length,
      };
      
      // Update chapter status
      const chapterStatus = (outline.chapterStatus || []) as Array<{
        moduleIndex: number;
        lessonIndex: number;
        chapterIndex: number;
        title: string;
        hasDetailedContent: boolean;
        wordCount?: number;
      }>;
      
      const statusIndex = chapterStatus.findIndex(
        s => s.moduleIndex === args.moduleIndex &&
             s.lessonIndex === args.lessonIndex &&
             s.chapterIndex === args.chapterIndex
      );
      
      if (statusIndex !== -1) {
        chapterStatus[statusIndex] = {
          ...chapterStatus[statusIndex],
          hasDetailedContent: true,
          wordCount: detailedContent.split(' ').length,
        };
      }
      
      // Save updated outline
      await ctx.runMutation(internal.aiCourseBuilder.updateOutlineContent, {
        outlineId: args.outlineId,
        outline: outlineData,
        chapterStatus,
        expandedChapters: chapterStatus.filter(s => s.hasDetailedContent).length,
      });
      
      return {
        success: true,
        content: detailedContent,
        wordCount: detailedContent.split(' ').length,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Expand all chapters in an outline (batch operation)
 */
export const expandAllChapters = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    queueId: v.id("aiCourseQueue"),
  },
  returns: v.object({
    success: v.boolean(),
    expandedCount: v.number(),
    failedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get outline
    const outline = await ctx.runQuery(internal.aiCourseBuilder.getOutlineInternal, {
      outlineId: args.outlineId,
    });
    
    if (!outline) {
      return { success: false, expandedCount: 0, failedCount: 0, error: "Outline not found" };
    }
    
    // Update queue status
    await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
      queueId: args.queueId,
      status: "expanding_content",
    });
    
    const outlineData = outline.outline as CourseOutline;
    let expandedCount = 0;
    let failedCount = 0;
    const totalChapters = outline.totalChapters;
    
    // Process each chapter
    for (let mi = 0; mi < outlineData.modules.length; mi++) {
      const module = outlineData.modules[mi];
      for (let li = 0; li < module.lessons.length; li++) {
        const lesson = module.lessons[li];
        for (let ci = 0; ci < lesson.chapters.length; ci++) {
          const chapter = lesson.chapters[ci];
          
          // Skip if already has detailed content
          if (chapter.hasDetailedContent && chapter.wordCount && chapter.wordCount > 500) {
            expandedCount++;
            continue;
          }
          
          // Update progress
          await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
            queueId: args.queueId,
            status: "expanding_content",
            progress: {
              currentStep: "Expanding content",
              totalSteps: totalChapters,
              completedSteps: expandedCount + failedCount,
              currentChapter: chapter.title,
            },
          });
          
          try {
            const result = await ctx.runAction(api.aiCourseBuilder.expandChapterContent, {
              outlineId: args.outlineId,
              moduleIndex: mi,
              lessonIndex: li,
              chapterIndex: ci,
            });
            
            if (result.success) {
              expandedCount++;
            } else {
              failedCount++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            failedCount++;
            console.error(`Failed to expand chapter: ${chapter.title}`, error);
          }
        }
      }
    }
    
    // Update queue status
    await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
      queueId: args.queueId,
      status: failedCount === 0 ? "ready_to_create" : "outline_ready",
    });
    
    return {
      success: failedCount === 0,
      expandedCount,
      failedCount,
    };
  },
});

// =============================================================================
// COURSE CREATION FROM OUTLINE
// =============================================================================

/**
 * Create a course from an outline
 */
export const createCourseFromOutline = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    queueId: v.id("aiCourseQueue"),
    price: v.optional(v.number()),
    publish: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    courseId: v.optional(v.id("courses")),
    slug: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get outline
    const outline = await ctx.runQuery(internal.aiCourseBuilder.getOutlineInternal, {
      outlineId: args.outlineId,
    });
    
    if (!outline) {
      return { success: false, error: "Outline not found" };
    }
    
    // Update queue status
    await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
      queueId: args.queueId,
      status: "creating_course",
    });
    
    try {
      const outlineData = outline.outline as CourseOutline;
      
      // Create course using existing mutation
      const result = await ctx.runMutation(api.courses.createCourseWithData, {
        userId: outline.userId,
        storeId: outline.storeId,
        data: {
          title: outlineData.course.title,
          description: outlineData.course.description,
          category: outlineData.course.category,
          skillLevel: outlineData.course.skillLevel,
          price: String(args.price || 0),
          checkoutHeadline: `Master ${outline.topic} with this comprehensive course`,
          modules: outlineData.modules,
        },
      });
      
      if (result.success && result.courseId) {
        // Link course to queue item
        await ctx.runMutation(internal.aiCourseBuilder.linkCourseToQueue, {
          queueId: args.queueId,
          courseId: result.courseId,
        });
        
        // Update queue status
        await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
          queueId: args.queueId,
          status: "completed",
        });
        
        return {
          success: true,
          courseId: result.courseId,
          slug: result.slug,
        };
      }
      
      throw new Error("Failed to create course");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await ctx.runMutation(api.aiCourseBuilder.updateQueueStatus, {
        queueId: args.queueId,
        status: "failed",
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  },
});

// =============================================================================
// OUTLINE MANAGEMENT
// =============================================================================

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
 * Update outline (user edits)
 */
export const updateOutline = mutation({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    outline: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outlineId, {
      outline: args.outline,
      isEdited: true,
      lastEditedAt: Date.now(),
    });
    return null;
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
// INTERNAL QUERIES & MUTATIONS
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
    let query = ctx.db
      .query("aiCourseQueue")
      .withIndex("by_status", (q) => q.eq("status", "queued"));
    
    const items = await query.take(10);
    
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

// =============================================================================
// AI GENERATION HELPERS
// =============================================================================

function extractTopicFromPrompt(prompt: string): string {
  // Extract topic from common prompt patterns
  const patterns = [
    /create\s+(?:me\s+)?a?\s*course\s+(?:on|about|for)\s+(.+?)(?:\s+in\s+ableton|\s+using|\s+with|\.|$)/i,
    /course\s+(?:on|about|for)\s+(.+?)(?:\s+in\s+ableton|\s+using|\s+with|\.|$)/i,
    /how\s+to\s+(.+?)(?:\s+in\s+ableton|\s+using|\s+with|\.|$)/i,
    /teach\s+(?:me\s+)?(?:about\s+)?(.+?)(?:\.|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: use the whole prompt
  return prompt.slice(0, 100);
}

async function generateCourseOutlineWithAI(params: {
  topic: string;
  skillLevel: string;
  targetModules: number;
  targetLessonsPerModule: number;
  prompt: string;
}): Promise<CourseOutline> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const systemPrompt = `You are a world-class music production educator and curriculum designer. Create comprehensive, professional course outlines for music production education.

IMPORTANT:
- Focus exclusively on the specified topic
- Create logical, progressive learning structures
- Balance theory with practical application
- Include specific, actionable chapter content outlines
- Each chapter outline should be 50-100 words describing what will be covered`;

  const userPrompt = `Create a course outline for: "${params.prompt}"

Requirements:
- Topic: ${params.topic}
- Skill Level: ${params.skillLevel}
- Number of Modules: ${params.targetModules}
- Lessons per Module: ${params.targetLessonsPerModule}
- Chapters per Lesson: 3

Generate a complete course structure with:
1. Course title and description
2. ${params.targetModules} modules with progressive difficulty
3. ${params.targetLessonsPerModule} lessons per module
4. 3 chapters per lesson with brief content outlines`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "course_outline",
        schema: {
          type: "object",
          properties: {
            course: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                skillLevel: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                estimatedDuration: { type: "number" },
              },
              required: ["title", "description", "category", "skillLevel", "estimatedDuration"],
            },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  orderIndex: { type: "number" },
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        orderIndex: { type: "number" },
                        chapters: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "string" },
                              duration: { type: "number" },
                              orderIndex: { type: "number" },
                            },
                            required: ["title", "content", "duration", "orderIndex"],
                          },
                        },
                      },
                      required: ["title", "description", "orderIndex", "chapters"],
                    },
                  },
                },
                required: ["title", "description", "orderIndex", "lessons"],
              },
            },
          },
          required: ["course", "modules"],
        },
      },
    },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return JSON.parse(content) as CourseOutline;
}

async function generateChapterContentWithAI(params: {
  topic: string;
  skillLevel: string;
  moduleTitle: string;
  lessonTitle: string;
  chapterTitle: string;
  chapterOutline: string;
}): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are a master music production educator creating detailed lesson content. Write comprehensive, video-script-ready educational content.

STYLE GUIDELINES:
- Write 800-1200 words of detailed, educational content
- Use conversational tone suitable for video production
- Include specific technical details and step-by-step instructions
- Provide practical examples and real-world applications
- Structure with clear sections and learning points
- Focus exclusively on the chapter topic`;

  const userPrompt = `Create detailed content for this chapter:

Course Topic: ${params.topic}
Skill Level: ${params.skillLevel}
Module: ${params.moduleTitle}
Lesson: ${params.lessonTitle}
Chapter: ${params.chapterTitle}

Chapter Outline:
${params.chapterOutline}

Write comprehensive, educational content that covers this chapter thoroughly.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 3000,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return content;
}

