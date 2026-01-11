import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Rate limiting (strict - 5 requests/min)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const {
      playlistId,
      playlistName,
      trackId,
      trackTitle,
      creatorId,
      creatorStripeAccountId,
      submissionFee,
      message,
      customerEmail,
    } = await request.json();

    if (!playlistId || !trackId || !creatorId || !submissionFee || submissionFee <= 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid submission fee" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(submissionFee * 0.1 * 100); // Convert to cents

    // Create checkout session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/playlists/${playlistId}?submission=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/playlists/${playlistId}?submission=cancelled`,
      customer_email: customerEmail,
      metadata: {
        productType: "playlist_submission",
        playlistId,
        playlistName: playlistName || "",
        trackId,
        trackTitle: trackTitle || "",
        creatorId,
        submitterId: user.id,
        message: message || "",
        amount: (submissionFee * 100).toString(),
        currency: "usd",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Playlist Submission: ${playlistName || "Playlist"}`,
              description: `Submit "${trackTitle || "Track"}" for consideration`,
            },
            unit_amount: Math.round(submissionFee * 100),
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

    console.log("✅ Playlist submission checkout session created:", {
      sessionId: session.id,
      playlistName,
      trackTitle,
      amount: submissionFee,
      platformFee: platformFeeAmount / 100,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("❌ Playlist submission checkout session creation failed:", error);

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
