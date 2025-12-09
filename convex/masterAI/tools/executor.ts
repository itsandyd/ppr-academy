"use node";

import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { 
  AI_TOOLS, 
  validateToolParameters,
  toolCallResultValidator,
  type ToolCall,
} from "./schema";
import { callLLM, safeParseJson } from "../llmClient";

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
          const result = await ctx.runMutation(internal.masterAI.tools.mutations.createCourseInternal, {
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
          const moduleId = await ctx.runMutation(internal.masterAI.tools.mutations.addModuleInternal, {
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
          const lessonId = await ctx.runMutation(internal.masterAI.tools.mutations.addLessonInternal, {
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
          const chapterId = await ctx.runMutation(internal.masterAI.tools.mutations.addChapterInternal, {
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
          const courses = await ctx.runQuery(internal.masterAI.tools.mutations.getCoursesForUser, {
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
          const course = await ctx.runQuery(internal.masterAI.tools.mutations.getCourseDetailsInternal, {
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
          const result = await ctx.runMutation(internal.masterAI.tools.mutations.duplicateCourseInternal, {
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
          await ctx.runMutation(internal.masterAI.tools.mutations.deleteCourseInternal, {
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
    return safeParseJson(response.content, []);
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
    return safeParseJson(response.content, {
      title: params.topic,
      description: `A comprehensive course about ${params.topic}`,
      modules: [],
    });
  } catch {
    return {
      title: params.topic,
      description: `A comprehensive course about ${params.topic}`,
      modules: [],
    };
  }
}

