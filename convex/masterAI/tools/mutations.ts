// Internal mutations for AI tool execution
// These are in a separate file from executor.ts because that file uses "use node"
// and mutations cannot be defined in Node.js runtime files

import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

// Helper to generate a URL-friendly slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper to ensure unique slugs
export async function generateUniqueSlug(
  ctx: any,
  baseSlug: string
): Promise<string> {
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

export const searchCoursesByTopicInternal = internalQuery({
  args: {
    topic: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const topicLower = args.topic.toLowerCase();

    // Get all published courses and filter by topic
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(100);

    const matching = courses.filter((c) => {
      const titleMatch = c.title?.toLowerCase().includes(topicLower);
      const descMatch = c.description?.toLowerCase().includes(topicLower);
      const categoryMatch = c.category?.toLowerCase().includes(topicLower);
      return titleMatch || descMatch || categoryMatch;
    });

    return matching.slice(0, args.limit).map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      isPublished: c.isPublished,
    }));
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

