import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Stripe (using SDK default API version)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    const user = await requireAuth();

    // ✅ SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { packageId, packageName, credits, bonusCredits, priceUsd, customerEmail, userId, stripePriceId } =
      await request.json();

    // ✅ SECURITY: Verify user matches
    if (userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!packageId || !customerEmail || !userId || priceUsd === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Check if package has a valid stored Stripe price ID
    let priceId = stripePriceId;

    // Validate the price ID looks real (not a placeholder like "price_starter")
    const isValidPriceId = priceId && priceId.startsWith("price_") && priceId.length > 20;

    if (!isValidPriceId) {
      // Try to get from Convex action
      try {
        const storedPriceId = await convex.action(api.creditPackageStripe.getPackageStripePriceId, {
          packageId,
        });
        if (storedPriceId) {
          priceId = storedPriceId;
        }
      } catch (error) {
        console.log("Could not fetch stored price ID, will create on-the-fly");
      }
    }

    // If we have a valid stored price ID, use it directly
    if (priceId && priceId.startsWith("price_") && priceId.length > 20) {
      console.log(`✅ Using stored Stripe price ID: ${priceId}`);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
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
          priceUsd: priceUsd.toString(),
        },
      });

      console.log("✅ Credit checkout session created with stored price:", {
        sessionId: session.id,
        packageName,
        priceId,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    // Fallback: Create Stripe product/price on the fly
    console.log(`⚠️ No valid stored price ID, creating on-the-fly for ${packageName}`);

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

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
