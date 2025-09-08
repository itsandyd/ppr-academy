import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save an audio file reference and return the URL
 */
export const saveAudioFile = mutation({
  args: {
    storageId: v.id("_storage"),
    chapterId: v.string(),
    filename: v.string(),
    size: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }
    
    // Store file metadata (optional, for tracking)
    await ctx.db.insert("audioFiles", {
      storageId: args.storageId,
      chapterId: args.chapterId,
      filename: args.filename,
      size: args.size,
      url,
    });
    
    return url;
  },
});

/**
 * Delete an audio file
 */
export const deleteAudioFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    // Delete the file from storage
    await ctx.storage.delete(args.storageId);
    
    // Remove the metadata record
    const audioFile = await ctx.db
      .query("audioFiles")
      .filter((q) => q.eq(q.field("storageId"), args.storageId))
      .unique();
    
    if (audioFile) {
      await ctx.db.delete(audioFile._id);
    }
    
    return null;
  },
});

