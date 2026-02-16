import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all samples from published packs
 * Extracts individual files from pack metadata for marketplace browsing
 */ 
export const getSamplesFromPacks = query({
  args: {
    limit: v.optional(v.number()),
    genre: v.optional(v.string()),
    packId: v.optional(v.id("digitalProducts")),
  },
  returns: v.array(v.object({
    _id: v.string(), // Composite ID: packId_fileIndex
    packId: v.id("digitalProducts"),
    packTitle: v.string(),
    title: v.string(), // File name as title
    name: v.string(), // Also as name for compatibility
    fileUrl: v.string(),
    storageId: v.string(),
    fileSize: v.optional(v.number()),
    fileType: v.optional(v.string()),
    price: v.number(), // Pack price
    creditPrice: v.number(), // Same as price for compatibility
    genre: v.optional(v.string()), // First genre from array
    genres: v.optional(v.array(v.string())), // All genres
    category: v.optional(v.string()), // Pack category
    tags: v.optional(v.array(v.string())),
    bpm: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
    packCategory: v.optional(v.string()), // sample-pack, midi-pack, preset-pack
  })),
  handler: async (ctx, args) => {
    // Get published packs with files
    const packs = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(500);
    
    // Filter for pack types only
    const packProducts = packs.filter(p => 
      p.productCategory === "sample-pack" ||
      p.productCategory === "midi-pack" ||
      p.productCategory === "preset-pack"
    );

    // Extract individual samples from packs
    const samples: any[] = [];
    
    for (const pack of packProducts) {
      if (!pack.packFiles) continue;
      
      try {
        const files = JSON.parse(pack.packFiles);
        
        // Get creator info
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;
        
        const stores = await ctx.db.query("stores").take(500);
        const store = stores.find(s => s._id === pack.storeId);
        
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
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Get file URL from storage
          const fileUrl = await ctx.storage.getUrl(file.storageId);
          
          if (fileUrl) {
            samples.push({
              _id: `${pack._id}_${i}`,
              packId: pack._id,
              packTitle: pack.title,
              title: file.name, // File name as title
              name: file.name, // Also as name
              fileUrl,
              storageId: file.storageId,
              fileSize: file.size,
              fileType: file.type,
              price: pack.price,
              creditPrice: pack.price, // Same as price
              genre: pack.genre?.[0] || "Uncategorized", // First genre
              genres: pack.genre, // All genres
              category: pack.productCategory?.replace("-pack", "") || "sample", // "sample", "midi", "preset"
              tags: pack.tags,
              bpm: pack.bpm,
              creatorName,
              creatorAvatar,
              packCategory: pack.productCategory,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to parse packFiles for pack ${pack._id}:`, error);
      }
    }
    
    // Apply filters
    let filtered = samples;
    
    if (args.genre) {
      filtered = filtered.filter(s => 
        s.genre?.includes(args.genre!)
      );
    }
    
    if (args.packId) {
      filtered = filtered.filter(s => s.packId === args.packId);
    }
    
    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }
    
    return filtered;
  },
});

