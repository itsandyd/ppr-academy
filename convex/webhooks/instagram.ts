"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

// System prompt template for Smart AI conversations
const SMART_AI_SYSTEM_PROMPT = `You are a helpful AI assistant for a music producer/creator on Instagram. 

Your personality:
- Friendly and conversational
- Knowledgeable about music production
- Helpful but not pushy about sales
- Keep responses SHORT and suitable for Instagram DMs (1-3 sentences max)

Guidelines:
- Always be helpful and engaging
- If asked about products/courses, share the relevant links
- Never pretend to be human - if asked, say you're an AI assistant
- Use emojis sparingly for personality
- End conversations naturally, don't force endless dialogue
`;

/**
 * Process Instagram webhook payload
 * Handles both comments and DMs
 */
export const processWebhook = internalAction({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const entry = args.payload.entry?.[0];
      
      // Debug logging
      console.log("🔍 Instagram webhook received");
      
      if (!entry) {
        console.log("⚠️ No entry in webhook payload");
        return null;
      }

      // CASE 1: Direct Message (DM) via entry.messaging (Facebook Messenger style)
      if (entry.messaging && entry.messaging.length > 0) {
        const message = entry.messaging[0];
        const messageText = message.message?.text;
        const senderId = message.sender?.id;
        
        if (!messageText || !senderId) return null;

        console.log("💬 DM received:", messageText.substring(0, 50) + "...");

        // First, check for existing Smart AI conversation
        const existingConversation = await ctx.runQuery(
          internal.automations.findAutomationByChatHistory,
          { senderId, receiverId: entry.id }
        );

        if (existingConversation) {
          console.log("🔄 Continuing existing Smart AI conversation");
          await continueSmartAIConversation(ctx, {
            automationId: existingConversation.automationId,
            senderId,
            receiverId: entry.id,
            messageText,
            history: existingConversation.history,
          });
          return null;
        }

        // Find automation by keyword match
        const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
          keyword: messageText.toLowerCase(),
        });

        if (!matcher || !matcher.trigger) {
          console.log("❌ No automation found for keyword:", messageText.substring(0, 30));
          return null;
        }

        // Verify it's a DM trigger
        if (matcher.trigger.type !== "DM") {
          console.log("⚠️ Automation exists but not DM trigger");
          return null;
        }

        // Execute automation
        await executeAutomation(ctx, {
          automation: matcher,
          senderId,
          receiverId: entry.id,
          messageText,
          isDM: true,
        });
      }

      // CASE 2: Check entry.changes for both comments AND messages
      if (entry.changes && entry.changes.length > 0) {
        const change = entry.changes[0];
        
        // CASE 2a: Direct Message via entry.changes (Instagram style)
        if (change.field === "messages") {
          const messageData = change.value;
          const messageText = messageData?.message?.text || messageData?.text;
          const senderId = messageData?.sender?.id || messageData?.from?.id;
          
          if (!messageText || !senderId) {
            console.log("⚠️ No message text or sender in DM webhook");
            return null;
          }

          console.log("💬 DM received (changes):", messageText.substring(0, 50) + "...");

          // Check for existing Smart AI conversation
          const existingConversation = await ctx.runQuery(
            internal.automations.findAutomationByChatHistory,
            { senderId, receiverId: entry.id }
          );

          if (existingConversation) {
            console.log("🔄 Continuing existing Smart AI conversation");
            await continueSmartAIConversation(ctx, {
              automationId: existingConversation.automationId,
              senderId,
              receiverId: entry.id,
              messageText,
              history: existingConversation.history,
            });
            return null;
          }

          // Find automation by keyword match
          const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
            keyword: messageText.toLowerCase(),
          });

          if (!matcher || !matcher.trigger) {
            console.log("❌ No automation found for keyword:", messageText.substring(0, 30));
            return null;
          }

          // Verify it's a DM trigger
          if (matcher.trigger.type !== "DM") {
            console.log("⚠️ Automation exists but not DM trigger");
            return null;
          }

          // Execute automation
          await executeAutomation(ctx, {
            automation: matcher,
            senderId,
            receiverId: entry.id,
            messageText,
            isDM: true,
          });
          
          return null;
        }
        
        // CASE 2b: Comment on Post
        if (change.field !== "comments") return null;

        const commentText = change.value?.text;
        if (!commentText) return null;

        console.log("💬 Comment received:", commentText.substring(0, 50) + "...");

        // Find automation by keyword
        const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
          keyword: commentText.toLowerCase(),
        });

        if (!matcher || !matcher.trigger) {
          console.log("❌ No automation found for keyword:", commentText.substring(0, 30));
          return null;
        }

        // Verify it's a comment trigger AND post is attached
        if (matcher.trigger.type !== "COMMENT") {
          console.log("⚠️ Automation exists but not COMMENT trigger");
          return null;
        }

        const postId = change.value?.media?.id;
        const hasGlobalMonitoring = matcher.posts?.some((p: any) => p.postId === "ALL_POSTS_AND_FUTURE");
        const isPostAttached = matcher.posts?.some((p: any) => p.postId === postId);

        // Allow if either specific post is attached OR global monitoring is enabled
        if (!isPostAttached && !hasGlobalMonitoring) {
          console.log("⚠️ Post not attached to automation and global monitoring disabled");
          return null;
        }

        console.log(hasGlobalMonitoring 
          ? "✅ Global monitoring enabled - processing comment"
          : "✅ Specific post attached - processing comment"
        );

        // Execute automation
        await executeAutomation(ctx, {
          automation: matcher,
          senderId: change.value?.from?.id,
          receiverId: entry.id,
          messageText: commentText,
          isDM: false,
          commentId: change.value?.id,
        });
      }

      return null;
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      return null;
    }
  },
});

/**
 * Execute automation based on listener type
 */
async function executeAutomation(
  ctx: any,
  options: {
    automation: any;
    senderId: string;
    receiverId: string;
    messageText: string;
    isDM: boolean;
    commentId?: string;
  }
) {
  const { automation, senderId, receiverId, messageText, isDM, commentId } = options;

  if (!automation.listener) {
    console.log("❌ No listener configured");
    return;
  }

  const listener = automation.listener;
  const userPlan = automation.User?.subscription?.plan || "FREE";
  
  // Get fresh Instagram token via query
  const tokenData = await ctx.runQuery(api.socialMedia.getInstagramToken, {
    userId: automation.userId,
  });

  if (!tokenData?.accessToken) {
    console.error("❌ No active Instagram connection found");
    return;
  }

  console.log("✅ Found Instagram connection:", tokenData.username);
  const accessToken = tokenData.accessToken;

  // LISTENER TYPE 1: MESSAGE - Send DM with optional comment reply
  if (listener.listener === "MESSAGE") {
    console.log("📤 Processing MESSAGE automation");

    const dmMessage = listener.prompt || "Thanks for reaching out!";
      
    // For COMMENT triggers - send private message linked to comment
    if (!isDM && commentId) {
      console.log("📱 Comment trigger - sending private message");
      
      // Use Instagram's private reply API (links DM to the comment)
      const dmSuccess = await sendPrivateMessage({
        accessToken,
        commentId,
        message: dmMessage,
      });

      if (dmSuccess) {
        console.log("✅ Private message sent successfully!");
      } else {
        console.log("⚠️ Private message failed, trying direct DM...");
        
        // Fallback: Try sending direct DM to the user
        if (senderId) {
          await sendInstagramDM({
            accessToken,
            recipientId: senderId,
            message: dmMessage,
          });
        }
      }

      // Also post a public comment reply if configured
      if (listener.commentReply) {
        console.log("📝 Also posting public comment reply");
        await replyToComment({
          accessToken,
          commentId,
          message: listener.commentReply,
        });
      }
    }
    
    // For DM triggers - send direct message
    if (isDM && senderId) {
      console.log("📱 DM trigger - sending direct message");
      
      await sendInstagramDM({
        accessToken,
        recipientId: senderId,
        message: dmMessage,
      });
    }

    // Track the response
    await ctx.runMutation(internal.automations.trackResponse, {
      automationId: automation._id,
      type: isDM ? "DM" : "COMMENT",
    });

    return;
  }

  // LISTENER TYPE 2: Smart AI (Pro feature)
  if (listener.listener === "SMART_AI" || listener.listener === "SMARTAI") {
    // TODO: Revert to subscription check when ready for production
    // if (userPlan !== "PRO") {
    //   console.log("⚠️ Smart AI requires PRO plan");
    //   // Send upgrade message
    //   await sendInstagramDM({
    //     accessToken,
    //     recipientId: senderId,
    //     message: "🤖 Smart AI conversations are available on our Pro plan! Upgrade to unlock AI-powered responses.",
    //   });
    //   return;
    // }
    console.log("🤖 Smart AI enabled (plan check bypassed for development)");

    console.log("🤖 Activating Smart AI conversation");

    // Build system prompt with creator's custom prompt
    const systemPrompt = buildSmartAIPrompt(listener.prompt);

    // Generate AI response (no history yet - this is first message)
    const aiResponse = await generateAIResponse(systemPrompt, [], messageText);

    if (!aiResponse) {
      console.error("❌ No AI response generated");
      return;
    }

    // Save user message to history
    await ctx.runMutation(internal.automations.createChatHistory, {
      automationId: automation._id,
      senderId,
      receiverId,
      message: messageText,
      role: "user",
    });

    // Save AI response to history
    await ctx.runMutation(internal.automations.createChatHistory, {
      automationId: automation._id,
      senderId: receiverId,
      receiverId: senderId,
      message: aiResponse,
      role: "assistant",
    });

    // For comments, send private message
    if (!isDM && commentId) {
      await sendPrivateMessage({
        accessToken,
        commentId,
        message: aiResponse,
      });

      // Also reply to comment if configured
      if (listener.commentReply) {
        await replyToComment({
          accessToken,
          commentId,
          message: listener.commentReply,
        });
      }
    } else {
      // For DMs, send direct message
      await sendInstagramDM({
        accessToken,
        recipientId: senderId,
        message: aiResponse,
      });
    }

    // Track the response
    await ctx.runMutation(internal.automations.trackResponse, {
      automationId: automation._id,
      type: isDM ? "DM" : "COMMENT",
    });

    console.log("✅ Smart AI response sent successfully");
  }
}

/**
 * Continue an existing Smart AI conversation
 */
async function continueSmartAIConversation(
  ctx: any,
  options: {
    automationId: any;
    senderId: string;
    receiverId: string;
    messageText: string;
    history: Array<{ role: string; content: string }>;
  }
) {
  const { automationId, senderId, receiverId, messageText, history } = options;

  console.log("🤖 Continuing Smart AI conversation with", history.length, "messages");

  // Get automation details
  const automation = await ctx.runQuery(
    internal.automations.getAutomationWithListener,
    { automationId }
  );

  if (!automation) {
    console.log("❌ Automation not found for conversation continuation");
    return;
  }

  // TODO: Revert to subscription check when ready for production
  // Check if user still has PRO plan
  // if (automation.userPlan !== "PRO") {
  //   console.log("⚠️ User no longer has PRO plan");
  //   return;
  // }
  console.log("🤖 Continuing Smart AI (plan check bypassed for development)");

  // Get Instagram token
  const tokenData = await ctx.runQuery(api.socialMedia.getInstagramToken, {
    userId: automation.userId,
  });

  if (!tokenData?.accessToken) {
    console.error("❌ No active Instagram connection");
    return;
  }

  // Build system prompt
  const systemPrompt = buildSmartAIPrompt(automation.listener?.prompt);

  // Generate AI response with conversation history
  const aiResponse = await generateAIResponse(systemPrompt, history, messageText);

  if (!aiResponse) {
    console.error("❌ No AI response generated");
    return;
  }

  // Save user message to history
  await ctx.runMutation(internal.automations.createChatHistory, {
    automationId,
    senderId,
    receiverId,
    message: messageText,
    role: "user",
  });

  // Save AI response to history
  await ctx.runMutation(internal.automations.createChatHistory, {
    automationId,
    senderId: receiverId,
    receiverId: senderId,
    message: aiResponse,
    role: "assistant",
  });

  // Send the response
  await sendInstagramDM({
    accessToken: tokenData.accessToken,
    recipientId: senderId,
    message: aiResponse,
  });

  // Track the response
  await ctx.runMutation(internal.automations.trackResponse, {
    automationId,
    type: "DM",
  });

  console.log("✅ Smart AI continuation sent successfully");
}

/**
 * Build the system prompt for Smart AI
 */
function buildSmartAIPrompt(customPrompt?: string): string {
  if (customPrompt && customPrompt.trim()) {
    return `${SMART_AI_SYSTEM_PROMPT}

CREATOR'S CUSTOM INSTRUCTIONS:
${customPrompt}

Remember: Keep responses SHORT and suitable for Instagram DMs (1-3 sentences max).`;
  }
  
  return SMART_AI_SYSTEM_PROMPT;
}

/**
 * Generate AI response using OpenAI
 */
async function generateAIResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  currentMessage: string
): Promise<string | null> {
  try {
    // Build OpenAI messages
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (limit to last 10 for context window)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: "user",
      content: currentMessage,
    });

    console.log("🧠 Generating AI response with", messages.length, "messages");

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cost-effective for chat
      messages,
      max_tokens: 150, // Keep responses short for DMs
      temperature: 0.7,
      presence_penalty: 0.1, // Slight penalty to avoid repetition
    });

    const response = completion.choices[0]?.message?.content;

    if (response) {
      console.log("✅ AI generated:", response.substring(0, 50) + "...");
    }

    return response || null;
  } catch (error) {
    console.error("❌ OpenAI error:", error);
    return null;
  }
}

/**
 * Send Direct Message via Instagram API
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

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Instagram DM failed:", error);
      return false;
    }

    console.log("✅ Instagram DM sent successfully");
    return true;
  } catch (error) {
    console.error("❌ sendInstagramDM error:", error);
    return false;
  }
}

/**
 * Send Private Message (for comment triggers)
 * This bypasses the "request message" inbox
 */
async function sendPrivateMessage(options: {
  accessToken: string;
  commentId: string;
  message: string;
}): Promise<boolean> {
  const { accessToken, commentId, message } = options;

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Instagram private message failed:", error);
      return false;
    }

    console.log("✅ Instagram private message sent");
    return true;
  } catch (error) {
    console.error("❌ sendPrivateMessage error:", error);
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
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Comment reply failed:", error);
      return false;
    }

    console.log("✅ Comment reply sent");
    return true;
  } catch (error) {
    console.error("❌ replyToComment error:", error);
    return false;
  }
}
