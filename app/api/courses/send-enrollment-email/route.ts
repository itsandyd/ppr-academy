import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sendCourseEnrollmentEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Require authentication to prevent abuse
    await requireAuth();

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

    console.log("Enrollment confirmation email sent:", {
      to: customerEmail,
      course: courseTitle,
      result,
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
