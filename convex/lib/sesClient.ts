"use node";

/**
 * AWS SES v2 Email Client
 *
 * Alternative email provider alongside Resend. SES treats every email
 * the same — no transactional vs marketing distinction, no broadcasts API.
 * Every email is just a SendEmail call.
 *
 * SETUP REQUIRED (manual AWS console tasks):
 * 1. Verify your sending domain in the AWS SES console (DKIM + SPF records)
 * 2. Request production access — SES starts in sandbox mode where you can
 *    only send to verified email addresses
 * 3. Set up an SNS topic for bounce/complaint notifications (optional for
 *    initial testing, required for production)
 *
 * RATE LIMITS:
 * - Sandbox: 1 email/second, 200 emails/24h
 * - Production: varies by account (typically 10-50 emails/second to start)
 * - Request a sending rate increase via AWS Support if needed
 *
 * Environment variables:
 *   AWS_SES_REGION          - AWS region (default: us-east-1)
 *   AWS_SES_ACCESS_KEY_ID   - IAM access key with ses:SendEmail permission
 *   AWS_SES_SECRET_ACCESS_KEY - IAM secret key
 *   AWS_SES_FROM_EMAIL      - Verified sender (e.g. "noreply@yourdomain.com")
 */

import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";
import * as crypto from "crypto";

let _sesClient: SESv2Client | null = null;

function getSESClient(): SESv2Client {
  if (!_sesClient) {
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
    const region = process.env.AWS_SES_REGION || "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS SES credentials not configured. Set AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY."
      );
    }

    _sesClient = new SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _sesClient;
}

/** Standard result returned by all SES send functions. */
export interface SESEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email via AWS SES v2.
 *
 * Mirrors the Resend `resend.emails.send()` interface so calling code
 * doesn't need to know which provider is active.
 */
export async function sesSendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<SESEmailResult> {
  try {
    const client = getSESClient();

    const messageHeaders: SendEmailCommandInput["Content"] = {
      Simple: {
        Subject: { Data: params.subject, Charset: "UTF-8" },
        Body: {
          ...(params.html
            ? { Html: { Data: params.html, Charset: "UTF-8" } }
            : {}),
          ...(params.text
            ? { Text: { Data: params.text, Charset: "UTF-8" } }
            : {}),
        },
        Headers: params.headers
          ? Object.entries(params.headers).map(([Name, Value]) => ({
              Name,
              Value,
            }))
          : undefined,
      },
    };

    const input: SendEmailCommandInput = {
      FromEmailAddress: params.from,
      Destination: {
        ToAddresses: [params.to],
      },
      Content: messageHeaders,
      ...(params.replyTo ? { ReplyToAddresses: [params.replyTo] } : {}),
    };

    const command = new SendEmailCommand(input);
    const response = await client.send(command);

    console.log(
      `[SES] Sent email to ${params.to} | subject="${params.subject}" | messageId=${response.MessageId}`
    );

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error(`[SES] Failed to send email to ${params.to}:`, error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

/**
 * Send a batch of emails via AWS SES v2.
 *
 * If all emails share the same subject and HTML content, uses SES's
 * SendBulkEmail API for efficiency. Otherwise, sends individually.
 *
 * Returns aggregate results: total sent, total failed, per-recipient errors.
 */
export async function sesSendBatch(
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    reply_to?: string;
    headers?: Record<string, string>;
  }>
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ to: string; error: string }>;
}> {
  if (emails.length === 0) {
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  // Check if all emails share the same content (candidate for bulk send)
  const allSameContent =
    emails.length > 1 &&
    emails.every(
      (e) =>
        e.subject === emails[0].subject &&
        e.html === emails[0].html &&
        e.from === emails[0].from
    );

  if (allSameContent) {
    return sesSendBulk(emails);
  }

  // Different content per recipient — send individually
  let sent = 0;
  let failed = 0;
  const errors: Array<{ to: string; error: string }> = [];

  for (const email of emails) {
    const result = await sesSendEmail({
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.reply_to,
      headers: email.headers,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({ to: email.to, error: result.error || "Unknown error" });
    }

    // Basic rate limiting: 50ms between sends to stay well under SES limits.
    // Production SES accounts typically allow 10-50 emails/sec.
    if (emails.indexOf(email) < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors,
  };
}

/**
 * Send an email with attachments via SES using raw MIME format.
 *
 * SES's Simple email format doesn't support attachments, so we construct
 * a raw MIME message with multipart/mixed boundaries.
 */
export async function sesSendEmailWithAttachments(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments: Array<{ filename: string; content: string /* base64 */ }>;
}): Promise<SESEmailResult> {
  try {
    const client = getSESClient();
    const boundary = `----=_Part_${crypto.randomBytes(16).toString("hex")}`;

    let rawMessage = "";
    rawMessage += `From: ${params.from}\r\n`;
    rawMessage += `To: ${params.to}\r\n`;
    rawMessage += `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=\r\n`;
    if (params.replyTo) {
      rawMessage += `Reply-To: ${params.replyTo}\r\n`;
    }
    if (params.headers) {
      for (const [name, value] of Object.entries(params.headers)) {
        rawMessage += `${name}: ${value}\r\n`;
      }
    }
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // HTML body
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
    rawMessage += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
    rawMessage += `${params.html}\r\n\r\n`;

    // Attachments
    for (const attachment of params.attachments) {
      const mimeType = attachment.filename.endsWith(".ics")
        ? "text/calendar; method=REQUEST"
        : "application/octet-stream";
      rawMessage += `--${boundary}\r\n`;
      rawMessage += `Content-Type: ${mimeType}; name="${attachment.filename}"\r\n`;
      rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
      rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
      rawMessage += `${attachment.content}\r\n\r\n`;
    }

    rawMessage += `--${boundary}--\r\n`;

    const input: SendEmailCommandInput = {
      Content: {
        Raw: {
          Data: Buffer.from(rawMessage),
        },
      },
    };

    const command = new SendEmailCommand(input);
    const response = await client.send(command);

    console.log(
      `[SES] Sent email with ${params.attachments.length} attachment(s) to ${params.to} | messageId=${response.MessageId}`
    );

    return { success: true, messageId: response.MessageId };
  } catch (error: any) {
    console.error(`[SES] Failed to send email with attachments to ${params.to}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Send bulk email via SES individual sends.
 *
 * SES's SendBulkEmail API requires pre-created SES templates, not raw HTML.
 * Since we work with raw HTML, we send individually with rate limiting.
 * This is functionally equivalent — SES treats every email the same.
 */
async function sesSendBulk(
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    reply_to?: string;
    headers?: Record<string, string>;
  }>
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ to: string; error: string }>;
}> {
  let totalSent = 0;
  let totalFailed = 0;
  const allErrors: Array<{ to: string; error: string }> = [];

  for (const email of emails) {
    const result = await sesSendEmail({
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.reply_to,
      headers: email.headers,
    });

    if (result.success) {
      totalSent++;
    } else {
      totalFailed++;
      allErrors.push({
        to: email.to,
        error: result.error || "Unknown error",
      });
    }

    // Rate limiting between sends (50ms = 20 emails/sec max)
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(
    `[SES] Bulk send complete: ${totalSent} sent, ${totalFailed} failed out of ${emails.length}`
  );

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors,
  };
}
