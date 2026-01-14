"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

// ============================================================================
// RESEND CLIENT
// ============================================================================

let resendClient: Resend | null = null;
function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ppracademy.com";
const PLATFORM_NAME = "PPR Academy";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

// ============================================================================
// INTERNAL ACTIONS (Email notifications)
// ============================================================================

export const sendNewMessageEmail = internalAction({
  args: {
    recipientId: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    senderAvatar: v.optional(v.string()),
    messagePreview: v.string(),
    conversationId: v.id("dmConversations"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    // Get recipient info
    const recipient = await ctx.runQuery(internal.directMessages.getUserByClerkId, {
      clerkId: args.recipientId,
    });

    if (!recipient?.email) {
      console.log("Recipient has no email, skipping notification");
      return { success: true };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    const messageUrl = `${BASE_URL}/dashboard/messages/${args.conversationId}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject: `New message from ${args.senderName} - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
      ${
        args.senderAvatar
          ? `<img src="${args.senderAvatar}" alt="${args.senderName}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />`
          : `<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${args.senderName.charAt(0).toUpperCase()}</div>`
      }
      <div>
        <h2 style="margin: 0; font-size: 18px; color: #1f2937;">New message from ${args.senderName}</h2>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${args.messagePreview}${args.messagePreview.length >= 200 ? "..." : ""}</p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${messageUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Reply to Message
      </a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 14px;">
    <p style="margin: 0;">This notification was sent from ${PLATFORM_NAME}.</p>
    <p style="margin: 8px 0 0;">
      <a href="${BASE_URL}/settings/notifications" style="color: #3b82f6; text-decoration: none;">Manage notification preferences</a>
    </p>
  </div>
</body>
</html>`,
      });

      console.log(`DM notification email sent to ${recipient.email}`);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to send DM notification email:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },
});
