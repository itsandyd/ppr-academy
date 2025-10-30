import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Collaborative Timestamped Notes System
 * 
 * Allows students to take notes at specific timestamps in video/audio content.
 * Notes are private by default but can be shared for collaborative learning.
 */

// Create a timestamped note
export const createNote = mutation({
  args: {
    courseId: v.id("courses"),
    chapterId: v.id("chapters"),
    userId: v.string(),
    content: v.string(),
    timestamp: v.number(), // Timestamp in seconds
    isPublic: v.optional(v.boolean()),
  },
  returns: v.object({
    _id: v.id("courseNotes"),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("courseNotes", {
      courseId: args.courseId,
      chapterId: args.chapterId,
      userId: args.userId,
      content: args.content,
      timestamp: args.timestamp,
      isPublic: args.isPublic || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { _id: noteId, success: true };
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    noteId: v.id("courseNotes"),
    content: v.string(),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.noteId, {
      content: args.content,
      isPublic: args.isPublic !== undefined ? args.isPublic : note.isPublic,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a note
export const deleteNote = mutation({
  args: {
    noteId: v.id("courseNotes"),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    
    if (!note) {
      throw new Error("Note not found");
    }

    // Only owner can delete
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You can only delete your own notes");
    }

    await ctx.db.delete(args.noteId);
    return { success: true };
  },
});

// Get notes for a chapter
export const getChapterNotes = query({
  args: {
    chapterId: v.id("chapters"),
    userId: v.string(),
    includePublic: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("courseNotes"),
      _creationTime: v.number(),
      courseId: v.id("courses"),
      chapterId: v.id("chapters"),
      userId: v.string(),
      userName: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      content: v.string(),
      timestamp: v.number(),
      isPublic: v.boolean(),
      isOwner: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get user's own notes
    const userNotes = await ctx.db
      .query("courseNotes")
      .withIndex("by_chapter_user", (q) =>
        q.eq("chapterId", args.chapterId).eq("userId", args.userId)
      )
      .collect();

    let notes = userNotes;

    // Include public notes from other users if requested
    if (args.includePublic) {
      const publicNotes = await ctx.db
        .query("courseNotes")
        .withIndex("by_chapter_public", (q) =>
          q.eq("chapterId", args.chapterId).eq("isPublic", true)
        )
        .filter((q) => q.neq(q.field("userId"), args.userId))
        .collect();

      notes = [...userNotes, ...publicNotes];
    }

    // Sort by timestamp
    notes.sort((a, b) => a.timestamp - b.timestamp);

    // Enrich with user details
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        let userName: string | undefined;
        let userAvatar: string | undefined;

        if (note.userId !== args.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", note.userId))
            .first();

          userName = user?.name;
          userAvatar = user?.imageUrl;
        }

        return {
          ...note,
          userName,
          userAvatar,
          isOwner: note.userId === args.userId,
        };
      })
    );

    return enrichedNotes;
  },
});

// Get notes at specific timestamp (for inline display)
export const getNotesAtTimestamp = query({
  args: {
    chapterId: v.id("chapters"),
    timestamp: v.number(),
    userId: v.string(),
    includePublic: v.optional(v.boolean()),
    timeWindow: v.optional(v.number()), // Seconds before/after timestamp (default 5s)
  },
  returns: v.array(
    v.object({
      _id: v.id("courseNotes"),
      userId: v.string(),
      userName: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      content: v.string(),
      timestamp: v.number(),
      isPublic: v.boolean(),
      isOwner: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || 5; // Default 5 seconds
    const minTime = args.timestamp - timeWindow;
    const maxTime = args.timestamp + timeWindow;

    // Get all notes for this chapter
    const allNotes = await ctx.db
      .query("courseNotes")
      .withIndex("by_chapter", (q) => q.eq("chapterId", args.chapterId))
      .collect();

    // Filter by time window and visibility
    const filteredNotes = allNotes.filter((note) => {
      const isInTimeWindow = note.timestamp >= minTime && note.timestamp <= maxTime;
      const isVisible =
        note.userId === args.userId || (args.includePublic && note.isPublic);
      return isInTimeWindow && isVisible;
    });

    // Enrich with user details
    const enrichedNotes = await Promise.all(
      filteredNotes.map(async (note) => {
        let userName: string | undefined;
        let userAvatar: string | undefined;

        if (note.userId !== args.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", note.userId))
            .first();

          userName = user?.name;
          userAvatar = user?.imageUrl;
        }

        return {
          _id: note._id,
          userId: note.userId,
          userName,
          userAvatar,
          content: note.content,
          timestamp: note.timestamp,
          isPublic: note.isPublic,
          isOwner: note.userId === args.userId,
        };
      })
    );

    return enrichedNotes;
  },
});

// Toggle note visibility (public/private)
export const toggleNoteVisibility = mutation({
  args: {
    noteId: v.id("courseNotes"),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean(), isPublic: v.boolean() }),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);

    if (!note) {
      throw new Error("Note not found");
    }

    // Only owner can toggle visibility
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You can only modify your own notes");
    }

    const newVisibility = !note.isPublic;

    await ctx.db.patch(args.noteId, {
      isPublic: newVisibility,
      updatedAt: Date.now(),
    });

    return { success: true, isPublic: newVisibility };
  },
});

