import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Platform type for validation
const platformValidator = v.union(
  v.literal("instagram"),
  v.literal("twitter"),
  v.literal("facebook"),
  v.literal("tiktok"),
  v.literal("youtube"),
  v.literal("linkedin")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all account profiles for a store
 */
export const getAccountProfiles = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccountProfiles")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

/**
 * Get account profiles by user ID
 */
export const getAccountProfilesByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccountProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get a single account profile by ID
 */
export const getAccountProfileById = query({
  args: {
    profileId: v.id("socialAccountProfiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

/**
 * Get account profiles by platform
 */
export const getAccountProfilesByPlatform = query({
  args: {
    storeId: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("socialAccountProfiles")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return profiles.filter((p) => p.platform === args.platform);
  },
});

/**
 * Get account profiles with their linked social accounts
 */
export const getAccountProfilesWithAccounts = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("socialAccountProfiles")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Fetch linked social accounts
    const profilesWithAccounts = await Promise.all(
      profiles.map(async (profile) => {
        let linkedAccount = null;
        if (profile.socialAccountId) {
          linkedAccount = await ctx.db.get(profile.socialAccountId);
        }
        return {
          ...profile,
          linkedAccount,
        };
      })
    );

    return profilesWithAccounts;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new account profile
 */
export const createAccountProfile = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    platform: platformValidator,
    topics: v.array(v.string()),
    targetAudience: v.optional(v.string()),
    socialAccountId: v.optional(v.id("socialAccounts")),
    preferredPostDays: v.optional(v.array(v.number())),
    postsPerWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const profileId = await ctx.db.insert("socialAccountProfiles", {
      storeId: args.storeId,
      userId: args.userId,
      name: args.name,
      description: args.description,
      platform: args.platform,
      topics: args.topics,
      targetAudience: args.targetAudience,
      socialAccountId: args.socialAccountId,
      preferredPostDays: args.preferredPostDays,
      postsPerWeek: args.postsPerWeek,
      totalScheduledScripts: 0,
      totalPublishedScripts: 0,
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

/**
 * Update an existing account profile
 */
export const updateAccountProfile = mutation({
  args: {
    profileId: v.id("socialAccountProfiles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    platform: v.optional(platformValidator),
    topics: v.optional(v.array(v.string())),
    targetAudience: v.optional(v.string()),
    preferredPostDays: v.optional(v.array(v.number())),
    postsPerWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updates } = args;

    const existing = await ctx.db.get(profileId);
    if (!existing) {
      throw new Error("Account profile not found");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(profileId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return profileId;
  },
});

/**
 * Delete an account profile
 */
export const deleteAccountProfile = mutation({
  args: {
    profileId: v.id("socialAccountProfiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.profileId);
    if (!existing) {
      throw new Error("Account profile not found");
    }

    // Check if there are any calendar entries linked to this profile
    const calendarEntries = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_accountProfileId", (q) =>
        q.eq("accountProfileId", args.profileId)
      )
      .first();

    if (calendarEntries) {
      throw new Error(
        "Cannot delete profile with scheduled scripts. Please remove scheduled scripts first."
      );
    }

    await ctx.db.delete(args.profileId);
    return { success: true };
  },
});

/**
 * Link a social account to an account profile
 */
export const linkSocialAccount = mutation({
  args: {
    profileId: v.id("socialAccountProfiles"),
    socialAccountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Account profile not found");
    }

    const socialAccount = await ctx.db.get(args.socialAccountId);
    if (!socialAccount) {
      throw new Error("Social account not found");
    }

    // Verify platform matches
    if (socialAccount.platform !== profile.platform) {
      throw new Error(
        `Platform mismatch: profile is ${profile.platform}, social account is ${socialAccount.platform}`
      );
    }

    await ctx.db.patch(args.profileId, {
      socialAccountId: args.socialAccountId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unlink a social account from an account profile
 */
export const unlinkSocialAccount = mutation({
  args: {
    profileId: v.id("socialAccountProfiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Account profile not found");
    }

    await ctx.db.patch(args.profileId, {
      socialAccountId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update profile stats (called internally when scripts are scheduled/published)
 */
export const updateProfileStats = mutation({
  args: {
    profileId: v.id("socialAccountProfiles"),
    incrementScheduled: v.optional(v.number()),
    incrementPublished: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Account profile not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.incrementScheduled) {
      updates.totalScheduledScripts =
        (profile.totalScheduledScripts || 0) + args.incrementScheduled;
    }

    if (args.incrementPublished) {
      updates.totalPublishedScripts =
        (profile.totalPublishedScripts || 0) + args.incrementPublished;
    }

    await ctx.db.patch(args.profileId, updates);

    return { success: true };
  },
});
