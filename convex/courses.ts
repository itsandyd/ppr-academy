import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Dynamic import to avoid TypeScript circular type inference issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { internal } = require("./_generated/api");

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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
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
      // Follow gate fields (for free courses with download gates)
      followGateEnabled: v.optional(v.boolean()),
      followGateRequirements: v.optional(v.object({
        requireEmail: v.optional(v.boolean()),
        requireInstagram: v.optional(v.boolean()),
        requireTiktok: v.optional(v.boolean()),
        requireYoutube: v.optional(v.boolean()),
        requireSpotify: v.optional(v.boolean()),
        minFollowsRequired: v.optional(v.number()),
      })),
      followGateSocialLinks: v.optional(v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
      })),
      followGateMessage: v.optional(v.string()),
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

    // Fetch course modules if they exist (using index instead of filter)
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", q => q.eq("courseId", course._id))
      .order("asc")
      .collect();

    // Build modules structure with lessons
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("courseLessons")
          .withIndex("by_moduleId", q => q.eq("moduleId", module._id))
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
      subcategory: course.subcategory,
      tags: course.tags,
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
      followGateEnabled: course.followGateEnabled,
      followGateRequirements: course.followGateRequirements,
      followGateSocialLinks: course.followGateSocialLinks,
      followGateMessage: course.followGateMessage,
      modules: modulesWithLessons.length > 0 ? modulesWithLessons : undefined,
    };
  },
});

/**
 * Get course with full instructor/creator information
 * Used on course pages to display instructor details
 */
export const getCourseWithInstructor = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.object({
      course: v.any(),
      instructor: v.object({
        name: v.string(),
        avatar: v.optional(v.string()),
        bio: v.optional(v.string()),
        rating: v.number(),
        studentCount: v.number(),
        courseCount: v.number(),
        verified: v.boolean(),
        socialLinks: v.optional(v.object({
          instagram: v.optional(v.string()),
          youtube: v.optional(v.string()),
          twitter: v.optional(v.string()),
        })),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    // Try to get instructor from store
    let instructorInfo = {
      name: "Course Instructor",
      avatar: undefined as string | undefined,
      bio: undefined as string | undefined,
      rating: 0,
      studentCount: 0,
      courseCount: 0,
      verified: false,
      socialLinks: undefined as { instagram?: string; youtube?: string; twitter?: string } | undefined,
    };

    // Get store for this course
    if (course.storeId) {
      const store = await ctx.db.get(course.storeId as Id<"stores">);
      if (store) {
        instructorInfo.name = store.name || "Course Instructor";
        instructorInfo.avatar = store.logoUrl || undefined;
        instructorInfo.bio = store.description || undefined;
        instructorInfo.verified = (store as any).verified === true || false;

        // Get social links from store
        if (store.socialLinks) {
          instructorInfo.socialLinks = store.socialLinks;
        }

        // Count students enrolled in this creator's courses
        const creatorCourses = await ctx.db
          .query("courses")
          .filter((q) => q.eq(q.field("storeId"), course.storeId))
          .collect();
        instructorInfo.courseCount = creatorCourses.length;

        // Count unique students
        const enrollmentCounts = await Promise.all(
          creatorCourses.map(async (c) => {
            const enrollments = await ctx.db
              .query("purchases")
              .filter((q) =>
                q.and(
                  q.eq(q.field("courseId"), c._id),
                  q.eq(q.field("status"), "completed")
                )
              )
              .collect();
            return enrollments.length;
          })
        );
        instructorInfo.studentCount = enrollmentCounts.reduce((sum, count) => sum + count, 0);

        // Calculate average rating from course reviews
        const allReviews = await Promise.all(
          creatorCourses.map(async (c) => {
            const reviews = await ctx.db
              .query("courseReviews")
              .withIndex("by_courseId", (q) => q.eq("courseId", c._id))
              .filter((q) => q.eq(q.field("isPublished"), true))
              .collect();
            return reviews;
          })
        );
        const flatReviews = allReviews.flat();
        if (flatReviews.length > 0) {
          instructorInfo.rating =
            Math.round((flatReviews.reduce((sum, r) => sum + r.rating, 0) / flatReviews.length) * 10) / 10;
        }
      }
    }

    // Fallback: try to get from user
    if (instructorInfo.name === "Course Instructor" && course.userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", course.userId))
        .first();
      if (user) {
        instructorInfo.name = user.name || user.firstName || "Instructor";
        instructorInfo.avatar = user.imageUrl || undefined;
      }
    }

    return {
      course,
      instructor: instructorInfo,
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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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

      // Create modules, lessons, and chapters if provided
      if (data.modules && Array.isArray(data.modules)) {
        console.log(`📦 Processing ${data.modules.length} modules`);
        
        for (let i = 0; i < data.modules.length; i++) {
          const moduleData = data.modules[i];
          console.log(`  📚 Module ${i + 1}: "${moduleData.title}"`);
          
          const moduleId = await ctx.db.insert("courseModules", {
            courseId,
            title: moduleData.title,
            description: moduleData.description,
            position: moduleData.orderIndex || 0,
          });

          // Create lessons for this module
          if (moduleData.lessons && Array.isArray(moduleData.lessons)) {
            console.log(`    📖 Found ${moduleData.lessons.length} lessons in module "${moduleData.title}"`);
            
            for (let j = 0; j < moduleData.lessons.length; j++) {
              const lessonData = moduleData.lessons[j];
              console.log(`      📝 Lesson ${j + 1}: "${lessonData.title}"`);
              console.log(`      🔍 Has chapters? ${!!lessonData.chapters}, Is array? ${Array.isArray(lessonData.chapters)}, Count: ${lessonData.chapters?.length || 0}`);
              
              const lessonId = await ctx.db.insert("courseLessons", {
                moduleId,
                title: lessonData.title,
                description: lessonData.description,
                position: lessonData.orderIndex || 0,
              });

              // Create chapters for this lesson
              if (lessonData.chapters && Array.isArray(lessonData.chapters)) {
                console.log(`        ✨ Creating ${lessonData.chapters.length} chapters for lesson "${lessonData.title}"`);
                
                for (let k = 0; k < lessonData.chapters.length; k++) {
                  const chapterData = lessonData.chapters[k];
                  console.log(`          📄 Chapter ${k + 1}: "${chapterData.title}"`);
                  
                  await ctx.db.insert("courseChapters", {
                    lessonId,
                    courseId,
                    title: chapterData.title,
                    description: chapterData.content || chapterData.description || "",
                    position: chapterData.orderIndex || k,
                    isPublished: true,
                  });
                }
                console.log(`        ✅ Created ${lessonData.chapters.length} chapters`);
              } else {
                console.log(`        ⚠️ NO CHAPTERS found for lesson "${lessonData.title}"!`);
                console.log(`        📊 Lesson data keys:`, Object.keys(lessonData));
              }
            }
          } else {
            console.log(`    ⚠️ NO LESSONS found for module "${moduleData.title}"!`);
          }
        }
        console.log(`✅ Created ${data.modules.length} modules with lessons and chapters`);
      } else {
        console.log(`⚠️ NO MODULES provided in data!`);
      }

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
    storeId: v.optional(v.string()),
    checkoutHeadline: v.optional(v.string()),
    checkoutDescription: v.optional(v.string()),
    paymentDescription: v.optional(v.string()),
    guaranteeText: v.optional(v.string()),
    showGuarantee: v.optional(v.boolean()),
    acceptsPayPal: v.optional(v.boolean()),
    acceptsStripe: v.optional(v.boolean()),
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    // Pinned product - appears first in storefront
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
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
      subcategory: v.optional(v.string()),
      skillLevel: v.optional(v.string()),
      storeId: v.optional(v.string()),
      checkoutHeadline: v.optional(v.string()),
      checkoutDescription: v.optional(v.string()),
      paymentDescription: v.optional(v.string()),
      guaranteeText: v.optional(v.string()),
      showGuarantee: v.optional(v.boolean()),
      acceptsPayPal: v.optional(v.boolean()),
      acceptsStripe: v.optional(v.boolean()),
      // Pinned product fields
      isPinned: v.optional(v.boolean()),
      pinnedAt: v.optional(v.number()),
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
      subcategory: v.optional(v.string()),
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
      const wasPublished = course.isPublished;

      // Update course with publishedAt timestamp if first time publishing
      const updateData: { isPublished: boolean; publishedAt?: number } = {
        isPublished: newPublishedStatus,
      };
      if (newPublishedStatus && !wasPublished) {
        updateData.publishedAt = Date.now();
      }

      await ctx.db.patch(args.courseId, updateData);

      // Track creator_published event when publishing for the first time
      if (newPublishedStatus && !wasPublished) {
        // Get store for this creator
        const store = await ctx.db
          .query("stores")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .first();

        // Check if this is creator's first published item
        const otherPublishedCourses = await ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .filter((q) =>
            q.and(
              q.eq(q.field("isPublished"), true),
              q.neq(q.field("_id"), args.courseId)
            )
          )
          .first();

        // Only track if this is their first publish
        if (!otherPublishedCourses) {
          await ctx.db.insert("analyticsEvents", {
            userId: args.userId,
            storeId: store?._id,
            eventType: "creator_published",
            resourceId: args.courseId,
            resourceType: "course",
            timestamp: Date.now(),
            metadata: {},
          });
        }
      }

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
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
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

      // Helper function to resolve storage ID to URL
      const resolveStorageUrl = async (url: string | undefined): Promise<string | undefined> => {
        if (!url) return undefined;
        // If it's already a full URL (http/https or data URI), return as-is
        if (url.startsWith("http") || url.startsWith("data:")) {
          return url;
        }
        // Otherwise, try to resolve it as a storage ID
        try {
          const resolvedUrl = await ctx.storage.getUrl(url as any);
          return resolvedUrl || url;
        } catch {
          // If resolution fails, return the original value
          return url;
        }
      };

      for (const lesson of lessons) {
        // Load chapters for this lesson
        const chapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .order("asc")
          .collect();

        // Resolve storage IDs to URLs for chapter audio
        const courseChapters = await Promise.all(
          chapters.map(async (chapter) => ({
            title: chapter.title,
            content: chapter.description || "",
            videoUrl: chapter.videoUrl || "",
            duration: 0, // Default duration
            orderIndex: chapter.position,
            generatedAudioData: await resolveStorageUrl(chapter.generatedAudioUrl),
          }))
        );

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
      subcategory: course.subcategory,
      tags: course.tags,
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
      // Get course data - cast to any to avoid deep type inference issues
      const course = await (ctx as any).runQuery(internal.courses.getCourseById, {
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

    // Helper function to resolve storage ID to URL
    const resolveStorageUrl = async (url: string | undefined): Promise<string | undefined> => {
      if (!url) return undefined;
      // If it's already a full URL (http/https or data URI), return as-is
      if (url.startsWith("http") || url.startsWith("data:")) {
        return url;
      }
      // Otherwise, try to resolve it as a storage ID
      try {
        const resolvedUrl = await ctx.storage.getUrl(url as any);
        return resolvedUrl || url;
      } catch {
        // If resolution fails, return the original value
        return url;
      }
    };

    // Return chapter with resolved storage URLs
    return {
      ...chapter,
      audioUrl: await resolveStorageUrl(chapter.audioUrl),
      generatedAudioUrl: await resolveStorageUrl(chapter.generatedAudioUrl),
      generatedVideoUrl: await resolveStorageUrl(chapter.generatedVideoUrl),
    };
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
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    skillLevel: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    userId: v.string(),
    published: v.boolean(),
    enrollmentCount: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
    // Follow gate fields (for free courses with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
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
          subcategory: course.subcategory,
          tags: course.tags,
          skillLevel: course.skillLevel,
          storeId: course.storeId as Id<"stores"> | undefined,
          userId: course.userId,
          published: course.isPublished || false,
          enrollmentCount: enrollments.length,
          creatorName,
          creatorAvatar,
          // Follow gate fields
          followGateEnabled: course.followGateEnabled,
          followGateRequirements: course.followGateRequirements,
          followGateSocialLinks: course.followGateSocialLinks,
          followGateMessage: course.followGateMessage,
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

// =============================================================================
// INTERNAL QUERIES FOR COURSE STRUCTURE (used by AI Course Builder)
// =============================================================================

// Internal query to get modules by course
export const getModulesByCourseInternal = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.array(v.object({
    _id: v.id("courseModules"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  })),
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("courseModules")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .collect();
    
    return modules.map(m => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      position: m.position,
    })).sort((a, b) => a.position - b.position);
  },
});

// Internal query to get lessons by module
export const getLessonsByModuleInternal = internalQuery({
  args: { moduleId: v.id("courseModules") },
  returns: v.array(v.object({
    _id: v.id("courseLessons"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  })),
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("courseLessons")
      .filter((q) => q.eq(q.field("moduleId"), args.moduleId))
      .collect();
    
    return lessons.map(l => ({
      _id: l._id,
      title: l.title,
      description: l.description,
      position: l.position,
    })).sort((a, b) => a.position - b.position);
  },
});

// Internal query to get chapters by lesson
export const getChaptersByLessonInternal = internalQuery({
  args: { lessonId: v.id("courseLessons") },
  returns: v.array(v.object({
    _id: v.id("courseChapters"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  })),
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("courseChapters")
      .filter((q) => q.eq(q.field("lessonId"), args.lessonId))
      .collect();
    
    return chapters.map(ch => ({
      _id: ch._id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
    })).sort((a, b) => a.position - b.position);
  },
});

// Internal query to get a chapter by ID
export const getChapterByIdInternal = internalQuery({
  args: { chapterId: v.id("courseChapters") },
  returns: v.union(v.object({
    _id: v.id("courseChapters"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;
    
    return {
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
    };
  },
});

/**
 * Update chapter description (for reformatting existing content)
 */
export const updateChapterDescription = internalMutation({
  args: { 
    chapterId: v.id("courseChapters"), 
    description: v.string() 
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, { 
      description: args.description,
    });
    return null;
  },
});

// Internal mutation to update chapter content
export const updateChapterContentInternal = internalMutation({
  args: {
    chapterId: v.id("courseChapters"),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, {
      description: args.description,
    });
    return null;
  },
});

// ============================================================================
// LEAD MAGNET ANALYZER SUPPORT QUERIES
// ============================================================================

/**
 * Get course info for lead magnet analysis
 */
export const getCourseForLeadMagnet = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      title: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;
    return {
      _id: course._id,
      title: course.title,
    };
  },
});

/**
 * Get all chapters for a course with enriched lesson/module info
 */
export const getChaptersForLeadMagnet = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(v.object({
    _id: v.id("courseChapters"),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    lessonId: v.optional(v.string()),
    lessonTitle: v.optional(v.string()),
    moduleTitle: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get all chapters for this course
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Get lesson and module info for each chapter
    const enrichedChapters = await Promise.all(
      chapters.map(async (chapter) => {
        let lessonTitle: string | undefined;
        let moduleTitle: string | undefined;

        if (chapter.lessonId) {
          // Try to get lesson info
          const lesson = await ctx.db
            .query("courseLessons")
            .filter((q) => q.eq(q.field("_id"), chapter.lessonId as any))
            .first();

          if (lesson) {
            lessonTitle = lesson.title;

            // Try to get module info from lesson
            if (lesson.moduleId) {
              const module = await ctx.db
                .query("courseModules")
                .filter((q) => q.eq(q.field("_id"), lesson.moduleId as any))
                .first();
              if (module) {
                moduleTitle = module.title;
              }
            }
          }
        }

        return {
          _id: chapter._id,
          title: chapter.title,
          description: chapter.description,
          position: chapter.position,
          lessonId: chapter.lessonId,
          lessonTitle,
          moduleTitle,
        };
      })
    );

    return enrichedChapters;
  },
});

/**
 * Get enriched chapters for cheat sheet generator (public query)
 * Returns chapters with module/lesson titles for admin UI selection
 */
export const getCourseChaptersEnriched = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();

    const enrichedChapters = await Promise.all(
      chapters.map(async (chapter: any) => {
        let lessonTitle: string | undefined;
        let moduleTitle: string | undefined;

        if (chapter.lessonId) {
          const lesson = await ctx.db
            .query("courseLessons")
            .filter((q: any) => q.eq(q.field("_id"), chapter.lessonId as any))
            .first();

          if (lesson) {
            lessonTitle = lesson.title;
            if (lesson.moduleId) {
              const mod = await ctx.db
                .query("courseModules")
                .filter((q: any) => q.eq(q.field("_id"), lesson.moduleId as any))
                .first();
              if (mod) {
                moduleTitle = mod.title;
              }
            }
          }
        }

        return {
          _id: chapter._id,
          title: chapter.title,
          description: chapter.description,
          position: chapter.position,
          lessonId: chapter.lessonId,
          lessonTitle,
          moduleTitle,
        };
      })
    );

    return enrichedChapters;
  },
});

/**
 * Get all chapters for a course (public query)
 * Used by social content creation flow to select chapter content
 * Resolves storage IDs to URLs for audio/video fields
 */
export const getCourseChapters = query({
  args: { courseId: v.id("courses") },
  returns: v.array(
    v.object({
      _id: v.id("courseChapters"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      courseId: v.string(),
      position: v.number(),
      lessonId: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      generatedAudioUrl: v.optional(v.string()),
      generatedVideoUrl: v.optional(v.string()),
      audioGenerationStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("generating"),
          v.literal("completed"),
          v.literal("failed")
        )
      ),
      videoGenerationStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("generating"),
          v.literal("completed"),
          v.literal("failed")
        )
      ),
      audioGeneratedAt: v.optional(v.number()),
      videoGeneratedAt: v.optional(v.number()),
      audioGenerationError: v.optional(v.string()),
      videoGenerationError: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      isFree: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Helper function to resolve storage ID to URL
    const resolveStorageUrl = async (url: string | undefined): Promise<string | undefined> => {
      if (!url) return undefined;
      // If it's already a full URL (http/https or data URI), return as-is
      if (url.startsWith("http") || url.startsWith("data:")) {
        return url;
      }
      // Otherwise, try to resolve it as a storage ID
      try {
        const resolvedUrl = await ctx.storage.getUrl(url as any);
        return resolvedUrl || url;
      } catch {
        // If resolution fails, return the original value
        return url;
      }
    };

    // Resolve storage IDs to URLs for each chapter
    const resolvedChapters = await Promise.all(
      chapters.map(async (chapter) => ({
        ...chapter,
        audioUrl: await resolveStorageUrl(chapter.audioUrl),
        generatedAudioUrl: await resolveStorageUrl(chapter.generatedAudioUrl),
        generatedVideoUrl: await resolveStorageUrl(chapter.generatedVideoUrl),
      }))
    );

    return resolvedChapters;
  },
});

// ============================================
// Mux Video Integration
// ============================================

/**
 * Update chapter with Mux upload ID when upload starts
 */
export const setChapterMuxUpload = mutation({
  args: {
    chapterId: v.id("courseChapters"),
    muxUploadId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, {
      muxUploadId: args.muxUploadId,
      muxAssetStatus: "waiting",
    });
  },
});

/**
 * Update chapter with Mux asset info (called by webhook)
 * This mutation finds the chapter by muxAssetId and updates it
 */
export const updateChapterMuxAsset = mutation({
  args: {
    muxAssetId: v.string(),
    muxPlaybackId: v.optional(v.string()),
    muxAssetStatus: v.union(
      v.literal("waiting"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("errored")
    ),
    videoDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find chapter by muxAssetId
    const chapter = await ctx.db
      .query("courseChapters")
      .withIndex("by_muxAssetId", (q) => q.eq("muxAssetId", args.muxAssetId))
      .first();

    if (!chapter) {
      // Asset ID not found - might be new upload, try to find by null assetId and update
      console.log(`No chapter found with muxAssetId: ${args.muxAssetId}`);
      return;
    }

    await ctx.db.patch(chapter._id, {
      muxAssetId: args.muxAssetId,
      muxPlaybackId: args.muxPlaybackId,
      muxAssetStatus: args.muxAssetStatus,
      videoDuration: args.videoDuration,
    });

    console.log(`Updated chapter ${chapter._id} with Mux playback ID: ${args.muxPlaybackId}`);
  },
});

/**
 * Set Mux asset ID on chapter after upload completes
 * Called from frontend after getting asset ID from upload status check
 */
export const setChapterMuxAssetId = mutation({
  args: {
    chapterId: v.id("courseChapters"),
    muxAssetId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chapterId, {
      muxAssetId: args.muxAssetId,
      muxAssetStatus: "preparing",
    });
  },
});

/**
 * Get chapter video info for player
 */
export const getChapterVideo = query({
  args: { chapterId: v.id("courseChapters") },
  returns: v.union(
    v.null(),
    v.object({
      muxPlaybackId: v.optional(v.string()),
      muxAssetStatus: v.optional(v.string()),
      videoDuration: v.optional(v.number()),
      videoUrl: v.optional(v.string()), // Legacy fallback
    })
  ),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;

    return {
      muxPlaybackId: chapter.muxPlaybackId,
      muxAssetStatus: chapter.muxAssetStatus,
      videoDuration: chapter.videoDuration,
      videoUrl: chapter.videoUrl,
    };
  },
});
