import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// MUTATIONS
// =============================================================================

export const createPack = mutation({
  args: {
    courseId: v.id("courses"),
    courseTitle: v.string(),
    userId: v.string(),
    totalModules: v.number(),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("cheatSheetPacks", {
      courseId: args.courseId,
      courseTitle: args.courseTitle,
      userId: args.userId,
      cheatSheetIds: [],
      status: "generating",
      totalModules: args.totalModules,
      completedModules: 0,
      failedModules: [],
      modelId: args.modelId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addSheetToPack = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
    cheatSheetId: v.id("cheatSheets"),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack not found");

    await ctx.db.patch(args.packId, {
      cheatSheetIds: [...pack.cheatSheetIds, args.cheatSheetId],
      completedModules: pack.completedModules + 1,
      updatedAt: Date.now(),
    });
  },
});

export const markPackFailed = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
    moduleName: v.string(),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack not found");

    await ctx.db.patch(args.packId, {
      failedModules: [...pack.failedModules, args.moduleName],
      updatedAt: Date.now(),
    });
  },
});

export const completePackGeneration = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack not found");

    const status =
      pack.failedModules.length > 0
        ? pack.cheatSheetIds.length > 0
          ? "partial"
          : "generating" // All failed — keep as generating so it can be retried
        : "complete";

    await ctx.db.patch(args.packId, {
      status: status as "generating" | "partial" | "complete",
      updatedAt: Date.now(),
    });
  },
});

export const linkPackToProduct = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
    digitalProductId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.packId, {
      digitalProductId: args.digitalProductId,
      updatedAt: Date.now(),
    });
  },
});

export const publishPackAsProduct = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
    storeId: v.string(),
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.number(), // 0 for free
    followGateEnabled: v.optional(v.boolean()),
    thumbnailUrl: v.optional(v.string()),
    includeSheetIds: v.optional(v.array(v.id("cheatSheets"))),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack not found");
    if (pack.cheatSheetIds.length === 0) throw new Error("Pack has no sheets");

    // Determine which sheets to include
    const sheetIds =
      args.includeSheetIds && args.includeSheetIds.length > 0
        ? args.includeSheetIds
        : pack.cheatSheetIds;

    // Build packFiles metadata array
    const packFilesArr: Array<{
      name: string;
      storageId: string;
      url: string;
    }> = [];
    let firstPdfUrl: string | undefined;

    for (const sheetId of sheetIds) {
      const sheet = await ctx.db.get(sheetId);
      if (!sheet || !sheet.pdfStorageId || !sheet.pdfUrl) continue;

      if (!firstPdfUrl) firstPdfUrl = sheet.pdfUrl;

      packFilesArr.push({
        name: `${sheet.moduleTitle || "Cheat Sheet"}.pdf`,
        storageId: sheet.pdfStorageId as any,
        url: sheet.pdfUrl,
      });
    }

    if (packFilesArr.length === 0) {
      throw new Error("No sheets with PDFs to publish");
    }

    const productTitle =
      args.title || `${pack.courseTitle} — Cheat Sheet Pack`;
    const productDescription =
      args.description ||
      `${packFilesArr.length} module cheat sheets from ${pack.courseTitle}`;

    // Create the digital product
    const productId = await ctx.db.insert("digitalProducts", {
      title: productTitle,
      description: productDescription,
      storeId: args.storeId as any,
      userId: args.userId,
      productType: "digital",
      productCategory: "cheat-sheet",
      price: args.price,
      downloadUrl: firstPdfUrl,
      packFiles: JSON.stringify(packFilesArr),
      imageUrl: args.thumbnailUrl,
      isPublished: true,
      followGateEnabled: args.followGateEnabled ?? false,
      createdAt: Date.now(),
    } as any);

    // Link product back to pack
    await ctx.db.patch(args.packId, {
      digitalProductId: productId,
      updatedAt: Date.now(),
    });

    // Update each included sheet's digitalProductId
    for (const sheetId of sheetIds) {
      const sheet = await ctx.db.get(sheetId);
      if (sheet) {
        await ctx.db.patch(sheetId, {
          digitalProductId: productId,
          status: "published",
          updatedAt: Date.now(),
        });
      }
    }

    return productId;
  },
});

export const deletePack = mutation({
  args: {
    packId: v.id("cheatSheetPacks"),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) throw new Error("Pack not found");

    // Delete all associated cheat sheet records and their PDFs
    for (const sheetId of pack.cheatSheetIds) {
      const sheet = await ctx.db.get(sheetId);
      if (sheet) {
        if (sheet.pdfStorageId) {
          await ctx.storage.delete(sheet.pdfStorageId);
        }
        await ctx.db.delete(sheetId);
      }
    }

    await ctx.db.delete(args.packId);
  },
});

// =============================================================================
// QUERIES
// =============================================================================

export const getPackByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cheatSheetPacks")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();
  },
});

export const getPackWithSheets = query({
  args: { packId: v.id("cheatSheetPacks") },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) return null;

    const sheets = await Promise.all(
      pack.cheatSheetIds.map(async (id) => {
        const sheet = await ctx.db.get(id);
        if (!sheet) return null;

        // Resolve PDF URL from storage if needed
        let pdfUrl = sheet.pdfUrl;
        if (sheet.pdfStorageId && (!pdfUrl || !pdfUrl.startsWith("http"))) {
          pdfUrl = (await ctx.storage.getUrl(sheet.pdfStorageId)) || pdfUrl;
        }

        return { ...sheet, pdfUrl };
      })
    );

    return {
      ...pack,
      sheets: sheets.filter(Boolean),
    };
  },
});

export const getPacksByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cheatSheetPacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
  },
});

export const getPacksForEnrolledCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const pack = await ctx.db
      .query("cheatSheetPacks")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();

    if (!pack || (pack.status !== "complete" && pack.status !== "partial")) {
      return null;
    }

    // Populate sheets with resolved PDF URLs
    const sheets = await Promise.all(
      pack.cheatSheetIds.map(async (id) => {
        const sheet = await ctx.db.get(id);
        if (!sheet) return null;

        let pdfUrl = sheet.pdfUrl;
        if (sheet.pdfStorageId && (!pdfUrl || !pdfUrl.startsWith("http"))) {
          pdfUrl = (await ctx.storage.getUrl(sheet.pdfStorageId)) || pdfUrl;
        }

        return {
          _id: sheet._id,
          moduleTitle: sheet.moduleTitle || "Untitled Module",
          pdfUrl,
          outline: sheet.outline,
        };
      })
    );

    return {
      _id: pack._id,
      courseId: pack.courseId,
      courseTitle: pack.courseTitle,
      status: pack.status,
      totalModules: pack.totalModules,
      completedModules: pack.completedModules,
      sheets: sheets.filter(Boolean),
    };
  },
});
