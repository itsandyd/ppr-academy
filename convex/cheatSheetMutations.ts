import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// Outline validator (shared shape for mutations)
// =============================================================================

const outlineValidator = v.object({
  title: v.string(),
  subtitle: v.optional(v.string()),
  sections: v.array(
    v.object({
      heading: v.string(),
      type: v.union(
        v.literal("key_takeaways"),
        v.literal("quick_reference"),
        v.literal("step_by_step"),
        v.literal("tips"),
        v.literal("comparison"),
        v.literal("glossary"),
        v.literal("custom")
      ),
      items: v.array(
        v.object({
          text: v.string(),
          subItems: v.optional(v.array(v.string())),
          isTip: v.optional(v.boolean()),
          isWarning: v.optional(v.boolean()),
        })
      ),
    })
  ),
  footer: v.optional(v.string()),
  showTOC: v.optional(v.boolean()),
  badgeText: v.optional(v.string()),
});

// =============================================================================
// QUERIES
// =============================================================================

export const listCheatSheets = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cheatSheets")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(500);
  },
});

export const getCheatSheet = query({
  args: { cheatSheetId: v.id("cheatSheets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cheatSheetId);
  },
});

export const getCheatSheetsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cheatSheets")
      .withIndex("by_courseId", (q: any) => q.eq("courseId", args.courseId))
      .order("desc")
      .take(500);
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

export const saveCheatSheet = mutation({
  args: {
    cheatSheetId: v.optional(v.id("cheatSheets")),
    userId: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    selectedChapterIds: v.array(v.string()),
    outline: outlineValidator,
    aiModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.cheatSheetId) {
      // Update existing
      await ctx.db.patch(args.cheatSheetId, {
        outline: args.outline,
        selectedChapterIds: args.selectedChapterIds,
        aiModel: args.aiModel,
        updatedAt: now,
      });
      return args.cheatSheetId;
    }

    // Create new
    return await ctx.db.insert("cheatSheets", {
      userId: args.userId,
      courseId: args.courseId,
      courseTitle: args.courseTitle,
      selectedChapterIds: args.selectedChapterIds,
      outline: args.outline,
      aiModel: args.aiModel,
      generatedAt: now,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateOutline = mutation({
  args: {
    cheatSheetId: v.id("cheatSheets"),
    outline: outlineValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cheatSheetId, {
      outline: args.outline,
      updatedAt: Date.now(),
    });
  },
});

export const updatePdfInfo = mutation({
  args: {
    cheatSheetId: v.id("cheatSheets"),
    pdfStorageId: v.id("_storage"),
    pdfUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cheatSheetId, {
      pdfStorageId: args.pdfStorageId,
      pdfUrl: args.pdfUrl,
      pdfGeneratedAt: Date.now(),
      status: "generated",
      updatedAt: Date.now(),
    });
  },
});

export const publishAsLeadMagnet = mutation({
  args: {
    cheatSheetId: v.id("cheatSheets"),
    storeId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cheatSheet = await ctx.db.get(args.cheatSheetId);
    if (!cheatSheet) throw new Error("Cheat sheet not found");
    if (!cheatSheet.pdfUrl) throw new Error("PDF not generated yet");

    // Create a digitalProducts entry
    const productId = await ctx.db.insert("digitalProducts", {
      title: cheatSheet.outline.title,
      description: cheatSheet.outline.subtitle || `Cheat sheet from ${cheatSheet.courseTitle}`,
      storeId: args.storeId as any,
      userId: args.userId,
      productType: "digital",
      productCategory: "cheat-sheet",
      price: 0,
      downloadUrl: cheatSheet.pdfUrl,
      isPublished: true,
      followGateEnabled: true,
      createdAt: Date.now(),
    } as any);

    // Update cheat sheet with product link
    await ctx.db.patch(args.cheatSheetId, {
      digitalProductId: productId,
      status: "published",
      updatedAt: Date.now(),
    });

    return productId;
  },
});

export const createCheatSheetForPack = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    moduleTitle: v.string(),
    moduleId: v.optional(v.id("courseModules")),
    outline: outlineValidator,
    userId: v.string(),
    pdfStorageId: v.id("_storage"),
    pdfUrl: v.string(),
    aiModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("cheatSheets", {
      userId: args.userId,
      courseId: args.courseId,
      courseTitle: args.courseTitle,
      selectedChapterIds: [], // Pack sheets don't use chapter selection
      moduleTitle: args.moduleTitle,
      moduleId: args.moduleId,
      packId: args.packId,
      outline: args.outline,
      aiModel: args.aiModel,
      generatedAt: now,
      pdfStorageId: args.pdfStorageId,
      pdfUrl: args.pdfUrl,
      pdfGeneratedAt: now,
      status: "generated",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteCheatSheet = mutation({
  args: { cheatSheetId: v.id("cheatSheets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cheatSheetId);
  },
});
