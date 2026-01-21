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
      beatId,
      tierType,
      customerEmail,
      customerName,
      userId,
      storeId,
      creatorStripeAccountId,
    } = await request.json();

    // Verify user matches authenticated user
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!beatId || !tierType || !customerEmail || !storeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate tier type
    const validTiers = ["basic", "premium", "exclusive", "unlimited"];
    if (!validTiers.includes(tierType)) {
      return NextResponse.json({ error: "Invalid tier type" }, { status: 400 });
    }

    // Get beat license tiers from Convex
    const tiersData = await convex.query(api.beatLeases.getBeatLicenseTiers, {
      beatId: beatId as Id<"digitalProducts">,
    });

    if (!tiersData || !tiersData.available) {
      return NextResponse.json(
        { error: tiersData?.reason || "Beat is not available for purchase" },
        { status: 400 }
      );
    }

    // Find the selected tier
    const selectedTier = tiersData.tiers.find((t: { type: string }) => t.type === tierType);
    if (!selectedTier) {
      return NextResponse.json(
        { error: `Tier ${tierType} is not available for this beat` },
        { status: 400 }
      );
    }

    // Check if user already owns this tier
    const existingLicense = await convex.query(api.beatLeases.checkUserBeatLicense, {
      userId: user.id,
      beatId: beatId as Id<"digitalProducts">,
      tierType: tierType as "basic" | "premium" | "exclusive" | "unlimited",
    });

    if (existingLicense.hasLicense) {
      return NextResponse.json(
        { error: `You already own a ${tierType} license for this beat` },
        { status: 400 }
      );
    }

    // Get beat details for the checkout session
    const beat = await convex.query(api.digitalProducts.getProductById, {
      productId: beatId as Id<"digitalProducts">,
    });

    if (!beat) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const platformFeeAmount = Math.round(selectedTier.price * 0.1 * 100); // 10% platform fee in cents

    // Create checkout session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}&type=beat`,
      cancel_url: `${baseUrl}/marketplace/beats/${beat.slug || beatId}`,
      customer_email: customerEmail,
      metadata: {
        productType: "beatLease", // Key identifier for webhook handler
        beatId,
        tierType,
        tierName: selectedTier.name,
        tierPrice: selectedTier.price.toString(),
        customerEmail,
        customerName: customerName || "",
        userId: user.id,
        storeId,
        amount: (selectedTier.price * 100).toString(), // Amount in cents
        currency: "usd",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${beat.title} - ${selectedTier.name} License`,
              description: getBeatLicenseDescription(selectedTier),
              images: beat.imageUrl ? [beat.imageUrl] : undefined,
            },
            unit_amount: Math.round(selectedTier.price * 100),
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

    console.log("Beat lease checkout session created:", {
      sessionId: session.id,
      beatTitle: beat.title,
      tierType,
      tierName: selectedTier.name,
      amount: selectedTier.price,
      platformFee: platformFeeAmount / 100,
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

    console.error("Beat lease checkout session creation failed:", error);

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

function getBeatLicenseDescription(tier: {
  type: string;
  name: string;
  distributionLimit?: number;
  streamingLimit?: number;
  commercialUse: boolean;
  stemsIncluded: boolean;
  includedFiles: string[];
}): string {
  const parts: string[] = [];

  // Files included
  const files = tier.includedFiles.map((f) => f.toUpperCase()).join(", ");
  parts.push(`Files: ${files}`);

  // Distribution limit
  if (tier.distributionLimit) {
    parts.push(`Up to ${tier.distributionLimit.toLocaleString()} distributions`);
  } else if (tier.type === "exclusive") {
    parts.push("Unlimited distributions");
  }

  // Commercial use
  if (tier.commercialUse) {
    parts.push("Commercial use allowed");
  }

  return parts.join(" | ");
}
