// Marketplace queries for the hybrid homepage
// Provides featured content, platform stats, and creator spotlight

import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get featured content (mix of courses and products)
 * Returns up to `limit` featured items that have been marked as featured
 */
export const getFeaturedContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()), // We'll use v.any() since we're combining different types
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    // Get featured courses (if they have a featured field)
    const allCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(3);

    // Get featured products (if they have a featured field)
    const allProducts = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(3);

    // Combine and tag with content type
    const combined: Array<any> = [
      ...allCourses.map((c) => ({ ...c, contentType: "course" })),
      ...allProducts.map((p) => ({ ...p, contentType: "product" })),
    ];

    // Shuffle and limit
    return combined.sort(() => Math.random() - 0.5).slice(0, limit);
  },
});

/**
 * Get platform statistics for social proof
 * Returns counts of creators, courses, products, and students
 */
export const getPlatformStats = query({
  args: {},
  returns: v.object({
    totalCreators: v.number(),
    totalCourses: v.number(),
    totalProducts: v.number(),
    totalStudents: v.number(),
  }),
  handler: async (ctx) => {
    // Use bounded queries to limit bandwidth — only need counts
    const stores = await ctx.db.query("stores").take(500);
    const totalCreators = stores.length;

    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);
    const totalCourses = courses.length;

    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);
    const totalProducts = products.length;

    // Count unique students — cap at 1000 purchases to limit bandwidth
    const purchases = await ctx.db.query("purchases").take(1000);
    const uniqueStudents = new Set(purchases.map((p) => p.userId));
    const totalStudents = uniqueStudents.size;

    return {
      totalCreators,
      totalCourses,
      totalProducts,
      totalStudents,
    };
  },
});

/**
 * Get creator spotlight - features a top creator
 * Rotates based on most products or can be manually selected
 */
export const getCreatorSpotlight = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      slug: v.string(),
      bio: v.optional(v.string()),
      avatar: v.optional(v.string()),
      totalProducts: v.number(),
      totalStudents: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // Get stores — bounded to limit bandwidth
    const stores = await ctx.db.query("stores").take(100);

    if (stores.length === 0) {
      return null;
    }

    // Fetch courses and products once (not per-store) to avoid N+1 pattern
    const allCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);

    const allProducts = await ctx.db
      .query("digitalProducts")
      .take(500);

    const allPurchases = await ctx.db
      .query("purchases")
      .take(1000);

    // Calculate stats for each store from the pre-fetched data
    const storesWithStats = stores.map((store) => {
      const coursesCount = allCourses.filter((c) => c.storeId === store._id).length;
      const productsCount = allProducts.filter((p) => p.storeId === store._id).length;
      const storePurchases = allPurchases.filter((p) => p.storeId === store._id);
      const uniqueStudents = new Set(storePurchases.map((p) => p.userId));

      return {
        store,
        totalProducts: coursesCount + productsCount,
        totalStudents: uniqueStudents.size,
      };
    });

    // Sort by total products (most active creator)
    storesWithStats.sort((a, b) => b.totalProducts - a.totalProducts);

    const topStore = storesWithStats[0];
    if (!topStore || topStore.totalProducts === 0) {
      return null;
    }

    // Get user info for this store
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), topStore.store.userId))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      name: user.name || topStore.store.name || "Creator",
      slug: topStore.store.slug,
      bio: topStore.store.bio,
      avatar: user.imageUrl,
      totalProducts: topStore.totalProducts,
      totalStudents: topStore.totalStudents,
    };
  },
});

/**
 * Get all creators with their stores
 * Used for browsing creators in the marketplace
 */
export const getAllCreators = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("stores"),
      name: v.string(),
      slug: v.string(),
      bio: v.optional(v.string()),
      avatar: v.optional(v.string()),
      bannerImage: v.optional(v.string()),
      totalProducts: v.number(),
      totalCourses: v.number(),
      totalStudents: v.number(),
      categories: v.array(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Get only public stores with published profiles (bounded)
    const allStores = await ctx.db
      .query("stores")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("isPublishedProfile"), true))
      .take(500);

    // Paginate
    const stores = allStores.slice(offset, offset + limit);

    // Enrich with stats
    const creatorsWithStats = await Promise.all(
      stores.map(async (store) => {
        // Get user info
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), store.userId))
          .first();

        // Count published courses using index
        const allCourses = await ctx.db
          .query("courses")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(500);
        const courses = allCourses.filter((c) => c.isPublished === true);

        // Count published products using index
        const products = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(500);

        // Count sample packs using index
        const samplePacks = await ctx.db
          .query("samplePacks")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(500);

        // Count unique students using index
        const storePurchases = await ctx.db
          .query("purchases")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(1000);
        const uniqueStudents = new Set(storePurchases.map((p) => p.userId));

        // Collect unique categories from courses and products
        const categories = new Set<string>();
        courses.forEach((c) => {
          if (c.category) categories.add(c.category);
        });
        products.forEach((p) => {
          if (p.category) categories.add(p.category);
        });
        samplePacks.forEach((sp) => {
          if (sp.categories) {
            sp.categories.forEach((cat) => categories.add(cat));
          }
        });

        return {
          _id: store._id,
          name: store.name || user?.name || "Creator",
          slug: store.slug,
          bio: store.bio,
          avatar: user?.imageUrl || store.logoUrl,
          bannerImage: store.bannerImage,
          totalProducts: products.length + samplePacks.length, // Include both digital products and sample packs
          totalCourses: courses.length,
          totalStudents: uniqueStudents.size,
          categories: Array.from(categories),
        };
      })
    );

    return creatorsWithStats;
  },
});

/**
 * Search marketplace content
 * Filters by type, category, price range, etc.
 */
export const searchMarketplace = query({
  args: {
    searchTerm: v.optional(v.string()),
    contentType: v.optional(
      v.union(
        v.literal("all"),
        v.literal("courses"),
        v.literal("products"),
        v.literal("coaching"),
        v.literal("sample-packs"),
        v.literal("plugins"),
        v.literal("ableton-racks"),
        v.literal("bundles")
      )
    ),
    category: v.optional(v.string()),
    specificCategories: v.optional(v.array(v.string())), // Array of specific category names (Reverb, Delay, Synth, etc.)
    priceRange: v.optional(
      v.union(v.literal("free"), v.literal("under-50"), v.literal("50-100"), v.literal("over-100"))
    ),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("popular"),
        v.literal("price-low"),
        v.literal("price-high")
      )
    ),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    results: v.array(v.any()),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const {
      searchTerm,
      contentType = "all",
      category,
      specificCategories,
      priceRange,
      sortBy = "newest",
      limit = 20,
      offset = 0,
    } = args;

    // Helper function to convert storage ID to URL
    const getImageUrl = async (imageUrl: string | undefined): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl; // Already a URL
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    let allResults: Array<any> = [];

    // Fetch courses
    if (contentType === "all" || contentType === "courses") {
      const courses = await ctx.db
        .query("courses")
        .filter((q) => q.eq(q.field("isPublished"), true))
        .take(200);

      const coursesWithDetails = await Promise.all(
        courses.map(async (course) => {
          // Get enrollment count using index
          const enrollments = await ctx.db
            .query("purchases")
            .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
            .take(100);

          // Get creator info
          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          if (course.storeId) {
            const store = await ctx.db.get(course.storeId as Id<"stores">);
            if (store) {
              const user = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("clerkId"), store.userId))
                .first();
              if (user) {
                creatorName = user.name || store.name || "Creator";
                creatorAvatar = user.imageUrl;
              }
            }
          }

          return {
            _id: course._id,
            _creationTime: course._creationTime,
            title: course.title,
            slug: course.slug || course.title.toLowerCase().replace(/\s+/g, "-"),
            description: course.description,
            price: course.price || 0,
            thumbnail: await getImageUrl(course.imageUrl),
            category: course.category,
            subcategory: course.subcategory,
            tags: course.tags,
            skillLevel: course.skillLevel,
            contentType: "course" as const,
            enrollmentCount: enrollments.length,
            creatorName,
            creatorAvatar: await getImageUrl(creatorAvatar),
          };
        })
      );

      allResults.push(...coursesWithDetails);
    }

    // Fetch digital products
    if (contentType === "all" || contentType === "products") {
      const products = await ctx.db
        .query("digitalProducts")
        .filter((q) => q.eq(q.field("isPublished"), true))
        .take(200);

      const digitalProducts = products.filter(
        (p) =>
          (p as any).productType !== "coaching" &&
          (p as any).productType !== "abletonRack" &&
          (p as any).productType !== "abletonPreset"
      );

      const productsWithDetails = await Promise.all(
        digitalProducts.map(async (product) => {
          const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_productId", (q) => q.eq("productId", product._id))
            .take(100);

          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          const store = product.storeId
            ? await ctx.db.get(product.storeId as Id<"stores">)
            : null;

          if (store) {
            const user = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("clerkId"), store.userId))
              .first();
            if (user) {
              creatorName = user.name || store.name || "Creator";
              creatorAvatar = user.imageUrl;
            }
          }

          return {
            _id: product._id,
            _creationTime: product._creationTime,
            title: product.title,
            slug: (product as any).slug,
            description: product.description,
            price: product.price,
            imageUrl: await getImageUrl(product.imageUrl),
            downloadUrl: await getImageUrl(product.downloadUrl),
            url: (product as any).url,
            buttonLabel: (product as any).buttonLabel,
            category: product.category,
            contentType: "product" as const,
            downloadCount: purchases.length,
            creatorName,
            creatorAvatar: await getImageUrl(creatorAvatar),
          };
        })
      );

      allResults.push(...productsWithDetails);
    }

    // Fetch coaching products
    if (contentType === "all" || contentType === "coaching") {
      const allProducts = await ctx.db
        .query("digitalProducts")
        .filter((q) => q.eq(q.field("isPublished"), true))
        .take(200);

      const coachingProducts = allProducts.filter((p) => (p as any).productType === "coaching");

      const coachingWithDetails = await Promise.all(
        coachingProducts.map(async (product) => {
          const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_productId", (q) => q.eq("productId", product._id))
            .take(100);

          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          const store = product.storeId
            ? await ctx.db.get(product.storeId as Id<"stores">)
            : null;

          if (store) {
            const user = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("clerkId"), store.userId))
              .first();
            if (user) {
              creatorName = user.name || store.name || "Creator";
              creatorAvatar = user.imageUrl;
            }
          }

          return {
            _id: product._id,
            _creationTime: product._creationTime,
            title: product.title,
            slug: (product as any).slug,
            description: product.description,
            price: product.price,
            imageUrl: await getImageUrl(product.imageUrl),
            duration: (product as any).duration,
            sessionType: (product as any).sessionType,
            contentType: "coaching" as const,
            bookingCount: purchases.length,
            creatorName,
            creatorAvatar: await getImageUrl(creatorAvatar),
          };
        })
      );

      allResults.push(...coachingWithDetails);
    }

    // Fetch plugins
    if (contentType === "all" || contentType === "plugins") {
      const plugins = await ctx.db
        .query("plugins")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .take(100);

      const pluginsWithDetails = await Promise.all(
        plugins.map(async (plugin) => {
          let categoryName: string | undefined;
          let typeName: string | undefined;
          let specificCategoryName: string | undefined;

          // Get general category name (Effects, Instruments, Studio Tools)
          if (plugin.categoryId) {
            const category = await ctx.db.get(plugin.categoryId);
            categoryName = category?.name;
          }

          // Get plugin type name
          if (plugin.pluginTypeId) {
            const type = await ctx.db.get(plugin.pluginTypeId);
            typeName = type?.name;
          }

          // Get specific category name (Reverb, Delay, Synth, etc.)
          // Check effectCategoryId first, then instrumentCategoryId, then studioToolCategoryId
          if (plugin.effectCategoryId) {
            const effectCategory = await ctx.db.get(plugin.effectCategoryId);
            specificCategoryName = effectCategory?.name;
          } else if (plugin.instrumentCategoryId) {
            const instrumentCategory = await ctx.db.get(plugin.instrumentCategoryId);
            specificCategoryName = instrumentCategory?.name;
          } else if (plugin.studioToolCategoryId) {
            const studioToolCategory = await ctx.db.get(plugin.studioToolCategoryId);
            specificCategoryName = studioToolCategory?.name;
          }

          return {
            _id: plugin._id,
            _creationTime: plugin.createdAt,
            title: plugin.name,
            slug: plugin.slug || plugin.name.toLowerCase().replace(/\s+/g, "-"),
            description: plugin.description,
            price: plugin.price || 0,
            imageUrl: plugin.image,
            author: plugin.author,
            category: specificCategoryName || categoryName, // Use specific category if available, otherwise general
            generalCategory: categoryName, // Keep general category separately
            pluginType: typeName,
            tags: plugin.tags || [], // Include tags in results
            pricingType: plugin.pricingType,
            purchaseUrl: plugin.purchaseUrl,
            optInFormUrl: plugin.optInFormUrl,
            videoUrl: plugin.videoUrl,
            audioUrl: plugin.audioUrl,
            contentType: "plugin" as const,
            creatorName: plugin.author || "Plugin Author",
          };
        })
      );

      allResults.push(...pluginsWithDetails);
    }

    // Fetch Ableton racks
    if (contentType === "all" || contentType === "ableton-racks") {
      const racks = await ctx.db
        .query("digitalProducts")
        .filter((q) =>
          q.and(
            q.eq(q.field("isPublished"), true),
            q.or(
              q.eq(q.field("productType"), "abletonRack"),
              q.eq(q.field("productType"), "abletonPreset")
            )
          )
        )
        .take(200);

      const racksWithDetails = await Promise.all(
        racks.map(async (rack) => {
          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          const store = rack.storeId
            ? await ctx.db.get(rack.storeId as Id<"stores">)
            : null;

          if (store) {
            const user = await ctx.db
              .query("users")
              .filter((q) => q.eq(q.field("clerkId"), store.userId))
              .first();
            if (user) {
              creatorName = user.name || store.name || "Creator";
              creatorAvatar = user.imageUrl;
            }
          }

          return {
            _id: rack._id,
            _creationTime: rack._creationTime,
            title: rack.title,
            slug: (rack as any).slug,
            description: rack.description,
            price: rack.price || 0,
            thumbnail: await getImageUrl(rack.imageUrl),
            category: rack.rackType,
            contentType: "ableton-rack" as const,
            creatorName,
            creatorAvatar: await getImageUrl(creatorAvatar),
            abletonVersion: rack.abletonVersion,
            rackType: rack.rackType,
            cpuLoad: rack.cpuLoad,
            complexity: rack.complexity,
            genre: rack.genre,
            demoAudioUrl: await getImageUrl(rack.demoAudioUrl),
          };
        })
      );

      allResults.push(...racksWithDetails);
    }

    // Fetch bundles
    if (contentType === "all" || contentType === "bundles") {
      const bundles = await ctx.db
        .query("bundles")
        .filter((q) => q.eq(q.field("isPublished"), true))
        .take(200);

      const bundlesWithDetails = await Promise.all(
        bundles.map(async (bundle) => {
          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          if (bundle.storeId) {
            const store = await ctx.db.get(bundle.storeId);
            if (store) {
              const user = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("clerkId"), store.userId))
                .first();
              if (user) {
                creatorName = user.name || store.name || "Creator";
                creatorAvatar = user.imageUrl;
              }
            }
          }

          // Count bundle purchases using index
          const purchases = await ctx.db
            .query("purchases")
            .filter((q) => q.eq(q.field("bundleId"), bundle._id))
            .take(500);

          return {
            _id: bundle._id,
            _creationTime: bundle._creationTime,
            title: bundle.name,
            slug: bundle.slug || bundle._id,
            description: bundle.description,
            price: bundle.bundlePrice,
            originalPrice: bundle.originalPrice,
            discountPercentage: bundle.discountPercentage,
            savings: bundle.savings,
            imageUrl: await getImageUrl(bundle.imageUrl),
            contentType: "bundle" as const,
            bundleType: bundle.bundleType,
            courseCount: bundle.courseIds?.length || 0,
            productCount: bundle.productIds?.length || 0,
            purchaseCount: purchases.length,
            creatorName,
            creatorAvatar: await getImageUrl(creatorAvatar),
          };
        })
      );

      allResults.push(...bundlesWithDetails);
    }

    // Apply filters
    let filtered = allResults;

    // Search term filter
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search) ||
          item.creatorName?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Specific Categories filter (for plugins - Effect/Instrument/Studio Tool specific categories)
    if (specificCategories && specificCategories.length > 0) {
      filtered = filtered.filter((item) => {
        if (item.contentType === "plugin" && item.category) {
          // Check if plugin's category name matches any of the selected specific categories
          return specificCategories.includes(item.category);
        }
        return false; // Non-plugins won't match specific category filters
      });
    }

    // Price range filter
    if (priceRange) {
      filtered = filtered.filter((item) => {
        const price = item.price || 0;
        switch (priceRange) {
          case "free":
            return price === 0;
          case "under-50":
            return price > 0 && price < 50;
          case "50-100":
            return price >= 50 && price <= 100;
          case "over-100":
            return price > 100;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b._creationTime || 0) - (a._creationTime || 0);
        case "popular":
          const aCount = a.enrollmentCount || a.downloadCount || a.bookingCount || 0;
          const bCount = b.enrollmentCount || b.downloadCount || b.bookingCount || 0;
          return bCount - aCount;
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    const total = filtered.length;
    const results = filtered.slice(offset, offset + limit);

    return {
      results,
      total,
    };
  },
});

/**
 * Get unique categories from all published content
 */
export const getMarketplaceCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const categories = new Set<string>();

    // Get categories from courses (bounded)
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);
    courses.forEach((c) => {
      if (c.category) categories.add(c.category);
    });

    // Get categories from products (bounded)
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);
    products.forEach((p) => {
      if (p.category) categories.add(p.category);
    });

    return Array.from(categories).sort();
  },
});
