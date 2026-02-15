"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
    const effectCategoryIdMap = new Map<string, Id<"pluginEffectCategories">>();
    const instrumentCategoryIdMap = new Map<string, Id<"pluginInstrumentCategories">>();
    const studioToolCategoryIdMap = new Map<string, Id<"pluginStudioToolCategories">>();
    
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
      
      // 2. Import Plugin Categories (general categories)
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
      
      // 3. Import Effect Categories
      for (const category of data.effectCategories || []) {
        try {
          const pluginTypeId = category.pluginTypeId ? typeIdMap.get(category.pluginTypeId) : undefined;
          const newId = await ctx.runMutation(api.plugins.createEffectCategory, {
            clerkId: args.clerkId,
            name: category.name,
            pluginTypeId,
          });
          effectCategoryIdMap.set(category.id, newId);
        } catch (error: any) {
          errors.push(`Failed to import effect category ${category.name}: ${error.message}`);
        }
      }
      
      // 4. Import Instrument Categories
      for (const category of data.instrumentCategories || []) {
        try {
          const pluginTypeId = category.pluginTypeId ? typeIdMap.get(category.pluginTypeId) : undefined;
          const newId = await ctx.runMutation(api.plugins.createInstrumentCategory, {
            clerkId: args.clerkId,
            name: category.name,
            pluginTypeId,
          });
          instrumentCategoryIdMap.set(category.id, newId);
        } catch (error: any) {
          errors.push(`Failed to import instrument category ${category.name}: ${error.message}`);
        }
      }
      
      // 5. Import Studio Tool Categories
      for (const category of data.studioToolCategories || []) {
        try {
          const pluginTypeId = category.pluginTypeId ? typeIdMap.get(category.pluginTypeId) : undefined;
          const newId = await ctx.runMutation(api.plugins.createStudioToolCategory, {
            clerkId: args.clerkId,
            name: category.name,
            pluginTypeId,
          });
          studioToolCategoryIdMap.set(category.id, newId);
        } catch (error: any) {
          errors.push(`Failed to import studio tool category ${category.name}: ${error.message}`);
        }
      }
      
      // 6. Import Plugins with proper category mapping
      let successCount = 0;
      let errorCount = 0;
      
      for (const plugin of data.plugins || []) {
        try {
          // Determine which specific category field to use based on the categoryId
          let effectCategoryId: Id<"pluginEffectCategories"> | undefined;
          let instrumentCategoryId: Id<"pluginInstrumentCategories"> | undefined;
          let studioToolCategoryId: Id<"pluginStudioToolCategories"> | undefined;
          
          if (plugin.categoryId) {
            // Try to find the category in each map
            if (effectCategoryIdMap.has(plugin.categoryId)) {
              effectCategoryId = effectCategoryIdMap.get(plugin.categoryId);
            } else if (instrumentCategoryIdMap.has(plugin.categoryId)) {
              instrumentCategoryId = instrumentCategoryIdMap.get(plugin.categoryId);
            } else if (studioToolCategoryIdMap.has(plugin.categoryId)) {
              studioToolCategoryId = studioToolCategoryIdMap.get(plugin.categoryId);
            }
          }
          
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
            effectCategoryId,
            instrumentCategoryId,
            studioToolCategoryId,
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
          effectCategories: effectCategoryIdMap.size,
          instrumentCategories: instrumentCategoryIdMap.size,
          studioToolCategories: studioToolCategoryIdMap.size,
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
          effectCategories: effectCategoryIdMap.size,
          instrumentCategories: instrumentCategoryIdMap.size,
          studioToolCategories: studioToolCategoryIdMap.size,
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

/**
 * Clear all plugin data (admin only - use with caution!)
 */
export const clearAllPlugins: any = action({
  args: {
    clerkId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.object({
      plugins: v.number(),
      pluginTypes: v.number(),
      pluginCategories: v.number(),
      effectCategories: v.number(),
      instrumentCategories: v.number(),
      studioToolCategories: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    const result = await ctx.runQuery(api.users.checkIsAdmin, {
      clerkId: args.clerkId,
    });
    
    if (!result.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Delete in reverse order of dependencies
    // @ts-ignore - Type instantiation is excessively deep
    const plugins = await ctx.runMutation(api.plugins.deleteAllPlugins, {
      clerkId: args.clerkId,
    });
    
    const effectCategories = await ctx.runMutation(api.plugins.deleteAllEffectCategories, {
      clerkId: args.clerkId,
    });
    
    const instrumentCategories = await ctx.runMutation(api.plugins.deleteAllInstrumentCategories, {
      clerkId: args.clerkId,
    });
    
    const studioToolCategories = await ctx.runMutation(api.plugins.deleteAllStudioToolCategories, {
      clerkId: args.clerkId,
    });
    
    const pluginCategories = await ctx.runMutation(api.plugins.deleteAllPluginCategories, {
      clerkId: args.clerkId,
    });
    
    const pluginTypes = await ctx.runMutation(api.plugins.deleteAllPluginTypes, {
      clerkId: args.clerkId,
    });

    return {
      success: true,
      deleted: {
        plugins,
        pluginTypes,
        pluginCategories,
        effectCategories,
        instrumentCategories,
        studioToolCategories,
      },
    };
  },
});

/**
 * Update existing plugins with specific category mappings
 * This adds effectCategoryId, instrumentCategoryId, studioToolCategoryId to existing plugins
 */
export const updatePluginCategories: any = action({
  args: {
    clerkId: v.string(),
    jsonData: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.object({
      effectCategories: v.number(),
      instrumentCategories: v.number(),
      studioToolCategories: v.number(),
      pluginsUpdated: v.number(),
      pluginsSkipped: v.number(),
      pluginsError: v.number(),
    }),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    const parsed = JSON.parse(args.jsonData);
    const data = parsed.data || parsed;
    const errors: string[] = [];
    // Track mapping from old UUIDs to new Convex IDs
    const effectCategoryIdMap = new Map<string, Id<"pluginEffectCategories">>();
    const instrumentCategoryIdMap = new Map<string, Id<"pluginInstrumentCategories">>();
    const studioToolCategoryIdMap = new Map<string, Id<"pluginStudioToolCategories">>();
    
    try {
      // 1. Import Effect Categories (if not already imported)
      for (const category of data.effectCategories || []) {
        try {
          // Check if category already exists by name
          const existing = await ctx.runQuery(api.plugins.getEffectCategories, {});
          const existingCat = existing.find((c: any) => c.name === category.name);
          
          if (existingCat) {
            effectCategoryIdMap.set(category.id, existingCat._id);
          } else {
            const newId = await ctx.runMutation(api.plugins.createEffectCategory, {
              clerkId: args.clerkId,
              name: category.name,
              pluginTypeId: undefined,
            });
            effectCategoryIdMap.set(category.id, newId);
          }
        } catch (error: any) {
          errors.push(`Failed to process effect category ${category.name}: ${error.message}`);
        }
      }
      
      // 2. Import Instrument Categories
      for (const category of data.instrumentCategories || []) {
        try {
          const existing = await ctx.runQuery(api.plugins.getInstrumentCategories, {});
          const existingCat = existing.find((c: any) => c.name === category.name);
          
          if (existingCat) {
            instrumentCategoryIdMap.set(category.id, existingCat._id);
          } else {
            const newId = await ctx.runMutation(api.plugins.createInstrumentCategory, {
              clerkId: args.clerkId,
              name: category.name,
              pluginTypeId: undefined,
            });
            instrumentCategoryIdMap.set(category.id, newId);
          }
        } catch (error: any) {
          errors.push(`Failed to process instrument category ${category.name}: ${error.message}`);
        }
      }
      
      // 3. Import Studio Tool Categories
      for (const category of data.studioToolCategories || []) {
        try {
          const existing = await ctx.runQuery(api.plugins.getStudioToolCategories, {});
          const existingCat = existing.find((c: any) => c.name === category.name);
          
          if (existingCat) {
            studioToolCategoryIdMap.set(category.id, existingCat._id);
          } else {
            const newId = await ctx.runMutation(api.plugins.createStudioToolCategory, {
              clerkId: args.clerkId,
              name: category.name,
              pluginTypeId: undefined,
            });
            studioToolCategoryIdMap.set(category.id, newId);
          }
        } catch (error: any) {
          errors.push(`Failed to process studio tool category ${category.name}: ${error.message}`);
        }
      }
      
      // 4. Update existing plugins with specific category IDs
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Fetch all existing plugins once to avoid repeated queries
      const existingPlugins = await ctx.runQuery(api.plugins.getAllPublishedPlugins, {});
      const pluginsBySlug = new Map(existingPlugins.map((p: any) => [p.slug, p]));
      
      for (const plugin of data.plugins || []) {
        try {
          // Find existing plugin by slug from our map
          const existingPlugin = pluginsBySlug.get(plugin.slug) as { _id: Id<"plugins"> } | undefined;
          
          if (!existingPlugin) {
            skippedCount++;
            continue;
          }
          
          // Determine which specific category field to use
          let effectCategoryId: Id<"pluginEffectCategories"> | undefined;
          let instrumentCategoryId: Id<"pluginInstrumentCategories"> | undefined;
          let studioToolCategoryId: Id<"pluginStudioToolCategories"> | undefined;
          
          if (plugin.categoryId) {
            if (effectCategoryIdMap.has(plugin.categoryId)) {
              effectCategoryId = effectCategoryIdMap.get(plugin.categoryId);
            } else if (instrumentCategoryIdMap.has(plugin.categoryId)) {
              instrumentCategoryId = instrumentCategoryIdMap.get(plugin.categoryId);
            } else if (studioToolCategoryIdMap.has(plugin.categoryId)) {
              studioToolCategoryId = studioToolCategoryIdMap.get(plugin.categoryId);
            }
          }
          
          // Update the plugin with specific category
          await ctx.runMutation(api.plugins.updatePluginCategories, {
            clerkId: args.clerkId,
            pluginId: existingPlugin._id,
            effectCategoryId,
            instrumentCategoryId,
            studioToolCategoryId,
          });
          
          updatedCount++;
          
        } catch (error: any) {
          errors.push(`Failed to update plugin ${plugin.name}: ${error.message}`);
          errorCount++;
        }
      }
      
      return {
        success: true,
        stats: {
          effectCategories: effectCategoryIdMap.size,
          instrumentCategories: instrumentCategoryIdMap.size,
          studioToolCategories: studioToolCategoryIdMap.size,
          pluginsUpdated: updatedCount,
          pluginsSkipped: skippedCount,
          pluginsError: errorCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error("Update failed:", error);
      return {
        success: false,
        stats: {
          effectCategories: effectCategoryIdMap.size,
          instrumentCategories: instrumentCategoryIdMap.size,
          studioToolCategories: studioToolCategoryIdMap.size,
          pluginsUpdated: 0,
          pluginsSkipped: 0,
          pluginsError: data.plugins?.length || 0,
        },
        errors: [error.message, ...errors],
      };
    }
  },
});

