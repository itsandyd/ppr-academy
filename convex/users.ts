import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";

// Get or create user from Clerk ID
export const getUserFromClerk = query({
  args: { clerkId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    console.log(`🔍 Looking up user with clerkId: ${args.clerkId}`);

    try {
      // First, try to find the user in our database
      const user = await ctx.db
        .query("users")
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
    email: v.union(v.string(), v.null()),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    imageUrl: v.union(v.string(), v.null()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    console.log(`📝 Creating/updating user with clerkId: ${args.clerkId}`);

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      const name =
        args.firstName && args.lastName
          ? `${args.firstName} ${args.lastName}`
          : args.firstName || args.lastName || args.email || "User";

      await ctx.db.patch(existingUser._id, {
        email: args.email || undefined,
        firstName: args.firstName || undefined,
        lastName: args.lastName || undefined,
        imageUrl: args.imageUrl || undefined,
        name,
      });
      console.log(`✅ Updated existing user: ${existingUser._id}`);
      return existingUser._id;
    }

    // Create new user
    const name =
      args.firstName && args.lastName
        ? `${args.firstName} ${args.lastName}`
        : args.firstName || args.lastName || args.email || "User";

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email || undefined,
      firstName: args.firstName || undefined,
      lastName: args.lastName || undefined,
      imageUrl: args.imageUrl || undefined,
      name,
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
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      stripeConnectAccountId: v.optional(v.string()),
      stripeAccountStatus: v.optional(
        v.union(v.literal("pending"), v.literal("restricted"), v.literal("enabled"))
      ),
      stripeOnboardingComplete: v.optional(v.boolean()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { clerkId, updates } = args;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, updates);
    return null;
  },
});

export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    website: v.optional(v.string()),
    dashboardPreference: v.optional(v.union(v.literal("learn"), v.literal("create"))),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Partial<Doc<"users">> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.instagram !== undefined) updates.instagram = args.instagram;
    if (args.tiktok !== undefined) updates.tiktok = args.tiktok;
    if (args.twitter !== undefined) updates.twitter = args.twitter;
    if (args.youtube !== undefined) updates.youtube = args.youtube;
    if (args.website !== undefined) updates.website = args.website;
    if (args.dashboardPreference !== undefined)
      updates.dashboardPreference = args.dashboardPreference;

    await ctx.db.patch(user._id, updates);
    return true;
  },
});

export const getMyProfile = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      bio: v.optional(v.string()),
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      website: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dashboardPreference: v.optional(v.union(v.literal("learn"), v.literal("create"))),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      instagram: user.instagram,
      tiktok: user.tiktok,
      twitter: user.twitter,
      youtube: user.youtube,
      website: user.website,
      imageUrl: user.imageUrl,
      dashboardPreference: user.dashboardPreference,
    };
  },
});

// Delete user
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
      console.log(`🗑️ Deleted user: ${user._id}`);
    }
    return null;
  },
});

// Check if current user is admin
export const checkIsAdmin = query({
  args: { clerkId: v.string() },
  returns: v.object({
    isAdmin: v.boolean(),
    user: v.union(v.any(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return { isAdmin: false, user: null };
    }

    return {
      isAdmin: user.admin === true,
      user,
    };
  },
});

// Internal query to get all users (use getAdminUsers for public access)
const getAllUsersInternal = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get all users (admin only - with authorization and pagination)
export const getAllUsers = query({
  args: {
    clerkId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Verify admin status
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || user.admin !== true) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Admin verified, return paginated users
    return await ctx.db.query("users").order("desc").paginate(args.paginationOpts);
  },
});

// Get user statistics (admin only)
export const getUserStats = query({
  args: { clerkId: v.string() },
  returns: v.object({
    total: v.number(),
    creators: v.number(),
    students: v.number(),
    verified: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify admin status
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || user.admin !== true) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users for stats
    const allUsers = await ctx.db.query("users").collect();

    return {
      total: allUsers.length,
      creators: allUsers.filter((u) => u.role === "AGENCY_OWNER" || u.role === "AGENCY_ADMIN")
        .length,
      students: allUsers.filter(
        (u) => u.role === "SUBACCOUNT_USER" || u.role === "SUBACCOUNT_GUEST"
      ).length,
      verified: allUsers.filter((u) => u.emailVerified).length,
    };
  },
});

// Set user as admin (mutation to grant admin access)
export const setUserAsAdmin = mutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user to be admin
    await ctx.db.patch(user._id, {
      admin: true,
    });

    console.log(`✅ User ${user.email} (${args.clerkId}) is now an admin`);
    return user._id;
  },
});

// Set user's dashboard preference (learn or create mode)
export const setDashboardPreference = mutation({
  args: {
    clerkId: v.string(),
    preference: v.union(v.literal("learn"), v.literal("create")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      // Create user if doesn't exist
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        dashboardPreference: args.preference,
      });
    } else {
      // Update preference
      await ctx.db.patch(user._id, {
        dashboardPreference: args.preference,
      });
    }

    return null;
  },
});

// Helper query to get user by clerk ID (for actions that can't access db directly)
export const getUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      _creationTime: user._creationTime,
      email: user.email,
      name: user.name,
    };
  },
});

// ==================== LEARNER PREFERENCES ====================

// Save learner preferences (onboarding)
export const saveLearnerPreferences = mutation({
  args: {
    userId: v.string(),
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    interests: v.array(v.string()),
    goal: v.union(v.literal("hobby"), v.literal("career"), v.literal("skills"), v.literal("certification")),
    weeklyHours: v.optional(v.number()),
  },
  returns: v.id("learnerPreferences"),
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("learnerPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        skillLevel: args.skillLevel,
        interests: args.interests,
        goal: args.goal,
        weeklyHours: args.weeklyHours,
        onboardingCompletedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new preferences
    return await ctx.db.insert("learnerPreferences", {
      userId: args.userId,
      skillLevel: args.skillLevel,
      interests: args.interests,
      goal: args.goal,
      weeklyHours: args.weeklyHours,
      onboardingCompletedAt: Date.now(),
    });
  },
});

// Get learner preferences
export const getLearnerPreferences = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("learnerPreferences"),
      userId: v.string(),
      skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
      interests: v.array(v.string()),
      goal: v.union(v.literal("hobby"), v.literal("career"), v.literal("skills"), v.literal("certification")),
      weeklyHours: v.optional(v.number()),
      onboardingCompletedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("learnerPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return preferences;
  },
});
