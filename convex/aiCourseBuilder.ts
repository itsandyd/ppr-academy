"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";
import { marked } from "marked";
import { 
  chatSettingsValidator, 
  DEFAULT_CHAT_SETTINGS,
  type ChatSettings,
  type PlannerOutput,
  type RetrieverOutput,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
} from "./masterAI/types";

// Configure marked for safe HTML output
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

/**
 * Convert markdown to HTML for storage
 * This ensures AI-generated content is compatible with TipTap/WYSIWYG editors
 */
function markdownToHtml(markdown: string): string {
  try {
    const html = marked.parse(markdown);
    // marked.parse returns string | Promise<string>, but with sync options it's string
    return typeof html === 'string' ? html : markdown;
  } catch (error) {
    console.error("Error converting markdown to HTML:", error);
    return markdown; // Fallback to original if conversion fails
  }
}

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

  const systemPrompt = `You are an expert course curriculum designer. Create COMPREHENSIVE course outlines with detailed chapter descriptions.

STRUCTURE REQUIREMENTS:
- ${params.targetModules + 1} modules total: 1 Introduction module + ${params.targetModules} content modules
- ${params.targetLessonsPerModule} lessons per module (no exceptions)
- 3 chapters per lesson (2-4 acceptable)
- Skill level: ${params.skillLevel}

CHAPTER CONTENT: Each chapter needs a detailed 4-6 sentence description including:
- Specific techniques, tools, plugin names, frequency values, settings
- Concrete actions the student will take
- Expected outcome/deliverable
- Why it matters

NO numbering prefixes in titles (not "Module 1:" or "Lesson 1:").

Output valid JSON only.`;

  const userPrompt = `Create a comprehensive course outline for: "${params.topic}"

RESEARCH CONTEXT:
${params.pipelineContext.slice(0, 4000)}

${params.facets.length > 0 ? `Topics: ${params.facets.join(", ")}` : ""}

JSON STRUCTURE:
{
  "course": {"title": "...", "description": "2-3 sentences", "category": "Music Production", "skillLevel": "${params.skillLevel}", "estimatedDuration": 120},
  "modules": [
    {
      "title": "Introduction",
      "description": "Course overview and getting started",
      "orderIndex": 0,
      "lessons": [
        {
          "title": "Welcome and Course Overview",
          "description": "...",
          "orderIndex": 0,
          "chapters": [
            {"title": "...", "content": "DETAILED 4-6 sentence description with specifics...", "duration": 5, "orderIndex": 0},
            {"title": "...", "content": "...", "duration": 5, "orderIndex": 1},
            {"title": "...", "content": "...", "duration": 5, "orderIndex": 2}
          ]
        },
        // ... ${params.targetLessonsPerModule - 1} more lessons with 3 chapters each
      ]
    },
    // ... ${params.targetModules} more content modules
  ]
}

EXAMPLE CHAPTER CONTENT (this level of detail required):
"Build a powerful kick by layering 3 elements: sub layer (sine at 40-60Hz), mid punch (filtered 80-200Hz), and click/transient. Use Drum Rack to organize, adjust ADSR envelopes, apply sidechain compression at 4:1 ratio with fast attack. Result: kick with weight, punch, and crisp attack."

Generate the COMPLETE outline with ALL ${params.targetModules + 1} modules, ${params.targetLessonsPerModule} lessons each, 3 chapters per lesson.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 16000, // Increased for comprehensive outlines with detailed chapter content
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
    
    // Detailed structure validation and logging
    const expectedModules = params.targetModules + 1;
    const expectedLessonsPerModule = params.targetLessonsPerModule;
    
    let totalLessons = 0;
    let totalChapters = 0;
    const structureIssues: string[] = [];
    
    parsed.modules.forEach((module: any, mi: number) => {
      const lessonCount = module.lessons?.length || 0;
      totalLessons += lessonCount;
      
      if (lessonCount < expectedLessonsPerModule) {
        structureIssues.push(`Module ${mi + 1} "${module.title}" has ${lessonCount} lessons (expected ${expectedLessonsPerModule})`);
      }
      
      module.lessons?.forEach((lesson: any, li: number) => {
        const chapterCount = lesson.chapters?.length || 0;
        totalChapters += chapterCount;
        
        if (chapterCount < 2) {
          structureIssues.push(`Lesson ${mi + 1}.${li + 1} "${lesson.title}" has ${chapterCount} chapters (expected 2-4)`);
        }
        
        // Check for short chapter content
        lesson.chapters?.forEach((chapter: any, ci: number) => {
          const contentLength = chapter.content?.length || 0;
          if (contentLength < 200) {
            structureIssues.push(`Chapter ${mi + 1}.${li + 1}.${ci + 1} "${chapter.title}" has short content (${contentLength} chars)`);
          }
        });
      });
    });
    
    // Log summary
    console.log(`   📚 Generated outline: "${parsed.course.title}"`);
    console.log(`   📦 ${parsed.modules.length}/${expectedModules} modules, ${totalLessons} lessons, ${totalChapters} chapters`);
    
    if (structureIssues.length > 0) {
      console.warn(`   ⚠️ STRUCTURE ISSUES (${structureIssues.length}):`);
      structureIssues.slice(0, 10).forEach(issue => console.warn(`      - ${issue}`));
      if (structureIssues.length > 10) {
        console.warn(`      ... and ${structureIssues.length - 10} more issues`);
      }
    } else {
      console.log(`   ✅ Outline structure meets all requirements`);
    }
    
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

// =============================================================================
// EXPAND EXISTING COURSE - Generate content for chapters in an existing course
// =============================================================================

/**
 * Get course structure for expansion
 */
export const getCourseStructureForExpansion = action({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    success: v.boolean(),
    course: v.optional(v.object({
      _id: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      skillLevel: v.optional(v.string()),
    })),
    modules: v.optional(v.array(v.object({
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
    }))),
    totalChapters: v.optional(v.number()),
    chaptersWithContent: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get course
      const course = await (ctx as any).runQuery(
        internal.courses.getCourseById,
        { courseId: args.courseId }
      ) as { _id: Id<"courses">; title: string; description?: string; skillLevel?: string } | null;
      
      if (!course) {
        return { success: false, error: "Course not found" };
      }
      
      // Get modules
      const modules = await (ctx as any).runQuery(
        internal.courses.getModulesByCourseInternal,
        { courseId: args.courseId }
      ) as Array<{ _id: Id<"courseModules">; title: string; description?: string; position: number }>;
      
      let totalChapters = 0;
      let chaptersWithContent = 0;
      
      // Build full structure
      const fullModules = await Promise.all(modules.map(async (mod) => {
        // Get lessons for module
        const lessons = await (ctx as any).runQuery(
          internal.courses.getLessonsByModuleInternal,
          { moduleId: mod._id }
        ) as Array<{ _id: Id<"courseLessons">; title: string; description?: string; position: number }>;
        
        const lessonsWithChapters = await Promise.all(lessons.map(async (lesson) => {
          // Get chapters for lesson
          const chapters = await (ctx as any).runQuery(
            internal.courses.getChaptersByLessonInternal,
            { lessonId: lesson._id }
          ) as Array<{ _id: Id<"courseChapters">; title: string; description?: string; position: number }>;
          
          const chaptersWithStatus = chapters.map(ch => {
            const wordCount = ch.description?.split(/\s+/).length || 0;
            const hasContent = wordCount > 50; // Consider content "real" if > 50 words
            
            totalChapters++;
            if (hasContent) chaptersWithContent++;
            
            return {
              _id: ch._id,
              title: ch.title,
              description: ch.description,
              position: ch.position,
              hasContent,
              wordCount,
            };
          });
          
          return {
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            position: lesson.position,
            chapters: chaptersWithStatus,
          };
        }));
        
        return {
          _id: mod._id,
          title: mod.title,
          description: mod.description,
          position: mod.position,
          lessons: lessonsWithChapters,
        };
      }));
      
      return {
        success: true,
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
    } catch (error) {
      console.error("Error getting course structure:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Expand a single chapter in an existing course using the full masterAI pipeline
 */
export const expandExistingChapter = action({
  args: {
    chapterId: v.id("courseChapters"),
    courseTitle: v.string(),
    moduleTitle: v.string(),
    lessonTitle: v.string(),
    skillLevel: v.optional(v.string()),
    settings: v.optional(chatSettingsValidator),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    
    try {
      // Get chapter details
      const chapter = await (ctx as any).runQuery(
        internal.courses.getChapterByIdInternal,
        { chapterId: args.chapterId }
      ) as { _id: Id<"courseChapters">; title: string; description?: string } | null;
      
      if (!chapter) {
        return { success: false, error: "Chapter not found" };
      }
      
      const skillLevel = args.skillLevel || "intermediate";
      
      // Build the prompt for the full pipeline
      const chapterPrompt = `Write comprehensive, engaging educational content for a course chapter.

COURSE: ${args.courseTitle}
MODULE: ${args.moduleTitle}
LESSON: ${args.lessonTitle}
CHAPTER: ${chapter.title}
SKILL LEVEL: ${skillLevel}

${chapter.description ? `Current outline/notes: ${chapter.description}` : ""}

Create detailed chapter content that:
1. Explains concepts clearly for ${skillLevel} level students
2. Provides practical examples and applications
3. Uses a conversational, expert tone (like an experienced instructor)
4. Includes specific techniques, tips, and best practices
5. Is approximately 800-1200 words in length
6. Flows naturally without excessive bullet points or headers

Write the content directly - no introductions like "In this chapter..." or conclusions like "In summary...".`;

      // Call the FULL masterAI pipeline
      const result = await (ctx as any).runAction(
        api.masterAI.index.askMasterAI,
        {
          question: chapterPrompt,
          settings: {
            ...settings,
            responseStyle: "conversational" as const,
          },
          userId: "system-course-builder",
          conversationId: `expand-chapter-${args.chapterId}`,
        }
      ) as { answer: string };
      
      if (!result.answer) {
        throw new Error("No content generated from AI pipeline");
      }
      
      // Convert markdown to HTML for compatibility with TipTap editor
      const htmlContent = markdownToHtml(result.answer);
      
      // Update the chapter with the new content (as HTML)
      await (ctx as any).runMutation(
        internal.courses.updateChapterContentInternal,
        {
          chapterId: args.chapterId,
          description: htmlContent,
        }
      );
      
      const wordCount = result.answer.split(/\s+/).length;
      console.log(`✓ Expanded chapter "${chapter.title}" (${wordCount} words, converted to HTML)`);
      
      return {
        success: true,
        content: result.answer,
        wordCount,
      };
      
    } catch (error) {
      console.error("Error expanding chapter:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Expand all chapters in an existing course that don't have content
 */
export const expandExistingCourseChapters = action({
  args: {
    courseId: v.id("courses"),
    onlyEmpty: v.optional(v.boolean()), // If true, only expand chapters with < 50 words
    parallelBatchSize: v.optional(v.number()),
    settings: v.optional(chatSettingsValidator),
  },
  returns: v.object({
    success: v.boolean(),
    expandedCount: v.number(),
    skippedCount: v.number(),
    failedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    const maxBatchSize = args.parallelBatchSize || 2;
    const onlyEmpty = args.onlyEmpty !== false; // Default to true
    
    try {
      // Get course structure
      const structure = await (ctx as any).runAction(
        api.aiCourseBuilder.getCourseStructureForExpansion,
        { courseId: args.courseId }
      ) as {
        success: boolean;
        course?: { _id: Id<"courses">; title: string; description?: string; skillLevel?: string };
        modules?: Array<{
          _id: Id<"courseModules">;
          title: string;
          lessons: Array<{
            _id: Id<"courseLessons">;
            title: string;
            chapters: Array<{
              _id: Id<"courseChapters">;
              title: string;
              hasContent: boolean;
            }>;
          }>;
        }>;
        totalChapters?: number;
        chaptersWithContent?: number;
        error?: string;
      };
      
      if (!structure.success || !structure.course || !structure.modules) {
        return { 
          success: false, 
          expandedCount: 0, 
          skippedCount: 0, 
          failedCount: 0, 
          error: structure.error || "Failed to get course structure" 
        };
      }
      
      console.log(`\n🚀 Starting chapter expansion for: ${structure.course.title}`);
      console.log(`   Total chapters: ${structure.totalChapters}, with content: ${structure.chaptersWithContent}`);
      
      let expandedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      // Process lesson by lesson
      for (const mod of structure.modules) {
        for (const lesson of mod.lessons) {
          // Get chapters needing expansion
          const chaptersToExpand = lesson.chapters.filter(ch => {
            if (onlyEmpty && ch.hasContent) {
              return false;
            }
            return true;
          });
          
          if (chaptersToExpand.length === 0) {
            skippedCount += lesson.chapters.length;
            continue;
          }
          
          console.log(`\n📖 Processing: ${mod.title} → ${lesson.title} (${chaptersToExpand.length} chapters)`);
          
          // Process in batches
          for (let i = 0; i < chaptersToExpand.length; i += maxBatchSize) {
            const batch = chaptersToExpand.slice(i, i + maxBatchSize);
            
            const batchPromises = batch.map(ch => 
              (ctx as any).runAction(
                api.aiCourseBuilder.expandExistingChapter,
                {
                  chapterId: ch._id,
                  courseTitle: structure.course!.title,
                  moduleTitle: mod.title,
                  lessonTitle: lesson.title,
                  skillLevel: structure.course!.skillLevel,
                  settings,
                }
              ) as Promise<{ success: boolean }>
            );
            
            const results = await Promise.allSettled(batchPromises);
            
            for (let j = 0; j < results.length; j++) {
              const result = results[j];
              if (result.status === "fulfilled" && result.value.success) {
                expandedCount++;
              } else {
                failedCount++;
                console.error(`   ✗ Failed: ${batch[j].title}`);
              }
            }
          }
          
          // Small delay between lessons
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`\n✅ Expansion complete: ${expandedCount} expanded, ${skippedCount} skipped, ${failedCount} failed`);
      
      return {
        success: failedCount === 0,
        expandedCount,
        skippedCount,
        failedCount,
      };
      
    } catch (error) {
      console.error("Error expanding course chapters:", error);
      return { 
        success: false, 
        expandedCount: 0, 
        skippedCount: 0, 
        failedCount: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Reformat existing chapter content to add proper markdown structure
 * This is MUCH faster than regenerating since it just adds formatting
 */
export const reformatChapterContent = action({
  args: {
    chapterId: v.id("courseChapters"),
    chapterTitle: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get chapter details
      const chapter = await (ctx as any).runQuery(
        internal.courses.getChapterByIdInternal,
        { chapterId: args.chapterId }
      ) as { _id: Id<"courseChapters">; title: string; description?: string } | null;
      
      if (!chapter) {
        return { success: false, error: "Chapter not found" };
      }
      
      if (!chapter.description || chapter.description.trim().length < 100) {
        return { success: false, error: "Chapter has no content to reformat" };
      }
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const systemPrompt = `You are a content formatter. Your ONLY job is to add proper markdown formatting to existing educational content.

DO NOT:
- Change the actual content or meaning
- Add new information
- Remove any information
- Rewrite sentences
- Change the tone or style

DO:
- Add a main # header with a compelling chapter title (based on the content, not just the chapter name)
- Add ## subheadings to break content into logical sections
- Add ### for sub-sections where appropriate
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis where natural
- Convert appropriate content to bullet points or numbered lists
- Add > blockquotes for important tips or callouts
- Add \`code\` formatting for technical terms, settings, or values
- Add horizontal rules (---) between major sections if helpful
- Ensure proper paragraph spacing

Keep ALL the original content - just make it beautifully formatted and easy to read.`;

      const userPrompt = `Please reformat this chapter content with proper markdown structure:

CHAPTER TITLE: ${args.chapterTitle}

CONTENT TO REFORMAT:
${chapter.description}

Remember: Keep all the original content, just add markdown formatting to make it well-structured and readable.`;

      console.log(`🔄 Reformatting: "${args.chapterTitle}" (${chapter.description.length} chars)`);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast and cheap for formatting tasks
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Low temperature for consistent formatting
        max_tokens: 8000,
      });

      const formattedContent = completion.choices[0].message?.content;
      
      if (!formattedContent) {
        return { success: false, error: "No formatted content returned" };
      }

      // Convert markdown to HTML for compatibility with TipTap editor
      const htmlContent = markdownToHtml(formattedContent);

      // Save the formatted content (as HTML)
      await (ctx as any).runMutation(
        internal.courses.updateChapterDescription,
        { chapterId: args.chapterId, description: htmlContent }
      );

      const wordCount = formattedContent.split(/\s+/).length;
      console.log(`✓ Reformatted "${args.chapterTitle}" (${wordCount} words, converted to HTML)`);

      return {
        success: true,
        content: formattedContent,
        wordCount,
      };

    } catch (error) {
      console.error("Error reformatting chapter:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Reformat all chapters in a course to add proper markdown structure
 */
export const reformatCourseChapters = action({
  args: {
    courseId: v.id("courses"),
    parallelBatchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    reformattedCount: v.number(),
    skippedCount: v.number(),
    failedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const maxBatchSize = args.parallelBatchSize || 3; // Can be higher since reformatting is cheaper
    
    try {
      // Get course structure
      const structure = await (ctx as any).runAction(
        api.aiCourseBuilder.getCourseStructureForExpansion,
        { courseId: args.courseId }
      ) as {
        success: boolean;
        course?: { _id: Id<"courses">; title: string };
        modules?: Array<{
          _id: Id<"courseModules">;
          title: string;
          lessons: Array<{
            _id: Id<"courseLessons">;
            title: string;
            chapters: Array<{
              _id: Id<"courseChapters">;
              title: string;
              hasContent: boolean;
              wordCount: number;
            }>;
          }>;
        }>;
        error?: string;
      };
      
      if (!structure.success || !structure.course || !structure.modules) {
        return { 
          success: false, 
          reformattedCount: 0, 
          skippedCount: 0, 
          failedCount: 0, 
          error: structure.error || "Failed to get course structure" 
        };
      }
      
      console.log(`\n📝 Starting reformat for: ${structure.course.title}`);
      
      let reformattedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      // Collect all chapters with content
      const chaptersToReformat: Array<{
        chapterId: Id<"courseChapters">;
        title: string;
        wordCount: number;
      }> = [];
      
      for (const mod of structure.modules) {
        for (const lesson of mod.lessons) {
          for (const ch of lesson.chapters) {
            if (ch.hasContent && ch.wordCount > 50) {
              chaptersToReformat.push({
                chapterId: ch._id,
                title: ch.title,
                wordCount: ch.wordCount,
              });
            } else {
              skippedCount++;
            }
          }
        }
      }
      
      console.log(`   Found ${chaptersToReformat.length} chapters to reformat, ${skippedCount} skipped (no content)`);
      
      // Process in batches
      for (let i = 0; i < chaptersToReformat.length; i += maxBatchSize) {
        const batch = chaptersToReformat.slice(i, i + maxBatchSize);
        
        console.log(`\n   Batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(chaptersToReformat.length / maxBatchSize)}`);
        
        const results = await Promise.allSettled(
          batch.map(ch =>
            (ctx as any).runAction(
              api.aiCourseBuilder.reformatChapterContent,
              { chapterId: ch.chapterId, chapterTitle: ch.title }
            ) as Promise<{ success: boolean; error?: string }>
          )
        );
        
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const ch = batch[j];
          
          if (result.status === "fulfilled" && result.value.success) {
            reformattedCount++;
            console.log(`   ✓ ${ch.title}`);
          } else {
            failedCount++;
            const error = result.status === "rejected" 
              ? result.reason?.message 
              : result.value?.error;
            console.log(`   ✗ ${ch.title}: ${error}`);
          }
        }
        
        // Small delay between batches
        if (i + maxBatchSize < chaptersToReformat.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`\n✅ Reformat complete: ${reformattedCount} reformatted, ${skippedCount} skipped, ${failedCount} failed`);
      
      return {
        success: failedCount === 0,
        reformattedCount,
        skippedCount,
        failedCount,
      };
      
    } catch (error) {
      console.error("Error reformatting course chapters:", error);
      return { 
        success: false, 
        reformattedCount: 0, 
        skippedCount: 0, 
        failedCount: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

// =============================================================================
// BACKGROUND JOB SYSTEM - Runs in background without browser connection
// =============================================================================

/**
 * Internal action to process outline generation in the background
 * This is called by the scheduler and runs completely server-side
 */
export const processOutlineInBackground = internalAction({
  args: {
    queueId: v.id("aiCourseQueue"),
    settings: v.optional(chatSettingsValidator),
  },
  handler: async (ctx, args) => {
    console.log(`\n🚀 [Background] Starting outline generation for queue ${args.queueId}`);
    
    try {
      // Update status to generating
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.updateQueueStatus,
        {
          queueId: args.queueId,
          status: "generating_outline",
          progress: {
            currentStep: "Starting pipeline...",
            totalSteps: 8,
            completedSteps: 0,
          },
        }
      );

      // Run the full pipeline - generateOutline updates the queue status itself
      // We wrap in try-catch to handle large response issues
      let success = false;
      let errorMessage = "";
      
      try {
        const result = await (ctx as any).runAction(
          api.aiCourseBuilder.generateOutline,
          {
            queueId: args.queueId,
            settings: args.settings || DEFAULT_CHAT_SETTINGS,
          }
        ) as { success: boolean; outlineId?: Id<"aiCourseOutlines">; error?: string };
        
        success = result.success;
        errorMessage = result.error || "";
        
        if (success) {
          console.log(`✅ [Background] Outline generation completed: ${result.outlineId}`);
        }
      } catch (actionError) {
        // The action might have succeeded but the response was too large
        // Check the queue item status to see if it actually worked
        console.log(`⚠️ [Background] Action call error, checking queue status...`);
        
        const queueItem = await (ctx as any).runQuery(
          internal.aiCourseBuilderQueries.getQueueItemInternal,
          { queueId: args.queueId }
        ) as { status: string; outlineId?: Id<"aiCourseOutlines">; error?: string } | null;
        
        if (queueItem?.status === "outline_ready" && queueItem?.outlineId) {
          // The action actually succeeded! The error was just in returning the result
          console.log(`✅ [Background] Outline generation actually succeeded (status check): ${queueItem.outlineId}`);
          success = true;
        } else if (queueItem?.status === "failed") {
          success = false;
          errorMessage = queueItem.error || "Generation failed";
        } else {
          // Unknown state, re-throw the error
          throw actionError;
        }
      }

      if (!success && errorMessage) {
        console.error(`❌ [Background] Outline generation failed: ${errorMessage}`);
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: errorMessage || "Unknown error during generation",
          }
        );
      }
    } catch (error) {
      console.error(`❌ [Background] Fatal error:`, error);
      
      // Try to update status, but don't fail if this also errors
      try {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        );
      } catch (updateError) {
        console.error(`❌ [Background] Failed to update status:`, updateError);
      }
    }
  },
});

/**
 * Internal action to expand all chapters in background
 * This runs completely server-side without browser connection
 */
export const processChapterExpansionInBackground = internalAction({
  args: {
    queueId: v.id("aiCourseQueue"),
    outlineId: v.id("aiCourseOutlines"),
    settings: v.optional(chatSettingsValidator),
    parallelBatchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log(`\n🚀 [Background] Starting chapter expansion for queue ${args.queueId}`);
    
    try {
      // Update status
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.updateQueueStatus,
        {
          queueId: args.queueId,
          status: "expanding_content",
          progress: {
            currentStep: "Expanding chapters...",
            totalSteps: 100,
            completedSteps: 0,
          },
        }
      );

      // Run chapter expansion with error recovery
      let success = false;
      let expandedCount = 0;
      let errorMessage = "";
      
      try {
        const result = await (ctx as any).runAction(
          api.aiCourseBuilder.expandAllChapters,
          {
            outlineId: args.outlineId,
            settings: args.settings,
            parallelBatchSize: args.parallelBatchSize,
            queueId: args.queueId,
          }
        ) as { success: boolean; expandedCount?: number; error?: string };
        
        success = result.success;
        expandedCount = result.expandedCount || 0;
        errorMessage = result.error || "";
      } catch (actionError) {
        // Check if expansion actually worked despite the error
        console.log(`⚠️ [Background] Action call error, checking outline status...`);
        
        const outline = await (ctx as any).runQuery(
          internal.aiCourseBuilderQueries.getOutlineInternal,
          { outlineId: args.outlineId }
        ) as { expandedChapters?: number; totalChapters?: number } | null;
        
        if (outline && outline.expandedChapters && outline.expandedChapters > 0) {
          success = true;
          expandedCount = outline.expandedChapters;
          console.log(`✅ [Background] Expansion actually succeeded: ${expandedCount} chapters`);
        } else {
          throw actionError;
        }
      }

      if (success) {
        console.log(`✅ [Background] Chapter expansion completed: ${expandedCount} chapters`);
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "ready_to_create",
            progress: {
              currentStep: "All chapters expanded",
              totalSteps: expandedCount,
              completedSteps: expandedCount,
            },
          }
        );
      } else {
        console.error(`❌ [Background] Chapter expansion failed: ${errorMessage}`);
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: errorMessage || "Unknown error during expansion",
          }
        );
      }
    } catch (error) {
      console.error(`❌ [Background] Fatal error:`, error);
      try {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        );
      } catch (updateError) {
        console.error(`❌ [Background] Failed to update status:`, updateError);
      }
    }
  },
});

/**
 * Internal action to process existing course chapter expansion in background
 */
export const processExistingCourseExpansionInBackground = internalAction({
  args: {
    queueId: v.id("aiCourseQueue"),
    courseId: v.id("courses"),
    settings: v.optional(chatSettingsValidator),
    parallelBatchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log(`\n🚀 [Background] Starting existing course expansion for queue ${args.queueId}`);

    try {
      // Update status
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.updateQueueStatus,
        {
          queueId: args.queueId,
          status: "expanding_content",
          progress: {
            currentStep: "Expanding existing course chapters...",
            totalSteps: 100,
            completedSteps: 0,
          },
        }
      );

      // Run expansion with error recovery
      let success = false;
      let expandedCount = 0;
      let skippedCount = 0;
      let errorMessage = "";

      try {
        const result = await (ctx as any).runAction(
          api.aiCourseBuilder.expandExistingCourseChapters,
          {
            courseId: args.courseId,
            settings: args.settings,
            parallelBatchSize: args.parallelBatchSize,
            queueId: args.queueId,
          }
        ) as { success: boolean; expandedCount?: number; skippedCount?: number; error?: string };

        success = result.success;
        expandedCount = result.expandedCount || 0;
        skippedCount = result.skippedCount || 0;
        errorMessage = result.error || "";
      } catch (actionError) {
        // Check if expansion actually worked
        console.log(`⚠️ [Background] Action call error, checking queue status...`);

        const queueItem = await (ctx as any).runQuery(
          internal.aiCourseBuilderQueries.getQueueItemInternal,
          { queueId: args.queueId }
        ) as { status: string; progress?: { completedSteps?: number } } | null;

        if (queueItem?.progress?.completedSteps && queueItem.progress.completedSteps > 0) {
          success = true;
          expandedCount = queueItem.progress.completedSteps;
          console.log(`✅ [Background] Expansion actually succeeded: ${expandedCount} chapters`);
        } else {
          throw actionError;
        }
      }

      if (success) {
        console.log(`✅ [Background] Existing course expansion completed: ${expandedCount} expanded, ${skippedCount} skipped`);
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "completed",
            progress: {
              currentStep: "Expansion complete",
              totalSteps: expandedCount + skippedCount,
              completedSteps: expandedCount + skippedCount,
            },
          }
        );
      } else {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: errorMessage || "Unknown error",
          }
        );
      }
    } catch (error) {
      console.error(`❌ [Background] Fatal error:`, error);
      try {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        );
      } catch (updateError) {
        console.error(`❌ [Background] Failed to update status:`, updateError);
      }
    }
  },
});

/**
 * Internal action to process reformatting in background with chunking
 * Processes a limited batch of chapters, then schedules continuation if needed
 * This prevents timeout issues for courses with many chapters
 */
export const processReformattingInBackground = internalAction({
  args: {
    queueId: v.id("aiCourseQueue"),
    courseId: v.id("courses"),
    parallelBatchSize: v.optional(v.number()),
    // Track progress across scheduled runs
    processedChapterIds: v.optional(v.array(v.string())), // Already processed chapter IDs
    totalChapters: v.optional(v.number()),
    reformattedCount: v.optional(v.number()),
    skippedCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxBatchSize = args.parallelBatchSize || 5; // Process 5 chapters per scheduled run
    const maxChaptersPerRun = 15; // Process max 15 chapters per action invocation to stay well under timeout
    const processedIds = new Set(args.processedChapterIds || []);
    let reformattedCount = args.reformattedCount || 0;
    let skippedCount = args.skippedCount || 0;
    let failedCount = args.failedCount || 0;

    console.log(`\n📝 [Background] Reformatting chapters for queue ${args.queueId}`);
    console.log(`   Already processed: ${processedIds.size}, reformatted: ${reformattedCount}, skipped: ${skippedCount}, failed: ${failedCount}`);

    try {
      // Get course structure
      const structure = await (ctx as any).runAction(
        api.aiCourseBuilder.getCourseStructureForExpansion,
        { courseId: args.courseId }
      ) as {
        success: boolean;
        course?: { _id: Id<"courses">; title: string };
        modules?: Array<{
          _id: Id<"courseModules">;
          title: string;
          lessons: Array<{
            _id: Id<"courseLessons">;
            title: string;
            chapters: Array<{
              _id: Id<"courseChapters">;
              title: string;
              hasContent: boolean;
              wordCount: number;
            }>;
          }>;
        }>;
        error?: string;
      };

      if (!structure.success || !structure.course || !structure.modules) {
        throw new Error(structure.error || "Failed to get course structure");
      }

      // Collect all chapters that need reformatting (not yet processed)
      const chaptersToReformat: Array<{
        chapterId: Id<"courseChapters">;
        title: string;
        wordCount: number;
      }> = [];

      let totalChapters = args.totalChapters || 0;

      for (const mod of structure.modules) {
        for (const lesson of mod.lessons) {
          for (const ch of lesson.chapters) {
            if (!args.totalChapters) {
              // First run - count total chapters
              if (ch.hasContent && ch.wordCount > 50) {
                totalChapters++;
              }
            }

            // Skip already processed chapters
            if (processedIds.has(ch._id)) {
              continue;
            }

            if (ch.hasContent && ch.wordCount > 50) {
              chaptersToReformat.push({
                chapterId: ch._id,
                title: ch.title,
                wordCount: ch.wordCount,
              });
            } else if (!processedIds.has(ch._id)) {
              // Mark as skipped
              skippedCount++;
              processedIds.add(ch._id);
            }
          }
        }
      }

      // Use calculated total if this is first run
      if (!args.totalChapters) {
        totalChapters = totalChapters; // Keep the calculated value
      }

      console.log(`   Found ${chaptersToReformat.length} chapters remaining to reformat`);

      // Update progress
      await (ctx as any).runMutation(
        internal.aiCourseBuilderQueries.updateQueueStatus,
        {
          queueId: args.queueId,
          status: "reformatting",
          progress: {
            currentStep: `Reformatting chapters (${reformattedCount + failedCount}/${totalChapters})`,
            totalSteps: totalChapters,
            completedSteps: reformattedCount + failedCount,
          },
        }
      );

      // If no more chapters to process, we're done!
      if (chaptersToReformat.length === 0) {
        console.log(`✅ [Background] Reformatting complete: ${reformattedCount} reformatted, ${skippedCount} skipped, ${failedCount} failed`);

        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "completed",
            progress: {
              currentStep: `Reformatting complete`,
              totalSteps: totalChapters,
              completedSteps: reformattedCount + failedCount,
            },
          }
        );
        return;
      }

      // Process up to maxChaptersPerRun in this invocation
      const chaptersThisRun = chaptersToReformat.slice(0, maxChaptersPerRun);
      console.log(`   Processing ${chaptersThisRun.length} chapters in this run`);

      // Process in batches of maxBatchSize
      for (let i = 0; i < chaptersThisRun.length; i += maxBatchSize) {
        const batch = chaptersThisRun.slice(i, i + maxBatchSize);

        console.log(`   Batch ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(chaptersThisRun.length / maxBatchSize)}`);

        const results = await Promise.allSettled(
          batch.map(ch =>
            (ctx as any).runAction(
              api.aiCourseBuilder.reformatChapterContent,
              { chapterId: ch.chapterId, chapterTitle: ch.title }
            ) as Promise<{ success: boolean; error?: string }>
          )
        );

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const ch = batch[j];

          processedIds.add(ch.chapterId);

          if (result.status === "fulfilled" && result.value.success) {
            reformattedCount++;
            console.log(`   ✓ ${ch.title}`);
          } else {
            failedCount++;
            const error = result.status === "rejected"
              ? result.reason?.message
              : result.value?.error;
            console.log(`   ✗ ${ch.title}: ${error}`);
          }
        }

        // Update progress after each batch
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "reformatting",
            progress: {
              currentStep: `Reformatting chapters (${reformattedCount + failedCount}/${totalChapters})`,
              totalSteps: totalChapters,
              completedSteps: reformattedCount + failedCount,
            },
          }
        );

        // Small delay between batches
        if (i + maxBatchSize < chaptersThisRun.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Check if there are more chapters to process
      const remainingChapters = chaptersToReformat.length - chaptersThisRun.length;

      if (remainingChapters > 0) {
        console.log(`📅 [Background] Scheduling continuation: ${remainingChapters} chapters remaining`);

        // Schedule the next batch
        await ctx.scheduler.runAfter(100, internal.aiCourseBuilder.processReformattingInBackground, {
          queueId: args.queueId,
          courseId: args.courseId,
          parallelBatchSize: args.parallelBatchSize,
          processedChapterIds: Array.from(processedIds),
          totalChapters,
          reformattedCount,
          skippedCount,
          failedCount,
        });
      } else {
        // We're done!
        console.log(`✅ [Background] Reformatting complete: ${reformattedCount} reformatted, ${skippedCount} skipped, ${failedCount} failed`);

        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "completed",
            progress: {
              currentStep: `Reformatting complete`,
              totalSteps: totalChapters,
              completedSteps: reformattedCount + failedCount,
            },
          }
        );
      }

    } catch (error) {
      console.error(`❌ [Background] Fatal error:`, error);
      try {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.updateQueueStatus,
          {
            queueId: args.queueId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }
        );
      } catch (updateError) {
        console.error(`❌ [Background] Failed to update status:`, updateError);
      }
    }
  },
});
