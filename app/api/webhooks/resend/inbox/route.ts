import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Resend Inbound Email Webhook Handler
 * 
 * Receives customer replies sent to inbox@pauseplayrepeat.com
 * Stores them in emailReplies table and matches to creators
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("[Inbox Webhook] Received email:", {
      from: body.from,
      to: body.to,
      subject: body.subject,
    });
    
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

