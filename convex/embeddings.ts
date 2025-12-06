import { action, query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Get all courses for embedding generation
export const getAllCourses = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    skillLevel: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    storeId: v.optional(v.string()),
    instructorId: v.optional(v.string()),
    price: v.optional(v.number()),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    checkoutHeadline: v.optional(v.string()),
    checkoutDescription: v.optional(v.string()),
    paymentDescription: v.optional(v.string()),
    guaranteeText: v.optional(v.string()),
    showGuarantee: v.optional(v.boolean()),
    acceptsStripe: v.optional(v.boolean()),
    acceptsPayPal: v.optional(v.boolean()),
    stripePriceId: v.optional(v.string()),
    stripeProductId: v.optional(v.string()),
    courseCategoryId: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

// Get all chapters for a course
export const getCourseChapters = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.array(v.object({
    _id: v.id("courseChapters"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.string(),
    position: v.number(),
    lessonId: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    generatedAudioUrl: v.optional(v.string()),
    generatedVideoUrl: v.optional(v.string()),
    audioGenerationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"), 
      v.literal("completed"),
      v.literal("failed")
    )),
    videoGenerationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"), 
      v.literal("failed")
    )),
    audioGeneratedAt: v.optional(v.number()),
    videoGeneratedAt: v.optional(v.number()),
    audioGenerationError: v.optional(v.string()),
    videoGenerationError: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFree: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// Check if embeddings already exist for a source
export const checkExistingEmbeddings = internalQuery({
  args: { 
    sourceId: v.string(),
    sourceType: v.union(
      v.literal("course"), 
      v.literal("chapter"),
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    )
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .filter((q) => q.eq(q.field("sourceType"), args.sourceType))
      .collect();
    
    return existing.length;
  },
});

// Get all lessons for a module
export const getModuleLessons = internalQuery({
  args: { moduleId: v.string() },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    return lessons.map(l => ({
      _id: l._id,
      title: l.title,
      description: l.description,
      moduleId: l.moduleId,
      position: l.position,
    }));
  },
});

// Get all course modules
export const getCourseModules = internalQuery({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("courseModules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    return modules.map(m => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      courseId: m.courseId,
      position: m.position,
    }));
  },
});

// Get all digital products
export const getAllDigitalProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").collect();
    // Return only the fields we need for embedding
    return products.map(p => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      productType: p.productType,
      productCategory: p.productCategory,
      storeId: p.storeId,
      userId: p.userId,
      isPublished: p.isPublished,
      price: p.price,
    }));
  },
});

// Get all user notes
export const getAllNotes = internalQuery({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("notes").collect();
    // Return only the fields we need for embedding
    return notes.map(n => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      plainTextContent: n.plainTextContent,
      userId: n.userId,
      storeId: n.storeId,
      category: n.category,
      tags: n.tags,
      status: n.status,
    }));
  },
});


// Delete embeddings by source (internal helper)
export const deleteEmbeddingsBySource = internalMutation({
  args: {
    sourceId: v.string(),
    sourceType: v.union(
      v.literal("course"), 
      v.literal("chapter"),
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .filter((q) => q.eq(q.field("sourceType"), args.sourceType))
      .collect();

    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }

    return null;
  },
});

// Delete a batch of embeddings (for model migration)
// Returns the number deleted and whether there are more to delete
export const deleteEmbeddingsBatch = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    deleted: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    
    // Only fetch IDs, not the full embedding data (which is huge)
    const embeddings = await ctx.db
      .query("embeddings")
      .take(batchSize);
    
    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }

    // Check if there are more
    const remaining = await ctx.db.query("embeddings").first();
    
    return {
      deleted: embeddings.length,
      hasMore: remaining !== null,
    };
  },
});

// Get embedding statistics
export const getEmbeddingStats = query({
  args: {},
  returns: v.object({
    totalEmbeddings: v.number(),
    bySourceType: v.object({
      courses: v.number(),
      chapters: v.number(),
      lessons: v.number(),
      products: v.number(),
      notes: v.number(),
      webResearch: v.number(),
      other: v.number(),
    }),
    contentCounts: v.object({
      courses: v.number(),
      chapters: v.number(),
      lessons: v.number(),
      products: v.number(),
      notes: v.number(),
    }),
    coveragePercentage: v.number(),
  }),
  handler: async (ctx) => {
    const allEmbeddings = await ctx.db.query("embeddings").collect();
    
    // Count embeddings by source type
    const bySourceType = {
      courses: 0,
      chapters: 0,
      lessons: 0,
      products: 0,
      notes: 0,
      webResearch: 0,
      other: 0,
    };
    
    for (const e of allEmbeddings) {
      if (e.sourceType === "course") bySourceType.courses++;
      else if (e.sourceType === "chapter") bySourceType.chapters++;
      else if (e.sourceType === "lesson") bySourceType.lessons++;
      else if (e.sourceType === "note") bySourceType.notes++;
      else if (e.sourceType === "document") {
        // Check metadata for type
        const meta = e.metadata as any;
        if (meta?.type === "web_research") bySourceType.webResearch++;
        else bySourceType.products++;
      }
      else bySourceType.other++;
    }
    
    // Count actual content
    const courses = await ctx.db.query("courses").collect();
    const chapters = await ctx.db.query("courseChapters").collect();
    const lessons = await ctx.db.query("courseLessons").collect();
    const products = await ctx.db.query("digitalProducts").collect();
    const notes = await ctx.db.query("notes").collect();
    
    const contentCounts = {
      courses: courses.length,
      chapters: chapters.length,
      lessons: lessons.length,
      products: products.length,
      notes: notes.length,
    };
    
    // Calculate coverage (embeddings vs total content items)
    const totalContent = contentCounts.courses + contentCounts.chapters + contentCounts.lessons + contentCounts.products + contentCounts.notes;
    const embeddedContent = bySourceType.courses + bySourceType.chapters + bySourceType.lessons + bySourceType.products + bySourceType.notes;
    const coveragePercentage = totalContent > 0 ? Math.round((embeddedContent / totalContent) * 100) : 0;

    return {
      totalEmbeddings: allEmbeddings.length,
      bySourceType,
      contentCounts,
      coveragePercentage,
    };
  },
});
