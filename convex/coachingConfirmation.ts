"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Session Confirmation Flow
 *
 * After a coaching session's scheduled end time:
 * 1. System sends confirmation request to both coach and student
 * 2. Both parties have 48 hours to confirm
 * 3. Based on responses, payment is released or refunded
 *
 * Confirmation matrix:
 * | Coach    | Student     | Result                            |
 * |----------|-------------|-----------------------------------|
 * | Yes      | Yes         | COMPLETED → release payment       |
 * | Yes      | No response | COMPLETED → release payment (48h) |
 * | No resp  | No response | COMPLETED → release payment (72h) |
 * | N/A      | No (no-show)| NO_SHOW_CREATOR → refund student  |
 * | No (ns)  | N/A         | NO_SHOW_BUYER → release to coach  |
 */

const CONFIRMATION_DEADLINE_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Cron handler: Process coaching session confirmations.
 * Runs every 15 minutes.
 *
 * 1. Find sessions that just ended → send confirmation requests
 * 2. Find sessions past deadline → auto-resolve
 */
export const processConfirmations = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      // Step 1: Send confirmation requests for sessions that just ended
      const sessionsNeedingConfirmation = await ctx.runQuery(
        internal.coachingSessionQueries.getSessionsNeedingConfirmation
      );

      for (const session of sessionsNeedingConfirmation) {
        try {
          const now = Date.now();

          // Update session: mark confirmation as requested, set deadline, change status to CONFIRMED
          await ctx.runMutation(
            internal.coachingSessionQueries.updateSessionConfirmation,
            {
              sessionId: session._id,
              status: "CONFIRMED",
              confirmationRequestedAt: now,
              confirmationDeadline: now + CONFIRMATION_DEADLINE_MS,
            }
          );

          // Send confirmation request emails to both parties
          await ctx.runAction(
            internal.coachingConfirmation.sendConfirmationRequests,
            {
              sessionId: session._id,
              coachId: session.coachId,
              studentId: session.studentId,
              productId: session.productId,
              sessionDate: new Date(session.scheduledDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              sessionTime: session.startTime,
              duration: session.duration,
            }
          );

          console.log(`Confirmation request sent for session ${session._id}`);
        } catch (error) {
          console.error(`Failed to send confirmation for session ${session._id}:`, error);
        }
      }

      // Step 2: Auto-resolve sessions past their confirmation deadline
      const sessionsPastDeadline = await ctx.runQuery(
        internal.coachingSessionQueries.getSessionsPastDeadline
      );

      for (const session of sessionsPastDeadline) {
        try {
          await autoResolveSession(ctx, session);
        } catch (error) {
          console.error(`Failed to auto-resolve session ${session._id}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error("Session confirmation processing error:", error);
      return null;
    }
  },
});

/**
 * Auto-resolve a session that has passed its confirmation deadline.
 * Uses the confirmation matrix rules.
 */
async function autoResolveSession(ctx: any, session: any) {
  const coachConfirmed = session.coachConfirmed;
  const studentConfirmed = session.studentConfirmed;

  // If student reported no-show (studentConfirmed === false explicitly)
  if (studentConfirmed === false) {
    // Coach no-show → refund student
    await ctx.runMutation(
      internal.coachingSessionQueries.updateSessionConfirmation,
      { sessionId: session._id, status: "NO_SHOW_CREATOR" }
    );
    await ctx.runAction(internal.coachingPayments.refundStudentPayment, {
      sessionId: session._id,
      reason: "coach_no_show",
    });
    // Track no-show on coach + send warning/paused email
    await ctx.runAction(internal.coachingConfirmation.incrementCoachNoShow, {
      coachId: session.coachId,
      sessionId: session._id,
    });
    console.log(`Session ${session._id}: Coach no-show — student refunded`);
    return;
  }

  // If coach reported buyer no-show (coachConfirmed === false explicitly)
  if (coachConfirmed === false) {
    // Buyer no-show → release payment to coach
    await ctx.runMutation(
      internal.coachingSessionQueries.updateSessionConfirmation,
      { sessionId: session._id, status: "NO_SHOW_BUYER" }
    );
    await ctx.runAction(internal.coachingPayments.releasePaymentToCreator, {
      sessionId: session._id,
    });
    // Track no-show on student
    await ctx.runAction(internal.coachingConfirmation.incrementStudentNoShow, {
      studentId: session.studentId,
    });
    console.log(`Session ${session._id}: Buyer no-show — coach paid`);
    return;
  }

  // Default: both confirmed, or one/both didn't respond → assume session happened
  // (Coach confirmed + student no response, or both no response after 48h)
  await ctx.runMutation(
    internal.coachingSessionQueries.updateSessionConfirmation,
    { sessionId: session._id, status: "COMPLETED" }
  );
  await ctx.runAction(internal.coachingPayments.releasePaymentToCreator, {
    sessionId: session._id,
  });
  console.log(`Session ${session._id}: Auto-resolved as COMPLETED — payment released`);
}

/**
 * Send confirmation request emails to both coach and student.
 */
export const sendConfirmationRequests = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
    coachId: v.string(),
    studentId: v.string(),
    productId: v.id("digitalProducts"),
    sessionDate: v.string(),
    sessionTime: v.string(),
    duration: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Look up user emails
    const coach = await ctx.runQuery(internal.coachingSessionQueries.getUserByClerkId, { clerkId: args.coachId });
    const student = await ctx.runQuery(internal.coachingSessionQueries.getUserByClerkId, { clerkId: args.studentId });
    const product = await ctx.runQuery(internal.coachingSessionQueries.getProduct, { productId: args.productId });

    if (!coach?.email || !student?.email) {
      console.error("Missing email for coach or student");
      return null;
    }

    const sessionTitle = product?.title || "Coaching Session";
    const coachName = coach.name || coach.firstName || "Coach";
    const studentName = student.name || student.firstName || "Student";

    // Send to coach
    await ctx.runAction(internal.coachingEmails.sendSessionConfirmationRequestEmail, {
      recipientName: coachName,
      recipientEmail: coach.email,
      otherPartyName: studentName,
      sessionTitle,
      sessionDate: args.sessionDate,
      sessionTime: args.sessionTime,
      duration: args.duration,
      isCoach: true,
      sessionId: args.sessionId,
    });

    // Send to student
    await ctx.runAction(internal.coachingEmails.sendSessionConfirmationRequestEmail, {
      recipientName: studentName,
      recipientEmail: student.email,
      otherPartyName: coachName,
      sessionTitle,
      sessionDate: args.sessionDate,
      sessionTime: args.sessionTime,
      duration: args.duration,
      isCoach: false,
      sessionId: args.sessionId,
    });

    return null;
  },
});

/**
 * Increment coach no-show count and send appropriate warning/paused email.
 * Called when a student reports coach no-show.
 */
export const incrementCoachNoShow = internalAction({
  args: {
    coachId: v.string(),
    sessionId: v.optional(v.id("coachingSessions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const newCount = await ctx.runMutation(internal.coachingSessionQueries.incrementCoachNoShowMutation, {
      coachId: args.coachId,
    });

    // Look up coach info for emails
    const coach = await ctx.runQuery(internal.coachingSessionQueries.getUserByClerkId, {
      clerkId: args.coachId,
    });
    if (!coach?.email) return null;

    const coachName = coach.name || coach.firstName || "Coach";

    if (newCount === 1) {
      // First no-show: send warning email
      let sessionTitle = "Coaching Session";
      let studentName = "Student";
      let sessionDate = "N/A";

      if (args.sessionId) {
        const session = await ctx.runQuery(internal.coachingSessionQueries.getSessionForEmail, {
          sessionId: args.sessionId,
        });
        if (session) {
          sessionTitle = session.productTitle || sessionTitle;
          studentName = session.studentName || studentName;
          sessionDate = new Date(session.scheduledDate).toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          });
        }
      }

      await ctx.runAction(internal.coachingEmails.sendNoShowWarningEmail, {
        coachName,
        coachEmail: coach.email,
        sessionTitle,
        studentName,
        sessionDate,
      });
    } else if (newCount >= 2) {
      // Second+ no-show: coaching paused
      await ctx.runAction(internal.coachingEmails.sendCoachingPausedEmail, {
        coachName,
        coachEmail: coach.email,
        noShowCount: newCount,
      });
    }

    return null;
  },
});

/**
 * Increment student no-show count (for tracking, free reschedule eligibility).
 * Called when a coach reports buyer no-show.
 */
export const incrementStudentNoShow = internalAction({
  args: { studentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.coachingSessionQueries.incrementStudentNoShowMutation, {
      studentId: args.studentId,
    });
    return null;
  },
});
