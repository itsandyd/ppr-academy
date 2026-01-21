import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    const user = await requireAuth();

    // ✅ SECURITY: Rate limiting (strict - 5 requests/min)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const {
      productId,
      productSlug,
      customerEmail,
      customerName,
      productPrice,
      productTitle,
      productImageUrl,
      userId, // User ID for library access
      stripePriceId, // Use stored price ID if available
      creatorStripeAccountId,
      storeId,
    } = await request.json();

    // ✅ SECURITY: Verify user matches authenticated user
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!productId || !customerEmail || !customerName || productPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // For digital products without a stored Stripe price, create a one-time price
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(productPrice * 0.1 * 100); // Convert to cents

    // Create checkout session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productSlug
        ? `${baseUrl}/marketplace/products/${productSlug}`
        : `${baseUrl}/marketplace`,
      customer_email: customerEmail,
      metadata: {
        productId,
        productSlug: productSlug || "",
        customerEmail,
        customerName,
        userId, // Include userId in metadata for webhook
        storeId: storeId || "",
        productType: "digitalProduct", // Key identifier for webhook handler
        amount: (productPrice * 100).toString(), // Amount in cents as string
        currency: "usd",
      },
    };

    // Use stored price ID if available, otherwise create line item with price_data
    if (stripePriceId) {
      sessionData.line_items = [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ];
    } else {
      // Create a one-time price inline for products without Stripe sync
      sessionData.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productTitle,
              description: `Digital product purchase`,
              images: productImageUrl ? [productImageUrl] : undefined,
            },
            unit_amount: Math.round(productPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];
    }

    // If creator has Stripe Connect account, use Connect payments
    if (creatorStripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("✅ Product checkout session created:", {
      sessionId: session.id,
      productTitle,
      amount: productPrice,
      platformFee: platformFeeAmount / 100,
      customer: customerName,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("❌ Product checkout session creation failed:", error);

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
