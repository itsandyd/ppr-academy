import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fix Enrollment Issues
 * 
 * This module provides functions to diagnose and fix common enrollment problems
 */

// Check and fix a specific user's enrollment issues
export const fixUserEnrollments = internalMutation({
  args: { 
    clerkId: v.string(),
    courseSlug: v.optional(v.string()) // Specific course to fix
  },
  returns: v.object({
    fixed: v.boolean(),
    issues: v.array(v.string()),
    actions: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const issues: string[] = [];
    const actions: string[] = [];

    // 1. Check if user exists in Convex
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      issues.push("User not found in Convex database");
      return { fixed: false, issues, actions };
    }

    // 2. Get course (if specific course provided)
    let targetCourse = null;
    if (args.courseSlug) {
      targetCourse = await ctx.db
        .query("courses")
        .withIndex("by_slug", (q) => q.eq("slug", args.courseSlug))
        .first();

      if (!targetCourse) {
        issues.push(`Course not found: ${args.courseSlug}`);
        return { fixed: false, issues, actions };
      }
    }

    // 3. Check purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .filter((q) => q.eq(q.field("productType"), "course"))
      .take(10000);

    const validPurchases = purchases.filter(p => 
      p.status === "completed" && 
      p.courseId &&
      (!targetCourse || p.courseId === targetCourse._id)
    );

    if (validPurchases.length === 0) {
      issues.push("No valid course purchases found");
      return { fixed: false, issues, actions };
    }

    // 4. Check enrollments for each purchase
    for (const purchase of validPurchases) {
      const enrollment = await ctx.db
        .query("enrollments")
        .withIndex("by_user_course", (q) => 
          q.eq("userId", args.clerkId).eq("courseId", purchase.courseId!)
        )
        .unique();

      if (!enrollment) {
        // Create missing enrollment
        await ctx.db.insert("enrollments", {
          userId: args.clerkId,
          courseId: purchase.courseId!,
          progress: 0,
        });
        actions.push(`Created enrollment for course ${purchase.courseId}`);
      }
    }

    // 5. Verify course access
    if (targetCourse) {
      const hasAccess = await ctx.db
        .query("purchases")
        .withIndex("by_user_course", (q) => 
          q.eq("userId", args.clerkId).eq("courseId", targetCourse._id)
        )
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();

      if (!hasAccess) {
        issues.push(`User doesn't have valid purchase for course: ${args.courseSlug}`);
      } else {
        actions.push(`Verified access to course: ${args.courseSlug}`);
      }
    }

    return {
      fixed: actions.length > 0,
      issues,
      actions,
    };
  },
});

// Bulk fix all users with enrollment issues
export const fixAllEnrollmentIssues = internalMutation({
  args: {},
  returns: v.object({
    usersProcessed: v.number(),
    enrollmentsCreated: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    let usersProcessed = 0;
    let enrollmentsCreated = 0;
    let errors = 0;

    // Get all course purchases
    const allPurchases = await ctx.db
      .query("purchases")
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .take(10000);

    // Group by user
    const purchasesByUser = allPurchases.reduce((acc, purchase) => {
      if (!acc[purchase.userId]) acc[purchase.userId] = [];
      acc[purchase.userId].push(purchase);
      return acc;
    }, {} as Record<string, typeof allPurchases>);

    // Process each user
    for (const [userId, userPurchases] of Object.entries(purchasesByUser)) {
      usersProcessed++;

      for (const purchase of userPurchases) {
        if (!purchase.courseId) continue;

        try {
        // Check if enrollment exists
        const existingEnrollment = await ctx.db
          .query("enrollments")
          .withIndex("by_user_course", (q) => 
            q.eq("userId", userId).eq("courseId", purchase.courseId as any)
          )
          .unique();

          if (!existingEnrollment) {
            // Create missing enrollment
            await ctx.db.insert("enrollments", {
              userId: userId,
              courseId: purchase.courseId,
              progress: 0,
            });
            enrollmentsCreated++;
          }
        } catch (error) {
          errors++;
          console.error(`Error syncing enrollment for user ${userId}, course ${purchase.courseId}:`, error);
        }
      }
    }

    return {
      usersProcessed,
      enrollmentsCreated,
      errors,
    };
  },
});
