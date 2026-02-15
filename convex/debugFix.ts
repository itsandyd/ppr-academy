import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Check if a course has all required fields for landing page
export const checkCourseData = internalQuery({
  args: { slug: v.string() },
  returns: v.union(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.optional(v.string()),
    userId: v.string(),
    storeId: v.optional(v.string()),
    hasStoreId: v.boolean(),
    storeExists: v.boolean(),
    userExists: v.boolean(),
    isPublished: v.optional(v.boolean()),
  }), v.null()),
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (!course) {
      return null;
    }
    
    // Check if store actually exists
    let storeExists = false;
    if (course.storeId) {
      const store = await ctx.db.get(course.storeId as any);
      storeExists = !!store;
    }
    
    // Check if user exists in database
    let userExists = false;
    if (course.userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", course.userId))
        .unique();
      userExists = !!user;
    }
    
    return {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      userId: course.userId,
      storeId: course.storeId,
      hasStoreId: !!course.storeId,
      storeExists: storeExists,
      userExists: userExists,
      isPublished: course.isPublished,
    };
  },
});

// Fix a course by adding the storeId from the user's first store AND fixing userId
export const fixCourseStoreId = internalMutation({
  args: { 
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    storeId: v.optional(v.string()),
    error: v.optional(v.string()),
    fixed: v.optional(v.object({
      userId: v.optional(v.boolean()),
      storeId: v.optional(v.boolean()),
    })),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the course
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        return { success: false, error: "Course not found" };
      }
      
      // Get the current logged-in user (args.userId is the Convex _id)
      const convexUser = await ctx.db.get(args.userId as any);
      
      if (!convexUser) {
        return { success: false, error: "User not found in database. Please sign out and sign back in to sync your account." };
      }
      
      // Get clerkId from the user (with type assertion since Convex types don't infer properly)
      const userClerkId = (convexUser as any).clerkId as string | undefined;
      if (!userClerkId) {
        return { success: false, error: "User clerkId not found. Please sign out and sign back in to sync your account." };
      }
      
      // Get user's first store using the clerkId
      const userStores = await ctx.db
        .query("stores")
        .withIndex("by_userId", (q) => q.eq("userId", userClerkId))
        .collect();
      
      if (userStores.length === 0) {
        return { success: false, error: "No store found for user" };
      }
      
      const storeId = userStores[0]._id;
      const fixed: { userId?: boolean; storeId?: boolean } = {};
      
      // Check if we need to fix userId (course.userId should be the user's clerkId)
      const needsUserIdFix = course.userId !== userClerkId;
      
      // Check if we need to fix storeId
      const needsStoreIdFix = !course.storeId || course.storeId !== storeId;
      
      // Update the course
      if (needsUserIdFix || needsStoreIdFix) {
        const updates: any = {};
        if (needsUserIdFix) {
          updates.userId = userClerkId;
          fixed.userId = true;
        }
        if (needsStoreIdFix) {
          updates.storeId = storeId;
          fixed.storeId = true;
        }
        
        await ctx.db.patch(args.courseId, updates);
      }
      
      return { 
        success: true, 
        storeId: storeId,
        fixed: Object.keys(fixed).length > 0 ? fixed : undefined,
      };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to fix course",
      };
    }
  },
});
