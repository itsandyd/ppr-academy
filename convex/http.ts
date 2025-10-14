import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Health Check Endpoint
 * 
 * Use this endpoint to verify the Convex backend is running
 * GET /health
 * 
 * Response: { "status": "ok", "timestamp": 1234567890 }
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        timestamp: Date.now(),
        service: "ppr-academy-convex"
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }),
});

/**
 * Public Media Proxy with File Extension
 * 
 * Serves media files from Convex storage for social media platforms
 * GET /social/media/{storageId}.{ext}
 * 
 * Instagram and other platforms prefer URLs with file extensions.
 */
http.route({
  pathPrefix: "/social/media/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      // Extract storage ID and extension from path
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const filenamePart = pathParts[pathParts.length - 1]; // e.g., "abc123.jpg"
      
      // Remove extension and get storage ID
      const storageId = filenamePart.split('.')[0];

      if (!storageId) {
        return new Response("Missing storage ID", { status: 400 });
      }

      // Validate storage ID format
      if (!storageId.match(/^[a-z0-9]+$/)) {
        return new Response("Invalid storage ID format", { status: 400 });
      }

      console.log('📥 Public media request for storage ID:', storageId);

      // Get file from Convex storage
      const blob = await ctx.storage.get(storageId as Id<"_storage">);

      if (!blob) {
        console.error('❌ File not found:', storageId);
        return new Response("File not found", { status: 404 });
      }

      // Detect content type from blob
      let contentType = "application/octet-stream";
      let fileExtension = "bin";
      
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check for JPEG
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        contentType = "image/jpeg";
        fileExtension = "jpg";
      }
      // Check for PNG
      else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        contentType = "image/png";
        fileExtension = "png";
      }
      // Check for MP4
      else if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        contentType = "video/mp4";
        fileExtension = "mp4";
      }

      console.log('✅ Serving file with content type:', contentType);

      // Return file with Instagram-friendly headers
      return new Response(new Blob([arrayBuffer], { type: contentType }), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${storageId}.${fileExtension}"`,
          "Content-Length": String(arrayBuffer.byteLength),
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
          "Accept-Ranges": "bytes",
        },
      });
    } catch (error: any) {
      console.error('❌ Error serving media:', error);
      return new Response(error.message || "Internal server error", { 
        status: 500 
      });
    }
  }),
});

/**
 * Simple webhook test endpoint
 */
http.route({
  path: "/webhook-test",
  method: "GET", 
  handler: httpAction(async (ctx, req) => {
    return new Response("Webhook test works!", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }),
});

/**
 * Instagram Webhook Verification (GET)
 */
http.route({
  path: "/instagram-webhook",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log('🔍 Instagram webhook verification attempt:', { 
        mode, 
        token, 
        challenge,
        fullUrl: req.url 
      });

      // Verification request
      if (mode === "subscribe") {
        if (token === "ppr_automation_webhook_2024") {
          if (challenge) {
            console.log('✅ Instagram webhook verification SUCCESS');
            return new Response(challenge, { 
              status: 200,
              headers: { "Content-Type": "text/plain" }
            });
          } else {
            console.log('❌ No challenge provided');
            return new Response("No challenge provided", { status: 400 });
          }
        } else {
          console.log('❌ Token mismatch:', { received: token, expected: "ppr_automation_webhook_2024" });
          return new Response("Token mismatch", { status: 403 });
        }
      } else {
        console.log('❌ Invalid mode:', mode);
        return new Response("Invalid mode", { status: 400 });
      }
    } catch (error) {
      console.error('❌ Webhook verification error:', error);
      return new Response("Internal error: " + String(error), { status: 500 });
    }
  }),
});

/**
 * Instagram Webhook Handler (POST for events)
 * 
 * Handles webhook events from Instagram for comments, messages, mentions
 * POST /webhooks/instagram
 */
http.route({
  path: "/webhooks/instagram",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.text();
      const payload = JSON.parse(body);

      console.log('📥 Instagram webhook received:', payload);

      // Process webhook events
      if (payload.object === "instagram") {
        for (const entry of payload.entry || []) {
          for (const change of entry.changes || []) {
            await processInstagramWebhook(ctx, change, entry);
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Instagram webhook error:", error);
      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

/**
 * Facebook Webhook Handler
 * 
 * Handles webhook events from Facebook for comments, messages, mentions
 * POST /webhooks/facebook
 */
http.route({
  path: "/webhooks/facebook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.text();
      const payload = JSON.parse(body);

      console.log('📥 Facebook webhook received:', payload);

      // Facebook webhook verification
      const mode = new URL(req.url).searchParams.get("hub.mode");
      const token = new URL(req.url).searchParams.get("hub.verify_token");
      const challenge = new URL(req.url).searchParams.get("hub.challenge");

      // Verification request
      if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }

      // Process webhook events
      if (payload.object === "page") {
        for (const entry of payload.entry || []) {
          await processFacebookWebhook(ctx, entry);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Facebook webhook error:", error);
      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

/**
 * Twitter Webhook Handler
 * 
 * Handles webhook events from Twitter for mentions, DMs, replies
 * POST /webhooks/twitter
 */
http.route({
  path: "/webhooks/twitter",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.text();
      const payload = JSON.parse(body);

      console.log('📥 Twitter webhook received:', payload);

      // Process different Twitter events
      if (payload.tweet_create_events) {
        for (const tweet of payload.tweet_create_events) {
          await processTwitterWebhook(ctx, tweet, "tweet");
        }
      }

      if (payload.direct_message_events) {
        for (const dm of payload.direct_message_events) {
          await processTwitterWebhook(ctx, dm, "dm");
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Twitter webhook error:", error);
      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

/**
 * Process Instagram webhook events
 */
async function processInstagramWebhook(ctx: any, change: any, entry: any) {
  const eventType = change.field;
  let webhookEventType = "";
  
  switch (eventType) {
    case "comments":
      webhookEventType = "instagram.comment";
      break;
    case "messages":
      webhookEventType = "instagram.message";
      break;
    case "mentions":
      webhookEventType = "instagram.mention";
      break;
    default:
      console.log(`Unhandled Instagram event: ${eventType}`);
      return;
  }

  // Store webhook in database
  const webhookId = await ctx.runMutation(internal.automation.createSocialWebhook, {
    platform: "instagram",
    eventType: webhookEventType,
    payload: {
      ...change.value,
      entry: entry,
    },
    socialAccountId: undefined, // Will be determined during processing
  });

  // Process for automation triggers
  await ctx.runAction(internal.automation.processSocialWebhookForAutomation, {
    webhookId,
  });
}

/**
 * Process Facebook webhook events
 */
async function processFacebookWebhook(ctx: any, entry: any) {
  // Process comments
  if (entry.changes) {
    for (const change of entry.changes) {
      if (change.field === "feed" && change.value.item === "comment") {
        const webhookId = await ctx.runMutation(internal.automation.createSocialWebhook, {
          platform: "facebook",
          eventType: "facebook.comment",
          payload: {
            ...change.value,
            entry: entry,
          },
          socialAccountId: undefined,
        });

        await ctx.runAction(internal.automation.processSocialWebhookForAutomation, {
          webhookId,
        });
      }
    }
  }

  // Process messages
  if (entry.messaging) {
    for (const message of entry.messaging) {
      if (message.message) {
        const webhookId = await ctx.runMutation(internal.automation.createSocialWebhook, {
          platform: "facebook",
          eventType: "facebook.message",
          payload: {
            ...message,
            entry: entry,
          },
          socialAccountId: undefined,
        });

        await ctx.runAction(internal.automation.processSocialWebhookForAutomation, {
          webhookId,
        });
      }
    }
  }
}

/**
 * Process Twitter webhook events
 */
async function processTwitterWebhook(ctx: any, event: any, type: string) {
  let webhookEventType = "";
  
  if (type === "tweet") {
    // Check if it's a mention or reply
    if (event.in_reply_to_status_id) {
      webhookEventType = "twitter.reply";
    } else if (event.entities?.user_mentions?.length > 0) {
      webhookEventType = "twitter.mention";
    } else {
      return; // Skip regular tweets
    }
  } else if (type === "dm") {
    webhookEventType = "twitter.message";
  }

  const webhookId = await ctx.runMutation(internal.automation.createSocialWebhook, {
    platform: "twitter",
    eventType: webhookEventType,
    payload: event,
    socialAccountId: undefined,
  });

  await ctx.runAction(internal.automation.processSocialWebhookForAutomation, {
    webhookId,
  });
}

/**
 * Stripe Webhook Handler
 * 
 * Handles webhook events from Stripe for subscription management
 * POST /stripe-webhook
 * 
 * This will be implemented in the next phase
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // TODO: Implement Stripe webhook handling in Phase 2
    // For now, return a placeholder response
    return new Response(
      JSON.stringify({ 
        received: true,
        message: "Stripe webhook handler - coming in Phase 2" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }),
});

export default http;


