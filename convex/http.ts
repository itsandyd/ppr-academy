import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

/**
 * Instagram Webhook Verification (GET)
 * Instagram calls this to verify webhook endpoint
 */
http.route({
  path: "/webhooks/instagram",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Verify the token matches what you set in Meta Developer Dashboard
    const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "testing";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Instagram webhook verified");
      return new Response(challenge, { status: 200 });
    } else {
      console.error("❌ Instagram webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    }
  }),
});

/**
 * Instagram Webhook Handler (POST)
 * Receives comment and DM events from Instagram
 */
http.route({
  path: "/webhooks/instagram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      
      console.log("📨 Instagram webhook received:", JSON.stringify(payload, null, 2));

      // Process webhook asynchronously
      await ctx.runAction(internal.webhooks.instagram.processWebhook, {
        payload,
      });

      // Always return 200 to Instagram (even if processing fails)
      // Otherwise Instagram will retry repeatedly
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      
      // Still return 200 to prevent Instagram retries
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * Instagram OAuth Callback - Removed
 * Now handled by Next.js route: /app/auth/instagram/callback/page.tsx
 * This allows us to use Clerk auth context on the client side
 */

// Stripe webhook for subscription payments
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    try {
      // Verify and process Stripe webhook
      await ctx.runAction(internal.webhooks.stripe.processWebhook, {
        body,
        signature,
      });

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return new Response("Webhook processing failed", { status: 400 });
    }
  }),
});

export default http;
