import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Check if user already has access to a specific course
export const hasUserPurchasedCourse = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingPurchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    return !!existingPurchase;
  },
});

// Get all purchases for a user (for library overview)
export const getUserPurchases = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      _creationTime: v.number(),
      userId: v.string(),
      productType: v.union(
        v.literal("digitalProduct"),
        v.literal("course"),
        v.literal("coaching"),
        v.literal("bundle")
      ),
      amount: v.number(),
      currency: v.optional(v.string()),
      status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
      accessGranted: v.optional(v.boolean()),
      downloadCount: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      // Product details
      productId: v.optional(v.id("digitalProducts")),
      courseId: v.optional(v.id("courses")),
      productTitle: v.optional(v.string()),
      productImageUrl: v.optional(v.string()),
      productDescription: v.optional(v.string()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
      // Full product object for packs (includes packFiles)
      product: v.optional(v.any()),
    })
  ),
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // Enrich with product details
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let productTitle = "";
        let productImageUrl = "";
        let productDescription = "";
        let storeName = "";
        let storeSlug = "";

        // Get store details
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), purchase.adminUserId))
          .first();

        if (store) {
          storeName = store.name;
          storeSlug = store.slug;
        }

        // Get product details based on type
        if (purchase.productType === "course" && purchase.courseId) {
          const course = await ctx.db.get(purchase.courseId);
          if (course) {
            productTitle = course.title;
            productImageUrl = course.imageUrl || "";
            productDescription = course.description || "";
          }
        } else if (purchase.productType === "digitalProduct" && purchase.productId) {
          const product = await ctx.db.get(purchase.productId);
          if (product) {
            productTitle = product.title;
            productImageUrl = product.imageUrl || "";
            productDescription = product.description || "";

            // Return full product object for packs (needed for packFiles)
            return {
              _id: purchase._id,
              _creationTime: purchase._creationTime,
              userId: purchase.userId,
              productType: purchase.productType,
              amount: purchase.amount,
              currency: purchase.currency,
              status: purchase.status,
              accessGranted: purchase.accessGranted,
              downloadCount: purchase.downloadCount,
              lastAccessedAt: purchase.lastAccessedAt,
              productId: purchase.productId,
              courseId: purchase.courseId,
              productTitle,
              productImageUrl,
              productDescription,
              storeName,
              storeSlug,
              product, // Include full product object
            };
          }
        }

        return {
          _id: purchase._id,
          _creationTime: purchase._creationTime,
          userId: purchase.userId,
          productType: purchase.productType,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          accessGranted: purchase.accessGranted,
          downloadCount: purchase.downloadCount,
          lastAccessedAt: purchase.lastAccessedAt,
          productId: purchase.productId,
          courseId: purchase.courseId,
          productTitle,
          productImageUrl,
          productDescription,
          storeName,
          storeSlug,
        };
      })
    );

    return enrichedPurchases;
  },
});

// Get purchased courses for a user
export const getUserCourses = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      slug: v.optional(v.string()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      skillLevel: v.optional(v.string()),
      purchaseDate: v.number(),
      progress: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Get course purchases for user
    const coursePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(q.eq(q.field("status"), "completed"), q.eq(q.field("productType"), "course"))
      )
      .collect();

    // Deduplicate courses by courseId (in case user has multiple purchases for same course)
    const uniqueCourseIds = Array.from(
      new Set(coursePurchases.filter((p) => p.courseId).map((p) => p.courseId!))
    );

    // Get course details and progress for unique courses only
    const userCourses = await Promise.all(
      uniqueCourseIds.map(async (courseId) => {
        const course = await ctx.db.get(courseId);
        if (!course) return null;

        // Get the most recent purchase for this course
        const purchase = coursePurchases
          .filter((p) => p.courseId === courseId)
          .sort((a, b) => b._creationTime - a._creationTime)[0];

        // Get user progress for this course
        const userProgress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", courseId))
          .collect();

        // Calculate overall progress
        const totalChapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();

        const completedChapters = userProgress.filter((p) => p.isCompleted).length;
        const progress =
          totalChapters.length > 0
            ? Math.round((completedChapters / totalChapters.length) * 100)
            : 0;

        // Get store details
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), course.userId))
          .first();

        return {
          _id: course._id,
          _creationTime: course._creationTime,
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          slug: course.slug,
          category: course.category,
          subcategory: course.subcategory,
          tags: course.tags,
          skillLevel: course.skillLevel,
          purchaseDate: purchase._creationTime,
          progress,
          lastAccessedAt: purchase.lastAccessedAt,
          storeName: store?.name,
          storeSlug: store?.slug,
        };
      })
    );

    return userCourses.filter(Boolean) as any[];
  },
});

// Get purchased digital products for a user
export const getUserDigitalProducts = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"))),
      url: v.optional(v.string()),
      style: v.optional(
        v.union(
          v.literal("button"),
          v.literal("callout"),
          v.literal("preview"),
          v.literal("card"),
          v.literal("minimal")
        )
      ),
      purchaseDate: v.number(),
      downloadCount: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Get digital product purchases for user
    const productPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(q.eq(q.field("status"), "completed"), q.eq(q.field("productType"), "digitalProduct"))
      )
      .collect();

    // Get product details
    const userProducts = await Promise.all(
      productPurchases.map(async (purchase) => {
        if (!purchase.productId) return null;

        const product = await ctx.db.get(purchase.productId);
        if (!product) return null;

        // Get store details
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), product.userId))
          .first();

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          title: product.title,
          description: product.description,
          imageUrl: product.imageUrl,
          downloadUrl: product.downloadUrl,
          productType: product.productType,
          url: product.url,
          style: product.style,
          purchaseDate: purchase._creationTime,
          downloadCount: purchase.downloadCount,
          lastAccessedAt: purchase.lastAccessedAt,
          storeName: store?.name,
          storeSlug: store?.slug,
        };
      })
    );

    return userProducts.filter(Boolean) as any[];
  },
});

// Verify user has access to a specific course
export const verifyCourseAccess = query({
  args: {
    userId: v.string(),
    slug: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    purchaseDate: v.optional(v.number()),
    progress: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // First, get the course by slug
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course) {
      return { hasAccess: false };
    }

    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", course._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (!purchase) {
      return { hasAccess: false };
    }

    // Calculate progress
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", course._id))
      .collect();

    const totalChapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
      .collect();

    const completedChapters = userProgress.filter((p) => p.isCompleted).length;
    const progress =
      totalChapters.length > 0 ? Math.round((completedChapters / totalChapters.length) * 100) : 0;

    return {
      hasAccess: true,
      purchaseDate: purchase._creationTime,
      progress,
    };
  },
});

// Verify user has access to a digital product
export const verifyProductAccess = query({
  args: {
    userId: v.string(),
    productId: v.id("digitalProducts"),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    purchaseDate: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (!purchase) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      purchaseDate: purchase._creationTime,
      downloadCount: purchase.downloadCount,
    };
  },
});

// Update user progress
export const updateProgress = mutation({
  args: {
    userId: v.string(),
    slug: v.string(),
    chapterId: v.string(),
    moduleId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    isCompleted: v.boolean(),
    timeSpent: v.optional(v.number()),
  },
  returns: v.id("userProgress"),
  handler: async (ctx, args) => {
    // First, get the course by slug
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course) {
      throw new Error("Course not found");
    }
    // Check if progress record exists
    const existingProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_chapter", (q) =>
        q.eq("userId", args.userId).eq("chapterId", args.chapterId)
      )
      .unique();

    const progressData = {
      userId: args.userId,
      courseId: course._id,
      moduleId: args.moduleId,
      lessonId: args.lessonId,
      chapterId: args.chapterId,
      isCompleted: args.isCompleted,
      completedAt: args.isCompleted ? Date.now() : undefined,
      timeSpent: args.timeSpent,
      lastAccessedAt: Date.now(),
    };

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, progressData);
      return existingProgress._id;
    } else {
      return await ctx.db.insert("userProgress", progressData);
    }
  },
});

// Track library session
export const trackLibrarySession = mutation({
  args: {
    userId: v.string(),
    sessionType: v.union(
      v.literal("course"),
      v.literal("download"),
      v.literal("coaching"),
      v.literal("browse")
    ),
    resourceId: v.optional(v.string()),
    duration: v.optional(v.number()),
    deviceType: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("librarySessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("librarySessions", {
      userId: args.userId,
      sessionType: args.sessionType,
      resourceId: args.resourceId,
      startedAt: Date.now(),
      endedAt: args.duration ? Date.now() + args.duration * 1000 : undefined,
      duration: args.duration,
      deviceType: args.deviceType,
      userAgent: args.userAgent,
    });
  },
});

// Update download count for digital product
export const trackDownload = mutation({
  args: {
    userId: v.string(),
    productId: v.id("digitalProducts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", args.userId).eq("productId", args.productId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (purchase) {
      await ctx.db.patch(purchase._id, {
        downloadCount: (purchase.downloadCount || 0) + 1,
        lastAccessedAt: Date.now(),
      });
    }
  },
});

// Get course content with user progress
export const getCourseWithProgress = query({
  args: {
    userId: v.string(),
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      slug: v.optional(v.string()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      skillLevel: v.optional(v.string()),
      modules: v.optional(
        v.array(
          v.object({
            _id: v.string(),
            title: v.string(),
            description: v.optional(v.string()),
            position: v.number(),
            lessons: v.optional(
              v.array(
                v.object({
                  _id: v.string(),
                  title: v.string(),
                  description: v.optional(v.string()),
                  position: v.number(),
                  chapters: v.optional(
                    v.array(
                      v.object({
                        _id: v.string(),
                        title: v.string(),
                        description: v.optional(v.string()),
                        videoUrl: v.optional(v.string()),
                        audioUrl: v.optional(v.string()),
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
                        position: v.number(),
                        isCompleted: v.optional(v.boolean()),
                        timeSpent: v.optional(v.number()),
                      })
                    )
                  ),
                })
              )
            ),
          })
        )
      ),
      overallProgress: v.number(),
      lastAccessedChapter: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // First, get the course by slug
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course) {
      return null;
    }

    // Verify access
    const hasAccess = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", course._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (!hasAccess) {
      return null;
    }

    // Get modules
    const courseModules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
      .order("asc")
      .collect();

    // Get user progress
    const userProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", course._id))
      .collect();

    const progressMap = new Map(userProgress.map((p) => [p.chapterId, p]));

    // Build course structure with progress
    const modules = await Promise.all(
      courseModules.map(async (module) => {
        const lessons = await ctx.db
          .query("courseLessons")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", module._id))
          .order("asc")
          .collect();

        const lessonsWithChapters = await Promise.all(
          lessons.map(async (lesson) => {
            const chapters = await ctx.db
              .query("courseChapters")
              .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
              .order("asc")
              .collect();

            const chaptersWithProgress = chapters.map((chapter) => {
              const progress = progressMap.get(chapter._id);
              return {
                _id: chapter._id,
                title: chapter.title,
                description: chapter.description,
                videoUrl: chapter.videoUrl,
                audioUrl: chapter.audioUrl,
                generatedAudioUrl: chapter.generatedAudioUrl,
                generatedVideoUrl: chapter.generatedVideoUrl,
                audioGenerationStatus: chapter.audioGenerationStatus,
                videoGenerationStatus: chapter.videoGenerationStatus,
                position: chapter.position,
                isCompleted: progress?.isCompleted || false,
                timeSpent: progress?.timeSpent,
              };
            });

            return {
              _id: lesson._id,
              title: lesson.title,
              description: lesson.description,
              position: lesson.position,
              chapters: chaptersWithProgress.length > 0 ? chaptersWithProgress : undefined,
            };
          })
        );

        return {
          _id: module._id,
          title: module.title,
          description: module.description,
          position: module.position,
          lessons: lessonsWithChapters.length > 0 ? lessonsWithChapters : undefined,
        };
      })
    );

    // Calculate overall progress
    const allChapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
      .collect();

    const completedChapters = userProgress.filter((p) => p.isCompleted).length;
    const overallProgress =
      allChapters.length > 0 ? Math.round((completedChapters / allChapters.length) * 100) : 0;

    // Get last accessed chapter
    const lastAccessed = userProgress.sort(
      (a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0)
    )[0];

    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      slug: course.slug,
      category: course.category,
      subcategory: course.subcategory,
      tags: course.tags,
      skillLevel: course.skillLevel,
      modules: modules.length > 0 ? modules : undefined,
      overallProgress,
      lastAccessedChapter: lastAccessed?.chapterId,
    };
  },
});

// Create course enrollment (purchase)
export const createCourseEnrollment = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  returns: v.id("purchases"),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Check if user already has this course
    const existingPurchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (existingPurchase) {
      throw new Error("You already have access to this course");
    }

    // Create purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.userId,
      courseId: args.courseId,
      storeId: course.storeId || course.userId, // fallback to userId if storeId not set
      adminUserId: course.userId,
      amount: args.amount,
      currency: args.currency || "USD",
      status: "completed",
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      productType: "course",
      accessGranted: true,
      downloadCount: 0,
      lastAccessedAt: Date.now(),
    });

    // Create enrollment record for backward compatibility
    const existingEnrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", args.courseId))
      .unique();

    if (!existingEnrollment) {
      await ctx.db.insert("enrollments", {
        userId: args.userId,
        courseId: args.courseId,
        progress: 0,
      });
    }

    // Create or update customer record for this purchase
    try {
      const storeId = course.storeId || course.userId;

      // Get user info for customer record
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .unique();

      if (user && storeId) {
        // Check if customer already exists
        const existingCustomer = await ctx.db
          .query("customers")
          .withIndex("by_email_and_store", (q) =>
            q.eq("email", user.email || "").eq("storeId", storeId)
          )
          .unique();

        // Determine customer type: "lead" for free courses, "paying" for paid courses
        const customerType = args.amount > 0 ? "paying" : "lead";

        if (existingCustomer) {
          // Update existing customer - only upgrade type if they're making a paid purchase
          const updates: any = {
            lastActivity: Date.now(),
            status: "active",
          };

          if (args.amount > 0) {
            updates.type = "paying";
            updates.totalSpent = (existingCustomer.totalSpent || 0) + args.amount;
          }

          await ctx.db.patch(existingCustomer._id, updates);
        } else {
          // Create new customer record
          await ctx.db.insert("customers", {
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown",
            email: user.email || args.userId,
            storeId: storeId,
            adminUserId: course.userId,
            type: customerType,
            status: "active",
            totalSpent: args.amount,
            lastActivity: Date.now(),
            source: course.title || "Course Enrollment",
          });
        }
      }
    } catch (error) {
      console.error("Failed to create/update customer record:", error);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (user?.email) {
      await ctx.scheduler.runAfter(0, internal.emailWorkflows.triggerProductPurchaseWorkflows, {
        storeId: course.storeId || course.userId,
        customerEmail: user.email,
        customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        productId: args.courseId,
        productName: course.title,
        productType: "course",
        orderId: purchaseId,
        amount: args.amount,
      });

      await ctx.scheduler.runAfter(0, internal.emailContactSync.syncContactFromEnrollment, {
        storeId: course.storeId || course.userId,
        email: user.email,
        userId: args.userId,
        courseId: args.courseId,
      });
    }

    return purchaseId;
  },
});
