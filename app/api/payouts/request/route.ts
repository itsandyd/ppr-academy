import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monetizationApi: any = api.monetizationUtils;

// Minimum payout amount in cents ($25)
const MINIMUM_PAYOUT_AMOUNT = 2500;

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const body = await request.json();
    const { storeId, stripeConnectAccountId } = body;

    if (!storeId || !stripeConnectAccountId) {
      return NextResponse.json(
        { error: "Store ID and Stripe Connect Account ID are required" },
        { status: 400 }
      );
    }

    // Verify the Stripe Connect account is enabled for payouts
    const account = await stripe.accounts.retrieve(stripeConnectAccountId);

    if (!account.payouts_enabled) {
      return NextResponse.json(
        { error: "Your Stripe account is not enabled for payouts. Please complete your account setup." },
        { status: 400 }
      );
    }

    // Get pending earnings from Convex
    const pendingEarnings = await convex.query(monetizationApi.getCreatorPendingEarnings, {
      creatorId: user.id,
    });

    if (!pendingEarnings || pendingEarnings.netEarnings < MINIMUM_PAYOUT_AMOUNT) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is $${(MINIMUM_PAYOUT_AMOUNT / 100).toFixed(2)}. Current balance: $${((pendingEarnings?.netEarnings || 0) / 100).toFixed(2)}`
        },
        { status: 400 }
      );
    }

    if (pendingEarnings.purchaseIds.length === 0) {
      return NextResponse.json(
        { error: "No pending earnings to pay out" },
        { status: 400 }
      );
    }

    // Create a payout record in Convex first (status: processing)
    const payoutRecord = await convex.mutation(monetizationApi.processPayoutRequest, {
      creatorId: user.id,
      storeId: storeId as Id<"stores">,
      amount: pendingEarnings.netEarnings,
      currency: "usd",
      stripeConnectAccountId,
      purchaseIds: pendingEarnings.purchaseIds as Id<"purchases">[],
      grossRevenue: pendingEarnings.grossRevenue,
      platformFee: pendingEarnings.platformFees,
      processingFee: pendingEarnings.processingFees,
    });

    if (!payoutRecord.success || !payoutRecord.payoutId) {
      return NextResponse.json(
        { error: "Failed to create payout record" },
        { status: 500 }
      );
    }

    try {
      // Create a Stripe Transfer to the connected account
      const transfer = await stripe.transfers.create({
        amount: pendingEarnings.netEarnings,
        currency: "usd",
        destination: stripeConnectAccountId,
        metadata: {
          payoutId: payoutRecord.payoutId,
          creatorId: user.id,
          storeId,
          totalSales: pendingEarnings.totalSales.toString(),
          grossRevenue: pendingEarnings.grossRevenue.toString(),
          platformFee: pendingEarnings.platformFees.toString(),
          processingFee: pendingEarnings.processingFees.toString(),
        },
      });

      // Mark payout as completed and mark purchases as paid out
      await convex.mutation(monetizationApi.completeCreatorPayout, {
        payoutId: payoutRecord.payoutId,
        stripeTransferId: transfer.id,
      });

      await convex.mutation(monetizationApi.markPurchasesAsPaidOut, {
        purchaseIds: pendingEarnings.purchaseIds as Id<"purchases">[],
        payoutId: payoutRecord.payoutId,
      });

      console.log(`✅ Payout processed successfully: ${transfer.id} for $${(pendingEarnings.netEarnings / 100).toFixed(2)}`);

      return NextResponse.json({
        success: true,
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          currency: transfer.currency,
        },
        payout: {
          id: payoutRecord.payoutId,
          amount: pendingEarnings.netEarnings,
          salesCount: pendingEarnings.totalSales,
        },
      });

    } catch (stripeError: any) {
      // If Stripe transfer fails, mark payout as failed
      await convex.mutation(monetizationApi.failCreatorPayout, {
        payoutId: payoutRecord.payoutId,
        reason: stripeError.message || "Stripe transfer failed",
      });

      console.error("❌ Stripe transfer failed:", stripeError);

      return NextResponse.json(
        {
          error: "Payment transfer failed",
          details: stripeError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Payout request failed:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Failed to process payout request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
