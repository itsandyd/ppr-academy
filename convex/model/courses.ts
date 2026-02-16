import { v } from "convex/values";
import { QueryCtx, ActionCtx, internalQuery } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Helper function to get course with full details (for use in actions)
 * Avoids circular dependencies by directly accessing database
 */
export async function getCourseWithDetails(
  ctx: QueryCtx,
  args: {
    courseId: Id<"courses">;
    userId: string;
  }
): Promise<Doc<"courses"> & { modules?: any[] } | null> {
  // Get the course
  const course = await ctx.db.get(args.courseId);
  
  if (!course) {
    return null;
  }

  // Verify ownership
  if (course.userId !== args.userId) {
    return null;
  }

  // Get all modules for this course
  const modules = await ctx.db
    .query("courseModules")
    .filter((q) => q.eq(q.field("courseId"), args.courseId))
    .order("asc")
    .take(500);

  // Get lessons for each module
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => {
      const lessons = await ctx.db
        .query("courseLessons")
        .filter((q) => q.eq(q.field("moduleId"), module._id))
        .order("asc")
        .take(500);

      // Get chapters for each lesson
      const lessonsWithChapters = await Promise.all(
        lessons.map(async (lesson) => {
          const chapters = await ctx.db
            .query("courseChapters")
            .filter((q) => q.eq(q.field("lessonId"), lesson._id))
            .order("asc")
            .take(500);

          return {
            ...lesson,
            chapters,
          };
        })
      );

      return {
        ...module,
        lessons: lessonsWithChapters,
      };
    })
  );

  return {
    ...course,
    modules: modulesWithLessons,
  };
}

/**
 * Get all courses for a user (helper for RAG content generation)
 */
export async function getUserCoursesForGeneration(
  ctx: QueryCtx,
  userId: string
): Promise<Array<{ title: string; content: string }>> {
  // Get user's courses
  const courses = await ctx.db
    .query("courses")
    .filter((q) => q.eq(q.field("userId"), userId))
    .take(500);

  const courseContent = await Promise.all(
    courses.map(async (course) => {
      // Get sample chapters for content analysis
      const chapters = await ctx.db
        .query("courseChapters")
        .filter((q) => q.eq(q.field("courseId"), course._id))
        .take(3); // Just take first 3 chapters for content style

      const content = chapters
        .map(chapter => `${chapter.title}: ${chapter.description || ''}`)
        .join('\n');

      return {
        title: course.title,
        content: `${course.description || ''}\n\n${content}`,
      };
    })
  );

  return courseContent;
}

/**
 * Simplified course details query (returns JSON string)
 */
export const getCourseDetailsSimple = internalQuery({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    
    if (!course || course.userId !== args.userId) {
      return null;
    }

    // Get modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .take(5);

    const courseData = {
      ...course,
      modules: modules.map(m => ({
        title: m.title,
        description: m.description,
      })),
    };

    return JSON.stringify(courseData);
  },
});

/**
 * Simplified course data query (avoids complex types)
 */
export const getSimpleCourseData = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.string(), // Return JSON string to avoid complex type inference
  handler: async (ctx, args) => {
    // Get user's courses directly
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .take(10);

    // Build simple course data
    const courseData = await Promise.all(
      courses.map(async (course) => {
        const chapters = await ctx.db
          .query("courseChapters")
          .filter((q) => q.eq(q.field("courseId"), course._id))
          .take(3);

        const content = chapters
          .map(chapter => `${chapter.title}: ${chapter.description || ''}`)
          .join('\n');

        return {
          title: course.title,
          content: `${course.description || ''}\n\n${content}`,
        };
      })
    );

    // Return as JSON string to avoid complex type issues
    return JSON.stringify(courseData);
  },
});
