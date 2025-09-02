import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, businessType = "individual" } = await request.json();

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

    console.log("✅ Stripe Connect account created:", account.id);

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
