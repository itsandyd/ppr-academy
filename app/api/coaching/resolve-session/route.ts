import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Resolve a Stripe checkout session ID to the payment intent ID,
 * so the client can look up the coaching session in Convex.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const stripeSessionId = request.nextUrl.searchParams.get("stripe_session");
    if (!stripeSessionId) {
      return NextResponse.json({ error: "Missing stripe_session" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = checkoutSession.payment_intent as string | null;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "No payment intent found" }, { status: 404 });
    }

    return NextResponse.json({ paymentIntentId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to resolve session:", error);
    return NextResponse.json({ error: "Failed to resolve session" }, { status: 500 });
  }
}
