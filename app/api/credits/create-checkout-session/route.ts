import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Check for Stripe key at module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY environment variable is not set!");
}

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check Stripe is initialized
    if (!stripe) {
      console.error("Stripe not initialized - missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Require authentication
    const user = await requireAuth();

    // ✅ SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { packageId, packageName, credits, bonusCredits, priceUsd, customerEmail, userId } =
      await request.json();

    // ✅ SECURITY: Verify user matches
    if (userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!packageId || !customerEmail || !userId || priceUsd === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe product/price on the fly for credit packages
    // (Credit packages are hardcoded, not stored in DB with Stripe IDs)
    console.log(`Creating checkout session for ${packageName}`);

    const priceInCents = Math.round(priceUsd * 100);

    // Create Stripe product on the fly
    const product = await stripe.products.create({
      name: `PPR Academy - ${packageName}`,
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
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits/purchase`,
      customer_email: customerEmail,
      metadata: {
        productType: "credit_package",
        packageId,
        packageName,
        credits: credits.toString(),
        bonusCredits: bonusCredits?.toString() || "0",
        userId,
        customerEmail,
        customerName: "", // Name will be extracted from session.customer_details if available
        priceUsd: priceUsd.toString(),
      },
    });

    console.log("✅ Credit checkout session created (on-the-fly):", {
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
      sessionId: session.id,
    });
  } catch (error) {
    console.error("❌ Credit checkout session creation failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log full error for debugging
    console.error("Full error details:", { message: errorMessage, stack: errorStack });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage, // Return the actual error message
        details: errorStack,
      },
      { status: 500 }
    );
  }
}
