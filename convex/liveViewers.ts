import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Live Viewer Tracking System
 * 
 * Tracks who is currently viewing courses and lessons in real-time.
 * Viewers are considered "active" if they've sent a heartbeat in the last 60 seconds.
 */

// Record a viewer presence (heartbeat)
export const recordPresence = mutation({
  args: {
    courseId: v.id("courses"),
    chapterId: v.optional(v.id("courseChapters")),
    userId: v.string(), // Clerk user ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 60000; // 60 seconds

    // Check if viewer already exists
    const existing = await ctx.db
      .query("liveViewers")
      .withIndex("by_course_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      // Update existing viewer
      await ctx.db.patch(existing._id, {
        chapterId: args.chapterId,
        lastSeen: now,
        expiresAt,
      });
    } else {
      // Create new viewer record
      await ctx.db.insert("liveViewers", {
        courseId: args.courseId,
        chapterId: args.chapterId,
        userId: args.userId,
        lastSeen: now,
        expiresAt,
      });
    }

    return { success: true };
  },
});

// Get live viewer count for a course
export const getLiveViewerCount = query({
  args: {
    courseId: v.id("courses"),
    chapterId: v.optional(v.id("courseChapters")),
  },
  returns: v.object({
    total: v.number(),
    byChapter: v.optional(
      v.array(
        v.object({
          chapterId: v.id("courseChapters"),
          count: v.number(),
        })
      )
    ),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all active viewers for this course
    const viewers = await ctx.db
      .query("liveViewers")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // If querying for a specific chapter
    if (args.chapterId) {
      const chapterViewers = viewers.filter(
        (v) => v.chapterId && v.chapterId === args.chapterId
      );
      return {
        total: chapterViewers.length,
      };
    }

    // Group by chapter
    const byChapter: Record<string, number> = {};
    for (const viewer of viewers) {
      if (viewer.chapterId) {
        const id = viewer.chapterId as string;
        byChapter[id] = (byChapter[id] || 0) + 1;
      }
    }

    return {
      total: viewers.length,
      byChapter: Object.entries(byChapter).map(([chapterId, count]) => ({
        chapterId: chapterId as Id<"courseChapters">,
        count,
      })),
    };
  },
});

// Get list of active viewers with user details
export const getActiveViewers = query({
  args: {
    courseId: v.id("courses"),
    chapterId: v.optional(v.id("courseChapters")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      chapterId: v.optional(v.id("courseChapters")),
      chapterTitle: v.optional(v.string()),
      lastSeen: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 20;

    // Get active viewers
    let viewersQuery = ctx.db
      .query("liveViewers")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.gt(q.field("expiresAt"), now));

    const viewers = await viewersQuery.take(limit);

    // Filter by chapter if specified
    const filteredViewers = args.chapterId
      ? viewers.filter((v) => v.chapterId === args.chapterId)
      : viewers;

    // Enrich with user and chapter details
    const enrichedViewers = await Promise.all(
      filteredViewers.map(async (viewer) => {
      // Get user details
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", viewer.userId))
        .first();

        // Get chapter details if applicable
        let chapterTitle: string | undefined;
        if (viewer.chapterId) {
          const chapter = await ctx.db.get(viewer.chapterId);
          chapterTitle = chapter?.title;
        }

        return {
          userId: viewer.userId,
          userName: user?.name,
          userAvatar: user?.imageUrl,
          chapterId: viewer.chapterId,
          chapterTitle,
          lastSeen: viewer.lastSeen,
        };
      })
    );

    return enrichedViewers;
  },
});

// Cleanup expired viewers (run periodically via cron)
export const cleanupExpiredViewers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired viewers — process in bounded batches to limit bandwidth
    const expired = await ctx.db
      .query("liveViewers")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(200);

    // Delete expired records
    for (const viewer of expired) {
      await ctx.db.delete(viewer._id);
    }

    return { deleted: expired.length };
  },
});

// Remove a specific viewer (on explicit disconnect)
export const removePresence = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db
      .query("liveViewers")
      .withIndex("by_course_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId)
      )
      .first();

    if (viewer) {
      await ctx.db.delete(viewer._id);
    }

    return { success: true };
  },
});

