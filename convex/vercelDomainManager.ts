"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Add domain to Vercel project via API
 */
export const addDomainToVercel = action({
  args: {
    domain: v.string(),
    storeId: v.id("stores"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID; // Optional: team ID for team projects

    if (!vercelToken || !vercelProjectId) {
      console.error("Vercel config missing:", { 
        hasToken: !!vercelToken, 
        hasProjectId: !!vercelProjectId 
      });
      return {
        success: false,
        message: "Vercel API not configured. Contact support.",
      };
    }

    console.log("Adding domain to Vercel:", { 
      domain: args.domain, 
      projectId: vercelProjectId.substring(0, 10) + "...",
      hasTeamId: !!vercelTeamId,
    });

    try {
      // For team projects, use v9 endpoint which works better with team tokens
      // Add domain to Vercel project
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: args.domain,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Vercel API error:", {
          status: response.status,
          data,
          projectId: vercelProjectId,
        });
        
        // Check if it's a scope/permission error
        if (response.status === 403 || response.status === 401) {
          return {
            success: false,
            message: "Vercel token lacks permissions. Recreate token with 'Full Account' scope.",
          };
        }
        
        // Project not found
        if (response.status === 404) {
          return {
            success: false,
            message: `Project ID '${vercelProjectId}' not found. Check VERCEL_PROJECT_ID in Convex env.`,
          };
        }
        
        return {
          success: false,
          message: data.error?.message || "Failed to add domain to Vercel",
        };
      }

      console.log("✅ Domain added to Vercel:", args.domain);

      // Also add www subdomain
      await fetch(
        `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `www.${args.domain}`,
          }),
        }
      );

      return {
        success: true,
        message: `Domain ${args.domain} added to Vercel successfully!`,
      };
    } catch (error: any) {
      console.error("Error adding domain to Vercel:", error);
      return {
        success: false,
        message: error.message || "Failed to add domain",
      };
    }
  },
});

/**
 * Remove domain from Vercel project
 */
export const removeDomainFromVercel = action({
  args: {
    domain: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !vercelProjectId) {
      return { success: true, message: "Vercel API not configured" };
    }

    try {
      // Remove main domain
      await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${args.domain}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      // Remove www subdomain
      await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/www.${args.domain}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      return {
        success: true,
        message: "Domain removed from Vercel",
      };
    } catch (error: any) {
      console.error("Error removing domain from Vercel:", error);
      return {
        success: true,
        message: "Domain removed locally",
      };
    }
  },
});

