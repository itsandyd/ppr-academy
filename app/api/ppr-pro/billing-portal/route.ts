import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    const { stripeCustomerId } = body;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer ID found for your PPR Pro subscription." },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating PPR Pro billing portal session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
