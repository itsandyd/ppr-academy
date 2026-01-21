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
      bundleId,
      customerEmail,
      customerName,
      bundlePrice,
      bundleName,
      bundleImageUrl,
      userId,
      stripePriceId,
      creatorStripeAccountId,
      storeId,
      courseIds,
      productIds,
    } = await request.json();

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!bundleId || !customerEmail || !customerName || bundlePrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const platformFeeAmount = Math.round(bundlePrice * 0.1 * 100);

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace`,
      customer_email: customerEmail,
      metadata: {
        bundleId,
        customerEmail,
        customerName,
        userId,
        storeId: storeId || "",
        productType: "bundle",
        amount: (bundlePrice * 100).toString(),
        currency: "usd",
        courseIds: JSON.stringify(courseIds || []),
        productIds: JSON.stringify(productIds || []),
      },
    };

    if (stripePriceId) {
      sessionData.line_items = [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ];
    } else {
      sessionData.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bundleName,
              description: `Bundle purchase - includes ${(courseIds?.length || 0) + (productIds?.length || 0)} items`,
              images: bundleImageUrl ? [bundleImageUrl] : undefined,
            },
            unit_amount: Math.round(bundlePrice * 100),
          },
          quantity: 1,
        },
      ];
    }

    if (creatorStripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("✅ Bundle checkout session created:", {
      sessionId: session.id,
      bundleName,
      amount: bundlePrice,
      platformFee: platformFeeAmount / 100,
      customer: customerName,
      itemCount: (courseIds?.length || 0) + (productIds?.length || 0),
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

    console.error("❌ Bundle checkout session creation failed:", error);

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
