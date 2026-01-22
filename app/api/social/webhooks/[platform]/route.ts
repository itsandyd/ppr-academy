import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Type helper for internal API access
const getInternalClient = () => {
  // For server-side internal calls, we use the same client
  // The internal functions are called via actions that have access to internal
  return convex;
};

/**
 * Webhook handler for social media platform events
 * Receives notifications about post status, comments, likes, etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
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
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 Webhook verification attempt:', {
      platform,
      mode,
      token,
      challenge,
      expectedToken: process.env.WEBHOOK_VERIFY_TOKEN,
    });

    // Instagram/Facebook webhook verification
    if (mode === 'subscribe') {
      const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN;
      
      if (!expectedToken) {
        console.error('❌ WEBHOOK_VERIFY_TOKEN not set in environment variables');
        return NextResponse.json({ 
          error: 'Server configuration error - verify token not set' 
        }, { status: 500 });
      }

      if (token === expectedToken && challenge) {
        console.log('✅ Webhook verification successful');
        return new NextResponse(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.error('❌ Token mismatch:', { received: token, expected: expectedToken });
        return NextResponse.json({ 
          error: 'Invalid verify token',
          received: token,
          expected: expectedToken ? 'SET' : 'NOT_SET'
        }, { status: 403 });
      }
    }

    console.error('❌ Invalid verification mode:', mode);
    return NextResponse.json({ error: 'Invalid mode' }, { status: 403 });
    
  } catch (error) {
    console.error('❌ Webhook verification error:', error);
    return NextResponse.json({ 
      error: 'Verification processing failed',
      details: String(error)
    }, { status: 500 });
  }
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
  console.log('📥 Facebook/Instagram webhook received:', JSON.stringify(payload, null, 2));

  if (payload.object === 'page' || payload.object === 'instagram') {
    for (const entry of payload.entry) {
      // Handle Instagram comments
      if (entry.changes) {
        for (const change of entry.changes) {
          console.log('📝 Change event:', change.field, change.value);
          
          // Process comments for automation triggers
          if (change.field === 'comments' || (change.field === 'feed' && change.value?.item === 'comment')) {
            try {
              const webhookId = await convex.mutation(api.automation.createSocialWebhook, {
                platform: payload.object === 'instagram' ? 'instagram' : 'facebook',
                eventType: `${payload.object}.comment`,
                payload: {
                  ...change.value,
                  entry: entry,
                },
                socialAccountId: undefined,
              });

              // Process for automation triggers
              await convex.action(api.automation.processSocialWebhookForAutomation, {
                webhookId,
              });
              
              console.log('✅ Automation processing triggered for comment');
            } catch (error) {
              console.error('❌ Error processing comment for automation:', error);
            }
          }
        }
      }

      // Handle Instagram/Facebook messages
      if (entry.messaging) {
        for (const message of entry.messaging) {
          console.log('💬 Message event:', message);

          if (message.message) {
            try {
              // Route to appropriate platform webhook processor
              if (payload.object === 'instagram') {
                // Instagram messages are handled by the instagram webhook processor
                await convex.action(api.socialDMWebhooks.processInstagramWebhook, {
                  payload: payload,
                });
              } else {
                // Facebook Messenger messages
                await convex.action(api.socialDMWebhooks.processFacebookWebhook, {
                  payload: payload,
                });
              }

              console.log('✅ DM automation processing triggered');
            } catch (error) {
              console.error('❌ Error processing message for automation:', error);
            }
          }
        }
      }
    }
  }
}

async function handleTwitterWebhook(payload: any) {
  console.log('Twitter webhook received:', JSON.stringify(payload, null, 2));

  // Handle Direct Messages - route to Convex for automation processing
  if (payload.direct_message_events && payload.direct_message_events.length > 0) {
    try {
      // Process via public action wrapper
      await convex.action(api.socialDMWebhooks.processTwitterWebhook, {
        payload,
      });
      console.log('✅ Twitter DM webhook processed');
    } catch (error) {
      console.error('❌ Error processing Twitter DM:', error);
    }
  }

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

  // TikTok webhooks are limited to video status updates only
  // Comment/DM automation requires Creator Marketplace API approval
  if (payload.event === 'video.publish.completed') {
    console.log('Video published:', payload.video_id);
    // TODO: Update post status in database
  }

  if (payload.event === 'video.upload.failed') {
    console.log('Video upload failed:', payload.video_id);
    // TODO: Update post status to failed
  }
}
