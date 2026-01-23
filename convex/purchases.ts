import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
        v.literal("bundle"),
        v.literal("beatLease")
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
        v.literal("bundle"),
        v.literal("beatLease")
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

// Create coaching session purchase - used by Stripe webhook
export const createCoachingPurchase = mutation({
  args: {
    userId: v.string(),
    productId: v.id("digitalProducts"),
    coachingSessionId: v.id("coachingSessions"),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  returns: v.id("purchases"),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Coaching product not found");
    }

    // Check if purchase already exists for this transaction
    if (args.transactionId) {
      const existingPurchase = await ctx.db
        .query("purchases")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("transactionId"), args.transactionId),
            q.eq(q.field("productType"), "coaching")
          )
        )
        .first();

      if (existingPurchase) {
        return existingPurchase._id;
      }
    }

    // Create purchase record with coaching productType
    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.userId,
      productId: args.productId,
      storeId: product.storeId,
      adminUserId: product.userId,
      amount: args.amount,
      currency: args.currency || "USD",
      status: "completed",
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      productType: "coaching",
      accessGranted: true,
      downloadCount: 0,
      lastAccessedAt: Date.now(),
    });

    // Create customer record if needed
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .unique();

      if (user && product.storeId) {
        const existingCustomer = await ctx.db
          .query("customers")
          .withIndex("by_email_and_store", (q) =>
            q.eq("email", user.email || "").eq("storeId", product.storeId)
          )
          .unique();

        if (existingCustomer) {
          await ctx.db.patch(existingCustomer._id, {
            lastActivity: Date.now(),
            status: "active",
            type: "paying",
            totalSpent: (existingCustomer.totalSpent || 0) + args.amount,
          });
        } else {
          await ctx.db.insert("customers", {
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email ||
              "Unknown",
            email: user.email || args.userId,
            storeId: product.storeId,
            adminUserId: product.userId,
            type: "paying",
            status: "active",
            totalSpent: args.amount,
            lastActivity: Date.now(),
            source: product.title || "Coaching Session",
          });
        }
      }
    } catch (error) {
      console.error("Failed to create/update customer record:", error);
    }

    return purchaseId;
  },
});
