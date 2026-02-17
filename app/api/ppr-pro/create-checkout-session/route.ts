import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import * as Sentry from "@sentry/nextjs";

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
      await fetchAction(api.serverActions.serverSeedPlans, {});
      dbPlan = await fetchQuery(api.pprPro.getPlanByInterval, { interval });
    }

    if (!dbPlan) {
      return NextResponse.json(
        { error: "PPR Pro plan not found. Please contact support." },
        { status: 500 }
      );
    }

    // Get or create Stripe price, and detect price changes
    let stripePriceId = dbPlan.stripePriceId;
    let stripeProductId = dbPlan.stripeProductId;
    let needsNewPrice = !stripePriceId;

    // If we have a cached Stripe price, verify it still matches the database price
    if (stripePriceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(stripePriceId);
        if (existingPrice.unit_amount !== dbPlan.price) {
          // Price changed in the database — Stripe prices are immutable, so create a new one
          needsNewPrice = true;
          // Deactivate the old price
          await stripe.prices.update(stripePriceId, { active: false });
        }
      } catch {
        // Price doesn't exist in Stripe anymore — recreate
        needsNewPrice = true;
      }
    }

    if (needsNewPrice) {
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

      // Create new Stripe price with current database amount
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
        await fetchAction(api.serverActions.serverUpdatePlanStripeIds, {
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
    Sentry.captureException(error, {
      tags: { component: "checkout-session", productType: "ppr_pro" },
    });

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
