import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { sendCourseEnrollmentEmail } from "@/lib/email";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    const user = await requireAuth();

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 });
    }

    // ✅ SECURITY: Validate paymentIntentId format to prevent injection
    if (typeof paymentIntentId !== "string" || !paymentIntentId.startsWith("pi_")) {
      return NextResponse.json({ error: "Invalid Payment Intent ID format" }, { status: 400 });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const metadata = paymentIntent.metadata;

      // ✅ SECURITY: Verify the authenticated user owns this payment
      if (metadata.userId && metadata.userId !== user.id) {
        console.warn("Payment success verification attempted by non-owner:", {
          paymentIntentId,
          paymentUserId: metadata.userId,
          requestingUserId: user.id,
        });
        return NextResponse.json(
          { error: "Unauthorized: You can only verify your own payments" },
          { status: 403 }
        );
      }
      
      // Create course enrollment in Convex
      if (metadata.userId && metadata.courseId) {
        const { fetchAction } = await import("convex/nextjs");
        const { api } = await import("@/convex/_generated/api");

        try {
          const purchaseId = await fetchAction(api.serverActions.serverCreateCourseEnrollment, {
            userId: metadata.userId,
            courseId: metadata.courseId as any,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            paymentMethod: "stripe",
            transactionId: paymentIntent.id,
          });


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
