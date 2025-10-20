"use node";

import { v } from "convex/values";
import { internalAction, action, query } from "../_generated/server";
import { internal, api } from "../_generated/api";

/**
 * Handle Instagram OAuth callback
 * Exchange code for long-lived access token
 */
export const handleOAuthCallback = internalAction({
  args: {
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Remove hash fragment if present
      const cleanCode = args.code.split("#")[0];

      console.log("🔄 Step 1: Exchange Facebook code for access token...");

      // Step 1: Exchange code for Facebook access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/auth/instagram/callback&code=${cleanCode}`
      );

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error("❌ Token exchange failed:", tokenData);
        throw new Error(tokenData.error?.message || "Failed to get access token");
      }

      console.log("✅ Facebook access token obtained");

      // Step 2: Get user's Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenData.access_token}`
      );

      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("No Facebook pages found. You need a Facebook Page linked to your Instagram Business account.");
      }

      console.log("✅ Facebook pages found:", pagesData.data.length);

      // Step 3: Get Instagram Business account from first page
      const pageId = pagesData.data[0].id;
      const pageAccessToken = pagesData.data[0].access_token;

      const instagramAccountResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );

      const instagramAccountData = await instagramAccountResponse.json();

      if (!instagramAccountData.instagram_business_account) {
        throw new Error("No Instagram Business account linked to this Facebook Page. Link your Instagram in Facebook Page settings.");
      }

      const instagramId = instagramAccountData.instagram_business_account.id;
      console.log("✅ Instagram Business account found:", instagramId);

      // Step 4: Get Instagram account details
      const accountResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramId}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`
      );

      const accountData = await accountResponse.json();

      console.log("✅ Instagram account info:", accountData);

      // Step 5: Calculate token expiry
      // Page access tokens don't expire (as long as page exists)
      const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000); // Set to 60 days for safety

      // Step 6: Save integration to database
      await ctx.runMutation(internal.integrations.internal.saveIntegration, {
        token: pageAccessToken, // Use page access token (not user token)
        expiresAt,
        instagramId: accountData.id,
        username: accountData.username,
      });

      console.log("✅ Instagram integration saved");
      
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
export const getUserPosts: any = action({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    status: v.number(),
    data: v.any(),
  }),
  handler: async (ctx, args): Promise<{ status: number; data: any }> => {
    try {
      // Get user's Instagram integration
      const integration: any = await ctx.runQuery(internal.integrations.internal.getIntegration, {
        userId: args.userId,
      });

      if (!integration) {
        return { status: 404, data: { error: "No Instagram integration found" } };
      }

      // Fetch posts from Instagram
      const response: any = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${integration.token}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Instagram posts");
      }

      const data: any = await response.json();

      return {
        status: 200,
        data: data.data || [],
      };
    } catch (error) {
      console.error("❌ Get posts error:", error);
      return {
        status: 500,
        data: { error: "Failed to fetch posts" },
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

      if (!data.access_token) {
        console.error("❌ Token refresh failed");
        return null;
      }

      // Update integration with new token and expiry
      const newExpiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000);
      
      await ctx.runMutation(internal.integrations.internal.updateToken, {
        userId: args.userId,
        token: data.access_token,
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

