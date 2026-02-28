"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

/**
 * Release escrowed payment to the coach's Stripe Connect account.
 * Called after both parties confirm the session happened (or auto-confirmed after deadline).
 */
export const releasePaymentToCreator = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    transferId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.coachingSessionQueries.getSessionForPayment,
      { sessionId: args.sessionId }
    );

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (!session.stripePaymentIntentId) {
      return { success: false, error: "No payment intent ID on session" };
    }

    if (!session.coachStripeAccountId) {
      return { success: false, error: "No coach Stripe account ID on session" };
    }

    if (session.paymentStatus === "released") {
      return { success: false, error: "Payment already released" };
    }

    if (session.paymentStatus === "refunded") {
      return { success: false, error: "Payment was already refunded" };
    }

    try {
      const stripe = getStripe();

      // Get the payment intent to find the charge
      const paymentIntent = await stripe.paymentIntents.retrieve(session.stripePaymentIntentId);
      const chargeId = paymentIntent.latest_charge as string;

      if (!chargeId) {
        return { success: false, error: "No charge found on payment intent" };
      }

      // Calculate transfer amount: total minus 10% platform fee
      const totalAmount = paymentIntent.amount; // in cents
      const platformFee = Math.round(totalAmount * 0.1);
      const transferAmount = totalAmount - platformFee;

      // Create transfer to coach's Connected account
      const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: paymentIntent.currency,
        destination: session.coachStripeAccountId,
        source_transaction: chargeId,
        description: `Coaching session payout (session ${args.sessionId})`,
        metadata: {
          sessionId: args.sessionId,
          coachId: session.coachId,
          platformFee: platformFee.toString(),
        },
      });

      // Update session payment status
      await ctx.runMutation(
        internal.coachingSessionQueries.updatePaymentStatus,
        {
          sessionId: args.sessionId,
          paymentStatus: "released",
          stripeTransferId: transfer.id,
        }
      );

      console.log(`Payment released for session ${args.sessionId}: $${transferAmount / 100} to ${session.coachStripeAccountId}`);

      return { success: true, transferId: transfer.id };
    } catch (error: any) {
      console.error(`Failed to release payment for session ${args.sessionId}:`, error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Full refund to the student (e.g., coach no-show or cancellation >24h before).
 */
export const refundStudentPayment = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    refundId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.coachingSessionQueries.getSessionForPayment,
      { sessionId: args.sessionId }
    );

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (!session.stripePaymentIntentId) {
      return { success: false, error: "No payment intent ID on session" };
    }

    if (session.paymentStatus === "refunded") {
      return { success: false, error: "Payment already refunded" };
    }

    if (session.paymentStatus === "released") {
      return { success: false, error: "Payment already released to coach — cannot auto-refund" };
    }

    try {
      const stripe = getStripe();

      const refund = await stripe.refunds.create({
        payment_intent: session.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          sessionId: args.sessionId,
          internalReason: args.reason || "coaching_refund",
        },
      });

      await ctx.runMutation(
        internal.coachingSessionQueries.updatePaymentStatus,
        {
          sessionId: args.sessionId,
          paymentStatus: "refunded",
        }
      );

      console.log(`Full refund issued for session ${args.sessionId}: refund ${refund.id}`);

      return { success: true, refundId: refund.id };
    } catch (error: any) {
      console.error(`Failed to refund session ${args.sessionId}:`, error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Partial refund — e.g., late cancellation by buyer: 50% goes to coach, 50% refunded.
 */
export const processPartialRefund = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
    refundPercent: v.number(), // 0-100, the percentage to refund to the student
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    refundId: v.optional(v.string()),
    transferId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(
      internal.coachingSessionQueries.getSessionForPayment,
      { sessionId: args.sessionId }
    );

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (!session.stripePaymentIntentId) {
      return { success: false, error: "No payment intent ID on session" };
    }

    if (session.paymentStatus !== "held") {
      return { success: false, error: `Cannot partial refund — payment status is "${session.paymentStatus}"` };
    }

    try {
      const stripe = getStripe();

      const paymentIntent = await stripe.paymentIntents.retrieve(session.stripePaymentIntentId);
      const chargeId = paymentIntent.latest_charge as string;
      const totalAmount = paymentIntent.amount;

      // Calculate refund and transfer amounts
      const refundAmount = Math.round(totalAmount * (args.refundPercent / 100));
      const remainingAfterRefund = totalAmount - refundAmount;
      // Platform fee is 10% of the coach's portion
      const platformFee = Math.round(remainingAfterRefund * 0.1);
      const coachTransferAmount = remainingAfterRefund - platformFee;

      // Refund the student's portion
      let refundId: string | undefined;
      if (refundAmount > 0) {
        const refund = await stripe.refunds.create({
          payment_intent: session.stripePaymentIntentId,
          amount: refundAmount,
          reason: "requested_by_customer",
          metadata: {
            sessionId: args.sessionId,
            internalReason: args.reason || "late_cancellation_partial_refund",
            refundPercent: args.refundPercent.toString(),
          },
        });
        refundId = refund.id;
      }

      // Transfer coach's portion to their Connected account
      let transferId: string | undefined;
      if (coachTransferAmount > 0 && session.coachStripeAccountId && chargeId) {
        const transfer = await stripe.transfers.create({
          amount: coachTransferAmount,
          currency: paymentIntent.currency,
          destination: session.coachStripeAccountId,
          source_transaction: chargeId,
          description: `Partial coaching payout (late cancellation, session ${args.sessionId})`,
          metadata: {
            sessionId: args.sessionId,
            coachId: session.coachId,
            platformFee: platformFee.toString(),
            refundPercent: args.refundPercent.toString(),
          },
        });
        transferId = transfer.id;
      }

      await ctx.runMutation(
        internal.coachingSessionQueries.updatePaymentStatus,
        {
          sessionId: args.sessionId,
          paymentStatus: "partial_refund",
          stripeTransferId: transferId,
        }
      );

      console.log(`Partial refund for session ${args.sessionId}: ${args.refundPercent}% refunded, coach gets $${coachTransferAmount / 100}`);

      return { success: true, refundId, transferId };
    } catch (error: any) {
      console.error(`Failed to process partial refund for session ${args.sessionId}:`, error);
      return { success: false, error: error.message };
    }
  },
});
