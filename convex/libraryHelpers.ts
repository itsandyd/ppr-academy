import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get pack samples with resolved URLs for library downloads
 */
export const getPackSamplesWithUrls = query({
  args: { 
    userId: v.string() 
  },
  returns: v.array(v.object({
    _id: v.string(),
    title: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    storageId: v.string(),
    packTitle: v.string(),
    packId: v.id("digitalProducts"),
    purchaseDate: v.number(),
    tags: v.array(v.string()),
  })),
  handler: async (ctx, args) => {
    // Get user's completed purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(500);

    const samples: any[] = [];

    // Process each purchase
    for (const purchase of purchases) {
      if (!purchase.productId) continue;
      
      const product = await ctx.db.get(purchase.productId);
      if (!product) continue;

      // Only process packs
      if (
        product.productCategory !== "sample-pack" &&
        product.productCategory !== "midi-pack" &&
        product.productCategory !== "preset-pack"
      ) continue;

      if (!product.packFiles) continue;

      try {
        const files = JSON.parse(product.packFiles);
        
        for (const file of files) {
          // Get actual URL from storage
          const fileUrl = await ctx.storage.getUrl(file.storageId as any);
          
          if (fileUrl) {
            samples.push({
              _id: file.storageId,
              title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ''),
              fileName: file.name,
              fileSize: file.size || 0,
              fileUrl,
              storageId: file.storageId,
              packTitle: product.title,
              packId: product._id,
              purchaseDate: purchase._creationTime,
              tags: product.tags || [],
            });
          }
        }
      } catch (e) {
        console.error('Error parsing pack files:', e);
      }
    }

    return samples;
  },
});

