"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enhance a single plugin description using OpenAI GPT-4
 */
export const enhancePluginDescription = action({
  args: {
    clerkId: v.string(),
    pluginId: v.id("plugins"),
  },
  returns: v.object({
    success: v.boolean(),
    originalDescription: v.optional(v.string()),
    enhancedDescription: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    originalDescription?: string;
    enhancedDescription?: string;
    error?: string;
  }> => {
    try {
      // Verify admin access
      const user: any = await ctx.runQuery(api.users.getUserFromClerk, {
        clerkId: args.clerkId,
      });

      if (!user?.admin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get the plugin
      const plugin: any = await ctx.runQuery(api.plugins.getPluginById, {
        pluginId: args.pluginId,
      });

      if (!plugin) {
        throw new Error("Plugin not found");
      }

      const originalDescription: string = plugin.description || "";
      
      if (!originalDescription) {
        return {
          success: false,
          error: "Plugin has no description to enhance",
        };
      }

      // Call OpenAI to enhance the description
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert music production copywriter. Your task is to enhance plugin descriptions to be more engaging, informative, and well-formatted for a marketplace.

Guidelines:
- Keep the core information and features from the original text
- Improve readability with proper paragraphs and formatting
- Make it more engaging and professional
- Use HTML formatting: <p> for paragraphs, <strong> for emphasis, <ul>/<li> for lists
- Keep technical details accurate
- Make it concise but comprehensive (aim for 2-4 paragraphs)
- Highlight key features and benefits
- Return ONLY the enhanced HTML description, no additional commentary`,
          },
          {
            role: "user",
            content: `Original description:\n\n${originalDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const enhancedDescription = completion.choices[0]?.message?.content;

      if (!enhancedDescription) {
        throw new Error("Failed to generate enhanced description");
      }

      // Update the plugin with the enhanced description
      await ctx.runMutation(api.plugins.updatePlugin, {
        clerkId: args.clerkId,
        pluginId: args.pluginId,
        description: enhancedDescription,
      });

      return {
        success: true,
        originalDescription,
        enhancedDescription,
      };
    } catch (error: any) {
      console.error("Error enhancing plugin description:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Batch enhance all plugin descriptions
 */
export const enhanceAllPluginDescriptions = action({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()), // Optional limit for testing
  },
  returns: v.object({
    success: v.boolean(),
    totalProcessed: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  }> => {
    try {
      // Verify admin access
      const user: any = await ctx.runQuery(api.users.getUserFromClerk, {
        clerkId: args.clerkId,
      });

      if (!user?.admin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get all plugins
      const allPlugins: any[] = await ctx.runQuery(api.plugins.getAllPlugins, {
        clerkId: args.clerkId,
      });

      const pluginsToProcess: any[] = args.limit 
        ? allPlugins.slice(0, args.limit) 
        : allPlugins;

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const plugin of pluginsToProcess) {
        try {
          const result = await ctx.runAction(api.enhancePluginDescriptions.enhancePluginDescription, {
            clerkId: args.clerkId,
            pluginId: plugin._id,
          });

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            const errorMsg = `${plugin.name}: ${result.error}`;
            errors.push(errorMsg);
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          errorCount++;
          const errorMsg = `${plugin.name}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ Error processing ${plugin.name}:`, error);
        }
      }

      return {
        success: true,
        totalProcessed: pluginsToProcess.length,
        successCount,
        errorCount,
        errors,
      };
    } catch (error: any) {
      console.error("Error in batch enhancement:", error);
      return {
        success: false,
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        errors: [error.message],
      };
    }
  },
});

