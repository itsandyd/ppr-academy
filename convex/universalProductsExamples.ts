import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Universal Products - Example Usage & Test Data
 * 
 * This file contains examples of how to use the universal product system
 * and functions to create test data for development.
 * 
 * DO NOT use these functions in production - they are for testing only.
 */

// ============================================================================
// TEST DATA CREATION
// ============================================================================

/**
 * Create Test Sample Pack with Instagram + Spotify Follow Gate
 * 
 * Example: Free sample pack requiring Instagram follow + email
 */
export const createTestSamplePackFree = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    // Create product directly using database insert
    return await ctx.db.insert("digitalProducts", {
      title: "808 Drum Kit Vol. 2 (FREE)",
      description: "Premium 808s, kicks, snares, and hi-hats. Perfect for trap and hip-hop production.",
      storeId: args.storeId,
      userId: args.userId,
      productType: "digital",
      productCategory: "sample-pack",
      price: 0,
      tags: ["808", "trap", "hip-hop", "drums", "free"],
      downloadUrl: "https://example.com/sample-pack.zip",
      imageUrl: "https://example.com/sample-pack-cover.jpg",
      
      // Follow gate configuration
      followGateEnabled: true,
      followGateRequirements: {
        requireEmail: true,
        requireInstagram: true,
        requireTiktok: false,
        requireYoutube: false,
        requireSpotify: true,
        minFollowsRequired: 2,
      },
      followGateSocialLinks: {
        instagram: "@producer",
        spotify: "https://open.spotify.com/artist/...",
      },
      followGateMessage: "Thanks for supporting! Follow me on 2 platforms to unlock this free pack 🎵",
      isPublished: false,
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

/**
 * Create Test Ableton Rack (PAID)
 * 
 * Example: Paid Ableton rack for direct purchase
 */
export const createTestAbletonRackPaid = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      title: "Reverb Master Chain - Ableton Rack",
      description: "Professional reverb chain with 8 macro controls. Includes parallel processing and EQ shaping.",
      storeId: args.storeId,
      userId: args.userId,
      productType: "abletonRack",
      productCategory: "ableton-rack",
      price: 15,
      tags: ["ableton", "reverb", "mixing", "audio-effect"],
      downloadUrl: "https://example.com/reverb-rack.adg",
      imageUrl: "https://example.com/reverb-rack-cover.jpg",
      abletonVersion: "Live 11",
      rackType: "audioEffect",
      isPublished: false,
      followGateEnabled: false,
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

/**
 * Create Test Playlist Curation Product (FREE with Spotify Follow)
 * 
 * Example: Free playlist submissions requiring Spotify follow
 */
export const createTestPlaylistCurationFree = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    playlistId: v.id("curatorPlaylists"),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    
    const productId = await ctx.db.insert("digitalProducts", {
      title: `Submit to ${playlist.name}`,
      description: `Get your track featured on ${playlist.name}! I review all submissions and add the best tracks to my playlist with ${playlist.trackCount} songs.`,
      storeId: args.storeId,
      userId: args.userId,
      productType: "playlistCuration",
      productCategory: "playlist-curation",
      price: 0,
      tags: ["playlist", "lo-fi", "curation", "submission"],
      imageUrl: playlist.coverUrl,
      isPublished: false,
      followGateEnabled: true,
      followGateRequirements: {
        requireEmail: true,
        requireInstagram: false,
        requireTiktok: false,
        requireYoutube: false,
        requireSpotify: true,
        minFollowsRequired: 0,
      },
      followGateSocialLinks: {
        spotify: "https://open.spotify.com/user/...",
      },
      followGateMessage: "Support my playlist by following on Spotify, then submit your track! 🎧",
      playlistCurationConfig: {
        linkedPlaylistId: args.playlistId,
        reviewTurnaroundDays: 5,
        genresAccepted: ["Lo-Fi", "Chillhop", "Jazz Hip-Hop"],
        submissionGuidelines: "Please submit chill, study-friendly beats. Tempos between 70-90 BPM preferred. No harsh sounds or vocals.",
        maxSubmissionsPerMonth: 100,
      },
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
    
    // Link playlist to product
    await ctx.db.patch(args.playlistId, {
      linkedProductId: productId,
      submissionPricing: {
        isFree: true,
        price: 0,
        currency: "usd",
      },
      submissionSLA: 5,
    });
    
    return productId;
  },
});

/**
 * Create Test Playlist Curation Product (PAID)
 * 
 * Example: Paid playlist submissions ($5 per review)
 */
export const createTestPlaylistCurationPaid = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    playlistId: v.id("curatorPlaylists"),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    
    const productId = await ctx.db.insert("digitalProducts", {
      title: `Premium Submission - ${playlist.name}`,
      description: `Fast-track your track review! $5 per submission with guaranteed review within 3 days. ${playlist.trackCount} active songs, updated weekly.`,
      storeId: args.storeId,
      userId: args.userId,
      productType: "playlistCuration",
      productCategory: "playlist-curation",
      price: 5,
      tags: ["playlist", "electronic", "paid-submission", "fast-review"],
      imageUrl: playlist.coverUrl,
      isPublished: false,
      followGateEnabled: false,
      playlistCurationConfig: {
        linkedPlaylistId: args.playlistId,
        reviewTurnaroundDays: 3,
        genresAccepted: ["Electronic", "House", "Techno", "Dance"],
        submissionGuidelines: "High-quality electronic music only. Must be professionally mixed and mastered.",
      },
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
    
    // Link playlist to product
    await ctx.db.patch(args.playlistId, {
      linkedProductId: productId,
      submissionPricing: {
        isFree: false,
        price: 5,
        currency: "usd",
      },
      submissionSLA: 3,
    });
    
    return productId;
  },
});

/**
 * Create Test Preset Pack (FREE with TikTok + YouTube)
 * 
 * Example: Free Serum presets requiring TikTok + YouTube
 */
export const createTestPresetPackFree = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      title: "Serum Future Bass Presets (FREE)",
      description: "50 professional Serum presets for future bass, melodic dubstep, and color bass. Used by 10,000+ producers.",
      storeId: args.storeId,
      userId: args.userId,
      productType: "digital",
      productCategory: "preset-pack",
      price: 0,
      tags: ["serum", "presets", "future-bass", "free"],
      downloadUrl: "https://example.com/serum-presets.zip",
      imageUrl: "https://example.com/serum-cover.jpg",
      isPublished: false,
      followGateEnabled: true,
      followGateRequirements: {
        requireEmail: true,
        requireInstagram: false,
        requireTiktok: true,
        requireYoutube: true,
        requireSpotify: false,
        minFollowsRequired: 0,
      },
      followGateSocialLinks: {
        tiktok: "@producertips",
        youtube: "https://youtube.com/c/ProducerTips",
      },
      followGateMessage: "Get these presets for free! Just follow me on TikTok & YouTube 🎹",
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

/**
 * Create Test Beat Lease (PAID)
 * 
 * Example: Paid beat lease
 */
export const createTestBeatLeasePaid = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      title: "Dark Trap Beat - 'Midnight'",
      description: "Hard-hitting trap beat with 808s, dark melody, and atmospheric pads. 140 BPM, Key: G Minor. Stems included.",
      storeId: args.storeId,
      userId: args.userId,
      productType: "digital",
      productCategory: "beat-lease",
      price: 30,
      tags: ["trap", "beat", "dark", "808"],
      downloadUrl: "https://example.com/midnight-beat.zip",
      imageUrl: "https://example.com/midnight-cover.jpg",
      isPublished: false,
      followGateEnabled: false,
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

/**
 * Seed Demo Beat Leases for PPR Marketplace
 *
 * Creates 5 PPR-branded demo beats with full 4-tier licensing to showcase
 * the beat lease system on /marketplace/beats.
 */
export const seedDemoBeatLeases = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    beatsCreated: v.array(v.id("digitalProducts")),
  }),
  handler: async (ctx, args) => {
    const beatsCreated: Id<"digitalProducts">[] = [];

    const makeTiers = (basicPrice: number, premiumPrice: number, exclusivePrice: number, unlimitedPrice: number) => [
      {
        type: "basic" as const,
        enabled: true,
        price: basicPrice,
        name: "Basic Lease",
        distributionLimit: 5000,
        streamingLimit: 500000,
        commercialUse: true,
        musicVideoUse: true,
        radioBroadcasting: false,
        stemsIncluded: false,
        creditRequired: true,
      },
      {
        type: "premium" as const,
        enabled: true,
        price: premiumPrice,
        name: "Premium Lease",
        distributionLimit: 50000,
        streamingLimit: 5000000,
        commercialUse: true,
        musicVideoUse: true,
        radioBroadcasting: true,
        stemsIncluded: true,
        creditRequired: true,
      },
      {
        type: "unlimited" as const,
        enabled: true,
        price: unlimitedPrice,
        name: "Unlimited Lease",
        commercialUse: true,
        musicVideoUse: true,
        radioBroadcasting: true,
        stemsIncluded: true,
        creditRequired: false,
      },
      {
        type: "exclusive" as const,
        enabled: true,
        price: exclusivePrice,
        name: "Exclusive Rights",
        commercialUse: true,
        musicVideoUse: true,
        radioBroadcasting: true,
        stemsIncluded: true,
        creditRequired: false,
      },
    ];

    const demoBeats = [
      {
        title: "Midnight Drive — Dark Trap Beat",
        slug: "midnight-drive-dark-trap-beat",
        description: "Hard-hitting dark trap instrumental with heavy 808s, eerie melodies, and cinematic pads. Perfect for aggressive rap verses or moody hooks. Inspired by Metro Boomin and Southside.",
        bpm: 140,
        key: "G minor",
        genre: ["Trap", "Hip Hop"],
        tags: ["trap", "dark", "808", "hard", "metro-boomin", "type-beat"],
        beatLeaseConfig: {
          bpm: 140,
          key: "G minor",
          genre: "trap",
          tiers: makeTiers(2500, 7500, 50000, 20000),
        },
        price: 2500,
      },
      {
        title: "Crystal Rain — Lo-Fi Type Beat",
        slug: "crystal-rain-lo-fi-type-beat",
        description: "Chill lo-fi hip-hop beat with warm vinyl crackle, jazzy piano chords, and laid-back drums. Ideal for study sessions, relaxing vibes, or introspective rap.",
        bpm: 85,
        key: "D minor",
        genre: ["Lo-Fi", "Hip Hop"],
        tags: ["lo-fi", "chill", "jazz", "study", "relaxing", "piano"],
        beatLeaseConfig: {
          bpm: 85,
          key: "D minor",
          genre: "lo-fi",
          tiers: makeTiers(2000, 6000, 40000, 15000),
        },
        price: 2000,
      },
      {
        title: "Velvet Nights — R&B Soul Beat",
        slug: "velvet-nights-rnb-soul-beat",
        description: "Smooth R&B instrumental with silky guitar licks, warm bass, and neo-soul chord progressions. Built for vocal performances — hooks and verses sit perfectly over this groove.",
        bpm: 92,
        key: "Bb major",
        genre: ["R&B", "Pop"],
        tags: ["rnb", "soul", "smooth", "guitar", "neo-soul", "vocal"],
        beatLeaseConfig: {
          bpm: 92,
          key: "Bb major",
          genre: "r&b",
          tiers: makeTiers(3000, 8000, 60000, 25000),
        },
        price: 3000,
      },
      {
        title: "Lagos to London — Afrobeat Banger",
        slug: "lagos-to-london-afrobeat-banger",
        description: "High-energy Afrobeat instrumental with infectious log drums, tropical percussion, and catchy guitar patterns. Burna Boy / Wizkid type vibes perfect for the dance floor.",
        bpm: 108,
        key: "C minor",
        genre: ["Afrobeat", "Dancehall"],
        tags: ["afrobeat", "afropop", "dancehall", "african", "burna-boy", "tropical"],
        beatLeaseConfig: {
          bpm: 108,
          key: "C minor",
          genre: "afrobeat",
          tiers: makeTiers(2500, 7500, 55000, 20000),
        },
        price: 2500,
      },
      {
        title: "Shattered Glass — Drill Instrumental",
        slug: "shattered-glass-drill-instrumental",
        description: "Aggressive UK drill beat with sliding 808s, dark string arpeggios, and hard-hitting hi-hat patterns. Ready for bars — raw, unfiltered energy for the streets.",
        bpm: 145,
        key: "F# minor",
        genre: ["Drill", "Trap"],
        tags: ["drill", "uk-drill", "aggressive", "808", "dark", "hard"],
        beatLeaseConfig: {
          bpm: 145,
          key: "F# minor",
          genre: "drill",
          tiers: makeTiers(2500, 7500, 50000, 20000),
        },
        price: 2500,
      },
    ];

    for (const beat of demoBeats) {
      const id = await ctx.db.insert("digitalProducts", {
        title: beat.title,
        slug: beat.slug,
        description: beat.description,
        storeId: args.storeId,
        userId: args.userId,
        productType: "digital",
        productCategory: "beat-lease",
        price: beat.price,
        bpm: beat.bpm,
        musicalKey: beat.key,
        genre: beat.genre,
        tags: beat.tags,
        beatLeaseConfig: beat.beatLeaseConfig,
        isPublished: true,
        followGateEnabled: false,
        orderBumpEnabled: false,
        affiliateEnabled: false,
      });
      beatsCreated.push(id);
    }

    return { success: true, beatsCreated };
  },
});

/**
 * Clean Up Demo Beat Leases
 */
export const cleanUpDemoBeatLeases = internalMutation({
  args: { storeId: v.string() },
  returns: v.object({ success: v.boolean(), deleted: v.number() }),
  handler: async (ctx, args) => {
    const demoSlugs = [
      "midnight-drive-dark-trap-beat",
      "crystal-rain-lo-fi-type-beat",
      "velvet-nights-rnb-soul-beat",
      "lagos-to-london-afrobeat-banger",
      "shattered-glass-drill-instrumental",
    ];
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);
    let deleted = 0;
    for (const p of products) {
      if (demoSlugs.includes((p as any).slug)) {
        await ctx.db.delete(p._id);
        deleted++;
      }
    }
    return { success: true, deleted };
  },
});

// ============================================================================
// BULK TEST DATA CREATION
// ============================================================================

/**
 * Create Complete Test Suite
 * 
 * Creates a variety of test products to demonstrate all features.
 */
export const createCompleteTestSuite = internalMutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    playlistId: v.optional(v.id("curatorPlaylists")),
  },
  returns: v.object({
    success: v.boolean(),
    productsCreated: v.array(v.id("digitalProducts")),
  }),
  handler: async (ctx, args) => {
    const productsCreated: Id<"digitalProducts">[] = [];
    
    try {
      // 1. Free sample pack with Instagram + Spotify
      const samplePack = await ctx.runMutation(internal.universalProductsExamples.createTestSamplePackFree, {
        storeId: args.storeId,
        userId: args.userId,
      });
      productsCreated.push(samplePack);
      
      // 2. Paid Ableton rack
      const abletonRack = await ctx.runMutation(internal.universalProductsExamples.createTestAbletonRackPaid, {
        storeId: args.storeId,
        userId: args.userId,
      });
      productsCreated.push(abletonRack);
      
      // 3. Free preset pack with TikTok + YouTube
      const presetPack = await ctx.runMutation(internal.universalProductsExamples.createTestPresetPackFree, {
        storeId: args.storeId,
        userId: args.userId,
      });
      productsCreated.push(presetPack);
      
      // 4. Paid beat lease
      const beatLease = await ctx.runMutation(internal.universalProductsExamples.createTestBeatLeasePaid, {
        storeId: args.storeId,
        userId: args.userId,
      });
      productsCreated.push(beatLease);
      
      // 5. Playlist products (if playlist provided)
      if (args.playlistId) {
        const playlistFree = await ctx.runMutation(internal.universalProductsExamples.createTestPlaylistCurationFree, {
          storeId: args.storeId,
          userId: args.userId,
          playlistId: args.playlistId,
        });
        productsCreated.push(playlistFree);
        
        const playlistPaid = await ctx.runMutation(internal.universalProductsExamples.createTestPlaylistCurationPaid, {
          storeId: args.storeId,
          userId: args.userId,
          playlistId: args.playlistId,
        });
        productsCreated.push(playlistPaid);
      }
      
      return {
        success: true,
        productsCreated,
      };
    } catch (error) {
      console.error("Error creating test suite:", error);
      return {
        success: false,
        productsCreated,
      };
    }
  },
});

/**
 * Clean Up Test Products
 * 
 * Removes all test products created by this file.
 * Use with caution!
 */
export const cleanUpTestProducts = internalMutation({
  args: {
    storeId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    productsDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const testTitles = [
      "808 Drum Kit Vol. 2 (FREE)",
      "Reverb Master Chain - Ableton Rack",
      "Serum Future Bass Presets (FREE)",
      "Dark Trap Beat - 'Midnight'",
    ];
    
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);
    
    let productsDeleted = 0;
    
    for (const product of products) {
      if (testTitles.some(title => product.title.includes(title)) ||
          product.title.includes("Submit to") ||
          product.title.includes("Premium Submission")) {
        await ctx.db.delete(product._id);
        productsDeleted++;
      }
    }
    
    return {
      success: true,
      productsDeleted,
    };
  },
});

// ============================================================================
// EXAMPLE QUERIES
// ============================================================================

/**
 * Example: Get All Sample Packs in Store
 */
export const exampleGetSamplePacks = internalQuery({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) => 
        q.eq("productCategory", "sample-pack")
      )
      .take(1000);
    
    return products.filter(p => 
      p.storeId === args.storeId && p.isPublished
    );
  },
});

/**
 * Example: Get All Playlist Curation Products
 */
export const exampleGetPlaylistProducts = internalQuery({
  args: { storeId: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) => 
        q.eq("productCategory", "playlist-curation")
      )
      .take(1000);
    
    if (args.storeId) {
      products = products.filter(p => p.storeId === args.storeId);
    }
    
    return products.filter(p => p.isPublished);
  },
});

/**
 * Example: Check Access to Product
 */
export const exampleCheckAccess = internalQuery({
  args: {
    productId: v.id("digitalProducts"),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Simple example - just check if product exists and is published
    const product = await ctx.db.get(args.productId);
    
    if (!product) {
      return {
        canAccess: false,
        reason: "Product not found",
        requiresFollowGate: false,
        requiresPurchase: false,
      };
    }
    
    if (!product.isPublished) {
      return {
        canAccess: false,
        reason: "Product not published",
        requiresFollowGate: false,
        requiresPurchase: false,
      };
    }
    
    return {
      canAccess: true,
      reason: "Example check - use api.universalProducts.canAccessProduct for real checking",
      requiresFollowGate: product.followGateEnabled ?? false,
      requiresPurchase: !(product.followGateEnabled ?? false),
    };
  },
});

