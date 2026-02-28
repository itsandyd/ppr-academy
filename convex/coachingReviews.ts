import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

export const submitReview = mutation({
  args: {
    sessionId: v.id("coachingSessions"),
    rating: v.number(),
    reviewText: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;

    if (args.rating < 1 || args.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.studentId !== userId) {
      return { success: false, error: "Only the student can leave a review" };
    }

    const reviewableStatuses = ["COMPLETED", "NO_SHOW_BUYER"];
    if (!reviewableStatuses.includes(session.status)) {
      return { success: false, error: "Session must be completed to leave a review" };
    }

    const existing = await ctx.db
      .query("coachingReviews")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      return { success: false, error: "You have already reviewed this session" };
    }

    await ctx.db.insert("coachingReviews", {
      sessionId: args.sessionId,
      studentId: userId,
      coachId: session.coachId,
      rating: args.rating,
      reviewText: args.reviewText,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getReviewForSession = query({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.union(
    v.object({
      _id: v.id("coachingReviews"),
      rating: v.number(),
      reviewText: v.optional(v.string()),
      createdAt: v.number(),
      studentName: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("coachingReviews")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!review) return null;

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", review.studentId))
      .first();

    return {
      _id: review._id,
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
      studentName: student?.name,
    };
  },
});

export const getReviewsForCoach = query({
  args: { coachId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("coachingReviews"),
      sessionId: v.id("coachingSessions"),
      rating: v.number(),
      reviewText: v.optional(v.string()),
      createdAt: v.number(),
      studentName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("coachingReviews")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .take(500);

    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const student = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", review.studentId))
          .first();

        return {
          _id: review._id,
          sessionId: review.sessionId,
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt,
          studentName: student?.name,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});
