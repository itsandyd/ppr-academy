"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import { 
  chatSettingsValidator, 
  DEFAULT_CHAT_SETTINGS,
  type ChatSettings,
  type PlannerOutput,
  type RetrieverOutput,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
} from "./masterAI/types";

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
// OUTLINE GENERATION - Uses FULL masterAI pipeline (same as AI chat)
// =============================================================================

/**
 * Generate a course outline for a queue item using the FULL masterAI pipeline
 * (Planner → Retriever → Web Research → Summarizer → Idea Generator → Critic → Final Writer)
 */
export const generateOutline = action({
  args: {
    queueId: v.id("aiCourseQueue"),
    settings: v.optional(chatSettingsValidator), // User's AI settings
  },
  returns: v.object({
    success: v.boolean(),
    outlineId: v.optional(v.id("aiCourseOutlines")),
    outline: v.optional(v.any()),
    error: v.optional(v.string()),
    pipelineMetadata: v.optional(v.any()),
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
    
    // Use provided settings or defaults
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    
    // Update status to generating
    await (ctx as any).runMutation(
      api.aiCourseBuilderQueries.updateQueueStatus,
      { queueId: args.queueId, status: "generating_outline" }
    );
    
    const startTime = Date.now();
    const topic = queueItem.topic || queueItem.prompt;
    const skillLevel = queueItem.skillLevel || "intermediate";
    const targetModules = queueItem.targetModules || 4;
    const targetLessonsPerModule = queueItem.targetLessonsPerModule || 3;
    
    try {
      // =======================================================================
      // STEP 1: Use masterAI pipeline to gather knowledge and research
      // =======================================================================
      const researchPrompt = `I'm creating a comprehensive music production course about: ${topic}
      
Skill Level: ${skillLevel}

Please research this topic thoroughly and provide:
1. Key concepts and skills that should be covered
2. The logical learning progression for ${skillLevel} students
3. Common challenges and how to address them
4. Practical techniques and tips
5. Industry best practices

This research will be used to structure a ${targetModules}-module course.`;

      console.log(`🎓 Step 1: Gathering knowledge with masterAI pipeline (preset: ${settings.preset})`);
      
      // Call the FULL masterAI pipeline for research and knowledge gathering
      const pipelineResult = await (ctx as any).runAction(
        api.masterAI.index.askMasterAI,
        {
          question: researchPrompt,
          settings,
          userId: queueItem.userId,
        }
      ) as { answer: string; citations?: any[]; facetsUsed?: string[]; pipelineMetadata?: any };
      
      console.log(`   ✅ Pipeline research complete. Got ${pipelineResult.answer.length} chars of context`);
      console.log(`   📊 Chunks: ${pipelineResult.pipelineMetadata?.totalChunksProcessed || 0}, Facets: ${pipelineResult.facetsUsed?.join(", ") || "none"}`);

      // =======================================================================
      // STEP 2: Generate structured JSON outline using direct OpenAI call
      // =======================================================================
      console.log(`🎓 Step 2: Generating structured course outline with JSON mode`);
      
      const outline = await generateStructuredOutline({
        topic,
        skillLevel,
        targetModules,
        targetLessonsPerModule,
        pipelineContext: pipelineResult.answer,
        facets: pipelineResult.facetsUsed || [],
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
          topic,
          skillLevel: outline.course.skillLevel,
          estimatedDuration: outline.course.estimatedDuration,
          outline: outline,
          totalChapters,
          chapterStatus,
          generationModel: `masterAI-${settings.preset}`,
          generationTimeMs: Date.now() - startTime,
        }
      ) as Id<"aiCourseOutlines">;
      
      // Update queue item with outline ID and status
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.linkOutlineToQueue,
        { queueId: args.queueId, outlineId }
      );
      
      console.log(`✅ Course outline generated in ${Date.now() - startTime}ms using full pipeline`);
      
      return { 
        success: true, 
        outlineId,
        outline,
        pipelineMetadata: pipelineResult.pipelineMetadata,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Outline generation failed:", errorMessage);
      
      await (ctx as any).runMutation(
        api.aiCourseBuilderQueries.updateQueueStatus,
        { queueId: args.queueId, status: "failed", error: errorMessage }
      );
      
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Generate a structured course outline using OpenAI's JSON mode
 * Uses context from the masterAI pipeline for informed content
 */
async function generateStructuredOutline(params: {
  topic: string;
  skillLevel: string;
  targetModules: number;
  targetLessonsPerModule: number;
  pipelineContext: string;
  facets: string[];
}): Promise<CourseOutline> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert course curriculum designer. Create a comprehensive, well-structured course outline based on the provided research and context.

REQUIREMENTS:
- Create exactly ${params.targetModules} modules
- Each module should have exactly ${params.targetLessonsPerModule} lessons
- Each lesson should have 2-4 chapters
- Content should be appropriate for ${params.skillLevel} level students
- Use the research context to inform your outline with accurate, relevant content
- Module and lesson titles should be specific and descriptive
- Chapter content should be 2-3 sentences describing what will be taught

You MUST respond with valid JSON only. No other text.`;

  const userPrompt = `Create a course outline for: "${params.topic}"

=== RESEARCH CONTEXT FROM KNOWLEDGE BASE ===
${params.pipelineContext}
=== END OF RESEARCH CONTEXT ===

${params.facets.length > 0 ? `Key topics identified: ${params.facets.join(", ")}` : ""}

Generate a JSON course outline with this EXACT structure:
{
  "course": {
    "title": "Descriptive Course Title",
    "description": "A compelling 2-3 sentence description of what students will learn",
    "category": "Music Production",
    "skillLevel": "${params.skillLevel}",
    "estimatedDuration": 120
  },
  "modules": [
    {
      "title": "Module Title",
      "description": "What this module covers",
      "orderIndex": 0,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "What this lesson covers",
          "orderIndex": 0,
          "chapters": [
            {
              "title": "Chapter Title",
              "content": "2-3 sentences describing what this chapter teaches",
              "duration": 10,
              "orderIndex": 0
            }
          ]
        }
      ]
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 6000,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  try {
    const parsed = JSON.parse(content);
    
    // Validate structure
    if (!parsed.course || !parsed.modules || !Array.isArray(parsed.modules)) {
      console.error("Invalid outline structure:", content.substring(0, 500));
      throw new Error("Invalid outline structure - missing course or modules");
    }
    
    // Log what we got
    console.log(`   📚 Generated outline: "${parsed.course.title}"`);
    console.log(`   📦 ${parsed.modules.length} modules, ${parsed.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} lessons`);
    
    return parsed as CourseOutline;
  } catch (parseError) {
    console.error("Failed to parse outline JSON:", parseError);
    console.error("Raw response:", content.substring(0, 1000));
    throw new Error("Failed to parse course outline from AI response");
  }
}

// NOTE: generateOutlineWithPipeline has been removed - use generateOutline instead
// The main generateOutline action now uses the full masterAI pipeline

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
 * Uses the FULL masterAI pipeline (Planner → Retriever → Summarizer → Idea Gen → Critic → Final Writer)
 */
export const expandChapterContent = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    moduleIndex: v.number(),
    lessonIndex: v.number(),
    chapterIndex: v.number(),
    settings: v.optional(chatSettingsValidator), // Pass through user's AI settings
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
    
    // Use user's settings or defaults
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    
    try {
      // Build a detailed prompt for the masterAI pipeline
      const chapterPrompt = `Write detailed educational content for this music production course chapter.

**Course:** ${outline.topic}
**Skill Level:** ${outline.skillLevel}
**Module:** ${module.title}
**Lesson:** ${lesson.title}
**Chapter:** ${chapter.title}

**Chapter Overview:**
${chapter.content}

---

Write 800-1200 words of detailed, educational content for this chapter. The content should:
- Sound like a knowledgeable producer teaching a friend, not like AI-generated text
- Include specific techniques, tips, and real-world examples
- Be appropriate for ${outline.skillLevel} level students
- Be structured with clear sections but flow naturally
- Include any relevant DAW-specific instructions or plugin recommendations

Focus on practical, actionable knowledge that students can immediately apply.`;

      // Call the FULL masterAI pipeline - same as AI chat
      const pipelineResult = await (ctx as any).runAction(
        api.masterAI.index.askMasterAI,
        {
          question: chapterPrompt,
          settings,
          userId: outline.userId,
        }
      ) as { answer: string; citations?: any[]; facetsUsed?: string[]; pipelineMetadata?: any };
      
      const detailedContent = pipelineResult.answer;
      
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
 * Expand all chapters in an outline (PARALLEL batch operation)
 * Processes chapters BY LESSON - all chapters in a lesson expand together
 * Uses the FULL masterAI pipeline for each chapter
 */
export const expandAllChapters = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    queueId: v.id("aiCourseQueue"),
    parallelBatchSize: v.optional(v.number()), // Max chapters per batch (default: 3 for pipeline calls)
    settings: v.optional(chatSettingsValidator), // User's AI settings from the chat
  },
  returns: v.object({
    success: v.boolean(),
    expandedCount: v.number(),
    failedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Lower default batch size since each chapter now runs full pipeline
    const maxBatchSize = args.parallelBatchSize || 3; 
    const settings = args.settings || DEFAULT_CHAT_SETTINGS;
    
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
    const totalChapters = outline.totalChapters;
    
    console.log(`📚 Expanding chapters BY LESSON using FULL masterAI pipeline (preset: ${settings.preset})`);
    
    let expandedCount = 0;
    let failedCount = 0;
    let lessonCount = 0;
    
    // Process BY LESSON - all chapters in a lesson expand together
    for (let mi = 0; mi < outlineData.modules.length; mi++) {
      const module = outlineData.modules[mi];
      
      for (let li = 0; li < module.lessons.length; li++) {
        const lesson = module.lessons[li];
        lessonCount++;
        
        // Collect chapters for this lesson that need expansion
        interface ChapterTask {
          chapterIndex: number;
          chapter: CourseOutlineChapter;
        }
        const lessonChapters: ChapterTask[] = [];
        
        for (let ci = 0; ci < lesson.chapters.length; ci++) {
          const chapter = lesson.chapters[ci];
          // Skip if already has detailed content
          if (!(chapter.hasDetailedContent && chapter.wordCount && chapter.wordCount > 300)) {
            lessonChapters.push({ chapterIndex: ci, chapter });
          } else {
            expandedCount++; // Already expanded
          }
        }
        
        if (lessonChapters.length === 0) {
          console.log(`  ✓ Lesson "${lesson.title}" - all chapters already expanded`);
          continue;
        }
        
        console.log(`📖 Module ${mi + 1}, Lesson ${li + 1}: "${lesson.title}" - expanding ${lessonChapters.length} chapters in parallel`);
        
        // Update progress
        await (ctx as any).runMutation(
          api.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "expanding_content",
            progress: {
              currentStep: `Module ${mi + 1}, Lesson ${li + 1}`,
              totalSteps: totalChapters,
              completedSteps: expandedCount + failedCount,
              currentChapter: `${lesson.title} (${lessonChapters.length} chapters)`,
            },
          }
        );
        
        // Process all chapters in this lesson in parallel (up to maxBatchSize)
        const batches: ChapterTask[][] = [];
        for (let i = 0; i < lessonChapters.length; i += maxBatchSize) {
          batches.push(lessonChapters.slice(i, i + maxBatchSize));
        }
        
        for (const batch of batches) {
          const batchPromises = batch.map(async (task) => {
            try {
              // Run the FULL masterAI pipeline for each chapter
              const result = await (ctx as any).runAction(
                api.aiCourseBuilder.expandChapterContent,
                {
                  outlineId: args.outlineId,
                  moduleIndex: mi,
                  lessonIndex: li,
                  chapterIndex: task.chapterIndex,
                  settings, // Pass through user's AI settings
                }
              ) as { success: boolean; content?: string; wordCount?: number; error?: string };
              
              return { success: result.success, chapter: task.chapter.title };
            } catch (error) {
              console.error(`Failed to expand chapter: ${task.chapter.title}`, error);
              return { success: false, chapter: task.chapter.title, error };
            }
          });
          
          // Wait for all in batch to complete
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Count results
          for (const result of batchResults) {
            if (result.status === "fulfilled" && result.value.success) {
              expandedCount++;
              console.log(`    ✓ ${result.value.chapter}`);
            } else {
              failedCount++;
              console.log(`    ✗ Failed: ${result.status === "fulfilled" ? result.value.chapter : "unknown"}`);
            }
          }
        }
        
        // Small delay between lessons to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`✅ Expansion complete: ${expandedCount} expanded, ${failedCount} failed across ${lessonCount} lessons`);
    
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
      
      // Debug logging
      console.log("=== CREATE COURSE FROM OUTLINE ===");
      console.log("📋 Outline data received:");
      console.log("   Title:", outlineData.course?.title);
      console.log("   Description:", outlineData.course?.description?.substring(0, 100) + "...");
      console.log("   Category:", outlineData.course?.category);
      console.log("   Skill Level:", outlineData.course?.skillLevel);
      console.log("   Modules count:", outlineData.modules?.length);
      
      if (outlineData.modules && outlineData.modules.length > 0) {
        console.log("   First module:", outlineData.modules[0]?.title);
        console.log("   First module lessons:", outlineData.modules[0]?.lessons?.length);
        if (outlineData.modules[0]?.lessons?.[0]) {
          console.log("   First lesson:", outlineData.modules[0].lessons[0].title);
          console.log("   First lesson chapters:", outlineData.modules[0].lessons[0].chapters?.length);
        }
      } else {
        console.log("⚠️ NO MODULES IN OUTLINE DATA!");
        console.log("   Raw outline:", JSON.stringify(outline.outline).substring(0, 500));
      }
      
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
      
      console.log("✅ Course creation result:", result);
      
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
// NOTE: All course generation now uses the FULL masterAI pipeline
// - generateOutline calls api.masterAI.index.askMasterAI for outline generation
// - expandChapterContent calls api.masterAI.index.askMasterAI for chapter content
// This ensures the same quality, models, and pipeline stages as the main AI chat
// =============================================================================
