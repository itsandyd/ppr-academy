import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Debug User Enrollments
 * 
 * Check a user's enrollment and purchase data to diagnose access issues
 */
export const debugUserEnrollments = internalQuery({
  args: { clerkId: v.string() },
  returns: v.object({
    userExists: v.boolean(),
    userEmail: v.optional(v.string()),
    clerkId: v.string(),
    enrollmentCount: v.number(),
    purchaseCount: v.number(),
    enrollments: v.array(v.object({
      courseId: v.string(), // Use string to avoid type issues
      courseTitle: v.string(),
      progress: v.optional(v.number()),
      enrolledAt: v.number(),
    })),
    purchases: v.array(v.object({
      courseId: v.optional(v.string()), // Use string to avoid type issues
      courseTitle: v.optional(v.string()),
      status: v.string(),
      amount: v.number(),
      purchasedAt: v.number(),
    })),
    missingEnrollments: v.array(v.string()),
    missingPurchases: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check if user exists in Convex
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return {
        userExists: false,
        clerkId: args.clerkId,
        enrollmentCount: 0,
        purchaseCount: 0,
        enrollments: [],
        purchases: [],
        missingEnrollments: [],
        missingPurchases: [],
      };
    }

    // Get enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .collect();

    // Get course purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    // Get course details for enrollments
    const enrollmentDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId as any);
        return {
          courseId: enrollment.courseId as string,
          courseTitle: (course as any)?.title || "Unknown Course",
          progress: enrollment.progress,
          enrolledAt: enrollment._creationTime,
        };
      })
    );

    // Get course details for purchases
    const purchaseDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const course = purchase.courseId ? await ctx.db.get(purchase.courseId) : null;
        return {
          courseId: purchase.courseId as string | undefined,
          courseTitle: (course as any)?.title || "Unknown Course",
          status: purchase.status,
          amount: purchase.amount,
          purchasedAt: purchase._creationTime,
        };
      })
    );

    // Find mismatches
    const enrollmentCourseIds = enrollments.map(e => e.courseId as string);
    const purchaseCourseIds = purchases.map(p => p.courseId as string).filter(Boolean);

    const missingEnrollments = purchaseCourseIds.filter(
      courseId => !enrollmentCourseIds.includes(courseId)
    );
    const missingPurchases = enrollmentCourseIds.filter(
      courseId => !purchaseCourseIds.includes(courseId)
    );

    return {
      userExists: true,
      userEmail: user.email,
      clerkId: args.clerkId,
      enrollmentCount: enrollments.length,
      purchaseCount: purchases.length,
      enrollments: enrollmentDetails,
      purchases: purchaseDetails,
      missingEnrollments: missingEnrollments as any,
      missingPurchases: missingPurchases as any,
    };
  },
});

/**
 * Sync Enrollments and Purchases
 * 
 * Create missing enrollment records for users who have purchases but no enrollments
 */
export const syncEnrollmentsFromPurchases = internalMutation({
  args: { clerkId: v.string() },
  returns: v.object({
    created: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let errors = 0;

    // Get purchases without corresponding enrollments
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    for (const purchase of purchases) {
      if (!purchase.courseId) continue;

      try {
        // Check if enrollment exists
        const existingEnrollment = await ctx.db
          .query("enrollments")
          .withIndex("by_user_course", (q) => 
            q.eq("userId", args.clerkId).eq("courseId", purchase.courseId as any)
          )
          .unique();

        if (!existingEnrollment) {
          // Create missing enrollment
          await ctx.db.insert("enrollments", {
            userId: args.clerkId,
            courseId: purchase.courseId,
            progress: 0,
          });
          created++;
        }
      } catch (error) {
        errors++;
        console.error(`Failed to sync enrollment for course ${purchase.courseId}:`, error);
      }
    }

    return { created, errors };
  },
});
