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
    
    // ✅ SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    // Retrieve account information from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const isComplete = account.details_submitted && 
                      account.charges_enabled && 
                      account.payouts_enabled;

    const status = isComplete ? "enabled" : 
                   account.details_submitted ? "restricted" : "pending";

    console.log("✅ Stripe account status retrieved:", accountId, status);

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
