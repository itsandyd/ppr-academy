"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { api } from "../_generated/api";
import Stripe from "stripe";

/**
 * Process Stripe webhook events
 */
export const processWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Initialize Stripe inside the function (required for Convex)
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-08-27.basil",
      });

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        args.body,
        args.signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log("📨 Stripe webhook:", event.type);

      // Handle subscription events
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(ctx, event.data.object as Stripe.Checkout.Session);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(ctx, event.data.object as Stripe.Subscription);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(ctx, event.data.object as Stripe.Subscription);
          break;

        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(ctx, event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handlePaymentFailed(ctx, event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return null;
    } catch (error) {
      console.error("❌ Stripe webhook error:", error);
      throw error;
    }
  },
});

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(ctx: any, session: Stripe.Checkout.Session) {
  console.log("✅ Checkout completed:", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update user subscription in database
  // TODO: Implement this mutation
  console.log("TODO: Update user subscription to PRO plan");
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(ctx: any, subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;
  const plan = subscription.items.data[0]?.price.id;

  // TODO: Update subscription in database
  console.log("TODO: Update subscription status:", status);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(ctx: any, subscription: Stripe.Subscription) {
  console.log("🗑️ Subscription deleted:", subscription.id);

  // Downgrade user to FREE plan
  // TODO: Implement this
  console.log("TODO: Downgrade user to FREE plan");
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(ctx: any, invoice: Stripe.Invoice) {
  console.log("💰 Payment succeeded:", invoice.id);
  // Track revenue, send thank you email, etc.
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(ctx: any, invoice: Stripe.Invoice) {
  console.log("❌ Payment failed:", invoice.id);
  // Send payment retry notification
}

