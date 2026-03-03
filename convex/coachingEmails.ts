"use node";

// TRANSACTIONAL: All functions in this file send through the transactional Resend API.
// Do not move to marketing — these are booking confirmations, session reminders, and
// coaching-related notifications the recipient explicitly triggered.

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

function generateICSContent(params: {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
}): string {
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escape = (t: string) =>
    t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const end = new Date(params.startTime.getTime() + params.durationMinutes * 60 * 1000);
  const uid = `coaching-${Date.now()}-${Math.random().toString(36).slice(2)}@ppracademy.com`;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//PPR Academy//Coaching Sessions//EN",
    "CALSCALE:GREGORIAN", "METHOD:REQUEST", "BEGIN:VEVENT",
    `UID:${uid}`, `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(params.startTime)}`, `DTEND:${formatDate(end)}`,
    `SUMMARY:${escape(params.title)}`, `DESCRIPTION:${escape(params.description)}`,
  ];
  if (params.location) {
    lines.push(`LOCATION:${escape(params.location)}`, `URL:${params.location}`);
  }
  if (params.organizerEmail) {
    const cn = params.organizerName ? `;CN=${escape(params.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${params.organizerEmail}`);
  }
  lines.push(
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY",
    `DESCRIPTION:${escape(params.title)} starts in 1 hour`,
    "END:VALARM", "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY",
    `DESCRIPTION:${escape(params.title)} starts in 15 minutes`,
    "END:VALARM", "END:VEVENT", "END:VCALENDAR"
  );
  return lines.join("\r\n");
}

export const sendBookingConfirmationEmail = internalAction({
  args: {
    studentName: v.string(),
    studentEmail: v.string(),
    sessionTitle: v.string(),
    coachName: v.string(),
    coachEmail: v.optional(v.string()),
    sessionDate: v.string(),
    sessionTime: v.string(),
    scheduledTimestamp: v.optional(v.number()),
    duration: v.number(),
    sessionPlatform: v.optional(v.string()),
    sessionLink: v.optional(v.string()),
    sessionPhone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      return { success: true };
    }

    try {
      const platformHtml = (() => {
        const platform = args.sessionPlatform || "discord";
        if (platform === "discord") {
          return `<p>A private Discord channel will be created 2 hours before your session.</p>`;
        }
        if ((platform === "zoom" || platform === "google_meet" || platform === "custom") && args.sessionLink) {
          const label = platform === "zoom" ? "Zoom" : platform === "google_meet" ? "Google Meet" : "Session Link";
          return `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0;"><p style="margin: 0;"><strong>Join via ${label}:</strong></p><p style="margin: 8px 0 0;"><a href="${args.sessionLink}" style="color: #2563eb;">${args.sessionLink}</a></p></div>`;
        }
        if ((platform === "phone" || platform === "facetime") && args.sessionPhone) {
          const label = platform === "facetime" ? "FaceTime" : "Phone Session";
          return `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0;"><p style="margin: 0;"><strong>${label}:</strong> ${args.sessionPhone}</p></div>`;
        }
        return `<p>Session details will be provided by your coach.</p>`;
      })();

      const notesHtml = args.notes
        ? `<div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Your Notes:</strong></p><p style="margin: 8px 0 0;">${args.notes}</p></div>`
        : "";

      // Build .ics attachment if we have a timestamp
      const attachments: Array<{ filename: string; content: string }> = [];
      if (args.scheduledTimestamp) {
        const [h, m] = args.sessionTime.split(":").map(Number);
        const startTime = new Date(args.scheduledTimestamp);
        if (!isNaN(h)) startTime.setHours(h, m || 0, 0, 0);
        const location = args.sessionLink || args.sessionPhone ||
          (args.sessionPlatform === "discord" ? "Discord" : undefined);
        const icsContent = generateICSContent({
          title: `Coaching: ${args.sessionTitle}`,
          description: `${args.duration}-min session with ${args.coachName}`,
          startTime,
          durationMinutes: args.duration,
          location,
          organizerName: args.coachName,
          organizerEmail: args.coachEmail,
        });
        attachments.push({
          filename: "coaching-session.ics",
          content: Buffer.from(icsContent).toString("base64"),
        });
      }

      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.studentEmail,
        subject: `Session Confirmed with ${args.coachName} - ${PLATFORM_NAME}`,
        ...(attachments.length > 0 && {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }),
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Session Confirmed!</h2>
    <p>Hi ${args.studentName},</p>
    <p>Your coaching session with <strong>${args.coachName}</strong> has been confirmed!</p>
    <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
    </div>
    ${platformHtml}
    ${notesHtml}
    <p style="color: #6b7280; font-size: 13px;">A calendar invite (.ics) is attached to this email.</p>
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
    scheduledTimestamp: v.optional(v.number()),
    duration: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
    sessionPlatform: v.optional(v.string()),
    sessionLink: v.optional(v.string()),
    sessionPhone: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      return { success: true };
    }

    try {
      // Build .ics attachment for coach
      const attachments: Array<{ filename: string; content: string }> = [];
      if (args.scheduledTimestamp) {
        const [h, m] = args.sessionTime.split(":").map(Number);
        const startTime = new Date(args.scheduledTimestamp);
        if (!isNaN(h)) startTime.setHours(h, m || 0, 0, 0);
        const location = args.sessionLink || args.sessionPhone ||
          (args.sessionPlatform === "discord" ? "Discord" : undefined);
        const icsContent = generateICSContent({
          title: `Coaching: ${args.sessionTitle}`,
          description: `${args.duration}-min session with ${args.studentName}${args.notes ? `\n\nStudent notes: ${args.notes}` : ""}`,
          startTime,
          durationMinutes: args.duration,
          location,
          organizerName: args.coachName,
          organizerEmail: args.coachEmail,
        });
        attachments.push({
          filename: "coaching-session.ics",
          content: Buffer.from(icsContent).toString("base64"),
        });
      }

      const platformLabel =
        args.sessionPlatform === "zoom" ? "Zoom" :
        args.sessionPlatform === "google_meet" ? "Google Meet" :
        args.sessionPlatform === "discord" ? "Discord" :
        args.sessionPlatform === "phone" ? "Phone" :
        args.sessionPlatform === "facetime" ? "FaceTime" :
        args.sessionPlatform === "custom" ? "Custom Link" : "Discord";

      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.coachEmail,
        subject: `New Booking: ${args.studentName} - ${PLATFORM_NAME}`,
        ...(attachments.length > 0 && {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }),
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #22c55e; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">New Booking!</h2>
    <p>Hi ${args.coachName},</p>
    <p><strong>${args.studentName}</strong> has booked a coaching session with you!</p>
    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Student:</strong> ${args.studentName} (${args.studentEmail})</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
      <p style="margin: 8px 0 0;"><strong>Amount:</strong> $${args.amount}</p>
      <p style="margin: 8px 0 0;"><strong>Platform:</strong> ${platformLabel}</p>
    </div>
    ${args.notes ? `<div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Student Notes:</strong></p><p style="margin: 8px 0 0;">${args.notes}</p></div>` : ""}
    <p style="color: #6b7280; font-size: 13px;">A calendar invite (.ics) is attached to this email.</p>
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
    sessionPlatform: v.optional(v.string()),
    sessionLink: v.optional(v.string()),
    sessionPhone: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
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
    ${(() => {
          const platform = args.sessionPlatform || "discord";
          if (args.hoursUntil > 2) return "";
          if (platform === "discord") {
            return `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Discord channel is now ready!</strong> Head to Discord to join your private coaching channel.</p></div>`;
          }
          if ((platform === "zoom" || platform === "google_meet" || platform === "custom") && args.sessionLink) {
            return `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Ready to join!</strong></p><p style="margin: 8px 0 0;"><a href="${args.sessionLink}" style="color: #2563eb; font-weight: bold;">${args.sessionLink}</a></p></div>`;
          }
          if ((platform === "phone" || platform === "facetime") && args.sessionPhone) {
            return `<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;"><p style="margin: 0;"><strong>Session contact:</strong> ${args.sessionPhone}</p></div>`;
          }
          return "";
        })()}
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

// ==================== SESSION CONFIRMATION EMAILS ====================

export const sendSessionConfirmationRequestEmail = internalAction({
  args: {
    recipientName: v.string(),
    recipientEmail: v.string(),
    otherPartyName: v.string(),
    sessionTitle: v.string(),
    sessionDate: v.string(),
    sessionTime: v.string(),
    duration: v.number(),
    isCoach: v.boolean(),
    sessionId: v.id("coachingSessions"),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) {
      return { success: true };
    }

    const confirmUrl = `${BASE_URL}/${args.isCoach ? "dashboard/coaching/sessions" : "library/coaching"}?confirm=${args.sessionId}`;
    const noShowUrl = `${BASE_URL}/${args.isCoach ? "dashboard/coaching/sessions" : "library/coaching"}?noshow=${args.sessionId}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.recipientEmail,
        subject: `Did your session happen? — ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #6366f1; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Did your session happen?</h2>
    <p>Hi ${args.recipientName},</p>
    <p>Your coaching session with <strong>${args.otherPartyName}</strong> was scheduled to take place. Please confirm whether it happened so we can process the payment.</p>
    <div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
      <p style="margin: 8px 0 0;"><strong>Time:</strong> ${args.sessionTime}</p>
      <p style="margin: 8px 0 0;"><strong>Duration:</strong> ${args.duration} minutes</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmUrl}" style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Yes, Session Happened</a>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <a href="${noShowUrl}" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">No, ${args.isCoach ? "Student" : "Coach"} Didn't Show</a>
    </div>
    <p style="color: #6b7280; font-size: 13px; margin-top: 32px;">
      If we don't hear from you within 48 hours, we'll assume the session took place and ${args.isCoach ? "release your payout" : "process the payment"}.
    </p>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send session confirmation request email:", error);
      return { success: false, error: error.message };
    }
  },
});

// ==================== NO-SHOW EMAILS ====================

export const sendNoShowWarningEmail = internalAction({
  args: {
    coachName: v.string(),
    coachEmail: v.string(),
    sessionTitle: v.string(),
    studentName: v.string(),
    sessionDate: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) return { success: true };

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.coachEmail,
        subject: `Important: No-Show Warning - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">No-Show Warning</h2>
    <p>Hi ${args.coachName},</p>
    <p>A student reported that you did not attend the following coaching session:</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Session:</strong> ${args.sessionTitle}</p>
      <p style="margin: 8px 0 0;"><strong>Student:</strong> ${args.studentName}</p>
      <p style="margin: 8px 0 0;"><strong>Date:</strong> ${args.sessionDate}</p>
    </div>
    <p><strong>This is your first no-show warning.</strong> Please be aware that:</p>
    <ul>
      <li>The student has been issued a full refund</li>
      <li>A second no-show will result in your coaching being <strong>temporarily paused</strong></li>
    </ul>
    <p>If you believe this was reported in error, please contact our support team.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${BASE_URL}/dashboard/coaching/sessions" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Your Sessions</a>
    </div>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send no-show warning email:", error);
      return { success: false, error: error.message };
    }
  },
});

export const sendCoachingPausedEmail = internalAction({
  args: {
    coachName: v.string(),
    coachEmail: v.string(),
    noShowCount: v.number(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const resend = getResendClient();
    if (!resend) return { success: true };

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: args.coachEmail,
        subject: `Coaching Paused - Action Required - ${PLATFORM_NAME}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${PLATFORM_NAME}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Your Coaching Has Been Paused</h2>
    <p>Hi ${args.coachName},</p>
    <p>Due to ${args.noShowCount} reported no-shows, your coaching sessions have been <strong>temporarily paused</strong>.</p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
      <p style="margin: 0;"><strong>What this means:</strong></p>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Your coaching products are no longer visible to students</li>
        <li>No new bookings can be made</li>
        <li>Existing scheduled sessions are unaffected</li>
      </ul>
    </div>
    <p>To reinstate your coaching, please contact our support team to discuss the situation.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:support@ppracademy.com" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Contact Support</a>
    </div>
  </div>
</body>
</html>`,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send coaching paused email:", error);
      return { success: false, error: error.message };
    }
  },
});
