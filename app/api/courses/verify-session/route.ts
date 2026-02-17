import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: false, error: "Payment not completed" });
    }

    const metadata = session.metadata;
    if (!metadata || metadata.productType !== "course" || !metadata.courseId || !metadata.userId) {
      return NextResponse.json({ success: false, error: "Not a course purchase session" });
    }

    // Verify the authenticated user owns this session
    if (metadata.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if enrollment already exists
    const alreadyPurchased = await fetchQuery(api.library.hasUserPurchasedCourse, {
      userId: metadata.userId,
      courseId: metadata.courseId as Id<"courses">,
    });

    if (alreadyPurchased) {
      return NextResponse.json({ success: true, alreadyEnrolled: true });
    }

    // Enrollment doesn't exist — create it now (webhook must have missed it)
    const amount = session.amount_total || 0;
    const purchaseId = await fetchAction(api.serverActions.serverCreateCourseEnrollment, {
      userId: metadata.userId,
      courseId: metadata.courseId as Id<"courses">,
      amount,
      currency: (session.currency || "USD").toUpperCase(),
      paymentMethod: "stripe",
      transactionId: (session.payment_intent as string) || `session_${sessionId}`,
    });



    return NextResponse.json({ success: true, enrolled: true, purchaseId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("Session verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
