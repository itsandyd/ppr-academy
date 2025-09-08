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
    sourceType: v.union(v.literal("course"), v.literal("chapter"))
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


// Delete embeddings by source (internal helper)
export const deleteEmbeddingsBySource = internalMutation({
  args: {
    sourceId: v.string(),
    sourceType: v.union(v.literal("course"), v.literal("chapter")),
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

// Get embedding statistics
export const getEmbeddingStats = query({
  args: {},
  returns: v.object({
    totalEmbeddings: v.number(),
    courseEmbeddings: v.number(),
    chapterEmbeddings: v.number(),
    totalCourses: v.number(),
    totalChapters: v.number(),
    coveragePercentage: v.number(),
  }),
  handler: async (ctx) => {
    const allEmbeddings = await ctx.db.query("embeddings").collect();
    const courseEmbeddings = allEmbeddings.filter(e => e.sourceType === "course");
    const chapterEmbeddings = allEmbeddings.filter(e => e.sourceType === "chapter");
    
    const totalCourses = await ctx.db.query("courses").collect();
    const totalChapters = await ctx.db.query("courseChapters").collect();
    
    const totalContent = totalCourses.length + totalChapters.length;
    const totalEmbeddings = allEmbeddings.length;
    const coveragePercentage = totalContent > 0 ? Math.round((totalEmbeddings / totalContent) * 100) : 0;

    return {
      totalEmbeddings: allEmbeddings.length,
      courseEmbeddings: courseEmbeddings.length,
      chapterEmbeddings: chapterEmbeddings.length,
      totalCourses: totalCourses.length,
      totalChapters: totalChapters.length,
      coveragePercentage,
    };
  },
});
