import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { sendCourseEnrollmentEmail } from "@/lib/email";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    await requireAuth();
    
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

      // Create course enrollment in Convex
      if (metadata.userId && metadata.courseId) {
        const { fetchMutation } = await import("convex/nextjs");
        const { api } = await import("@/convex/_generated/api");

        try {
          const purchaseId = await fetchMutation(api.library.createCourseEnrollment, {
            userId: metadata.userId,
            courseId: metadata.courseId as any,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            paymentMethod: "stripe",
            transactionId: paymentIntent.id,
          });

          console.log("✅ Course enrollment created:", { purchaseId });
        } catch (enrollmentError) {
          console.error("❌ Failed to create enrollment:", enrollmentError);
          // Continue anyway - don't fail the payment confirmation
        }
      }

      // Send confirmation email
      if (metadata.customerEmail) {
        try {
          await sendCourseEnrollmentEmail({
            customerEmail: metadata.customerEmail,
            customerName: metadata.customerName || "Student",
            courseTitle: metadata.courseTitle || "Course",
            courseSlug: metadata.courseSlug,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          });
          console.log("✅ Enrollment confirmation email sent");
        } catch (emailError) {
          console.error("⚠️ Failed to send confirmation email:", emailError);
          // Don't fail the response for email errors
        }
      }

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
