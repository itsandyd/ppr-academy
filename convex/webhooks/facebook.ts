"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

/**
 * Process Facebook Messenger webhook
 * Handles incoming messages from Facebook Messenger
 *
 * Facebook webhook format:
 * {
 *   "object": "page",
 *   "entry": [{
 *     "id": "PAGE_ID",
 *     "time": 1234567890,
 *     "messaging": [{
 *       "sender": { "id": "SENDER_PSID" },
 *       "recipient": { "id": "PAGE_ID" },
 *       "timestamp": 1234567890,
 *       "message": { "mid": "...", "text": "..." }
 *     }]
 *   }]
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

      // Verify this is a page subscription
      if (payload.object !== "page") {
        console.log("⚠️ Not a page webhook:", payload.object);
        return null;
      }

      console.log("📘 Facebook Messenger webhook received");

      // Process each entry
      for (const entry of payload.entry || []) {
        const pageId = entry.id;

        // Process each messaging event
        for (const event of entry.messaging || []) {
          // Handle incoming messages
          if (event.message && event.message.text) {
            const senderId = event.sender?.id;
            const messageText = event.message.text;

            // Don't respond to echo messages (messages sent by the page)
            if (event.message.is_echo) {
              console.log("⏭️ Ignoring echo message");
              continue;
            }

            console.log("💬 Facebook message received:", messageText.substring(0, 50) + "...");

            // Find automation by keyword
            const matcher = await ctx.runQuery(
              (api as any).automations.findAutomationByKeyword,
              { keyword: messageText.toLowerCase() }
            );

            if (!matcher || !matcher.trigger) {
              console.log("❌ No automation found for keyword:", messageText.substring(0, 30));
              continue;
            }

            // Get the Facebook account token
            const account = await ctx.runQuery(
              internal.socialDMQueries.getAccountByPlatformUserId,
              { platform: "facebook", platformUserId: pageId }
            );

            if (!account) {
              console.error("❌ No Facebook account found for page:", pageId);
              continue;
            }

            const pageAccessToken = account.platformData?.facebookPageAccessToken || account.accessToken;

            if (!pageAccessToken) {
              console.error("❌ No Facebook page token found for:", pageId);
              continue;
            }

            // Execute the automation
            await executeFacebookAutomation(ctx, {
              automation: matcher,
              senderId,
              pageId,
              messageText,
              pageAccessToken,
            });
          }

          // Handle postbacks (button clicks)
          if (event.postback) {
            console.log("📢 Facebook postback received:", event.postback.payload);
            // Could handle button click automations here
          }
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Facebook webhook processing error:", error);
      return null;
    }
  },
});

/**
 * Execute Facebook automation (send Messenger response)
 */
async function executeFacebookAutomation(
  ctx: any,
  options: {
    automation: any;
    senderId: string;
    pageId: string;
    messageText: string;
    pageAccessToken: string;
  }
) {
  const { automation, senderId, pageId, messageText, pageAccessToken } = options;

  if (!automation.listener) {
    console.log("❌ No listener configured");
    return;
  }

  const listener = automation.listener;

  // MESSAGE type - send static response
  if (listener.listener === "MESSAGE") {
    console.log("📤 Processing MESSAGE automation for Facebook");

    const dmMessage = listener.prompt || "Thanks for reaching out!";

    // Send the message
    const result = await ctx.runAction(
      internal.socialDM.sendDMInternal,
      {
        platform: "facebook" as const,
        accessToken: pageAccessToken,
        recipientId: senderId,
        message: dmMessage,
        facebookPageId: pageId,
      }
    );

    if (result.success) {
      console.log("✅ Facebook message sent successfully");
    } else {
      console.error("❌ Facebook message failed:", result.error);
    }

    // Track the response
    await ctx.runMutation(
      (internal as any).automations.trackResponse,
      { automationId: automation._id, type: "DM" }
    );
  }

  // SMART_AI type - generate AI response
  if (listener.listener === "SMART_AI" || listener.listener === "SMARTAI") {
    console.log("🤖 Processing Smart AI automation for Facebook");

    const systemPrompt = buildFacebookAIPrompt(listener.prompt);

    // Generate AI response
    const aiResponse = await generateFacebookAIResponse(systemPrompt, messageText);

    if (!aiResponse) {
      console.error("❌ No AI response generated");
      return;
    }

    // Send the message
    const result = await ctx.runAction(
      internal.socialDM.sendDMInternal,
      {
        platform: "facebook" as const,
        accessToken: pageAccessToken,
        recipientId: senderId,
        message: aiResponse,
        facebookPageId: pageId,
      }
    );

    if (result.success) {
      console.log("✅ Facebook Smart AI response sent");
    } else {
      console.error("❌ Facebook message failed:", result.error);
    }

    // Track the response
    await ctx.runMutation(
      (internal as any).automations.trackResponse,
      { automationId: automation._id, type: "DM" }
    );
  }
}

/**
 * Build system prompt for Facebook AI
 */
function buildFacebookAIPrompt(customPrompt?: string): string {
  const basePrompt = `You are a helpful AI assistant responding to Facebook Messenger messages.

Your personality:
- Friendly and conversational
- Professional but approachable
- Keep responses helpful and concise (1-3 sentences)

Guidelines:
- Be helpful and engaging
- Never pretend to be human - if asked, say you're an AI assistant
- Use emojis sparingly for personality
`;

  if (customPrompt && customPrompt.trim()) {
    return `${basePrompt}

CUSTOM INSTRUCTIONS:
${customPrompt}`;
  }

  return basePrompt;
}

/**
 * Generate AI response for Facebook
 */
async function generateFacebookAIResponse(
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
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("❌ OpenAI error:", error);
    return null;
  }
}

/**
 * Verify Facebook webhook subscription
 * Facebook requires a verify_token check for webhook registration
 */
export const verifyWebhook = internalAction({
  args: {
    mode: v.string(),
    token: v.string(),
    challenge: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || "ppr_academy_webhook_token";

    if (args.mode === "subscribe" && args.token === verifyToken) {
      console.log("✅ Facebook webhook verified");
      return args.challenge;
    }

    console.log("❌ Facebook webhook verification failed");
    return null;
  },
});

/**
 * Send typing indicator to show the page is "typing"
 * Good UX for AI responses that take time to generate
 */
export const sendTypingIndicator = internalAction({
  args: {
    pageId: v.string(),
    pageAccessToken: v.string(),
    recipientId: v.string(),
    action: v.union(v.literal("typing_on"), v.literal("typing_off")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const url = `https://graph.facebook.com/v21.0/${args.pageId}/messages`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: args.recipientId },
          sender_action: args.action,
          access_token: args.pageAccessToken,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to send typing indicator:", error);
      return false;
    }
  },
});
