import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Stripe webhook received:", event.type, event.id);

  try {
    switch (event.type) {
      case "account.updated":
        // Handle Connect account updates
        const account = event.data.object as Stripe.Account;
        console.log("📋 Account updated:", {
          id: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });
        
        // TODO: Update user record with account status in Convex
        // This will happen when we implement the user update function
        
        break;

      case "account.application.authorized":
        // When a user completes Connect onboarding
        const application = event.data.object as any;
        console.log("🎉 Account application authorized:", application.account);
        break;

      case "payment_intent.succeeded":
        // Handle successful course purchases
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💰 Payment succeeded:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        });
        
        // TODO: Create course enrollment in Convex
        // This will happen when we implement course purchase flow
        
        break;

      case "checkout.session.completed":
        // Handle successful checkout (for credits)
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("💳 Checkout completed:", {
          id: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          metadata: session.metadata,
        });

        // Handle credit package purchases
        if (session.metadata?.productType === "credit_package") {
          const { userId, packageId, credits, bonusCredits } = session.metadata;
          const totalCredits = parseInt(credits) + parseInt(bonusCredits || "0");

          console.log("🪙 Processing credit purchase:", {
            userId,
            packageId,
            totalCredits,
            sessionId: session.id,
          });

          // TODO: Call Convex mutation to add credits to user account
          // This will be implemented once we have the mutation ready
        }

        break;

      case "payment_intent.payment_failed":
        // Handle failed payments
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Payment failed:", {
          id: failedPayment.id,
          lastPaymentError: failedPayment.last_payment_error,
          metadata: failedPayment.metadata,
        });
        
        // TODO: Handle payment failure notification
        
        break;

      case "transfer.created":
        // When money is transferred to a Connect account
        const transfer = event.data.object as Stripe.Transfer;
        console.log("💸 Transfer created:", {
          id: transfer.id,
          amount: transfer.amount / 100,
          destination: transfer.destination,
        });
        break;

      case "transfer.paid":
        // When transfer is completed
        const paidTransfer = event.data.object as Stripe.Transfer;
        console.log("✅ Transfer completed:", paidTransfer.id);
        break;

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json({ 
      error: "Webhook handler failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
