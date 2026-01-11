import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List all published preset packs for marketplace
 */
export const listPublished = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    targetPlugin: v.optional(v.string()),
    dawType: v.optional(v.string()),
    priceFilter: v.optional(
      v.union(v.literal("free"), v.literal("paid"), v.literal("all"))
    ),
    searchQuery: v.optional(v.string()),
    genre: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("popular"),
        v.literal("price-low"),
        v.literal("price-high")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 24;

    // Get all preset packs
    let products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) =>
        q.eq("productCategory", "preset-pack")
      )
      .collect();

    // Filter to only published products
    products = products.filter((p) => p.isPublished === true);

    // Apply plugin filter
    if (args.targetPlugin && args.targetPlugin !== "all") {
      products = products.filter(
        (p) => (p as any).targetPlugin === args.targetPlugin
      );
    }

    // Apply DAW filter
    if (args.dawType && args.dawType !== "all") {
      products = products.filter((p) => p.dawType === args.dawType);
    }

    // Apply price filter
    if (args.priceFilter === "free") {
      products = products.filter((p) => p.price === 0);
    } else if (args.priceFilter === "paid") {
      products = products.filter((p) => p.price > 0);
    }

    // Apply genre filter
    if (args.genre && args.genre !== "all") {
      products = products.filter(
        (p) =>
          p.genre?.includes(args.genre!) || p.tags?.includes(args.genre!)
      );
    }

    // Apply search filter
    if (args.searchQuery) {
      const term = args.searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.tags?.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Sorting
    switch (args.sortBy) {
      case "price-low":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        products.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        // Sort by creation time as proxy for popularity for now
        products.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "newest":
      default:
        products.sort((a, b) => b._creationTime - a._creationTime);
    }

    // Convert storage IDs to URLs and get creator info
    const productsWithUrls = await Promise.all(
      products.slice(0, limit).map(async (product) => {
        let imageUrl = product.imageUrl;
        let downloadUrl = product.downloadUrl;
        let demoAudioUrl = product.demoAudioUrl;

        // Convert storage IDs to URLs
        if (imageUrl && !imageUrl.startsWith("http")) {
          try {
            imageUrl =
              (await ctx.storage.getUrl(imageUrl as Id<"_storage">)) ||
              imageUrl;
          } catch {
            // Keep original if conversion fails
          }
        }
        if (downloadUrl && !downloadUrl.startsWith("http")) {
          try {
            downloadUrl =
              (await ctx.storage.getUrl(downloadUrl as Id<"_storage">)) ||
              downloadUrl;
          } catch {
            // Keep original
          }
        }
        if (demoAudioUrl && !demoAudioUrl.startsWith("http")) {
          try {
            demoAudioUrl =
              (await ctx.storage.getUrl(demoAudioUrl as Id<"_storage">)) ||
              demoAudioUrl;
          } catch {
            // Keep original
          }
        }

        // Get creator info from store
        let creatorName = "Creator";
        let creatorAvatar: string | undefined;
        let storeSlug: string | undefined;

        if (product.storeId) {
          const store = await ctx.db
            .query("stores")
            .filter((q) => q.eq(q.field("_id"), product.storeId as any))
            .first();

          if (store) {
            creatorName = store.name || "Creator";
            creatorAvatar = store.logoUrl;
            storeSlug = store.slug;
          }
        }

        // Parse pack files to get preset count
        let presetCount = 0;
        if (product.packFiles) {
          try {
            const files = JSON.parse(product.packFiles);
            presetCount = Array.isArray(files) ? files.length : 0;
          } catch {
            // Ignore parsing errors
          }
        }

        return {
          _id: product._id,
          _creationTime: product._creationTime,
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          imageUrl,
          downloadUrl,
          demoAudioUrl,
          storeId: product.storeId,
          productCategory: product.productCategory,
          targetPlugin: (product as any).targetPlugin,
          dawType: product.dawType,
          genre: product.genre,
          tags: product.tags,
          followGateEnabled: product.followGateEnabled,
          presetCount,
          creatorName,
          creatorAvatar,
          storeSlug,
        };
      })
    );

    return productsWithUrls;
  },
});

/**
 * Get single preset pack by slug or ID
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // First try by slug
    let product = await ctx.db
      .query("digitalProducts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    // If not found by slug, filter by productCategory
    if (product && product.productCategory !== "preset-pack") {
      product = null;
    }

    // If not found by slug, try by ID
    if (!product) {
      try {
        const byId = await ctx.db.get(args.slug as Id<"digitalProducts">);
        if (byId && byId.productCategory === "preset-pack") {
          product = byId;
        }
      } catch {
        // Not a valid ID, return null
        return null;
      }
    }

    if (!product) return null;

    // Get store info
    let store = null;
    if (product.storeId) {
      store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("_id"), product!.storeId as any))
        .first();
    }

    // Convert storage URLs
    let imageUrl = product.imageUrl;
    let downloadUrl = product.downloadUrl;
    let demoAudioUrl = product.demoAudioUrl;

    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        imageUrl =
          (await ctx.storage.getUrl(imageUrl as Id<"_storage">)) || imageUrl;
      } catch {
        // Keep original
      }
    }
    if (downloadUrl && !downloadUrl.startsWith("http")) {
      try {
        downloadUrl =
          (await ctx.storage.getUrl(downloadUrl as Id<"_storage">)) ||
          downloadUrl;
      } catch {
        // Keep original
      }
    }
    if (demoAudioUrl && !demoAudioUrl.startsWith("http")) {
      try {
        demoAudioUrl =
          (await ctx.storage.getUrl(demoAudioUrl as Id<"_storage">)) ||
          demoAudioUrl;
      } catch {
        // Keep original
      }
    }

    // Parse pack files and convert storage URLs
    let packFilesArray: Array<{
      id: string;
      name: string;
      url: string;
      size?: number;
      type?: string;
    }> = [];

    if (product.packFiles) {
      try {
        const files = JSON.parse(product.packFiles);
        packFilesArray = await Promise.all(
          files.map(async (file: any) => {
            let fileUrl = file.url || file.storageId;
            if (fileUrl && !fileUrl.startsWith("http")) {
              try {
                fileUrl =
                  (await ctx.storage.getUrl(fileUrl as Id<"_storage">)) ||
                  fileUrl;
              } catch {
                // Keep original
              }
            }
            return {
              id: file.id || file.storageId,
              name: file.name,
              url: fileUrl,
              size: file.size,
              type: file.type,
            };
          })
        );
      } catch {
        // Ignore parsing errors
      }
    }

    return {
      _id: product._id,
      _creationTime: product._creationTime,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      imageUrl,
      downloadUrl,
      demoAudioUrl,
      storeId: product.storeId,
      userId: product.userId,
      isPublished: product.isPublished,
      productCategory: product.productCategory,
      productType: product.productType,
      targetPlugin: (product as any).targetPlugin,
      targetPluginVersion: (product as any).targetPluginVersion,
      dawType: product.dawType,
      dawVersion: product.dawVersion,
      genre: product.genre,
      tags: product.tags,
      bpm: product.bpm,
      musicalKey: product.musicalKey,
      // Follow gate fields
      followGateEnabled: product.followGateEnabled,
      followGateRequirements: product.followGateRequirements,
      followGateSocialLinks: product.followGateSocialLinks,
      followGateMessage: product.followGateMessage,
      // Pack files
      packFiles: product.packFiles,
      packFilesArray,
      // Store info
      store: store
        ? {
            _id: store._id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            description: store.description,
          }
        : null,
    };
  },
});

/**
 * Get related preset packs (same plugin or same creator)
 */
export const getRelated = query({
  args: {
    productId: v.id("digitalProducts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 4;
    const product = await ctx.db.get(args.productId);

    if (!product) return [];

    // Get all preset packs except the current one
    const allPacks = await ctx.db
      .query("digitalProducts")
      .withIndex("by_productCategory", (q) =>
        q.eq("productCategory", "preset-pack")
      )
      .collect();

    // Filter published and exclude current product
    let related = allPacks.filter(
      (p) => p.isPublished === true && p._id !== args.productId
    );

    // Score and sort by relevance
    const targetPlugin = (product as any).targetPlugin;
    const storeId = product.storeId;

    const scored = related.map((p) => {
      let score = 0;
      // Same plugin = +3 points
      if (targetPlugin && (p as any).targetPlugin === targetPlugin) {
        score += 3;
      }
      // Same store = +2 points
      if (storeId && p.storeId === storeId) {
        score += 2;
      }
      // Shared genre = +1 point
      if (product.genre && p.genre) {
        const sharedGenres = product.genre.filter((g) => p.genre?.includes(g));
        score += sharedGenres.length;
      }
      return { product: p, score };
    });

    // Sort by score descending, then by creation time
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.product._creationTime - a.product._creationTime;
    });

    // Get URLs and return top results
    const topRelated = scored.slice(0, limit);

    return Promise.all(
      topRelated.map(async ({ product: p }) => {
        let imageUrl = p.imageUrl;
        if (imageUrl && !imageUrl.startsWith("http")) {
          try {
            imageUrl =
              (await ctx.storage.getUrl(imageUrl as Id<"_storage">)) ||
              imageUrl;
          } catch {
            // Keep original
          }
        }

        return {
          _id: p._id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          price: p.price,
          imageUrl,
          targetPlugin: (p as any).targetPlugin,
          dawType: p.dawType,
          genre: p.genre,
        };
      })
    );
  },
});

/**
 * Get preset pack by ID (used for email delivery)
 */
export const getProductById = query({
  args: { productId: v.id("digitalProducts") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    // Convert download URL if it's a storage ID
    let downloadUrl = product.downloadUrl;
    if (downloadUrl && !downloadUrl.startsWith("http")) {
      try {
        downloadUrl =
          (await ctx.storage.getUrl(downloadUrl as Id<"_storage">)) ||
          downloadUrl;
      } catch {
        // Keep original
      }
    }

    return {
      ...product,
      downloadUrl,
    };
  },
});
