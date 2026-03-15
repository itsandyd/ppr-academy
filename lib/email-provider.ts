/**
 * Email Provider Router — Next.js side
 *
 * All email sends route through AWS SES.
 */

import { sesSendEmail } from "./ses-email";

export interface ProviderSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "ses";
}

/** Strip newline characters from email subjects. */
function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Send a single email via AWS SES.
 */
export async function sendViaProvider(
  params: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  }
): Promise<ProviderSendResult> {
  const cleanSubject = sanitizeSubject(params.subject);

  console.log(`[EmailProvider][SES] Sending to ${params.to}`);
  const result = await sesSendEmail({ ...params, subject: cleanSubject });
  return { ...result, provider: "ses" };
}
