import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
      tipJarId,
      amount,
      customerEmail,
      customerName,
      userId,
      storeId,
      creatorStripeAccountId,
      message,
    } = await request.json();

    // Verify user matches authenticated user
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!tipJarId || !amount || !customerEmail || !storeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate amount (minimum $1)
    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount < 1) {
      return NextResponse.json({ error: "Minimum tip amount is $1" }, { status: 400 });
    }

    // Get tip jar details from Convex
    const tipJar = await convex.query(api.digitalProducts.getProductById, {
      productId: tipJarId as Id<"digitalProducts">,
    });

    if (!tipJar) {
      return NextResponse.json({ error: "Tip jar not found" }, { status: 404 });
    }

    // Check if this is a tip jar by productCategory (not productType)
    if (tipJar.productCategory !== "tip-jar") {
      return NextResponse.json({ error: "Invalid product type - this is not a tip jar" }, { status: 400 });
    }

    // Get store for the success URL
    const store = await convex.query(api.stores.getStoreById, {
      storeId: storeId as Id<"stores">,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const storeSlug = store?.slug || "";

    // For tips, we don't charge a platform fee - 100% goes to creator
    // This is a differentiating feature noted in the UI: "100% goes to creator"
    const platformFeeAmount = 0;

    // Create checkout session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/${storeSlug}/tips/${tipJar.slug || tipJarId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${storeSlug}/tips/${tipJar.slug || tipJarId}`,
      customer_email: customerEmail,
      metadata: {
        productType: "tip", // Key identifier for webhook handler
        tipJarId,
        tipJarTitle: tipJar.title,
        customerEmail,
        customerName: customerName || "",
        userId: user.id,
        storeId,
        amount: Math.round(tipAmount * 100).toString(), // Amount in cents
        currency: "usd",
        message: message || "",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${tipJar.title}`,
              description: message ? `Message: ${message.substring(0, 100)}` : `Support this creator with a $${tipAmount} tip`,
              images: tipJar.imageUrl ? [tipJar.imageUrl] : undefined,
            },
            unit_amount: Math.round(tipAmount * 100),
          },
          quantity: 1,
        },
      ],
    };

    // If creator has Stripe Connect account, use Connect payments
    // Note: For tips, we could optionally set platformFeeAmount = 0 to give 100% to creator
    if (creatorStripeAccountId) {
      sessionData.payment_intent_data = {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("Tip checkout session created:", {
      sessionId: session.id,
      tipJarTitle: tipJar.title,
      amount: tipAmount,
      customer: customerName,
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

    console.error("Tip checkout session creation failed:", error);

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
