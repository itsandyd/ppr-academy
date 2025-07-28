import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Get all courses
export const getCourses = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    userId: v.string(),
    instructorId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

// Get course by slug
export const getCourseBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      userId: v.string(),
      instructorId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      courseCategoryId: v.optional(v.string()),
      slug: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Get courses by user
export const getCoursesByUser = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    userId: v.string(),
    instructorId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get courses by instructor
export const getCoursesByInstructor = query({
  args: { instructorId: v.string() },
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    userId: v.string(),
    instructorId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_instructorId", (q) => q.eq("instructorId", args.instructorId))
      .collect();
  },
});

// Helper function to generate unique slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function generateUniqueSlug(ctx: QueryCtx | MutationCtx, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("slug"), slug))
      .first();
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Create a new course (simple version)
export const createCourse = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", {
      ...args,
      isPublished: false,
    });
  },
});

// Create course with full form data
export const createCourseWithData = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    data: v.object({
      title: v.string(),
      description: v.string(),
      category: v.optional(v.string()),
      skillLevel: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      price: v.string(),
      checkoutHeadline: v.string(),
      modules: v.optional(v.array(v.object({
        title: v.string(),
        description: v.string(),
        orderIndex: v.number(),
        lessons: v.array(v.object({
          title: v.string(),
          description: v.string(),
          orderIndex: v.number(),
          chapters: v.array(v.object({
            title: v.string(),
            content: v.string(),
            videoUrl: v.string(),
            duration: v.number(),
            orderIndex: v.number(),
          })),
        })),
      }))),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    courseId: v.optional(v.id("courses")),
    slug: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const { data } = args;

      // Generate unique slug
      const baseSlug = generateSlug(data.title);
      const uniqueSlug = await generateUniqueSlug(ctx, baseSlug);

      // Create the course
      const courseId = await ctx.db.insert("courses", {
        userId: args.userId,
        instructorId: args.userId,
        title: data.title,
        slug: uniqueSlug,
        description: data.description,
        price: parseFloat(data.price),
        imageUrl: data.thumbnail || undefined,
        isPublished: false, // Always start as unpublished
        // Additional fields from the form
        category: data.category,
        skillLevel: data.skillLevel,
        checkoutHeadline: data.checkoutHeadline,
      });

      // Create modules, lessons, and chapters if they exist
      if (data.modules && data.modules.length > 0) {
        for (const moduleData of data.modules) {
          const moduleId = await ctx.db.insert("courseModules", {
            title: moduleData.title,
            description: moduleData.description,
            position: moduleData.orderIndex,
            courseId,
          });

          if (moduleData.lessons && moduleData.lessons.length > 0) {
            for (const lessonData of moduleData.lessons) {
              const lessonId = await ctx.db.insert("courseLessons", {
                title: lessonData.title,
                description: lessonData.description,
                position: lessonData.orderIndex,
                moduleId,
              });

              if (lessonData.chapters && lessonData.chapters.length > 0) {
                for (const chapterData of lessonData.chapters) {
                  await ctx.db.insert("courseChapters", {
                    title: chapterData.title,
                    description: chapterData.content,
                    videoUrl: chapterData.videoUrl || undefined,
                    position: chapterData.orderIndex,
                    courseId,
                    lessonId,
                    isPublished: false,
                  });
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        courseId,
        slug: uniqueSlug,
      };
    } catch (error) {
      console.error("Error creating course:", error);
      return {
        success: false,
      };
    }
  },
});

// Update course
export const updateCourse = mutation({
  args: {
    id: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
    category: v.optional(v.string()),
    skillLevel: v.optional(v.string()),
    checkoutHeadline: v.optional(v.string()),
    checkoutDescription: v.optional(v.string()),
    paymentDescription: v.optional(v.string()),
    guaranteeText: v.optional(v.string()),
    showGuarantee: v.optional(v.boolean()),
    acceptsPayPal: v.optional(v.boolean()),
    acceptsStripe: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      userId: v.string(),
      instructorId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      courseCategoryId: v.optional(v.string()),
      slug: v.optional(v.string()),
      // Additional fields for course creation form
      category: v.optional(v.string()),
      skillLevel: v.optional(v.string()),
      checkoutHeadline: v.optional(v.string()),
      checkoutDescription: v.optional(v.string()),
      paymentDescription: v.optional(v.string()),
      guaranteeText: v.optional(v.string()),
      showGuarantee: v.optional(v.boolean()),
      acceptsPayPal: v.optional(v.boolean()),
      acceptsStripe: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Toggle course published status
export const togglePublished = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    isPublished: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    try {
      const course = await ctx.db.get(args.courseId);
      
      if (!course) {
        return { success: false };
      }
      
      // Check if user owns the course
      if (course.userId !== args.userId) {
        return { success: false };
      }
      
      const newPublishedStatus = !course.isPublished;
      await ctx.db.patch(args.courseId, {
        isPublished: newPublishedStatus,
      });
      
      return {
        success: true,
        isPublished: newPublishedStatus,
      };
    } catch (error) {
      console.error("Error toggling published status:", error);
      return { success: false };
    }
  },
});

// Get course by ID for editing
export const getCourseForEdit = query({
  args: { 
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      userId: v.string(),
      instructorId: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      courseCategoryId: v.optional(v.string()),
      slug: v.optional(v.string()),
      // Additional fields for course creation form
      category: v.optional(v.string()),
      skillLevel: v.optional(v.string()),
      checkoutHeadline: v.optional(v.string()),
      checkoutDescription: v.optional(v.string()),
      paymentDescription: v.optional(v.string()),
      guaranteeText: v.optional(v.string()),
      showGuarantee: v.optional(v.boolean()),
      acceptsPayPal: v.optional(v.boolean()),
      acceptsStripe: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    
    if (!course || course.userId !== args.userId) {
      return null;
    }
    
    return course;
  },
}); 