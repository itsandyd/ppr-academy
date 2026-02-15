import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Price IDs from Stripe Dashboard - set these in your .env file
// Create recurring prices in Stripe Dashboard for each plan/billing combo
const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "",
  },
  creator: {
    monthly: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID || "",
  },
  creator_pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "",
  },
};

// Fallback pricing for dynamic price creation (in cents)
const PRICING: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 1200, yearly: 10800 },    // $12/mo, $108/yr ($9/mo)
  creator: { monthly: 2900, yearly: 28800 },    // $29/mo, $288/yr ($24/mo)
  creator_pro: { monthly: 7900, yearly: 70800 }, // $79/mo, $708/yr ($59/mo)
  business: { monthly: 14900, yearly: 142800 }, // $149/mo, $1428/yr ($119/mo)
};

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter Plan",
  creator: "Creator Plan",
  creator_pro: "Pro Plan",
  business: "Business Plan",
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Rate limiting (strict - 5 requests/min)
    const identifier = getRateLimitIdentifier(req, userId);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const body = await req.json();
    const { storeId, plan, billingPeriod } = body;

    // Validate input
    if (!storeId || !plan || !billingPeriod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["starter", "creator", "creator_pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
    }

    // Get user's email from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get or create Stripe customer
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
          clerkUserId: userId,
          storeId: storeId,
        },
      });
    }

    // Get price ID - use pre-configured or create dynamically as fallback
    let priceId = PRICE_IDS[plan]?.[billingPeriod as "monthly" | "yearly"];

    if (!priceId || !priceId.startsWith("price_")) {
      // Fallback: Create price dynamically (not ideal, but works)
      console.warn(`No price ID configured for ${plan} ${billingPeriod}, creating dynamically`);
      const amount = PRICING[plan][billingPeriod as "monthly" | "yearly"];
      const stripePrice = await stripe.prices.create({
        unit_amount: amount,
        currency: "usd",
        recurring: {
          interval: billingPeriod === "monthly" ? "month" : "year",
        },
        product_data: {
          name: `PPR Academy ${PLAN_NAMES[plan]} - ${billingPeriod === "monthly" ? "Monthly" : "Annual"}`,
        },
      });
      priceId = stripePrice.id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        storeId: storeId,
        plan: plan,
        billingPeriod: billingPeriod,
        productType: "creator_plan",
      },
      subscription_data: {
        metadata: {
          userId: userId,
          storeId: storeId,
          plan: plan,
        },
        trial_period_days: 14,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating creator plan checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

