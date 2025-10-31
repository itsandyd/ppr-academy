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
      ...allCourses.map(c => ({ ...c, contentType: 'course' })),
      ...allProducts.map(p => ({ ...p, contentType: 'product' })),
    ];

    // Shuffle and limit
    return combined
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
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
    // Count unique stores (creators)
    const stores = await ctx.db.query("stores").collect();
    const totalCreators = stores.length;

    // Count published courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    const totalCourses = courses.length;

    // Count published products
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    const totalProducts = products.length;

    // Count unique students (users who have made purchases)
    const purchases = await ctx.db.query("purchases").collect();
    const uniqueStudents = new Set(purchases.map(p => p.userId));
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
    // Get all stores
    const stores = await ctx.db.query("stores").collect();
    
    if (stores.length === 0) {
      return null;
    }

    // Calculate stats for each store
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        // Count published courses
        const coursesCount = await ctx.db
          .query("courses")
          .filter((q) => 
            q.and(
              q.eq(q.field("storeId"), store._id),
              q.eq(q.field("isPublished"), true)
            )
          )
          .collect()
          .then(c => c.length);

        // Count published products
        const productsCount = await ctx.db
          .query("digitalProducts")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect()
          .then(p => p.length);

        // Count unique students for this store
        const storePurchases = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect();
        const uniqueStudents = new Set(storePurchases.map(p => p.userId));

        return {
          store,
          totalProducts: coursesCount + productsCount,
          totalStudents: uniqueStudents.size,
        };
      })
    );

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
  returns: v.array(v.object({
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
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Get only public stores with published profiles
    const allStores = await ctx.db
      .query("stores")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .filter((q) => q.eq(q.field("isPublishedProfile"), true))
      .collect();
    
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

        // Count published courses
        const courses = await ctx.db
          .query("courses")
          .filter((q) => 
            q.and(
              q.eq(q.field("storeId"), store._id),
              q.eq(q.field("isPublished"), true)
            )
          )
          .collect();

        // Count published products
        const products = await ctx.db
          .query("digitalProducts")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect();

        // Count unique students
        const storePurchases = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect();
        const uniqueStudents = new Set(storePurchases.map(p => p.userId));

        // Collect unique categories from courses and products
        const categories = new Set<string>();
        courses.forEach(c => {
          if (c.category) categories.add(c.category);
        });
        products.forEach(p => {
          if (p.category) categories.add(p.category);
        });

        return {
          _id: store._id,
          name: store.name || user?.name || "Creator",
          slug: store.slug,
          bio: store.bio,
          avatar: user?.imageUrl || store.logoUrl,
          bannerImage: store.bannerImage,
          totalProducts: products.length,
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
    contentType: v.optional(v.union(
      v.literal("all"),
      v.literal("courses"),
      v.literal("products"),
      v.literal("coaching"),
      v.literal("sample-packs")
    )),
    category: v.optional(v.string()),
    priceRange: v.optional(v.union(
      v.literal("free"),
      v.literal("under-50"),
      v.literal("50-100"),
      v.literal("over-100")
    )),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("popular"),
      v.literal("price-low"),
      v.literal("price-high")
    )),
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
      priceRange,
      sortBy = "newest",
      limit = 20,
      offset = 0,
    } = args;

    let allResults: Array<any> = [];

    // Fetch courses
    if (contentType === "all" || contentType === "courses") {
      const courses = await ctx.db
        .query("courses")
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();

      const coursesWithDetails = await Promise.all(
        courses.map(async (course) => {
          // Get enrollment count
          const enrollments = await ctx.db
            .query("purchases")
            .filter((q) => q.eq(q.field("courseId"), course._id))
            .collect();
          
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
            thumbnail: course.imageUrl,
            category: course.category,
            subcategory: course.subcategory,
            tags: course.tags,
            skillLevel: course.skillLevel,
            contentType: "course" as const,
            enrollmentCount: enrollments.length,
            creatorName,
            creatorAvatar,
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
        .collect();

      const digitalProducts = products.filter(p => 
        (p as any).productType !== "coaching"
      );

      const productsWithDetails = await Promise.all(
        digitalProducts.map(async (product) => {
          const purchases = await ctx.db
            .query("purchases")
            .filter((q) => q.eq(q.field("productId"), product._id))
            .collect();
          
          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          const stores = await ctx.db.query("stores").collect();
          const store = stores.find(s => s._id === product.storeId);
          
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
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            downloadUrl: product.downloadUrl,
            url: (product as any).url,
            buttonLabel: (product as any).buttonLabel,
            category: product.category,
            contentType: "product" as const,
            downloadCount: purchases.length,
            creatorName,
            creatorAvatar,
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
        .collect();

      const coachingProducts = allProducts.filter(p => 
        (p as any).productType === "coaching"
      );

      const coachingWithDetails = await Promise.all(
        coachingProducts.map(async (product) => {
          const purchases = await ctx.db
            .query("purchases")
            .filter((q) => q.eq(q.field("productId"), product._id))
            .collect();
          
          let creatorName = "Creator";
          let creatorAvatar: string | undefined = undefined;

          const stores = await ctx.db.query("stores").collect();
          const store = stores.find(s => s._id === product.storeId);
          
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
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            duration: (product as any).duration,
            sessionType: (product as any).sessionType,
            contentType: "coaching" as const,
            bookingCount: purchases.length,
            creatorName,
            creatorAvatar,
          };
        })
      );

      allResults.push(...coachingWithDetails);
    }

    // Apply filters
    let filtered = allResults;

    // Search term filter
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.creatorName?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Price range filter
    if (priceRange) {
      filtered = filtered.filter(item => {
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

    // Get categories from courses
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    courses.forEach(c => {
      if (c.category) categories.add(c.category);
    });

    // Get categories from products
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
    products.forEach(p => {
      if (p.category) categories.add(p.category);
    });

    return Array.from(categories).sort();
  },
});
