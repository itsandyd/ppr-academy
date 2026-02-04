import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

/**
 * Stripe Webhook - Handled by Next.js
 * See: /app/api/webhooks/stripe/route.ts
 * The Next.js route handles all Stripe events and uses Convex for mutations/queries
 */

/**
 * Vercel Web Analytics Drain (POST)
 * Receives analytics events from Vercel's Web Analytics Drain feature.
 * Events include pageviews and custom events with device/geo/session data.
 *
 * Configure in Vercel Dashboard → Team Settings → Drains → Web Analytics
 */
http.route({
  path: "/drains/analytics",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Vercel sends events as a JSON array
      const events = await request.json();

      if (!Array.isArray(events)) {
        console.error("❌ Analytics drain: expected array, got", typeof events);
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`📊 Analytics drain received ${events.length} events`);

      // Process events asynchronously
      await ctx.runMutation(internal.webAnalytics.ingestEvents, { events });

      return new Response(JSON.stringify({ success: true, count: events.length }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("❌ Analytics drain error:", error);

      // Return 200 to prevent Vercel retries on parsing errors
      return new Response(JSON.stringify({ success: false, error: "Processing failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * Admin endpoint to update campaign content
 * POST /admin/update-campaign-content
 */
http.route({
  path: "/admin/update-campaign-content",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { campaignName, htmlContent, adminSecret } = await request.json() as {
        campaignName: string;
        htmlContent: string;
        adminSecret: string;
      };

      // Simple secret check (you should use a proper env var in production)
      if (adminSecret !== "ppr-admin-2024") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Patch the document by name
      const result = await ctx.runMutation(internal.emailQueries.patchCampaignContent, {
        campaignName,
        htmlContent,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Failed to update campaign:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
