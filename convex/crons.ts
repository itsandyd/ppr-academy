import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Process scheduled email campaigns
 * Runs every 15 minutes
 */
crons.interval(
  "process-scheduled-campaigns",
  { minutes: 15 },
  internal.emails.processScheduledCampaigns
);

/**
 * Process automation triggers
 * Runs every hour
 */
crons.interval(
  "process-automation-triggers",
  { hours: 1 },
  internal.emails.processAutomationTriggers
);

/**
 * Cleanup old email logs
 * Runs daily at 2 AM
 */
crons.daily(
  "cleanup-old-email-logs",
  { hourUTC: 2, minuteUTC: 0 },
  internal.emails.cleanupOldLogs
);

/**
 * Send weekly digest emails
 * Runs weekly on Sundays at 9 AM UTC (using cron syntax)
 */
crons.cron(
  "send-weekly-digests",
  "0 9 * * 0", // Every Sunday at 9:00 AM UTC (minute hour day month day-of-week)
  internal.emails.sendWeeklyDigests
);

/**
 * Sync email statuses with Resend API
 * Runs every hour as backup for missed webhooks
 */
crons.interval(
  "sync-email-statuses",
  { hours: 1 },
  internal.emails.syncEmailStatuses
);

/**
 * Daily email analytics rollup
 * Runs daily at midnight UTC to aggregate yesterday's metrics
 */
crons.interval(
  "daily-email-analytics-rollup",
  { hours: 24 },
  internal.emailAnalyticsRollup.dailyAnalyticsRollup
);

export default crons;
