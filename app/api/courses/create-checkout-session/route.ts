import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

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
      courseId, 
      courseSlug,
      customerEmail, 
      customerName, 
      coursePrice, 
      courseTitle,
      userId, // User ID for library access
      stripePriceId, // Use stored price ID
      creatorStripeAccountId 
    } = await request.json();
    
    // ✅ SECURITY: Verify user matches authenticated user
    if (userId && userId !== user.id) {
      return NextResponse.json(
        { error: "User mismatch" },
        { status: 403 }
      );
    }

    if (!courseId || !customerEmail || !customerName || coursePrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!stripePriceId) {
      return NextResponse.json({ error: "Course not synced to Stripe. Please contact support." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(coursePrice * 0.1 * 100); // Convert to cents

    // Create checkout session
    const sessionData: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId, // Use stored price ID
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${courseSlug}/checkout`,
      customer_email: customerEmail,
      metadata: {
        courseId,
        courseSlug,
        customerEmail,
        customerName,
        userId, // Include userId in metadata for webhook
        productType: "course",
        amount: (coursePrice * 100).toString(), // Amount in cents as string
        currency: "usd",
      },
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

    console.log("✅ Checkout session created:", {
      sessionId: session.id,
      courseTitle,
      amount: coursePrice,
      platformFee: platformFeeAmount / 100,
      customer: customerName,
    });

    return NextResponse.json({ 
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }
    
    console.error("❌ Checkout session creation failed:", error);
    
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
