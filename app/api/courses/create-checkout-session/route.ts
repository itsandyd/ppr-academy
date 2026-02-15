import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import * as Sentry from "@sentry/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const {
      courseId,
      courseSlug,
      customerEmail,
      customerName,
      coursePrice,
      courseTitle,
      userId,
      stripePriceId: incomingStripePriceId,
      stripeProductId: incomingStripeProductId,
      storeId,
      creatorId,
      creatorStripeAccountId,
    } = await request.json();

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (!courseId || !customerEmail || !customerName || coursePrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!coursePrice || coursePrice <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let stripePriceId = incomingStripePriceId;
    let stripeProductId = incomingStripeProductId;
    const expectedAmountCents = Math.round(coursePrice * 100);
    let needsNewPrice = !stripePriceId;

    // If we have a cached Stripe price, verify it still matches the current price
    if (stripePriceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(stripePriceId);
        if (existingPrice.unit_amount !== expectedAmountCents) {
          // Price changed — Stripe prices are immutable, so create a new one
          needsNewPrice = true;
          await stripe.prices.update(stripePriceId, { active: false });
        }
      } catch {
        // Price doesn't exist in Stripe anymore — recreate
        needsNewPrice = true;
      }
    }

    if (needsNewPrice) {
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: courseTitle || "Course",
          metadata: {
            courseId,
            storeId: storeId || "",
            creatorId: creatorId || "",
          },
        });
        stripeProductId = product.id;
      }

      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: expectedAmountCents,
        currency: "usd",
        metadata: {
          courseId,
        },
      });

      stripePriceId = stripePrice.id;

      // Persist Stripe IDs back to the course for future checkouts
      try {
        await fetchMutation(api.courses.updateCourseStripeIdsPublic, {
          courseId: courseId as Id<"courses">,
          stripeProductId,
          stripePriceId: stripePrice.id,
        });
      } catch (e) {
        console.warn("Failed to persist Stripe IDs to course:", e);
      }
    }

    const platformFeeAmount = Math.round(coursePrice * 0.1 * 100);

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?mode=learn&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${courseSlug}/checkout`,
      customer_email: customerEmail,
      metadata: {
        courseId,
        courseSlug,
        courseTitle,
        customerEmail,
        customerName,
        userId,
        productType: "course",
        amount: (coursePrice * 100).toString(),
        currency: "usd",
      },
    };

    // Only use Connect if the account is valid and has charges enabled
    if (creatorStripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(creatorStripeAccountId);
        if (account.charges_enabled) {
          sessionData.payment_intent_data = {
            application_fee_amount: platformFeeAmount,
            transfer_data: {
              destination: creatorStripeAccountId,
            },
          };
        } else {
          console.warn(`Stripe Connect account ${creatorStripeAccountId} charges not enabled, skipping Connect`);
        }
      } catch (e) {
        console.warn(`Failed to retrieve Stripe Connect account, skipping Connect:`, e);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    console.error("Course checkout failed:", error);
    Sentry.captureException(error, {
      tags: { component: "checkout-session", productType: "course" },
    });

    const isStripeError = error && typeof error === "object" && "type" in error;
    const errorMessage = isStripeError
      ? (error as any).message
      : error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
