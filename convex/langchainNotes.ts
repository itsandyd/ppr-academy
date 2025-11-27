import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ==================== INTERNAL MUTATIONS ====================

export const insertNoteSource = internalMutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    rawContent: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("noteSources"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("noteSources", {
      userId: args.userId,
      storeId: args.storeId,
      sourceType: args.sourceType,
      title: args.title,
      url: args.url,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      rawContent: args.rawContent,
      status: args.rawContent ? "completed" : "pending",
      createdAt: Date.now(),
      tags: args.tags,
    });
  },
});

export const updateSourceStatus = internalMutation({
  args: {
    sourceId: v.id("noteSources"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }
    if (args.status === "completed") {
      updates.processedAt = Date.now();
    }
    await ctx.db.patch(args.sourceId, updates);
    return null;
  },
});

export const updateSourceContent = internalMutation({
  args: {
    sourceId: v.id("noteSources"),
    rawContent: v.string(),
    contentChunks: v.array(v.string()),
    title: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    youtubeDuration: v.optional(v.number()),
    youtubeChannel: v.optional(v.string()),
    youtubeThumbnail: v.optional(v.string()),
    websiteDomain: v.optional(v.string()),
    websiteAuthor: v.optional(v.string()),
    websitePublishedDate: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      rawContent: args.rawContent,
      contentChunks: args.contentChunks,
      status: args.status,
      processedAt: Date.now(),
    };
    
    if (args.title) updates.title = args.title;
    if (args.youtubeVideoId) updates.youtubeVideoId = args.youtubeVideoId;
    if (args.youtubeDuration) updates.youtubeDuration = args.youtubeDuration;
    if (args.youtubeChannel) updates.youtubeChannel = args.youtubeChannel;
    if (args.youtubeThumbnail) updates.youtubeThumbnail = args.youtubeThumbnail;
    if (args.websiteDomain) updates.websiteDomain = args.websiteDomain;
    if (args.websiteAuthor) updates.websiteAuthor = args.websiteAuthor;
    if (args.websitePublishedDate) updates.websitePublishedDate = args.websitePublishedDate;
    
    await ctx.db.patch(args.sourceId, updates);
    return null;
  },
});

export const updateSourceSummary = internalMutation({
  args: {
    sourceId: v.id("noteSources"),
    summary: v.string(),
    keyPoints: v.array(v.string()),
    generatedNoteId: v.id("notes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    const existingNoteIds = source?.generatedNoteIds || [];
    
    await ctx.db.patch(args.sourceId, {
      summary: args.summary,
      keyPoints: args.keyPoints,
      generatedNoteIds: [...existingNoteIds, args.generatedNoteId],
    });
    return null;
  },
});

// ==================== INTERNAL QUERIES ====================

export const getSource = internalQuery({
  args: {
    sourceId: v.id("noteSources"),
  },
  returns: v.union(v.object({
    _id: v.id("noteSources"),
    _creationTime: v.number(),
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    rawContent: v.optional(v.string()),
    contentChunks: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    youtubeDuration: v.optional(v.number()),
    youtubeChannel: v.optional(v.string()),
    youtubeThumbnail: v.optional(v.string()),
    websiteDomain: v.optional(v.string()),
    websiteAuthor: v.optional(v.string()),
    websitePublishedDate: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    generatedNoteIds: v.optional(v.array(v.id("notes"))),
    tags: v.optional(v.array(v.string())),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

export const getSourcesByUser = internalQuery({
  args: {
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.optional(v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("noteSources"),
    _creationTime: v.number(),
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    generatedNoteIds: v.optional(v.array(v.id("notes"))),
  })),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("noteSources")
      .withIndex("by_user_and_store", (q) => 
        q.eq("userId", args.userId).eq("storeId", args.storeId)
      );
    
    const results = await query.order("desc").collect();
    
    // Filter by sourceType if specified
    let filtered = args.sourceType 
      ? results.filter(s => s.sourceType === args.sourceType)
      : results;
    
    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }
    
    return filtered.map(s => ({
      _id: s._id,
      _creationTime: s._creationTime,
      userId: s.userId,
      storeId: s.storeId,
      sourceType: s.sourceType,
      title: s.title,
      url: s.url,
      fileName: s.fileName,
      status: s.status,
      summary: s.summary,
      createdAt: s.createdAt,
      processedAt: s.processedAt,
      generatedNoteIds: s.generatedNoteIds,
    }));
  },
});

// ==================== PUBLIC QUERIES ====================

export const getSources = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("noteSources"),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    generatedNoteIds: v.optional(v.array(v.id("notes"))),
  })),
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("noteSources")
      .withIndex("by_user_and_store", (q) => 
        q.eq("userId", args.userId).eq("storeId", args.storeId)
      )
      .order("desc")
      .take(100);
    
    return sources.map(s => ({
      _id: s._id,
      sourceType: s.sourceType,
      title: s.title,
      url: s.url,
      fileName: s.fileName,
      status: s.status,
      summary: s.summary,
      createdAt: s.createdAt,
      generatedNoteIds: s.generatedNoteIds,
    }));
  },
});

export const getSourceById = query({
  args: {
    sourceId: v.id("noteSources"),
  },
  returns: v.union(v.object({
    _id: v.id("noteSources"),
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    generatedNoteIds: v.optional(v.array(v.id("notes"))),
    youtubeVideoId: v.optional(v.string()),
    youtubeThumbnail: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    websiteDomain: v.optional(v.string()),
    websiteAuthor: v.optional(v.string()),
  }), v.null()),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) return null;
    
    return {
      _id: source._id,
      userId: source.userId,
      storeId: source.storeId,
      sourceType: source.sourceType,
      title: source.title,
      url: source.url,
      fileName: source.fileName,
      status: source.status,
      errorMessage: source.errorMessage,
      summary: source.summary,
      keyPoints: source.keyPoints,
      createdAt: source.createdAt,
      processedAt: source.processedAt,
      generatedNoteIds: source.generatedNoteIds,
      youtubeVideoId: source.youtubeVideoId,
      youtubeThumbnail: source.youtubeThumbnail,
      youtubeChannel: source.youtubeChannel,
      websiteDomain: source.websiteDomain,
      websiteAuthor: source.websiteAuthor,
    };
  },
});

// ==================== PUBLIC MUTATIONS ====================

export const deleteNoteSource = internalMutation({
  args: {
    sourceId: v.id("noteSources"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sourceId);
    return null;
  },
});

// Public mutation to delete a source
export const deleteSource = mutation({
  args: {
    sourceId: v.id("noteSources"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify ownership
    const source = await ctx.db.get(args.sourceId);
    if (!source) {
      return { success: false, error: "Source not found" };
    }
    if (source.userId !== args.userId) {
      return { success: false, error: "Unauthorized" };
    }
    
    await ctx.db.delete(args.sourceId);
    return { success: true };
  },
});
