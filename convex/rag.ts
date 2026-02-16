import { action, mutation, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Add content with embeddings to Convex
export const addContent = mutation({
  args: {
    content: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom"),
      v.literal("socialPost")
    )),
    sourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("embeddings"),
  handler: async (ctx, args) => {
    // Store content first with placeholder embedding
    const embeddingId = await ctx.db.insert("embeddings", {
      content: args.content,
      embedding: [], // Will be updated by the action
      userId: args.userId,
      title: args.title,
      category: args.category,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      metadata: args.metadata,
    });

    // Schedule embedding generation
    await ctx.scheduler.runAfter(0, internal.rag.generateEmbedding, {
      embeddingId,
      content: args.content,
    });

    return embeddingId;
  },
});

// Internal action to generate embeddings using OpenAI
export const generateEmbedding = internalAction({
  args: {
    embeddingId: v.id("embeddings"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // text-embedding-3-small produces 1536-dimensional vectors
      const EMBEDDING_DIMENSIONS = 1536;
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, using placeholder embeddings');
        const placeholderEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
        await ctx.runMutation(internal.rag.updateEmbedding, {
          embeddingId: args.embeddingId,
          embedding: placeholderEmbedding,
        });
        return null;
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: args.content,
          model: 'text-embedding-3-small' // Best price/performance embedding model
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const embedding = (data as any)?.data?.[0]?.embedding;

      // Update the document with the actual embedding
      await ctx.runMutation(internal.rag.updateEmbedding, {
        embeddingId: args.embeddingId,
        embedding,
      });

    } catch (error) {
      console.error('Error generating embedding:', error);
      // Use placeholder embedding for development (1536 dims for text-embedding-3-small)
      const placeholderEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      await ctx.runMutation(internal.rag.updateEmbedding, {
        embeddingId: args.embeddingId,
        embedding: placeholderEmbedding,
      });
    }
    return null;
  },
});

// Internal mutation to update embedding
export const updateEmbedding = internalMutation({
  args: {
    embeddingId: v.id("embeddings"),
    embedding: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.embeddingId, {
      embedding: args.embedding,
    });
    return null;
  },
});


// Internal query to get embeddings with filters
// Note: Limited to 100 embeddings max to avoid exceeding 16MB read limit
// Each embedding is ~6KB (1536 floats * 4 bytes), so 100 = ~600KB
export const getEmbeddings = internalQuery({
  args: {
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom"),
      v.literal("socialPost")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("embeddings"),
    _creationTime: v.number(),
    content: v.string(),
    title: v.optional(v.string()),
    embedding: v.array(v.number()),
    userId: v.string(),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom"),
      v.literal("socialPost")
    )),
    sourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    // Limit to prevent exceeding 16MB read limit
    // Default to 100, max 500 embeddings at a time
    const maxLimit = Math.min(args.limit || 100, 500);
    
    // Helper to filter and limit results
    const filterAndLimit = (embeddings: any[]) => {
      return embeddings
        .filter(item => item.embedding && item.embedding.length > 0)
        .slice(0, maxLimit);
    };

    // Apply filters using proper query chaining with .take() for efficiency
    if (args.userId && args.category) {
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_user_category", (q) => 
          q.eq("userId", args.userId!).eq("category", args.category!)
        )
        .take(maxLimit + 50); // Fetch extra to account for filtering
      return filterAndLimit(embeddings);
    } else if (args.userId && args.sourceType) {
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_user_sourceType", (q) => 
          q.eq("userId", args.userId!).eq("sourceType", args.sourceType!)
        )
        .take(maxLimit + 50);
      return filterAndLimit(embeddings);
    } else if (args.userId) {
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .take(maxLimit + 50);
      return filterAndLimit(embeddings);
    } else if (args.category) {
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(maxLimit + 50);
      return filterAndLimit(embeddings);
    } else if (args.sourceType) {
      const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_sourceType", (q) => q.eq("sourceType", args.sourceType!))
        .take(maxLimit + 50);
      return filterAndLimit(embeddings);
    } else {
      // Most restrictive case - no filters means potentially huge dataset
      // Only fetch first 100 by default when no filters
      const embeddings = await ctx.db.query("embeddings").take(maxLimit + 50);
      return filterAndLimit(embeddings);
    }
  },
});


// Import course content to RAG system
export const importCourseContent = mutation({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get course
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    // Add course overview
    await ctx.db.insert("embeddings", {
      content: `${course.title}\n${course.description || ''}`,
      embedding: [], // Will be generated
      userId: args.userId,
      title: course.title,
      category: course.category,
      sourceType: "course",
      sourceId: course._id,
      metadata: { courseId: course._id },
    });

    // Get and add chapters
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(1000);

    for (const chapter of chapters) {
      if (chapter.description) {
        await ctx.db.insert("embeddings", {
          content: `${chapter.title}\n${chapter.description}`,
          embedding: [], // Will be generated
          userId: args.userId,
          title: chapter.title,
          category: course.category,
          sourceType: "chapter",
          sourceId: chapter._id,
          metadata: { 
            courseId: course._id,
            chapterId: chapter._id,
          },
        });
      }
    }

    return null;
  },
});

