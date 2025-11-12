import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Universal Products System
 * 
 * This module provides a unified interface for creating and managing all product types
 * with flexible pricing models (free with download gate OR paid).
 * 
 * Supported Product Types:
 * - Sample Packs
 * - Preset Packs
 * - Ableton Racks
 * - Beat Leases
 * - Project Files
 * - Mixing Templates
 * - Mini Packs
 * - Lead Magnets
 * - Playlist Curation (NEW)
 * - Coaching/Services
 * - Courses/Education
 */

// ============================================================================
// VALIDATORS
// ============================================================================

const followGateConfigValidator = v.object({
  requireEmail: v.boolean(),
  requireInstagram: v.boolean(),
  requireTiktok: v.boolean(),
  requireYoutube: v.boolean(),
  requireSpotify: v.boolean(),
  minFollowsRequired: v.number(), // 0 = all required, >0 = flexible (e.g., 2 out of 4)
  socialLinks: v.object({
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    youtube: v.optional(v.string()),
    spotify: v.optional(v.string()),
  }),
  customMessage: v.optional(v.string()),
});

const playlistConfigValidator = v.object({
  linkedPlaylistId: v.optional(v.id("curatorPlaylists")),
  reviewTurnaroundDays: v.number(),
  genresAccepted: v.array(v.string()),
  submissionGuidelines: v.optional(v.string()),
  maxSubmissionsPerMonth: v.optional(v.number()),
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create Universal Product
 * 
 * One function to create ANY product type with flexible pricing.
 * 
 * @example
 * // Create free sample pack with Instagram + Spotify follow gate
 * createUniversalProduct({
 *   title: "808 Drum Kit Vol. 2",
 *   productCategory: "sample-pack",
 *   pricingModel: "free_with_gate",
 *   price: 0,
 *   followGateConfig: {
 *     requireEmail: true,
 *     requireInstagram: true,
 *     requireSpotify: true,
 *     minFollowsRequired: 2,
 *     socialLinks: { instagram: "@producer", spotify: "..." }
 *   }
 * })
 * 
 * @example
 * // Create paid playlist curation service
 * createUniversalProduct({
 *   title: "Lo-Fi Beats Playlist Submission",
 *   productCategory: "playlist-curation",
 *   pricingModel: "paid",
 *   price: 5,
 *   playlistConfig: {
 *     linkedPlaylistId: playlistId,
 *     reviewTurnaroundDays: 5,
 *     genresAccepted: ["Lo-Fi", "Chillhop"]
 *   }
 * })
 */
export const createUniversalProduct = mutation({
  args: {
    // Core fields
    title: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    
    // Product Type Classification
    productType: v.union(
      v.literal("digital"),
      v.literal("playlistCuration"),
      v.literal("abletonRack"),
      v.literal("abletonPreset"),
      v.literal("coaching"),
      v.literal("urlMedia"),
    ),
    productCategory: v.union(
      // Music Production
      v.literal("sample-pack"),
      v.literal("preset-pack"),
      v.literal("midi-pack"),
      v.literal("ableton-rack"),
      v.literal("beat-lease"),
      v.literal("project-files"),
      v.literal("mixing-template"),
      // Services
      v.literal("coaching"),
      v.literal("mixing-service"),
      v.literal("mastering-service"),
      // Curation
      v.literal("playlist-curation"),
      // Education
      v.literal("course"),
      v.literal("workshop"),
      v.literal("masterclass"),
      // Digital Content
      v.literal("pdf-guide"),
      v.literal("cheat-sheet"),
      v.literal("template"),
      v.literal("blog-post"),
      // Community
      v.literal("community"),
      // Support & Donations
      v.literal("tip-jar"),
      v.literal("donation"),
    ),
    
    // Pricing Configuration
    pricingModel: v.union(
      v.literal("free_with_gate"), // Download gate (email + socials)
      v.literal("paid"),            // Direct purchase
    ),
    price: v.number(), // $0 for free_with_gate, >$0 for paid
    
    // Follow Gate Config (if pricingModel = "free_with_gate")
    followGateConfig: v.optional(followGateConfigValidator),
    
    // Playlist Curation Config (if productCategory = "playlist-curation")
    playlistConfig: v.optional(playlistConfigValidator),
    
    // Media
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()), // For digital products
    
    // Metadata
    tags: v.optional(v.array(v.string())),
    
    // Ableton-specific (if productType = "abletonRack" or "abletonPreset")
    abletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(
      v.literal("audioEffect"),
      v.literal("instrument"),
      v.literal("midiEffect"),
      v.literal("drumRack")
    )),
    
    // Coaching-specific (if productCategory = "coaching")
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    // ========================================================================
    // VALIDATION
    // ========================================================================
    
    // Validate pricing model
    if (args.pricingModel === "free_with_gate" && args.price !== 0) {
      throw new Error("Free products with download gates must have price = $0");
    }
    
    if (args.pricingModel === "paid" && args.price <= 0) {
      throw new Error("Paid products must have price > $0");
    }
    
    // Validate follow gate config
    if (args.pricingModel === "free_with_gate" && !args.followGateConfig) {
      throw new Error("Free products with download gates must have followGateConfig");
    }
    
    // Validate playlist config
    if (args.productCategory === "playlist-curation" && !args.playlistConfig) {
      throw new Error("Playlist curation products must have playlistConfig");
    }
    
    // ========================================================================
    // CREATE PRODUCT
    // ========================================================================
    
    const productData: any = {
      title: args.title,
      description: args.description,
      storeId: args.storeId,
      userId: args.userId,
      productType: args.productType,
      productCategory: args.productCategory,
      price: args.price,
      imageUrl: args.imageUrl,
      downloadUrl: args.downloadUrl,
      tags: args.tags,
      isPublished: false, // Start as draft
      
      // Follow Gate Setup
      followGateEnabled: args.pricingModel === "free_with_gate",
      followGateRequirements: args.followGateConfig ? {
        requireEmail: args.followGateConfig.requireEmail,
        requireInstagram: args.followGateConfig.requireInstagram,
        requireTiktok: args.followGateConfig.requireTiktok,
        requireYoutube: args.followGateConfig.requireYoutube,
        requireSpotify: args.followGateConfig.requireSpotify,
        minFollowsRequired: args.followGateConfig.minFollowsRequired,
      } : undefined,
      followGateSocialLinks: args.followGateConfig?.socialLinks,
      followGateMessage: args.followGateConfig?.customMessage,
      
      // Playlist Curation Setup
      playlistCurationConfig: args.playlistConfig ? {
        linkedPlaylistId: args.playlistConfig.linkedPlaylistId,
        reviewTurnaroundDays: args.playlistConfig.reviewTurnaroundDays,
        genresAccepted: args.playlistConfig.genresAccepted,
        submissionGuidelines: args.playlistConfig.submissionGuidelines,
        maxSubmissionsPerMonth: args.playlistConfig.maxSubmissionsPerMonth,
      } : undefined,
      
      // Type-specific fields
      abletonVersion: args.abletonVersion,
      rackType: args.rackType,
      duration: args.duration,
      sessionType: args.sessionType,
      
      // Defaults
      orderBumpEnabled: false,
      affiliateEnabled: false,
    };
    
    const productId = await ctx.db.insert("digitalProducts", productData);
    
    // ========================================================================
    // POST-CREATE INTEGRATIONS
    // ========================================================================
    
    // If playlist curation, link product to playlist
    if (args.productCategory === "playlist-curation" && args.playlistConfig?.linkedPlaylistId) {
      const playlist = await ctx.db.get(args.playlistConfig.linkedPlaylistId);
      
      if (playlist) {
        await ctx.db.patch(args.playlistConfig.linkedPlaylistId, {
          linkedProductId: productId,
          submissionPricing: {
            isFree: args.pricingModel === "free_with_gate",
            price: args.price,
            currency: "usd",
          },
          acceptsSubmissions: true, // Auto-enable submissions
          submissionSLA: args.playlistConfig.reviewTurnaroundDays,
        });
      }
    }
    
    return productId;
  },
});

/**
 * Update Universal Product
 * 
 * Update any field of a universal product while maintaining consistency.
 */
export const updateUniversalProduct = mutation({
  args: {
    productId: v.id("digitalProducts"),
    
    // Core fields
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    
    // Pricing model
    pricingModel: v.optional(v.union(
      v.literal("free_with_gate"),
      v.literal("paid"),
    )),
    
    // Follow gate config
    followGateConfig: v.optional(followGateConfigValidator),
    
    // Playlist config
    playlistConfig: v.optional(playlistConfigValidator),
    
    // Media
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { productId, pricingModel, followGateConfig, playlistConfig, ...updates } = args;
    
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");
    
    // Build update object
    const updateData: any = { ...updates };
    
    // Handle pricing model changes
    if (pricingModel) {
      if (pricingModel === "free_with_gate") {
        updateData.followGateEnabled = true;
        updateData.price = 0;
      } else {
        updateData.followGateEnabled = false;
      }
    }
    
    // Update follow gate config
    if (followGateConfig) {
      updateData.followGateRequirements = {
        requireEmail: followGateConfig.requireEmail,
        requireInstagram: followGateConfig.requireInstagram,
        requireTiktok: followGateConfig.requireTiktok,
        requireYoutube: followGateConfig.requireYoutube,
        requireSpotify: followGateConfig.requireSpotify,
        minFollowsRequired: followGateConfig.minFollowsRequired,
      };
      updateData.followGateSocialLinks = followGateConfig.socialLinks;
      updateData.followGateMessage = followGateConfig.customMessage;
    }
    
    // Update playlist config
    if (playlistConfig) {
      updateData.playlistCurationConfig = {
        linkedPlaylistId: playlistConfig.linkedPlaylistId,
        reviewTurnaroundDays: playlistConfig.reviewTurnaroundDays,
        genresAccepted: playlistConfig.genresAccepted,
        submissionGuidelines: playlistConfig.submissionGuidelines,
        maxSubmissionsPerMonth: playlistConfig.maxSubmissionsPerMonth,
      };
      
      // Update linked playlist
      if (playlistConfig.linkedPlaylistId) {
        await ctx.db.patch(playlistConfig.linkedPlaylistId, {
          linkedProductId: productId,
          submissionPricing: {
            isFree: pricingModel === "free_with_gate" || (product.followGateEnabled ?? false),
            price: updates.price ?? product.price,
            currency: "usd",
          },
          submissionSLA: playlistConfig.reviewTurnaroundDays,
        });
      }
    }
    
    await ctx.db.patch(productId, updateData);
    return null;
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get Universal Product with Enriched Data
 * 
 * Returns product with linked playlist data if applicable.
 */
export const getUniversalProduct = query({
  args: { 
    productId: v.id("digitalProducts"),
    userId: v.optional(v.string()), // For owner preview of unpublished
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    
    // Check access permissions
    const isOwner = args.userId && product.userId === args.userId;
    if (!product.isPublished && !isOwner) {
      return null;
    }
    
    // Enrich with linked data
    let enrichedProduct: any = { ...product };
    
    // If playlist curation, add playlist details
    if (product.productCategory === "playlist-curation" && 
        product.playlistCurationConfig?.linkedPlaylistId) {
      const playlist = await ctx.db.get(product.playlistCurationConfig.linkedPlaylistId);
      if (playlist) {
        enrichedProduct.linkedPlaylist = {
          _id: playlist._id,
          name: playlist.name,
          description: playlist.description,
          coverUrl: playlist.coverUrl,
          genres: playlist.genres,
          trackCount: playlist.trackCount,
          totalSubmissions: playlist.totalSubmissions,
        };
      }
    }
    
    // Get creator info
    const stores = await ctx.db.query("stores").collect();
    const store = stores.find(s => s._id === product.storeId);
    
    if (store) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), store.userId))
        .first();
      if (user) {
        enrichedProduct.creatorName = user.name || store.name || "Creator";
        enrichedProduct.creatorAvatar = user.imageUrl;
      }
    }
    
    return enrichedProduct;
  },
});

/**
 * Get Products by Category
 * 
 * Filter products by specific category (e.g., all sample packs).
 */
export const getProductsByCategory = query({
  args: {
    productCategory: v.union(
      v.literal("sample-pack"),
      v.literal("preset-pack"),
      v.literal("midi-pack"),
      v.literal("ableton-rack"),
      v.literal("beat-lease"),
      v.literal("project-files"),
      v.literal("mixing-template"),
      v.literal("coaching"),
      v.literal("mixing-service"),
      v.literal("mastering-service"),
      v.literal("playlist-curation"),
      v.literal("course"),
      v.literal("workshop"),
      v.literal("masterclass"),
      v.literal("pdf-guide"),
      v.literal("cheat-sheet"),
      v.literal("template"),
      v.literal("blog-post"),
      v.literal("community"),
      v.literal("tip-jar"),
      v.literal("donation"),
    ),
    storeId: v.optional(v.string()), // Filter by store
    publishedOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) => 
        q.eq("productCategory", args.productCategory)
      )
      .collect();
    
    // Filter by store if provided
    if (args.storeId) {
      products = products.filter(p => p.storeId === args.storeId);
    }
    
    // Filter by published status
    if (args.publishedOnly) {
      products = products.filter(p => p.isPublished);
    }
    
    return products;
  },
});

/**
 * Check if User Can Access Product
 * 
 * Returns whether user has access via:
 * 1. Purchase (for paid products)
 * 2. Follow gate completion (for free products)
 * 3. Owner access
 */
export const canAccessProduct = query({
  args: {
    productId: v.id("digitalProducts"),
    userId: v.optional(v.string()), // Clerk ID
    email: v.optional(v.string()), // For follow gate check
  },
  returns: v.object({
    canAccess: v.boolean(),
    reason: v.string(),
    requiresFollowGate: v.boolean(),
    requiresPurchase: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return {
        canAccess: false,
        reason: "Product not found",
        requiresFollowGate: false,
        requiresPurchase: false,
      };
    }
    
    // Check if user is owner
    if (args.userId && product.userId === args.userId) {
      return {
        canAccess: true,
        reason: "Owner access",
        requiresFollowGate: false,
        requiresPurchase: false,
      };
    }
    
    // Check if product is published
    if (!product.isPublished) {
      return {
        canAccess: false,
        reason: "Product not published",
        requiresFollowGate: false,
        requiresPurchase: false,
      };
    }
    
    // Check if free with follow gate
    if (product.followGateEnabled && args.email) {
      const submission = await ctx.db
        .query("followGateSubmissions")
        .withIndex("by_email_product", (q) =>
          q.eq("email", args.email!).eq("productId", product._id)
        )
        .first();
      
      if (submission) {
        return {
          canAccess: true,
          reason: "Follow gate completed",
          requiresFollowGate: false,
          requiresPurchase: false,
        };
      }
      
      return {
        canAccess: false,
        reason: "Follow gate required",
        requiresFollowGate: true,
        requiresPurchase: false,
      };
    }
    
    // Check if paid and user has purchased
    if (!product.followGateEnabled && args.userId) {
      const purchases = await ctx.db.query("purchases").collect();
      const purchase = purchases.find(p => 
        p.userId === args.userId && p.productId === product._id
      );
      
      if (purchase) {
        return {
          canAccess: true,
          reason: "Purchase confirmed",
          requiresFollowGate: false,
          requiresPurchase: false,
        };
      }
      
      return {
        canAccess: false,
        reason: "Purchase required",
        requiresFollowGate: false,
        requiresPurchase: true,
      };
    }
    
    // Default: no access
    return {
      canAccess: false,
      reason: "Access denied",
      requiresFollowGate: product.followGateEnabled || false,
      requiresPurchase: !product.followGateEnabled,
    };
  },
});

/**
 * Get All Universal Products by Store
 * 
 * Returns all products for a store with enriched data.
 */
export const getUniversalProductsByStore = query({
  args: { 
    storeId: v.string(),
    publishedOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    if (args.publishedOnly) {
      products = products.filter(p => p.isPublished);
    }
    
    // Enrich each product with category info
    const enrichedProducts = products.map(product => ({
      ...product,
      pricingModel: product.followGateEnabled ? "free_with_gate" : "paid",
      hasFollowGate: product.followGateEnabled || false,
      isPaid: !product.followGateEnabled,
    }));
    
    return enrichedProducts;
  },
});

