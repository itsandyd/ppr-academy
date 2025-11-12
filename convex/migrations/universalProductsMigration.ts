import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

/**
 * Universal Products Migration
 * 
 * This migration script updates existing products to use the new universal product system.
 * It's designed to be backward-compatible and non-destructive.
 * 
 * What it does:
 * 1. Adds `productCategory` to existing products based on their current type
 * 2. Preserves all existing data
 * 3. Sets up proper follow gate flags
 * 
 * Run this ONCE after deploying the schema changes.
 */

/**
 * Preview Migration Changes
 * 
 * Returns what changes would be made without actually applying them.
 * Use this to verify the migration before running it.
 */
export const previewUniversalProductsMigration = internalQuery({
  args: {},
  returns: v.object({
    totalProducts: v.number(),
    productsToMigrate: v.number(),
    breakdown: v.any(),
  }),
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").collect();
    
    const breakdown: Record<string, number> = {};
    let productsToMigrate = 0;
    
    for (const product of products) {
      // Skip if already has productCategory
      if (product.productCategory) continue;
      
      productsToMigrate++;
      
      // Determine category
      let category = "digital"; // default
      
      if (product.productType === "abletonRack") {
        category = "ableton-rack";
      } else if (product.productType === "abletonPreset") {
        category = "preset-pack";
      } else if (product.productType === "coaching") {
        category = "coaching";
      } else if (product.price === 0 && product.followGateEnabled) {
        category = "lead-magnet";
      } else if (product.productType === "digital") {
        // Try to infer from title/description
        const text = (product.title + " " + (product.description || "")).toLowerCase();
        if (text.includes("sample") || text.includes("samples")) {
          category = "sample-pack";
        } else if (text.includes("preset")) {
          category = "preset-pack";
        } else if (text.includes("beat") || text.includes("lease")) {
          category = "beat-lease";
        } else if (text.includes("project")) {
          category = "project-files";
        } else if (text.includes("mixing") || text.includes("template")) {
          category = "mixing-template";
        }
      }
      
      breakdown[category] = (breakdown[category] || 0) + 1;
    }
    
    return {
      totalProducts: products.length,
      productsToMigrate,
      breakdown,
    };
  },
});

/**
 * Run Universal Products Migration
 * 
 * Actually applies the migration to all products.
 * Safe to run multiple times (idempotent).
 */
export const runUniversalProductsMigration = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // Set to true to preview without making changes
  },
  returns: v.object({
    success: v.boolean(),
    productsUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const products = await ctx.db.query("digitalProducts").collect();
    
    let productsUpdated = 0;
    const errors: string[] = [];
    
    for (const product of products) {
      try {
        // Skip if already has productCategory
        if (product.productCategory) continue;
        
        // Determine category
        let category: string = "digital"; // default
        
        if (product.productType === "abletonRack") {
          category = "ableton-rack";
        } else if (product.productType === "abletonPreset") {
          category = "preset-pack";
        } else if (product.productType === "coaching") {
          category = "coaching";
        } else if (product.price === 0 && product.followGateEnabled) {
          category = "lead-magnet";
        } else if (product.productType === "digital") {
          // Try to infer from title/description
          const text = (product.title + " " + (product.description || "")).toLowerCase();
          if (text.includes("sample") || text.includes("samples")) {
            category = "sample-pack";
          } else if (text.includes("preset")) {
            category = "preset-pack";
          } else if (text.includes("beat") || text.includes("lease")) {
            category = "beat-lease";
          } else if (text.includes("project")) {
            category = "project-files";
          } else if (text.includes("mixing") || text.includes("template")) {
            category = "mixing-template";
          }
        }
        
        // Build update object
        const updates: any = {
          productCategory: category,
        };
        
        // Ensure followGateEnabled is set correctly
        if (product.followGateEnabled === undefined) {
          updates.followGateEnabled = product.price === 0 && 
            (product.followGateRequirements !== undefined);
        }
        
        // Apply update (unless dry run)
        if (!args.dryRun) {
          await ctx.db.patch(product._id, updates);
        }
        
        productsUpdated++;
      } catch (error) {
        errors.push(`Error updating product ${product._id}: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      productsUpdated,
      errors,
    };
  },
});

/**
 * Rollback Universal Products Migration
 * 
 * Removes productCategory field from all products.
 * Use this if you need to rollback the migration.
 */
export const rollbackUniversalProductsMigration = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    productsUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").collect();
    
    let productsUpdated = 0;
    
    for (const product of products) {
      if (product.productCategory) {
        await ctx.db.patch(product._id, {
          productCategory: undefined,
          playlistCurationConfig: undefined,
        });
        productsUpdated++;
      }
    }
    
    return {
      success: true,
      productsUpdated,
    };
  },
});

/**
 * Migrate Specific Playlist to Product
 * 
 * Converts an existing playlist into a product listing.
 */
export const migratePlaylistToProduct = internalMutation({
  args: {
    playlistId: v.id("curatorPlaylists"),
    storeId: v.string(),
    userId: v.string(),
    pricingModel: v.union(
      v.literal("free_with_gate"),
      v.literal("paid"),
    ),
    // For free_with_gate
    followGateConfig: v.optional(v.object({
      requireEmail: v.boolean(),
      requireInstagram: v.boolean(),
      requireTiktok: v.boolean(),
      requireYoutube: v.boolean(),
      requireSpotify: v.boolean(),
      minFollowsRequired: v.number(),
      socialLinks: v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
      }),
      customMessage: v.optional(v.string()),
    })),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    
    // Check if playlist already has a linked product
    if (playlist.linkedProductId) {
      return playlist.linkedProductId;
    }
    
    // Create product
    const productId = await ctx.db.insert("digitalProducts", {
      title: `${playlist.name} - Playlist Submission`,
      description: playlist.description || `Submit your tracks to ${playlist.name}`,
      storeId: args.storeId,
      userId: args.userId,
      productType: "playlistCuration",
      productCategory: "playlist-curation",
      price: args.pricingModel === "free_with_gate" ? 0 : (playlist.submissionPricing.price || 0),
      imageUrl: playlist.coverUrl,
      isPublished: true,
      
      // Follow gate setup
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
      
      // Playlist config
      playlistCurationConfig: {
        linkedPlaylistId: args.playlistId,
        reviewTurnaroundDays: playlist.submissionSLA || 7,
        genresAccepted: playlist.genres || [],
        submissionGuidelines: playlist.submissionRules?.guidelines,
      },
      
      // Defaults
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
    
    // Link product to playlist
    await ctx.db.patch(args.playlistId, {
      linkedProductId: productId,
    });
    
    return productId;
  },
});

/**
 * Get Migration Status
 * 
 * Check the current migration status.
 */
export const getMigrationStatus = internalQuery({
  args: {},
  returns: v.object({
    totalProducts: v.number(),
    productsWithCategory: v.number(),
    productsWithoutCategory: v.number(),
    playlistsTotal: v.number(),
    playlistsLinkedToProducts: v.number(),
    migrationComplete: v.boolean(),
  }),
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").collect();
    const playlists = await ctx.db.query("curatorPlaylists").collect();
    
    const productsWithCategory = products.filter(p => p.productCategory).length;
    const playlistsLinkedToProducts = playlists.filter(p => p.linkedProductId).length;
    
    return {
      totalProducts: products.length,
      productsWithCategory,
      productsWithoutCategory: products.length - productsWithCategory,
      playlistsTotal: playlists.length,
      playlistsLinkedToProducts,
      migrationComplete: productsWithCategory === products.length,
    };
  },
});

