import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    const interval: "month" | "year" = plan === "yearly" ? "year" : "month";

    // Fetch plan config from database
    let dbPlan = await fetchQuery(api.pprPro.getPlanByInterval, { interval });

    // Auto-seed plans if they don't exist yet
    if (!dbPlan) {
      await fetchMutation(api.pprPro.seedPlans, {});
      dbPlan = await fetchQuery(api.pprPro.getPlanByInterval, { interval });
    }

    if (!dbPlan) {
      return NextResponse.json(
        { error: "PPR Pro plan not found. Please contact support." },
        { status: 500 }
      );
    }

    // Get or create Stripe price (same pattern as membership/course checkout)
    let stripePriceId = dbPlan.stripePriceId;

    if (!stripePriceId) {
      let stripeProductId = dbPlan.stripeProductId;

      // Create Stripe product if needed
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: "PPR Pro",
          description: "Unlimited access to all courses on PPR Academy",
          metadata: {
            productType: "ppr_pro",
          },
        });
        stripeProductId = product.id;
      }

      // Create Stripe price
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: dbPlan.price,
        currency: "usd",
        recurring: {
          interval,
        },
        metadata: {
          productType: "ppr_pro",
          interval,
        },
      });

      stripePriceId = stripePrice.id;

      // Persist Stripe IDs back to the database for future checkouts
      try {
        await fetchMutation(api.pprPro.updatePlanStripeIds, {
          interval,
          stripeProductId,
          stripePriceId: stripePrice.id,
        });
      } catch (e) {
        console.warn("Failed to persist PPR Pro Stripe IDs:", e);
      }
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
