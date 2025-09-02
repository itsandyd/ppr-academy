import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { courseId, customerEmail, customerName, coursePrice, courseTitle, creatorStripeAccountId } = await request.json();

    if (!courseId || !customerEmail || !customerName || coursePrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(coursePrice * 0.1 * 100); // Convert to cents
    const courseAmount = Math.round(coursePrice * 100); // Convert to cents

    // Create Payment Intent
    const paymentIntentData: any = {
      amount: courseAmount,
      currency: "usd",
      metadata: {
        courseId,
        customerEmail,
        customerName,
        productType: "course",
      },
    };

    // If creator has Stripe Connect account, use Connect payments
    if (creatorStripeAccountId) {
      paymentIntentData.application_fee_amount = platformFeeAmount;
      paymentIntentData.transfer_data = {
        destination: creatorStripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log("✅ Payment Intent created:", {
      id: paymentIntent.id,
      amount: courseAmount / 100,
      platformFee: platformFeeAmount / 100,
      destination: creatorStripeAccountId || "platform",
    });

    return NextResponse.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });

  } catch (error) {
    console.error("❌ Course purchase failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
