import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all published sample packs for marketplace
export const getAllPublishedSamplePacks = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("samplePacks"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    storeId: v.string(),
    published: v.boolean(),
    sampleCount: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    // Get all published sample packs
    const samplePacks = await ctx.db
      .query("samplePacks")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Enrich with creator info and download counts
    const packsWithDetails = await Promise.all(
      samplePacks.map(async (pack) => {
        // Get download count from sampleDownloads
    const downloads = await ctx.db
      .query("sampleDownloads")
          .filter((q) => q.eq(q.field("packId"), pack._id))
      .collect();

        // Get creator info
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").collect();
        const store = stores.find(s => s._id === pack.storeId);

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
          _id: pack._id,
          _creationTime: pack._creationTime,
          title: pack.name, // Schema uses 'name' not 'title'
          description: pack.description,
          price: pack.creditPrice || 0, // Schema uses 'creditPrice'
          imageUrl: pack.coverImageUrl, // Schema uses 'coverImageUrl'
          coverImage: pack.coverImageUrl,
          genres: pack.genres,
          storeId: pack.storeId,
          published: pack.isPublished || false,
          sampleCount: pack.totalSamples,
          downloadCount: downloads.length,
          creatorName,
          creatorAvatar,
        };
      })
    );

    return packsWithDetails;
  },
});
