import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get or create user from Clerk ID
export const getUserFromClerk = query({
  args: { clerkId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    console.log(`🔍 Looking up user with clerkId: ${args.clerkId}`);
    
    try {
      // First, try to find the user in our database
      const user = await ctx.db.query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();

      if (user) {
        console.log(`✅ Found existing user in database: ${user.email}`);
        return user;
      }

      console.log(`⚠️ User not found in database with clerkId: ${args.clerkId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error looking up user:`, error);
      return null;
    }
  },
});

// Create or update user from Clerk webhook
export const createOrUpdateUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    console.log(`📝 Creating/updating user with clerkId: ${args.clerkId}`);

    // Check if user already exists
    const existingUser = await ctx.db.query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        name: args.firstName && args.lastName ? `${args.firstName} ${args.lastName}` : args.firstName || args.lastName,
      });
      console.log(`✅ Updated existing user: ${existingUser._id}`);
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      name: args.firstName && args.lastName ? `${args.firstName} ${args.lastName}` : args.firstName || args.lastName,
      role: "SUBACCOUNT_USER", // Default role
      admin: false,
    });

    console.log(`✅ Created new user: ${userId}`);
    return userId;
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user profile by ID
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
    return null;
  },
});

// Update user profile by Clerk ID
export const updateUserByClerkId = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    website: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("restricted"),
      v.literal("enabled")
    )),
    stripeOnboardingComplete: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { clerkId, ...updates } = args;
    
    // Find user by clerkId
    const user = await ctx.db.query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update user with provided fields
    await ctx.db.patch(user._id, updates);
    return null;
  },
});

// Delete user
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
      console.log(`🗑️ Deleted user: ${user._id}`);
    }
    return null;
  },
});