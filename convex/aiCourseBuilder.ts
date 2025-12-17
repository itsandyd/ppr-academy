"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

// Type-escape hatch to avoid deep type inference issues with Convex API types
// Using require to bypass TypeScript's eager type evaluation
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { api, internal } = require("./_generated/api") as { api: any; internal: any };

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
  content: string;
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
    // Get queue item - cast to any to avoid deep type inference
    const queueItem = await (ctx as any).runQuery(
      internal.aiCourseBuilderQueries.getQueueItemInternal,
      { queueId: args.queueId }
    );
    
    if (!queueItem) {
      return { success: false, error: "Queue item not found" };
    }
    
    // Update status to generating
    await (ctx as any).runMutation(
      api.aiCourseBuilderQueries.updateQueueStatus,
      { queueId: args.queueId, status: "generating_outline" }
    );
    
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
      const chapterStatus: Array<{
        moduleIndex: number;
        lessonIndex: number;
        chapterIndex: number;
        title: string;
        hasDetailedContent: boolean;
        wordCount: number;
      }> = [];
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
              hasDetailedContent: false,
              wordCount: chapter.content?.split(' ').length || 0,
            });
            totalChapters++;
          }
        }
      }
      
      // Save outline to database
      const outlineId = await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.saveOutline,
        {
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
        }
      ) as Id<"aiCourseOutlines">;
      
      // Update queue item with outline ID and status
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.linkOutlineToQueue,
        { queueId: args.queueId, outlineId }
      );
      
      return { success: true, outlineId };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await (ctx as any).runMutation(
        api.aiCourseBuilderQueries.updateQueueStatus,
        { queueId: args.queueId, status: "failed", error: errorMessage }
      );
      
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
    // Get next queued item - cast to any to avoid deep type inference
    const nextItem = await (ctx as any).runQuery(
      internal.aiCourseBuilderQueries.getNextQueuedItem,
      { userId: args.userId }
    );
    
    if (!nextItem) {
      return { processed: false, error: "No items in queue" };
    }
    
    // Generate outline for this item
    const result = await (ctx as any).runAction(
      api.aiCourseBuilder.generateOutline,
      { queueId: nextItem._id }
    ) as { success: boolean; outlineId?: Id<"aiCourseOutlines">; error?: string };
    
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
    // Get outline - cast to any to avoid deep type inference
    const outline = await (ctx as any).runQuery(
      internal.aiCourseBuilderQueries.getOutlineInternal,
      { outlineId: args.outlineId }
    );
    
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
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.updateOutlineContent,
        {
          outlineId: args.outlineId,
          outline: outlineData,
          chapterStatus,
          expandedChapters: chapterStatus.filter(s => s.hasDetailedContent).length,
        }
      );
      
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
    // Get outline - cast to any to avoid deep type inference
    const outline = await (ctx as any).runQuery(
      internal.aiCourseBuilderQueries.getOutlineInternal,
      { outlineId: args.outlineId }
    );
    
    if (!outline) {
      return { success: false, expandedCount: 0, failedCount: 0, error: "Outline not found" };
    }
    
    // Update queue status
    await (ctx as any).runMutation(
      api.aiCourseBuilderQueries.updateQueueStatus,
      { queueId: args.queueId, status: "expanding_content" }
    );
    
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
          await (ctx as any).runMutation(
            api.aiCourseBuilderQueries.updateQueueStatus,
            {
              queueId: args.queueId,
              status: "expanding_content",
              progress: {
                currentStep: "Expanding content",
                totalSteps: totalChapters,
                completedSteps: expandedCount + failedCount,
                currentChapter: chapter.title,
              },
            }
          );
          
          try {
            const result = await (ctx as any).runAction(
              api.aiCourseBuilder.expandChapterContent,
              {
                outlineId: args.outlineId,
                moduleIndex: mi,
                lessonIndex: li,
                chapterIndex: ci,
              }
            ) as { success: boolean; content?: string; wordCount?: number; error?: string };
            
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
    await (ctx as any).runMutation(
      api.aiCourseBuilderQueries.updateQueueStatus,
      {
        queueId: args.queueId,
        status: failedCount === 0 ? "ready_to_create" : "outline_ready",
      }
    );
    
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
    // Get outline - cast to any to avoid deep type inference
    const outline = await (ctx as any).runQuery(
      internal.aiCourseBuilderQueries.getOutlineInternal,
      { outlineId: args.outlineId }
    );
    
    if (!outline) {
      return { success: false, error: "Outline not found" };
    }
    
    // Update queue status
    await (ctx as any).runMutation(
      api.aiCourseBuilderQueries.updateQueueStatus,
      { queueId: args.queueId, status: "creating_course" }
    );
    
    try {
      const outlineData = outline.outline as CourseOutline;
      
      // Create course using existing mutation
      const result = await (ctx as any).runMutation(
        api.courses.createCourseWithData,
        {
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
        }
      ) as { success: boolean; courseId?: Id<"courses">; slug?: string; message?: string };
      
      if (result.success && result.courseId) {
        // Link course to queue item
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.linkCourseToQueue,
          { queueId: args.queueId, courseId: result.courseId }
        );
        
        // Update queue status
        await (ctx as any).runMutation(
          api.aiCourseBuilderQueries.updateQueueStatus,
          { queueId: args.queueId, status: "completed" }
        );
        
        return {
          success: true,
          courseId: result.courseId,
          slug: result.slug,
        };
      }
      
      throw new Error("Failed to create course");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await (ctx as any).runMutation(
        api.aiCourseBuilderQueries.updateQueueStatus,
        { queueId: args.queueId, status: "failed", error: errorMessage }
      );
      
      return { success: false, error: errorMessage };
    }
  },
});

// =============================================================================
// AI HELPER FUNCTIONS
// =============================================================================

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

  const systemPrompt = `You are a master music production educator creating comprehensive course outlines. Generate detailed, professional course structures.

GUIDELINES:
- Create exactly ${params.targetModules} modules
- Each module should have ${params.targetLessonsPerModule} lessons
- Each lesson should have 2-4 chapters
- Content should be appropriate for ${params.skillLevel} level
- Be specific to the topic and provide actionable learning
- Chapter content should be a brief outline (2-3 sentences) describing what will be covered

IMPORTANT: You must respond with valid JSON in the following format:
{
  "course": {
    "title": "Course Title",
    "description": "Course description",
    "category": "Music Production",
    "skillLevel": "beginner|intermediate|advanced",
    "estimatedDuration": 120
  },
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "orderIndex": 0,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "orderIndex": 0,
          "chapters": [
            {
              "title": "Chapter Title",
              "content": "Brief outline of what this chapter covers (2-3 sentences)",
              "duration": 10,
              "orderIndex": 0
            }
          ]
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create a course outline for: ${params.prompt}

Topic: ${params.topic}
Skill Level: ${params.skillLevel}

Generate a complete course structure with modules, lessons, and chapters. Respond with valid JSON only.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 4000,
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
