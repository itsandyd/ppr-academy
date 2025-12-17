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

// =============================================================================
// OUTLINE GENERATION WITH FULL AI PIPELINE
// =============================================================================

/**
 * Generate a course outline using the full AI pipeline
 * (Planner → Retriever → Web Research → Summarizer → Idea Generator → Critic)
 * 
 * This uses the same pipeline as the AI chat for rich, context-aware content generation
 */
export const generateOutlineWithPipeline = action({
  args: {
    prompt: v.string(),
    settings: v.optional(chatSettingsValidator),
    userId: v.string(),
    storeId: v.string(),
    queueId: v.optional(v.id("aiCourseQueue")),
  },
  returns: v.object({
    success: v.boolean(),
    outlineId: v.optional(v.id("aiCourseOutlines")),
    outline: v.optional(v.any()),
    error: v.optional(v.string()),
    pipelineMetadata: v.optional(v.object({
      plannerModel: v.optional(v.string()),
      summarizerModel: v.optional(v.string()),
      finalWriterModel: v.optional(v.string()),
      totalChunksProcessed: v.optional(v.number()),
      processingTimeMs: v.optional(v.number()),
      facetsUsed: v.optional(v.array(v.string())),
      webResearchResults: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    const startTime = Date.now();
    
    console.log(`🎓 Course Builder Pipeline starting with preset: ${settings.preset}`);
    console.log(`📝 Prompt: ${args.prompt.substring(0, 100)}...`);
    
    // Extract topic from prompt
    const topicMatch = args.prompt.match(/(?:course (?:on|about) |create (?:me )?a course (?:on|about) )(.+)/i);
    const topic = topicMatch?.[1]?.trim() || args.prompt.slice(0, 100);
    
    // Extract skill level and targets from prompt or use defaults
    const skillLevelMatch = args.prompt.match(/(?:for )?(beginners?|intermediate|advanced)/i);
    const skillLevel = skillLevelMatch ? skillLevelMatch[1].toLowerCase() : "intermediate";
    const targetModules = 4;
    const targetLessonsPerModule = 3;

    try {
      // ========================================================================
      // STAGE 1: PLANNER - Decompose the course topic into facets
      // ========================================================================
      console.log("📋 Stage 1: Planning course structure...");
      
      const plannerOutput: PlannerOutput = await (ctx as any).runAction(
        internal.masterAI.planner.analyzeQuestion,
        {
          question: `Create a comprehensive course curriculum about: ${args.prompt}. What are the key areas, concepts, and skills that should be covered?`,
          settings,
        }
      );
      
      console.log(`   Intent: ${plannerOutput.intent}`);
      console.log(`   Facets: ${plannerOutput.facets.map(f => f.name).join(", ")}`);
      
      // ========================================================================
      // STAGE 2 + 2.5: RETRIEVER + WEB RESEARCH (IN PARALLEL)
      // ========================================================================
      console.log("🔍 Stage 2: Retrieving knowledge + Web research...");
      
      const [retrieverOutput, webResearchResult] = await Promise.all([
        // Retriever
        (ctx as any).runAction(
          internal.masterAI.retriever.retrieveContent,
          { plan: plannerOutput, settings }
        ) as Promise<RetrieverOutput>,
        
        // Web Research (if enabled)
        settings.enableWebResearch
          ? (ctx as any).runAction(
              internal.masterAI.webResearch.researchTopic,
              {
                query: args.prompt,
                facets: plannerOutput.facets.map(f => ({
                  name: f.name,
                  queryHint: f.queryHint,
                })),
                maxResultsPerFacet: settings.webSearchMaxResults || 3,
              }
            )
          : Promise.resolve(null),
      ]);
      
      console.log(`   Total chunks retrieved: ${retrieverOutput.totalChunksRetrieved}`);
      
      let webResearchContext = "";
      let webResearchCount = 0;
      if (webResearchResult) {
        webResearchCount = webResearchResult.totalResults;
        console.log(`   🌐 Web results: ${webResearchCount}`);
        
        // Build web research context string
        for (const facetResults of webResearchResult.research || []) {
          for (const result of facetResults.results || []) {
            webResearchContext += `\n[Web Source: ${result.title}]\n${result.content}\n`;
          }
        }
      }
      
      // ========================================================================
      // STAGE 3: SUMMARIZER - Synthesize retrieved content
      // ========================================================================
      console.log("📝 Stage 3: Summarizing knowledge...");
      
      let summarizerOutput: SummarizerOutput | undefined;
      if (retrieverOutput.totalChunksRetrieved > 0) {
        summarizerOutput = await (ctx as any).runAction(
          internal.masterAI.summarizer.summarizeContent,
          {
            retrieverOutput,
            settings,
            originalQuestion: args.prompt,
          }
        );
        console.log(`   Summaries generated: ${summarizerOutput?.summaries.length || 0}`);
      }
      
      // ========================================================================
      // STAGE 4: IDEA GENERATOR (if creative mode enabled)
      // ========================================================================
      let ideaGeneratorOutput: IdeaGeneratorOutput | undefined;
      if (settings.enableCreativeMode && summarizerOutput) {
        console.log("💡 Stage 4: Generating creative ideas...");
        ideaGeneratorOutput = await (ctx as any).runAction(
          internal.masterAI.ideaGenerator.generateIdeas,
          {
            summarizerOutput,
            settings,
            originalQuestion: args.prompt,
          }
        );
        console.log(`   Ideas generated: ${ideaGeneratorOutput?.ideas?.length || 0}`);
      }
      
      // ========================================================================
      // BUILD RICH CONTEXT FROM PIPELINE
      // ========================================================================
      let pipelineContext = "";
      
      // Add summarizer insights
      if (summarizerOutput?.summaries) {
        pipelineContext += "\n\n## KNOWLEDGE BASE INSIGHTS:\n";
        for (const summary of summarizerOutput.summaries) {
          pipelineContext += `\n### ${summary.facetName}:\n${summary.summary}\n`;
          if (summary.keyTechniques?.length > 0) {
            pipelineContext += `Key Points: ${summary.keyTechniques.join(", ")}\n`;
          }
        }
      }
      
      // Add web research insights
      if (webResearchContext) {
        pipelineContext += "\n\n## WEB RESEARCH INSIGHTS:\n" + webResearchContext;
      }
      
      // Add creative ideas
      if (ideaGeneratorOutput?.ideas?.length) {
        pipelineContext += "\n\n## CREATIVE IDEAS TO INCORPORATE:\n";
        for (const idea of ideaGeneratorOutput.ideas) {
          pipelineContext += `- ${idea.technique}: ${idea.description}\n`;
        }
      }
      
      // Cross-facet insights
      if (ideaGeneratorOutput?.crossFacetInsights?.length) {
        pipelineContext += "\n## CROSS-TOPIC CONNECTIONS:\n";
        for (const insight of ideaGeneratorOutput.crossFacetInsights) {
          pipelineContext += `- ${insight}\n`;
        }
      }
      
      console.log(`   Pipeline context built: ${pipelineContext.length} chars`);
      
      // ========================================================================
      // STAGE 5: GENERATE COURSE OUTLINE WITH ENRICHED CONTEXT
      // ========================================================================
      console.log("✍️ Stage 5: Generating course outline with enriched context...");
      
      const outline = await generateCourseOutlineWithPipelineContext({
        topic,
        skillLevel,
        targetModules,
        targetLessonsPerModule,
        prompt: args.prompt,
        pipelineContext,
        facets: plannerOutput.facets.map(f => f.name),
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
          queueId: args.queueId || undefined,
          userId: args.userId,
          storeId: args.storeId,
          title: outline.course.title,
          description: outline.course.description,
          topic,
          skillLevel: outline.course.skillLevel,
          estimatedDuration: outline.course.estimatedDuration,
          outline: outline,
          totalChapters,
          chapterStatus,
          generationModel: "gpt-4o (pipeline-enriched)",
          generationTimeMs: Date.now() - startTime,
        }
      ) as Id<"aiCourseOutlines">;
      
      // Link to queue if provided
      if (args.queueId) {
        await (ctx as any).runMutation(
          internal.aiCourseBuilderQueries.linkOutlineToQueue,
          { queueId: args.queueId, outlineId }
        );
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Course outline generated in ${totalTime}ms`);
      
      return {
        success: true,
        outlineId,
        outline,
        pipelineMetadata: {
          plannerModel: settings.preset,
          summarizerModel: settings.preset,
          finalWriterModel: "gpt-4o",
          totalChunksProcessed: retrieverOutput.totalChunksRetrieved,
          processingTimeMs: totalTime,
          facetsUsed: plannerOutput.facets.map(f => f.name),
          webResearchResults: webResearchCount,
        },
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Pipeline error:", errorMessage);
      
      if (args.queueId) {
        await (ctx as any).runMutation(
          api.aiCourseBuilderQueries.updateQueueStatus,
          { queueId: args.queueId, status: "failed", error: errorMessage }
        );
      }
      
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
    liteMode: v.optional(v.boolean()), // Generate shorter content for speed
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const liteMode = args.liteMode ?? false;
    
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
        liteMode, // Pass lite mode for faster generation
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
 * Expand all chapters in an outline (PARALLEL batch operation)
 * Processes chapters in parallel batches to avoid timeouts
 */
export const expandAllChapters = action({
  args: {
    outlineId: v.id("aiCourseOutlines"),
    queueId: v.id("aiCourseQueue"),
    parallelBatchSize: v.optional(v.number()), // How many chapters to process in parallel (default: 5)
    liteMode: v.optional(v.boolean()), // Generate shorter content for faster processing
  },
  returns: v.object({
    success: v.boolean(),
    expandedCount: v.number(),
    failedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const BATCH_SIZE = args.parallelBatchSize || 5; // Process 5 chapters at once
    const liteMode = args.liteMode ?? true; // Default to lite mode for speed
    
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
    
    // Collect all chapters that need expansion
    interface ChapterTask {
      moduleIndex: number;
      lessonIndex: number;
      chapterIndex: number;
      chapter: CourseOutlineChapter;
    }
    const chaptersToExpand: ChapterTask[] = [];
    
    for (let mi = 0; mi < outlineData.modules.length; mi++) {
      const module = outlineData.modules[mi];
      for (let li = 0; li < module.lessons.length; li++) {
        const lesson = module.lessons[li];
        for (let ci = 0; ci < lesson.chapters.length; ci++) {
          const chapter = lesson.chapters[ci];
          // Skip if already has detailed content
          if (!(chapter.hasDetailedContent && chapter.wordCount && chapter.wordCount > 500)) {
            chaptersToExpand.push({
              moduleIndex: mi,
              lessonIndex: li,
              chapterIndex: ci,
              chapter,
            });
          }
        }
      }
    }
    
    console.log(`📚 Expanding ${chaptersToExpand.length} chapters in parallel batches of ${BATCH_SIZE}`);
    
    let expandedCount = totalChapters - chaptersToExpand.length; // Count already-expanded
    let failedCount = 0;
    
    // Process chapters in parallel batches
    for (let batchStart = 0; batchStart < chaptersToExpand.length; batchStart += BATCH_SIZE) {
      const batch = chaptersToExpand.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chaptersToExpand.length / BATCH_SIZE);
      
      console.log(`⚡ Processing batch ${batchNum}/${totalBatches} (${batch.length} chapters)`);
      
      // Update progress
      await (ctx as any).runMutation(
        api.aiCourseBuilderQueries.updateQueueStatus,
        {
          queueId: args.queueId,
          status: "expanding_content",
          progress: {
            currentStep: `Batch ${batchNum}/${totalBatches}`,
            totalSteps: totalChapters,
            completedSteps: expandedCount + failedCount,
            currentChapter: batch.map(t => t.chapter.title).join(", "),
          },
        }
      );
      
      // Process batch in parallel
      const batchPromises = batch.map(async (task) => {
        try {
          const result = await (ctx as any).runAction(
            api.aiCourseBuilder.expandChapterContent,
            {
              outlineId: args.outlineId,
              moduleIndex: task.moduleIndex,
              lessonIndex: task.lessonIndex,
              chapterIndex: task.chapterIndex,
              liteMode,
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
        } else {
          failedCount++;
        }
      }
      
      // Small delay between batches to avoid overwhelming the API
      if (batchStart + BATCH_SIZE < chaptersToExpand.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Expansion complete: ${expandedCount} expanded, ${failedCount} failed`);
    
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

/**
 * Generate course outline with enriched context from the full AI pipeline
 */
async function generateCourseOutlineWithPipelineContext(params: {
  topic: string;
  skillLevel: string;
  targetModules: number;
  targetLessonsPerModule: number;
  prompt: string;
  pipelineContext: string;
  facets: string[];
}): Promise<CourseOutline> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are a master music production educator creating comprehensive course outlines. You have been provided with rich context from knowledge bases and web research.

GUIDELINES:
- Create exactly ${params.targetModules} modules
- Each module should have ${params.targetLessonsPerModule} lessons  
- Each lesson should have 2-4 chapters
- Content should be appropriate for ${params.skillLevel} level
- INCORPORATE the insights from the provided knowledge base and web research
- Structure modules around the identified facets/topics: ${params.facets.join(", ")}
- Be specific and provide actionable learning
- Chapter content should describe what will be covered (2-3 sentences)

IMPORTANT: You must respond with valid JSON in the following format:
{
  "course": {
    "title": "Course Title",
    "description": "Course description that incorporates research insights",
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

  const userPrompt = `Create a comprehensive course outline for: ${params.prompt}

Topic: ${params.topic}
Skill Level: ${params.skillLevel}

=== ENRICHED CONTEXT FROM AI PIPELINE ===
${params.pipelineContext || "(No additional context available)"}
=== END OF CONTEXT ===

Using the above context, generate a well-structured course that incorporates the key insights, techniques, and ideas. Make sure the course content is informed by the research and knowledge base insights. Respond with valid JSON only.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
    max_tokens: 5000,
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
  liteMode?: boolean;
}): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Use lite mode for faster generation with shorter content
  const isLite = params.liteMode ?? false;
  const wordTarget = isLite ? "300-500" : "800-1200";
  const model = isLite ? "gpt-4o-mini" : "gpt-4o"; // Use faster model for lite mode

  const systemPrompt = `You are a master music production educator creating ${isLite ? "concise" : "detailed"} lesson content. Write ${isLite ? "focused" : "comprehensive"}, video-script-ready educational content.

STYLE GUIDELINES:
- Write ${wordTarget} words of ${isLite ? "focused" : "detailed"}, educational content
- Use conversational tone suitable for video production
- Include specific technical details and ${isLite ? "key" : "step-by-step"} instructions
- ${isLite ? "Highlight key examples" : "Provide practical examples and real-world applications"}
- Structure with clear sections and learning points
- Focus exclusively on the chapter topic`;

  const userPrompt = `Create ${isLite ? "concise" : "detailed"} content for this chapter:

Course Topic: ${params.topic}
Skill Level: ${params.skillLevel}
Module: ${params.moduleTitle}
Lesson: ${params.lessonTitle}
Chapter: ${params.chapterTitle}

Chapter Outline:
${params.chapterOutline}

Write ${isLite ? "focused, concise" : "comprehensive"}, educational content that covers this chapter${isLite ? " efficiently" : " thoroughly"}.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: isLite ? 0.6 : 0.8,
    max_tokens: 3000,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return content;
}
