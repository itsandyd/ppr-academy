import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * Resend Inbound Email Webhook Handler
 *
 * Receives customer replies sent to inbox@pauseplayrepeat.com
 * Stores them in emailReplies table and matches to creators
 */

// Webhook signature verification (matches sibling resend webhook route)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (error) {
    console.error("[Inbox Webhook] Signature verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (webhookSecret) {
      if (svixSignature && svixTimestamp && svixId) {
        const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
        const expectedSignature = svixSignature.split(",")[1]; // Format: "v1,signature"

        if (!verifyWebhookSignature(signedContent, expectedSignature, webhookSecret)) {
          console.error("[Inbox Webhook] Invalid signature");
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
      } else {
        // Secret is configured but no signature headers provided — reject
        console.error("[Inbox Webhook] Missing signature headers");
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    
    // Extract email data
    const {
      from,
      to,
      subject,
      text,
      html,
      headers,
      attachments,
    } = body;
    
    // Parse from email
    const fromMatch = from.match(/<(.+)>/);
    const fromEmail = fromMatch ? fromMatch[1] : from;
    const fromName = from.replace(/<.+>/, "").trim();
    
    // Extract In-Reply-To header for thread matching
    const inReplyTo = headers?.["in-reply-to"] || headers?.["In-Reply-To"];
    const references = headers?.references || headers?.References;
    const messageId = headers?.["message-id"] || headers?.["Message-ID"];
    
    // Create reply record in Convex
    await fetchMutation(api.inboxQueries.createInboxReply, {
      messageId: messageId || `generated-${Date.now()}`,
      inReplyTo,
      references: references ? references.split(/\s+/) : undefined,
      fromEmail,
      fromName: fromName || undefined,
      toEmail: to,
      subject,
      textBody: text,
      htmlBody: html,
      hasAttachments: attachments && attachments.length > 0,
      // Note: Attachments would need to be saved to Convex storage
    });
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Inbox Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "Inbox webhook endpoint active",
    timestamp: new Date().toISOString(),
    purpose: "Receives customer replies to inbox@pauseplayrepeat.com",
  });
}

