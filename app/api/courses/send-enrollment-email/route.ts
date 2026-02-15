import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { sendCourseEnrollmentEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Require authentication to prevent abuse
    await requireAuth();

    // SECURITY: Rate limiting (standard - 30 requests/min, sends emails)
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const {
      customerEmail,
      customerName,
      courseTitle,
      courseSlug,
      amount,
      currency,
      creatorName,
      storeName,
    } = await request.json();

    // Validate required fields
    if (!customerEmail || !customerName || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields: customerEmail, customerName, courseTitle" },
        { status: 400 }
      );
    }

    // Send the enrollment confirmation email
    const result = await sendCourseEnrollmentEmail({
      customerEmail,
      customerName,
      courseTitle,
      courseSlug,
      amount: amount || 0,
      currency: currency || "USD",
      creatorName,
      storeName,
    });

    return NextResponse.json({
      success: true,
      message: "Enrollment confirmation email sent",
      messageId: result.messageId,
    });

  } catch (error) {
    console.error("Failed to send enrollment confirmation email:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send enrollment confirmation email",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
