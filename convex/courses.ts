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
      storeId: course.storeId, // Add missing storeId field
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
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get courses by store (NEW - for consistency with digital products)
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
        // Additional fields from the form
        category: data.category,
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

      return { success: true };
    } catch (error) {
      console.error("Error updating course with modules:", error);
      return { success: false, error: "Failed to update course" };
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