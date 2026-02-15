"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Public Action Wrappers for Social Media DM Webhooks
 * These actions can be called from API routes and will route to internal handlers
 */

/**
 * Process Instagram webhook (public wrapper)
 * Routes to the internal Instagram webhook processor
 */
export const processInstagramWebhook = action({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      // Call the internal Instagram webhook processor
      await ctx.runAction(internal.webhooks.instagram.processWebhook, {
        payload: args.payload,
      });
    } catch (error) {
      console.error("❌ Instagram webhook processing error:", error);
    }

    return null;
  },
});

/**
 * Process Twitter webhook (public wrapper)
 * Routes to the internal Twitter webhook processor
 */
export const processTwitterWebhook = action({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      // Call the internal Twitter webhook processor
      await ctx.runAction(internal.webhooks.twitter.processWebhook, {
        payload: args.payload,
      });
    } catch (error) {
      console.error("❌ Twitter webhook processing error:", error);
    }

    return null;
  },
});

/**
 * Process Facebook webhook (public wrapper)
 * Routes to the internal Facebook webhook processor
 */
export const processFacebookWebhook = action({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      // Call the internal Facebook webhook processor
      await ctx.runAction(internal.webhooks.facebook.processWebhook, {
        payload: args.payload,
      });
    } catch (error) {
      console.error("❌ Facebook webhook processing error:", error);
    }

    return null;
  },
});

/**
 * Twitter CRC Response (public wrapper)
 * Required for Twitter webhook registration verification
 */
export const getTwitterCRCResponse = action({
  args: {
    crcToken: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    return await ctx.runAction(internal.webhooks.twitter.generateCRCResponse, {
      crcToken: args.crcToken,
    });
  },
});

/**
 * Facebook Webhook Verification (public wrapper)
 * Required for Facebook webhook registration
 */
export const verifyFacebookWebhook = action({
  args: {
    mode: v.string(),
    token: v.string(),
    challenge: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    return await ctx.runAction(internal.webhooks.facebook.verifyWebhook, {
      mode: args.mode,
      token: args.token,
      challenge: args.challenge,
    });
  },
});

