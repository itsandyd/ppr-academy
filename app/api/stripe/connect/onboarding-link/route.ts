import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  // Auth check — return 401, not 500
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(request, user.id);
  const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
  if (rateCheck instanceof NextResponse) {
    return rateCheck;
  }

  let body: { accountId?: string; storeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  try {
    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/settings/payouts?refresh=true`,
      return_url: `${baseUrl}/dashboard/settings/payouts?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      message: "Onboarding link created successfully"
    });

  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("❌ Stripe onboarding link error:", {
        type: error.type,
        code: error.code,
        message: error.message,
        accountId: accountId.slice(0, 12) + "…",
      });

      return NextResponse.json(
        {
          success: false,
          error: `Stripe error: ${error.message}`,
        },
        { status: error.statusCode || 500 }
      );
    }

    console.error("❌ Stripe onboarding link creation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create onboarding link",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
