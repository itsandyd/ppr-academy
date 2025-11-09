import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Ableton Audio Effect Racks Management
 * Handles creation, querying, and management of Ableton rack presets
 */

// Type definitions based on NIA research
const abletonRackValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  price: v.number(),
  imageUrl: v.optional(v.string()),
  downloadUrl: v.optional(v.string()),
  storeId: v.string(),
  userId: v.string(),
  
  // Ableton-specific metadata
  productType: v.union(v.literal("abletonRack"), v.literal("abletonPreset")),
  abletonVersion: v.string(),
  minAbletonVersion: v.optional(v.string()),
  rackType: v.union(
    v.literal("audioEffect"),
    v.literal("instrument"),
    v.literal("midiEffect"),
    v.literal("drumRack")
  ),
  effectType: v.optional(v.array(v.string())),
  macroCount: v.optional(v.number()),
  cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  genre: v.optional(v.array(v.string())),
  bpm: v.optional(v.number()),
  musicalKey: v.optional(v.string()),
  requiresMaxForLive: v.optional(v.boolean()),
  thirdPartyPlugins: v.optional(v.array(v.string())),
  
  // Preview assets
  demoAudioUrl: v.optional(v.string()),
  chainImageUrl: v.optional(v.string()),
  macroScreenshotUrls: v.optional(v.array(v.string())),
  
  // Metadata
  complexity: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
  tags: v.optional(v.array(v.string())),
  fileFormat: v.union(v.literal("adg"), v.literal("adv"), v.literal("alp")),
  fileSize: v.optional(v.number()),
  installationNotes: v.optional(v.string()),
});

// Create Ableton Rack
export const createAbletonRack = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    
    // Ableton-specific fields
    abletonVersion: v.string(),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.union(
      v.literal("audioEffect"),
      v.literal("instrument"),
      v.literal("midiEffect"),
      v.literal("drumRack")
    ),
    effectType: v.optional(v.array(v.string())),
    macroCount: v.optional(v.number()),
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    genre: v.optional(v.array(v.string())),
    bpm: v.optional(v.number()),
    musicalKey: v.optional(v.string()),
    requiresMaxForLive: v.optional(v.boolean()),
    thirdPartyPlugins: v.optional(v.array(v.string())),
    demoAudioUrl: v.optional(v.string()),
    chainImageUrl: v.optional(v.string()),
    macroScreenshotUrls: v.optional(v.array(v.string())),
    complexity: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    tags: v.optional(v.array(v.string())),
    fileFormat: v.union(v.literal("adg"), v.literal("adv"), v.literal("alp")),
    fileSize: v.optional(v.number()),
    installationNotes: v.optional(v.string()),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("digitalProducts", {
      ...args,
      productType: "abletonRack",
      isPublished: true, // Auto-publish new racks
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
  },
});

// Update Ableton Rack
export const updateAbletonRack = mutation({
  args: {
    id: v.id("digitalProducts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    
    // Ableton-specific fields
    abletonVersion: v.optional(v.string()),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(
      v.literal("audioEffect"),
      v.literal("instrument"),
      v.literal("midiEffect"),
      v.literal("drumRack")
    )),
    effectType: v.optional(v.array(v.string())),
    macroCount: v.optional(v.number()),
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    genre: v.optional(v.array(v.string())),
    bpm: v.optional(v.number()),
    musicalKey: v.optional(v.string()),
    requiresMaxForLive: v.optional(v.boolean()),
    thirdPartyPlugins: v.optional(v.array(v.string())),
    demoAudioUrl: v.optional(v.string()),
    chainImageUrl: v.optional(v.string()),
    macroScreenshotUrls: v.optional(v.array(v.string())),
    complexity: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    tags: v.optional(v.array(v.string())),
    fileFormat: v.optional(v.union(v.literal("adg"), v.literal("adv"), v.literal("alp"))),
    fileSize: v.optional(v.number()),
    installationNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Get all Ableton Racks by store
export const getAbletonRacksByStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    return products.filter(p => 
      p.productType === "abletonRack" || p.productType === "abletonPreset"
    );
  },
});

// Get published Ableton Racks for marketplace
export const getPublishedAbletonRacks = query({
  args: {
    rackType: v.optional(v.union(
      v.literal("audioEffect"),
      v.literal("instrument"),
      v.literal("midiEffect"),
      v.literal("drumRack")
    )),
    abletonVersion: v.optional(v.string()),
    genre: v.optional(v.string()),
    effectType: v.optional(v.string()),
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    complexity: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let racks = await ctx.db
      .query("digitalProducts")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("productType"), "abletonRack"),
            q.eq(q.field("productType"), "abletonPreset")
          ),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    // Apply filters
    if (args.rackType) {
      racks = racks.filter(r => r.rackType === args.rackType);
    }
    
    if (args.abletonVersion) {
      racks = racks.filter(r => 
        r.abletonVersion === args.abletonVersion || 
        r.minAbletonVersion === args.abletonVersion
      );
    }
    
    if (args.genre) {
      racks = racks.filter(r => r.genre?.includes(args.genre!));
    }
    
    if (args.effectType) {
      racks = racks.filter(r => r.effectType?.includes(args.effectType!));
    }
    
    if (args.cpuLoad) {
      racks = racks.filter(r => r.cpuLoad === args.cpuLoad);
    }
    
    if (args.complexity) {
      racks = racks.filter(r => r.complexity === args.complexity);
    }
    
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      racks = racks.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Enrich with creator info
    const racksWithCreator = await Promise.all(
      racks.map(async (rack) => {
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").collect();
        const store = stores.find(s => s._id === rack.storeId);
        
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
          ...rack,
          creatorName,
          creatorAvatar,
        };
      })
    );

    return racksWithCreator;
  },
});

// Get single Ableton Rack by ID (public or owner)
export const getAbletonRackById = query({
  args: { 
    rackId: v.id("digitalProducts"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const rack = await ctx.db.get(args.rackId);
    
    if (!rack) return null;
    
    // Check if it's an Ableton rack
    if (rack.productType !== "abletonRack" && rack.productType !== "abletonPreset") {
      return null;
    }
    
    // Allow owner to view unpublished racks
    const isOwner = args.userId && rack.userId === args.userId;
    
    if (!rack.isPublished && !isOwner) {
      return null;
    }

    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;

    const stores = await ctx.db.query("stores").collect();
    const store = stores.find(s => s._id === rack.storeId);
    
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
      ...rack,
      creatorName,
      creatorAvatar,
    };
  },
});

// Delete Ableton Rack
export const deleteAbletonRack = mutation({
  args: { 
    rackId: v.id("digitalProducts"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const rack = await ctx.db.get(args.rackId);
    
    if (!rack) {
      return { success: false, message: "Rack not found" };
    }
    
    // Verify ownership
    if (rack.userId !== args.userId) {
      return { success: false, message: "Unauthorized" };
    }
    
    await ctx.db.delete(args.rackId);
    return { success: true, message: "Rack deleted successfully" };
  },
});

// Get Ableton Rack statistics
export const getAbletonRackStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    totalRacks: v.number(),
    publishedRacks: v.number(),
    totalDownloads: v.number(),
    totalRevenue: v.number(),
    racksByType: v.any(),
  }),
  handler: async (ctx, args) => {
    const racks = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    const abletonRacks = racks.filter(r => 
      r.productType === "abletonRack" || r.productType === "abletonPreset"
    );
    
    const publishedRacks = abletonRacks.filter(r => r.isPublished);
    
    // Get purchases
    const purchases = await ctx.db.query("purchases").collect();
    const rackPurchases = purchases.filter(p => 
      abletonRacks.some(r => r._id === p.productId)
    );
    
    // Calculate stats
    const totalDownloads = rackPurchases.length;
    const totalRevenue = rackPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Group by rack type
    const racksByType = abletonRacks.reduce((acc: any, rack) => {
      const type = rack.rackType || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalRacks: abletonRacks.length,
      publishedRacks: publishedRacks.length,
      totalDownloads,
      totalRevenue,
      racksByType,
    };
  },
});

// Get Ableton Rack by slug
export const getAbletonRackBySlug = query({
  args: { slug: v.string() },
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
      // Ableton-specific fields
      productType: v.optional(v.union(
        v.literal("digital"),
        v.literal("urlMedia"),
        v.literal("coaching"),
        v.literal("abletonRack"),
        v.literal("abletonPreset")
      )),
      abletonVersion: v.optional(v.string()),
      minAbletonVersion: v.optional(v.string()),
      rackType: v.optional(v.union(
        v.literal("audioEffect"),
        v.literal("instrument"),
        v.literal("midiEffect"),
        v.literal("drumRack")
      )),
      effectType: v.optional(v.array(v.string())),
      macroCount: v.optional(v.number()),
      cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      genre: v.optional(v.array(v.string())),
      bpm: v.optional(v.number()),
      musicalKey: v.optional(v.string()),
      requiresMaxForLive: v.optional(v.boolean()),
      thirdPartyPlugins: v.optional(v.array(v.string())),
      demoAudioUrl: v.optional(v.string()),
      chainImageUrl: v.optional(v.string()),
      macroScreenshotUrls: v.optional(v.array(v.string())),
      complexity: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
      tags: v.optional(v.array(v.string())),
      fileFormat: v.optional(v.union(v.literal("adg"), v.literal("adv"), v.literal("alp"))),
      fileSize: v.optional(v.number()),
      installationNotes: v.optional(v.string()),
      // Order bump & affiliate fields (from database)
      orderBumpEnabled: v.optional(v.boolean()),
      affiliateEnabled: v.optional(v.boolean()),
      // Creator info
      creatorName: v.optional(v.string()),
      creatorAvatar: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Find rack by matching slug (title converted to slug format)
    const racks = await ctx.db
      .query("digitalProducts")
      .filter((q) => 
        q.or(
          q.eq(q.field("productType"), "abletonRack"),
          q.eq(q.field("productType"), "abletonPreset")
        )
      )
      .collect();
    
    // Match slug (convert title to slug and compare)
    const rack = racks.find(r => {
      const titleSlug = r.title.toLowerCase().replace(/\s+/g, "-");
      return titleSlug === args.slug;
    });
    
    if (!rack) {
      return null;
    }
    
    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;
    
    const stores = await ctx.db.query("stores").collect();
    const store = stores.find(s => s._id === rack.storeId);
    
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
    
    return {
      ...rack,
      creatorName,
      creatorAvatar,
    };
  },
});

