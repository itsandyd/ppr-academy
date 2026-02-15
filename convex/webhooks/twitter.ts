"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

/**
 * Process Twitter/X Account Activity API webhook
 * Handles Direct Messages and mentions
 *
 * Twitter webhook format:
 * {
 *   "for_user_id": "2244994945",
 *   "direct_message_events": [...],
 *   "tweet_create_events": [...], // mentions
 *   "users": {...}
 * }
 */
export const processWebhook = internalAction({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const payload = args.payload;
      const forUserId = payload.for_user_id;

      // Handle Direct Messages
      if (payload.direct_message_events && payload.direct_message_events.length > 0) {
        for (const dmEvent of payload.direct_message_events) {
          // Only process message_create events (not read receipts, etc.)
          if (dmEvent.type !== "message_create") continue;

          const messageData = dmEvent.message_create;
          const senderId = messageData.sender_id;
          const messageText = messageData.message_data?.text;

          // Don't respond to our own messages
          if (senderId === forUserId) {
            continue;
          }

          if (!messageText) continue;

          // Find automation by keyword
          const matcher = await ctx.runQuery(
            (api as any).automations.findAutomationByKeyword,
            { keyword: messageText.toLowerCase() }
          );

          if (!matcher || !matcher.trigger) {
            continue;
          }

          // Get the Twitter account token
          const account = await ctx.runQuery(
            internal.socialDMQueries.getAccountByPlatformUserId,
            { platform: "twitter", platformUserId: forUserId }
          );

          if (!account?.accessToken) {
            console.error("❌ No Twitter token found for user:", forUserId);
            continue;
          }

          // Execute the automation
          await executeTwitterAutomation(ctx, {
            automation: matcher,
            senderId,
            recipientId: forUserId,
            messageText,
            accessToken: account.accessToken,
            users: payload.users || {},
          });
        }
      }

      // Handle mentions (tweet_create_events with in_reply_to)
      if (payload.tweet_create_events && payload.tweet_create_events.length > 0) {
        for (const tweet of payload.tweet_create_events) {
          // Skip our own tweets
          if (tweet.user?.id_str === forUserId) continue;

          // Check if this mentions us
          const mentions = tweet.entities?.user_mentions || [];
          const mentionsUs = mentions.some((m: any) => m.id_str === forUserId);

          if (!mentionsUs) continue;

          // Could add mention-based automation here
          // For now, just log it
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Twitter webhook processing error:", error);
      return null;
    }
  },
});

/**
 * Execute Twitter automation (send DM response)
 */
async function executeTwitterAutomation(
  ctx: any,
  options: {
    automation: any;
    senderId: string;
    recipientId: string;
    messageText: string;
    accessToken: string;
    users: Record<string, any>;
  }
) {
  const { automation, senderId, recipientId, messageText, accessToken, users } = options;

  if (!automation.listener) {
    return;
  }

  const listener = automation.listener;
  const senderInfo = users[senderId];
  const senderName = senderInfo?.name || senderInfo?.screen_name || "there";

  // MESSAGE type - send static response
  if (listener.listener === "MESSAGE") {
    let dmMessage = listener.prompt || "Thanks for reaching out!";

    // Simple personalization
    dmMessage = dmMessage.replace(/\{\{name\}\}/g, senderName);
    dmMessage = dmMessage.replace(/\{\{firstName\}\}/g, senderName.split(" ")[0]);

    // Send the DM
    const result = await ctx.runAction(
      internal.socialDM.sendDMInternal,
      {
        platform: "twitter" as const,
        accessToken,
        recipientId: senderId,
        message: dmMessage,
      }
    );

    if (!result.success) {
      console.error("❌ Twitter DM failed:", result.error);
    }

    // Track the response
    await ctx.runMutation(
      (internal as any).automations.trackResponse,
      { automationId: automation._id, type: "DM" }
    );
  }

  // SMART_AI type - generate AI response
  if (listener.listener === "SMART_AI" || listener.listener === "SMARTAI") {
    const systemPrompt = buildTwitterAIPrompt(listener.prompt);

    // Generate AI response
    const aiResponse = await generateTwitterAIResponse(systemPrompt, messageText);

    if (!aiResponse) {
      console.error("❌ No AI response generated");
      return;
    }

    // Send the DM
    const result = await ctx.runAction(
      internal.socialDM.sendDMInternal,
      {
        platform: "twitter" as const,
        accessToken,
        recipientId: senderId,
        message: aiResponse,
      }
    );

    if (!result.success) {
      console.error("❌ Twitter DM failed:", result.error);
    }

    // Track the response
    await ctx.runMutation(
      (internal as any).automations.trackResponse,
      { automationId: automation._id, type: "DM" }
    );
  }
}

/**
 * Build system prompt for Twitter AI
 */
function buildTwitterAIPrompt(customPrompt?: string): string {
  const basePrompt = `You are a helpful AI assistant responding to Twitter/X DMs.

Your personality:
- Friendly and concise
- Professional but approachable
- Keep responses SHORT (280 chars ideal, max 500)

Guidelines:
- Be helpful and engaging
- Never pretend to be human - if asked, say you're an AI assistant
- Use emojis sparingly
`;

  if (customPrompt && customPrompt.trim()) {
    return `${basePrompt}

CUSTOM INSTRUCTIONS:
${customPrompt}`;
  }

  return basePrompt;
}

/**
 * Generate AI response for Twitter
 */
async function generateTwitterAIResponse(
  systemPrompt: string,
  message: string
): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 100, // Keep very short for Twitter
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("❌ OpenAI error:", error);
    return null;
  }
}

/**
 * CRC token validation for Twitter webhook registration
 * Twitter requires a CRC (Challenge Response Check) to verify webhook URL
 */
export const generateCRCResponse = internalAction({
  args: {
    crcToken: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const crypto = await import("crypto");
    const consumerSecret = process.env.TWITTER_CLIENT_SECRET || "";

    const hmac = crypto.createHmac("sha256", consumerSecret);
    hmac.update(args.crcToken);
    const responseToken = hmac.digest("base64");

    return `sha256=${responseToken}`;
  },
});
