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
    
    // Get team ID from project name - it's in the scope error
    // "pauseplayrepeat1246534s-projects" suggests team ID might be different
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !vercelProjectId || !vercelTeamId) {
      console.error("Vercel config missing:", { 
        hasToken: !!vercelToken, 
        hasProjectId: !!vercelProjectId,
        hasTeamId: !!vercelTeamId 
      });
      return {
        success: false,
        message: "Vercel API not configured. Contact support.",
      };
    }

    console.log("Adding domain to Vercel:", { 
      domain: args.domain, 
      projectId: vercelProjectId.substring(0, 10) + "...",
      teamId: vercelTeamId,
    });

    try {
      // For team projects, MUST include teamId parameter
      console.log("Fetching Vercel API...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains?teamId=${vercelTeamId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: args.domain,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      console.log("Vercel API responded with status:", response.status);
      
      const data = await response.json();
      console.log("Vercel API response data:", data);

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
          message: (data as any)?.error?.message || "Failed to add domain to Vercel",
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
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: "Request timed out after 15 seconds. Vercel API may be slow or unreachable.",
        };
      }
      
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
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !vercelProjectId || !vercelTeamId) {
      return { success: true, message: "Vercel API not configured" };
    }

    try {
      // Remove main domain
      await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${args.domain}?teamId=${vercelTeamId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      // Remove www subdomain
      await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/www.${args.domain}?teamId=${vercelTeamId}`,
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

