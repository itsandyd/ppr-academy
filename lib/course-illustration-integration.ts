/**
 * Integration helpers for generating illustrations alongside course content
 */

import { ConvexClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * Generate illustrations for a course lesson automatically
 * Can be called after lesson content is generated
 */
export async function generateLessonIllustrations({
  convexClient,
  userId,
  storeId,
  lessonId,
  lessonContent,
  courseId,
  lessonTitle,
}: {
  convexClient: ConvexClient;
  userId: string;
  storeId?: string;
  lessonId: string;
  lessonContent: string;
  courseId?: string;
  lessonTitle?: string;
}) {
  try {
    const result = await convexClient.action(
      api.scriptIllustrations.generateScriptIllustrations,
      {
        userId,
        storeId,
        scriptText: lessonContent,
        scriptTitle: lessonTitle,
        sourceType: "lesson",
        sourceId: lessonId,
        generateEmbeddings: true,
        skipEmptySentences: true,
      }
    );

    return result;
  } catch (error) {
    console.error("Error generating lesson illustrations:", error);
    throw error;
  }
}

/**
 * Generate illustrations for an entire course
 * Processes all lessons and creates illustrations for each
 */
export async function generateCourseIllustrations({
  convexClient,
  userId,
  storeId,
  courseId,
  lessons,
}: {
  convexClient: ConvexClient;
  userId: string;
  storeId?: string;
  courseId: string;
  lessons: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}) {
  const results = [];

  for (const lesson of lessons) {
    try {
      const result = await generateLessonIllustrations({
        convexClient,
        userId,
        storeId,
        lessonId: lesson.id,
        lessonContent: lesson.content,
        courseId,
        lessonTitle: lesson.title,
      });

      results.push({
        lessonId: lesson.id,
        success: result.success,
        jobId: result.jobId,
        totalSentences: result.totalSentences,
      });

      // Rate limiting between lessons
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate illustrations for lesson ${lesson.id}:`, error);
      results.push({
        lessonId: lesson.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    totalLessons: lessons.length,
    results,
    successCount: results.filter(r => r.success).length,
  };
}

/**
 * Get illustration recommendations for course content
 * Uses semantic search to find existing relevant illustrations
 */
export async function getIllustrationRecommendations({
  convexClient,
  lessonContent,
  excludeLessonId,
}: {
  convexClient: ConvexClient;
  lessonContent: string;
  excludeLessonId?: string;
}) {
  try {
    const result = await convexClient.action(
      api.scriptIllustrationSearch.getRecommendedIllustrations,
      {
        scriptText: lessonContent,
        excludeScriptId: excludeLessonId,
        limit: 10,
      }
    );

    return result;
  } catch (error) {
    console.error("Error getting illustration recommendations:", error);
    throw error;
  }
}

/**
 * Helper to extract video script from lesson content
 * Useful when lesson content includes both script and metadata
 */
export function extractScriptFromLesson(lessonContent: string): string {
  // Remove markdown formatting
  let script = lessonContent
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove code blocks
    .trim();

  return script;
}

/**
 * Type definitions for course illustration integration
 */
export interface CourseLesson {
  id: string;
  title: string;
  content: string;
  position?: number;
}

export interface IllustrationGenerationResult {
  lessonId: string;
  success: boolean;
  jobId?: string;
  totalSentences?: number;
  error?: string;
}

export interface CourseIllustrationsResult {
  totalLessons: number;
  results: IllustrationGenerationResult[];
  successCount: number;
}

