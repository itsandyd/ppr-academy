import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// PPR Pro pricing - hardcoded since these are platform-level
const PPR_PRO_PRICES = {
  monthly: process.env.PPR_PRO_MONTHLY_PRICE_ID!,
  yearly: process.env.PPR_PRO_YEARLY_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { plan, userId } = await request.json();

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan. Must be 'monthly' or 'yearly'" }, { status: 400 });
    }

    const stripePriceId = PPR_PRO_PRICES[plan as "monthly" | "yearly"];
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "PPR Pro price not configured. Contact support." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const customerEmail = user.emailAddresses[0]?.emailAddress;
    const customerName = user.fullName || user.firstName || "Member";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?mode=learn&upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: customerEmail,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          productType: "ppr_pro",
        },
      },
      metadata: {
        userId: user.id,
        plan,
        productType: "ppr_pro",
        customerEmail: customerEmail || "",
        customerName,
      },
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

    console.error("PPR Pro checkout failed:", error);

    const isStripeError = error && typeof error === "object" && "type" in error;
    const errorMessage = isStripeError
      ? (error as any).message
      : error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
