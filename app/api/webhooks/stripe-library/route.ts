import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { sendCourseEnrollmentEmail } from "@/lib/email";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log("🎯 Stripe webhook received:", event.type);

    // Handle checkout session completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.log("⚠️ No metadata found in session");
        return NextResponse.json({ received: true });
      }

      console.log("💳 Processing payment for:", {
        sessionId: session.id,
        customerEmail: metadata.customerEmail,
        productType: metadata.productType,
        courseId: metadata.courseId,
        amount: session.amount_total,
      });

      // Create enrollment based on product type
      if (metadata.productType === "course" && metadata.courseId) {
        try {
          // Create course enrollment in Convex
          const enrollmentId = await convex.mutation(api.library.createCourseEnrollment, {
            userId: metadata.userId || metadata.customerEmail, // Use userId from metadata
            courseId: metadata.courseId as any,
            amount: (session.amount_total || 0) / 100, // Convert from cents
            currency: session.currency || "usd",
            paymentMethod: "stripe",
            transactionId: session.payment_intent as string,
          });

          console.log("✅ Course enrollment created:", enrollmentId);

          // Send confirmation email
          try {
            await sendCourseEnrollmentEmail({
              customerEmail: metadata.customerEmail,
              customerName: metadata.customerName || "Student",
              courseTitle: metadata.courseTitle || "Course",
              courseSlug: metadata.courseSlug,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
            });
            console.log("✅ Enrollment confirmation email sent");
          } catch (emailError) {
            console.error("⚠️ Failed to send confirmation email:", emailError);
            // Don't fail the webhook for email errors
          }

        } catch (error) {
          console.error("❌ Failed to create course enrollment:", error);
          // Don't fail the webhook - log for manual processing
        }
      }

      // Handle other product types (digital products, coaching, etc.)
      // This would be expanded based on the metadata.productType
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Stripe Library Webhook Endpoint",
    timestamp: new Date().toISOString(),
  });
}
