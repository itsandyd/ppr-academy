import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require authentication
    await requireAuth();

    const { courseId, courseTitle, courseDescription, coursePrice, courseImageUrl } = await request.json();

    if (!courseId || !courseTitle || coursePrice === undefined) {
      return NextResponse.json({ error: "Missing required course data" }, { status: 400 });
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name: courseTitle,
      description: courseDescription || `Complete access to ${courseTitle}`,
      images: courseImageUrl ? [courseImageUrl] : [],
      metadata: {
        courseId,
        productType: "course",
        platform: "pauseplayrepeat",
      },
    });

    // Create price for the course
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(coursePrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        courseId,
      },
    });

    console.log("✅ Stripe product created:", {
      productId: product.id,
      priceId: price.id,
      courseTitle,
      amount: coursePrice,
    });

    return NextResponse.json({ 
      success: true,
      stripeProductId: product.id,
      stripePriceId: price.id,
      message: "Course synced to Stripe successfully"
    });

  } catch (error) {
    console.error("❌ Stripe product sync failed:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to sync course to Stripe",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}