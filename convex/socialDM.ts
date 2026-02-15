"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// UNIFIED SOCIAL MEDIA DM SERVICE
// Supports: Instagram, Twitter/X, Facebook Messenger
// ============================================================================

type DMResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  platform: "instagram" | "twitter" | "facebook";
};

type SocialAccount = {
  _id: Id<"socialAccounts">;
  platform: string;
  accessToken: string;
  platformUserId: string;
  platformUsername?: string;
  platformData?: any;
};

// ============================================================================
// INSTAGRAM DM (Already implemented - wrapper for consistency)
// ============================================================================

/**
 * Send Instagram DM using Facebook Graph API
 * Uses Page Access Token with Instagram Business Account
 */
async function sendInstagramDM(options: {
  accessToken: string;
  recipientId: string;
  message: string;
  instagramBusinessAccountId: string;
}): Promise<DMResult> {
  const { accessToken, recipientId, message, instagramBusinessAccountId } = options;

  try {
    const url = `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Instagram DM failed:", error);
      return {
        success: false,
        error: (error as any)?.error?.message || "Failed to send Instagram DM",
        platform: "instagram",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: (data as any)?.message_id,
      platform: "instagram",
    };
  } catch (error: any) {
    console.error("Instagram DM error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      platform: "instagram",
    };
  }
}

// ============================================================================
// TWITTER/X DM
// Requires OAuth 2.0 with dm.write scope
// API: POST /2/dm_conversations/with/:participant_id/messages
// ============================================================================

/**
 * Send Twitter/X DM using Twitter API v2
 * Requires elevated access and dm.write scope
 */
async function sendTwitterDM(options: {
  accessToken: string;
  recipientId: string;
  message: string;
}): Promise<DMResult> {
  const { accessToken, recipientId, message } = options;

  try {
    // Twitter API v2 DM endpoint
    const url = `https://api.twitter.com/2/dm_conversations/with/${recipientId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Twitter DM failed:", error);

      // Handle specific Twitter errors
      const errorMessage = (error as any)?.detail ||
                           (error as any)?.errors?.[0]?.message ||
                           "Failed to send Twitter DM";

      return {
        success: false,
        error: errorMessage,
        platform: "twitter",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: (data as any)?.data?.dm_event_id,
      platform: "twitter",
    };
  } catch (error: any) {
    console.error("Twitter DM error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      platform: "twitter",
    };
  }
}

/**
 * Get Twitter user ID from username (needed for DMs)
 * Twitter DMs require the numeric user ID, not the @username
 */
async function getTwitterUserId(accessToken: string, username: string): Promise<string | null> {
  try {
    // Remove @ if present
    const cleanUsername = username.replace(/^@/, "");

    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${cleanUsername}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get Twitter user ID");
      return null;
    }

    const data = await response.json();
    return (data as any)?.data?.id || null;
  } catch (error) {
    console.error("Error getting Twitter user ID:", error);
    return null;
  }
}

// ============================================================================
// FACEBOOK MESSENGER
// Uses Send API: POST /{page-id}/messages
// Requires pages_messaging permission
// ============================================================================

/**
 * Send Facebook Messenger message using Send API
 * Only works for users who have interacted with the Page
 */
async function sendFacebookDM(options: {
  pageAccessToken: string;
  pageId: string;
  recipientId: string;
  message: string;
}): Promise<DMResult> {
  const { pageAccessToken, pageId, recipientId, message } = options;

  try {
    // Facebook Send API
    const url = `https://graph.facebook.com/v21.0/${pageId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: "RESPONSE", // or "UPDATE" for non-response messages
        access_token: pageAccessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Facebook DM failed:", error);

      // Handle specific Facebook errors
      const errorMessage = (error as any)?.error?.message || "Failed to send Facebook message";

      return {
        success: false,
        error: errorMessage,
        platform: "facebook",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: (data as any)?.message_id,
      platform: "facebook",
    };
  } catch (error: any) {
    console.error("Facebook DM error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      platform: "facebook",
    };
  }
}

// ============================================================================
// UNIFIED DM ACTION - Main entry point
// ============================================================================

/**
 * Send a DM to a user on any supported platform
 * Automatically routes to the correct platform API
 */
export const sendDirectMessage = action({
  args: {
    accountId: v.id("socialAccounts"),
    recipientId: v.string(), // Platform-specific user ID
    message: v.string(),
    // Optional: for Twitter, can provide username instead of ID
    recipientUsername: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
    platform: v.string(),
  }),
  handler: async (ctx, args): Promise<DMResult> => {
    // Get account details
    const account = await ctx.runQuery(internal.socialDMQueries.getAccountById, {
      accountId: args.accountId,
    }) as SocialAccount | null;

    if (!account) {
      return {
        success: false,
        error: "Social account not found",
        platform: "instagram", // default
      };
    }

    if (!account.accessToken) {
      return {
        success: false,
        error: "Account not connected or token expired",
        platform: account.platform as any,
      };
    }

    // Route to correct platform
    switch (account.platform) {
      case "instagram": {
        const instagramBusinessAccountId =
          account.platformData?.instagramBusinessAccountId ||
          account.platformUserId;

        if (!instagramBusinessAccountId) {
          return {
            success: false,
            error: "Instagram Business Account ID not found",
            platform: "instagram",
          };
        }

        return sendInstagramDM({
          accessToken: account.accessToken,
          recipientId: args.recipientId,
          message: args.message,
          instagramBusinessAccountId,
        });
      }

      case "twitter": {
        let recipientId = args.recipientId;

        // If username provided instead of ID, look up the ID
        if (args.recipientUsername && !args.recipientId) {
          const userId = await getTwitterUserId(account.accessToken, args.recipientUsername);
          if (!userId) {
            return {
              success: false,
              error: "Could not find Twitter user",
              platform: "twitter",
            };
          }
          recipientId = userId;
        }

        return sendTwitterDM({
          accessToken: account.accessToken,
          recipientId,
          message: args.message,
        });
      }

      case "facebook": {
        const pageId = account.platformData?.facebookPageId;
        const pageAccessToken = account.platformData?.facebookPageAccessToken || account.accessToken;

        if (!pageId) {
          return {
            success: false,
            error: "Facebook Page ID not found",
            platform: "facebook",
          };
        }

        return sendFacebookDM({
          pageAccessToken,
          pageId,
          recipientId: args.recipientId,
          message: args.message,
        });
      }

      default:
        return {
          success: false,
          error: `DM not supported for platform: ${account.platform}`,
          platform: account.platform as any,
        };
    }
  },
});

/**
 * Internal action for sending DMs from automations/webhooks
 */
export const sendDMInternal = internalAction({
  args: {
    platform: v.union(v.literal("instagram"), v.literal("twitter"), v.literal("facebook")),
    accessToken: v.string(),
    recipientId: v.string(),
    message: v.string(),
    // Platform-specific options
    instagramBusinessAccountId: v.optional(v.string()),
    facebookPageId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<DMResult> => {
    switch (args.platform) {
      case "instagram":
        if (!args.instagramBusinessAccountId) {
          return { success: false, error: "Missing Instagram Business Account ID", platform: "instagram" };
        }
        return sendInstagramDM({
          accessToken: args.accessToken,
          recipientId: args.recipientId,
          message: args.message,
          instagramBusinessAccountId: args.instagramBusinessAccountId,
        });

      case "twitter":
        return sendTwitterDM({
          accessToken: args.accessToken,
          recipientId: args.recipientId,
          message: args.message,
        });

      case "facebook":
        if (!args.facebookPageId) {
          return { success: false, error: "Missing Facebook Page ID", platform: "facebook" };
        }
        return sendFacebookDM({
          pageAccessToken: args.accessToken,
          pageId: args.facebookPageId,
          recipientId: args.recipientId,
          message: args.message,
        });
    }
  },
});

// Helper queries and mutations moved to socialDMQueries.ts

// ============================================================================
// BATCH DM SENDING
// ============================================================================

/**
 * Send DMs to multiple recipients (with rate limiting)
 */
export const sendBatchDMs = action({
  args: {
    accountId: v.id("socialAccounts"),
    recipients: v.array(v.object({
      recipientId: v.string(),
      message: v.string(),
    })),
    delayMs: v.optional(v.number()), // Delay between messages (default 1000ms)
  },
  returns: v.object({
    totalSent: v.number(),
    totalFailed: v.number(),
    results: v.array(v.object({
      recipientId: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const delay = args.delayMs || 1000; // Default 1 second between messages
    const results: Array<{ recipientId: string; success: boolean; error?: string }> = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < args.recipients.length; i++) {
      const recipient = args.recipients[i];

      // Add delay between messages (except for first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        const result = await ctx.runAction(api.socialDM.sendDirectMessage, {
          accountId: args.accountId,
          recipientId: recipient.recipientId,
          message: recipient.message,
        });

        results.push({
          recipientId: recipient.recipientId,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }
      } catch (error: any) {
        totalFailed++;
        results.push({
          recipientId: recipient.recipientId,
          success: false,
          error: error.message,
        });
      }
    }

    return { totalSent, totalFailed, results };
  },
});
