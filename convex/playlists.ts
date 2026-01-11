import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a playlist
 */
export const createPlaylist = mutation({
  args: {
    creatorId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
    acceptsSubmissions: v.boolean(),
    customSlug: v.optional(v.string()),
    spotifyPlaylistUrl: v.optional(v.string()),
    applePlaylistUrl: v.optional(v.string()),
    soundcloudPlaylistUrl: v.optional(v.string()),
    submissionRules: v.optional(
      v.object({
        allowedGenres: v.optional(v.array(v.string())),
        maxLengthSeconds: v.optional(v.number()),
        requiresMessage: v.boolean(),
        guidelines: v.optional(v.string()),
      })
    ),
    submissionPricing: v.optional(
      v.object({
        isFree: v.boolean(),
        price: v.optional(v.number()),
        currency: v.string(),
      })
    ),
    submissionSLA: v.optional(v.number()),
  },
  returns: v.id("curatorPlaylists"),
  handler: async (ctx, args) => {
    const playlistId = await ctx.db.insert("curatorPlaylists", {
      creatorId: args.creatorId,
      name: args.name,
      description: args.description,
      coverUrl: args.coverUrl,
      genres: args.genres,
      isPublic: args.isPublic,
      acceptsSubmissions: args.acceptsSubmissions,
      customSlug: args.customSlug,
      spotifyPlaylistUrl: args.spotifyPlaylistUrl,
      applePlaylistUrl: args.applePlaylistUrl,
      soundcloudPlaylistUrl: args.soundcloudPlaylistUrl,
      submissionRules: args.submissionRules,
      submissionPricing: args.submissionPricing || {
        isFree: true,
        currency: "USD",
      },
      submissionSLA: args.submissionSLA,
      trackCount: 0,
      totalPlays: 0,
      totalSubmissions: 0,
    });

    return playlistId;
  },
});

/**
 * Get creator's playlists
 */
export const getCreatorPlaylists = query({
  args: { creatorId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const playlists = await ctx.db
      .query("curatorPlaylists")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    return playlists;
  },
});

/**
 * Get public playlists accepting submissions
 */
export const getPlaylistsAcceptingSubmissions = query({
  args: {
    genre: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("curatorPlaylists")
      .withIndex("by_acceptsSubmissions", (q) => q.eq("acceptsSubmissions", true))
      .filter((q) => q.eq(q.field("isPublic"), true));

    // Filter by genre if provided
    // Note: Can't easily filter array fields in Convex, so we'll filter in JS
    let playlists = await query.take(args.limit || 20);
    
    if (args.genre) {
      playlists = playlists.filter(p => 
        !p.genres || p.genres.length === 0 || p.genres.includes(args.genre!)
      );
    }

    // Get creator info for each playlist
    const playlistsWithCreators = await Promise.all(
      playlists.map(async (playlist) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", playlist.creatorId))
          .unique();

        return {
          ...playlist,
          creatorName: creator?.firstName || creator?.email || "Creator",
          creatorAvatar: creator?.imageUrl,
        };
      })
    );

    return playlistsWithCreators;
  },
});

/**
 * Add track to playlist
 */
export const addTrackToPlaylist = mutation({
  args: {
    playlistId: v.id("curatorPlaylists"),
    trackId: v.id("userTracks"),
    addedBy: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get current track count for position
    const existingTracks = await ctx.db
      .query("curatorPlaylistTracks")
      .withIndex("by_playlistId", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    await ctx.db.insert("curatorPlaylistTracks", {
      playlistId: args.playlistId,
      trackId: args.trackId,
      addedBy: args.addedBy,
      position: existingTracks.length,
      addedAt: Date.now(),
      notes: args.notes,
    });

    // Update playlist track count
    const playlist = await ctx.db.get(args.playlistId);
    if (playlist) {
      await ctx.db.patch(args.playlistId, {
        trackCount: playlist.trackCount + 1,
      });
    }

    return null;
  },
});

/**
 * Get playlist tracks
 */
export const getPlaylistTracks = query({
  args: { playlistId: v.id("curatorPlaylists") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const playlistTracks = await ctx.db
      .query("curatorPlaylistTracks")
      .withIndex("by_playlistId", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    // Get track details
    const tracksWithDetails = await Promise.all(
      playlistTracks.map(async (pt) => {
        const track = await ctx.db.get(pt.trackId);
        return {
          ...pt,
          track,
        };
      })
    );

    return tracksWithDetails.sort((a, b) => a.position - b.position);
  },
});

/**
 * Get a single playlist by ID or custom slug
 */
export const getPlaylistByIdOrSlug = query({
  args: { identifier: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // Try to find by custom slug first
    let playlist = await ctx.db
      .query("curatorPlaylists")
      .withIndex("by_customSlug", (q) => q.eq("customSlug", args.identifier))
      .unique();

    // If not found, try as an ID
    if (!playlist) {
      try {
        playlist = await ctx.db.get(args.identifier as Id<"curatorPlaylists">);
      } catch {
        // Invalid ID format, return null
        return null;
      }
    }

    if (!playlist) return null;

    // Get creator info
    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", playlist.creatorId))
      .unique();

    return {
      ...playlist,
      creatorName: creator?.firstName || creator?.email || "Creator",
      creatorAvatar: creator?.imageUrl,
      creatorStripeAccountId: creator?.stripeConnectAccountId,
    };
  },
});

/**
 * Update playlist
 */
export const updatePlaylist = mutation({
  args: {
    playlistId: v.id("curatorPlaylists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    acceptsSubmissions: v.optional(v.boolean()),
    customSlug: v.optional(v.string()),
    spotifyPlaylistUrl: v.optional(v.string()),
    applePlaylistUrl: v.optional(v.string()),
    soundcloudPlaylistUrl: v.optional(v.string()),
    submissionRules: v.optional(
      v.object({
        allowedGenres: v.optional(v.array(v.string())),
        maxLengthSeconds: v.optional(v.number()),
        requiresMessage: v.boolean(),
        guidelines: v.optional(v.string()),
      })
    ),
    submissionPricing: v.optional(
      v.object({
        isFree: v.boolean(),
        price: v.optional(v.number()),
        currency: v.string(),
      })
    ),
    submissionSLA: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { playlistId, ...updates } = args;
    await ctx.db.patch(playlistId, updates);
    return null;
  },
});

