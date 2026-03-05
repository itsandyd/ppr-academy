"use node";

/**
 * Email Provider Router
 *
 * Routes email sends to either AWS SES (default) or Resend based on the
 * EMAIL_PROVIDER environment variable. Both providers return the same
 * response shape so calling code doesn't need to know which one sent.
 *
 * Config:
 *   EMAIL_PROVIDER=ses      (default — routes to AWS SES v2)
 *   EMAIL_PROVIDER=resend   (fallback — uses existing Resend setup)
 */

import { Resend } from "resend";
import { sesSendEmail, sesSendBatch, sesSendEmailWithAttachments } from "./sesClient";

export type EmailProvider = "resend" | "ses";

/** Normalized result from any provider send. */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

/** Normalized result from a batch send. */
export interface EmailBatchResult {
  success: boolean;
  sent: number;
  failed: number;
  provider: EmailProvider;
  error?: string;
}

/**
 * Get the currently active email provider.
 * Defaults to "ses" — set EMAIL_PROVIDER=resend to fall back to Resend.
 */
export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "ses").toLowerCase();
  if (provider === "resend") return "resend";
  return "ses";
}

/**
 * Sanitize email subject lines:
 * 1. Strip newline characters (breaks email headers)
 * 2. Strip "Re:", "Fwd:", "FW:" prefixes (spam trigger — fakes a reply thread)
 *    Exception: inboxActions.ts adds "Re:" for genuine reply threads; that code
 *    doesn't flow through this provider so it's unaffected.
 */
function sanitizeSubject(subject: string): string {
  let s = subject.replace(/[\r\n]+/g, " ").trim();
  // Strip leading reply/forward prefixes (case-insensitive, may be repeated)
  s = s.replace(/^(Re:\s*|RE:\s*|re:\s*|Fwd:\s*|FWD:\s*|fwd:\s*|FW:\s*|fw:\s*)+/i, "").trim();
  return s;
}

/**
 * Normalize a "to" address to prevent duplicates in the To header.
 *
 * Bug: when a contact's name IS their email address (e.g. firstName="stefen29@att.net"),
 * the to field becomes "stefen29@att.net <stefen29@att.net>". SES/Resend then
 * renders the To header as "stefen29@att.net,stefen29@att.net" which looks spammy
 * and triggered a complaint.
 *
 * Fix: if the display name equals the email address, drop the display name.
 */
function sanitizeTo(to: string): string {
  const match = to.match(/^(.+?)\s*<([^>]+)>$/);
  if (!match) return to; // plain email, no formatting

  const displayName = match[1].trim();
  const emailAddr = match[2].trim();

  // If display name looks like the same email address, just use the email
  if (displayName.toLowerCase() === emailAddr.toLowerCase()) {
    return emailAddr;
  }

  return to;
}

/**
 * Send a single email through the configured provider.
 *
 * For Resend: uses the provided Resend client instance.
 * For SES: uses the SES client configured via AWS_SES_* env vars.
 */
export async function sendEmailViaProvider(
  resendClient: Resend,
  params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  const provider = getEmailProvider();

  const cleanSubject = sanitizeSubject(params.subject);
  const cleanTo = sanitizeTo(params.to);

  if (provider === "ses") {
    console.log(`[EmailProvider][SES] Sending to ${cleanTo}`);
    const result = await sesSendEmail({ ...params, subject: cleanSubject, to: cleanTo });
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: "ses",
    };
  }

  // Fallback: Resend
  console.log(`[EmailProvider][Resend] Sending to ${cleanTo}`);
  try {
    const { data, error } = await resendClient.emails.send({
      from: params.from,
      to: cleanTo,
      subject: cleanSubject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
    });

    if (error) {
      return {
        success: false,
        error: JSON.stringify(error),
        provider: "resend",
      };
    }

    return {
      success: true,
      messageId: data?.id,
      provider: "resend",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || String(err),
      provider: "resend",
    };
  }
}

/**
 * Send a single email with attachments through the configured provider.
 *
 * For Resend: uses resend.emails.send() with attachments array.
 * For SES: uses raw MIME message format.
 */
export async function sendEmailWithAttachmentsViaProvider(
  resendClient: Resend,
  params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    headers?: Record<string, string>;
    attachments: Array<{ filename: string; content: string /* base64 */ }>;
  }
): Promise<EmailSendResult> {
  const provider = getEmailProvider();
  const cleanSubject = sanitizeSubject(params.subject);
  const cleanTo = sanitizeTo(params.to);

  if (provider === "ses") {
    console.log(`[EmailProvider][SES] Sending with ${params.attachments.length} attachment(s) to ${cleanTo}`);
    const result = await sesSendEmailWithAttachments({ ...params, subject: cleanSubject, to: cleanTo });
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: "ses",
    };
  }

  // Fallback: Resend (supports attachments natively)
  console.log(`[EmailProvider][Resend] Sending with ${params.attachments.length} attachment(s) to ${cleanTo}`);
  try {
    const { data, error } = await resendClient.emails.send({
      from: params.from,
      to: cleanTo,
      subject: cleanSubject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
      attachments: params.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      return { success: false, error: JSON.stringify(error), provider: "resend" };
    }
    return { success: true, messageId: data?.id, provider: "resend" };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err), provider: "resend" };
  }
}

/**
 * Send a batch of emails through the configured provider.
 *
 * For Resend: uses resend.batch.send() (up to 100 per call).
 * For SES: loops through recipients with rate limiting.
 *
 * Both return the same { success, sent, failed, provider } shape.
 */
export async function sendBatchViaProvider(
  resendClient: Resend,
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    reply_to?: string;
    headers?: Record<string, string>;
  }>
): Promise<EmailBatchResult> {
  const provider = getEmailProvider();

  if (emails.length === 0) {
    return { success: true, sent: 0, failed: 0, provider };
  }

  // Sanitize all subjects and to-addresses in the batch
  const sanitizedEmails = emails.map((e) => ({
    ...e,
    subject: sanitizeSubject(e.subject),
    to: sanitizeTo(e.to),
  }));

  if (provider === "ses") {
    console.log(`[EmailProvider][SES] Sending batch of ${sanitizedEmails.length}`);
    const result = await sesSendBatch(sanitizedEmails);
    return {
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      provider: "ses",
    };
  }

  // Fallback: Resend batch API
  console.log(`[EmailProvider][Resend] Sending batch of ${sanitizedEmails.length}`);
  try {
    const { data, error } = await resendClient.batch.send(sanitizedEmails);

    if (error) {
      return {
        success: false,
        sent: 0,
        failed: emails.length,
        error: JSON.stringify(error),
        provider: "resend",
      };
    }

    return {
      success: true,
      sent: emails.length,
      failed: 0,
      provider: "resend",
    };
  } catch (err: any) {
    return {
      success: false,
      sent: 0,
      failed: emails.length,
      error: err?.message || String(err),
      provider: "resend",
    };
  }
}
