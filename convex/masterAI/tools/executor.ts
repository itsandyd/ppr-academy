"use node";

import { internalAction, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { 
  AI_TOOLS, 
  validateToolParameters,
  toolCallResultValidator,
  type ToolCall,
} from "./schema";
import { callLLM } from "../llmClient";

// ============================================================================
// TOOL EXECUTOR - Runs AI-requested tools securely
// ============================================================================

/**
 * Execute a single tool and return the result
 */
export const executeTool = internalAction({
  args: {
    toolName: v.string(),
    parameters: v.any(),
    userId: v.string(),
    storeId: v.optional(v.string()),
  },
  returns: toolCallResultValidator,
  handler: async (ctx, args) => {
    const { toolName, parameters, userId, storeId } = args;
    
    console.log(`🔧 Executing tool: ${toolName}`, parameters);

    // Validate the tool exists
    if (!AI_TOOLS[toolName]) {
      return {
        tool: toolName,
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    // Validate parameters
    const validation = validateToolParameters(toolName, parameters);
    if (!validation.valid) {
      return {
        tool: toolName,
        success: false,
        error: `Invalid parameters: ${validation.errors.join(", ")}`,
      };
    }

    try {
      // Route to the appropriate handler
      switch (toolName) {
        // ==================================================================
        // COURSE CREATION TOOLS
        // ==================================================================
        
        case "createCourse": {
          // @ts-ignore - Avoiding deep type instantiation
          const result = await ctx.runMutation(internal.masterAI.tools.executor.createCourseInternal, {
            userId,
            storeId: storeId || "",
            title: parameters.title,
            description: parameters.description,
            category: parameters.category,
            skillLevel: parameters.skillLevel,
            price: parameters.price || 0,
            checkoutHeadline: parameters.checkoutHeadline,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              courseId: result.courseId,
              slug: result.slug,
              message: `Created course "${parameters.title}"`,
              link: `/dashboard/store/${storeId}/courses/${result.courseId}/edit`,
            },
          };
        }

        case "createCourseWithModules": {
          const result = await ctx.runMutation(api.courses.createCourseWithData, {
            userId,
            storeId: storeId || "",
            data: {
              title: parameters.title,
              description: parameters.description,
              category: parameters.category,
              skillLevel: parameters.skillLevel,
              price: String(parameters.price || 0),
              checkoutHeadline: parameters.checkoutHeadline || `Learn ${parameters.title}`,
              modules: parameters.modules,
            },
          });
          
          if (!result.success) {
            return {
              tool: toolName,
              success: false,
              error: "Failed to create course with modules",
            };
          }
          
          return {
            tool: toolName,
            success: true,
            result: {
              courseId: result.courseId,
              slug: result.slug,
              message: `Created course "${parameters.title}" with ${parameters.modules?.length || 0} modules`,
              link: `/dashboard/store/${storeId}/courses/${result.courseId}/edit`,
            },
          };
        }

        case "addModuleToCourse": {
          const moduleId = await ctx.runMutation(internal.masterAI.tools.executor.addModuleInternal, {
            courseId: parameters.courseId as Id<"courses">,
            title: parameters.title,
            description: parameters.description,
            position: parameters.position,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              moduleId,
              message: `Added module "${parameters.title}" to course`,
            },
          };
        }

        case "addLessonToModule": {
          const lessonId = await ctx.runMutation(internal.masterAI.tools.executor.addLessonInternal, {
            moduleId: parameters.moduleId as Id<"courseModules">,
            title: parameters.title,
            description: parameters.description,
            position: parameters.position,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              lessonId,
              message: `Added lesson "${parameters.title}" to module`,
            },
          };
        }

        case "addChapterToLesson": {
          const chapterId = await ctx.runMutation(internal.masterAI.tools.executor.addChapterInternal, {
            lessonId: parameters.lessonId as Id<"courseLessons">,
            courseId: parameters.courseId as Id<"courses">,
            title: parameters.title,
            content: parameters.content,
            position: parameters.position,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              chapterId,
              message: `Added chapter "${parameters.title}" to lesson`,
            },
          };
        }

        case "updateCourse": {
          await ctx.runMutation(api.courses.updateCourse, {
            id: parameters.courseId as Id<"courses">,
            title: parameters.title,
            description: parameters.description,
            price: parameters.price,
            isPublished: parameters.isPublished,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              message: `Updated course ${parameters.courseId}`,
            },
          };
        }

        // ==================================================================
        // CONTENT GENERATION TOOLS
        // ==================================================================

        case "generateLessonContent": {
          const content = await generateContentWithAI({
            topic: parameters.topic,
            style: parameters.style || "intermediate",
            wordCount: parameters.wordCount || 1000,
            includeExamples: parameters.includeExamples ?? true,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              content,
              message: `Generated ${parameters.wordCount || 1000} words of content about "${parameters.topic}"`,
            },
          };
        }

        case "generateQuizQuestions": {
          const questions = await generateQuizWithAI({
            topic: parameters.topic,
            count: parameters.questionCount || 5,
            difficulty: parameters.difficulty || "medium",
          });
          return {
            tool: toolName,
            success: true,
            result: {
              questions,
              message: `Generated ${parameters.questionCount || 5} quiz questions about "${parameters.topic}"`,
            },
          };
        }

        case "generateCourseOutline": {
          const outline = await generateCourseOutlineWithAI({
            topic: parameters.topic,
            moduleCount: parameters.moduleCount || 5,
            targetAudience: parameters.targetAudience || "intermediate",
            style: parameters.style || "practical",
          });
          return {
            tool: toolName,
            success: true,
            result: {
              outline,
              message: `Generated course outline for "${parameters.topic}" with ${parameters.moduleCount || 5} modules`,
            },
          };
        }

        // ==================================================================
        // QUERY TOOLS
        // ==================================================================

        case "listMyCourses": {
          const courses = await ctx.runQuery(internal.masterAI.tools.executor.getCoursesForUser, {
            userId,
            status: parameters.status || "all",
            limit: parameters.limit || 10,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              courses,
              count: courses.length,
              message: `Found ${courses.length} courses`,
            },
          };
        }

        case "getCourseDetails": {
          const course = await ctx.runQuery(internal.masterAI.tools.executor.getCourseDetailsInternal, {
            courseId: parameters.courseId as Id<"courses">,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              course,
              message: course ? `Retrieved details for "${course.title}"` : "Course not found",
            },
          };
        }

        case "getCourseStats": {
          const stats = await ctx.runQuery(internal.masterAI.tools.executor.getCourseStatsInternal, {
            courseId: parameters.courseId as Id<"courses">,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              stats,
              message: `Stats for course: ${stats.enrollmentCount} students enrolled`,
            },
          };
        }

        case "searchCoursesByTopic": {
          const courses = await ctx.runQuery(internal.masterAI.tools.executor.searchUserCourses, {
            userId,
            query: parameters.query,
            limit: parameters.limit || 5,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              courses,
              count: courses.length,
              message: `Found ${courses.length} courses matching "${parameters.query}"`,
            },
          };
        }

        case "listMyProducts": {
          const products = await ctx.runQuery(internal.masterAI.tools.executor.getProductsForUser, {
            userId,
            productType: parameters.productType || "all",
            limit: parameters.limit || 10,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              products,
              count: products.length,
              message: `Found ${products.length} products`,
            },
          };
        }

        // ==================================================================
        // SETTINGS TOOLS
        // ==================================================================

        case "duplicateCourse": {
          const result = await ctx.runMutation(internal.masterAI.tools.executor.duplicateCourseInternal, {
            courseId: parameters.courseId as Id<"courses">,
            newTitle: parameters.newTitle,
            userId,
            storeId: storeId || "",
          });
          return {
            tool: toolName,
            success: true,
            result: {
              newCourseId: result.courseId,
              slug: result.slug,
              message: `Duplicated course as "${result.title}"`,
              link: `/dashboard/store/${storeId}/courses/${result.courseId}/edit`,
            },
          };
        }

        case "deleteCourse": {
          if (!parameters.confirmDelete) {
            return {
              tool: toolName,
              success: false,
              error: "Deletion not confirmed. Set confirmDelete to true to proceed.",
            };
          }
          await ctx.runMutation(internal.masterAI.tools.executor.deleteCourseInternal, {
            courseId: parameters.courseId as Id<"courses">,
            userId,
          });
          return {
            tool: toolName,
            success: true,
            result: {
              message: "Course deleted successfully",
            },
          };
        }

        default:
          return {
            tool: toolName,
            success: false,
            error: `Tool ${toolName} is not yet implemented`,
          };
      }
    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      return {
        tool: toolName,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Execute multiple tools in sequence
 */
export const executeTools = internalAction({
  args: {
    toolCalls: v.array(v.object({
      tool: v.string(),
      parameters: v.any(),
    })),
    userId: v.string(),
    storeId: v.optional(v.string()),
  },
  returns: v.object({
    results: v.array(toolCallResultValidator),
    allSucceeded: v.boolean(),
    summary: v.string(),
  }),
  handler: async (ctx, args) => {
    const results: Array<{
      tool: string;
      success: boolean;
      result?: unknown;
      error?: string;
    }> = [];
    
    let allSucceeded = true;
    const successMessages: string[] = [];
    const errorMessages: string[] = [];

    for (const toolCall of args.toolCalls) {
      const result = await ctx.runAction(internal.masterAI.tools.executor.executeTool, {
        toolName: toolCall.tool,
        parameters: toolCall.parameters,
        userId: args.userId,
        storeId: args.storeId,
      });
      
      results.push(result);
      
      if (result.success) {
        const msg = (result.result as any)?.message || `${toolCall.tool} completed`;
        successMessages.push(msg);
      } else {
        allSucceeded = false;
        errorMessages.push(`${toolCall.tool}: ${result.error}`);
      }
    }

    const summary = allSucceeded
      ? `✅ All ${results.length} actions completed successfully:\n${successMessages.map(m => `• ${m}`).join("\n")}`
      : `⚠️ ${successMessages.length}/${results.length} actions succeeded:\n${successMessages.map(m => `✅ ${m}`).join("\n")}\n${errorMessages.map(m => `❌ ${m}`).join("\n")}`;

    return {
      results,
      allSucceeded,
      summary,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for tool execution)
// ============================================================================

export const createCourseInternal = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    skillLevel: v.optional(v.string()),
    price: v.number(),
    checkoutHeadline: v.optional(v.string()),
  },
  returns: v.object({
    courseId: v.id("courses"),
    slug: v.string(),
  }),
  handler: async (ctx, args) => {
    const slug = generateSlug(args.title);
    const uniqueSlug = await generateUniqueSlug(ctx, slug);
    
    const courseId = await ctx.db.insert("courses", {
      userId: args.userId,
      instructorId: args.userId,
      storeId: args.storeId,
      title: args.title,
      slug: uniqueSlug,
      description: args.description,
      category: args.category,
      skillLevel: args.skillLevel,
      price: args.price,
      isPublished: false,
      checkoutHeadline: args.checkoutHeadline || `Learn ${args.title}`,
    });

    return { courseId, slug: uniqueSlug };
  },
});

export const addModuleInternal = internalMutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  returns: v.id("courseModules"),
  handler: async (ctx, args) => {
    // Get current module count for default position
    const existingModules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
    
    const position = args.position ?? existingModules.length;

    return await ctx.db.insert("courseModules", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      position,
    });
  },
});

export const addLessonInternal = internalMutation({
  args: {
    moduleId: v.id("courseModules"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  returns: v.id("courseLessons"),
  handler: async (ctx, args) => {
    const existingLessons = await ctx.db
      .query("courseLessons")
      .filter((q) => q.eq(q.field("moduleId"), args.moduleId))
      .collect();
    
    const position = args.position ?? existingLessons.length;

    return await ctx.db.insert("courseLessons", {
      moduleId: args.moduleId,
      title: args.title,
      description: args.description,
      position,
    });
  },
});

export const addChapterInternal = internalMutation({
  args: {
    lessonId: v.id("courseLessons"),
    courseId: v.id("courses"),
    title: v.string(),
    content: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  returns: v.id("courseChapters"),
  handler: async (ctx, args) => {
    const existingChapters = await ctx.db
      .query("courseChapters")
      .filter((q) => q.eq(q.field("lessonId"), args.lessonId))
      .collect();
    
    const position = args.position ?? existingChapters.length;

    return await ctx.db.insert("courseChapters", {
      lessonId: args.lessonId,
      courseId: args.courseId,
      title: args.title,
      description: args.content || "",
      position,
      isPublished: true,
    });
  },
});

export const duplicateCourseInternal = internalMutation({
  args: {
    courseId: v.id("courses"),
    newTitle: v.optional(v.string()),
    userId: v.string(),
    storeId: v.string(),
  },
  returns: v.object({
    courseId: v.id("courses"),
    slug: v.string(),
    title: v.string(),
  }),
  handler: async (ctx, args) => {
    const originalCourse = await ctx.db.get(args.courseId);
    if (!originalCourse) {
      throw new Error("Course not found");
    }

    const newTitle = args.newTitle || `Copy of ${originalCourse.title}`;
    const slug = generateSlug(newTitle);
    const uniqueSlug = await generateUniqueSlug(ctx, slug);

    // Create new course
    const newCourseId = await ctx.db.insert("courses", {
      ...originalCourse,
      _id: undefined,
      _creationTime: undefined,
      title: newTitle,
      slug: uniqueSlug,
      isPublished: false,
      userId: args.userId,
      instructorId: args.userId,
      storeId: args.storeId,
    } as any);

    // Duplicate modules
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    for (const module of modules) {
      const newModuleId = await ctx.db.insert("courseModules", {
        courseId: newCourseId,
        title: module.title,
        description: module.description,
        position: module.position,
      });

      // Duplicate lessons
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), module._id))
        .collect();

      for (const lesson of lessons) {
        const newLessonId = await ctx.db.insert("courseLessons", {
          moduleId: newModuleId,
          title: lesson.title,
          description: lesson.description,
          position: lesson.position,
        });

        // Duplicate chapters
        const chapters = await ctx.db
          .query("courseChapters")
          .filter((q) => q.eq(q.field("lessonId"), lesson._id))
          .collect();

        for (const chapter of chapters) {
          await ctx.db.insert("courseChapters", {
            lessonId: newLessonId,
            courseId: newCourseId,
            title: chapter.title,
            description: chapter.description,
            position: chapter.position,
            isPublished: chapter.isPublished,
          });
        }
      }
    }

    return { courseId: newCourseId, slug: uniqueSlug, title: newTitle };
  },
});

export const deleteCourseInternal = internalMutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== args.userId) {
      throw new Error("Course not found or unauthorized");
    }

    // Delete chapters
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }

    // Delete lessons (need to find via modules)
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    for (const module of modules) {
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), module._id))
        .collect();
      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }
      await ctx.db.delete(module._id);
    }

    // Delete course
    await ctx.db.delete(args.courseId);
    return null;
  },
});

// ============================================================================
// INTERNAL QUERIES (for tool execution)
// ============================================================================

import { internalQuery } from "../../_generated/server";

export const getCoursesForUser = internalQuery({
  args: {
    userId: v.string(),
    status: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("userId"), args.userId));

    const courses = await query.take(args.limit);

    // Filter by status
    let filtered = courses;
    if (args.status === "published") {
      filtered = courses.filter((c) => c.isPublished === true);
    } else if (args.status === "draft") {
      filtered = courses.filter((c) => !c.isPublished);
    }

    return filtered.map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      isPublished: c.isPublished,
      price: c.price,
      category: c.category,
    }));
  },
});

export const getCourseDetailsInternal = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      slug: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      price: v.optional(v.number()),
      category: v.optional(v.string()),
      modules: v.array(v.object({
        _id: v.id("courseModules"),
        title: v.string(),
        lessonCount: v.number(),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    const modulesWithCount = await Promise.all(
      modules.map(async (m) => {
        const lessons = await ctx.db
          .query("courseLessons")
          .filter((q) => q.eq(q.field("moduleId"), m._id))
          .collect();
        return {
          _id: m._id,
          title: m.title,
          lessonCount: lessons.length,
        };
      })
    );

    return {
      _id: course._id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      isPublished: course.isPublished,
      price: course.price,
      category: course.category,
      modules: modulesWithCount,
    };
  },
});

export const getCourseStatsInternal = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    enrollmentCount: v.number(),
    moduleCount: v.number(),
    lessonCount: v.number(),
    chapterCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    let lessonCount = 0;
    for (const module of modules) {
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), module._id))
        .collect();
      lessonCount += lessons.length;
    }

    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();

    return {
      enrollmentCount: enrollments.length,
      moduleCount: modules.length,
      lessonCount,
      chapterCount: chapters.length,
    };
  },
});

export const searchUserCourses = internalQuery({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const queryLower = args.query.toLowerCase();
    const filtered = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(queryLower) ||
        c.description?.toLowerCase().includes(queryLower) ||
        c.category?.toLowerCase().includes(queryLower)
    );

    return filtered.slice(0, args.limit).map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      isPublished: c.isPublished,
    }));
  },
});

export const getProductsForUser = internalQuery({
  args: {
    userId: v.string(),
    productType: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("digitalProducts"),
    title: v.string(),
    productType: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .take(args.limit);

    let filtered = products;
    if (args.productType !== "all") {
      filtered = products.filter((p) => p.productType === args.productType);
    }

    return filtered.map((p) => ({
      _id: p._id,
      title: p.title,
      productType: p.productType,
      price: p.price,
      isPublished: p.isPublished,
    }));
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(ctx: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ctx.db
      .query("courses")
      .filter((q: any) => q.eq(q.field("slug"), slug))
      .first();

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ============================================================================
// AI CONTENT GENERATION HELPERS
// ============================================================================

async function generateContentWithAI(params: {
  topic: string;
  style: string;
  wordCount: number;
  includeExamples: boolean;
}): Promise<string> {
  const response = await callLLM({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert music production educator. Generate detailed, engaging lesson content.
Style: ${params.style} level
Word count: approximately ${params.wordCount} words
${params.includeExamples ? "Include practical examples and exercises." : ""}
Format the content with clear headings and bullet points where appropriate.`,
      },
      {
        role: "user",
        content: `Create lesson content about: ${params.topic}`,
      },
    ],
    temperature: 0.7,
    maxTokens: params.wordCount * 2,
  });

  return response.content;
}

async function generateQuizWithAI(params: {
  topic: string;
  count: number;
  difficulty: string;
}): Promise<Array<{
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}>> {
  const response = await callLLM({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert music production educator creating quiz questions.
Generate ${params.count} multiple choice questions at ${params.difficulty} difficulty.
Each question should have 4 options with one correct answer.
Return as JSON array with: question, options (array of 4 strings), correctIndex (0-3), explanation`,
      },
      {
        role: "user",
        content: `Create quiz questions about: ${params.topic}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: "json",
  });

  try {
    return JSON.parse(response.content);
  } catch {
    return [];
  }
}

async function generateCourseOutlineWithAI(params: {
  topic: string;
  moduleCount: number;
  targetAudience: string;
  style: string;
}): Promise<{
  title: string;
  description: string;
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      description: string;
      chapters: Array<{
        title: string;
        description: string;
      }>;
    }>;
  }>;
}> {
  const response = await callLLM({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert curriculum designer for music production courses.
Create a comprehensive course outline with ${params.moduleCount} modules.
Target audience: ${params.targetAudience} level
Course style: ${params.style}
Each module should have 2-4 lessons, each lesson should have 2-3 chapters.
Return as JSON with: title, description, modules (array with title, description, lessons array)`,
      },
      {
        role: "user",
        content: `Create a course outline about: ${params.topic}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 4000,
    responseFormat: "json",
  });

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      title: params.topic,
      description: `A comprehensive course about ${params.topic}`,
      modules: [],
    };
  }
}

