import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const metadata = paymentIntent.metadata;
      
      console.log("✅ Payment succeeded:", {
        paymentId: paymentIntent.id,
        courseId: metadata.courseId,
        customer: metadata.customerName,
        amount: paymentIntent.amount / 100,
      });

      // TODO: Create course enrollment in Convex
      // This would call a Convex mutation to:
      // 1. Create enrollment record
      // 2. Grant course access
      // 3. Send confirmation email
      
      return NextResponse.json({ 
        success: true, 
        message: "Payment successful",
        courseId: metadata.courseId,
        customerEmail: metadata.customerEmail,
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Payment not completed",
        status: paymentIntent.status 
      });
    }

  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
