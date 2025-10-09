import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  try {
    // ✅ SECURITY: Require authentication
    const user = await requireAuth();
    
    // ✅ SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(req, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }
    
    const { planId, userId, userEmail, billingCycle } = await req.json();

    // ✅ SECURITY: Verify user matches
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "User mismatch" },
        { status: 403 }
      );
    }

    if (!planId || !userId || !userEmail || !billingCycle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get plan details from Convex
    const plan = await fetchQuery(api.subscriptions.getSubscriptionPlanDetails, {
      planId: planId as Id<"subscriptionPlans">,
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Determine price based on billing cycle
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    const priceInDollars = (price / 100).toFixed(2);

    // Create or retrieve Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          convexUserId: userId,
        },
      });
    }

    // Create or get Stripe price
    // In production, you should store Stripe price IDs in your plan
    // For now, we'll create prices dynamically
    const stripePrice = await stripe.prices.create({
      unit_amount: price,
      currency: plan.currency || "usd",
      recurring: {
        interval: billingCycle === "monthly" ? "month" : "year",
      },
      product_data: {
        name: `${plan.name} - Subscription`,
        description: plan.description,
      },
    });

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      metadata: {
        planId: planId,
        userId: userId,
        storeId: plan.storeId,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          planId: planId,
          userId: userId,
          storeId: plan.storeId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/library?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/${planId}?billing=${billingCycle}`,
    };

    // Add trial period if available
    if (plan.trialDays && plan.trialDays > 0) {
      sessionParams.subscription_data!.trial_period_days = plan.trialDays;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

