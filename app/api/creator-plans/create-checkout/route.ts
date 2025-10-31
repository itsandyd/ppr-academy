import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (!["creator", "creator_pro"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (!["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "Invalid billing period" },
        { status: 400 }
      );
    }

    // Get user's email from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
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

    // Define pricing (in cents)
    const pricing = {
      creator: {
        monthly: 2900, // $29/month
        yearly: 29000, // $290/year
      },
      creator_pro: {
        monthly: 9900, // $99/month
        yearly: 95000, // $950/year
      },
    };

    const planNames = {
      creator: "Creator Plan",
      creator_pro: "Creator Pro Plan",
    };

    const amount = pricing[plan as "creator" | "creator_pro"][billingPeriod as "monthly" | "yearly"];
    const planName = planNames[plan as "creator" | "creator_pro"];

    // Create a Stripe Price dynamically
    const stripePrice = await stripe.prices.create({
      unit_amount: amount,
      currency: "usd",
      recurring: {
        interval: billingPeriod === "monthly" ? "month" : "year",
      },
      product_data: {
        name: `${planName} - ${billingPeriod === "monthly" ? "Monthly" : "Yearly"}`,
      },
    });

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePrice.id,
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
        trial_period_days: 14, // 14-day free trial
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeId}/plan?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeId}/plan?canceled=true`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error("Error creating creator plan checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

