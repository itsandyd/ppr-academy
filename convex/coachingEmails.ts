"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "coaching@ppracademy.com";
const PLATFORM_NAME = "PPR Academy";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export const sendBookingConfirmationEmail = internalAction({
  args: {
    studentName: v.string(),
    studentEmail: v.string(),
    sessionTitle: v.string(),
    coachName: v.string(),
    sessionDate: v.string(),
    sessionTime: v.string(),
    duration: v.number(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.studentEmail,
        subject: `Session Confirmed with ${args.coachName} - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Session Confirmed! 🎉</h2>
    <p>Hi ${args.studentName},</p>
    <p>Your coaching session with <strong>${args.coachName}</strong> has been confirmed!</p>
    <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
    </div>
    <p>A private Discord channel will be created 2 hours before your session.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/library/coaching" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Sessions</a>
    </div>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send booking confirmation email:", error);
      return { success: false, error: error.message };
    }
  },
});

export const sendNewBookingNotificationEmail = internalAction({
  args: {
    coachName: v.string(),
    coachEmail: v.string(),
    studentName: v.string(),
    studentEmail: v.string(),
    sessionTitle: v.string(),
    sessionDate: v.string(),
    sessionTime: v.string(),
    duration: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.coachEmail,
        subject: `New Booking: ${args.studentName} - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #22c55e; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">New Booking! 🎉</h2>
    <p>Hi ${args.coachName},</p>
    <p><strong>${args.studentName}</strong> has booked a coaching session with you!</p>
    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Student:</strong> ${args.studentName} (${args.studentEmail})</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
      <p style="margin: 8px 0 0;"><strong>Amount:</strong> $${args.amount}</p>
    </div>
    ${args.notes ? `<div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Student Notes:</strong></p><p style="margin: 8px 0 0;">${args.notes}</p></div>` : ""}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/dashboard/coaching/sessions" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Dashboard</a>
    </div>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send new booking notification email:", error);
      return { success: false, error: error.message };
    }
  },
});

export const sendSessionReminderEmail = internalAction({
  args: {
    recipientName: v.string(),
    recipientEmail: v.string(),
    otherPartyName: v.string(),
    sessionTitle: v.string(),
    sessionDate: v.string(),
    sessionTime: v.string(),
    duration: v.number(),
    isCoach: v.boolean(),
    hoursUntil: v.number(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      console.log("Resend not configured, skipping email");
      return { success: true };
    }

    const timeLabel = args.hoursUntil === 1 ? "1 hour" : `${args.hoursUntil} hours`;
    const dashboardUrl = args.isCoach
      ? `${BASE_URL}/dashboard/coaching/sessions`
      : `${BASE_URL}/library/coaching`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.recipientEmail,
        subject: `Reminder: Session in ${timeLabel} - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f59e0b; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Session Starting Soon! ⏰</h2>
    <p>Hi ${args.recipientName},</p>
    <p>Your coaching session with <strong>${args.otherPartyName}</strong> starts in <strong>${timeLabel}</strong>.</p>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
    </div>
    ${args.hoursUntil <= 2 ? `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>🔔 Discord channel is now ready!</strong> Head to Discord to join your private coaching channel.</p></div>` : ""}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">${args.isCoach ? "View Session" : "Join Session"}</a>
    </div>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send session reminder email:", error);
      return { success: false, error: error.message };
    }
  },
});
