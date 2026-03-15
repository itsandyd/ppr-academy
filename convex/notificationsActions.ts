"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Process notification emails (internal action - requires Node.js for email sending)
export const processNotificationEmails = internalAction({
  args: {
    notificationIds: v.array(v.id("notifications")),
    category: v.union(
      v.literal("announcements"),
      v.literal("courseUpdates"),
      v.literal("newContent"),
      v.literal("mentions"),
      v.literal("replies"),
      v.literal("purchases"),
      v.literal("earnings"),
      v.literal("systemAlerts"),
      v.literal("marketing")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { sendEmailViaProvider } = await import("./lib/emailProvider");

    // Fetch notifications
    for (const notificationId of args.notificationIds) {
      const notification = await ctx.runQuery(
        internal.notifications.getNotificationById,
        { notificationId }
      );

      if (!notification) continue;

      // Check user preferences
      const shouldSend = await ctx.runQuery(
        internal.notificationPreferences.shouldSendEmailInternal,
        {
          userId: notification.userId,
          category: args.category,
        }
      );

      if (!shouldSend) {
        // User has disabled email for this category
        await ctx.runMutation(internal.notifications.markEmailSkipped, {
          notificationId,
        });
        continue;
      }

      // Get user email
      const user = await ctx.runQuery(internal.notifications.getUserByClerkId, {
        clerkId: notification.userId,
      });

      if (!user?.email) {
        console.error(`No email found for user ${notification.userId}`);
        continue;
      }

      // Send email via SES
      try {
        const fromEmail = process.env.FROM_EMAIL || "andrew@pauseplayrepeat.com";
        const fromName = process.env.FROM_NAME || "PPR Academy";

        await sendEmailViaProvider({
          from: `${fromName} <${fromEmail}>`,
          to: user.email,
          subject: notification.title,
          html: generateNotificationEmailHTML(notification),
        });

        await ctx.runMutation(internal.notifications.markEmailSent, {
          notificationId,
        });
      } catch (error) {
        console.error(`Error sending email:`, error);
      }
    }

    return null;
  },
});

// Helper to generate email HTML
function generateNotificationEmailHTML(notification: any): string {
  const typeColors: Record<string, string> = {
    info: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  const color = typeColors[notification.type] || "#3b82f6";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <div style="background-color: ${color}; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
      <span style="color: white; font-size: 24px;">🔔</span>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #111827;">
      ${notification.title}
    </h1>
    <p style="margin: 0; font-size: 16px; color: #6b7280; white-space: pre-wrap;">
      ${notification.message}
    </p>
  </div>

  ${notification.link && notification.actionLabel ? `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${notification.link.startsWith('http://') || notification.link.startsWith('https://') ? notification.link : `${process.env.NEXT_PUBLIC_APP_URL || 'https://academy.pauseplayrepeat.com'}${notification.link}`}"
       style="display: inline-block; background-color: ${color}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${notification.actionLabel}
    </a>
  </div>
  ` : ''}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
    <p>This notification was sent to you from PPR Academy.</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://academy.pauseplayrepeat.com'}/settings/notifications"
         style="color: ${color}; text-decoration: none;">
        Manage your notification preferences
      </a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
