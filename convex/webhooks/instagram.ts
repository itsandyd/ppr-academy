"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

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
      
      if (!entry) {
        console.log("⚠️ No entry in webhook payload");
        return null;
      }

      // CASE 1: Direct Message (DM) via entry.messaging (Facebook Messenger style)
      if (entry.messaging && entry.messaging.length > 0) {
        const message = entry.messaging[0];
        const messageText = message.message?.text;
        
        if (!messageText) return null;

        console.log("💬 DM received (messaging):", messageText);

        // Find automation by keyword match
        const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
          keyword: messageText.toLowerCase(),
        });

        if (!matcher || !matcher.trigger) {
          console.log("❌ No automation found for keyword:", messageText);
          
          // Check for existing conversation (Smart AI continuation)
          await handleSmartAIContinuation(ctx, entry, messageText);
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
          senderId: message.sender.id,
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
          
          if (!messageText) {
            console.log("⚠️ No message text in DM webhook");
            return null;
          }

          console.log("💬 DM received (changes):", messageText);

          // Find automation by keyword match
          const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
            keyword: messageText.toLowerCase(),
          });

          if (!matcher || !matcher.trigger) {
            console.log("❌ No automation found for keyword:", messageText);
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
            senderId: senderId,
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

        console.log("💬 Comment received:", commentText);

        // Find automation by keyword
        const matcher = await ctx.runQuery(api.automations.findAutomationByKeyword, {
          keyword: commentText.toLowerCase(),
        });

        if (!matcher || !matcher.trigger) {
          console.log("❌ No automation found for keyword:", commentText);
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
  const userPlan = automation.user?.subscription?.plan || "FREE";
  
  // Get fresh Instagram token via query
  // @ts-ignore
  const tokenData = await ctx.runQuery(api.socialMedia.getInstagramToken, {
    userId: automation.userId,
  });

  if (!tokenData?.accessToken) {
    console.error("❌ No active Instagram connection found");
    return;
  }

  console.log("✅ Found Instagram connection:", tokenData.username);
  console.log("🔧 Using dynamically fetched token");
  const accessToken = tokenData.accessToken;

  // LISTENER TYPE 1: MESSAGE - Send DM with optional comment reply
  if (listener.listener === "MESSAGE") {
    console.log("📤 Processing MESSAGE automation");
    
    const dmMessage = listener.prompt || "Thanks for reaching out!";

    // For COMMENT triggers - send private message linked to comment
    if (!isDM && commentId) {
      console.log("📱 Comment trigger detected - sending private message");
      
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
          const directDMSuccess = await sendInstagramDM({
            accessToken,
            recipientId: senderId,
            message: dmMessage,
          });
          
          if (directDMSuccess) {
            console.log("✅ Direct DM sent as fallback!");
          } else {
            console.error("❌ Both private message and direct DM failed");
          }
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
      console.log("📱 DM trigger detected - sending direct message");
      
      const dmSuccess = await sendInstagramDM({
        accessToken,
        recipientId: senderId,
        message: dmMessage,
      });

      if (dmSuccess) {
        console.log("✅ Direct DM sent successfully!");
      } else {
        console.error("❌ Failed to send DM");
      }
    }

    return;
  }

  // LISTENER TYPE 2: Smart AI (Pro feature)
  if (listener.listener === "SMART_AI") {
    if (userPlan !== "PRO") {
      console.log("⚠️ Smart AI requires PRO plan");
      // Send upgrade message
      await sendInstagramDM({
        accessToken,
        recipientId: senderId,
        message: "🤖 Smart AI conversations are available on our Pro plan! Upgrade to unlock AI-powered responses.",
      });
      return;
    }

    console.log("🤖 Activating Smart AI");

    // Get conversation history (commented out due to TypeScript issues)
    // const history = await ctx.runQuery(api.automations.getChatHistory, {
    //   automationId: automation._id,
    //   instagramUserId: senderId,
    // });
    const history: any[] = [];

    // Build OpenAI messages
    const messages: any[] = [
      {
        role: "system",
        content: listener.prompt + "\n\nKeep responses under 2 sentences for Instagram DMs.",
      },
    ];

    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.message,
      });
    }

    // Add current message
    messages.push({
      role: "user",
      content: messageText,
    });

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      console.error("❌ No AI response generated");
      return;
    }

    // Save conversation history (commented out due to TypeScript issues)
    // await ctx.runMutation(api.automations.createChatHistory, {
    //   automationId: automation._id,
    //   senderId,
    //   receiverId,
    //   message: messageText,
    //   role: "user",
    // });

    // await ctx.runMutation(api.automations.createChatHistory, {
    //   automationId: automation._id,
    //   senderId: receiverId,
    //   receiverId: senderId,
    //   message: aiResponse,
    //   role: "assistant",
    // });

    // Send AI-generated message
    const success = await sendInstagramDM({
      accessToken,
      recipientId: senderId,
      message: aiResponse,
    });

    if (success) {
      // await ctx.runMutation(api.automations.trackResponse, {
      //   automationId: automation._id,
      //   type: isDM ? "DM" : "COMMENT",
      // });
    }
  }
}

/**
 * Handle Smart AI conversation continuation (no keyword match)
 * User is already in a Smart AI conversation
 */
async function handleSmartAIContinuation(ctx: any, entry: any, messageText: string) {
  const senderId = entry.messaging[0]?.sender?.id;
  const receiverId = entry.id;

  if (!senderId) return;

  // Find active automation with chat history for this user
  // This would require a more complex query - placeholder for now
  console.log("🔄 Checking for existing Smart AI conversation...");
  
  // TODO: Implement conversation continuation logic
  // 1. Query chatHistory for this senderId
  // 2. Get associated automation
  // 3. Check if it's Smart AI and user has PRO plan
  // 4. Continue conversation
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
          recipient: {
            id: recipientId,
          },
          message: {
            text: message,
          },
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
          recipient: {
            comment_id: commentId, // Special: links to comment
          },
          message: {
            text: message,
          },
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
        body: JSON.stringify({
          message,
        }),
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

/**
 * Alternative comment reply using Facebook Graph API
 */
async function replyToCommentAlt(options: {
  instagramId: string;
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<boolean> {
  const { instagramId, commentId, message, accessToken } = options;

  try {
    // Try Facebook Graph API for Instagram comment replies
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/replies`,
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
      const error = await response.json();
      console.error("❌ Alt comment reply failed:", error);
      return false;
    }

    console.log("✅ Alternative comment reply sent");
    return true;
  } catch (error) {
    console.error("❌ replyToCommentAlt error:", error);
    return false;
  }
}

