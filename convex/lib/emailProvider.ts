"use node";

/**
 * Email Provider — AWS SES
 *
 * All email sends route through AWS SES v2.
 */

import { sesSendEmail, sesSendBatch, sesSendEmailWithAttachments } from "./sesClient";

/** Normalized result from a send. */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "ses";
}

/** Normalized result from a batch send. */
export interface EmailBatchResult {
  success: boolean;
  sent: number;
  failed: number;
  provider: "ses";
  error?: string;
}

export function getEmailProvider(): "ses" {
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
  s = s.replace(/^(Re:\s*|RE:\s*|re:\s*|Fwd:\s*|FWD:\s*|fwd:\s*|FW:\s*|fw:\s*)+/i, "").trim();
  return s;
}

/**
 * Normalize a "to" address to prevent duplicates in the To header.
 */
function sanitizeTo(to: string): string {
  const match = to.match(/^(.+?)\s*<([^>]+)>$/);
  if (!match) return to;

  const displayName = match[1].trim();
  const emailAddr = match[2].trim();

  if (displayName.toLowerCase() === emailAddr.toLowerCase()) {
    return emailAddr;
  }

  return to;
}

/**
 * Send a single email via AWS SES.
 */
export async function sendEmailViaProvider(
  params: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  }
): Promise<EmailSendResult> {
  const cleanSubject = sanitizeSubject(params.subject);
  const cleanTo = sanitizeTo(params.to);

  console.log(`[EmailProvider][SES] Sending to ${cleanTo}`);
  const result = await sesSendEmail({ ...params, subject: cleanSubject, to: cleanTo });
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    provider: "ses",
  };
}

/**
 * Send a single email with attachments via AWS SES.
 */
export async function sendEmailWithAttachmentsViaProvider(
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
  const cleanSubject = sanitizeSubject(params.subject);
  const cleanTo = sanitizeTo(params.to);

  console.log(`[EmailProvider][SES] Sending with ${params.attachments.length} attachment(s) to ${cleanTo}`);
  const result = await sesSendEmailWithAttachments({ ...params, subject: cleanSubject, to: cleanTo });
  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    provider: "ses",
  };
}

/**
 * Send a batch of emails via AWS SES.
 */
export async function sendBatchViaProvider(
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    reply_to?: string;
    headers?: Record<string, string>;
  }>
): Promise<EmailBatchResult> {
  if (emails.length === 0) {
    return { success: true, sent: 0, failed: 0, provider: "ses" };
  }

  const sanitizedEmails = emails.map((e) => ({
    ...e,
    subject: sanitizeSubject(e.subject),
    to: sanitizeTo(e.to),
  }));

  console.log(`[EmailProvider][SES] Sending batch of ${sanitizedEmails.length}`);
  const result = await sesSendBatch(sanitizedEmails);
  return {
    success: result.success,
    sent: result.sent,
    failed: result.failed,
    provider: "ses",
  };
}
