"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "legal@ppracademy.com";
const PLATFORM_NAME = "PPR Academy";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export const sendClaimReceivedEmail = internalAction({
  args: {
    claimantName: v.string(),
    claimantEmail: v.string(),
    contentTitle: v.string(),
    claimId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.claimantEmail,
        subject: `Copyright Claim Received - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Copyright Claim Received</h2>
    
    <p>Dear ${args.claimantName},</p>
    
    <p>We have received your DMCA copyright claim regarding the following content:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Content Title</p>
      <p style="margin: 0; font-weight: 600;">${args.contentTitle}</p>
      <p style="margin: 16px 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Claim Reference</p>
      <p style="margin: 0; font-weight: 600;">${args.claimId}</p>
    </div>
    
    <h3 style="color: #1f2937;">What Happens Next?</h3>
    <p>Our team will review your claim within 48 hours. During this time, we will:</p>
    <ul>
      <li>Verify the information provided in your claim</li>
      <li>Notify the content uploader of the claim</li>
      <li>Take appropriate action if the claim is valid</li>
    </ul>
    
    <p>You will receive an email notification when your claim has been reviewed.</p>
    
    <p style="margin-top: 32px;">Best regards,<br>The ${PLATFORM_NAME} Trust & Safety Team</p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>${PLATFORM_NAME} LLC<br>651 N Broad St Suite 201, Middletown, DE 19709</p>
  </div>
</body>
</html>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send claim received email:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const sendClaimNoticeEmail = internalAction({
  args: {
    creatorName: v.string(),
    creatorEmail: v.string(),
    contentTitle: v.string(),
    claimantName: v.string(),
    claimId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    const counterNoticeUrl = `${BASE_URL}/dashboard/copyright/counter-notice?claim=${args.claimId}`;
    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.creatorEmail,
        subject: `DMCA Copyright Claim Notice - Action Required - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Copyright Claim Notice</h2>
    
    <p>Dear ${args.creatorName},</p>
    
    <p>We have received a DMCA copyright claim regarding content you uploaded to ${PLATFORM_NAME}.</p>
    
    <div style="background: #fef2f2; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Content Affected</p>
      <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: 600;">${args.contentTitle}</p>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Claim Reference</p>
      <p style="margin: 0 0 16px 0; font-weight: 600;">${args.claimId}</p>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Claimant</p>
      <p style="margin: 0 0 16px 0; font-weight: 600;">${args.claimantName}</p>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Response Deadline</p>
      <p style="margin: 0; font-weight: 600;">${deadline}</p>
    </div>
    
    <h3 style="color: #1f2937;">Your Options</h3>
    <p><strong>1. Do nothing:</strong> If the claim is valid, the content will be removed and you may receive a copyright strike.</p>
    <p><strong>2. Submit a counter-notice:</strong> If you believe the claim is invalid, you may file a formal counter-notice.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${counterNoticeUrl}" style="background: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">Submit Counter-Notice</a>
    </div>
    
    <div style="background: #fffbeb; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Note:</strong> ${PLATFORM_NAME} has a repeat infringer policy. Accounts that receive three valid copyright strikes may be permanently suspended.</p>
    </div>
    
    <p style="margin-top: 32px;">Best regards,<br>The ${PLATFORM_NAME} Trust & Safety Team</p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>${PLATFORM_NAME} LLC<br>651 N Broad St Suite 201, Middletown, DE 19709</p>
  </div>
</body>
</html>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send claim notice email:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const sendStrikeEmail = internalAction({
  args: {
    creatorName: v.string(),
    creatorEmail: v.string(),
    contentTitle: v.string(),
    strikeNumber: v.number(),
    totalStrikes: v.number(),
    isSuspended: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    const subject = args.isSuspended
      ? `Account Suspended - Copyright Policy Violation - ${PLATFORM_NAME}`
      : `Copyright Strike ${args.strikeNumber} of 3 - ${PLATFORM_NAME}`;

    const suspendedBanner = args.isSuspended
      ? `<div style="background: #dc2626; padding: 12px 24px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
           <p style="color: white; margin: 0; font-weight: 600; letter-spacing: 1px;">ACCOUNT SUSPENDED</p>
         </div>`
      : "";

    const strikeIndicators = [1, 2, 3]
      .map(
        (num) =>
          `<span style="background: ${num <= args.totalStrikes ? "#ef4444" : "#374151"}; color: ${num <= args.totalStrikes ? "#ffffff" : "#9ca3af"}; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 4px; margin: 0 4px;">Strike ${num}</span>`
      )
      .join("");

    const warningMessage =
      args.totalStrikes === 1
        ? "You have 2 more strikes before account suspension."
        : args.totalStrikes === 2
          ? "Warning: One more strike will result in account suspension."
          : "Your account has been suspended.";

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.creatorEmail,
        subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    ${suspendedBanner}
    
    <h2 style="color: #1f2937; margin-top: 0;">Copyright Strike Notice</h2>
    
    <p>Dear ${args.creatorName},</p>
    
    <p>Your ${PLATFORM_NAME} account has received a copyright strike for the following content:</p>
    
    <div style="background: #fef2f2; padding: 16px 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Content Removed</p>
      <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: 600;">${args.contentTitle}</p>
    </div>
    
    <div style="background: #1f2937; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Your Strike Status</p>
      <div style="margin-bottom: 16px;">${strikeIndicators}</div>
      <p style="color: #fbbf24; font-size: 14px; font-weight: 500; margin: 0;">${warningMessage}</p>
    </div>
    
    <h3 style="color: #1f2937;">What This Means</h3>
    <ul>
      <li>The infringing content has been removed from the platform</li>
      ${args.isSuspended ? "<li>You cannot access your creator dashboard</li><li>Your existing products are hidden from the marketplace</li><li>Your payouts have been paused</li>" : "<li>This strike will remain on your account for 12 months</li><li>Future violations may result in additional strikes or suspension</li>"}
    </ul>
    
    <div style="background: #eff6ff; padding: 20px 24px; border-radius: 8px; margin: 24px 0;">
      <p style="color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Need Help?</p>
      <p style="color: #1e40af; font-size: 14px; margin: 0;">If you have questions about this strike or need assistance, please contact our support team at support@ppracademy.com</p>
    </div>
    
    <p style="margin-top: 32px;">Best regards,<br>The ${PLATFORM_NAME} Trust & Safety Team</p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>${PLATFORM_NAME} LLC<br>651 N Broad St Suite 201, Middletown, DE 19709</p>
  </div>
</body>
</html>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send strike email:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const sendClaimResolvedEmail = internalAction({
  args: {
    recipientName: v.string(),
    recipientEmail: v.string(),
    contentTitle: v.string(),
    claimId: v.string(),
    resolution: v.union(
      v.literal("upheld"),
      v.literal("dismissed"),
      v.literal("counter_notice_accepted")
    ),
    resolutionDetails: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    const resolutionTitles = {
      upheld: "Copyright Claim Upheld",
      dismissed: "Copyright Claim Dismissed",
      counter_notice_accepted: "Counter-Notice Accepted",
    };

    const resolutionColors = {
      upheld: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
      dismissed: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
      counter_notice_accepted: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    };

    const colors = resolutionColors[args.resolution];
    const title = resolutionTitles[args.resolution];

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.recipientEmail,
        subject: `Copyright Claim Update: ${title} - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
    
    <p>Dear ${args.recipientName},</p>
    
    <p>We have completed our review of the copyright claim regarding the following content:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Content</p>
      <p style="margin: 0 0 16px 0; font-weight: 600;">${args.contentTitle}</p>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Claim Reference</p>
      <p style="margin: 0; font-weight: 600;">${args.claimId}</p>
    </div>
    
    <div style="background: ${colors.bg}; padding: 20px 24px; border-radius: 8px; border-left: 4px solid ${colors.border}; margin: 20px 0;">
      <p style="color: ${colors.text}; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Resolution: ${title}</p>
      <p style="color: ${colors.text}; font-size: 15px; line-height: 24px; margin: 0;">${args.resolutionDetails}</p>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px 24px; border-radius: 8px; margin: 24px 0;">
      <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Questions?</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">If you have questions about this resolution, please contact our support team at support@ppracademy.com</p>
    </div>
    
    <p style="margin-top: 32px;">Best regards,<br>The ${PLATFORM_NAME} Trust & Safety Team</p>
  </div>
  
  <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>${PLATFORM_NAME} LLC<br>651 N Broad St Suite 201, Middletown, DE 19709</p>
  </div>
</body>
</html>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send claim resolved email:", error);
      return { success: false, error: String(error) };
    }
  },
});
