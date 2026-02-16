import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new pre-save record
 */
export const createPreSave = mutation({
  args: {
    releaseId: v.id("digitalProducts"),
    email: v.string(),
    name: v.optional(v.string()),
    platforms: v.object({
      spotify: v.optional(v.boolean()),
      appleMusic: v.optional(v.boolean()),
      deezer: v.optional(v.boolean()),
      tidal: v.optional(v.boolean()),
      amazonMusic: v.optional(v.boolean()),
    }),
    spotifyAccessToken: v.optional(v.string()),
    spotifyRefreshToken: v.optional(v.string()),
    spotifyUserId: v.optional(v.string()),
    appleMusicUserToken: v.optional(v.string()),
    source: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("releasePreSaves"),
  handler: async (ctx, args) => {
    // Get the release to find store and creator info
    const release = await ctx.db.get(args.releaseId);
    if (!release) {
      throw new Error("Release not found");
    }

    // Check if this email already pre-saved this release
    const existing = await ctx.db
      .query("releasePreSaves")
      .withIndex("by_email_release", (q) =>
        q.eq("email", args.email).eq("releaseId", args.releaseId)
      )
      .first();

    if (existing) {
      // Update existing pre-save with new platform info
      await ctx.db.patch(existing._id, {
        platforms: {
          ...existing.platforms,
          ...args.platforms,
        },
        // Update tokens if provided
        ...(args.spotifyAccessToken && {
          spotifyAccessToken: args.spotifyAccessToken,
          spotifyRefreshToken: args.spotifyRefreshToken,
          spotifyUserId: args.spotifyUserId,
        }),
        ...(args.appleMusicUserToken && {
          appleMusicUserToken: args.appleMusicUserToken,
        }),
      });
      return existing._id;
    }

    // Create new pre-save
    const preSaveId = await ctx.db.insert("releasePreSaves", {
      releaseId: args.releaseId,
      storeId: release.storeId,
      creatorId: release.userId,
      email: args.email,
      name: args.name,
      platforms: args.platforms,
      spotifyAccessToken: args.spotifyAccessToken,
      spotifyRefreshToken: args.spotifyRefreshToken,
      spotifyUserId: args.spotifyUserId,
      appleMusicUserToken: args.appleMusicUserToken,
      preSavedAt: Date.now(),
      source: args.source,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      enrolledInDripCampaign: true,
      preSaveConfirmationSent: false,
      releaseDayEmailSent: false,
      followUp48hEmailSent: false,
      playlistPitchEmailSent: false,
    });

    return preSaveId;
  },
});

/**
 * Get all pre-saves for a release
 */
export const getByRelease = query({
  args: {
    releaseId: v.id("digitalProducts"),
  },
  returns: v.array(
    v.object({
      _id: v.id("releasePreSaves"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      platforms: v.object({
        spotify: v.optional(v.boolean()),
        appleMusic: v.optional(v.boolean()),
        deezer: v.optional(v.boolean()),
        tidal: v.optional(v.boolean()),
        amazonMusic: v.optional(v.boolean()),
      }),
      preSavedAt: v.number(),
      source: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const preSaves = await ctx.db
      .query("releasePreSaves")
      .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
      .order("desc")
      .take(5000);

    return preSaves.map((ps) => ({
      _id: ps._id,
      _creationTime: ps._creationTime,
      email: ps.email,
      name: ps.name,
      platforms: ps.platforms,
      preSavedAt: ps.preSavedAt,
      source: ps.source,
    }));
  },
});

/**
 * Get pre-save count for a release
 */
export const getCount = query({
  args: {
    releaseId: v.id("digitalProducts"),
  },
  returns: v.object({
    total: v.number(),
    spotify: v.number(),
    appleMusic: v.number(),
  }),
  handler: async (ctx, args) => {
    const preSaves = await ctx.db
      .query("releasePreSaves")
      .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
      .take(5000);

    return {
      total: preSaves.length,
      spotify: preSaves.filter((ps) => ps.platforms?.spotify).length,
      appleMusic: preSaves.filter((ps) => ps.platforms?.appleMusic).length,
    };
  },
});

/**
 * Get pre-saves by creator
 */
export const getByCreator = query({
  args: {
    creatorId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("releasePreSaves"),
      releaseId: v.id("digitalProducts"),
      email: v.string(),
      name: v.optional(v.string()),
      platforms: v.object({
        spotify: v.optional(v.boolean()),
        appleMusic: v.optional(v.boolean()),
        deezer: v.optional(v.boolean()),
        tidal: v.optional(v.boolean()),
        amazonMusic: v.optional(v.boolean()),
      }),
      preSavedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("releasePreSaves")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .order("desc");

    const preSaves = args.limit
      ? await baseQuery.take(args.limit)
      : await baseQuery.take(5000);

    return preSaves.map((ps) => ({
      _id: ps._id,
      releaseId: ps.releaseId,
      email: ps.email,
      name: ps.name,
      platforms: ps.platforms,
      preSavedAt: ps.preSavedAt,
    }));
  },
});

/**
 * Check if an email has pre-saved a release
 */
export const checkPreSave = query({
  args: {
    releaseId: v.id("digitalProducts"),
    email: v.string(),
  },
  returns: v.union(
    v.object({
      hasPreSaved: v.literal(true),
      platforms: v.object({
        spotify: v.optional(v.boolean()),
        appleMusic: v.optional(v.boolean()),
        deezer: v.optional(v.boolean()),
        tidal: v.optional(v.boolean()),
        amazonMusic: v.optional(v.boolean()),
      }),
    }),
    v.object({
      hasPreSaved: v.literal(false),
    })
  ),
  handler: async (ctx, args) => {
    const preSave = await ctx.db
      .query("releasePreSaves")
      .withIndex("by_email_release", (q) =>
        q.eq("email", args.email).eq("releaseId", args.releaseId)
      )
      .first();

    if (preSave) {
      return {
        hasPreSaved: true as const,
        platforms: preSave.platforms,
      };
    }

    return { hasPreSaved: false as const };
  },
});

/**
 * Update email sent status for a pre-save
 */
export const updateEmailStatus = mutation({
  args: {
    preSaveId: v.id("releasePreSaves"),
    emailType: v.union(
      v.literal("preSaveConfirmation"),
      v.literal("releaseDay"),
      v.literal("followUp48h"),
      v.literal("playlistPitch")
    ),
  },
  handler: async (ctx, args) => {
    const fieldMap = {
      preSaveConfirmation: "preSaveConfirmationSent",
      releaseDay: "releaseDayEmailSent",
      followUp48h: "followUp48hEmailSent",
      playlistPitch: "playlistPitchEmailSent",
    } as const;

    await ctx.db.patch(args.preSaveId, {
      [fieldMap[args.emailType]]: true,
    });
  },
});

/**
 * Get pre-saves that need emails sent
 */
export const getPreSavesNeedingEmail = query({
  args: {
    releaseId: v.id("digitalProducts"),
    emailType: v.union(
      v.literal("preSaveConfirmation"),
      v.literal("releaseDay"),
      v.literal("followUp48h"),
      v.literal("playlistPitch")
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("releasePreSaves"),
      email: v.string(),
      name: v.optional(v.string()),
      platforms: v.object({
        spotify: v.optional(v.boolean()),
        appleMusic: v.optional(v.boolean()),
        deezer: v.optional(v.boolean()),
        tidal: v.optional(v.boolean()),
        amazonMusic: v.optional(v.boolean()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const fieldMap = {
      preSaveConfirmation: "preSaveConfirmationSent",
      releaseDay: "releaseDayEmailSent",
      followUp48h: "followUp48hEmailSent",
      playlistPitch: "playlistPitchEmailSent",
    } as const;

    const allPreSaves = await ctx.db
      .query("releasePreSaves")
      .withIndex("by_release", (q) => q.eq("releaseId", args.releaseId))
      .filter((q) =>
        q.and(
          q.eq(q.field("enrolledInDripCampaign"), true),
          q.eq(q.field(fieldMap[args.emailType]), false)
        )
      )
      .take(5000);

    const preSaves = allPreSaves.slice(0, args.limit || 100);

    return preSaves.map((ps) => ({
      _id: ps._id,
      email: ps.email,
      name: ps.name,
      platforms: ps.platforms,
    }));
  },
});
