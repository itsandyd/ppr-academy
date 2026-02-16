import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all samples for a store (creator's samples)
 */
export const getStoreSamples = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const samples = await ctx.db
      .query("audioSamples")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);

    return samples;
  },
});

/**
 * Get published samples for marketplace
 */
export const getPublishedSamples = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    genre: v.optional(v.string()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let samplesQuery = ctx.db
      .query("audioSamples")
      .withIndex("by_published", (q) => q.eq("isPublished", true));

    // Filter by genre if provided
    if (args.genre) {
      samplesQuery = ctx.db
        .query("audioSamples")
        .withIndex("by_genre_published", (q) =>
          q.eq("genre", args.genre as string).eq("isPublished", true)
        );
    }

    // Filter by category if provided
    if (args.category) {
      samplesQuery = ctx.db
        .query("audioSamples")
        .withIndex("by_category_published", (q) =>
          q.eq("category", args.category as any).eq("isPublished", true)
        );
    }

    let samples = await samplesQuery.order("desc").take(limit + offset);
    samples = samples.slice(offset);

    // Apply search filter if provided
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      samples = samples.filter(
        (sample) =>
          sample.title.toLowerCase().includes(query) ||
          sample.description?.toLowerCase().includes(query) ||
          sample.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return samples;
  },
});

/**
 * Get single sample by ID
 */
export const getSample = query({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const sample = await ctx.db.get(args.sampleId);
    return sample;
  },
});

/**
 * Get user's downloaded samples (library)
 */
export const getUserLibrary = query({
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
      .take(1000);

    // Get the actual sample data
    const samples = await Promise.all(
      downloads
        .filter((d) => d.sampleId)
        .map(async (d) => {
          const sample = d.sampleId ? await ctx.db.get(d.sampleId) : null;
          return sample
            ? {
                ...sample,
                downloadInfo: {
                  downloadedAt: d._creationTime,
                  downloadCount: d.downloadCount,
                  licenseType: d.licenseType,
                },
              }
            : null;
        })
    );

    return samples.filter((s) => s !== null);
  },
});

/**
 * Get user's favorited samples
 */
export const getFavoriteSamples = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const favorites = await ctx.db
      .query("sampleFavorites")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1000);

    // Get the actual sample data
    const samples = await Promise.all(
      favorites
        .filter((f) => f.sampleId)
        .map(async (f) => {
          return f.sampleId ? await ctx.db.get(f.sampleId) : null;
        })
    );

    return samples.filter((s) => s !== null);
  },
});

/**
 * Check if user owns a sample
 */
export const checkSampleOwnership = query({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const userId = identity.subject;

    const download = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_user_sample", (q) =>
        q.eq("userId", userId).eq("sampleId", args.sampleId)
      )
      .first();

    return !!download;
  },
});

/**
 * Get sample stats for creator dashboard
 */
export const getSampleStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const samples = await ctx.db
      .query("audioSamples")
      .withIndex("by_user_published", (q) =>
        q.eq("userId", userId).eq("isPublished", true)
      )
      .take(1000);

    const totalDownloads = samples.reduce((sum, s) => sum + s.downloads, 0);
    const totalPlays = samples.reduce((sum, s) => sum + s.plays, 0);
    const totalFavorites = samples.reduce((sum, s) => sum + s.favorites, 0);

    return {
      totalSamples: samples.length,
      totalDownloads,
      totalPlays,
      totalFavorites,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new sample
 */
export const createSample = mutation({
  args: {
    storeId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    duration: v.number(),
    format: v.string(),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    genre: v.string(),
    subGenre: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.union(
      v.literal("drums"),
      v.literal("bass"),
      v.literal("synth"),
      v.literal("vocals"),
      v.literal("fx"),
      v.literal("melody"),
      v.literal("loops"),
      v.literal("one-shots")
    ),
    creditPrice: v.number(),
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
    licenseTerms: v.optional(v.string()),
    waveformData: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const sampleId = await ctx.db.insert("audioSamples", {
      userId,
      storeId: args.storeId,
      title: args.title,
      description: args.description,
      storageId: args.storageId,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      duration: args.duration,
      format: args.format,
      bpm: args.bpm,
      key: args.key,
      genre: args.genre,
      subGenre: args.subGenre,
      tags: args.tags,
      category: args.category,
      creditPrice: args.creditPrice,
      isPublished: false, // Start as draft
      downloads: 0,
      plays: 0,
      favorites: 0,
      licenseType: args.licenseType,
      licenseTerms: args.licenseTerms,
      waveformData: args.waveformData,
    });

    return sampleId;
  },
});

/**
 * Update a sample
 */
export const updateSample = mutation({
  args: {
    sampleId: v.id("audioSamples"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    category: v.optional(
      v.union(
        v.literal("drums"),
        v.literal("bass"),
        v.literal("synth"),
        v.literal("vocals"),
        v.literal("fx"),
        v.literal("melody"),
        v.literal("loops"),
        v.literal("one-shots")
      )
    ),
    creditPrice: v.optional(v.number()),
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

    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    if (sample.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { sampleId, ...updates } = args;
    await ctx.db.patch(args.sampleId, updates);

    return { success: true };
  },
});

/**
 * Toggle sample publish status
 */
export const toggleSamplePublish = mutation({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    if (sample.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.sampleId, {
      isPublished: !sample.isPublished,
    });

    return { success: true, isPublished: !sample.isPublished };
  },
});

/**
 * Delete a sample
 */
export const deleteSample = mutation({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    if (sample.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete the sample
    await ctx.db.delete(args.sampleId);

    // Delete associated storage file
    await ctx.storage.delete(sample.storageId);

    return { success: true };
  },
});

/**
 * Purchase and download a sample
 */
export const purchaseSample = mutation({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Get sample
    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    if (!sample.isPublished) {
      throw new Error("Sample is not available for purchase");
    }

    // Check if already owns
    const existingDownload = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_user_sample", (q) =>
        q.eq("userId", userId).eq("sampleId", args.sampleId)
      )
      .first();

    if (existingDownload) {
      throw new Error("You already own this sample");
    }

    // Get user credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits || userCredits.balance < sample.creditPrice) {
      throw new Error("Insufficient credits");
    }

    // Spend credits
    const newBalance = userCredits.balance - sample.creditPrice;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeSpent: userCredits.lifetimeSpent + sample.creditPrice,
      lastUpdated: Date.now(),
    });

    // Record transaction
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      type: "spend",
      amount: -sample.creditPrice,
      balance: newBalance,
      description: `Purchased sample: ${sample.title}`,
      relatedResourceId: args.sampleId,
      relatedResourceType: "sample",
    });

    // Credit the creator
    const platformFee = Math.floor(sample.creditPrice * 0.1);
    const creatorEarnings = sample.creditPrice - platformFee;

    const creatorCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", sample.userId))
      .first();

    if (creatorCredits) {
      await ctx.db.patch(creatorCredits._id, {
        balance: creatorCredits.balance + creatorEarnings,
        lifetimeEarned: creatorCredits.lifetimeEarned + creatorEarnings,
        lastUpdated: Date.now(),
      });

      await ctx.db.insert("creditTransactions", {
        userId: sample.userId,
        type: "earn",
        amount: creatorEarnings,
        balance: creatorCredits.balance + creatorEarnings,
        description: `Sale: ${sample.title}`,
        relatedResourceId: args.sampleId,
        relatedResourceType: "sample",
      });
    }

    // Create download record
    await ctx.db.insert("sampleDownloads", {
      userId,
      sampleId: args.sampleId,
      creatorId: sample.userId,
      creditAmount: sample.creditPrice,
      transactionId,
      downloadCount: 0,
      licenseType: sample.licenseType,
    });

    // Update sample stats
    await ctx.db.patch(args.sampleId, {
      downloads: sample.downloads + 1,
    });

    return { success: true, fileUrl: sample.fileUrl };
  },
});

/**
 * Increment play count
 */
export const incrementPlayCount = mutation({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    await ctx.db.patch(args.sampleId, {
      plays: sample.plays + 1,
    });

    return { success: true };
  },
});

/**
 * Toggle favorite
 */
export const toggleFavorite = mutation({
  args: {
    sampleId: v.id("audioSamples"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("sampleFavorites")
      .withIndex("by_user_sample", (q) =>
        q.eq("userId", userId).eq("sampleId", args.sampleId)
      )
      .first();

    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.sampleId, {
        favorites: Math.max(0, sample.favorites - 1),
      });
      return { success: true, isFavorited: false };
    } else {
      // Add favorite
      await ctx.db.insert("sampleFavorites", {
        userId,
        sampleId: args.sampleId,
      });
      await ctx.db.patch(args.sampleId, {
        favorites: sample.favorites + 1,
      });
      return { success: true, isFavorited: true };
    }
  },
});

// ============================================================================
// UNIFIED SAMPLES SYSTEM - Pack-Sample Linking
// ============================================================================

/**
 * Get samples that belong to a specific pack
 */
export const getSamplesByPackId = query({
  args: {
    packId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    // Get the pack to verify it exists and get sampleIds
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      return [];
    }

    // If pack has sampleIds array, use that (new system)
    if (pack.sampleIds && pack.sampleIds.length > 0) {
      const samples = await Promise.all(
        pack.sampleIds.map((sampleId) => ctx.db.get(sampleId))
      );
      return samples.filter((s) => s !== null);
    }

    // Fallback: query samples that have this packId in their packIds array
    const allSamples = await ctx.db.query("audioSamples").take(1000);
    return allSamples.filter(
      (sample) => sample.packIds && sample.packIds.includes(args.packId)
    );
  },
});

/**
 * Get all samples for a creator that can be added to packs
 */
export const getCreatorSamplesForPacks = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const samples = await ctx.db
      .query("audioSamples")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);

    // Return with pack membership info
    return samples.map((sample) => ({
      ...sample,
      packCount: sample.packIds?.length || 0,
    }));
  },
});

/**
 * Add a sample to a pack (bidirectional linking)
 */
export const addSampleToPack = mutation({
  args: {
    sampleId: v.id("audioSamples"),
    packId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Verify sample exists and user owns it
    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }
    if (sample.userId !== userId) {
      throw new Error("Unauthorized: You don't own this sample");
    }

    // Verify pack exists and user owns it
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }
    if (pack.userId !== userId) {
      throw new Error("Unauthorized: You don't own this pack");
    }

    // Check if sample is already in pack
    const currentPackIds = sample.packIds || [];
    if (currentPackIds.includes(args.packId)) {
      return { success: true, message: "Sample already in pack" };
    }

    // Update sample's packIds
    await ctx.db.patch(args.sampleId, {
      packIds: [...currentPackIds, args.packId],
    });

    // Update pack's sampleIds
    const currentSampleIds = pack.sampleIds || [];
    if (!currentSampleIds.includes(args.sampleId)) {
      await ctx.db.patch(args.packId, {
        sampleIds: [...currentSampleIds, args.sampleId],
      });
    }

    return { success: true, message: "Sample added to pack" };
  },
});

/**
 * Remove a sample from a pack (bidirectional unlinking)
 */
export const removeSampleFromPack = mutation({
  args: {
    sampleId: v.id("audioSamples"),
    packId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Verify sample exists and user owns it
    const sample = await ctx.db.get(args.sampleId);
    if (!sample) {
      throw new Error("Sample not found");
    }
    if (sample.userId !== userId) {
      throw new Error("Unauthorized: You don't own this sample");
    }

    // Verify pack exists and user owns it
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }
    if (pack.userId !== userId) {
      throw new Error("Unauthorized: You don't own this pack");
    }

    // Remove pack from sample's packIds
    const currentPackIds = sample.packIds || [];
    await ctx.db.patch(args.sampleId, {
      packIds: currentPackIds.filter((id) => id !== args.packId),
    });

    // Remove sample from pack's sampleIds
    const currentSampleIds = pack.sampleIds || [];
    await ctx.db.patch(args.packId, {
      sampleIds: currentSampleIds.filter((id) => id !== args.sampleId),
    });

    return { success: true, message: "Sample removed from pack" };
  },
});

/**
 * Add multiple samples to a pack at once
 */
export const addSamplesToPack = mutation({
  args: {
    sampleIds: v.array(v.id("audioSamples")),
    packId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Verify pack exists and user owns it
    const pack = await ctx.db.get(args.packId);
    if (!pack) {
      throw new Error("Pack not found");
    }
    if (pack.userId !== userId) {
      throw new Error("Unauthorized: You don't own this pack");
    }

    let addedCount = 0;
    const currentSampleIds = pack.sampleIds || [];
    const newSampleIds = [...currentSampleIds];

    for (const sampleId of args.sampleIds) {
      const sample = await ctx.db.get(sampleId);
      if (!sample || sample.userId !== userId) {
        continue; // Skip samples user doesn't own
      }

      // Update sample's packIds if not already included
      const currentPackIds = sample.packIds || [];
      if (!currentPackIds.includes(args.packId)) {
        await ctx.db.patch(sampleId, {
          packIds: [...currentPackIds, args.packId],
        });
      }

      // Add to pack's sampleIds if not already included
      if (!newSampleIds.includes(sampleId)) {
        newSampleIds.push(sampleId);
        addedCount++;
      }
    }

    // Update pack with all new sampleIds
    await ctx.db.patch(args.packId, {
      sampleIds: newSampleIds,
    });

    return { success: true, addedCount, totalSamples: newSampleIds.length };
  },
});

/**
 * Check if user owns a sample (individually OR via pack ownership)
 */
export const checkFullSampleOwnership = query({
  args: {
    sampleId: v.id("audioSamples"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for individual purchase
    const individualPurchase = await ctx.db
      .query("sampleDownloads")
      .withIndex("by_user_sample", (q) =>
        q.eq("userId", args.userId).eq("sampleId", args.sampleId)
      )
      .first();

    if (individualPurchase) {
      return {
        owned: true,
        source: "individual" as const,
        purchaseId: individualPurchase._id,
      };
    }

    // Check if user owns any pack containing this sample
    const sample = await ctx.db.get(args.sampleId);
    if (!sample || !sample.packIds || sample.packIds.length === 0) {
      return { owned: false, source: null };
    }

    // Check purchases for any of the packs this sample belongs to
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(5000);

    for (const purchase of purchases) {
      if (purchase.productId && sample.packIds.includes(purchase.productId)) {
        return {
          owned: true,
          source: "pack" as const,
          packId: purchase.productId,
          purchaseId: purchase._id,
        };
      }
    }

    return { owned: false, source: null };
  },
});

/**
 * Get samples with their pack info for marketplace display
 */
export const getPublishedSamplesWithPackInfo = query({
  args: {
    limit: v.optional(v.number()),
    genre: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let samplesQuery = ctx.db
      .query("audioSamples")
      .withIndex("by_published", (q) => q.eq("isPublished", true));

    if (args.genre) {
      samplesQuery = ctx.db
        .query("audioSamples")
        .withIndex("by_genre_published", (q) =>
          q.eq("genre", args.genre as string).eq("isPublished", true)
        );
    }

    const samples = await samplesQuery.take(limit);

    // Enrich with pack info
    const enrichedSamples = await Promise.all(
      samples.map(async (sample) => {
        let packInfo: Array<{ packId: string; packTitle: string; packPrice: number }> = [];

        if (sample.packIds && sample.packIds.length > 0) {
          const packs = await Promise.all(
            sample.packIds.map((packId) => ctx.db.get(packId))
          );
          packInfo = packs
            .filter((p) => p !== null && p.isPublished)
            .map((p) => ({
              packId: p!._id,
              packTitle: p!.title,
              packPrice: p!.price,
            }));
        }

        return {
          ...sample,
          inPacks: packInfo,
          packCount: packInfo.length,
        };
      })
    );

    return enrichedSamples;
  },
});

