import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
    const price = billingCycle === "yearly" ? (priceYearly || priceMonthly * 10) : priceMonthly;
    const platformFeePercent = 10;

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    let stripePriceId = billingCycle === "yearly" ? stripePriceIdYearly : stripePriceIdMonthly;
    const expectedAmountCents = Math.round(price * 100);
    let needsNewPrice = !stripePriceId;

    // If we have a cached Stripe price, verify it still matches the current price
    if (stripePriceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(stripePriceId);
        if (existingPrice.unit_amount !== expectedAmountCents) {
          // Price changed — Stripe prices are immutable, so create a new one
          needsNewPrice = true;
          await stripe.prices.update(stripePriceId, { active: false });
        }
      } catch {
        // Price doesn't exist in Stripe anymore — recreate
        needsNewPrice = true;
      }
    }

    if (needsNewPrice) {
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
        unit_amount: expectedAmountCents,
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

      // Persist the Stripe price ID back to the tier so future checkouts reuse it
      try {
        const updateArgs: {
          tierId: Id<"creatorSubscriptionTiers">;
          stripePriceIdMonthly?: string;
          stripePriceIdYearly?: string;
        } = {
          tierId: tierId as Id<"creatorSubscriptionTiers">,
        };
        if (billingCycle === "yearly") {
          updateArgs.stripePriceIdYearly = stripePrice.id;
        } else {
          updateArgs.stripePriceIdMonthly = stripePrice.id;
        }
        await fetchMutation(api.memberships.updateStripePriceIds, updateArgs);
      } catch (e) {
        console.warn("Failed to persist Stripe price ID to tier:", e);
      }
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
        membershipName: tierName,
        customerEmail,
        customerName,
      },
    };

    if (trialDays && trialDays > 0) {
      sessionData.subscription_data!.trial_period_days = trialDays;
    }

    // Only use Connect if the account is valid and has charges enabled
    if (creatorStripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(creatorStripeAccountId);
        if (account.charges_enabled) {
          sessionData.subscription_data!.application_fee_percent = platformFeePercent;
          sessionData.subscription_data!.transfer_data = {
            destination: creatorStripeAccountId,
          };
        } else {
          console.warn(`Stripe Connect account ${creatorStripeAccountId} charges not enabled, skipping Connect`);
        }
      } catch (e) {
        console.warn(`Failed to retrieve Stripe Connect account, skipping Connect:`, e);
      }
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

    console.error("Membership checkout failed:", error);

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
