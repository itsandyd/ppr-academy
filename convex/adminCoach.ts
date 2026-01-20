import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Admin Coach Profile Management
 * Mutations and queries for managing coach profiles from the admin dashboard
 */

// Helper to verify admin status
async function verifyAdmin(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || !user.admin) {
    throw new Error("Unauthorized - Admin access required");
  }
  return user;
}

/**
 * Get all coach profiles for admin review
 */
export const getAllCoachProfiles = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("coachProfiles"),
      userId: v.string(),
      category: v.string(),
      location: v.string(),
      imageSrc: v.string(),
      basePrice: v.number(),
      title: v.string(),
      description: v.string(),
      discordUsername: v.string(),
      discordId: v.optional(v.string()),
      alternativeContact: v.optional(v.string()),
      professionalBackground: v.optional(v.string()),
      certifications: v.optional(v.string()),
      notableProjects: v.optional(v.string()),
      timezone: v.string(),
      availableDays: v.string(),
      availableHours: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      stripeAccountId: v.optional(v.string()),
      stripeConnectComplete: v.optional(v.boolean()),
      stripeAccountStatus: v.optional(v.string()),
      _creationTime: v.number(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profiles = await ctx.db.query("coachProfiles").collect();

    // Enrich with user info
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", profile.userId))
          .unique();

        return {
          ...profile,
          userName: user?.name || undefined,
          userEmail: user?.email || undefined,
        };
      })
    );

    return enrichedProfiles;
  },
});

/**
 * Approve a coach profile (set isActive to true)
 */
export const approveCoachProfile = mutation({
  args: {
    clerkId: v.string(),
    profileId: v.id("coachProfiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        success: false,
        message: "Coach profile not found",
      };
    }

    await ctx.db.patch(args.profileId, {
      isActive: true,
    });

    console.log(`✅ Coach profile ${args.profileId} approved`);

    return {
      success: true,
      message: `Coach profile "${profile.title}" has been approved and is now active`,
    };
  },
});

/**
 * Reject/Deactivate a coach profile (set isActive to false)
 */
export const rejectCoachProfile = mutation({
  args: {
    clerkId: v.string(),
    profileId: v.id("coachProfiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        success: false,
        message: "Coach profile not found",
      };
    }

    await ctx.db.patch(args.profileId, {
      isActive: false,
    });

    console.log(`❌ Coach profile ${args.profileId} rejected/deactivated`);

    return {
      success: true,
      message: `Coach profile "${profile.title}" has been deactivated`,
    };
  },
});

/**
 * Delete a coach profile entirely
 */
export const deleteCoachProfile = mutation({
  args: {
    clerkId: v.string(),
    profileId: v.id("coachProfiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        success: false,
        message: "Coach profile not found",
      };
    }

    await ctx.db.delete(args.profileId);

    console.log(`🗑️ Coach profile ${args.profileId} deleted`);

    return {
      success: true,
      message: `Coach profile "${profile.title}" has been permanently deleted`,
    };
  },
});

/**
 * Get coach profiles for debugging (includes all details)
 */
export const getCoachProfilesDebug = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("coachProfiles"),
      userId: v.string(),
      title: v.string(),
      isActive: v.optional(v.boolean()),
      stripeConnectComplete: v.optional(v.boolean()),
      stripeAccountStatus: v.optional(v.string()),
      hasUser: v.boolean(),
      userIsAdmin: v.optional(v.boolean()),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profiles = await ctx.db.query("coachProfiles").collect();

    const debugInfo = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", profile.userId))
          .unique();

        return {
          _id: profile._id,
          userId: profile.userId,
          title: profile.title,
          isActive: profile.isActive,
          stripeConnectComplete: profile.stripeConnectComplete,
          stripeAccountStatus: profile.stripeAccountStatus,
          hasUser: !!user,
          userIsAdmin: user?.admin,
          _creationTime: profile._creationTime,
        };
      })
    );

    return debugInfo;
  },
});

/**
 * Cleanup orphaned coach profiles (profiles without a corresponding user)
 */
export const cleanupOrphanedProfiles = mutation({
  args: {
    clerkId: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    orphanedCount: v.number(),
    deletedIds: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const profiles = await ctx.db.query("coachProfiles").collect();
    const orphanedIds: string[] = [];

    for (const profile of profiles) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", profile.userId))
        .unique();

      if (!user) {
        orphanedIds.push(profile._id);

        if (!args.dryRun) {
          await ctx.db.delete(profile._id);
        }
      }
    }

    const action = args.dryRun ? "Found" : "Deleted";
    console.log(`🧹 ${action} ${orphanedIds.length} orphaned coach profiles`);

    return {
      success: true,
      orphanedCount: orphanedIds.length,
      deletedIds: orphanedIds,
      message: args.dryRun
        ? `Found ${orphanedIds.length} orphaned profiles (dry run - no deletions)`
        : `Deleted ${orphanedIds.length} orphaned coach profiles`,
    };
  },
});
