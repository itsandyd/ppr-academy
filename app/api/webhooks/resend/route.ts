import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

/**
 * Resend Webhook Handler
 * Handles email events: delivered, opened, clicked, bounced, complained, delivery_delayed
 *
 * Event Types:
 * - email.sent: Email was accepted by Resend
 * - email.delivered: Email was delivered to recipient
 * - email.delivery_delayed: Email delivery was delayed
 * - email.complained: Recipient marked email as spam
 * - email.bounced: Email bounced (hard or soft)
 * - email.opened: Email was opened by recipient
 * - email.clicked: Link in email was clicked
 */

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (error) {
    console.error("[Resend Webhook] Signature verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("[Resend Webhook] Invalid JSON:", error);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { type, data, created_at } = body;

    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const signature = req.headers.get("resend-signature");
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (webhookSecret) {
      // Resend uses Svix for webhook signatures
      if (svixSignature && svixTimestamp && svixId) {
        const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
        const expectedSignature = svixSignature.split(",")[1]; // Format: "v1,signature"

        if (!verifyWebhookSignature(signedContent, expectedSignature, webhookSecret)) {
          console.error("[Resend Webhook] Invalid signature");
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
      } else if (signature) {
        // Legacy signature verification
        if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
          console.error("[Resend Webhook] Invalid signature");
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
      } else {
        console.warn("[Resend Webhook] No signature provided, but secret is configured");
      }
    }

    // Validate event type
    const validEvents = [
      "email.sent",
      "email.delivered",
      "email.delivery_delayed",
      "email.complained",
      "email.bounced",
      "email.opened",
      "email.clicked",
    ];

    if (!validEvents.includes(type)) {
      console.warn(`[Resend Webhook] Unknown event type: ${type}`);
      return NextResponse.json({ received: true, message: "Unknown event type" });
    }

    // Log event details
    console.log(`[Resend Webhook] Event: ${type}`, {
      emailId: data.email_id,
      to: data.to,
      subject: data.subject,
      createdAt: created_at,
    });

    // Validate required data
    if (!data.email_id) {
      console.warn("[Resend Webhook] No email_id in webhook data");
      return NextResponse.json({ received: true, message: "No email_id provided" });
    }

    // Extract relevant data based on event type
    const eventData: any = {
      emailId: data.email_id,
      to: data.to,
      from: data.from,
      subject: data.subject,
      timestamp: created_at ? new Date(created_at).getTime() : Date.now(),
    };

    // Add event-specific data
    switch (type) {
      case "email.bounced":
        eventData.bounceType = data.bounce?.type; // "hard" or "soft"
        eventData.bounceReason = data.bounce?.message;
        break;
      case "email.complained":
        eventData.complaintFeedbackType = data.complaint?.feedback_type;
        break;
      case "email.clicked":
        eventData.clickedUrl = data.click?.link;
        eventData.clickedIpAddress = data.click?.ip_address;
        eventData.clickedUserAgent = data.click?.user_agent;
        break;
      case "email.opened":
        eventData.openedIpAddress = data.open?.ip_address;
        eventData.openedUserAgent = data.open?.user_agent;
        break;
      case "email.delivery_delayed":
        eventData.delayReason = data.delay?.message;
        break;
    }

    await fetchMutation(api.emailQueries.handleWebhookEvent, {
      event: type,
      emailId: data.email_id,
      timestamp: eventData.timestamp,
      metadata: eventData,
    });

    if (type === "email.complained" && data.to) {
      const recipientEmail = Array.isArray(data.to) ? data.to[0] : data.to;
      if (recipientEmail) {
        try {
          await fetchMutation(api.emailUnsubscribe.unsubscribeByEmail, {
            email: recipientEmail,
            reason: "Spam complaint - auto-unsubscribed",
          });
          console.log(`[Resend Webhook] Auto-unsubscribed ${recipientEmail} due to spam complaint`);
        } catch (err) {
          console.error(`[Resend Webhook] Failed to auto-unsubscribe ${recipientEmail}:`, err);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Resend Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification and health check)
export async function GET() {
  return NextResponse.json({
    status: "Resend webhook endpoint active",
    timestamp: new Date().toISOString(),
    supportedEvents: [
      "email.sent",
      "email.delivered",
      "email.delivery_delayed",
      "email.complained",
      "email.bounced",
      "email.opened",
      "email.clicked",
    ],
  });
}
