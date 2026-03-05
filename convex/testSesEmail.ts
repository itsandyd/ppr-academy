"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { sesSendEmail } from "./lib/sesClient";

/**
 * Test action to verify AWS SES credentials and domain setup.
 *
 * Sends a single test email through SES to confirm:
 * - AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY are valid
 * - The sending domain is verified in SES
 * - The account has production access (or the recipient is verified in sandbox)
 * - List-Unsubscribe headers are included correctly
 *
 * Usage from Convex dashboard or CLI:
 *   npx convex run testSesEmail:sendTestEmail '{"to": "your@email.com"}'
 */
export const sendTestEmail = internalAction({
  args: {
    to: v.string(),
    from: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
    provider: v.string(),
  }),
  handler: async (_ctx, args) => {
    const fromEmail =
      args.from ||
      process.env.AWS_SES_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      "noreply@ppracademy.com";

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";
    // Generate a test unsubscribe URL (same token format as production)
    const testUnsubscribeUrl = `${baseUrl}/unsubscribe/test-token`;
    const testApiUnsubscribeUrl = `${baseUrl}/api/unsubscribe?token=test-token`;

    console.log(`[TestSES] Sending test email to ${args.to} from ${fromEmail}`);

    const result = await sesSendEmail({
      from: fromEmail,
      to: args.to,
      subject: "PPR SES Test",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">AWS SES Test Email</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f2937; margin-top: 0;">SES Configuration Verified</h2>
    <p>This email was sent through <strong>AWS SES v2</strong> to verify your configuration is working correctly.</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #166534;"><strong>Provider:</strong> AWS SES v2</p>
      <p style="margin: 8px 0 0; color: #166534;"><strong>From:</strong> ${fromEmail}</p>
      <p style="margin: 8px 0 0; color: #166534;"><strong>Region:</strong> ${process.env.AWS_SES_REGION || "us-east-1"}</p>
      <p style="margin: 8px 0 0; color: #166534;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">If you received this email, SES is configured correctly and ready to use as the primary email provider.</p>
    <p style="color: #6b7280; font-size: 14px;">Check the email headers for <code>List-Unsubscribe</code> to verify RFC 8058 compliance.</p>
  </div>
  <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
    <a href="${testUnsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
    <p style="margin: 8px 0 0;">PPR Academy LLC, 651 N Broad St Suite 201, Middletown, DE 19709</p>
  </div>
</body>
</html>`,
      headers: {
        "List-Unsubscribe": `<${testApiUnsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (result.success) {
      console.log(
        `[TestSES] Test email sent successfully. MessageId: ${result.messageId}`
      );
    } else {
      console.error(`[TestSES] Test email failed: ${result.error}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: "ses",
    };
  },
});
