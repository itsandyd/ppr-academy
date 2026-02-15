import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * DEV ONLY: Create sample submissions for testing
 */
export const createSampleSubmissions = internalMutation({
  args: {
    creatorId: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const count = args.count || 3;
    
    // First, create some sample tracks
    const sampleTracks = [
      {
        title: "Midnight Dreams",
        artist: "DJ Sample",
        genre: "house",
        mood: "chill",
        description: "Deep house vibes for late night sessions"
      },
      {
        title: "808 Bounce",
        artist: "Producer Test",
        genre: "trap",
        mood: "energetic",
        description: "Hard-hitting trap beat with heavy 808s"
      },
      {
        title: "Ambient Waves",
        artist: "Sound Designer",
        genre: "ambient",
        mood: "dreamy",
        description: "Atmospheric soundscape perfect for focus"
      }
    ];

    const trackIds = [];
    for (const trackData of sampleTracks.slice(0, count)) {
      const trackId = await ctx.db.insert("userTracks", {
        userId: "test-user-" + Date.now(),
        title: trackData.title,
        artist: trackData.artist,
        genre: trackData.genre,
        mood: trackData.mood,
        description: trackData.description,
        sourceType: "youtube",
        sourceUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        isPublic: true,
        plays: 0,
        likes: 0,
        shares: 0,
      });
      trackIds.push(trackId);
    }

    // Get creator's playlists
    const playlists = await ctx.db
      .query("curatorPlaylists")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) => q.eq(q.field("acceptsSubmissions"), true))
      .first();

    if (!playlists) {
      throw new Error("No playlists accepting submissions. Please enable submissions on a playlist first.");
    }

    // Create submissions
    const messages = [
      "Hey! Really love your playlist vibe. I think this track would be a perfect fit. Let me know what you think!",
      "Submitted my latest production for your consideration. Hope you enjoy!",
      "This track aligns well with your playlist's aesthetic. Would be honored to be featured!"
    ];

    for (let i = 0; i < trackIds.length; i++) {
      await ctx.db.insert("trackSubmissions", {
        submitterId: "test-user-" + (Date.now() + i),
        creatorId: args.creatorId,
        trackId: trackIds[i],
        playlistId: playlists._id,
        message: messages[i % messages.length],
        submissionFee: playlists.submissionPricing?.price || 0,
        status: "inbox",
      });
    }

    // Update playlist submission count
    await ctx.db.patch(playlists._id, {
      totalSubmissions: (playlists.totalSubmissions || 0) + trackIds.length,
    });

    return null;
  },
});

/**
 * DEV ONLY: Clear all test submissions
 */
export const clearTestSubmissions = internalMutation({
  args: {
    creatorId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("trackSubmissions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    // Reset playlist counts
    const playlists = await ctx.db
      .query("curatorPlaylists")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    for (const playlist of playlists) {
      await ctx.db.patch(playlist._id, {
        totalSubmissions: 0,
      });
    }

    return null;
  },
});

