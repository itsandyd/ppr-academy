/**
 * AWS SES v2 Email Client — Next.js side
 *
 * Mirrors the Convex-side sesClient for use in Next.js API routes
 * and server-side code (lib/email.ts).
 *
 * See convex/lib/sesClient.ts for full documentation on SES setup.
 */

import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";

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
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _sesClient;
}

export interface SESEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sesSendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<SESEmailResult> {
  try {
    const client = getSESClient();

    const input: SendEmailCommandInput = {
      FromEmailAddress: params.from,
      Destination: { ToAddresses: [params.to] },
      Content: {
        Simple: {
          Subject: { Data: params.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: params.html, Charset: "UTF-8" },
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
      },
      ...(params.replyTo ? { ReplyToAddresses: [params.replyTo] } : {}),
    };

    const response = await client.send(new SendEmailCommand(input));

    console.log(
      `[SES] Sent email to ${params.to} | subject="${params.subject}" | messageId=${response.MessageId}`
    );

    return { success: true, messageId: response.MessageId };
  } catch (error: any) {
    console.error(`[SES] Failed to send email to ${params.to}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}
