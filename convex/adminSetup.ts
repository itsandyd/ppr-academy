import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Make a user an admin
 * Run this from the Convex dashboard with your clerkId
 */
export const makeUserAdmin = mutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return {
        success: false,
        message: `User not found with clerkId: ${args.clerkId}`,
      };
    }

    // Update user to admin
    await ctx.db.patch(user._id, {
      admin: true,
    });

    return {
      success: true,
      message: `✅ User ${user.email || user.name || args.clerkId} is now an admin!`,
    };
  },
});

/**
 * Check your current admin status
 */
export const checkAdminStatus = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.object({
    found: v.boolean(),
    isAdmin: v.boolean(),
    userInfo: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return {
        found: false,
        isAdmin: false,
      };
    }

    return {
      found: true,
      isAdmin: user.admin || false,
      userInfo: user.email || user.name || user.clerkId,
    };
  },
});

