import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const {
      tierId,
      tierName,
      customerEmail,
      customerName,
      priceMonthly,
      priceYearly,
      billingCycle,
      trialDays,
      userId,
      storeId,
      creatorId,
      stripePriceIdMonthly,
      stripePriceIdYearly,
      creatorStripeAccountId,
    } = await request.json();

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!tierId || !customerEmail || !customerName || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const price = billingCycle === "yearly" ? priceYearly : priceMonthly;
    const platformFeePercent = 10;

    let stripePriceId = billingCycle === "yearly" ? stripePriceIdYearly : stripePriceIdMonthly;

    if (!stripePriceId) {
      const product = await stripe.products.create({
        name: tierName,
        metadata: {
          tierId,
          storeId,
          creatorId,
        },
      });

      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100),
        currency: "usd",
        recurring: {
          interval: billingCycle === "yearly" ? "year" : "month",
        },
        metadata: {
          tierId,
          billingCycle,
        },
      });

      stripePriceId = stripePrice.id;
    }

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?mode=learn&subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace`,
      customer_email: customerEmail,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          tierId,
          userId,
          storeId,
          creatorId,
          billingCycle,
          productType: "membership",
        },
      },
      metadata: {
        tierId,
        userId,
        storeId,
        creatorId,
        billingCycle,
        productType: "membership",
        tierName,
      },
    };

    if (trialDays && trialDays > 0) {
      sessionData.subscription_data!.trial_period_days = trialDays;
    }

    if (creatorStripeAccountId) {
      sessionData.subscription_data!.application_fee_percent = platformFeePercent;
      sessionData.subscription_data!.transfer_data = {
        destination: creatorStripeAccountId,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("✅ Membership checkout session created:", {
      sessionId: session.id,
      tierName,
      billingCycle,
      price,
      trialDays: trialDays || 0,
      customer: customerName,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("❌ Membership checkout session creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
