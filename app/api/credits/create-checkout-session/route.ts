import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    const user = await requireAuth();
    
    const { 
      packageId,
      packageName,
      credits,
      bonusCredits,
      priceUsd,
      customerEmail,
      userId,
    } = await request.json();

    // ✅ SECURITY: Verify user matches
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "User mismatch" },
        { status: 403 }
      );
    }

    if (!packageId || !customerEmail || !userId || priceUsd === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a one-time price for this credit package
    const priceInCents = Math.round(priceUsd * 100);

    // Create Stripe product on the fly
    const product = await stripe.products.create({
      name: packageName,
      description: `${credits}${bonusCredits ? ` + ${bonusCredits} bonus` : ""} credits for PPR Academy`,
      metadata: {
        type: "credit_package",
        packageId,
        credits: credits.toString(),
        bonusCredits: bonusCredits?.toString() || "0",
      },
    });

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceInCents,
      currency: "usd",
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/store/{CHECKOUT_SESSION_ID}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store/{CHECKOUT_SESSION_ID}/credits/buy`,
      customer_email: customerEmail,
      metadata: {
        productType: "credit_package",
        packageId,
        packageName,
        credits: credits.toString(),
        bonusCredits: bonusCredits?.toString() || "0",
        userId,
        priceUsd: priceUsd.toString(),
      },
    });

    console.log("✅ Credit checkout session created:", {
      sessionId: session.id,
      packageName,
      credits,
      bonusCredits,
      amount: priceUsd,
      customer: customerEmail,
    });

    return NextResponse.json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error("❌ Credit checkout session creation failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

