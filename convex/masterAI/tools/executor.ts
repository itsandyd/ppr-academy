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
import * as blotato from "./blotato";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
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
          const stats = await ctx.runQuery(internal.masterAI.tools.mutations.getCourseStatsInternal, {
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
          const courses = await ctx.runQuery(internal.masterAI.tools.mutations.searchUserCourses, {
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
          const products = await ctx.runQuery(internal.masterAI.tools.mutations.getProductsForUser, {
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

        // ==================================================================
        // SOCIAL MEDIA TOOLS (Blotato Integration)
        // ==================================================================

        case "generateSocialScript": {
          // Normalize platform to lowercase (AI might pass "TikTok" instead of "tiktok")
          const platform = (parameters.platform as string).toLowerCase();
          const validPlatforms = ["tiktok", "instagram", "youtube", "twitter", "linkedin", "threads", "facebook"];
          if (!validPlatforms.includes(platform)) {
            return {
              tool: toolName,
              success: false,
              error: `Invalid platform "${parameters.platform}". Must be one of: ${validPlatforms.join(", ")}`,
            };
          }
          
          const script = await generateSocialScriptWithAI({
            topic: parameters.topic,
            platform,
            style: parameters.style || "educational",
            tone: parameters.tone || "casual",
          });
          return {
            tool: toolName,
            success: true,
            result: {
              script,
              message: `Generated ${platform} script about "${parameters.topic}"`,
            },
          };
        }

        case "publishSocialPost": {
          // Normalize platform to lowercase
          const platform = (parameters.platform as string).toLowerCase();
          
          const result = await blotato.publishPost({
            accountId: parameters.accountId,
            text: parameters.text,
            mediaUrls: parameters.mediaUrls,
          });
          
          if (!result.success) {
            return {
              tool: toolName,
              success: false,
              error: result.error || "Failed to publish post",
            };
          }
          
          return {
            tool: toolName,
            success: true,
            result: {
              postId: result.data?.id,
              message: `Published post to ${platform}`,
              status: result.data?.status,
            },
          };
        }

        case "scheduleSocialPost": {
          const result = await blotato.schedulePost({
            accountId: parameters.accountId,
            text: parameters.text,
            scheduledTime: parameters.scheduledTime,
            mediaUrls: parameters.mediaUrls,
          });
          
          if (!result.success) {
            return {
              tool: toolName,
              success: false,
              error: result.error || "Failed to schedule post",
            };
          }
          
          return {
            tool: toolName,
            success: true,
            result: {
              postId: result.data?.id,
              message: `Scheduled post for ${parameters.scheduledTime}`,
              scheduledTime: result.data?.scheduledTime,
            },
          };
        }

        case "createTwitterThread": {
          const result = await blotato.createThread({
            accountId: parameters.accountId,
            tweets: parameters.tweets,
            scheduledTime: parameters.scheduledTime,
          });
          
          if (!result.success) {
            return {
              tool: toolName,
              success: false,
              error: result.error || "Failed to create thread",
            };
          }
          
          return {
            tool: toolName,
            success: true,
            result: {
              threadId: result.data?.id,
              message: `Created Twitter thread with ${parameters.tweets.length} tweets`,
              status: result.data?.status,
            },
          };
        }

        case "generateMultiPlatformContent": {
          const content = await generateMultiPlatformContentWithAI({
            topic: parameters.topic,
            platforms: parameters.platforms,
            baseContent: parameters.baseContent,
            style: parameters.style || "engaging",
          });
          return {
            tool: toolName,
            success: true,
            result: {
              content,
              message: `Generated content for ${parameters.platforms.length} platforms`,
            },
          };
        }

        case "listConnectedSocialAccounts": {
          const result = await blotato.listAccounts();
          
          if (!result.success) {
            return {
              tool: toolName,
              success: false,
              error: result.error || "Failed to fetch accounts",
            };
          }
          
          return {
            tool: toolName,
            success: true,
            result: {
              accounts: result.data,
              count: result.data?.length || 0,
              message: `Found ${result.data?.length || 0} connected social accounts`,
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
    model: "gpt-4o", // Use better model for course content quality
    messages: [
      {
        role: "system",
        content: `You are an expert music production educator creating premium course content. Your writing should read like a professional textbook chapter, not an AI-generated blog post.

AUDIENCE: ${params.style} level producers
TARGET LENGTH: approximately ${params.wordCount} words (be concise - don't pad)

===============================================================================
WRITING QUALITY STANDARDS - CRITICAL
===============================================================================

LANGUAGE PRECISION:
- Use hedged language for technical claims: "often", "typically", "can", "tends to"
- AVOID absolute language: "always", "never", "night and day", "completely transforms", "universal rule"
- Be confident but credible - hyperbole triggers skepticism

TECHNICAL ACCURACY:
- Be technically precise - avoid oversimplified claims that experts would correct
- Specify actual ranges in ms/Hz/dB, not just "fast" or "low"
- Classify devices as behavioral descriptions ("often behaves like...") not absolutes
- Acknowledge nuance where it exists rather than stating universal rules

STRUCTURE (follow this order):
1. Opening Hook (1-2 sentences) - Why this matters. ONE metaphor max, then clean technical language
2. Core Concept (brief) - The fundamental principle
3. What You'll Hear (brief) - Specific sonic descriptors
${params.includeExamples ? `4. Hands-On Exercise (detailed) - Step-by-step with EXACT values, include level-matching for A/B
5. Practical Use Cases (brief) - When to use, with real-world mix examples` : ""}
6. Common Mistakes (brief) - Pitfalls to avoid
7. Decision Rules (callout) - If X → do Y guidance
8. Quick Reference (bullets) - What to listen for

LENGTH DISCIPLINE:
- Say it once, say it well, move on
- Do NOT repeat the same concept with different wording
- Each section earns its place - no filler
- Be 25-35% shorter than your first instinct

NEVER:
- Stack multiple metaphors in quick succession
- Use vague language ("experiment with settings" - be SPECIFIC)
- Write generic "tips" content
- Repeat the same idea in multiple sections
- Use salesy language ("game-changer", "secret weapon", "takes your mix to the next level")`,
      },
      {
        role: "user",
        content: `Create premium course lesson content about: ${params.topic}

Remember: Write like a respected educator, not like AI content. Tight, technical, actionable.`,
      },
    ],
    temperature: 0.6, // Lower temperature for more consistent quality
    maxTokens: Math.max(params.wordCount * 2, 4000),
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
        content: `You are an expert curriculum designer for music production courses. Design courses that teach like premium educational products, not generic outlines.

REQUIREMENTS:
- ${params.moduleCount} modules
- Target audience: ${params.targetAudience} level
- Course style: ${params.style}
- Each module: 2-4 lessons
- Each lesson: 2-3 chapters

CURRICULUM DESIGN PRINCIPLES:

1. LEARNING ARC: Each module should build on the previous one. Start with fundamentals, progress to application.

2. CHAPTER STRUCTURE: Each chapter should follow the educational pattern:
   - Concept → Recognition → Practice → Application
   - Include hands-on exercises in chapter descriptions
   
3. AVOID GENERIC TITLES:
   - BAD: "Introduction to Compression", "Advanced Techniques"
   - GOOD: "How Compressors Shape Transients", "Parallel Compression for Punch Without Squash"
   
4. DESCRIPTIONS should hint at SPECIFIC content:
   - BAD: "Learn about EQ techniques"
   - GOOD: "Use high-pass filters to clean sub-bass mud, surgical cuts for problem frequencies, and broad boosts for tonal shaping"

5. PRACTICAL FOCUS: Every lesson should have at least one DAW exercise implied in its structure

Return as JSON with: title, description, modules (array with title, description, lessons array)`,
      },
      {
        role: "user",
        content: `Create a professional course outline about: ${params.topic}

Make titles specific and engaging. Descriptions should preview the actual techniques covered.`,
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

// ============================================================================
// SOCIAL MEDIA CONTENT GENERATION HELPERS
// ============================================================================

async function generateSocialScriptWithAI(params: {
  topic: string;
  platform: string;
  style: string;
  tone: string;
}): Promise<{
  script: string;
  hook: string;
  hashtags: string[];
  notes: string;
  cta: string;
}> {
  const prompt = blotato.getScriptGenerationPrompt(params);
  
  const response = await callLLM({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Create a ${params.platform} script about: ${params.topic}
        
Return as JSON with:
{
  "script": "The full script/content",
  "hook": "The opening hook line",
  "hashtags": ["relevant", "hashtags"],
  "notes": "Production/visual notes",
  "cta": "Call to action"
}`,
      },
    ],
    temperature: 0.8,
    maxTokens: 2000,
    responseFormat: "json",
  });

  try {
    return safeParseJson(response.content, {
      script: response.content,
      hook: "",
      hashtags: [],
      notes: "",
      cta: "",
    });
  } catch {
    return {
      script: response.content,
      hook: "",
      hashtags: [],
      notes: "",
      cta: "",
    };
  }
}

async function generateMultiPlatformContentWithAI(params: {
  topic: string;
  platforms: string[];
  baseContent?: string;
  style: string;
}): Promise<Array<{
  platform: string;
  content: string;
  hashtags: string[];
  notes: string;
}>> {
  const prompt = blotato.getMultiPlatformPrompt(params.topic, params.platforms, params.baseContent);
  
  const response = await callLLM({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Generate content for: ${params.platforms.join(", ")}

Return as JSON array:
[
  {
    "platform": "platform_name",
    "content": "optimized content for this platform",
    "hashtags": ["relevant", "tags"],
    "notes": "platform-specific tips"
  }
]`,
      },
    ],
    temperature: 0.8,
    maxTokens: 4000,
    responseFormat: "json",
  });

  try {
    return safeParseJson(response.content, []);
  } catch {
    return [];
  }
}

