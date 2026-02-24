import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Grant missing purchase records for courses that were paid for in Stripe
 * but failed to sync to Convex via webhook.
 */
export const grantMissingCoursePurchase = internalMutation({
  args: {
    clerkId: v.string(),
    courseId: v.id("courses"),
    amount: v.number(),
    transactionId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    purchaseId: v.optional(v.id("purchases")),
  }),
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return { success: false, message: `User not found: ${args.clerkId}` };
    }

    // Verify course exists
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return { success: false, message: `Course not found: ${args.courseId}` };
    }

    // Check if purchase already exists
    const existingPurchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.clerkId).eq("courseId", args.courseId)
      )
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (existingPurchase) {
      return {
        success: false,
        message: `Purchase already exists: ${existingPurchase._id}`,
      };
    }

    // Create purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.clerkId,
      courseId: args.courseId,
      storeId: course.storeId || course.userId,
      adminUserId: course.userId,
      amount: args.amount,
      currency: "USD",
      status: "completed",
      paymentMethod: "stripe",
      transactionId: args.transactionId || `manual_fix_${Date.now()}`,
      productType: "course",
      accessGranted: true,
      downloadCount: 0,
      lastAccessedAt: Date.now(),
    });

    // Create enrollment record
    const existingEnrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.clerkId).eq("courseId", args.courseId)
      )
      .unique();

    if (!existingEnrollment) {
      await ctx.db.insert("enrollments", {
        userId: args.clerkId,
        courseId: args.courseId,
        progress: 0,
      });
    }

    return {
      success: true,
      message: `Purchase created for "${course.title}"`,
      purchaseId,
    };
  },
});
