import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStorePurchases = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      _creationTime: v.number(),
      userId: v.string(),
      productType: v.union(
        v.literal("digitalProduct"),
        v.literal("course"),
        v.literal("coaching"),
        v.literal("bundle")
      ),
      amount: v.number(),
      currency: v.optional(v.string()),
      status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
      productTitle: v.optional(v.string()),
      buyerName: v.optional(v.string()),
      buyerEmail: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_store_status", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit);

    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let productTitle: string | undefined;

        if (purchase.productType === "course" && purchase.courseId) {
          const course = await ctx.db.get(purchase.courseId);
          productTitle = course?.title;
        } else if (purchase.productId) {
          const product = await ctx.db.get(purchase.productId);
          productTitle = product?.title;
        }

        let buyerName: string | undefined;
        let buyerEmail: string | undefined;

        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
          .first();

        if (user) {
          buyerName = user.name || undefined;
          buyerEmail = user.email || undefined;
        }

        return {
          _id: purchase._id,
          _creationTime: purchase._creationTime,
          userId: purchase.userId,
          productType: purchase.productType,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          productTitle,
          buyerName,
          buyerEmail,
        };
      })
    );

    return enrichedPurchases;
  },
});

export const getStorePurchaseStats = query({
  args: {
    storeId: v.string(),
    timeRange: v.optional(
      v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("all"))
    ),
  },
  returns: v.object({
    totalPurchases: v.number(),
    completedPurchases: v.number(),
    totalRevenue: v.number(),
    averageOrderValue: v.number(),
  }),
  handler: async (ctx, args) => {
    const timeRange = args.timeRange ?? "30d";
    const now = Date.now();

    let cutoffTime = 0;
    if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      cutoffTime = now - days * 24 * 60 * 60 * 1000;
    }

    const allPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_store_status", (q) => q.eq("storeId", args.storeId))
      .collect();

    const purchases =
      timeRange === "all"
        ? allPurchases
        : allPurchases.filter((p) => p._creationTime >= cutoffTime);

    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.amount, 0);
    const averageOrderValue =
      completedPurchases.length > 0 ? totalRevenue / completedPurchases.length : 0;

    return {
      totalPurchases: purchases.length,
      completedPurchases: completedPurchases.length,
      totalRevenue,
      averageOrderValue,
    };
  },
});

export const getUserPurchases = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded"))
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      _creationTime: v.number(),
      productType: v.union(
        v.literal("digitalProduct"),
        v.literal("course"),
        v.literal("coaching"),
        v.literal("bundle")
      ),
      amount: v.number(),
      currency: v.optional(v.string()),
      status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
      productTitle: v.optional(v.string()),
      productImage: v.optional(v.string()),
      storeName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const purchasesQuery = ctx.db
      .query("purchases")
      .withIndex("by_user_status", (q) => {
        if (args.status) {
          return q.eq("userId", args.userId).eq("status", args.status);
        }
        return q.eq("userId", args.userId);
      })
      .order("desc");

    const purchases = await purchasesQuery.take(limit);

    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let productTitle: string | undefined;
        let productImage: string | undefined;
        let storeName: string | undefined;

        if (purchase.productType === "course" && purchase.courseId) {
          const course = await ctx.db.get(purchase.courseId);
          productTitle = course?.title;
          productImage = course?.imageUrl || undefined;
        } else if (purchase.productId) {
          const product = await ctx.db.get(purchase.productId);
          productTitle = product?.title;
          productImage = product?.imageUrl || undefined;
        }

        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("_id"), purchase.storeId))
          .first();
        storeName = store?.name;

        return {
          _id: purchase._id,
          _creationTime: purchase._creationTime,
          productType: purchase.productType,
          amount: purchase.amount,
          currency: purchase.currency,
          status: purchase.status,
          productTitle,
          productImage,
          storeName,
        };
      })
    );

    return enrichedPurchases;
  },
});
