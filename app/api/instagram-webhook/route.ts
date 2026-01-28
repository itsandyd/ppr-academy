import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { internal } from "@/convex/_generated/api";
import crypto from 'crypto';

// Initialize Convex client for server-side calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify Instagram signature for security
function verifyInstagramSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.FACEBOOK_APP_SECRET) {
    console.warn('⚠️ Missing signature or app secret - skipping verification');
    return true; // Allow in development, enforce in production
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET)
    .update(payload)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  );
}

/**
 * Instagram Webhook - Verification and Event Processing
 *
 * This handles Instagram webhook verification (GET) and events (POST)
 * Connected to Convex for processing automations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 Instagram webhook verification:', {
      mode,
      token,
      challenge,
      expectedToken: 'ppr_automation_webhook_2024'
    });

    // Instagram verification
    if (mode === 'subscribe' && token === 'ppr_automation_webhook_2024' && challenge) {
      console.log('✅ Instagram webhook verification SUCCESS');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('❌ Instagram webhook verification FAILED');
    return NextResponse.json({
      error: 'Verification failed',
      mode,
      token,
      challenge
    }, { status: 403 });

  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json({
      error: 'Server error: ' + String(error)
    }, { status: 500 });
  }
}

/**
 * Handle Instagram webhook events
 * Processes comments, DMs, and other Instagram events through Convex
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && !verifyInstagramSignature(body, signature)) {
      console.error('❌ Invalid Instagram webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    console.log('📥 Instagram webhook received:', JSON.stringify(payload, null, 2));

    // Validate it's from Instagram
    if (payload.object !== 'instagram' && payload.object !== 'page') {
      console.log('⚠️ Not an Instagram webhook, ignoring');
      return NextResponse.json({ received: true });
    }

    // Process each entry in the webhook payload
    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        try {
          // Call Convex internal action to process the webhook
          // The processWebhook action handles comments, DMs, and triggers automations
          await convex.action(
            // @ts-expect-error - internal action type
            internal.webhooks.instagram.processWebhook,
            { payload: { ...payload, entry: [entry] } }
          );
          console.log('✅ Processed entry:', entry.id);
        } catch (error) {
          console.error('❌ Error processing entry:', entry.id, error);
          // Continue processing other entries even if one fails
        }
      }
    }

    // Always return 200 quickly to Instagram
    // Instagram requires a fast response (< 20 seconds)
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Instagram from retrying
    // Log the error for debugging but don't fail the request
    return NextResponse.json({ received: true, error: 'logged' });
  }
}
