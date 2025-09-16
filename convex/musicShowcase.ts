import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create or update an artist profile
 */
export const createArtistProfile = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    artistName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      spotify: v.optional(v.string()),
      soundcloud: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      facebook: v.optional(v.string()),
      bandcamp: v.optional(v.string()),
      apple_music: v.optional(v.string()),
    })),
    slug: v.optional(v.string()),
  },
  returns: v.id("artistProfiles"),
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("artistProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        ...args,
        totalViews: existingProfile.totalViews || 0,
        totalLikes: existingProfile.totalLikes || 0,
        totalFollowers: existingProfile.totalFollowers || 0,
        totalPlays: existingProfile.totalPlays || 0,
      });
      return existingProfile._id;
    } else {
      // Create new profile
      return await ctx.db.insert("artistProfiles", {
        ...args,
        isPublic: true,
        totalViews: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalPlays: 0,
      });
    }
  },
});

/**
 * Get artist profile by user ID
 */
export const getArtistProfile = query({
  args: { userId: v.string() },
  returns: v.union(v.object({
    _id: v.id("artistProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    storeId: v.optional(v.string()),
    artistName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      spotify: v.optional(v.string()),
      soundcloud: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      facebook: v.optional(v.string()),
      bandcamp: v.optional(v.string()),
      apple_music: v.optional(v.string()),
    })),
    isPublic: v.optional(v.boolean()),
    totalViews: v.optional(v.number()),
    totalLikes: v.optional(v.number()),
    totalFollowers: v.optional(v.number()),
    totalPlays: v.optional(v.number()),
    slug: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artistProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get artist profile by slug for public pages
 */
export const getArtistProfileBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.object({
    _id: v.id("artistProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    storeId: v.optional(v.string()),
    artistName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      spotify: v.optional(v.string()),
      soundcloud: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      facebook: v.optional(v.string()),
      bandcamp: v.optional(v.string()),
      apple_music: v.optional(v.string()),
    })),
    isPublic: v.optional(v.boolean()),
    totalViews: v.optional(v.number()),
    totalLikes: v.optional(v.number()),
    totalFollowers: v.optional(v.number()),
    totalPlays: v.optional(v.number()),
    slug: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("artistProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    // Only return public profiles
    if (profile && profile.isPublic) {
      return profile;
    }
    return null;
  },
});

/**
 * Add a music track from URL (simplified approach)
 */
export const addTrackFromUrl = mutation({
  args: {
    userId: v.string(),
    artistProfileId: v.id("artistProfiles"),
    storeId: v.optional(v.string()),
    // Basic info
    title: v.string(),
    artist: v.optional(v.string()),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // URL-based data
    originalUrl: v.string(),
    platform: v.union(
      v.literal("spotify"),
      v.literal("soundcloud"), 
      v.literal("youtube"),
      v.literal("apple_music"),
      v.literal("bandcamp"),
      v.literal("other")
    ),
    embedUrl: v.optional(v.string()),
    // Extracted metadata
    artworkUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    releaseDate: v.optional(v.string()),
    // Custom overrides
    customGenre: v.optional(v.string()),
    customTags: v.optional(v.array(v.string())),
    customDescription: v.optional(v.string()),
    // Settings
    isPublic: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    slug: v.optional(v.string()),
  },
  returns: v.id("musicTracks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("musicTracks", {
      ...args,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      playCount: 0,
    });
  },
});

/**
 * Get tracks for an artist profile
 */
export const getArtistTracks = query({
  args: { 
    artistProfileId: v.id("artistProfiles"),
    limit: v.optional(v.number()),
    publicOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("musicTracks"),
    _creationTime: v.number(),
    userId: v.string(),
    artistProfileId: v.id("artistProfiles"),
    storeId: v.optional(v.string()),
    title: v.string(),
    artist: v.optional(v.string()),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    originalUrl: v.string(),
    platform: v.union(
      v.literal("spotify"),
      v.literal("soundcloud"), 
      v.literal("youtube"),
      v.literal("apple_music"),
      v.literal("bandcamp"),
      v.literal("other")
    ),
    embedUrl: v.optional(v.string()),
    artworkUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    releaseDate: v.optional(v.string()),
    customGenre: v.optional(v.string()),
    customTags: v.optional(v.array(v.string())),
    customDescription: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    playCount: v.optional(v.number()),
    slug: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("musicTracks")
      .withIndex("by_artistProfileId", (q) => q.eq("artistProfileId", args.artistProfileId));

    if (args.publicOnly) {
      query = query.filter((q) => q.eq(q.field("isPublic"), true));
    }

    const tracks = await query
      .order("desc")
      .take(args.limit || 50);

    return tracks;
  },
});

/**
 * Track a play event
 */
export const trackPlay = mutation({
  args: {
    trackId: v.id("musicTracks"),
    userId: v.optional(v.string()),
    playDuration: v.optional(v.number()),
    completionPercentage: v.optional(v.number()),
    source: v.optional(v.union(
      v.literal("profile"),
      v.literal("embed"),
      v.literal("direct_link"),
      v.literal("search"),
      v.literal("playlist")
    )),
    referrer: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  returns: v.id("trackPlays"),
  handler: async (ctx, args) => {
    // Get track to find artist profile
    const track = await ctx.db.get(args.trackId);
    if (!track) {
      throw new Error("Track not found");
    }

    // Record the play
    const playId = await ctx.db.insert("trackPlays", {
      ...args,
      artistProfileId: track.artistProfileId,
      timestamp: Date.now(),
    });

    // Update track play count
    await ctx.db.patch(args.trackId, {
      playCount: (track.playCount || 0) + 1,
    });

    // Update artist profile total plays
    const artistProfile = await ctx.db.get(track.artistProfileId);
    if (artistProfile) {
      await ctx.db.patch(track.artistProfileId, {
        totalPlays: (artistProfile.totalPlays || 0) + 1,
      });
    }

    return playId;
  },
});

/**
 * Like/unlike a track
 */
export const toggleTrackLike = mutation({
  args: {
    trackId: v.id("musicTracks"),
    userId: v.string(),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId);
    if (!track) {
      throw new Error("Track not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("trackLikes")
      .withIndex("by_user_track", (q) => 
        q.eq("userId", args.userId).eq("trackId", args.trackId)
      )
      .first();

    let liked = false;
    let newLikeCount = track.likeCount || 0;

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else {
      // Like
      await ctx.db.insert("trackLikes", {
        trackId: args.trackId,
        userId: args.userId,
        artistProfileId: track.artistProfileId,
        timestamp: Date.now(),
      });
      newLikeCount = newLikeCount + 1;
      liked = true;
    }

    // Update track like count
    await ctx.db.patch(args.trackId, {
      likeCount: newLikeCount,
    });

    return { liked, likeCount: newLikeCount };
  },
});

/**
 * Follow/unfollow an artist
 */
export const toggleArtistFollow = mutation({
  args: {
    artistProfileId: v.id("artistProfiles"),
    followerId: v.string(),
  },
  returns: v.object({
    following: v.boolean(),
    followerCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const artistProfile = await ctx.db.get(args.artistProfileId);
    if (!artistProfile) {
      throw new Error("Artist profile not found");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("artistFollows")
      .withIndex("by_follower_artist", (q) => 
        q.eq("followerId", args.followerId).eq("artistProfileId", args.artistProfileId)
      )
      .first();

    let following = false;
    let newFollowerCount = artistProfile.totalFollowers || 0;

    if (existingFollow) {
      // Unfollow
      await ctx.db.delete(existingFollow._id);
      newFollowerCount = Math.max(0, newFollowerCount - 1);
    } else {
      // Follow
      await ctx.db.insert("artistFollows", {
        followerId: args.followerId,
        artistProfileId: args.artistProfileId,
        artistUserId: artistProfile.userId,
        timestamp: Date.now(),
        notifyNewTracks: true,
        notifyLiveStreams: true,
      });
      newFollowerCount = newFollowerCount + 1;
      following = true;
    }

    // Update artist profile follower count
    await ctx.db.patch(args.artistProfileId, {
      totalFollowers: newFollowerCount,
    });

    return { following, followerCount: newFollowerCount };
  },
});

/**
 * Search for artists and tracks
 */
export const searchMusic = query({
  args: {
    query: v.string(),
    type: v.optional(v.union(v.literal("artists"), v.literal("tracks"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    artists: v.array(v.object({
      _id: v.id("artistProfiles"),
      artistName: v.string(),
      displayName: v.optional(v.string()),
      profileImage: v.optional(v.string()),
      totalViews: v.optional(v.number()),
      totalFollowers: v.optional(v.number()),
      slug: v.optional(v.string()),
    })),
    tracks: v.array(v.object({
      _id: v.id("musicTracks"),
      title: v.string(),
      artist: v.optional(v.string()),
      artworkUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      viewCount: v.optional(v.number()),
      slug: v.optional(v.string()),
      artistProfileId: v.id("artistProfiles"),
    })),
  }),
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    const limit = args.limit || 20;
    const type = args.type || "all";

    let artists: any[] = [];
    let tracks: any[] = [];

    if (type === "artists" || type === "all") {
      // Search artists by name
      const allArtists = await ctx.db
        .query("artistProfiles")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .collect();

      artists = allArtists
        .filter(artist => 
          artist.artistName.toLowerCase().includes(searchTerm) ||
          (artist.displayName && artist.displayName.toLowerCase().includes(searchTerm))
        )
        .slice(0, limit)
        .map(artist => ({
          _id: artist._id,
          artistName: artist.artistName,
          displayName: artist.displayName,
          profileImage: artist.profileImage,
          totalViews: artist.totalViews,
          totalFollowers: artist.totalFollowers,
          slug: artist.slug,
        }));
    }

    if (type === "tracks" || type === "all") {
      // Search tracks by title, artist, or tags
      const allTracks = await ctx.db
        .query("musicTracks")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .collect();

      tracks = allTracks
        .filter(track => 
          track.title.toLowerCase().includes(searchTerm) ||
          (track.artist && track.artist.toLowerCase().includes(searchTerm)) ||
          (track.tags && track.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        )
        .slice(0, limit)
        .map(track => ({
          _id: track._id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          duration: track.duration,
          viewCount: track.viewCount,
          slug: track.slug,
          artistProfileId: track.artistProfileId,
        }));
    }

    return { artists, tracks };
  },
});
