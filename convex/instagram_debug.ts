import { query, action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

/**
 * Debug: Check what permissions a token has
 * Run this from Convex Dashboard to see your token's scopes
 */
export const debugTokenPermissions = action({
  args: {
    username: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Get the token from the database using the existing query
    const tokenData = await ctx.runQuery(api.instagram_debug.getTokenByUsername, {
      username: args.username,
    });

    if (!tokenData?.token) {
      return { error: "No token found for " + args.username };
    }

    // Check token permissions with Meta's debug_token endpoint
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
      return { error: "Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET" };
    }

    const appAccessToken = `${appId}|${appSecret}`;
    
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${tokenData.token}&access_token=${appAccessToken}`;
    
    console.log("🔍 Debugging token for:", args.username);
    
    const response = await fetch(debugUrl);
    const data = await response.json();
    
    console.log("📋 Token debug result:", JSON.stringify(data, null, 2));
    
    return {
      username: args.username,
      tokenPreview: tokenData.token.substring(0, 20) + "...",
      debugData: data,
    };
  },
});

/**
 * Helper query to get token by username
 */
export const getTokenByUsername = query({
  args: {
    username: v.string(),
  },
  returns: v.union(
    v.object({
      token: v.string(),
      instagramId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();

    if (!integration?.token) {
      return null;
    }

    return {
      token: integration.token,
      instagramId: integration.instagramId,
    };
  },
});

/**
 * Debug function to test specific Instagram account data
 */
export const getAccountData = query({
  args: {
    accountId: v.string(),
  },
  returns: v.union(
    v.object({
      accountId: v.string(),
      username: v.string(),
      platformUserId: v.string(),
      instagramBusinessId: v.string(),
      accessToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    console.log("🔍 Looking for account:", args.accountId);
    
    const account = await ctx.db.get(args.accountId as any) as any;
    
    if (!account) {
      console.log("❌ Account not found");
      return null;
    }

    console.log("✅ Account found:", account.platformUsername);
    console.log("📱 Platform:", account.platform);
    console.log("🔗 Instagram Business ID:", account.platformData?.instagramBusinessAccountId);

    return {
      accountId: String(account._id),
      username: account.platformUsername || "",
      platformUserId: account.platformUserId || "",
      instagramBusinessId: account.platformData?.instagramBusinessAccountId || account.platformUserId || "",
      accessToken: account.accessToken || "",
    };
  },
});
