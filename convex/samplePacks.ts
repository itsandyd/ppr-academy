import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all published sample packs for marketplace
 */
export const getAllPublishedSamplePacks = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("samplePacks"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    genres: v.array(v.string()),
    storeId: v.string(),
    published: v.boolean(),
    sampleCount: v.number(),
    downloadCount: v.number(),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const samplePacks = await ctx.db
      .query("samplePacks")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);

    const packsWithDetails = await Promise.all(
      samplePacks.map(async (pack) => {
        const downloads = await ctx.db
          .query("sampleDownloads")
          .filter((q) => q.eq(q.field("packId"), pack._id))
          .take(500);

        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").take(500);
        const store = stores.find(s => s._id === pack.storeId);

        if (store) {
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("clerkId"), store.userId))
            .first();
          if (user) {
            creatorName = user.name || store.name || "Creator";
            creatorAvatar = user.imageUrl;
          } else {
            creatorName = store.name || "Creator";
          }
        }

        return {
          _id: pack._id,
          _creationTime: pack._creationTime,
          title: pack.name,
          description: pack.description,
          price: pack.creditPrice,
          imageUrl: pack.coverImageUrl,
          coverImage: pack.coverImageUrl,
          genres: pack.genres,
          storeId: pack.storeId,
          published: pack.isPublished,
          sampleCount: pack.totalSamples,
          downloadCount: downloads.length,
          creatorName,
          creatorAvatar,
        };
      })
    );

    return packsWithDetails;
  },
});

/**
 * Get sample packs by store
 */
export const getPacksByStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const packs = await ctx.db
      .query("samplePacks")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    return packs;
  },
});

/**
 * Get single pack with samples
 */
export const getPackWithSamples = query({
  args: { packId: v.id("samplePacks") },
  returns: v.union(v.object({
    pack: v.any(),
    samples: v.array(v.any()),
  }), v.null()),
  handler: async (ctx, args) => {
    const pack = await ctx.db.get(args.packId);
    if (!pack) return null;

    const samples = await Promise.all(
      pack.sampleIds.map(async (sampleId) => {
        return await ctx.db.get(sampleId);
      })
    );

    return {
      pack,
      samples: samples.filter(s => s !== null),
    };
  },
});

/**
 * Check if user owns a pack
 */
export const checkPackOwnership = query({
  args: { packId: v.id("samplePacks") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
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
export const createSamplePack = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.string(),
    coverImageUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    genres: v.array(v.string()),
    categories: v.array(v.string()),
    tags: v.array(v.string()),
    creditPrice: v.number(),
  },
  returns: v.id("samplePacks"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const packId = await ctx.db.insert("samplePacks", {
      userId,
      storeId: args.storeId,
      name: args.name,
      description: args.description,
      coverImageUrl: args.coverImageUrl,
      coverImageStorageId: args.coverImageStorageId,
      sampleIds: [],
      totalSamples: 0,
      totalSize: 0,
      totalDuration: 0,
      genres: args.genres,
      categories: args.categories,
      tags: args.tags,
      creditPrice: args.creditPrice,
      isPublished: false,
      downloads: 0,
      revenue: 0,
      favorites: 0,
      licenseType: "royalty-free", // Default license type
    });

    return packId;
  },
});

/**
 * Update sample pack
 */
export const updateSamplePack = mutation({
  args: {
    packId: v.id("samplePacks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    creditPrice: v.optional(v.number()),
  },
  returns: v.object({ success: v.boolean() }),
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

    const { packId, ...updates } = args;
    await ctx.db.patch(packId, updates);

    return { success: true };
  },
});

/**
 * Add samples to pack
 */
export const addSamplesToPack = mutation({
  args: {
    packId: v.id("samplePacks"),
    sampleIds: v.array(v.id("audioSamples")),
  },
  returns: v.object({ success: v.boolean(), totalSamples: v.number() }),
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

    // Get sample details for aggregation
    const samples = await Promise.all(
      args.sampleIds.map(async (sampleId) => {
        const sample = await ctx.db.get(sampleId);
        if (!sample || sample.userId !== userId) {
          throw new Error("Invalid sample");
        }
        return sample;
      })
    );

    // Combine with existing samples (avoid duplicates)
    const existingIds = new Set(pack.sampleIds);
    const newSampleIds = args.sampleIds.filter(id => !existingIds.has(id));
    const allSampleIds = [...pack.sampleIds, ...newSampleIds];

    // Calculate totals
    const allSamples = await Promise.all(
      allSampleIds.map(id => ctx.db.get(id))
    );
    const validSamples = allSamples.filter(s => s !== null);

    const totalSize = validSamples.reduce((sum, s) => sum + (s?.fileSize || 0), 0);
    const totalDuration = validSamples.reduce((sum, s) => sum + (s?.duration || 0), 0);
    
    // Aggregate metadata
    const genres = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();
    let minBpm: number | undefined;
    let maxBpm: number | undefined;

    validSamples.forEach(s => {
      if (s?.genre) genres.add(s.genre);
      if (s?.category) categories.add(s.category);
      s?.tags?.forEach(tag => tags.add(tag));
      if (s?.bpm) {
        if (minBpm === undefined || s.bpm < minBpm) minBpm = s.bpm;
        if (maxBpm === undefined || s.bpm > maxBpm) maxBpm = s.bpm;
      }
    });

    await ctx.db.patch(args.packId, {
      sampleIds: allSampleIds,
      totalSamples: allSampleIds.length,
      totalSize,
      totalDuration,
      genres: Array.from(genres),
      categories: Array.from(categories),
      tags: Array.from(tags),
      bpmRange: minBpm && maxBpm ? { min: minBpm, max: maxBpm } : undefined,
    });

    return { success: true, totalSamples: allSampleIds.length };
  },
});

/**
 * Remove sample from pack
 */
export const removeSampleFromPack = mutation({
  args: {
    packId: v.id("samplePacks"),
    sampleId: v.id("audioSamples"),
  },
  returns: v.object({ success: v.boolean() }),
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

    const newSampleIds = pack.sampleIds.filter(id => id !== args.sampleId);

    // Recalculate totals
    const samples = await Promise.all(
      newSampleIds.map(id => ctx.db.get(id))
    );
    const validSamples = samples.filter(s => s !== null);

    const totalSize = validSamples.reduce((sum, s) => sum + (s?.fileSize || 0), 0);
    const totalDuration = validSamples.reduce((sum, s) => sum + (s?.duration || 0), 0);

    await ctx.db.patch(args.packId, {
      sampleIds: newSampleIds,
      totalSamples: newSampleIds.length,
      totalSize,
      totalDuration,
    });

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
  returns: v.object({ success: v.boolean(), isPublished: v.boolean() }),
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

    const newStatus = !pack.isPublished;
    await ctx.db.patch(args.packId, {
      isPublished: newStatus,
    });

    return { success: true, isPublished: newStatus };
  },
});

/**
 * Delete sample pack
 */
export const deleteSamplePack = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  returns: v.object({ success: v.boolean() }),
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

    // Delete cover image from storage if it exists
    if (pack.coverImageStorageId) {
      await ctx.storage.delete(pack.coverImageStorageId);
    }

    await ctx.db.delete(args.packId);

    return { success: true };
  },
});

/**
 * Purchase pack from digitalProducts table (new system)
 */
export const purchaseDigitalPack = mutation({
  args: {
    packId: v.id("digitalProducts"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    downloadUrl: v.optional(v.string()),
    alreadyOwned: v.optional(v.boolean()),
  }),
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

    if (!pack.isPublished) {
      throw new Error("Pack is not available for purchase");
    }

    // Check if already owns
    const existingPurchase = await ctx.db
      .query("purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("productId"), args.packId)
        )
      )
      .first();

    if (existingPurchase) {
      // User already owns it - return success so they can download
      return {
        success: true,
        message: `You already own ${pack.title}! Download it from your library.`,
        alreadyOwned: true,
      };
    }

    // For free packs (follow gate), just create purchase record
    if (pack.price === 0) {
      await ctx.db.insert("purchases", {
        userId,
        productId: args.packId,
        amount: 0,
        currency: "credits",
        status: "completed",
        storeId: pack.storeId,
        adminUserId: pack.userId,
        productType: "digitalProduct",
        accessGranted: true,
        downloadCount: 0,
      });

      return {
        success: true,
        message: `Successfully downloaded ${pack.title}!`,
      };
    }

    // For paid packs, handle credits
    const userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!userCredits || userCredits.balance < pack.price) {
      throw new Error(`Insufficient credits. You need ${pack.price} credits.`);
    }

    // Spend credits
    const newBalance = userCredits.balance - pack.price;
    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      lifetimeSpent: userCredits.lifetimeSpent + pack.price,
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      userId,
      type: "spend",
      amount: -pack.price,
      balance: newBalance,
      description: `Purchased pack: ${pack.title}`,
      relatedResourceId: args.packId,
      relatedResourceType: "pack",
    });

    // Create purchase record
    await ctx.db.insert("purchases", {
      userId,
      productId: args.packId,
      amount: pack.price,
      currency: "credits",
      status: "completed",
      storeId: pack.storeId,
      adminUserId: pack.userId,
      productType: "digitalProduct",
      accessGranted: true,
      downloadCount: 0,
    });

    return {
      success: true,
      message: `Successfully purchased ${pack.title}!`,
    };
  },
});

/**
 * Purchase entire sample pack (legacy - old samplePacks table)
 */
export const purchasePack = mutation({
  args: {
    packId: v.id("samplePacks"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    downloadUrl: v.optional(v.string()),
  }),
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
      throw new Error(`Insufficient credits. You need ${pack.creditPrice} credits.`);
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

    // Credit the creator (90% payout)
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
        description: `Pack sale: ${pack.name}`,
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
      licenseType: "royalty-free", // Default license
    });

    // Update pack stats
    await ctx.db.patch(args.packId, {
      downloads: pack.downloads + 1,
      revenue: pack.revenue + creatorEarnings,
    });

    return {
      success: true,
      message: `Successfully purchased ${pack.name}! You now have access to all ${pack.totalSamples} samples.`,
    };
  },
});
