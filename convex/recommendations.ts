import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Simple Recommendation Engine
 * 
 * Generates personalized course recommendations based on:
 * 1. Completed courses (similar courses)
 * 2. Enrolled but incomplete courses
 * 3. Trending courses
 * 4. Skill gaps (courses in categories user hasn't explored)
 */

// Generate recommendations for a user
export const generateRecommendations = mutation({
  args: { userId: v.string() },
  returns: v.object({
    success: v.boolean(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user's progress
      const userProgress = await ctx.db
        .query("studentProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(500);

      // Get all courses
      const allCourses = await ctx.db.query("courses").take(500);

      // Get completed course IDs
      const completedCourseIds = userProgress
        .filter(p => p.completionPercentage === 100)
        .map(p => p.courseId);

      // Get enrolled course IDs
      const enrolledCourseIds = userProgress.map(p => p.courseId);

      // Filter out enrolled courses
      const availableCourses = allCourses.filter(
        c => !enrolledCourseIds.includes(c._id)
      );

      if (availableCourses.length === 0) {
        // No recommendations available
        await ctx.db.insert("recommendations", {
          userId: args.userId,
          recommendations: [],
          generatedAt: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        });

        return { success: true, count: 0 };
      }

      // Recommendation scoring
      const scoredCourses = availableCourses.map(course => {
        let score = 0;
        let reason = "";

        // 1. Similar category to completed courses
        const completedCourseCategories = allCourses
          .filter(c => completedCourseIds.includes(c._id))
          .map(c => c.category)
          .filter(Boolean);

        if (completedCourseCategories.includes(course.category)) {
          score += 40;
          reason = "similar_to_completed";
        }

        // 2. Skill level progression
        const userLevels = userProgress.map(p => {
          const c = allCourses.find(course => course._id === p.courseId);
          return c?.skillLevel;
        }).filter(Boolean);

        if (userLevels.includes("Beginner") && course.skillLevel === "Intermediate") {
          score += 30;
          reason = "skill_progression";
        }

        // 3. New category (skill gap)
        const userCategories = allCourses
          .filter(c => enrolledCourseIds.includes(c._id))
          .map(c => c.category)
          .filter(Boolean);

        if (!userCategories.includes(course.category) && course.category) {
          score += 20;
          if (!reason) reason = "skill_gap";
        }

        // 4. Published and has content
        if (course.isPublished && (course as any).modules && (course as any).modules.length > 0) {
          score += 10;
        }

        return {
          courseId: course._id,
          score,
          reason: reason || "trending",
        };
      });

      // Sort by score and take top 10
      const topRecommendations = scoredCourses
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Save recommendations
      const existing = await ctx.db
        .query("recommendations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          recommendations: topRecommendations,
          generatedAt: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        });
      } else {
        await ctx.db.insert("recommendations", {
          userId: args.userId,
          recommendations: topRecommendations,
          generatedAt: Date.now(),
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        });
      }

      return { success: true, count: topRecommendations.length };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return { success: false, count: 0 };
    }
  },
});

// Get recommendations with course details
export const getRecommendationsWithDetails = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!recommendations || recommendations.expiresAt < Date.now()) {
      return null; // Trigger regeneration
    }

    // Fetch course details for each recommendation
    const coursesWithDetails = await Promise.all(
      recommendations.recommendations.map(async (rec) => {
        const course = await ctx.db.get(rec.courseId);
        return {
          ...rec,
          course,
        };
      })
    );

    // Filter out courses that no longer exist
    const validCourses = coursesWithDetails.filter(c => c.course !== null);

    return {
      recommendations: validCourses,
      generatedAt: recommendations.generatedAt,
    };
  },
});
