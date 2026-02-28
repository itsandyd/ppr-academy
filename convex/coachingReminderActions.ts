"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Enhanced reminder system for coaching sessions.
 * Sends reminders at 3 checkpoints: 24h, 1h, and session start.
 * Runs as a cron every 15 minutes.
 */
export const processReminders = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      const sessions = await ctx.runQuery(
        internal.coachingSessionQueries.getSessionsNeedingEnhancedReminders
      );

      const now = Date.now();

      for (const session of sessions) {
        const sessionTime = session.scheduledDate;
        const hoursUntil = (sessionTime - now) / (60 * 60 * 1000);

        // Look up coach and student info
        const coach = await ctx.runQuery(
          internal.coachingSessionQueries.getUserByClerkId,
          { clerkId: session.coachId }
        );
        const student = await ctx.runQuery(
          internal.coachingSessionQueries.getUserByClerkId,
          { clerkId: session.studentId }
        );
        const product = await ctx.runQuery(
          internal.coachingSessionQueries.getProduct,
          { productId: session.productId }
        );

        if (!coach?.email || !student?.email) continue;

        const coachName = coach.name || coach.firstName || "Coach";
        const studentName = student.name || student.firstName || "Student";
        const sessionTitle = product?.title || "Coaching Session";
        const sessionDate = new Date(session.scheduledDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        try {
          // 24-hour reminder (send when 23-25 hours away)
          if (!session.reminder24hSent && hoursUntil <= 25 && hoursUntil > 2) {
            await sendReminderPair(ctx, {
              sessionId: session._id,
              coachName,
              coachEmail: coach.email,
              studentName,
              studentEmail: student.email,
              sessionTitle,
              sessionDate,
              sessionTime: session.startTime,
              duration: session.duration,
              hoursUntil: 24,
              sessionPlatform: session.sessionPlatform,
              sessionLink: session.sessionLink,
              sessionPhone: session.sessionPhone,
            });

            await ctx.runMutation(
              internal.coachingSessionQueries.markEnhancedReminderSent,
              { sessionId: session._id, reminderType: "24h" }
            );
          }

          // 1-hour reminder (send when 0.5-1.5 hours away)
          if (!session.reminder1hSent && hoursUntil <= 1.5 && hoursUntil > 0.25) {
            await sendReminderPair(ctx, {
              sessionId: session._id,
              coachName,
              coachEmail: coach.email,
              studentName,
              studentEmail: student.email,
              sessionTitle,
              sessionDate,
              sessionTime: session.startTime,
              duration: session.duration,
              hoursUntil: 1,
              sessionPlatform: session.sessionPlatform,
              sessionLink: session.sessionLink,
              sessionPhone: session.sessionPhone,
            });

            await ctx.runMutation(
              internal.coachingSessionQueries.markEnhancedReminderSent,
              { sessionId: session._id, reminderType: "1h" }
            );
          }

          // Start-time reminder (send when 0-15 minutes away or just past)
          if (!session.reminderStartSent && hoursUntil <= 0.25 && hoursUntil > -0.5) {
            await sendReminderPair(ctx, {
              sessionId: session._id,
              coachName,
              coachEmail: coach.email,
              studentName,
              studentEmail: student.email,
              sessionTitle,
              sessionDate,
              sessionTime: session.startTime,
              duration: session.duration,
              hoursUntil: 0,
              sessionPlatform: session.sessionPlatform,
              sessionLink: session.sessionLink,
              sessionPhone: session.sessionPhone,
            });

            await ctx.runMutation(
              internal.coachingSessionQueries.markEnhancedReminderSent,
              { sessionId: session._id, reminderType: "start" }
            );
          }
        } catch (error) {
          console.error(`Failed to process reminders for session ${session._id}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error("Reminder processing error:", error);
      return null;
    }
  },
});

async function sendReminderPair(
  ctx: any,
  args: {
    sessionId: any;
    coachName: string;
    coachEmail: string;
    studentName: string;
    studentEmail: string;
    sessionTitle: string;
    sessionDate: string;
    sessionTime: string;
    duration: number;
    hoursUntil: number;
    sessionPlatform?: string;
    sessionLink?: string;
    sessionPhone?: string;
  }
) {
  // Send to coach
  await ctx.runAction(internal.coachingEmails.sendSessionReminderEmail, {
    recipientName: args.coachName,
    recipientEmail: args.coachEmail,
    otherPartyName: args.studentName,
    sessionTitle: args.sessionTitle,
    sessionDate: args.sessionDate,
    sessionTime: args.sessionTime,
    duration: args.duration,
    isCoach: true,
    hoursUntil: args.hoursUntil,
    sessionPlatform: args.sessionPlatform,
    sessionLink: args.sessionLink,
    sessionPhone: args.sessionPhone,
  });

  // Send to student
  await ctx.runAction(internal.coachingEmails.sendSessionReminderEmail, {
    recipientName: args.studentName,
    recipientEmail: args.studentEmail,
    otherPartyName: args.coachName,
    sessionTitle: args.sessionTitle,
    sessionDate: args.sessionDate,
    sessionTime: args.sessionTime,
    duration: args.duration,
    isCoach: false,
    hoursUntil: args.hoursUntil,
    sessionPlatform: args.sessionPlatform,
    sessionLink: args.sessionLink,
    sessionPhone: args.sessionPhone,
  });
}
