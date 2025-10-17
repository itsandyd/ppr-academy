import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new track
 */
export const createTrack = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    artist: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    sourceType: v.union(
      v.literal("upload"),
      v.literal("youtube"),
      v.literal("soundcloud"),
      v.literal("spotify")
    ),
    sourceUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    isPublic: v.boolean(),
  },
  returns: v.id("userTracks"),
  handler: async (ctx, args) => {
    const trackId = await ctx.db.insert("userTracks", {
      userId: args.userId,
      title: args.title,
      artist: args.artist,
      genre: args.genre,
      mood: args.mood,
      description: args.description,
      coverUrl: args.coverUrl,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      storageId: args.storageId,
      isPublic: args.isPublic,
      plays: 0,
      likes: 0,
      shares: 0,
    });

    return trackId;
  },
});

/**
 * Get user's tracks
 */
export const getUserTracks = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("userTracks"),
    _creationTime: v.number(),
    userId: v.string(),
    title: v.string(),
    artist: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    sourceType: v.union(
      v.literal("upload"),
      v.literal("youtube"),
      v.literal("soundcloud"),
      v.literal("spotify")
    ),
    sourceUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    isPublic: v.boolean(),
    plays: v.number(),
    likes: v.number(),
    shares: v.number(),
  })),
  handler: async (ctx, args) => {
    const tracks = await ctx.db
      .query("userTracks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return tracks;
  },
});

/**
 * Get public tracks (for showcase)
 */
export const getPublicTracks = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const tracks = await ctx.db
      .query("userTracks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(args.limit || 50);

    return tracks;
  },
});

/**
 * Update track
 */
export const updateTrack = mutation({
  args: {
    trackId: v.id("userTracks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { trackId, ...updates } = args;
    await ctx.db.patch(trackId, updates);
    return null;
  },
});

/**
 * Delete track
 */
export const deleteTrack = mutation({
  args: { trackId: v.id("userTracks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.trackId);
    return null;
  },
});

/**
 * Increment play count
 */
export const incrementPlays = mutation({
  args: { trackId: v.id("userTracks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId);
    if (track) {
      await ctx.db.patch(args.trackId, {
        plays: track.plays + 1,
      });
    }
    return null;
  },
});

