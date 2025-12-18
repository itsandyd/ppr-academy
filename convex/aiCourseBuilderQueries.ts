import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { chatSettingsValidator } from "./masterAI/types";

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

/**
 * Get course structure for expansion - REACTIVE QUERY
 * This is a query (not action) so Convex will auto-update the UI when chapters change
 */
export const getCourseStructure = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      course: v.object({
        _id: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
        skillLevel: v.optional(v.string()),
      }),
      modules: v.array(v.object({
        _id: v.id("courseModules"),
        title: v.string(),
        description: v.optional(v.string()),
        position: v.number(),
        lessons: v.array(v.object({
          _id: v.id("courseLessons"),
          title: v.string(),
          description: v.optional(v.string()),
          position: v.number(),
          chapters: v.array(v.object({
            _id: v.id("courseChapters"),
            title: v.string(),
            description: v.optional(v.string()),
            position: v.number(),
            hasContent: v.boolean(),
            wordCount: v.number(),
          })),
        })),
      })),
      totalChapters: v.number(),
      chaptersWithContent: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return { success: false as const, error: "Course not found" };
    }
    
    // Get modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    
    // Sort by position
    modules.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    
    let totalChapters = 0;
    let chaptersWithContent = 0;
    
    // Build full structure with lessons and chapters
    const fullModules = await Promise.all(modules.map(async (mod) => {
      // Get lessons for this module
      const lessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", mod._id))
        .collect();
      
      // Sort by position
      lessons.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      
      const lessonsWithChapters = await Promise.all(lessons.map(async (lesson) => {
        // Get chapters for this lesson
        const chapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .collect();
        
        // Sort by position
        chapters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        
        const chaptersWithStatus = chapters.map(ch => {
          const wordCount = ch.description?.split(/\s+/).length || 0;
          const hasContent = wordCount > 50; // Consider content "real" if > 50 words
          
          totalChapters++;
          if (hasContent) chaptersWithContent++;
          
          return {
            _id: ch._id,
            title: ch.title,
            description: ch.description,
            position: ch.position ?? 0,
            hasContent,
            wordCount,
          };
        });
        
        return {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          position: lesson.position ?? 0,
          chapters: chaptersWithStatus,
        };
      }));
      
      return {
        _id: mod._id,
        title: mod.title,
        description: mod.description,
        position: mod.position ?? 0,
        lessons: lessonsWithChapters,
      };
    }));
    
    return {
      success: true as const,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        skillLevel: course.skillLevel,
      },
      modules: fullModules,
      totalChapters,
      chaptersWithContent,
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

/**
 * Delete orphan lessons (lessons not referenced by any chapters)
 */
export const deleteOrphanLessons = mutation({
  args: {
    lessonIds: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    let deleted = 0;
    for (const idStr of args.lessonIds) {
      try {
        const lessonId = ctx.db.normalizeId("courseLessons", idStr);
        if (lessonId) {
          await ctx.db.delete(lessonId);
          deleted++;
        }
      } catch (e) {
        console.log(`Failed to delete lesson ${idStr}:`, e);
      }
    }
    return { success: true, deleted };
  },
});

/**
 * Clean up module and lesson titles by removing "Module #:" and "Lesson #:" prefixes
 */
export const cleanupCourseTitles = mutation({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    success: v.boolean(),
    modulesFixed: v.number(),
    lessonsFixed: v.number(),
  }),
  handler: async (ctx, args) => {
    let modulesFixed = 0;
    let lessonsFixed = 0;

    // Get all modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    // Fix module titles
    for (const mod of modules) {
      // Remove "Module #: " prefix
      const cleanTitle = mod.title.replace(/^Module \d+:\s*/i, "");
      if (cleanTitle !== mod.title) {
        await ctx.db.patch(mod._id, { title: cleanTitle });
        modulesFixed++;
        console.log(`  📦 Module: "${mod.title}" -> "${cleanTitle}"`);
      }

      // Get lessons for this module
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), mod._id))
        .collect();

      // Fix lesson titles
      for (const lesson of lessons) {
        // Remove "Lesson #: " prefix
        const cleanLessonTitle = lesson.title.replace(/^Lesson \d+:\s*/i, "");
        if (cleanLessonTitle !== lesson.title) {
          await ctx.db.patch(lesson._id, { title: cleanLessonTitle });
          lessonsFixed++;
          console.log(`    📖 Lesson: "${lesson.title}" -> "${cleanLessonTitle}"`);
        }
      }
    }

    console.log(`✅ Fixed ${modulesFixed} modules and ${lessonsFixed} lessons`);
    return { success: true, modulesFixed, lessonsFixed };
  },
});

/**
 * Fix chapter-to-lesson mappings by matching chapter titles to outline
 */
export const fixChapterLessonMappings = mutation({
  args: {
    courseId: v.id("courses"),
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.object({
    success: v.boolean(),
    fixed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const errors: string[] = [];
    let fixed = 0;

    // Get the outline
    const outline = await ctx.db.get(args.outlineId);
    if (!outline) {
      return { success: false, fixed: 0, errors: ["Outline not found"] };
    }

    // Get all modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
    modules.sort((a, b) => a.position - b.position);

    // Get all chapters for this course
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    // Build a map of chapter title -> lessonId from the outline and DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outlineData = outline.outline as any;
    const chapterToLessonMap: Map<string, string> = new Map();

    for (let mi = 0; mi < outlineData.modules.length; mi++) {
      const outlineModule = outlineData.modules[mi];
      const dbModule = modules[mi];

      if (!dbModule) {
        errors.push(`No DB module found at index ${mi}`);
        continue;
      }

      // Get lessons for this module
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), dbModule._id))
        .collect();
      lessons.sort((a, b) => a.position - b.position);

      for (let li = 0; li < outlineModule.lessons.length; li++) {
        const outlineLesson = outlineModule.lessons[li];
        const dbLesson = lessons[li];

        if (!dbLesson) {
          errors.push(`No DB lesson found for "${outlineLesson.title}"`);
          continue;
        }

        // Map each chapter title in this lesson to this lesson's ID
        for (const outlineChapter of outlineLesson.chapters) {
          chapterToLessonMap.set(outlineChapter.title, dbLesson._id.toString());
        }
      }
    }

    console.log(`📚 Built map with ${chapterToLessonMap.size} chapter->lesson mappings`);

    // Now update each chapter with the correct lessonId
    for (const chapter of chapters) {
      const correctLessonId = chapterToLessonMap.get(chapter.title);
      
      if (correctLessonId) {
        if (chapter.lessonId !== correctLessonId) {
          await ctx.db.patch(chapter._id, { lessonId: correctLessonId });
          fixed++;
          console.log(`  ✅ Fixed "${chapter.title}" -> ${correctLessonId}`);
        }
      } else {
        errors.push(`No lesson mapping found for chapter "${chapter.title}"`);
      }
    }

    console.log(`✅ Fixed ${fixed} chapter mappings`);
    return { success: true, fixed, errors };
  },
});

/**
 * Repair a course by recreating lessons and fixing chapter references
 * Uses outline data to rebuild the lesson structure
 */
export const repairCourseFromOutline = mutation({
  args: {
    courseId: v.id("courses"),
    outlineId: v.id("aiCourseOutlines"),
  },
  returns: v.object({
    success: v.boolean(),
    lessonsCreated: v.number(),
    chaptersFixed: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the outline
      const outline = await ctx.db.get(args.outlineId);
      if (!outline) {
        return { success: false, lessonsCreated: 0, chaptersFixed: 0, error: "Outline not found" };
      }

      // Get the course
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        return { success: false, lessonsCreated: 0, chaptersFixed: 0, error: "Course not found" };
      }

      // Get existing modules for this course
      const modules = await ctx.db
        .query("courseModules")
        .filter((q) => q.eq(q.field("courseId"), args.courseId))
        .collect();

      // Sort modules by position
      modules.sort((a, b) => a.position - b.position);

      console.log(`📦 Found ${modules.length} modules for course "${course.title}"`);

      // Get all existing chapters for this course
      const existingChapters = await ctx.db
        .query("courseChapters")
        .filter((q) => q.eq(q.field("courseId"), args.courseId))
        .collect();

      console.log(`📄 Found ${existingChapters.length} existing chapters`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outlineData = outline.outline as any;
      let lessonsCreated = 0;
      let chaptersFixed = 0;

      // Map to track chapter position to new lessonId
      const chapterLessonMap: Map<string, Id<"courseLessons">> = new Map();

      // Iterate through outline modules and create lessons
      for (let mi = 0; mi < outlineData.modules.length; mi++) {
        const outlineModule = outlineData.modules[mi];
        const dbModule = modules[mi];

        if (!dbModule) {
          console.log(`⚠️ No module found at index ${mi}`);
          continue;
        }

        console.log(`📚 Processing module "${dbModule.title}"`);

        // Create lessons for this module
        for (let li = 0; li < outlineModule.lessons.length; li++) {
          const outlineLesson = outlineModule.lessons[li];
          
          // Create the lesson
          const lessonId = await ctx.db.insert("courseLessons", {
            moduleId: dbModule._id,
            title: outlineLesson.title,
            description: outlineLesson.description || "",
            position: outlineLesson.orderIndex ?? li,
          });
          lessonsCreated++;

          console.log(`  📖 Created lesson "${outlineLesson.title}"`);

          // Track chapter positions for this lesson
          for (let ci = 0; ci < outlineLesson.chapters.length; ci++) {
            const chapterKey = `${mi}-${li}-${ci}`;
            chapterLessonMap.set(chapterKey, lessonId);
          }
        }
      }

      // Now fix the chapter references
      // Group existing chapters by their approximate position
      existingChapters.sort((a, b) => a.position - b.position);

      let chapterIndex = 0;
      for (let mi = 0; mi < outlineData.modules.length; mi++) {
        const outlineModule = outlineData.modules[mi];
        
        for (let li = 0; li < outlineModule.lessons.length; li++) {
          const outlineLesson = outlineModule.lessons[li];
          
          for (let ci = 0; ci < outlineLesson.chapters.length; ci++) {
            const chapterKey = `${mi}-${li}-${ci}`;
            const lessonId = chapterLessonMap.get(chapterKey);

            if (lessonId && existingChapters[chapterIndex]) {
              // Update the chapter with the correct lessonId
              await ctx.db.patch(existingChapters[chapterIndex]._id, {
                lessonId: lessonId,
              });
              chaptersFixed++;
            }
            chapterIndex++;
          }
        }
      }

      console.log(`✅ Repair complete: ${lessonsCreated} lessons created, ${chaptersFixed} chapters fixed`);

      return {
        success: true,
        lessonsCreated,
        chaptersFixed,
      };
    } catch (error) {
      console.error("Error repairing course:", error);
      return {
        success: false,
        lessonsCreated: 0,
        chaptersFixed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// =============================================================================
// BACKGROUND JOB STARTERS - Mutations that schedule background work
// =============================================================================

/**
 * Start outline generation in the background
 * Creates a queue item and schedules the background action
 * Returns immediately - UI subscribes to queue status for updates
 */
export const startBackgroundOutlineGeneration = mutation({
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
    settings: v.optional(chatSettingsValidator),
  },
  returns: v.object({
    success: v.boolean(),
    queueId: v.optional(v.id("aiCourseQueue")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Extract topic from prompt
      const topic = extractTopicFromPrompt(args.prompt);
      
      // Create queue item
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
        priority: 10, // High priority for user-initiated
      });

      // Schedule the background action (runs immediately, 0ms delay)
      // @ts-ignore - Deep type inference issue with scheduler
      await ctx.scheduler.runAfter(0, internal.aiCourseBuilder.processOutlineInBackground, {
        queueId,
        settings: args.settings,
      });

      console.log(`🚀 Started background outline generation: ${queueId}`);
      
      return { success: true, queueId };
    } catch (error) {
      console.error("Error starting background generation:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Start chapter expansion in the background for an existing outline
 * Returns immediately - UI subscribes to queue status for updates
 */
export const startBackgroundChapterExpansion = mutation({
  args: {
    queueId: v.id("aiCourseQueue"),
    outlineId: v.id("aiCourseOutlines"),
    settings: v.optional(chatSettingsValidator),
    parallelBatchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Update queue status
      await ctx.db.patch(args.queueId, {
        status: "expanding_content",
        progress: {
          currentStep: "Queued for expansion...",
          totalSteps: 100,
          completedSteps: 0,
        },
      });

      // Schedule the background action
      await ctx.scheduler.runAfter(0, internal.aiCourseBuilder.processChapterExpansionInBackground, {
        queueId: args.queueId,
        outlineId: args.outlineId,
        settings: args.settings,
        parallelBatchSize: args.parallelBatchSize,
      });

      console.log(`🚀 Started background chapter expansion: ${args.queueId}`);
      
      return { success: true };
    } catch (error) {
      console.error("Error starting background expansion:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Start expansion for an existing course (no outline needed)
 * Creates a queue item and schedules the background action
 */
export const startBackgroundExistingCourseExpansion = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    courseId: v.id("courses"),
    settings: v.optional(chatSettingsValidator),
    parallelBatchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    queueId: v.optional(v.id("aiCourseQueue")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get course info
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        return { success: false, error: "Course not found" };
      }

      // Create queue item for tracking
      const queueId = await ctx.db.insert("aiCourseQueue", {
        userId: args.userId,
        storeId: args.storeId,
        prompt: `Expand chapters for: ${course.title}`,
        topic: course.title,
        skillLevel: (course.skillLevel as "beginner" | "intermediate" | "advanced") || "intermediate",
        targetModules: 0, // Not creating new modules
        targetLessonsPerModule: 0,
        status: "expanding_content",
        courseId: args.courseId, // Link to existing course
        createdAt: Date.now(),
        priority: 10,
        progress: {
          currentStep: "Queued for expansion...",
          totalSteps: 100,
          completedSteps: 0,
        },
      });

      // Schedule the background action
      await ctx.scheduler.runAfter(0, internal.aiCourseBuilder.processExistingCourseExpansionInBackground, {
        queueId,
        courseId: args.courseId,
        settings: args.settings,
        parallelBatchSize: args.parallelBatchSize,
      });

      console.log(`🚀 Started background existing course expansion: ${queueId}`);
      
      return { success: true, queueId };
    } catch (error) {
      console.error("Error starting background expansion:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Subscribe to a queue item's status (real-time updates)
 */
export const subscribeToQueueItem = query({
  args: {
    queueId: v.id("aiCourseQueue"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.queueId);
    if (!item) return null;

    // Get associated outline if available
    let outline = null;
    if (item.outlineId) {
      outline = await ctx.db.get(item.outlineId);
    }

    // Get associated course if available
    let course = null;
    if (item.courseId) {
      course = await ctx.db.get(item.courseId);
    }

    return {
      ...item,
      outline: outline ? {
        _id: outline._id,
        title: outline.title,
        description: outline.description,
        totalChapters: outline.totalChapters,
        expandedChapters: outline.expandedChapters,
        outline: outline.outline,
        chapterStatus: outline.chapterStatus,
      } : null,
      course: course ? {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      } : null,
    };
  },
});

/**
 * Get all active (running) queue items for a user
 */
export const getActiveQueueItems = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const activeStatuses = ["queued", "generating_outline", "expanding_content", "creating_course"];
    
    const items = await ctx.db
      .query("aiCourseQueue")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return items.filter(item => activeStatuses.includes(item.status));
  },
});

