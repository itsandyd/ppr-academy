import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: false, error: "Payment not completed" });
    }

    const metadata = session.metadata;
    if (!metadata || metadata.productType !== "membership" || !metadata.userId) {
      return NextResponse.json({ success: false, error: "Not a membership purchase session" });
    }

    if (metadata.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if subscription already exists
    const existingSubs = await fetchQuery(api.memberships.getUserMemberships, {
      userId: metadata.userId,
    });

    const alreadySubscribed = existingSubs?.some(
      (sub: any) => sub.tierId === metadata.tierId && sub.status === "active"
    );

    if (alreadySubscribed) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Create the membership subscription (webhook must have missed it)
    const subscriptionId = await fetchMutation(api.memberships.createMembershipSubscription, {
      userId: metadata.userId,
      tierId: metadata.tierId as Id<"creatorSubscriptionTiers">,
      billingCycle: (metadata.billingCycle as "monthly" | "yearly") || "monthly",
      stripeSubscriptionId: (session.subscription as string) || "",
    });

    return NextResponse.json({ success: true, subscribed: true, subscriptionId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("Membership session verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
