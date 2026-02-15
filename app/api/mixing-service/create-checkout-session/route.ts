import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const user = await requireAuth();

    // SECURITY: Rate limiting (strict - 5 requests/min)
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
      userId,
      storeId,
      creatorId,
      creatorStripeAccountId,
      // Service-specific fields
      serviceType,
      selectedTier,
      isRush,
      rushFee,
      customerNotes,
    } = await request.json();

    // SECURITY: Verify user matches authenticated user
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    // Validate required fields
    if (!productId || !customerEmail || !customerName || !selectedTier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!selectedTier.price || !selectedTier.id || !selectedTier.name) {
      return NextResponse.json({ error: "Invalid tier selection" }, { status: 400 });
    }

    // Calculate total price
    const basePrice = selectedTier.price;
    const additionalRushFee = isRush && rushFee ? rushFee : 0;
    const totalPrice = basePrice + additionalRushFee;

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(totalPrice * 0.1 * 100); // Convert to cents

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build the session data
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/dashboard/my-orders?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productSlug
        ? `${baseUrl}/marketplace/mixing-services/${productSlug}`
        : `${baseUrl}/marketplace/mixing-services`,
      customer_email: customerEmail,
      metadata: {
        productId,
        productSlug: productSlug || "",
        serviceTitle: `${selectedTier.name} Mixing Service`,
        customerEmail,
        customerName,
        userId,
        creatorId: creatorId || "",
        storeId: storeId || "",
        productType: "mixingService", // Key identifier for webhook handler
        serviceType: serviceType || "mixing",
        selectedTier: JSON.stringify(selectedTier),
        isRush: isRush ? "true" : "false",
        rushFee: additionalRushFee.toString(),
        basePrice: basePrice.toString(),
        totalPrice: totalPrice.toString(),
        amount: (totalPrice * 100).toString(), // Amount in cents as string
        currency: "usd",
        customerNotes: customerNotes || "",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedTier.name}${isRush ? " (Rush)" : ""}`,
              description: `Mixing Service - ${selectedTier.stemCount}${isRush ? " | Rush Delivery" : ""}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
    };

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

    console.error("Mixing service checkout session creation failed:", error);

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
