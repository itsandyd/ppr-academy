import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireStoreOwner } from "./lib/auth";

/**
 * COURSE & PRODUCT BUNDLES
 * Create packages of multiple items at discounted prices
 */

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ===== QUERIES =====

export const getBundlesByStore = query({
  args: { 
    storeId: v.id("stores"),
    includeUnpublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let bundles = await ctx.db
      .query("bundles")
      .withIndex("by_store", (q: any) => q.eq("storeId", args.storeId))
      .take(200);

    if (!args.includeUnpublished) {
      bundles = bundles.filter((b) => b.isPublished);
    }

    return bundles.sort((a, b) => b.totalPurchases - a.totalPurchases);
  },
});

export const getBundleDetails = query({
  args: { bundleId: v.id("bundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) return null;

    // Get course details
    const courses = await Promise.all(
      bundle.courseIds.map((id) => ctx.db.get(id))
    );

    // Get product details
    const products = await Promise.all(
      bundle.productIds.map((id) => ctx.db.get(id))
    );

    return {
      ...bundle,
      courses: courses.filter(Boolean),
      products: products.filter(Boolean),
    };
  },
});

export const getPublishedBundles = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const bundles = await ctx.db
      .query("bundles")
      .withIndex("by_store", (q: any) =>
        q.eq("storeId", args.storeId).eq("isPublished", true)
      )
      .filter((q: any) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("availableFrom"), undefined),
            q.lte(q.field("availableFrom"), now)
          ),
          q.or(
            q.eq(q.field("availableUntil"), undefined),
            q.gte(q.field("availableUntil"), now)
          )
        )
      )
      .take(200);

    return bundles;
  },
});

// Get all published bundles for marketplace (across all stores)
export const getAllPublishedBundles = query({
  args: {
    searchQuery: v.optional(v.string()),
    bundleType: v.optional(v.union(
      v.literal("course_bundle"),
      v.literal("mixed"),
      v.literal("product_bundle")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let bundles = await ctx.db
      .query("bundles")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("isPublished"), true),
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("availableFrom"), undefined),
            q.lte(q.field("availableFrom"), now)
          ),
          q.or(
            q.eq(q.field("availableUntil"), undefined),
            q.gte(q.field("availableUntil"), now)
          )
        )
      )
      .take(200);

    // Filter by bundle type
    if (args.bundleType) {
      bundles = bundles.filter((b) => b.bundleType === args.bundleType);
    }

    // Filter by search query
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      bundles = bundles.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query)
      );
    }

    // Helper function to convert storage ID to URL
    const getImageUrl = async (imageUrl: string | undefined): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    // Enrich with creator info
    const bundlesWithCreator = await Promise.all(
      bundles.map(async (bundle) => {
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").take(200);
        const store = stores.find((s) => s._id === bundle.storeId);

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

        const imageUrl = await getImageUrl(bundle.imageUrl);
        const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

        return {
          ...bundle,
          imageUrl,
          creatorName,
          creatorAvatar: convertedCreatorAvatar,
        };
      })
    );

    return bundlesWithCreator.sort((a, b) => b.totalPurchases - a.totalPurchases);
  },
});

// Get bundle by slug for marketplace detail page
export const getBundleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (!bundle) return null;

    // Get course details
    const courses = await Promise.all(
      bundle.courseIds.map((id) => ctx.db.get(id))
    );

    // Get product details
    const products = await Promise.all(
      bundle.productIds.map((id) => ctx.db.get(id))
    );

    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;
    let stripeConnectAccountId: string | undefined = undefined;

    const stores = await ctx.db.query("stores").take(200);
    const store = stores.find((s) => s._id === bundle.storeId);

    if (store) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), store.userId))
        .first();
      if (user) {
        creatorName = user.name || store.name || "Creator";
        creatorAvatar = user.imageUrl;
        stripeConnectAccountId = user.stripeConnectAccountId;
      } else {
        creatorName = store.name || "Creator";
      }
    }

    // Convert storage IDs to URLs
    const getImageUrl = async (imageUrl: string | undefined): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    const imageUrl = await getImageUrl(bundle.imageUrl);
    const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

    return {
      ...bundle,
      imageUrl,
      courses: courses.filter(Boolean),
      products: products.filter(Boolean),
      creatorName,
      creatorAvatar: convertedCreatorAvatar,
      stripeConnectAccountId,
    };
  },
});

// ===== MUTATIONS =====

export const createBundle = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
    description: v.string(),
    bundleType: v.union(v.literal("course_bundle"), v.literal("mixed"), v.literal("product_bundle")),
    courseIds: v.optional(v.array(v.id("courses"))),
    productIds: v.optional(v.array(v.id("digitalProducts"))),
    bundlePrice: v.number(),
    imageUrl: v.optional(v.string()),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
    maxPurchases: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireStoreOwner(ctx, args.storeId);
    const creatorId = identity.subject;
    // Calculate original price
    let originalPrice = 0;

    if (args.courseIds) {
      const courses = await Promise.all(args.courseIds.map((id) => ctx.db.get(id)));
      originalPrice += courses.reduce((sum, c) => sum + (c?.price || 0), 0);
    }

    if (args.productIds) {
      const products = await Promise.all(args.productIds.map((id) => ctx.db.get(id)));
      originalPrice += products.reduce((sum, p) => sum + (p?.price || 0), 0);
    }

    const savings = originalPrice - args.bundlePrice;
    const discountPercentage = Math.round((savings / originalPrice) * 100);

    const now = Date.now();

    // Generate a unique slug
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for slug uniqueness and append counter if needed
    while (true) {
      const existing = await ctx.db
        .query("bundles")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .first();
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const bundleId = await ctx.db.insert("bundles", {
      storeId: args.storeId,
      creatorId,
      name: args.name,
      slug,
      description: args.description,
      bundleType: args.bundleType,
      courseIds: args.courseIds || [],
      productIds: args.productIds || [],
      originalPrice,
      bundlePrice: args.bundlePrice,
      discountPercentage,
      savings,
      imageUrl: args.imageUrl,
      isActive: true,
      isPublished: false,
      totalPurchases: 0,
      totalRevenue: 0,
      availableFrom: args.availableFrom,
      availableUntil: args.availableUntil,
      maxPurchases: args.maxPurchases,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, bundleId };
  },
});

export const updateBundle = mutation({
  args: {
    bundleId: v.id("bundles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    bundlePrice: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    courseIds: v.optional(v.array(v.id("courses"))),
    productIds: v.optional(v.array(v.id("digitalProducts"))),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
    maxPurchases: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    // Follow Gate settings
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(
      v.object({
        requireEmail: v.optional(v.boolean()),
        requireInstagram: v.optional(v.boolean()),
        requireTiktok: v.optional(v.boolean()),
        requireYoutube: v.optional(v.boolean()),
        requireSpotify: v.optional(v.boolean()),
        minFollowsRequired: v.optional(v.number()),
      })
    ),
    followGateSocialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
        twitter: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
      })
    ),
    followGateMessage: v.optional(v.string()),
    // Pinning
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { bundleId, ...updates } = args;
    const bundle = await ctx.db.get(bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

    await requireStoreOwner(ctx, bundle.storeId);

    // Recalculate prices if items or price changed
    if (updates.courseIds || updates.productIds || updates.bundlePrice) {
      const courseIds = updates.courseIds || bundle.courseIds;
      const productIds = updates.productIds || bundle.productIds;

      let originalPrice = 0;

      const courses = await Promise.all(courseIds.map((id) => ctx.db.get(id)));
      originalPrice += courses.reduce((sum, c) => sum + (c?.price || 0), 0);

      const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));
      originalPrice += products.reduce((sum, p) => sum + (p?.price || 0), 0);

      const bundlePrice = updates.bundlePrice || bundle.bundlePrice;
      const savings = originalPrice - bundlePrice;
      const discountPercentage = Math.round((savings / originalPrice) * 100);

      await ctx.db.patch(bundleId, {
        ...updates,
        originalPrice,
        savings,
        discountPercentage,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(bundleId, {
        ...updates,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const publishBundle = mutation({
  args: { bundleId: v.id("bundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) throw new Error("Bundle not found");
    await requireStoreOwner(ctx, bundle.storeId);
    await ctx.db.patch(args.bundleId, {
      isPublished: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unpublishBundle = mutation({
  args: { bundleId: v.id("bundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) throw new Error("Bundle not found");
    await requireStoreOwner(ctx, bundle.storeId);
    await ctx.db.patch(args.bundleId, {
      isPublished: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const recordBundlePurchase = internalMutation({
  args: {
    bundleId: v.id("bundles"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

    await ctx.db.patch(args.bundleId, {
      totalPurchases: bundle.totalPurchases + 1,
      totalRevenue: bundle.totalRevenue + args.amount,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteBundle = mutation({
  args: { bundleId: v.id("bundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

    await requireStoreOwner(ctx, bundle.storeId);

    if (bundle.totalPurchases > 0) {
      // Soft delete
      await ctx.db.patch(args.bundleId, {
        isActive: false,
        isPublished: false,
        updatedAt: Date.now(),
      });
      return { success: true, message: "Bundle deactivated (has purchases)" };
    }

    // Hard delete if never purchased
    await ctx.db.delete(args.bundleId);
    return { success: true, message: "Bundle deleted" };
  },
});





