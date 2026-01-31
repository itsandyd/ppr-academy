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
      v.literal("effectChain"), // NEW
      v.literal("abletonRack"), // Legacy
      v.literal("abletonPreset"),
      v.literal("coaching"),
      v.literal("urlMedia")
    ),
    productCategory: v.union(
      // Music Production
      v.literal("sample-pack"),
      v.literal("preset-pack"),
      v.literal("midi-pack"),
      v.literal("bundle"),
      v.literal("effect-chain"), // NEW
      v.literal("ableton-rack"), // Legacy
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
      v.literal("pdf"), // Consolidated PDF category
      v.literal("pdf-guide"), // Legacy
      v.literal("cheat-sheet"), // Legacy
      v.literal("template"), // Legacy
      v.literal("blog-post"),
      // Community
      v.literal("community"),
      // Support & Donations
      v.literal("tip-jar"),
      v.literal("donation")
    ),

    // Pricing Configuration
    pricingModel: v.union(
      v.literal("free_with_gate"), // Download gate (email + socials)
      v.literal("paid") // Direct purchase
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

    // Effect Chain / DAW-specific (if productType = "effectChain")
    dawType: v.optional(
      v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )
    ),
    dawVersion: v.optional(v.string()),
    effectTypes: v.optional(v.array(v.string())),
    thirdPartyPlugins: v.optional(v.array(v.string())),
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    complexity: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),

    // Ableton-specific (legacy - if productType = "abletonRack" or "abletonPreset")
    abletonVersion: v.optional(v.string()),
    rackType: v.optional(
      v.union(
        v.literal("audioEffect"),
        v.literal("instrument"),
        v.literal("midiEffect"),
        v.literal("drumRack")
      )
    ),

    // Coaching-specific (if productCategory = "coaching")
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),

    // Beat Lease-specific (if productCategory = "beat-lease")
    beatLeaseConfig: v.optional(
      v.object({
        tiers: v.array(
          v.object({
            type: v.union(
              v.literal("basic"),
              v.literal("premium"),
              v.literal("exclusive"),
              v.literal("unlimited")
            ),
            enabled: v.boolean(),
            price: v.number(),
            name: v.string(),
            distributionLimit: v.optional(v.number()),
            streamingLimit: v.optional(v.number()),
            commercialUse: v.boolean(),
            musicVideoUse: v.boolean(),
            radioBroadcasting: v.boolean(),
            stemsIncluded: v.boolean(),
            creditRequired: v.boolean(),
          })
        ),
        bpm: v.optional(v.number()),
        key: v.optional(v.string()),
        genre: v.optional(v.string()),
      })
    ),
  },
  returns: v.union(v.id("digitalProducts"), v.id("courses")),
  handler: async (ctx, args) => {
    // ========================================================================
    // AUTHORIZATION
    // ========================================================================

    // Get the store to verify ownership
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("_id"), args.storeId as any))
      .first();

    if (!store) {
      throw new Error("Store not found");
    }

    // Authorization check: verify userId matches the store owner
    if (store.userId !== args.userId) {
      throw new Error("Unauthorized: You can only create products in your own store");
    }

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
    // PLAN LIMIT ENFORCEMENT
    // ========================================================================

    // Check if user is an admin - admins bypass ALL plan limits
    const storeUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
      .first();
    const isAdmin = storeUser?.admin === true;

    // Import plan limits inline (to avoid circular dependency)
    // Unified product limit: courses and digital products count together
    const PLAN_LIMITS: Record<string, { maxProducts: number; canChargeMoney: boolean }> = {
      free: { maxProducts: 1, canChargeMoney: false }, // 1 total product to try platform
      starter: { maxProducts: 15, canChargeMoney: true },
      creator: { maxProducts: 50, canChargeMoney: true },
      creator_pro: { maxProducts: -1, canChargeMoney: true }, // unlimited
      business: { maxProducts: -1, canChargeMoney: true },
      early_access: { maxProducts: -1, canChargeMoney: true },
    };

    const plan = store.plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Check if free tier user is trying to create a paid product (admins bypass)
    const price = args.price || 0;
    if (!isAdmin && price > 0 && !limits.canChargeMoney) {
      throw new Error(
        "Free plan users can only create free products. Upgrade to Starter ($12/mo) to sell paid products."
      );
    }

    // Check unified product limit (admins bypass)
    if (!isAdmin && limits.maxProducts > 0) {
      const [courseCount, digitalProductCount] = await Promise.all([
        ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((courses) => courses.length),
        ctx.db
          .query("digitalProducts")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((products) => products.length),
      ]);

      const totalCount = courseCount + digitalProductCount;
      if (totalCount >= limits.maxProducts) {
        throw new Error(
          `Product limit reached (${limits.maxProducts}). Upgrade your plan to create more products.`
        );
      }
    }

    // ========================================================================
    // CREATE PRODUCT
    // ========================================================================

    // Handle courses separately (they go in courses table, not digitalProducts)
    if (args.productCategory === "course") {
      // Generate slug for course
      const generateSlug = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      };

      const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const existing = await ctx.db
            .query("courses")
            .filter((q) => q.eq(q.field("slug"), slug))
            .first();

          if (!existing) {
            return slug;
          }

          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      };

      const baseSlug = generateSlug(args.title);
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      const courseData = {
        userId: args.userId,
        instructorId: args.userId,
        storeId: args.storeId,
        title: args.title,
        slug: uniqueSlug,
        description: args.description,
        price: args.price,
        imageUrl: args.imageUrl,
        tags: args.tags,
        isPublished: false, // Start as draft

        // Follow Gate Setup
        followGateEnabled: args.pricingModel === "free_with_gate",
        followGateRequirements: args.followGateConfig
          ? {
              requireEmail: args.followGateConfig.requireEmail,
              requireInstagram: args.followGateConfig.requireInstagram,
              requireTiktok: args.followGateConfig.requireTiktok,
              requireYoutube: args.followGateConfig.requireYoutube,
              requireSpotify: args.followGateConfig.requireSpotify,
              minFollowsRequired: args.followGateConfig.minFollowsRequired,
            }
          : undefined,
        followGateSocialLinks: args.followGateConfig?.socialLinks,
        followGateMessage: args.followGateConfig?.customMessage,
      };

      const courseId = await ctx.db.insert("courses", courseData);
      return courseId;
    }

    // For all other products, create in digitalProducts table
    // Generate slug for digital products
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    const generateUniqueProductSlug = async (baseSlug: string): Promise<string> => {
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId_and_slug", (q) =>
            q.eq("storeId", args.storeId).eq("slug", slug)
          )
          .first();

        if (!existing) {
          return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    };

    const baseSlug = generateSlug(args.title);
    const uniqueSlug = await generateUniqueProductSlug(baseSlug);

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
      slug: uniqueSlug, // Add generated slug
      isPublished: false, // Start as draft

      // Follow Gate Setup (only for digitalProducts that support it)
      // Note: digitalProducts table doesn't have follow gate fields
      // These are only for courses, so we skip them here

      // Playlist Curation Setup
      playlistCurationConfig: args.playlistConfig
        ? {
            linkedPlaylistId: args.playlistConfig.linkedPlaylistId,
            reviewTurnaroundDays: args.playlistConfig.reviewTurnaroundDays,
            genresAccepted: args.playlistConfig.genresAccepted,
            submissionGuidelines: args.playlistConfig.submissionGuidelines,
            maxSubmissionsPerMonth: args.playlistConfig.maxSubmissionsPerMonth,
          }
        : undefined,

      // Effect Chain / DAW-specific fields
      dawType: args.dawType,
      dawVersion: args.dawVersion,
      effectType: args.effectTypes,
      thirdPartyPlugins: args.thirdPartyPlugins,
      cpuLoad: args.cpuLoad,
      complexity: args.complexity,

      // Beat Lease config
      beatLeaseConfig: args.beatLeaseConfig,
      bpm: args.beatLeaseConfig?.bpm,
      musicalKey: args.beatLeaseConfig?.key,
      genre: args.beatLeaseConfig?.genre ? [args.beatLeaseConfig.genre] : undefined,

      // Ableton-specific (legacy)
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
    pricingModel: v.optional(v.union(v.literal("free_with_gate"), v.literal("paid"))),

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
    if (
      product.productCategory === "playlist-curation" &&
      product.playlistCurationConfig?.linkedPlaylistId
    ) {
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
    const store = stores.find((s) => s._id === product.storeId);

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
      v.literal("bundle"),
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
      v.literal("donation")
    ),
    storeId: v.optional(v.string()), // Filter by store
    publishedOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) => q.eq("productCategory", args.productCategory))
      .collect();

    // Filter by store if provided
    if (args.storeId) {
      products = products.filter((p) => p.storeId === args.storeId);
    }

    // Filter by published status
    if (args.publishedOnly) {
      products = products.filter((p) => p.isPublished);
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
      const purchase = purchases.find(
        (p) => p.userId === args.userId && p.productId === product._id
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
      products = products.filter((p) => p.isPublished);
    }

    // Enrich each product with category info
    const enrichedProducts = products.map((product) => ({
      ...product,
      pricingModel: product.followGateEnabled ? "free_with_gate" : "paid",
      hasFollowGate: product.followGateEnabled || false,
      isPaid: !product.followGateEnabled,
    }));

    return enrichedProducts;
  },
});

/**
 * Generate Slugs for Existing Products
 *
 * Migration function to add slugs to products that don't have them.
 */
export const generateMissingSlugs = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    products: v.array(v.object({
      id: v.string(),
      title: v.string(),
      slug: v.string(),
    })),
  }),
  handler: async (ctx) => {
    // Get all products without slugs
    const products = await ctx.db
      .query("digitalProducts")
      .collect();

    const productsWithoutSlugs = products.filter((p) => !p.slug);

    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    const updatedProducts: { id: string; title: string; slug: string }[] = [];

    for (const product of productsWithoutSlugs) {
      const baseSlug = generateSlug(product.title);

      // Check for uniqueness within the store
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId_and_slug", (q) =>
            q.eq("storeId", product.storeId).eq("slug", slug)
          )
          .first();

        if (!existing || existing._id === product._id) {
          break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await ctx.db.patch(product._id, { slug });
      updatedProducts.push({
        id: product._id,
        title: product.title,
        slug,
      });
    }

    return {
      updated: updatedProducts.length,
      products: updatedProducts,
    };
  },
});

/**
 * Save Product as Draft
 *
 * Creates or updates a product with partial data, allowing users to save
 * progress before all required fields are complete. Drafts are never published
 * automatically.
 *
 * @example
 * // Create a new draft with minimal info
 * saveDraft({
 *   title: "My New Sample Pack",
 *   storeId: "store_123",
 *   userId: "user_456",
 *   productType: "digital",
 *   productCategory: "sample-pack",
 * })
 *
 * @example
 * // Update existing draft
 * saveDraft({
 *   productId: "prod_123",
 *   title: "Updated Title",
 *   description: "Added description",
 * })
 */
export const saveDraft = mutation({
  args: {
    // For updating existing draft
    productId: v.optional(v.id("digitalProducts")),

    // Core fields - required for new drafts
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    storeId: v.optional(v.string()),
    userId: v.optional(v.string()),

    // Product Type Classification
    productType: v.optional(
      v.union(
        v.literal("digital"),
        v.literal("playlistCuration"),
        v.literal("effectChain"),
        v.literal("abletonRack"),
        v.literal("abletonPreset"),
        v.literal("coaching"),
        v.literal("urlMedia")
      )
    ),
    productCategory: v.optional(
      v.union(
        // Music Production
        v.literal("sample-pack"),
        v.literal("preset-pack"),
        v.literal("midi-pack"),
        v.literal("bundle"),
        v.literal("effect-chain"),
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
        v.literal("pdf"),
        v.literal("pdf-guide"),
        v.literal("cheat-sheet"),
        v.literal("template"),
        v.literal("blog-post"),
        // Community
        v.literal("community"),
        // Support & Donations
        v.literal("tip-jar"),
        v.literal("donation")
      )
    ),

    // Pricing Configuration - optional for drafts
    pricingModel: v.optional(v.union(v.literal("free_with_gate"), v.literal("paid"))),
    price: v.optional(v.number()),

    // Follow Gate Config (optional, validated loosely for drafts)
    followGateConfig: v.optional(followGateConfigValidator),

    // Media
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),

    // Metadata
    tags: v.optional(v.array(v.string())),

    // Effect Chain / DAW-specific
    dawType: v.optional(
      v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )
    ),
    dawVersion: v.optional(v.string()),
    effectTypes: v.optional(v.array(v.string())),
    thirdPartyPlugins: v.optional(v.array(v.string())),
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    complexity: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),

    // Ableton-specific (legacy)
    abletonVersion: v.optional(v.string()),
    rackType: v.optional(
      v.union(
        v.literal("audioEffect"),
        v.literal("instrument"),
        v.literal("midiEffect"),
        v.literal("drumRack")
      )
    ),

    // Coaching-specific
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    productId: v.optional(v.id("digitalProducts")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { productId, ...data } = args;

    // ========================================================================
    // UPDATE EXISTING DRAFT
    // ========================================================================
    if (productId) {
      const existingProduct = await ctx.db.get(productId);
      if (!existingProduct) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      // Authorization check: verify userId matches product owner
      if (data.userId && existingProduct.userId !== data.userId) {
        return {
          success: false,
          message: "Unauthorized: You can only update your own products",
        };
      }

      // Build update object, only including provided fields
      const updates: Record<string, unknown> = {};

      if (data.title !== undefined) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.price !== undefined) updates.price = data.price;
      if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
      if (data.downloadUrl !== undefined) updates.downloadUrl = data.downloadUrl;
      if (data.tags !== undefined) updates.tags = data.tags;
      if (data.productType !== undefined) updates.productType = data.productType;
      if (data.productCategory !== undefined) updates.productCategory = data.productCategory;

      // Handle pricing model
      if (data.pricingModel !== undefined) {
        if (data.pricingModel === "free_with_gate") {
          updates.followGateEnabled = true;
          if (data.price === undefined) updates.price = 0;
        } else {
          updates.followGateEnabled = false;
        }
      }

      // Handle follow gate config
      if (data.followGateConfig) {
        updates.followGateRequirements = {
          requireEmail: data.followGateConfig.requireEmail,
          requireInstagram: data.followGateConfig.requireInstagram,
          requireTiktok: data.followGateConfig.requireTiktok,
          requireYoutube: data.followGateConfig.requireYoutube,
          requireSpotify: data.followGateConfig.requireSpotify,
          minFollowsRequired: data.followGateConfig.minFollowsRequired,
        };
        updates.followGateSocialLinks = data.followGateConfig.socialLinks;
        updates.followGateMessage = data.followGateConfig.customMessage;
      }

      // Effect chain / DAW fields
      if (data.dawType !== undefined) updates.dawType = data.dawType;
      if (data.dawVersion !== undefined) updates.dawVersion = data.dawVersion;
      if (data.effectTypes !== undefined) updates.effectType = data.effectTypes;
      if (data.thirdPartyPlugins !== undefined) updates.thirdPartyPlugins = data.thirdPartyPlugins;
      if (data.cpuLoad !== undefined) updates.cpuLoad = data.cpuLoad;
      if (data.complexity !== undefined) updates.complexity = data.complexity;

      // Ableton-specific
      if (data.abletonVersion !== undefined) updates.abletonVersion = data.abletonVersion;
      if (data.rackType !== undefined) updates.rackType = data.rackType;

      // Coaching-specific
      if (data.duration !== undefined) updates.duration = data.duration;
      if (data.sessionType !== undefined) updates.sessionType = data.sessionType;

      // Ensure draft is never auto-published
      updates.isPublished = false;

      await ctx.db.patch(productId, updates);

      return {
        success: true,
        productId,
        message: "Draft saved successfully",
      };
    }

    // ========================================================================
    // CREATE NEW DRAFT
    // ========================================================================
    if (!data.storeId || !data.userId) {
      return {
        success: false,
        message: "Store ID and User ID are required for new drafts",
      };
    }

    // Get the store to check plan limits and authorization
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("_id"), data.storeId as any))
      .first();

    if (!store) {
      return {
        success: false,
        message: "Store not found",
      };
    }

    // Authorization check: verify userId matches the store owner
    if (store.userId !== data.userId) {
      return {
        success: false,
        message: "Unauthorized: You can only create drafts in your own store",
      };
    }

    // Check if user is an admin - admins bypass ALL plan limits
    const storeUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
      .first();
    const isAdmin = storeUser?.admin === true;

    // Check unified product limit (admins bypass)
    const PLAN_LIMITS: Record<string, { maxProducts: number }> = {
      free: { maxProducts: 1 },
      starter: { maxProducts: 15 },
      creator: { maxProducts: 50 },
      creator_pro: { maxProducts: -1 },
      business: { maxProducts: -1 },
      early_access: { maxProducts: -1 },
    };

    const plan = store.plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (!isAdmin && limits.maxProducts > 0) {
      const [courseCount, digitalProductCount] = await Promise.all([
        ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((courses) => courses.length),
        ctx.db
          .query("digitalProducts")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect()
          .then((products) => products.length),
      ]);

      const totalCount = courseCount + digitalProductCount;
      if (totalCount >= limits.maxProducts) {
        return {
          success: false,
          message: `Product limit reached (${limits.maxProducts}). Upgrade your plan to create more products.`,
        };
      }
    }

    // Generate slug
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    const productTitle = data.title || "Untitled Draft";
    const baseSlug = generateSlug(productTitle);

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId_and_slug", (q) =>
          q.eq("storeId", data.storeId!).eq("slug", slug)
        )
        .first();

      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the draft product
    const productData: Record<string, unknown> = {
      title: productTitle,
      description: data.description || "",
      storeId: data.storeId,
      userId: data.userId,
      productType: data.productType || "digital",
      productCategory: data.productCategory || "sample-pack",
      price: data.price ?? 0,
      imageUrl: data.imageUrl,
      downloadUrl: data.downloadUrl,
      tags: data.tags || [],
      slug,
      isPublished: false, // Always start as draft

      // Follow gate setup
      followGateEnabled: data.pricingModel === "free_with_gate",
      followGateRequirements: data.followGateConfig
        ? {
            requireEmail: data.followGateConfig.requireEmail,
            requireInstagram: data.followGateConfig.requireInstagram,
            requireTiktok: data.followGateConfig.requireTiktok,
            requireYoutube: data.followGateConfig.requireYoutube,
            requireSpotify: data.followGateConfig.requireSpotify,
            minFollowsRequired: data.followGateConfig.minFollowsRequired,
          }
        : undefined,
      followGateSocialLinks: data.followGateConfig?.socialLinks,
      followGateMessage: data.followGateConfig?.customMessage,

      // Effect chain / DAW fields
      dawType: data.dawType,
      dawVersion: data.dawVersion,
      effectType: data.effectTypes,
      thirdPartyPlugins: data.thirdPartyPlugins,
      cpuLoad: data.cpuLoad,
      complexity: data.complexity,

      // Ableton-specific
      abletonVersion: data.abletonVersion,
      rackType: data.rackType,

      // Coaching-specific
      duration: data.duration,
      sessionType: data.sessionType,

      // Defaults
      orderBumpEnabled: false,
      affiliateEnabled: false,
    };

    const newProductId = await ctx.db.insert("digitalProducts", productData as any);

    return {
      success: true,
      productId: newProductId,
      message: "Draft created successfully",
    };
  },
});

/**
 * Publish Draft
 *
 * Validates a draft and publishes it. Performs all the validation
 * that createUniversalProduct does, but on an existing draft.
 */
export const publishDraft = mutation({
  args: {
    productId: v.id("digitalProducts"),
    userId: v.string(), // Required for authorization
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { success: false, message: "Product not found" };
    }

    // Authorization check: verify userId matches the product owner
    if (product.userId !== args.userId) {
      return { success: false, message: "Unauthorized: You can only publish your own products" };
    }

    // Validate required fields
    const errors: string[] = [];

    if (!product.title || product.title === "Untitled Draft") {
      errors.push("Title is required");
    }

    if (!product.description) {
      errors.push("Description is required");
    }

    // Validate pricing
    const isFollowGate = product.followGateEnabled;
    if (isFollowGate) {
      if (product.price !== 0) {
        errors.push("Free products with download gates must have price = $0");
      }
      // Follow gate config is optional for drafts, but encourage it
    } else {
      if (product.price === undefined || product.price <= 0) {
        errors.push("Paid products must have price > $0");
      }
    }

    // Get store to check plan limits for paid products
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("_id"), product.storeId as any))
      .first();

    if (store) {
      const storeUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();
      const isAdmin = storeUser?.admin === true;

      const PLAN_LIMITS: Record<string, { canChargeMoney: boolean }> = {
        free: { canChargeMoney: false },
        starter: { canChargeMoney: true },
        creator: { canChargeMoney: true },
        creator_pro: { canChargeMoney: true },
        business: { canChargeMoney: true },
        early_access: { canChargeMoney: true },
      };

      const plan = store.plan || "free";
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      if (!isAdmin && product.price > 0 && !limits.canChargeMoney) {
        errors.push("Free plan users can only create free products. Upgrade to Starter ($12/mo) to sell paid products.");
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: errors.join(". "),
      };
    }

    // Publish the product
    await ctx.db.patch(args.productId, { isPublished: true });

    return {
      success: true,
      message: "Product published successfully",
    };
  },
});
