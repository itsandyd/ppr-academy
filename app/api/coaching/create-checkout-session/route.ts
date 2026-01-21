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
      productId,
      productTitle,
      price,
      duration,
      scheduledDate,
      startTime,
      customerEmail,
      customerName,
      userId,
      coachStripeAccountId,
      storeSlug,
      notes,
    } = await request.json();

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!productId || !customerEmail || !scheduledDate || !startTime || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const priceInCents = Math.round(price * 100);
    const platformFeeAmount = Math.round(priceInCents * 0.1);

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productTitle || "Coaching Session",
              description: `${duration || 60} minute session on ${new Date(scheduledDate).toLocaleDateString()} at ${startTime}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/library/coaching?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${storeSlug}/coaching/${productId}`,
      customer_email: customerEmail,
      metadata: {
        productId,
        productType: "coaching",
        scheduledDate: scheduledDate.toString(),
        startTime,
        customerEmail,
        customerName: customerName || "",
        userId,
        notes: notes || "",
        amount: priceInCents.toString(),
        currency: "usd",
      },
    };

    if (coachStripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: coachStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("Coaching checkout session creation failed:", error);

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
