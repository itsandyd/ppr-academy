import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Coaching Session Cancellation Policies:
 *
 * BY STUDENT:
 * - 24+ hours before: full refund
 * - <24 hours before: partial refund (configurable per product, default 50% to coach)
 *
 * BY COACH:
 * - Any time: full refund to student + coach gets flagged
 * - Repeated cancellations contribute to no-show count
 *
 * RESCHEDULE:
 * - Always free if 24+ hours before session
 * - Treated as cancellation + new booking if <24 hours
 */

const DEFAULT_LATE_CANCELLATION_FEE_PERCENT = 50; // 50% kept by coach for late cancellations

export const cancelSession = mutation({
  args: {
    sessionId: v.id("coachingSessions"),
    userId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    refundType: v.optional(v.string()), // "full" | "partial" | "none"
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { success: false, error: "Session not found" };

    // Can only cancel SCHEDULED or CONFIRMED sessions
    if (session.status !== "SCHEDULED" && session.status !== "CONFIRMED") {
      return { success: false, error: `Cannot cancel session with status "${session.status}"` };
    }

    const isCoach = args.userId === session.coachId;
    const isStudent = args.userId === session.studentId;

    if (!isCoach && !isStudent) {
      return { success: false, error: "You are not a participant of this session" };
    }

    const now = Date.now();
    const hoursUntilSession = (session.scheduledDate - now) / (60 * 60 * 1000);

    // Get product for late cancellation fee config
    const product = await ctx.db.get(session.productId);
    const lateCancellationFeePercent =
      (product as any)?.lateCancellationFeePercent ?? DEFAULT_LATE_CANCELLATION_FEE_PERCENT;

    // Update session status
    await ctx.db.patch(args.sessionId, {
      status: "CANCELLED",
      cancelledBy: isCoach ? "coach" : "student",
      cancelledAt: now,
      cancellationReason: args.reason,
    });

    // Delete Google Calendar event if one was created
    if (session.googleCalendarEventId) {
      await ctx.scheduler.runAfter(0, internal.googleCalendarActions.deleteCalendarEvent, {
        coachId: session.coachId,
        eventId: session.googleCalendarEventId,
      });
    }

    if (isCoach) {
      // Coach cancels: always full refund to student
      if (session.paymentStatus === "held" && session.stripePaymentIntentId) {
        await ctx.scheduler.runAfter(0, internal.coachingPayments.refundStudentPayment, {
          sessionId: args.sessionId,
          reason: "coach_cancelled",
        });
      }
      return { success: true, refundType: "full" };
    }

    // Student cancels
    if (hoursUntilSession >= 24) {
      // 24+ hours: full refund
      if (session.paymentStatus === "held" && session.stripePaymentIntentId) {
        await ctx.scheduler.runAfter(0, internal.coachingPayments.refundStudentPayment, {
          sessionId: args.sessionId,
          reason: "student_cancelled_early",
        });
      }
      return { success: true, refundType: "full" };
    } else {
      // <24 hours: partial refund (coach gets their cut)
      if (session.paymentStatus === "held" && session.stripePaymentIntentId) {
        // Refund student the remaining percent, transfer the rest to coach
        const studentRefundPercent = 100 - lateCancellationFeePercent;
        await ctx.scheduler.runAfter(0, internal.coachingPayments.processPartialRefund, {
          sessionId: args.sessionId,
          refundPercent: studentRefundPercent,
          reason: "student_cancelled_late",
        });
      }
      return { success: true, refundType: "partial" };
    }
  },
});

/**
 * System-initiated cancellation (e.g., admin action or auto-cancellation).
 */
export const systemCancelSession = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    reason: v.string(),
    refundFull: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    await ctx.db.patch(args.sessionId, {
      status: "CANCELLED",
      cancelledBy: "system",
      cancelledAt: Date.now(),
      cancellationReason: args.reason,
    });

    // Delete Google Calendar event if one was created
    if (session.googleCalendarEventId) {
      await ctx.scheduler.runAfter(0, internal.googleCalendarActions.deleteCalendarEvent, {
        coachId: session.coachId,
        eventId: session.googleCalendarEventId,
      });
    }

    if (args.refundFull && session.paymentStatus === "held" && session.stripePaymentIntentId) {
      await ctx.scheduler.runAfter(0, internal.coachingPayments.refundStudentPayment, {
        sessionId: args.sessionId,
        reason: args.reason,
      });
    }

    return null;
  },
});
