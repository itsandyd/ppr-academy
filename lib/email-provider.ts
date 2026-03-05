/**
 * Email Provider Router — Next.js side
 *
 * Routes email sends to either AWS SES (default) or Resend based on
 * the EMAIL_PROVIDER environment variable.
 *
 * Usage: Replace `resend.emails.send({...})` with:
 *   const result = await sendViaProvider(resend, {...})
 *
 * Config:
 *   EMAIL_PROVIDER=ses      (default — routes to AWS SES v2)
 *   EMAIL_PROVIDER=resend   (fallback — uses existing Resend setup)
 */

import { Resend } from "resend";
import { sesSendEmail } from "./ses-email";

export type EmailProvider = "resend" | "ses";

export interface ProviderSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "ses").toLowerCase();
  if (provider === "resend") return "resend";
  return "ses";
}

/** Strip newline characters from email subjects (known bug). */
function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Send a single email through the configured provider.
 *
 * Returns a normalized result compatible with the existing `result.data?.id`
 * pattern: check `result.success` and `result.messageId`.
 */
export async function sendViaProvider(
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
): Promise<ProviderSendResult> {
  const provider = getEmailProvider();

  const cleanSubject = sanitizeSubject(params.subject);

  if (provider === "ses") {
    console.log(`[EmailProvider][SES] Sending to ${params.to}`);
    const result = await sesSendEmail({ ...params, subject: cleanSubject });
    return { ...result, provider: "ses" };
  }

  // Fallback: Resend
  console.log(`[EmailProvider][Resend] Sending to ${params.to}`);
  try {
    const { data, error } = await resendClient.emails.send({
      from: params.from,
      to: params.to,
      subject: cleanSubject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      ...(params.headers ? { headers: params.headers } : {}),
    });

    if (error) {
      return { success: false, error: JSON.stringify(error), provider: "resend" };
    }

    return { success: true, messageId: data?.id, provider: "resend" };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err), provider: "resend" };
  }
}
