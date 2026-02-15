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
    
    // ✅ SECURITY: Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { email, businessType = "individual", userId } = await request.json();
    
    // ✅ SECURITY: Verify user can only create account for themselves
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: businessType,
      metadata: {
        userId,
        platform: "pauseplayrepeat",
      },
    });



    return NextResponse.json({ 
      success: true,
      accountId: account.id,
      message: "Stripe Connect account created successfully"
    });

  } catch (error) {
    console.error("❌ Stripe Connect account creation failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create Stripe Connect account",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
