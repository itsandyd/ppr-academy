import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * COURSE REVIEWS SYSTEM
 * Enables students to rate and review courses they've completed
 * Provides social proof for course pages
 */

// ===== QUERIES =====

/**
 * Get all published reviews for a course
 */
export const getCourseReviews = query({
  args: {
    courseId: v.id("courses"),
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(v.literal("recent"), v.literal("helpful"), v.literal("highest"), v.literal("lowest"))
    ),
  },
  returns: v.object({
    reviews: v.array(
      v.object({
        _id: v.id("courseReviews"),
        userId: v.string(),
        userName: v.optional(v.string()),
        userAvatar: v.optional(v.string()),
        rating: v.number(),
        title: v.optional(v.string()),
        reviewText: v.string(),
        isVerifiedPurchase: v.boolean(),
        helpfulCount: v.number(),
        createdAt: v.number(),
        instructorResponse: v.optional(v.string()),
        instructorResponseAt: v.optional(v.number()),
      })
    ),
    totalCount: v.number(),
    averageRating: v.number(),
    ratingDistribution: v.object({
      five: v.number(),
      four: v.number(),
      three: v.number(),
      two: v.number(),
      one: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const sortBy = args.sortBy || "recent";

    // Get all published reviews for the course
    const allReviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(1000);

    const totalCount = allReviews.length;

    // Calculate rating distribution
    const ratingDistribution = {
      five: allReviews.filter((r) => r.rating === 5).length,
      four: allReviews.filter((r) => r.rating === 4).length,
      three: allReviews.filter((r) => r.rating === 3).length,
      two: allReviews.filter((r) => r.rating === 2).length,
      one: allReviews.filter((r) => r.rating === 1).length,
    };

    // Calculate average rating
    const averageRating =
      totalCount > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    // Sort reviews
    let sortedReviews = [...allReviews];
    switch (sortBy) {
      case "helpful":
        sortedReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
        break;
      case "highest":
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case "recent":
      default:
        sortedReviews.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Limit results
    sortedReviews = sortedReviews.slice(0, limit);

    // Enrich with user info
    const enrichedReviews = await Promise.all(
      sortedReviews.map(async (review) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", review.userId))
          .first();

        return {
          _id: review._id,
          userId: review.userId,
          userName: user?.name || "Anonymous",
          userAvatar: user?.imageUrl || undefined,
          rating: review.rating,
          title: review.title,
          reviewText: review.reviewText,
          isVerifiedPurchase: review.isVerifiedPurchase,
          helpfulCount: review.helpfulCount || 0,
          createdAt: review.createdAt,
          instructorResponse: review.instructorResponse,
          instructorResponseAt: review.instructorResponseAt,
        };
      })
    );

    return {
      reviews: enrichedReviews,
      totalCount,
      averageRating,
      ratingDistribution,
    };
  },
});

/**
 * Get course rating summary (for display on course cards)
 */
export const getCourseRatingSummary = query({
  args: { courseId: v.id("courses") },
  returns: v.object({
    averageRating: v.number(),
    totalReviews: v.number(),
    ratingDistribution: v.object({
      five: v.number(),
      four: v.number(),
      three: v.number(),
      two: v.number(),
      one: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(1000);

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { five: 0, four: 0, three: 0, two: 0, one: 0 },
      };
    }

    const averageRating =
      Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10;

    const ratingDistribution = {
      five: reviews.filter((r) => r.rating === 5).length,
      four: reviews.filter((r) => r.rating === 4).length,
      three: reviews.filter((r) => r.rating === 3).length,
      two: reviews.filter((r) => r.rating === 2).length,
      one: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  },
});

/**
 * Check if user can review a course (must be enrolled and not already reviewed)
 */
export const canUserReviewCourse = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.object({
    canReview: v.boolean(),
    reason: v.optional(v.string()),
    existingReviewId: v.optional(v.id("courseReviews")),
  }),
  handler: async (ctx, args) => {
    // Check if user is enrolled
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as any))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!enrollment) {
      return {
        canReview: false,
        reason: "You must be enrolled in this course to leave a review",
      };
    }

    // Check if user already has a review
    const existingReview = await ctx.db
      .query("courseReviews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .first();

    if (existingReview) {
      return {
        canReview: false,
        reason: "You have already reviewed this course",
        existingReviewId: existingReview._id,
      };
    }

    return { canReview: true };
  },
});

/**
 * Get user's review for a specific course
 */
export const getUserReviewForCourse = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseReviews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .first();
  },
});

/**
 * Get all reviews by a user
 */
export const getUserReviews = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const reviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich with course info
    return await Promise.all(
      reviews.map(async (review) => {
        const course = await ctx.db.get(review.courseId);
        return {
          ...review,
          courseTitle: course?.title || "Unknown Course",
          courseImage: course?.imageUrl,
          courseSlug: course?.slug,
        };
      })
    );
  },
});

// ===== MUTATIONS =====

/**
 * Create a new course review
 */
export const createReview = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    reviewText: v.string(),
  },
  returns: v.id("courseReviews"),
  handler: async (ctx, args) => {
    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if user is enrolled
    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId as any))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!enrollment) {
      throw new Error("You must be enrolled in this course to leave a review");
    }

    // Check for existing review
    const existingReview = await ctx.db
      .query("courseReviews")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .first();

    if (existingReview) {
      throw new Error("You have already reviewed this course");
    }

    // Create the review
    return await ctx.db.insert("courseReviews", {
      courseId: args.courseId,
      userId: args.userId,
      rating: args.rating,
      title: args.title,
      reviewText: args.reviewText,
      isVerifiedPurchase: true,
      isPublished: true, // Auto-publish, could add moderation later
      helpfulCount: 0,
      reportCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update an existing review
 */
export const updateReview = mutation({
  args: {
    reviewId: v.id("courseReviews"),
    userId: v.string(),
    rating: v.optional(v.number()),
    title: v.optional(v.string()),
    reviewText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== args.userId) {
      throw new Error("You can only edit your own reviews");
    }

    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    const updates: {
      rating?: number;
      title?: string;
      reviewText?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.title !== undefined) updates.title = args.title;
    if (args.reviewText !== undefined) updates.reviewText = args.reviewText;

    await ctx.db.patch(args.reviewId, updates);
  },
});

/**
 * Delete a review
 */
export const deleteReview = mutation({
  args: {
    reviewId: v.id("courseReviews"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== args.userId) {
      throw new Error("You can only delete your own reviews");
    }

    await ctx.db.delete(args.reviewId);
  },
});

/**
 * Mark a review as helpful
 */
export const markReviewHelpful = mutation({
  args: {
    reviewId: v.id("courseReviews"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Prevent self-voting
    if (review.userId === args.userId) {
      throw new Error("You cannot mark your own review as helpful");
    }

    await ctx.db.patch(args.reviewId, {
      helpfulCount: (review.helpfulCount || 0) + 1,
    });
  },
});

/**
 * Report a review (for moderation)
 */
export const reportReview = mutation({
  args: {
    reviewId: v.id("courseReviews"),
    userId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const newReportCount = (review.reportCount || 0) + 1;

    // Auto-hide if too many reports
    const shouldHide = newReportCount >= 3;

    await ctx.db.patch(args.reviewId, {
      reportCount: newReportCount,
      isPublished: shouldHide ? false : review.isPublished,
    });
  },
});

/**
 * Add instructor response to a review
 */
export const addInstructorResponse = mutation({
  args: {
    reviewId: v.id("courseReviews"),
    instructorId: v.string(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Verify the instructor owns the course
    const course = await ctx.db.get(review.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (course.userId !== args.instructorId && course.instructorId !== args.instructorId) {
      throw new Error("Only the course instructor can respond to reviews");
    }

    await ctx.db.patch(args.reviewId, {
      instructorResponse: args.response,
      instructorResponseAt: Date.now(),
    });
  },
});

// ===== INTERNAL QUERIES =====

/**
 * Get course average rating for internal use
 */
export const getCourseAverageRating = internalQuery({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(1000);

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const averageRating =
      Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;

    return { averageRating, totalReviews: reviews.length };
  },
});
