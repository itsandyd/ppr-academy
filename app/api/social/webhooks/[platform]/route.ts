import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Webhook handler for social media platform events
 * Receives notifications about post status, comments, likes, etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform;
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || 
                     request.headers.get('x-twitter-webhooks-signature') ||
                     request.headers.get('x-linkedin-signature');

    // Verify webhook signature
    const isValid = verifyWebhookSignature(platform, body, signature || '');
    
    if (!isValid) {
      console.error(`Invalid webhook signature for ${platform}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle webhook based on platform
    switch (platform) {
      case 'instagram':
      case 'facebook':
        await handleFacebookWebhook(payload);
        break;
      
      case 'twitter':
        await handleTwitterWebhook(payload);
        break;
      
      case 'linkedin':
        await handleLinkedInWebhook(payload);
        break;
      
      case 'tiktok':
        await handleTikTokWebhook(payload);
        break;
      
      default:
        console.error(`Unsupported platform: ${platform}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle webhook verification (GET request)
 * Required by Facebook/Instagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

function verifyWebhookSignature(platform: string, body: string, signature: string): boolean {
  try {
    switch (platform) {
      case 'instagram':
      case 'facebook':
        return verifyFacebookSignature(body, signature);
      
      case 'twitter':
        return verifyTwitterSignature(body, signature);
      
      case 'linkedin':
        return verifyLinkedInSignature(body, signature);
      
      case 'tiktok':
        return verifyTikTokSignature(body, signature);
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function verifyFacebookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET!)
    .update(body)
    .digest('hex');
  
  const signatureHash = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash),
    Buffer.from(expectedSignature)
  );
}

function verifyTwitterSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TWITTER_WEBHOOK_SECRET!)
    .update(body)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

function verifyLinkedInSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.LINKEDIN_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

function verifyTikTokSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TIKTOK_CLIENT_SECRET!)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

async function handleFacebookWebhook(payload: any) {
  console.log('Facebook webhook received:', JSON.stringify(payload, null, 2));

  if (payload.object === 'page' || payload.object === 'instagram') {
    for (const entry of payload.entry) {
      // Handle different event types
      if (entry.changes) {
        for (const change of entry.changes) {
          console.log('Change event:', change.field, change.value);
          
          // Store webhook event in database
          // TODO: Call Convex mutation to store webhook
        }
      }

      if (entry.messaging) {
        for (const message of entry.messaging) {
          console.log('Message event:', message);
        }
      }
    }
  }
}

async function handleTwitterWebhook(payload: any) {
  console.log('Twitter webhook received:', JSON.stringify(payload, null, 2));

  // Handle different Twitter events
  if (payload.tweet_create_events) {
    for (const tweet of payload.tweet_create_events) {
      console.log('Tweet created:', tweet.id_str);
    }
  }

  if (payload.favorite_events) {
    for (const favorite of payload.favorite_events) {
      console.log('Tweet favorited:', favorite.favorited_status.id_str);
    }
  }

  if (payload.follow_events) {
    for (const follow of payload.follow_events) {
      console.log('New follower:', follow.source.id_str);
    }
  }
}

async function handleLinkedInWebhook(payload: any) {
  console.log('LinkedIn webhook received:', JSON.stringify(payload, null, 2));

  // Handle LinkedIn events
  if (payload.eventType === 'SHARE_STATISTICS_UPDATE') {
    console.log('Share statistics updated:', payload.shareUrn);
    
    // Update analytics in database
    // TODO: Call Convex mutation to update analytics
  }
}

async function handleTikTokWebhook(payload: any) {
  console.log('TikTok webhook received:', JSON.stringify(payload, null, 2));

  // Handle TikTok events
  if (payload.event === 'video.publish.completed') {
    console.log('Video published:', payload.video_id);
    
    // Update post status in database
    // TODO: Call Convex mutation to update post status
  }

  if (payload.event === 'video.upload.failed') {
    console.log('Video upload failed:', payload.video_id);
    
    // Update post status to failed
    // TODO: Call Convex mutation to update post status
  }
}
