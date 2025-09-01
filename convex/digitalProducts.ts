import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get products by store
export const getProductsByStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.object({
    _id: v.id("digitalProducts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isPublished: v.optional(v.boolean()),
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
    orderBumpEnabled: v.optional(v.boolean()),
    orderBumpProductName: v.optional(v.string()),
    orderBumpDescription: v.optional(v.string()),
    orderBumpPrice: v.optional(v.number()),
    orderBumpImageUrl: v.optional(v.string()),
    affiliateEnabled: v.optional(v.boolean()),
    affiliateCommissionRate: v.optional(v.number()),
    affiliateMinPayout: v.optional(v.number()),
    affiliateCookieDuration: v.optional(v.number()),
    confirmationEmailSubject: v.optional(v.string()),
    confirmationEmailBody: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// Get products by user
export const getProductsByUser = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("digitalProducts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isPublished: v.optional(v.boolean()),
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
    orderBumpEnabled: v.optional(v.boolean()),
    orderBumpProductName: v.optional(v.string()),
    orderBumpDescription: v.optional(v.string()),
    orderBumpPrice: v.optional(v.number()),
    orderBumpImageUrl: v.optional(v.string()),
    affiliateEnabled: v.optional(v.boolean()),
    affiliateCommissionRate: v.optional(v.number()),
    affiliateMinPayout: v.optional(v.number()),
    affiliateCookieDuration: v.optional(v.number()),
    confirmationEmailSubject: v.optional(v.string()),
    confirmationEmailBody: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("digitalProducts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get product by ID
export const getProductById = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      isPublished: v.optional(v.boolean()),
      buttonLabel: v.optional(v.string()),
      style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
      orderBumpEnabled: v.optional(v.boolean()),
      orderBumpProductName: v.optional(v.string()),
      orderBumpDescription: v.optional(v.string()),
      orderBumpPrice: v.optional(v.number()),
      orderBumpImageUrl: v.optional(v.string()),
      affiliateEnabled: v.optional(v.boolean()),
      affiliateCommissionRate: v.optional(v.number()),
      affiliateMinPayout: v.optional(v.number()),
      affiliateCookieDuration: v.optional(v.number()),
      confirmationEmailSubject: v.optional(v.string()),
      confirmationEmailBody: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

// Create a new digital product
export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      ...args,
      isPublished: false,
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

// Update digital product
export const updateProduct = mutation({
  args: {
    id: v.id("digitalProducts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
    orderBumpEnabled: v.optional(v.boolean()),
    orderBumpProductName: v.optional(v.string()),
    orderBumpDescription: v.optional(v.string()),
    orderBumpPrice: v.optional(v.number()),
    orderBumpImageUrl: v.optional(v.string()),
    affiliateEnabled: v.optional(v.boolean()),
    affiliateCommissionRate: v.optional(v.number()),
    affiliateMinPayout: v.optional(v.number()),
    affiliateCookieDuration: v.optional(v.number()),
    confirmationEmailSubject: v.optional(v.string()),
    confirmationEmailBody: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      downloadUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      isPublished: v.optional(v.boolean()),
      buttonLabel: v.optional(v.string()),
      style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
      orderBumpEnabled: v.optional(v.boolean()),
      orderBumpProductName: v.optional(v.string()),
      orderBumpDescription: v.optional(v.string()),
      orderBumpPrice: v.optional(v.number()),
      orderBumpImageUrl: v.optional(v.string()),
      affiliateEnabled: v.optional(v.boolean()),
      affiliateCommissionRate: v.optional(v.number()),
      affiliateMinPayout: v.optional(v.number()),
      affiliateCookieDuration: v.optional(v.number()),
      confirmationEmailSubject: v.optional(v.string()),
      confirmationEmailBody: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Update email confirmation settings for a product
export const updateEmailConfirmation = mutation({
  args: {
    productId: v.id("digitalProducts"),
    confirmationEmailSubject: v.string(),
    confirmationEmailBody: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db.get(args.productId);
      if (!product) {
        return { success: false, message: "Product not found" };
      }

      await ctx.db.patch(args.productId, {
        confirmationEmailSubject: args.confirmationEmailSubject,
        confirmationEmailBody: args.confirmationEmailBody,
      });

      return { success: true, message: "Email confirmation settings updated successfully" };
    } catch (error) {
      console.error("Failed to update email confirmation settings:", error);
      return { success: false, message: "Failed to update email confirmation settings" };
    }
  },
});

// Delete digital product
export const deleteProduct = mutation({
  args: { id: v.id("digitalProducts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
}); 