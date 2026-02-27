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

  let body: { accountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 });
  }

  // Validate account ID format — Stripe Connect account IDs start with "acct_"
  if (!accountId.startsWith("acct_")) {
    console.error("❌ Invalid Stripe account ID format:", accountId.slice(0, 10) + "…");
    return NextResponse.json(
      { success: false, error: "Invalid Stripe account ID format" },
      { status: 400 }
    );
  }

  try {
    // Retrieve account information from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const isComplete = account.details_submitted &&
                      account.charges_enabled &&
                      account.payouts_enabled;

    const status = isComplete ? "enabled" :
                   account.details_submitted ? "restricted" : "pending";

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        status,
        isComplete,
        country: account.country,
        businessType: account.business_type,
      }
    });

  } catch (error) {
    // Distinguish Stripe API errors from other failures
    if (error instanceof Stripe.errors.StripeError) {
      console.error("❌ Stripe API error:", {
        type: error.type,
        code: error.code,
        message: error.message,
        accountId: accountId.slice(0, 12) + "…",
      });

      // Account not found or permission error
      if (error.code === "account_invalid" || error.type === "StripePermissionError") {
        return NextResponse.json(
          { success: false, error: "Stripe account not found or not accessible" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error("❌ Stripe account status check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check account status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
