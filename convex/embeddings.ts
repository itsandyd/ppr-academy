import { action, query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Get all courses for embedding generation
export const getAllCourses = internalQuery({
  args: {},
  returns: v.array(
    v.object({
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
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("courses").take(500);
  },
});

// Get all chapters for a course
export const getCourseChapters = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.array(
    v.object({
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
      audioGenerationStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("generating"),
          v.literal("completed"),
          v.literal("failed")
        )
      ),
      videoGenerationStatus: v.optional(
        v.union(
          v.literal("pending"),
          v.literal("generating"),
          v.literal("completed"),
          v.literal("failed")
        )
      ),
      audioGeneratedAt: v.optional(v.number()),
      videoGeneratedAt: v.optional(v.number()),
      audioGenerationError: v.optional(v.string()),
      videoGenerationError: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      isFree: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(500);
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
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.sourceId))
      .filter((q) => q.eq(q.field("sourceType"), args.sourceType))
      .take(5000);

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
      .take(500);
    return lessons.map((l) => ({
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
      .take(500);
    return modules.map((m) => ({
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
    const products = await ctx.db.query("digitalProducts").take(500);
    // Return only the fields we need for embedding
    return products.map((p) => ({
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
    const notes = await ctx.db.query("notes").take(500);
    // Return only the fields we need for embedding
    return notes.map((n) => ({
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
      .take(5000);

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
    const embeddings = await ctx.db.query("embeddings").take(batchSize);

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

// Internal query to count embeddings by a specific source type using pagination
// Each call processes a batch to stay under the 16MB limit
export const countEmbeddingsBatch = internalQuery({
  args: {
    sourceType: v.union(
      v.literal("course"),
      v.literal("chapter"),
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    ),
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    count: v.number(),
    webResearch: v.number(),
    products: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 500; // Smaller batch to stay under limit

    const result = await ctx.db
      .query("embeddings")
      .withIndex("by_sourceType", (q) => q.eq("sourceType", args.sourceType))
      .paginate({ numItems: batchSize, cursor: args.cursor });

    let count = result.page.length;
    let webResearch = 0;
    let products = 0;

    // For document type, separate products from web research
    if (args.sourceType === "document") {
      for (const e of result.page) {
        const meta = e.metadata as any;
        if (meta?.type === "web_research") webResearch++;
        else products++;
      }
    }

    return {
      count,
      webResearch,
      products,
      nextCursor: result.isDone ? null : result.continueCursor,
      isDone: result.isDone,
    };
  },
});

// Internal query to count documents in a table batch using pagination
export const countTableDocumentsBatch = internalQuery({
  args: {
    tableName: v.union(
      v.literal("courses"),
      v.literal("courseChapters"),
      v.literal("courseLessons"),
      v.literal("digitalProducts"),
      v.literal("notes")
    ),
    cursor: v.union(v.string(), v.null()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    count: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 1000; // Content tables are smaller per-row, can use larger batch

    const result = await ctx.db
      .query(args.tableName)
      .paginate({ numItems: batchSize, cursor: args.cursor });

    return {
      count: result.page.length,
      nextCursor: result.isDone ? null : result.continueCursor,
      isDone: result.isDone,
    };
  },
});

// Legacy function for backward compatibility - just returns 0 if it would hit limit
export const countTableDocuments = internalQuery({
  args: {
    tableName: v.union(
      v.literal("courses"),
      v.literal("courseChapters"),
      v.literal("courseLessons"),
      v.literal("digitalProducts"),
      v.literal("notes")
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Use take to get first batch and estimate
    const batch = await ctx.db.query(args.tableName).take(1000);
    return batch.length;
  },
});

// Helper to count all embeddings of a source type using pagination
async function countAllEmbeddingsForType(
  ctx: any,
  sourceType: "course" | "chapter" | "lesson" | "document" | "note" | "custom"
): Promise<{ count: number; webResearch: number; products: number }> {
  let totalCount = 0;
  let totalWebResearch = 0;
  let totalProducts = 0;
  let cursor: string | null = null;

  // Paginate through all embeddings of this type
  do {
    // @ts-ignore Convex type instantiation too deep
    const result: {
      count: number;
      webResearch: number;
      products: number;
      nextCursor: string | null;
      isDone: boolean;
    } = await ctx.runQuery(internal.embeddings.countEmbeddingsBatch, {
      sourceType,
      cursor,
      batchSize: 500, // Keep batch small to avoid 16MB limit
    });

    totalCount += result.count;
    totalWebResearch += result.webResearch;
    totalProducts += result.products;
    cursor = result.nextCursor;

    if (result.isDone) break;
  } while (cursor !== null);

  return { count: totalCount, webResearch: totalWebResearch, products: totalProducts };
}

// Action to get embedding statistics
// Uses paginated query calls to avoid the 16MB read limit per query
export const getEmbeddingStats = action({
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
    // Count embeddings by source type using pagination - run sequentially to avoid overwhelming
    const courseResult = await countAllEmbeddingsForType(ctx, "course");
    const chapterResult = await countAllEmbeddingsForType(ctx, "chapter");
    const lessonResult = await countAllEmbeddingsForType(ctx, "lesson");
    const noteResult = await countAllEmbeddingsForType(ctx, "note");
    const documentResult = await countAllEmbeddingsForType(ctx, "document");
    const customResult = await countAllEmbeddingsForType(ctx, "custom");

    const bySourceType = {
      courses: courseResult.count,
      chapters: chapterResult.count,
      lessons: lessonResult.count,
      products: documentResult.products,
      notes: noteResult.count,
      webResearch: documentResult.webResearch,
      other: customResult.count,
    };

    const totalEmbeddings =
      courseResult.count +
      chapterResult.count +
      lessonResult.count +
      noteResult.count +
      documentResult.count +
      customResult.count;

    // Count content items using pagination
    const countTable = async (
      tableName: "courses" | "courseChapters" | "courseLessons" | "digitalProducts" | "notes"
    ) => {
      let total = 0;
      let cursor: string | null = null;
      do {
        // @ts-ignore Convex type instantiation too deep
        const result: { count: number; nextCursor: string | null; isDone: boolean } =
          await ctx.runQuery(internal.embeddings.countTableDocumentsBatch, {
            tableName,
            cursor,
            batchSize: 1000,
          });
        total += result.count;
        cursor = result.nextCursor;
        if (result.isDone) break;
      } while (cursor !== null);
      return total;
    };

    // Run counts in parallel for speed
    const [coursesCount, chaptersCount, lessonsCount, productsCount, notesCount] =
      await Promise.all([
        countTable("courses"),
        countTable("courseChapters"),
        countTable("courseLessons"),
        countTable("digitalProducts"),
        countTable("notes"),
      ]);

    const contentCounts = {
      courses: coursesCount,
      chapters: chaptersCount,
      lessons: lessonsCount,
      products: productsCount,
      notes: notesCount,
    };

    // Calculate coverage
    const totalContent = coursesCount + chaptersCount + lessonsCount + productsCount + notesCount;
    const embeddedContent =
      bySourceType.courses +
      bySourceType.chapters +
      bySourceType.lessons +
      bySourceType.products +
      bySourceType.notes;
    const coveragePercentage =
      totalContent > 0 ? Math.round((embeddedContent / totalContent) * 100) : 0;

    return {
      totalEmbeddings,
      bySourceType,
      contentCounts,
      coveragePercentage,
    };
  },
});
