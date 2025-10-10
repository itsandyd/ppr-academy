import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get products by store (all products - for dashboard)
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
    // Coaching specific fields
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    customFields: v.optional(v.any()),
    availability: v.optional(v.any()),
    thumbnailStyle: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
    // Order bump & affiliate fields
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

// Get published products by store (for public storefront)
export const getPublishedProductsByStore = query({
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
    // Coaching specific fields
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    customFields: v.optional(v.any()),
    availability: v.optional(v.any()),
    thumbnailStyle: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
    // Order bump & affiliate fields
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
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    // Filter for published products only
    return products.filter(product => product.isPublished === true);
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
    // Coaching specific fields
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    customFields: v.optional(v.any()),
    availability: v.optional(v.any()),
    thumbnailStyle: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
    // Order bump & affiliate fields
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
      // Coaching specific fields
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      customFields: v.optional(v.any()),
      availability: v.optional(v.any()),
      thumbnailStyle: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      // Order bump & affiliate fields
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
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
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
      // Coaching specific fields
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      customFields: v.optional(v.any()),
      availability: v.optional(v.any()),
      thumbnailStyle: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      // Order bump & affiliate fields
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

// Create URL/Media product
export const createUrlMediaProduct = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    displayStyle: v.union(v.literal("embed"), v.literal("card"), v.literal("button")),
    mediaType: v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social")),
    storeId: v.string(),
    userId: v.string(),
    buttonLabel: v.optional(v.string()),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      ...args,
      productType: "urlMedia",
      price: 0, // URL/Media products are typically free
      isPublished: false,
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

// Get all published products across all stores (for marketplace homepage)
export const getAllPublishedProducts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("digitalProducts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    storeId: v.string(), // Store as string to match schema
    published: v.boolean(),
    downloadCount: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
    contentType: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    // Get all published products
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Enrich with download counts and creator info
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        // Get download count from purchases
        const purchases = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("productId"), product._id))
          .collect();
        
        // Get creator info
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        // Get store info - storeId is a string in the schema
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
          } else {
            creatorName = store.name || "Creator";
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
          category: product.productType,
          storeId: product.storeId,
          published: product.isPublished || false,
          downloadCount: purchases.length,
          creatorName,
          creatorAvatar,
          contentType: "product",
        };
      })
    );

    return productsWithDetails;
  },
}); 
// Get all digital products (admin only)
export const getAllProducts = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("digitalProducts").collect();
  },
});
