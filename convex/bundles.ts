import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * COURSE & PRODUCT BUNDLES
 * Create packages of multiple items at discounted prices
 */

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
      .collect();

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
      .collect();

    return bundles;
  },
});

// ===== MUTATIONS =====

export const createBundle = mutation({
  args: {
    storeId: v.id("stores"),
    creatorId: v.string(),
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

    const bundleId = await ctx.db.insert("bundles", {
      storeId: args.storeId,
      creatorId: args.creatorId,
      name: args.name,
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
  },
  handler: async (ctx, args) => {
    const { bundleId, ...updates } = args;
    const bundle = await ctx.db.get(bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

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
    await ctx.db.patch(args.bundleId, {
      isPublished: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const recordBundlePurchase = mutation({
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




