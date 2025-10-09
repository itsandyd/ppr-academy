import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    await requireAuth();

    const { accountId, storeId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    
    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/store/${storeId}/settings/payouts?refresh=true`,
      return_url: `${baseUrl}/store/${storeId}/settings/payouts?success=true`,
      type: "account_onboarding",
    });

    console.log("✅ Stripe onboarding link created for account:", accountId);

    return NextResponse.json({ 
      success: true,
      onboardingUrl: accountLink.url,
      message: "Onboarding link created successfully"
    });

  } catch (error) {
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
