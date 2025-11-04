import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateSlug } from "./lib/utils";

// ============================================
// QUERIES
// ============================================

// Get all published plugins (for marketplace)
export const getAllPublishedPlugins = query({
  handler: async (ctx) => {
    const plugins = await ctx.db
      .query("plugins")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    // Enrich with category and type names
    const enrichedPlugins = await Promise.all(
      plugins.map(async (plugin) => {
        let category = null;
        let pluginType = null;

        if (plugin.categoryId) {
          category = await ctx.db.get(plugin.categoryId);
        }
        if (plugin.pluginTypeId) {
          pluginType = await ctx.db.get(plugin.pluginTypeId);
        }

        return {
          ...plugin,
          categoryName: category?.name,
          typeName: pluginType?.name,
        };
      })
    );

    return enrichedPlugins;
  },
});

// Get all plugins (admin only)
export const getAllPlugins = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const plugins = await ctx.db.query("plugins").collect();

    // Enrich with category and type names
    const enrichedPlugins = await Promise.all(
      plugins.map(async (plugin) => {
        let category = null;
        let pluginType = null;

        if (plugin.categoryId) {
          category = await ctx.db.get(plugin.categoryId);
        }
        if (plugin.pluginTypeId) {
          pluginType = await ctx.db.get(plugin.pluginTypeId);
        }

        return {
          ...plugin,
          categoryName: category?.name,
          typeName: pluginType?.name,
        };
      })
    );

    return enrichedPlugins;
  },
});

// Get plugin by ID
export const getPluginById = query({
  args: {
    pluginId: v.id("plugins"),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.db.get(args.pluginId);
    if (!plugin) return null;

    let category = null;
    let pluginType = null;

    if (plugin.categoryId) {
      category = await ctx.db.get(plugin.categoryId);
    }
    if (plugin.pluginTypeId) {
      pluginType = await ctx.db.get(plugin.pluginTypeId);
    }

    return {
      ...plugin,
      categoryName: category?.name,
      typeName: pluginType?.name,
    };
  },
});

// Get plugin by slug
export const getPluginBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.db
      .query("plugins")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!plugin) return null;

    let category = null;
    let pluginType = null;

    if (plugin.categoryId) {
      category = await ctx.db.get(plugin.categoryId);
    }
    if (plugin.pluginTypeId) {
      pluginType = await ctx.db.get(plugin.pluginTypeId);
    }

    return {
      ...plugin,
      categoryName: category?.name,
      typeName: pluginType?.name,
    };
  },
});

// Get all plugin types
export const getPluginTypes = query({
  handler: async (ctx) => {
    return await ctx.db.query("pluginTypes").collect();
  },
});

// Get all plugin categories
export const getPluginCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("pluginCategories").collect();
  },
});

// Get effect categories for a plugin type
export const getEffectCategories = query({
  args: {
    pluginTypeId: v.optional(v.id("pluginTypes")),
  },
  handler: async (ctx, args) => {
    if (args.pluginTypeId) {
      return await ctx.db
        .query("pluginEffectCategories")
        .withIndex("by_pluginTypeId", (q) =>
          q.eq("pluginTypeId", args.pluginTypeId)
        )
        .collect();
    }
    return await ctx.db.query("pluginEffectCategories").collect();
  },
});

// Get instrument categories for a plugin type
export const getInstrumentCategories = query({
  args: {
    pluginTypeId: v.optional(v.id("pluginTypes")),
  },
  handler: async (ctx, args) => {
    if (args.pluginTypeId) {
      return await ctx.db
        .query("pluginInstrumentCategories")
        .withIndex("by_pluginTypeId", (q) =>
          q.eq("pluginTypeId", args.pluginTypeId)
        )
        .collect();
    }
    return await ctx.db.query("pluginInstrumentCategories").collect();
  },
});

// Get studio tool categories for a plugin type
export const getStudioToolCategories = query({
  args: {
    pluginTypeId: v.optional(v.id("pluginTypes")),
  },
  handler: async (ctx, args) => {
    if (args.pluginTypeId) {
      return await ctx.db
        .query("pluginStudioToolCategories")
        .withIndex("by_pluginTypeId", (q) =>
          q.eq("pluginTypeId", args.pluginTypeId)
        )
        .collect();
    }
    return await ctx.db.query("pluginStudioToolCategories").collect();
  },
});

// ============================================
// MUTATIONS
// ============================================

// Create a plugin (admin only)
export const createPlugin = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    author: v.optional(v.string()),
    description: v.optional(v.string()),
    videoScript: v.optional(v.string()),
    image: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("pluginCategories")),
    pluginTypeId: v.optional(v.id("pluginTypes")),
    optInFormUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    pricingType: v.union(v.literal("FREE"), v.literal("PAID"), v.literal("FREEMIUM")),
    purchaseUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Generate slug if not provided
    const slug = args.slug || generateSlug(args.name);

    // Check if slug already exists
    const existingPlugin = await ctx.db
      .query("plugins")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingPlugin) {
      throw new Error("A plugin with this slug already exists");
    }

    const now = Date.now();

    const pluginId = await ctx.db.insert("plugins", {
      name: args.name,
      slug,
      author: args.author,
      description: args.description,
      videoScript: args.videoScript,
      image: args.image,
      videoUrl: args.videoUrl,
      audioUrl: args.audioUrl,
      userId: args.clerkId,
      categoryId: args.categoryId,
      pluginTypeId: args.pluginTypeId,
      optInFormUrl: args.optInFormUrl,
      price: args.price,
      pricingType: args.pricingType,
      purchaseUrl: args.purchaseUrl,
      isPublished: args.isPublished ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return pluginId;
  },
});

// Update a plugin (admin only)
export const updatePlugin = mutation({
  args: {
    clerkId: v.string(),
    pluginId: v.id("plugins"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    author: v.optional(v.string()),
    description: v.optional(v.string()),
    videoScript: v.optional(v.string()),
    image: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("pluginCategories")),
    pluginTypeId: v.optional(v.id("pluginTypes")),
    optInFormUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    pricingType: v.optional(
      v.union(v.literal("FREE"), v.literal("PAID"), v.literal("FREEMIUM"))
    ),
    purchaseUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const plugin = await ctx.db.get(args.pluginId);
    if (!plugin) {
      throw new Error("Plugin not found");
    }

    // If slug is being updated, check it doesn't conflict
    if (args.slug && args.slug !== plugin.slug) {
      const existingPlugin = await ctx.db
        .query("plugins")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first();

      if (existingPlugin && existingPlugin._id !== args.pluginId) {
        throw new Error("A plugin with this slug already exists");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Only update fields that are provided
    if (args.name !== undefined) updateData.name = args.name;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.author !== undefined) updateData.author = args.author;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.videoScript !== undefined) updateData.videoScript = args.videoScript;
    if (args.image !== undefined) updateData.image = args.image;
    if (args.videoUrl !== undefined) updateData.videoUrl = args.videoUrl;
    if (args.audioUrl !== undefined) updateData.audioUrl = args.audioUrl;
    if (args.categoryId !== undefined) updateData.categoryId = args.categoryId;
    if (args.pluginTypeId !== undefined) updateData.pluginTypeId = args.pluginTypeId;
    if (args.optInFormUrl !== undefined) updateData.optInFormUrl = args.optInFormUrl;
    if (args.price !== undefined) updateData.price = args.price;
    if (args.pricingType !== undefined) updateData.pricingType = args.pricingType;
    if (args.purchaseUrl !== undefined) updateData.purchaseUrl = args.purchaseUrl;
    if (args.isPublished !== undefined) updateData.isPublished = args.isPublished;

    await ctx.db.patch(args.pluginId, updateData);

    return args.pluginId;
  },
});

// Delete a plugin (admin only)
export const deletePlugin = mutation({
  args: {
    clerkId: v.string(),
    pluginId: v.id("plugins"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.delete(args.pluginId);
  },
});

// Create plugin type (admin only)
export const createPluginType = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const now = Date.now();
    return await ctx.db.insert("pluginTypes", {
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create plugin category (admin only)
export const createPluginCategory = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user?.admin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const now = Date.now();
    return await ctx.db.insert("pluginCategories", {
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

