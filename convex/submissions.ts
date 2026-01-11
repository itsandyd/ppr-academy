import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Submit track to playlist
 */
export const submitTrack = mutation({
  args: {
    submitterId: v.string(),
    creatorId: v.string(),
    trackId: v.id("userTracks"),
    playlistId: v.optional(v.id("curatorPlaylists")),
    message: v.optional(v.string()),
    submissionFee: v.number(),
    paymentId: v.optional(v.string()),
  },
  returns: v.id("trackSubmissions"),
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("trackSubmissions", {
      submitterId: args.submitterId,
      creatorId: args.creatorId,
      trackId: args.trackId,
      playlistId: args.playlistId,
      message: args.message,
      submissionFee: args.submissionFee,
      paymentId: args.paymentId,
      paymentStatus: args.submissionFee > 0 ? "pending" : undefined,
      status: "inbox",
    });

    // Update playlist submission count
    let playlistName = "your playlist";
    if (args.playlistId) {
      const playlist = await ctx.db.get(args.playlistId);
      if (playlist) {
        await ctx.db.patch(args.playlistId, {
          totalSubmissions: playlist.totalSubmissions + 1,
        });
        playlistName = playlist.name;
      }
    }

    // Get track and submitter info for notification
    const track = await ctx.db.get(args.trackId);
    const submitter = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.submitterId))
      .unique();

    const submitterName = submitter?.firstName || submitter?.email || "An artist";
    const trackTitle = track?.title || "a track";

    // Create notification for curator
    await ctx.db.insert("notifications", {
      userId: args.creatorId,
      title: "New Track Submission",
      message: `${submitterName} submitted "${trackTitle}" to ${playlistName}`,
      type: "info",
      read: false,
      link: "/dashboard/home/submissions",
      actionLabel: "View Submissions",
      createdAt: Date.now(),
      emailSent: false,
      senderType: "system",
      senderId: args.submitterId,
      senderName: submitterName,
      senderAvatar: submitter?.imageUrl,
    });

    return submissionId;
  },
});

/**
 * Get creator's submissions (inbox/queue)
 */
export const getCreatorSubmissions = query({
  args: {
    creatorId: v.string(),
    status: v.optional(v.union(
      v.literal("inbox"),
      v.literal("reviewed"),
      v.literal("accepted"),
      v.literal("declined")
    )),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("trackSubmissions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const submissions = await query.collect();

    // Enrich with track and submitter details
    const enriched = await Promise.all(
      submissions.map(async (submission) => {
        const track = await ctx.db.get(submission.trackId);
        const submitter = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", submission.submitterId))
          .unique();

        let playlist = null;
        if (submission.playlistId) {
          playlist = await ctx.db.get(submission.playlistId);
        }

        return {
          ...submission,
          track,
          submitterName: submitter?.firstName || submitter?.email || "Unknown",
          submitterAvatar: submitter?.imageUrl,
          playlistName: playlist?.name,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get user's submissions (submitter view)
 */
export const getUserSubmissions = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("trackSubmissions")
      .withIndex("by_submitterId", (q) => q.eq("submitterId", args.userId))
      .collect();

    const enriched = await Promise.all(
      submissions.map(async (submission) => {
        const track = await ctx.db.get(submission.trackId);
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", submission.creatorId))
          .unique();
        
        let playlist = null;
        if (submission.playlistId) {
          playlist = await ctx.db.get(submission.playlistId);
        }

        return {
          ...submission,
          track,
          creatorName: creator?.firstName || creator?.email || "Creator",
          playlistName: playlist?.name,
        };
      })
    );

    return enriched;
  },
});

/**
 * Accept submission and add to playlist
 */
export const acceptSubmission = mutation({
  args: {
    submissionId: v.id("trackSubmissions"),
    playlistId: v.id("curatorPlaylists"),
    feedback: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    // Add track to playlist
    const existingTracks = await ctx.db
      .query("curatorPlaylistTracks")
      .withIndex("by_playlistId", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    await ctx.db.insert("curatorPlaylistTracks", {
      playlistId: args.playlistId,
      trackId: submission.trackId,
      addedBy: submission.creatorId,
      position: existingTracks.length,
      addedAt: Date.now(),
      notes: `Accepted from submission`,
    });

    // Update submission status
    await ctx.db.patch(args.submissionId, {
      status: "accepted",
      decidedAt: Date.now(),
      feedback: args.feedback,
      addedToPlaylistId: args.playlistId,
    });

    // Update playlist count
    const playlist = await ctx.db.get(args.playlistId);
    if (playlist) {
      await ctx.db.patch(args.playlistId, {
        trackCount: playlist.trackCount + 1,
      });
    }

    // Get track and curator info for notification
    const track = await ctx.db.get(submission.trackId);
    const curator = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", submission.creatorId))
      .unique();

    const curatorName = curator?.firstName || curator?.email || "A curator";
    const trackTitle = track?.title || "your track";
    const playlistName = playlist?.name || "their playlist";

    // Create notification for submitter
    await ctx.db.insert("notifications", {
      userId: submission.submitterId,
      title: "Track Accepted!",
      message: `${curatorName} accepted "${trackTitle}" to ${playlistName}!`,
      type: "success",
      read: false,
      link: "/dashboard/home/submissions",
      actionLabel: "View Details",
      createdAt: Date.now(),
      emailSent: false,
      senderType: "creator",
      senderId: submission.creatorId,
      senderName: curatorName,
      senderAvatar: curator?.imageUrl,
    });

    return null;
  },
});

/**
 * Decline submission
 */
export const declineSubmission = mutation({
  args: {
    submissionId: v.id("trackSubmissions"),
    decisionNotes: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    await ctx.db.patch(args.submissionId, {
      status: "declined",
      decidedAt: Date.now(),
      decisionNotes: args.decisionNotes,
      feedback: args.feedback,
    });

    // Get track and curator info for notification
    const track = await ctx.db.get(submission.trackId);
    const curator = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", submission.creatorId))
      .unique();

    let playlist = null;
    if (submission.playlistId) {
      playlist = await ctx.db.get(submission.playlistId);
    }

    const curatorName = curator?.firstName || curator?.email || "A curator";
    const trackTitle = track?.title || "your track";

    // Create notification for submitter
    await ctx.db.insert("notifications", {
      userId: submission.submitterId,
      title: "Submission Reviewed",
      message: args.feedback
        ? `${curatorName} reviewed "${trackTitle}": ${args.feedback}`
        : `${curatorName} reviewed your submission for "${trackTitle}"`,
      type: "info",
      read: false,
      link: "/dashboard/home/submissions",
      actionLabel: "View Feedback",
      createdAt: Date.now(),
      emailSent: false,
      senderType: "creator",
      senderId: submission.creatorId,
      senderName: curatorName,
      senderAvatar: curator?.imageUrl,
    });

    return null;
  },
});

/**
 * Get submission stats for creator
 */
export const getSubmissionStats = query({
  args: { creatorId: v.string() },
  returns: v.object({
    inbox: v.number(),
    reviewed: v.number(),
    accepted: v.number(),
    declined: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const allSubmissions = await ctx.db
      .query("trackSubmissions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    return {
      inbox: allSubmissions.filter(s => s.status === "inbox").length,
      reviewed: allSubmissions.filter(s => s.status === "reviewed").length,
      accepted: allSubmissions.filter(s => s.status === "accepted").length,
      declined: allSubmissions.filter(s => s.status === "declined").length,
      total: allSubmissions.length,
    };
  },
});

/**
 * Update payment status for a submission
 */
export const updatePaymentStatus = mutation({
  args: {
    submissionId: v.id("trackSubmissions"),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded")),
    paymentId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, {
      paymentStatus: args.paymentStatus,
      paymentId: args.paymentId,
    });
    return null;
  },
});

