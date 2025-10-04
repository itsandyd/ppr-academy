import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

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


