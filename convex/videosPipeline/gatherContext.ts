import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Structured context object passed to the script generator.
 * Contains everything the LLM needs to write a compelling video script.
 */
export type VideoContext = {
  // Course data (if applicable)
  course?: {
    title: string;
    description?: string;
    price?: number;
    category?: string;
    subcategory?: string;
    skillLevel?: string;
    modules: Array<{ title: string; lessonCount: number }>;
    moduleCount: number;
    lessonCount: number;
    enrollmentCount: number;
    averageRating?: number;
    reviewCount: number;
    topReview?: string;
  };

  // Product data (if applicable)
  product?: {
    title: string;
    description?: string;
    price: number;
    productType?: string;
    productCategory?: string;
  };

  // Creator store info
  store?: {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerImage?: string;
    socialLinks?: Doc<"stores">["socialLinks"];
    plan?: string;
  };

  // Analytics / social proof
  analytics: {
    totalSales: number;
    totalReviews: number;
    averageRating?: number;
  };

  // From the job
  prompt: string;
  style?: string;
  targetDuration: number;
  aspectRatio: string;
  voiceId?: string;
};

/**
 * Step 1: Gather all relevant context for video generation.
 * Reads the job, then queries course/product/store/analytics data.
 */
export const gatherContext = internalQuery({
  args: {
    jobId: v.id("videoJobs"),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<VideoContext> => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error(`Video job ${args.jobId} not found`);
    }

    const context: VideoContext = {
      prompt: job.prompt,
      style: job.style,
      targetDuration: job.targetDuration,
      aspectRatio: job.aspectRatio,
      voiceId: job.voiceId,
      analytics: {
        totalSales: 0,
        totalReviews: 0,
      },
    };

    // Gather course data if courseId is provided
    if (job.courseId) {
      const course = await ctx.db.get(job.courseId);
      if (course) {
        // courseModules.courseId is v.string(), so cast _id to string
        const courseIdStr = course._id as unknown as string;

        // Get modules for this course
        const modules = await ctx.db
          .query("courseModules")
          .withIndex("by_courseId", (q) => q.eq("courseId", courseIdStr))
          .collect();

        // Get lesson counts per module
        const modulesWithLessons = await Promise.all(
          modules.map(async (mod) => {
            const modIdStr = mod._id as unknown as string;
            const lessons = await ctx.db
              .query("courseLessons")
              .withIndex("by_moduleId", (q) => q.eq("moduleId", modIdStr))
              .collect();
            return {
              title: mod.title,
              lessonCount: lessons.length,
            };
          })
        );

        const totalLessons = modulesWithLessons.reduce((sum, m) => sum + m.lessonCount, 0);

        // Get enrollment count — enrollments.courseId is v.id("courses")
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();

        // Get reviews — courseReviews.courseId is v.id("courses")
        const reviews = await ctx.db
          .query("courseReviews")
          .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : undefined;

        // Find top review (highest rating with text)
        const topReview = reviews
          .filter((r) => r.reviewText && r.rating >= 4)
          .sort((a, b) => b.rating - a.rating)[0];

        context.course = {
          title: course.title,
          description: course.description,
          price: course.price,
          category: course.category,
          subcategory: course.subcategory,
          skillLevel: course.skillLevel,
          modules: modulesWithLessons,
          moduleCount: modules.length,
          lessonCount: totalLessons,
          enrollmentCount: enrollments.length,
          averageRating: avgRating,
          reviewCount: reviews.length,
          topReview: topReview?.reviewText,
        };

        context.analytics.totalReviews = reviews.length;
        context.analytics.averageRating = avgRating;
      }
    }

    // Gather product data if productId is provided
    if (job.productId) {
      const product = await ctx.db.get(job.productId);
      if (product) {
        context.product = {
          title: product.title,
          description: product.description,
          price: product.price,
          productType: product.productType,
          productCategory: product.productCategory,
        };

        // Get product reviews — productReviews.productId is v.id("digitalProducts")
        const productReviews = await ctx.db
          .query("productReviews")
          .withIndex("by_productId", (q) => q.eq("productId", product._id))
          .collect();

        context.analytics.totalReviews += productReviews.length;
      }
    }

    // Gather store data
    if (job.storeId) {
      const store = await ctx.db.get(job.storeId);
      if (store) {
        context.store = {
          name: store.name,
          slug: store.slug,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerImage: store.bannerImage,
          socialLinks: store.socialLinks,
          plan: store.plan,
        };

        // Get total sales for this store — purchases.storeId is v.string()
        const storeIdStr = store._id as unknown as string;
        const purchases = await ctx.db
          .query("purchases")
          .withIndex("by_storeId", (q) => q.eq("storeId", storeIdStr))
          .collect();

        const completedPurchases = purchases.filter((p) => p.status === "completed");
        context.analytics.totalSales = completedPurchases.length;
      }
    }

    return context;
  },
});
