import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Get all courses
export const getCourses = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    userId: v.string(),
    instructorId: v.optional(v.string()),
    storeId: v.optional(v.string()), // ✅ Added missing storeId field
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
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
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
      storeId: v.optional(v.string()),
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
      // Stripe integration fields
      stripeProductId: v.optional(v.string()),
      stripePriceId: v.optional(v.string()),
      // Modules data
      modules: v.optional(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!course) {
      return null;
    }

    // Fetch course modules if they exist
    const modules = await ctx.db
      .query("courseModules")
      .filter(q => q.eq(q.field("courseId"), course._id))
      .order("asc")
      .collect();

    // Build modules structure with lessons
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("courseLessons")
          .filter(q => q.eq(q.field("moduleId"), module._id))
          .order("asc")
          .collect();

        return {
          title: module.title,
          description: module.description,
          orderIndex: module.position,
          lessons: lessons.map(lesson => ({
            title: lesson.title,
            description: lesson.description,
            orderIndex: lesson.position,
          })),
        };
      })
    );

    return {
      _id: course._id,
      _creationTime: course._creationTime,
      userId: course.userId,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      isPublished: course.isPublished,
      courseCategoryId: course.courseCategoryId,
      slug: course.slug,
      storeId: course.storeId,
      category: course.category,
      skillLevel: course.skillLevel,
      checkoutHeadline: course.checkoutHeadline,
      checkoutDescription: course.checkoutDescription,
      paymentDescription: course.paymentDescription,
      guaranteeText: course.guaranteeText,
      showGuarantee: course.showGuarantee,
      acceptsPayPal: course.acceptsPayPal,
      acceptsStripe: course.acceptsStripe,
      stripeProductId: course.stripeProductId,
      stripePriceId: course.stripePriceId,
      modules: modulesWithLessons.length > 0 ? modulesWithLessons : undefined,
    };
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
    storeId: v.optional(v.string()), // ✅ Added missing storeId field
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
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get courses by store (NEW - for consistency with digital products)
// Get courses by store (all courses - for dashboard)
export const getCoursesByStore = query({
  args: { storeId: v.string() },
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
    storeId: v.optional(v.string()),
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
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// Get published courses by store (for public storefront)
export const getPublishedCoursesByStore = query({
  args: { storeId: v.string() },
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
    storeId: v.optional(v.string()),
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
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    // Filter for published courses only
    return courses.filter(course => course.isPublished === true);
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
    storeId: v.optional(v.string()), // ✅ Added missing storeId field
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
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_instructorId", (q) => q.eq("instructorId", args.instructorId))
      .collect();
  },
});

// Helper function to generate unique slug (removed duplicate)

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
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      skillLevel: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      price: v.string(),
      checkoutHeadline: v.string(),
      modules: v.optional(v.any()), // Simplify for now
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
        storeId: args.storeId, // Add storeId for store-specific filtering
        title: data.title,
        slug: uniqueSlug,
        description: data.description || undefined,
        price: parseFloat(data.price),
        imageUrl: data.thumbnail || undefined,
        isPublished: false, // Always start as unpublished
        // Hierarchical categorization
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags,
        skillLevel: data.skillLevel,
        checkoutHeadline: data.checkoutHeadline,
      });

      // Skip modules creation for now to simplify debugging
      // TODO: Add module creation back later
      console.log("Course created successfully:", courseId);

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
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
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

// Update course with modules
export const updateCourseWithModules = mutation({
  args: {
    courseId: v.id("courses"),
    courseData: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.optional(v.number()),
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
          generatedAudioData: v.optional(v.string()),
        })),
      })),
    }))),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { courseId, courseData, modules }) => {
    try {
      // Update the course basic info
      await ctx.db.patch(courseId, courseData);

      // If modules are provided, update them
      console.log(`🔥 updateCourseWithModules: Saving ${modules?.length || 0} modules for course ${courseId}`);
      if (modules && modules.length > 0) {
        // Delete existing modules and their children
        const existingModules = await ctx.db
          .query("courseModules")
          .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
          .collect();

        for (const module of existingModules) {
          // Delete lessons and chapters for this module
          const lessons = await ctx.db
            .query("courseLessons")
            .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
            .collect();

          for (const lesson of lessons) {
            // Delete chapters for this lesson
            const chapters = await ctx.db
              .query("courseChapters")
              .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
              .collect();

            for (const chapter of chapters) {
              await ctx.db.delete(chapter._id);
            }
            await ctx.db.delete(lesson._id);
          }
          await ctx.db.delete(module._id);
        }

        // Create new modules, lessons, and chapters
        for (const moduleData of modules) {
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
                  console.log(`🎵 Creating chapter "${chapterData.title}" with audio:`, {
                    hasGeneratedAudio: !!chapterData.generatedAudioData,
                    audioDataLength: chapterData.generatedAudioData?.length || 0,
                  });
                  
                  await ctx.db.insert("courseChapters", {
                    title: chapterData.title,
                    description: chapterData.content,
                    videoUrl: chapterData.videoUrl || undefined,
                    position: chapterData.orderIndex,
                    courseId,
                    lessonId,
                    isPublished: false,
                    // Save generated audio data if present
                    generatedAudioUrl: chapterData.generatedAudioData || undefined,
                    audioGenerationStatus: chapterData.generatedAudioData ? "completed" as const : undefined,
                    audioGeneratedAt: chapterData.generatedAudioData ? Date.now() : undefined,
                  });
                }
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating course with modules:", error);
      return { success: false, error: "Failed to update course" };
    }
  },
});

// Create or update a single chapter (for auto-save in ChapterDialog)
export const createOrUpdateChapter = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("courseLessons")),
    chapterId: v.union(v.id("courseChapters"), v.null()), // If provided, update existing chapter
    chapterData: v.object({
      title: v.string(),
      content: v.string(),
      videoUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      position: v.number(),
      generatedAudioData: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    chapterId: v.optional(v.id("courseChapters")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, error: "No user authentication found" };
      }

      // Get Convex user from Clerk ID
      const convexUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!convexUser) {
        return { success: false, error: "User not found in database" };
      }

      // Verify course ownership
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        return { success: false, error: "Course not found" };
      }
      
      if (course.userId !== convexUser._id) {
        return { success: false, error: "You don't have permission to edit this course" };
      }


      const chapterDbData = {
        title: args.chapterData.title,
        description: args.chapterData.content,
        videoUrl: args.chapterData.videoUrl || undefined,
        position: args.chapterData.position,
        courseId: args.courseId,
        lessonId: args.lessonId || undefined,
        isPublished: false,
        // Save generated audio data if present
        generatedAudioUrl: args.chapterData.generatedAudioData || undefined,
        audioGenerationStatus: args.chapterData.generatedAudioData ? "completed" as const : undefined,
        audioGeneratedAt: args.chapterData.generatedAudioData ? Date.now() : undefined,
      };

      let chapterId: Id<"courseChapters">;

      if (args.chapterId && args.chapterId !== null) {
        // Update existing chapter
        await ctx.db.patch(args.chapterId, chapterDbData);
        chapterId = args.chapterId;
        console.log(`📝 Updated existing chapter: ${args.chapterData.title}`);
      } else {
        // Try to find existing chapter by title, courseId, and lessonId
        const existingChapter = await ctx.db
          .query("courseChapters")
          .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
          .filter((q) => 
            q.and(
              q.eq(q.field("title"), args.chapterData.title),
              args.lessonId 
                ? q.eq(q.field("lessonId"), args.lessonId)
                : q.eq(q.field("lessonId"), undefined)
            )
          )
          .first();

        if (existingChapter) {
          // Update existing chapter
          await ctx.db.patch(existingChapter._id, chapterDbData);
          chapterId = existingChapter._id;
          console.log(`🔄 Found and updated existing chapter: ${args.chapterData.title} (ID: ${existingChapter._id})`);
        } else {
          // Create new chapter
          chapterId = await ctx.db.insert("courseChapters", chapterDbData);
          console.log(`✨ Created new chapter: ${args.chapterData.title}`);
        }
      }

      return { success: true, chapterId };
    } catch (error) {
      console.error("Error creating/updating chapter:", error);
      return { 
        success: false, 
        error: "Failed to save chapter" 
      };
    }
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

// Get course by ID for editing with complete structure
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
      // Modules structure for editing
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
            generatedAudioData: v.optional(v.string()),
          })),
        })),
      }))),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    
    if (!course || course.userId !== args.userId) {
      return null;
    }

    // Load modules for this course
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();

    console.log(`🔥 getCourseForEdit: Found ${modules.length} modules for course ${args.courseId}`);

    // Build the complete course structure
    const courseModules = [];
    
    for (const module of modules) {
      // Load lessons for this module
      const lessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
        .order("asc")
        .collect();

      const courseLessons = [];
      
      for (const lesson of lessons) {
        // Load chapters for this lesson
        const chapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .order("asc")
          .collect();

        const courseChapters = chapters.map(chapter => ({
          title: chapter.title,
          content: chapter.description || "",
          videoUrl: chapter.videoUrl || "",
          duration: 0, // Default duration
          orderIndex: chapter.position,
          generatedAudioData: chapter.generatedAudioUrl || undefined,
        }));

        courseLessons.push({
          title: lesson.title,
          description: lesson.description || "",
          orderIndex: lesson.position,
          chapters: courseChapters,
        });
      }

      courseModules.push({
        title: module.title,
        description: module.description || "",
        orderIndex: module.position,
        lessons: courseLessons,
      });
    }
    
    return {
      _id: course._id,
      _creationTime: course._creationTime,
      userId: course.userId,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      isPublished: course.isPublished,
      courseCategoryId: course.courseCategoryId,
      slug: course.slug,
      category: course.category,
      skillLevel: course.skillLevel,
      checkoutHeadline: course.checkoutHeadline,
      checkoutDescription: course.checkoutDescription,
      paymentDescription: course.paymentDescription,
      guaranteeText: course.guaranteeText,
      showGuarantee: course.showGuarantee,
      acceptsPayPal: course.acceptsPayPal,
      acceptsStripe: course.acceptsStripe,
      modules: courseModules.length > 0 ? courseModules : undefined,
    };
  },
});

// Sync course to Stripe (create product and price)
export const syncCourseToStripe = action({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.object({
    success: v.boolean(),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get course data
      const course = await ctx.runQuery(internal.courses.getCourseById, {
        courseId: args.courseId,
      });

      if (!course) {
        return { success: false, message: "Course not found" };
      }

      if (!course.price || course.price <= 0) {
        return { success: false, message: "Cannot sync free course to Stripe" };
      }

      // Call API to create Stripe product
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response: Response = await fetch(`${baseUrl}/api/courses/sync-to-stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          courseTitle: course.title,
          courseDescription: course.description,
          coursePrice: course.price,
          courseImageUrl: course.imageUrl,
        }),
      });

      const data: any = await response.json();

      if (data.success) {
        // Update course with Stripe IDs
        await ctx.runMutation(internal.courses.updateCourseStripeIds, {
          courseId: args.courseId,
          stripeProductId: data.stripeProductId,
          stripePriceId: data.stripePriceId,
        });

        return {
          success: true,
          stripeProductId: data.stripeProductId,
          stripePriceId: data.stripePriceId,
          message: "Course synced to Stripe successfully",
        };
      } else {
        return { success: false, message: data.error || "Failed to sync to Stripe" };
      }
    } catch (error) {
      console.error("Stripe sync error:", error);
      return { success: false, message: "Failed to sync course to Stripe" };
    }
  },
});

// Internal mutation to update Stripe IDs
export const updateCourseStripeIds = internalMutation({
  args: {
    courseId: v.id("courses"),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.courseId, {
      stripeProductId: args.stripeProductId,
      stripePriceId: args.stripePriceId,
    });
    return null;
  },
});

// Internal query to get course by ID
export const getCourseById = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

// Delete course and all related data
export const deleteCourse = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const course = await ctx.db.get(args.courseId);
      
      if (!course) {
        return { success: false, message: "Course not found" };
      }
      
      // Check if user owns the course
      if (course.userId !== args.userId) {
        return { success: false, message: "You don't have permission to delete this course" };
      }
      
      // Delete all course modules
      const modules = await ctx.db
        .query("courseModules")
        .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
        .collect();
      
      for (const module of modules) {
        // Delete all lessons in this module
        const lessons = await ctx.db
          .query("courseLessons")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
          .collect();
        
        for (const lesson of lessons) {
          // Delete all chapters in this lesson
          const chapters = await ctx.db
            .query("courseChapters")
            .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
            .collect();
          
          for (const chapter of chapters) {
            await ctx.db.delete(chapter._id);
          }
          
          await ctx.db.delete(lesson._id);
        }
        
        await ctx.db.delete(module._id);
      }
      
      // Delete the course itself
      await ctx.db.delete(args.courseId);
      
      return { success: true, message: "Course deleted successfully" };
    } catch (error) {
      console.error("Failed to delete course:", error);
      return { success: false, message: "Failed to delete course" };
    }
  },
});

export const getChapterById = query({
  args: {
    chapterId: v.id("courseChapters"),
    userId: v.string(),
  },
  returns: v.union(v.object({
    _id: v.id("courseChapters"),
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    position: v.number(),
    courseId: v.string(),
    lessonId: v.optional(v.string()),
    generatedAudioUrl: v.optional(v.string()),
    generatedVideoUrl: v.optional(v.string()),
    audioGenerationStatus: v.optional(v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed"))),
    videoGenerationStatus: v.optional(v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed"))),
  }), v.null()),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) {
      return null;
    }

    // Verify ownership - get the course and check if user owns it
    const course = await ctx.db.get(chapter.courseId as Id<"courses">);
    if (!course || course.userId !== args.userId) {
      return null;
    }

    return chapter;
  },
});

// Clean up duplicate chapters (utility function for one-time cleanup)
export const cleanupDuplicateChapters = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    removedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, removedCount: 0, message: "No user authentication found" };
      }

      // Get Convex user from Clerk ID
      const convexUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!convexUser) {
        return { success: false, removedCount: 0, message: "User not found in database" };
      }

      // Verify course ownership
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        return { success: false, removedCount: 0, message: "Course not found" };
      }
      
      if (course.userId !== convexUser._id) {
        return { success: false, removedCount: 0, message: "You don't have permission to edit this course" };
      }

      // Get all chapters for this course
      const allChapters = await ctx.db
        .query("courseChapters")
        .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
        .collect();

      console.log(`🧹 Found ${allChapters.length} chapters for course ${args.courseId}`);

      // Group chapters by title and lessonId to find duplicates
      const chapterGroups: Record<string, typeof allChapters> = {};
      
      for (const chapter of allChapters) {
        const groupKey = `${chapter.title}|${chapter.lessonId || 'no-lesson'}`;
        if (!chapterGroups[groupKey]) {
          chapterGroups[groupKey] = [];
        }
        chapterGroups[groupKey].push(chapter);
      }

      let removedCount = 0;

      // For each group with duplicates, keep the most recent one (by _creationTime) and delete the rest
      for (const [groupKey, chapters] of Object.entries(chapterGroups)) {
        if (chapters.length > 1) {
          // Sort by creation time (newest first)
          chapters.sort((a, b) => b._creationTime - a._creationTime);
          
          // Keep the first (newest) chapter, delete the rest
          const toKeep = chapters[0];
          const toDelete = chapters.slice(1);
          
          console.log(`🧹 Group "${groupKey}": keeping ${toKeep._id} (${new Date(toKeep._creationTime).toISOString()}), deleting ${toDelete.length} duplicates`);
          
          for (const duplicate of toDelete) {
            await ctx.db.delete(duplicate._id);
            removedCount++;
            console.log(`🗑️ Deleted duplicate chapter: ${duplicate._id} (${new Date(duplicate._creationTime).toISOString()})`);
          }
        }
      }

      return {
        success: true,
        removedCount,
        message: `Cleanup complete. Removed ${removedCount} duplicate chapters.`,
      };
    } catch (error) {
      console.error("Error cleaning up duplicate chapters:", error);
      return { 
        success: false, 
        removedCount: 0,
        message: "Failed to cleanup duplicate chapters" 
      };
    }
  },
});

// Get all published courses across all stores (for marketplace homepage)
export const getAllPublishedCourses = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.string()),
    skillLevel: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    userId: v.string(),
    published: v.boolean(),
    enrollmentCount: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    // Get all published courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Enrich with enrollment counts and creator info
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        // Get enrollment count
        const enrollments = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("courseId"), course._id))
          .collect();
        
        // Get creator info
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        // Try to get store info first
        if (course.storeId) {
          const store = await ctx.db.get(course.storeId as Id<"stores">);
          if (store) {
            const user = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("clerkId"), store.userId))
              .first();
            if (user) {
              creatorName = user.name || store.name || "Creator";
              creatorAvatar = user.imageUrl;
            }
          }
        }

        return {
          _id: course._id,
          _creationTime: course._creationTime,
          title: course.title,
          slug: course.slug || generateSlug(course.title),
          description: course.description,
          price: course.price || 0,
          thumbnail: course.imageUrl,
          category: course.category,
          skillLevel: course.skillLevel,
          storeId: course.storeId as Id<"stores"> | undefined,
          userId: course.userId,
          published: course.isPublished || false,
          enrollmentCount: enrollments.length,
          creatorName,
          creatorAvatar,
        };
      })
    );

    return coursesWithDetails;
  },
});


// Get all courses (admin only)
export const getAllCourses = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});
