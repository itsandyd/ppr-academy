import { query, mutation, internalMutation, action, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// ==================== NOTE FOLDERS ====================

export const createFolder = mutation({
  args: {
    name: v.string(),
    userId: v.string(),
    storeId: v.string(),
    parentId: v.optional(v.id("noteFolders")),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  returns: v.id("noteFolders"),
  handler: async (ctx, args) => {
    // Get position for new folder
    const existingFolders = await ctx.db
      .query("noteFolders")
      .withIndex("by_user_and_parent", (q) => 
        q.eq("userId", args.userId).eq("parentId", args.parentId || undefined)
      )
      .collect();
    
    const position = existingFolders.length;
    
    return await ctx.db.insert("noteFolders", {
      name: args.name,
      userId: args.userId,
      storeId: args.storeId,
      parentId: args.parentId,
      description: args.description,
      color: args.color || "#3b82f6", // Default blue
      icon: args.icon || "📁",
      position,
      isArchived: false,
    });
  },
});

export const getFoldersByUser = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
    parentId: v.optional(v.id("noteFolders")),
  },
  returns: v.array(v.object({
    _id: v.id("noteFolders"),
    _creationTime: v.number(),
    name: v.string(),
    userId: v.string(),
    storeId: v.string(),
    parentId: v.optional(v.id("noteFolders")),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    position: v.number(),
    isArchived: v.boolean(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("noteFolders")
      .withIndex("by_user_and_parent", (q) => 
        q.eq("userId", args.userId).eq("parentId", args.parentId || undefined)
      )
      .filter((q) => q.eq(q.field("storeId"), args.storeId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();
  },
});

export const updateFolder = mutation({
  args: {
    folderId: v.id("noteFolders"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("noteFolders")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.parentId !== undefined) updates.parentId = args.parentId;
    
    await ctx.db.patch(args.folderId, updates);
    return null;
  },
});

export const deleteFolder = mutation({
  args: {
    folderId: v.id("noteFolders"),
    moveNotesToFolderId: v.optional(v.id("noteFolders")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Move or orphan notes in this folder
    const notesInFolder = await ctx.db
      .query("notes")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .collect();
    
    for (const note of notesInFolder) {
      await ctx.db.patch(note._id, { 
        folderId: args.moveNotesToFolderId 
      });
    }
    
    // Archive the folder instead of deleting to preserve references
    await ctx.db.patch(args.folderId, { isArchived: true });
    
    return null;
  },
});

// ==================== NOTES ====================

export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    userId: v.string(),
    storeId: v.string(),
    folderId: v.optional(v.id("noteFolders")),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    icon: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if this is the user's first note and create templates if needed
    const existingNotes = await ctx.db
      .query("notes")
      .withIndex("by_user_and_store", (q) => 
        q.eq("userId", args.userId).eq("storeId", args.storeId)
      )
      .take(1);
    
    if (existingNotes.length === 0) {
      // First note - create default templates
      await ctx.scheduler.runAfter(0, internal.noteTemplates.createDefaultTemplates, {
        userId: args.userId,
      });
    }
    
    // Extract plain text from HTML content for search
    const plainTextContent = args.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainTextContent.split(' ').filter(word => word.length > 0).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed
    
    const noteId = await ctx.db.insert("notes", {
      title: args.title,
      content: args.content,
      userId: args.userId,
      storeId: args.storeId,
      folderId: args.folderId,
      plainTextContent,
      wordCount,
      readTimeMinutes,
      tags: args.tags || [],
      category: args.category,
      priority: args.priority || "medium",
      status: "draft" as const,
      isProcessedForRAG: false,
      lastEditedAt: now,
      lastViewedAt: now,
      isShared: false,
      isTemplate: false,
      icon: args.icon,
      coverImage: args.coverImage,
      isArchived: false,
      isFavorite: false,
    });
    
    // Schedule RAG processing for searchability
    await ctx.scheduler.runAfter(0, internal.notes.processNoteForRAG, {
      noteId,
    });

    return noteId;
  },
});

export const linkNotesToCourse = internalMutation({
  args: {
    noteIds: v.array(v.id("notes")),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const noteId of args.noteIds) {
      await ctx.db.patch(noteId, {
        linkedCourseId: args.courseId,
        lastEditedAt: Date.now(),
      });
    }
    return null;
  },
});

export const validateNotesAccess = internalQuery({
  args: {
    noteIds: v.array(v.id("notes")),
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("notes"),
    title: v.string(),
    content: v.string(),
    plainTextContent: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    ),
    wordCount: v.optional(v.number()),
    readTimeMinutes: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const notes = [];
    
    for (const noteId of args.noteIds) {
      const note = await ctx.db.get(noteId);
      if (note && note.userId === args.userId && !note.isArchived) {
        notes.push({
          _id: note._id,
          title: note.title,
          content: note.content,
          plainTextContent: note.plainTextContent,
          tags: note.tags,
          category: note.category,
          status: note.status,
          wordCount: note.wordCount,
          readTimeMinutes: note.readTimeMinutes,
        });
      }
    }
    
    return notes;
  },
});

export const getNotesByUser: any = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
    folderId: v.optional(v.id("noteFolders")),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    )),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<any> => {
    let query = ctx.db
      .query("notes")
      .withIndex("by_user_and_store", (q) => 
        q.eq("userId", args.userId).eq("storeId", args.storeId)
      );
    
    if (args.folderId !== undefined) {
      query = ctx.db
        .query("notes")
        .withIndex("by_user_and_folder", (q) => 
          q.eq("userId", args.userId).eq("folderId", args.folderId)
        );
    }
    
    let results = query.filter((q) => q.eq(q.field("isArchived"), false));
    
    if (args.status) {
      results = results.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await results
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getNote = query({
  args: { noteId: v.id("notes") },
  returns: v.union(v.object({
    _id: v.id("notes"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.string(),
    userId: v.string(),
    storeId: v.string(),
    folderId: v.optional(v.id("noteFolders")),
    plainTextContent: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    readTimeMinutes: v.optional(v.number()),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    ),
    isProcessedForRAG: v.boolean(),
    linkedCourseId: v.optional(v.id("courses")),
    aiSummary: v.optional(v.string()),
    lastEditedAt: v.number(),
    lastViewedAt: v.optional(v.number()),
    isShared: v.boolean(),
    sharedWith: v.optional(v.array(v.string())),
    isTemplate: v.boolean(),
    templateCategory: v.optional(v.string()),
    icon: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isArchived: v.boolean(),
    isFavorite: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const updateNoteLastViewed = mutation({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, { 
      lastViewedAt: Date.now() 
    });
    return null;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    )),
    folderId: v.optional(v.id("noteFolders")),
    icon: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      lastEditedAt: Date.now(),
    };
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.category !== undefined) updates.category = args.category;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.status !== undefined) updates.status = args.status;
    if (args.folderId !== undefined) updates.folderId = args.folderId;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;
    
    if (args.content !== undefined) {
      updates.content = args.content;
      // Update plain text and metadata
      const plainTextContent = args.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = plainTextContent.split(' ').filter(word => word.length > 0).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
      
      updates.plainTextContent = plainTextContent;
      updates.wordCount = wordCount;
      updates.readTimeMinutes = readTimeMinutes;
      updates.isProcessedForRAG = false; // Mark for reprocessing

      // Schedule RAG reprocessing
      await ctx.scheduler.runAfter(0, internal.notes.processNoteForRAG, {
        noteId: args.noteId,
      });
    }
    
    await ctx.db.patch(args.noteId, updates);
    return null;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Archive the note instead of deleting to preserve RAG embeddings
    await ctx.db.patch(args.noteId, { 
      isArchived: true,
      lastEditedAt: Date.now(),
    });
    return null;
  },
});

export const searchNotes = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
    searchQuery: v.string(),
    category: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("notes"),
    _creationTime: v.number(),
    title: v.string(),
    plainTextContent: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    ),
    lastEditedAt: v.number(),
    icon: v.optional(v.string()),
    isFavorite: v.boolean(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) => 
        q.search("plainTextContent", args.searchQuery)
         .eq("userId", args.userId)
         .eq("storeId", args.storeId)
         .eq("isArchived", false)
      );
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await query.take(args.limit || 20);
  },
});

// ==================== RAG INTEGRATION ====================

/**
 * Process a note for RAG (Retrieval-Augmented Generation)
 * Creates embeddings from note content for AI-powered search and Q&A
 */
export const processNoteForRAG = internalAction({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get the note
      const note = await ctx.runQuery(internal.notes.getNoteInternal, {
        noteId: args.noteId,
      });

      if (!note || note.isArchived) {
        return null;
      }

      // Check if already processed
      if (note.isProcessedForRAG) {
        return null;
      }

      // Extract plain text content
      const content = note.plainTextContent || note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      if (content.length < 10) {
        await ctx.runMutation(internal.notes.markNoteAsProcessed, { noteId: args.noteId });
        return null;
      }

      // Add to RAG system using the existing rag.addContent mutation
      await ctx.runMutation(api.rag.addContent, {
        content: `${note.title}\n\n${content}`,
        userId: note.userId,
        title: note.title,
        category: note.category || "notes",
        sourceType: "note",
        sourceId: note._id,
        metadata: {
          noteId: note._id,
          storeId: note.storeId,
          tags: note.tags,
          priority: note.priority,
          wordCount: note.wordCount,
        },
      });

      // Mark as processed
      await ctx.runMutation(internal.notes.markNoteAsProcessed, { noteId: args.noteId });
      return null;
    } catch (error) {
      console.error(`❌ Error processing note ${args.noteId} for RAG:`, error);
      return null;
    }
  },
});

/**
 * Internal query to get note data for RAG processing
 */
export const getNoteInternal = internalQuery({
  args: { noteId: v.id("notes") },
  returns: v.union(v.object({
    _id: v.id("notes"),
    title: v.string(),
    content: v.string(),
    userId: v.string(),
    storeId: v.string(),
    plainTextContent: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    wordCount: v.optional(v.number()),
    isProcessedForRAG: v.boolean(),
    isArchived: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return null;
    return {
      _id: note._id,
      title: note.title,
      content: note.content,
      userId: note.userId,
      storeId: note.storeId,
      plainTextContent: note.plainTextContent,
      tags: note.tags,
      category: note.category,
      priority: note.priority,
      wordCount: note.wordCount,
      isProcessedForRAG: note.isProcessedForRAG,
      isArchived: note.isArchived,
    };
  },
});

export const markNoteAsProcessed = internalMutation({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      isProcessedForRAG: true
    });
    return null;
  },
});

// ==================== NOTE TEMPLATES ====================

export const createNoteTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.boolean(),
    createdBy: v.string(),
  },
  returns: v.id("noteTemplates"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("noteTemplates", {
      name: args.name,
      description: args.description,
      content: args.content,
      category: args.category,
      tags: args.tags,
      icon: args.icon,
      isPublic: args.isPublic,
      createdBy: args.createdBy,
      usageCount: 0,
    });
  },
});

export const getNoteTemplates = query({
  args: {
    category: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("noteTemplates"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.boolean(),
    createdBy: v.string(),
    usageCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    if (args.category) {
      return await ctx.db
        .query("noteTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(limit);
    } else if (args.createdBy) {
      return await ctx.db
        .query("noteTemplates")
        .withIndex("by_createdBy", (q) => q.eq("createdBy", args.createdBy!))
        .order("desc")
        .take(limit);
    } else {
      return await ctx.db
        .query("noteTemplates")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .order("desc")
        .take(limit);
    }
  },
});

export const useNoteTemplate: any = mutation({
  args: {
    templateId: v.id("noteTemplates"),
    userId: v.string(),
    storeId: v.string(),
    title: v.string(),
    folderId: v.optional(v.id("noteFolders")),
  },
  returns: v.id("notes"),
  handler: async (ctx, args): Promise<any> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Increment usage count
    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
    });
    
    // Create note from template
    return await ctx.runMutation(api.notes.createNote, {
      title: args.title,
      content: template.content,
      userId: args.userId,
      storeId: args.storeId,
      folderId: args.folderId,
      tags: template.tags,
      category: template.category,
      icon: template.icon,
    });
  },
});

// ==================== HELPER QUERIES FOR COURSE GENERATION ====================

// Helper internal query to get modules for style analysis
export const getModulesForStyleAnalysis = internalQuery({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(v.object({
    title: v.string(),
    description: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();
    
    return modules.map(m => ({
      title: m.title,
      description: m.description,
    }));
  },
});
