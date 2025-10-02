import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all packs for a store (creator's packs)
 */
export const getStorePacks = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const packs = await ctx.db
      .query("samplePacks")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return packs;
  },
});

/**
 * Get published packs for marketplace
 */
export const getPublishedPacks = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let packs = await ctx.db
      .query("samplePacks")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .take(limit + offset);

    packs = packs.slice(offset);

    // Apply search filter if provided
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      packs = packs.filter(
        (pack) =>
          pack.name.toLowerCase().includes(query) ||
          pack.description?.toLowerCase().includes(query) ||
          pack.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return packs;
  },
});

/**
 * Get single pack by ID with samples
 */
export const getPack = query({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      return null;
    }

    // Get all samples in the pack
    const samples = await Promise.all(
      pack.sampleIds.map((sampleId) => ctx.db.get(sampleId))
    );

    return {
      ...pack,
      samples: samples.filter((s) => s !== null),
    };
  },
});

/**
 * Get user's downloaded packs (library)
 */
export const getUserPackLibrary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const downloads = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get the actual pack data
    const packs = await Promise.all(
      downloads
        .filter((d) => d.packId)
        .map(async (d) => {
          const pack = d.packId ? await ctx.db.get(d.packId) : null;
          return pack
            ? {
                ...pack,
                downloadInfo: {
                  downloadedAt: d._creationTime,
                  downloadCount: d.downloadCount,
                  licenseType: d.licenseType,
                },
              }
            : null;
        })
    );

    return packs.filter((p) => p !== null);
  },
});

/**
 * Check if user owns a pack
 */
export const checkPackOwnership = query({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const userId = identity.subject;

    const download = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", args.packId)
      )
      .first();

    return !!download;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new sample pack
 */
export const createPack = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.string(),
    sampleIds: v.array(v.id("audioSamples")),
    creditPrice: v.number(),
    coverImageUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
    licenseTerms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Verify all samples belong to this user
    const samples = await Promise.all(
      args.sampleIds.map((id) => ctx.db.get(id))
    );

    const invalidSamples = samples.filter(
      (s) => !s || s.userId !== userId
    );
    if (invalidSamples.length > 0) {
      throw new Error("Some samples do not belong to you");
    }

    // Calculate pack metadata
    const totalSize = samples.reduce((sum, s) => sum + (s?.fileSize || 0), 0);
    const totalDuration = samples.reduce(
      (sum, s) => sum + (s?.duration || 0),
      0
    );

    // Extract unique genres, categories, tags
    const genres = Array.from(
      new Set(samples.map((s) => s?.genre).filter(Boolean))
    ) as string[];
    const categories = Array.from(
      new Set(samples.map((s) => s?.category).filter(Boolean))
    ) as string[];
    const tags = Array.from(
      new Set(samples.flatMap((s) => s?.tags || []))
    );

    // Calculate BPM range
    const bpms = samples
      .map((s) => s?.bpm)
      .filter((bpm) => bpm !== undefined) as number[];
    const bpmRange =
      bpms.length > 0
        ? {
            min: Math.min(...bpms),
            max: Math.max(...bpms),
          }
        : undefined;

    const packId = await ctx.db.insert("samplePacks", {
      userId,
      storeId: args.storeId,
      name: args.name,
      description: args.description,
      sampleIds: args.sampleIds,
      totalSamples: args.sampleIds.length,
      totalSize,
      totalDuration,
      genres,
      categories,
      tags,
      bpmRange,
      creditPrice: args.creditPrice,
      isPublished: false,
      downloads: 0,
      favorites: 0,
      licenseType: args.licenseType,
      licenseTerms: args.licenseTerms,
      coverImageUrl: args.coverImageUrl,
      coverImageStorageId: args.coverImageStorageId,
    });

    return packId;
  },
});

/**
 * Update a pack
 */
export const updatePack = mutation({
  args: {
    packId: v.id("samplePacks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sampleIds: v.optional(v.array(v.id("audioSamples"))),
    creditPrice: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    licenseType: v.optional(
      v.union(
        v.literal("royalty-free"),
        v.literal("exclusive"),
        v.literal("commercial")
      )
    ),
    licenseTerms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    if (pack.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // If sampleIds are being updated, recalculate metadata
    let updates: any = {
      name: args.name,
      description: args.description,
      creditPrice: args.creditPrice,
      coverImageUrl: args.coverImageUrl,
      coverImageStorageId: args.coverImageStorageId,
      licenseType: args.licenseType,
      licenseTerms: args.licenseTerms,
    };

    // Remove undefined values
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    if (args.sampleIds) {
      // Verify all samples belong to this user
      const samples = await Promise.all(
        args.sampleIds.map((id) => ctx.db.get(id))
      );

      const invalidSamples = samples.filter(
        (s) => !s || s.userId !== userId
      );
      if (invalidSamples.length > 0) {
        throw new Error("Some samples do not belong to you");
      }

      // Recalculate pack metadata
      const totalSize = samples.reduce(
        (sum, s) => sum + (s?.fileSize || 0),
        0
      );
      const totalDuration = samples.reduce(
        (sum, s) => sum + (s?.duration || 0),
        0
      );

      const genres = Array.from(
        new Set(samples.map((s) => s?.genre).filter(Boolean))
      ) as string[];
      const categories = Array.from(
        new Set(samples.map((s) => s?.category).filter(Boolean))
      ) as string[];
      const tags = Array.from(
        new Set(samples.flatMap((s) => s?.tags || []))
      );

      const bpms = samples
        .map((s) => s?.bpm)
        .filter((bpm) => bpm !== undefined) as number[];
      const bpmRange =
        bpms.length > 0
          ? {
              min: Math.min(...bpms),
              max: Math.max(...bpms),
            }
          : undefined;

      updates = {
        ...updates,
        sampleIds: args.sampleIds,
        totalSamples: args.sampleIds.length,
        totalSize,
        totalDuration,
        genres,
        categories,
        tags,
        bpmRange,
      };
    }

    await ctx.db.patch(args.packId, updates);

    return { success: true };
  },
});

/**
 * Toggle pack publish status
 */
export const togglePackPublish = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    if (pack.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.packId, {
      isPublished: !pack.isPublished,
    });

    return { success: true, isPublished: !pack.isPublished };
  },
});

/**
 * Delete a pack
 */
export const deletePack = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    if (pack.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete the pack
    await ctx.db.delete(args.packId);

    // Delete cover image if exists
    if (pack.coverImageStorageId) {
      await ctx.storage.delete(pack.coverImageStorageId);
    }

    return { success: true };
  },
});

/**
 * Purchase and download a pack
 */
export const purchasePack = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get pack
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    if (!pack.isPublished) {
      throw new Error("Pack is not available for purchase");
    }

    // Check if already owns
    const existingDownload = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", args.packId)
      )
      .first();

    if (existingDownload) {
      throw new Error("You already own this pack");
    }

    // Get user credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits || userCredits.balance < pack.creditPrice) {
      throw new Error("Insufficient credits");
    }

    // Spend credits
    const newBalance = userCredits.balance - pack.creditPrice;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeSpent: userCredits.lifetimeSpent + pack.creditPrice,
      lastUpdated: Date.now(),
    });

    // Record transaction
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      type: "spend",
      amount: -pack.creditPrice,
      balance: newBalance,
      description: `Purchased pack: ${pack.name}`,
      relatedResourceId: args.packId,
      relatedResourceType: "pack",
    });

    // Credit the creator
    const platformFee = Math.floor(pack.creditPrice * 0.1);
    const creatorEarnings = pack.creditPrice - platformFee;

    const creatorCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", pack.userId))
      .first();

    if (creatorCredits) {
      await ctx.db.patch(creatorCredits._id, {
        balance: creatorCredits.balance + creatorEarnings,
        lifetimeEarned: creatorCredits.lifetimeEarned + creatorEarnings,
        lastUpdated: Date.now(),
      });

      await ctx.db.insert("creditTransactions", {
        userId: pack.userId,
        type: "earn",
        amount: creatorEarnings,
        balance: creatorCredits.balance + creatorEarnings,
        description: `Sale: ${pack.name}`,
        relatedResourceId: args.packId,
        relatedResourceType: "pack",
      });
    }

    // Create download record
    await ctx.db.insert("sampleDownloads", {
      userId,
      packId: args.packId,
      creatorId: pack.userId,
      creditAmount: pack.creditPrice,
      transactionId,
      downloadCount: 0,
      licenseType: pack.licenseType,
    });

    // Update pack stats
    await ctx.db.patch(args.packId, {
      downloads: pack.downloads + 1,
    });

    // Get all sample URLs for download
    const samples = await Promise.all(
      pack.sampleIds.map((sampleId) => ctx.db.get(sampleId))
    );

    const sampleUrls = samples
      .filter((s) => s !== null)
      .map((s) => ({
        title: s!.title,
        fileUrl: s!.fileUrl,
        fileName: s!.fileName,
      }));

    return { success: true, samples: sampleUrls };
  },
});

/**
 * Toggle pack favorite
 */
export const togglePackFavorite = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("sampleFavorites")
      .withIndex("by_user_pack", (q) =>
        q.eq("userId", userId).eq("packId", args.packId)
      )
      .first();

    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.packId, {
        favorites: Math.max(0, pack.favorites - 1),
      });
      return { success: true, isFavorited: false };
    } else {
      // Add favorite
      await ctx.db.insert("sampleFavorites", {
        userId,
        packId: args.packId,
      });
      await ctx.db.patch(args.packId, {
        favorites: pack.favorites + 1,
      });
      return { success: true, isFavorited: true };
    }
  },
});

