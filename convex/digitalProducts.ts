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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
    productCategory: v.optional(v.string()), // Product category (sample-pack, preset-pack, etc.)
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
    // Ableton Rack specific fields
    abletonVersion: v.optional(v.string()),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
    // Follow gate fields (for free products with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
    // Pack files (for sample/midi/preset packs)
    packFiles: v.optional(v.string()), // JSON stringified array of file metadata
    // Effect Chain / DAW fields
    dawType: v.optional(v.union(
      v.literal("ableton"),
      v.literal("fl-studio"),
      v.literal("logic"),
      v.literal("bitwig"),
      v.literal("studio-one"),
      v.literal("reason"),
      v.literal("cubase"),
      v.literal("multi-daw")
    )),
    dawVersion: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    // Filter out courses (they belong in the courses table, not digitalProducts)
    const nonCourseProducts = products.filter(
      (product) => product.productCategory !== "course"
    );
    
    // Convert storage IDs to URLs for image fields
    const productsWithUrls = await Promise.all(
      nonCourseProducts.map(async (product) => {
        let imageUrl = product.imageUrl;
        let downloadUrl = product.downloadUrl;
        let demoAudioUrl = product.demoAudioUrl;
        let chainImageUrl = product.chainImageUrl;
        
        // Convert storage IDs to URLs if they're storage IDs (not external URLs)
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = await ctx.storage.getUrl(imageUrl as any) || imageUrl;
        }
        if (downloadUrl && !downloadUrl.startsWith('http')) {
          downloadUrl = await ctx.storage.getUrl(downloadUrl as any) || downloadUrl;
        }
        if (demoAudioUrl && !demoAudioUrl.startsWith('http')) {
          demoAudioUrl = await ctx.storage.getUrl(demoAudioUrl as any) || demoAudioUrl;
        }
        if (chainImageUrl && !chainImageUrl.startsWith('http')) {
          chainImageUrl = await ctx.storage.getUrl(chainImageUrl as any) || chainImageUrl;
        }
        
        return {
          ...product,
          imageUrl,
          downloadUrl,
          demoAudioUrl,
          chainImageUrl,
        };
      })
    );
    
    return productsWithUrls;
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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
    productCategory: v.optional(v.string()), // Product category (sample-pack, preset-pack, etc.)
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
    // Ableton Rack specific fields
    abletonVersion: v.optional(v.string()),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
    // Follow gate fields (for free products with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
    // Pack files (for sample/midi/preset packs)
    packFiles: v.optional(v.string()), // JSON stringified array of file metadata
    // Effect Chain / DAW fields
    dawType: v.optional(v.union(
      v.literal("ableton"),
      v.literal("fl-studio"),
      v.literal("logic"),
      v.literal("bitwig"),
      v.literal("studio-one"),
      v.literal("reason"),
      v.literal("cubase"),
      v.literal("multi-daw")
    )),
    dawVersion: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    // Filter for published products only, and exclude courses (they belong in courses table)
    const publishedProducts = products.filter(
      (product) => product.isPublished === true && product.productCategory !== "course"
    );
    
    // Convert storage IDs to URLs for image fields
    const productsWithUrls = await Promise.all(
      publishedProducts.map(async (product) => {
        let imageUrl = product.imageUrl;
        let downloadUrl = product.downloadUrl;
        let demoAudioUrl = product.demoAudioUrl;
        let chainImageUrl = product.chainImageUrl;
        
        // Convert storage IDs to URLs if they're storage IDs (not external URLs)
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = await ctx.storage.getUrl(imageUrl as any) || imageUrl;
        }
        if (downloadUrl && !downloadUrl.startsWith('http')) {
          downloadUrl = await ctx.storage.getUrl(downloadUrl as any) || downloadUrl;
        }
        if (demoAudioUrl && !demoAudioUrl.startsWith('http')) {
          demoAudioUrl = await ctx.storage.getUrl(demoAudioUrl as any) || demoAudioUrl;
        }
        if (chainImageUrl && !chainImageUrl.startsWith('http')) {
          chainImageUrl = await ctx.storage.getUrl(chainImageUrl as any) || chainImageUrl;
        }
        
        return {
          ...product,
          imageUrl,
          downloadUrl,
          demoAudioUrl,
          chainImageUrl,
        };
      })
    );
    
    return productsWithUrls;
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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
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
    // Ableton Rack specific fields
    abletonVersion: v.optional(v.string()),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
    // Effect Chain / DAW fields
    dawType: v.optional(v.union(
      v.literal("ableton"),
      v.literal("fl-studio"),
      v.literal("logic"),
      v.literal("bitwig"),
      v.literal("studio-one"),
      v.literal("reason"),
      v.literal("cubase"),
      v.literal("multi-daw")
    )),
    dawVersion: v.optional(v.string()),
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
      productCategory: v.optional(v.string()), // Product category (sample-pack, preset-pack, etc.)
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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
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
      // Ableton Rack specific fields
      abletonVersion: v.optional(v.string()),
      minAbletonVersion: v.optional(v.string()),
      rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
      // Follow gate fields (for free products with download gates)
      followGateEnabled: v.optional(v.boolean()),
      followGateRequirements: v.optional(v.object({
        requireEmail: v.optional(v.boolean()),
        requireInstagram: v.optional(v.boolean()),
        requireTiktok: v.optional(v.boolean()),
        requireYoutube: v.optional(v.boolean()),
        requireSpotify: v.optional(v.boolean()),
        minFollowsRequired: v.optional(v.number()),
      })),
      followGateSocialLinks: v.optional(v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
      })),
      followGateMessage: v.optional(v.string()),
      // Pack files (for sample/midi/preset packs)
      packFiles: v.optional(v.string()), // JSON stringified array of file metadata
      // Effect Chain / DAW fields
      dawType: v.optional(v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )),
      dawVersion: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    
    if (!product) {
      return null;
    }
    
    // Convert storage IDs to URLs for image fields
    let imageUrl = product.imageUrl;
    let downloadUrl = product.downloadUrl;
    let demoAudioUrl = product.demoAudioUrl;
    let chainImageUrl = product.chainImageUrl;
    let macroScreenshotUrls = product.macroScreenshotUrls;
    
    // Convert storage IDs to URLs if they're storage IDs (not external URLs)
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await ctx.storage.getUrl(imageUrl as any) || imageUrl;
    }
    if (downloadUrl && !downloadUrl.startsWith('http')) {
      downloadUrl = await ctx.storage.getUrl(downloadUrl as any) || downloadUrl;
    }
    if (demoAudioUrl && !demoAudioUrl.startsWith('http')) {
      demoAudioUrl = await ctx.storage.getUrl(demoAudioUrl as any) || demoAudioUrl;
    }
    if (chainImageUrl && !chainImageUrl.startsWith('http')) {
      chainImageUrl = await ctx.storage.getUrl(chainImageUrl as any) || chainImageUrl;
    }
    if (macroScreenshotUrls && macroScreenshotUrls.length > 0) {
      macroScreenshotUrls = await Promise.all(
        macroScreenshotUrls.map(async (url) => {
          if (url && !url.startsWith('http')) {
            return await ctx.storage.getUrl(url as any) || url;
          }
          return url;
        })
      );
    }
    
    return {
      ...product,
      imageUrl,
      downloadUrl,
      demoAudioUrl,
      chainImageUrl,
      macroScreenshotUrls,
    };
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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
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
    // Follow gate fields (for free products with download gates)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()),
    })),
    followGateSocialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
    })),
    followGateMessage: v.optional(v.string()),
    // Pack files (for sample/midi/preset packs)
    packFiles: v.optional(v.string()), // JSON stringified array of file metadata
    // Effect Chain / DAW fields
    dawType: v.optional(v.union(
      v.literal("ableton"),
      v.literal("fl-studio"),
      v.literal("logic"),
      v.literal("bitwig"),
      v.literal("studio-one"),
      v.literal("reason"),
      v.literal("cubase"),
      v.literal("multi-daw")
    )),
    dawVersion: v.optional(v.string()),
    // Coaching specific fields
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    // Ableton Rack specific fields (legacy)
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
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))),
    productCategory: v.optional(v.string()), // Product category (sample-pack, preset-pack, etc.)
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
      // Follow gate fields (for free products with download gates)
      followGateEnabled: v.optional(v.boolean()),
      followGateRequirements: v.optional(v.object({
        requireEmail: v.optional(v.boolean()),
        requireInstagram: v.optional(v.boolean()),
        requireTiktok: v.optional(v.boolean()),
        requireYoutube: v.optional(v.boolean()),
        requireSpotify: v.optional(v.boolean()),
        minFollowsRequired: v.optional(v.number()),
      })),
      followGateSocialLinks: v.optional(v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
      })),
      followGateMessage: v.optional(v.string()),
      // Pack files (for sample/midi/preset packs)
      packFiles: v.optional(v.string()), // JSON stringified array of file metadata
      // Effect Chain / DAW fields
      dawType: v.optional(v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )),
      dawVersion: v.optional(v.string()),
      // Ableton Rack specific fields (legacy)
      abletonVersion: v.optional(v.string()),
      minAbletonVersion: v.optional(v.string()),
      rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
    url: v.optional(v.string()), // Added URL field for redirects
    productCategory: v.optional(v.string()), // Product category (sample-pack, preset-pack, etc.)
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"), v.literal("effectChain"), v.literal("abletonRack"), v.literal("abletonPreset"), v.literal("playlistCuration"))), // Product type
    buttonLabel: v.optional(v.string()), // Added button label
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))), // Added style
    category: v.optional(v.string()),
    storeId: v.string(), // Store as string to match schema
    published: v.boolean(),
    downloadCount: v.optional(v.number()),
    creatorName: v.optional(v.string()),
    creatorAvatar: v.optional(v.string()),
    contentType: v.optional(v.string()),
    // Ableton Rack specific fields (optional for display)
    abletonVersion: v.optional(v.string()),
    minAbletonVersion: v.optional(v.string()),
    rackType: v.optional(v.union(v.literal("audioEffect"), v.literal("instrument"), v.literal("midiEffect"), v.literal("drumRack"))),
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
          url: product.url,
          productCategory: product.productCategory, // ← Pack category
          productType: product.productType,
          buttonLabel: product.buttonLabel,
          style: product.style,
          category: product.productType,
          storeId: product.storeId,
          published: product.isPublished || false,
          downloadCount: purchases.length,
          creatorName,
          creatorAvatar,
          contentType: "product",
          // Ableton Rack specific fields
          abletonVersion: product.abletonVersion,
          minAbletonVersion: product.minAbletonVersion,
          rackType: product.rackType,
          effectType: product.effectType,
          macroCount: product.macroCount,
          cpuLoad: product.cpuLoad,
          genre: product.genre,
          bpm: product.bpm,
          musicalKey: product.musicalKey,
          requiresMaxForLive: product.requiresMaxForLive,
          thirdPartyPlugins: product.thirdPartyPlugins,
          demoAudioUrl: product.demoAudioUrl,
          chainImageUrl: product.chainImageUrl,
          macroScreenshotUrls: product.macroScreenshotUrls,
          complexity: product.complexity,
          tags: product.tags,
          fileFormat: product.fileFormat,
          fileSize: product.fileSize,
          installationNotes: product.installationNotes,
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
