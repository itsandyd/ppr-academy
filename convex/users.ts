import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      // Profile fields
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      // Profile fields
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      name: args.name,
      admin: false,
      discordVerified: false,
    });
  },
});

// Update user
export const updateUser = mutation({
  args: {
    id: v.id("users"),
    clerkId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Update user by Clerk ID (for linking existing users)
export const updateUserByClerkId = mutation({
  args: {
    clerkId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    website: v.optional(v.string()),
    // Stripe Connect fields
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("restricted"),
      v.literal("enabled")
    )),
    stripeOnboardingComplete: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      // Profile fields
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId, ...updates } = args;
    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

// Link Clerk ID to existing user by email
export const linkClerkIdToUser = mutation({
  args: {
    email: v.string(),
    clerkId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    const { email, ...updates } = args;
    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

// Get user by ID (internal use)
export const getUserById = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
      image: v.optional(v.string()),
      hashedPassword: v.optional(v.string()),
      agencyId: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"), 
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )),
      avatarUrl: v.optional(v.string()),
      userRoleId: v.optional(v.string()),
      userTypeId: v.optional(v.string()),
      discordUsername: v.optional(v.string()),
      discordId: v.optional(v.string()),
      discordVerified: v.optional(v.boolean()),
      stripeConnectAccountId: v.optional(v.string()),
      admin: v.optional(v.boolean()),
      clerkId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      // Profile fields
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Find user by matching the userId (stored as string in stores table)
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();
    
    return user;
  },
}); 