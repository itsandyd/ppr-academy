import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const addProductToWishlist = mutation({
  args: {
    productId: v.id("digitalProducts"),
    productType: v.optional(v.string()),
    notifyOnPriceDrop: v.optional(v.boolean()),
  },
  returns: v.id("wishlists"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_and_productId", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const product = await ctx.db.get(args.productId);
    const priceAtAdd = product?.price;

    return await ctx.db.insert("wishlists", {
      userId,
      productId: args.productId,
      itemType: "product",
      productType: args.productType,
      priceAtAdd,
      notifyOnPriceDrop: args.notifyOnPriceDrop ?? true,
    });
  },
});

export const addCourseToWishlist = mutation({
  args: {
    courseId: v.id("courses"),
    notifyOnPriceDrop: v.optional(v.boolean()),
  },
  returns: v.id("wishlists"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_and_courseId", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const course = await ctx.db.get(args.courseId);
    const priceAtAdd = course?.price;

    return await ctx.db.insert("wishlists", {
      userId,
      courseId: args.courseId,
      itemType: "course",
      priceAtAdd,
      notifyOnPriceDrop: args.notifyOnPriceDrop ?? true,
    });
  },
});

export const addToWishlist = mutation({
  args: {
    productId: v.id("digitalProducts"),
    productType: v.optional(v.string()),
  },
  returns: v.id("wishlists"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_and_productId", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const product = await ctx.db.get(args.productId);

    return await ctx.db.insert("wishlists", {
      userId,
      productId: args.productId,
      itemType: "product",
      productType: args.productType,
      priceAtAdd: product?.price,
      notifyOnPriceDrop: true,
    });
  },
});

export const removeFromWishlist = mutation({
  args: {
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    let item = null;

    if (args.productId) {
      item = await ctx.db
        .query("wishlists")
        .withIndex("by_userId_and_productId", (q) =>
          q.eq("userId", userId).eq("productId", args.productId)
        )
        .first();
    } else if (args.courseId) {
      item = await ctx.db
        .query("wishlists")
        .withIndex("by_userId_and_courseId", (q) =>
          q.eq("userId", userId).eq("courseId", args.courseId)
        )
        .first();
    }

    if (item) {
      await ctx.db.delete(item._id);
      return true;
    }

    return false;
  },
});

export const isInWishlist = query({
  args: {
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const userId = identity.subject;

    let item = null;

    if (args.productId) {
      item = await ctx.db
        .query("wishlists")
        .withIndex("by_userId_and_productId", (q) =>
          q.eq("userId", userId).eq("productId", args.productId)
        )
        .first();
    } else if (args.courseId) {
      item = await ctx.db
        .query("wishlists")
        .withIndex("by_userId_and_courseId", (q) =>
          q.eq("userId", userId).eq("courseId", args.courseId)
        )
        .first();
    }

    return !!item;
  },
});

export const isCourseInWishlist = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }
    const userId = identity.subject;

    const item = await ctx.db
      .query("wishlists")
      .withIndex("by_userId_and_courseId", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId)
      )
      .first();

    return !!item;
  },
});

const wishlistItemValidator = v.object({
  _id: v.id("wishlists"),
  _creationTime: v.number(),
  itemType: v.union(v.literal("product"), v.literal("course")),
  productId: v.optional(v.id("digitalProducts")),
  courseId: v.optional(v.id("courses")),
  productType: v.optional(v.string()),
  priceAtAdd: v.optional(v.number()),
  notifyOnPriceDrop: v.optional(v.boolean()),
  title: v.string(),
  slug: v.optional(v.string()),
  currentPrice: v.number(),
  coverImageUrl: v.optional(v.string()),
  category: v.string(),
  priceDropped: v.boolean(),
  priceDropAmount: v.optional(v.number()),
});

export const getUserWishlist = query({
  args: {
    sortBy: v.optional(
      v.union(
        v.literal("date_desc"),
        v.literal("date_asc"),
        v.literal("price_asc"),
        v.literal("price_desc"),
        v.literal("name_asc"),
        v.literal("name_desc")
      )
    ),
    filterType: v.optional(v.union(v.literal("all"), v.literal("product"), v.literal("course"))),
    filterCategory: v.optional(v.string()),
  },
  returns: v.array(wishlistItemValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    let wishlistItems = await ctx.db
      .query("wishlists")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (args.filterType && args.filterType !== "all") {
      wishlistItems = wishlistItems.filter((item) => item.itemType === args.filterType);
    }

    const result = await Promise.all(
      wishlistItems.map(async (item) => {
        if (item.itemType === "course" && item.courseId) {
          const course = await ctx.db.get(item.courseId);
          if (!course) return null;

          const currentPrice = course.price ?? 0;
          const priceDropped = item.priceAtAdd !== undefined && currentPrice < item.priceAtAdd;

          return {
            _id: item._id,
            _creationTime: item._creationTime,
            itemType: "course" as const,
            courseId: item.courseId,
            productType: item.productType,
            priceAtAdd: item.priceAtAdd,
            notifyOnPriceDrop: item.notifyOnPriceDrop,
            title: course.title,
            slug: course.slug,
            currentPrice,
            coverImageUrl: course.imageUrl,
            category: course.category ?? "Course",
            priceDropped,
            priceDropAmount: priceDropped ? item.priceAtAdd! - currentPrice : undefined,
          };
        } else if (item.productId) {
          const product = await ctx.db.get(item.productId);
          if (!product) return null;

          const currentPrice = product.price;
          const priceDropped = item.priceAtAdd !== undefined && currentPrice < item.priceAtAdd;

          return {
            _id: item._id,
            _creationTime: item._creationTime,
            itemType: "product" as const,
            productId: item.productId,
            productType: item.productType,
            priceAtAdd: item.priceAtAdd,
            notifyOnPriceDrop: item.notifyOnPriceDrop,
            title: product.title,
            slug: product.slug,
            currentPrice,
            coverImageUrl: product.imageUrl,
            category: product.category ?? "Digital Product",
            priceDropped,
            priceDropAmount: priceDropped ? item.priceAtAdd! - currentPrice : undefined,
          };
        }
        return null;
      })
    );

    let filtered = result.filter((item): item is NonNullable<typeof item> => item !== null);

    if (args.filterCategory) {
      filtered = filtered.filter((item) => item.category === args.filterCategory);
    }

    const sortBy = args.sortBy ?? "date_desc";
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return b._creationTime - a._creationTime;
        case "date_asc":
          return a._creationTime - b._creationTime;
        case "price_asc":
          return a.currentPrice - b.currentPrice;
        case "price_desc":
          return b.currentPrice - a.currentPrice;
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  },
});

export const getWishlistCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }
    const userId = identity.subject;

    const items = await ctx.db
      .query("wishlists")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return items.length;
  },
});

export const getWishlistCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const wishlistItems = await ctx.db
      .query("wishlists")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const categories = new Set<string>();

    for (const item of wishlistItems) {
      if (item.itemType === "course" && item.courseId) {
        const course = await ctx.db.get(item.courseId);
        if (course?.category) categories.add(course.category);
      } else if (item.productId) {
        const product = await ctx.db.get(item.productId);
        if (product?.category) categories.add(product.category);
      }
    }

    return Array.from(categories).sort();
  },
});

export const togglePriceDropNotification = mutation({
  args: {
    wishlistId: v.id("wishlists"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.wishlistId);
    if (!item || item.userId !== identity.subject) {
      throw new Error("Wishlist item not found");
    }

    await ctx.db.patch(args.wishlistId, {
      notifyOnPriceDrop: args.enabled,
    });

    return null;
  },
});

export const getWishlistItemsWithPriceDrops = query({
  args: {},
  returns: v.array(wishlistItemValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const wishlistItems = await ctx.db
      .query("wishlists")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const result = await Promise.all(
      wishlistItems.map(async (item) => {
        if (item.itemType === "course" && item.courseId) {
          const course = await ctx.db.get(item.courseId);
          if (!course) return null;

          const currentPrice = course.price ?? 0;
          const priceDropped = item.priceAtAdd !== undefined && currentPrice < item.priceAtAdd;

          if (!priceDropped) return null;

          return {
            _id: item._id,
            _creationTime: item._creationTime,
            itemType: "course" as const,
            courseId: item.courseId,
            productType: item.productType,
            priceAtAdd: item.priceAtAdd,
            notifyOnPriceDrop: item.notifyOnPriceDrop,
            title: course.title,
            slug: course.slug,
            currentPrice,
            coverImageUrl: course.imageUrl,
            category: course.category ?? "Course",
            priceDropped: true,
            priceDropAmount: item.priceAtAdd! - currentPrice,
          };
        } else if (item.productId) {
          const product = await ctx.db.get(item.productId);
          if (!product) return null;

          const currentPrice = product.price;
          const priceDropped = item.priceAtAdd !== undefined && currentPrice < item.priceAtAdd;

          if (!priceDropped) return null;

          return {
            _id: item._id,
            _creationTime: item._creationTime,
            itemType: "product" as const,
            productId: item.productId,
            productType: item.productType,
            priceAtAdd: item.priceAtAdd,
            notifyOnPriceDrop: item.notifyOnPriceDrop,
            title: product.title,
            slug: product.slug,
            currentPrice,
            coverImageUrl: product.imageUrl,
            category: product.category ?? "Digital Product",
            priceDropped: true,
            priceDropAmount: item.priceAtAdd! - currentPrice,
          };
        }
        return null;
      })
    );

    return result.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});
