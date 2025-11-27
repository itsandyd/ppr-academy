"use node";

import { v } from "convex/values";
import { internalAction, action, query } from "../_generated/server";
import { internal, api } from "../_generated/api";

/**
 * Handle Instagram OAuth callback
 * Exchange code for long-lived access token
 * PUBLIC action - called from client-side callback page
 */
export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    userId: v.optional(v.id("users")), // Optional: if we have userId from client
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Remove hash fragment if present
      const cleanCode = args.code.split("#")[0];

      console.log("🔄 Step 1: Exchange Facebook code for SHORT-LIVED access token...");

      // Construct redirect URI (must be absolute)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academy.pauseplayrepeat.com";
      const redirectUri = `${baseUrl}/auth/instagram/callback`;
      
      console.log("🔗 Using redirect URI:", redirectUri);

      // Step 1: Exchange code for SHORT-LIVED Facebook access token (~1-2 hours)
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID}` +
        `&client_secret=${process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${cleanCode}`
      );

      const shortLivedTokenData = await tokenResponse.json();

      if (!(shortLivedTokenData as any)?.access_token) {
        console.error("❌ Token exchange failed:", shortLivedTokenData);
        throw new Error((shortLivedTokenData as any)?.error?.message || "Failed to get access token");
      }

      console.log("✅ Short-lived token obtained (expires in ~1-2 hours)");

      // Step 2: Exchange short-lived token for LONG-LIVED token (~60 days)
      // THIS IS CRITICAL - Page tokens derived from long-lived tokens NEVER EXPIRE
      console.log("🔄 Step 2: Exchanging for LONG-LIVED token...");
      
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID}` +
        `&client_secret=${process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET}` +
        `&fb_exchange_token=${(shortLivedTokenData as any)?.access_token}`
      );

      const longLivedTokenData = await longLivedResponse.json();

      let userAccessToken: string;
      let tokenExpiresIn: number;

      if ((longLivedTokenData as any)?.access_token) {
        userAccessToken = (longLivedTokenData as any).access_token;
        tokenExpiresIn = (longLivedTokenData as any).expires_in || 5184000; // 60 days
        console.log("✅ Long-lived token obtained (expires in ~60 days)");
      } else {
        console.warn("⚠️ Could not get long-lived token, falling back to short-lived");
        userAccessToken = (shortLivedTokenData as any).access_token;
        tokenExpiresIn = (shortLivedTokenData as any).expires_in || 3600; // 1 hour
      }

      // Step 3: Get user's Facebook pages WITH the long-lived token
      // Page tokens derived from long-lived user tokens NEVER EXPIRE
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
      );

      const pagesData = await pagesResponse.json();

      if (!(pagesData as any)?.data || (pagesData as any)?.data?.length === 0) {
        throw new Error("No Facebook pages found. You need a Facebook Page linked to your Instagram Business account.");
      }

      console.log("✅ Facebook pages found:", (pagesData as any)?.data?.length);

      // Step 4: Get Instagram Business account from first page
      const pageId = (pagesData as any)?.data?.[0]?.id;
      const pageAccessToken = (pagesData as any)?.data?.[0]?.access_token;
      // Note: pageAccessToken derived from long-lived user token NEVER EXPIRES

      const instagramAccountResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );

      const instagramAccountData = await instagramAccountResponse.json();

      if (!(instagramAccountData as any)?.instagram_business_account) {
        throw new Error("No Instagram Business account linked to this Facebook Page. Link your Instagram in Facebook Page settings.");
      }

      const instagramId = (instagramAccountData as any)?.instagram_business_account?.id;
      console.log("✅ Instagram Business account found:", instagramId);

      // Step 5: Get Instagram account details
      const accountResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramId}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`
      );

      const accountData = await accountResponse.json();

      console.log("✅ Instagram account info:", accountData);

      // Step 6: Calculate token expiry
      // Page access tokens derived from long-lived user tokens NEVER EXPIRE
      // But we set a far-future date for tracking purposes
      const expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year (effectively never)

      // Step 7: Save integration to database
      if (!args.userId) {
        throw new Error("User ID is required to save integration");
      }

      // @ts-ignore - Deep type instantiation
      await ctx.runMutation(internal.integrations.internal.saveIntegration, {
        token: pageAccessToken, // Page token derived from long-lived user token (NEVER EXPIRES)
        expiresAt,
        instagramId: (accountData as any)?.id,
        username: (accountData as any)?.username,
        userId: args.userId,
        profilePictureUrl: (accountData as any)?.profile_picture_url,
      });

      console.log("✅ Instagram integration saved with NEVER-EXPIRING page token for user:", args.userId);
      
      return null;
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      throw error;
    }
  },
});

/**
 * Get user's Instagram posts (for attaching to comment automations)
 */
export const getUserPosts = action({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    status: v.number(),
    data: v.any(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user's Instagram connection (use internal query to avoid circular imports)
      const integration: any = await ctx.runQuery(internal.integrations.internal.getIntegration, {
        userId: args.userId,
      });

      if (!integration) {
        console.error("❌ No Instagram connection found for user:", args.userId);
        return { status: 404, data: { error: "No Instagram connection found" } };
      }

      console.log("✅ Instagram connection found. Username:", integration.platformUsername || integration.username);

      // Get Instagram Business Account ID and access token
      let instagramId: string;
      let accessToken: string;

      if (integration.platformData?.instagramBusinessAccountId) {
        // New socialAccounts format
        instagramId = integration.platformData.instagramBusinessAccountId;
        accessToken = integration.accessToken;
      } else {
        // Legacy integrations format
        instagramId = integration.instagramId;
        accessToken = integration.token;
      }

      if (!instagramId || !accessToken) {
        console.error("❌ Missing Instagram ID or token");
        return { status: 400, data: { error: "Missing Instagram credentials" } };
      }

      // Fetch posts from Instagram Graph API using the Business Account ID
      // Note: For videos, media_url returns the video file. We need thumbnail_url for display.
      const url = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,caption,media_url,thumbnail_url,media_type,timestamp,permalink&limit=10&access_token=${accessToken}`;
      
      console.log("📡 Fetching Instagram posts from:", url.replace(accessToken, "***"));

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Instagram API error:", errorData);
        return { 
          status: response.status, 
          data: { error: (errorData as any)?.error?.message || "Failed to fetch posts" } 
        };
      }

      const data = await response.json();

      console.log("✅ Instagram posts fetched:", (data as any)?.data?.length || 0);

      return {
        status: 200,
        data: (data as any)?.data || [],
      };
    } catch (error: any) {
      console.error("❌ Get posts error:", error);
      return {
        status: 500,
        data: { error: error.message || "Failed to fetch posts" },
      };
    }
  },
});

/**
 * Refresh Instagram access token
 * Called automatically when token is close to expiry
 */
export const refreshAccessToken = internalAction({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const integration = await ctx.runQuery(internal.integrations.internal.getIntegration, {
        userId: args.userId,
      });

      if (!integration) {
        console.error("❌ No integration to refresh");
        return null;
      }

      // Refresh token
      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${integration.token}`
      );

      const data = await response.json();

      if (!(data as any)?.access_token) {
        console.error("❌ Token refresh failed");
        return null;
      }

      // Update integration with new token and expiry
      const newExpiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000);
      
      await ctx.runMutation(internal.integrations.internal.updateToken, {
        userId: args.userId,
        token: (data as any)?.access_token,
        expiresAt: newExpiresAt,
      });

      console.log("✅ Instagram token refreshed");
      return null;
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      return null;
    }
  },
});

// ==================== Helper Functions ====================

/**
 * Send Instagram DM
 */
async function sendInstagramDM(options: {
  accessToken: string;
  recipientId: string;
  message: string;
}): Promise<boolean> {
  const { accessToken, recipientId, message } = options;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("DM send error:", data);
      return false;
    }

    console.log("✅ DM sent:", data);
    return true;
  } catch (error) {
    console.error("sendInstagramDM error:", error);
    return false;
  }
}

/**
 * Reply to Instagram comment
 */
async function replyToComment(options: {
  accessToken: string;
  commentId: string;
  message: string;
}): Promise<boolean> {
  const { accessToken, commentId, message } = options;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${commentId}/replies`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      }
    );

    if (!response.ok) {
      console.error("Comment reply failed");
      return false;
    }

    console.log("✅ Comment reply sent");
    return true;
  } catch (error) {
    console.error("replyToComment error:", error);
    return false;
  }
}

