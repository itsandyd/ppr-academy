"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Import plugins from Prisma/Planetscale JSON export
 * This action should be called by an admin user
 */
export const importPluginsFromJSON = action({
  args: {
    clerkId: v.string(), // Admin user performing import
    jsonData: v.string(), // JSON string of exported data
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.object({
      pluginTypes: v.number(),
      pluginCategories: v.number(),
      effectCategories: v.number(),
      instrumentCategories: v.number(),
      studioToolCategories: v.number(),
      pluginsSuccess: v.number(),
      pluginsError: v.number(),
    }),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    const parsed = JSON.parse(args.jsonData);
    // Handle nested data structure (data.data.pluginTypes) or flat structure (data.pluginTypes)
    const data = parsed.data || parsed;
    const errors: string[] = [];
    
    // Track mapping from old UUIDs to new Convex IDs
    const typeIdMap = new Map<string, Id<"pluginTypes">>();
    const categoryIdMap = new Map<string, Id<"pluginCategories">>();
    
    try {
      // 1. Import Plugin Types
      for (const type of data.pluginTypes || []) {
        try {
          const newId = await ctx.runMutation(api.plugins.createPluginType, {
            clerkId: args.clerkId,
            name: type.name,
          });
          typeIdMap.set(type.id, newId);
        } catch (error: any) {
          errors.push(`Failed to import plugin type ${type.name}: ${error.message}`);
        }
      }
      
      // 2. Import Plugin Categories
      for (const category of data.pluginCategories || []) {
        try {
          const newId = await ctx.runMutation(api.plugins.createPluginCategory, {
            clerkId: args.clerkId,
            name: category.name,
          });
          categoryIdMap.set(category.id, newId);
        } catch (error: any) {
          errors.push(`Failed to import plugin category ${category.name}: ${error.message}`);
        }
      }
      
      // 3. Import Plugins
      let successCount = 0;
      let errorCount = 0;
      
      for (const plugin of data.plugins || []) {
        try {
          await ctx.runMutation(api.plugins.createPlugin, {
            clerkId: args.clerkId,
            name: plugin.name,
            slug: plugin.slug || undefined,
            author: plugin.author || undefined,
            description: plugin.description || undefined,
            videoScript: plugin.videoScript || undefined,
            image: plugin.image || undefined,
            videoUrl: plugin.videoUrl || undefined,
            audioUrl: plugin.audioUrl || undefined,
            categoryId: plugin.categoryId ? categoryIdMap.get(plugin.categoryId) : undefined,
            pluginTypeId: plugin.pluginTypeId ? typeIdMap.get(plugin.pluginTypeId) : undefined,
            optInFormUrl: plugin.optInFormUrl || undefined,
            price: plugin.price || undefined,
            pricingType: (plugin.pricingType as "FREE" | "PAID" | "FREEMIUM") || "FREE",
            purchaseUrl: plugin.purchaseUrl || undefined,
            isPublished: true, // Publish all imported plugins by default
          });
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import plugin ${plugin.name}:`, error.message);
          errors.push(`Failed to import plugin ${plugin.name}: ${error.message}`);
          errorCount++;
        }
      }
      
      return {
        success: true,
        stats: {
          pluginTypes: typeIdMap.size,
          pluginCategories: categoryIdMap.size,
          effectCategories: data.effectCategories?.length || 0,
          instrumentCategories: data.instrumentCategories?.length || 0,
          studioToolCategories: data.studioToolCategories?.length || 0,
          pluginsSuccess: successCount,
          pluginsError: errorCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error("Import failed:", error);
      return {
        success: false,
        stats: {
          pluginTypes: typeIdMap.size,
          pluginCategories: categoryIdMap.size,
          effectCategories: 0,
          instrumentCategories: 0,
          studioToolCategories: 0,
          pluginsSuccess: 0,
          pluginsError: data.plugins?.length || 0,
        },
        errors: [error.message, ...errors],
      };
    }
  },
});

/**
 * Batch create plugins (alternative import method)
 * Allows importing plugins one batch at a time
 */
export const batchCreatePlugins = action({
  args: {
    clerkId: v.string(),
    plugins: v.array(v.object({
      name: v.string(),
      slug: v.optional(v.string()),
      author: v.optional(v.string()),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
      price: v.optional(v.number()),
      pricingType: v.union(v.literal("FREE"), v.literal("PAID"), v.literal("FREEMIUM")),
      purchaseUrl: v.optional(v.string()),
      optInFormUrl: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
    })),
  },
  returns: v.object({
    success: v.number(),
    failed: v.number(),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const pluginData of args.plugins) {
      try {
        await ctx.runMutation(api.plugins.createPlugin, {
          clerkId: args.clerkId,
          ...pluginData,
        });
        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(`Failed to create ${pluginData.name}: ${error.message}`);
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

