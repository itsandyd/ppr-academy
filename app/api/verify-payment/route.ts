import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { requireAuth } from "@/lib/auth-helpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    await requireAuth();
    
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check payment status
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        message: "Payment not completed",
      });
    }

    const metadata = session.metadata || {};
    const { productType, courseId, userId } = metadata;

    // Handle course purchases
    if (productType === "course" && courseId) {
      try {
        // Fetch course details from Convex
        const course = await fetchQuery(api.courses.getCourseById, {
          courseId: courseId as any,
        });

        if (!course) {
          return NextResponse.json({
            success: true,
            verified: true,
            paymentStatus: session.payment_status,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            message: "Payment verified but course not found",
          });
        }

        return NextResponse.json({
          success: true,
          verified: true,
          paymentStatus: session.payment_status,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          courseTitle: course.title,
          courseId: course._id,
          customerName: session.customer_details?.name || "Student",
          customerEmail: session.customer_details?.email,
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
        });
      } catch (convexError) {
        console.error("Failed to fetch course from Convex:", convexError);
        
        // Still return success since payment succeeded
        return NextResponse.json({
          success: true,
          verified: true,
          paymentStatus: session.payment_status,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          customerName: session.customer_details?.name || "Student",
          customerEmail: session.customer_details?.email,
          sessionId: session.id,
          message: "Payment verified, but couldn't fetch course details",
        });
      }
    }

    // Handle subscription purchases
    if (productType === "subscription" && metadata.planId) {
      return NextResponse.json({
        success: true,
        verified: true,
        paymentStatus: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        planId: metadata.planId,
        customerName: session.customer_details?.name || "Subscriber",
        customerEmail: session.customer_details?.email,
        sessionId: session.id,
        subscriptionId: session.subscription,
      });
    }

    // Handle credit package purchases
    if (productType === "credit_package") {
      return NextResponse.json({
        success: true,
        verified: true,
        paymentStatus: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        credits: metadata.credits,
        bonusCredits: metadata.bonusCredits,
        customerName: session.customer_details?.name || "User",
        customerEmail: session.customer_details?.email,
        sessionId: session.id,
      });
    }

    // Generic success response for other product types
    return NextResponse.json({
      success: true,
      verified: true,
      paymentStatus: session.payment_status,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      customerName: session.customer_details?.name || "Customer",
      customerEmail: session.customer_details?.email,
      sessionId: session.id,
    });

  } catch (error) {
    console.error("❌ Payment verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

