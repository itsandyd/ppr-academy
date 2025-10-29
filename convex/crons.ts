import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// TODO: Re-implement these cron jobs after email system refactor
/*
crons.interval(
  "process-scheduled-campaigns",
  { minutes: 15 },
  internal.emails.processScheduledCampaigns
);

crons.interval(
  "process-automation-triggers",
  { hours: 1 },
  internal.emails.processAutomationTriggers
);

crons.daily(
  "cleanup-old-email-logs",
  { hourUTC: 2, minuteUTC: 0 },
  internal.emails.cleanupOldLogs
);

crons.cron(
  "send-weekly-digests",
  "0 9 * * 0",
  internal.emails.sendWeeklyDigests
);

crons.interval(
  "sync-email-statuses",
  { hours: 1 },
  internal.emails.syncEmailStatuses
);
*/

/**
 * Daily email analytics rollup
 * Runs daily at midnight UTC to aggregate yesterday's metrics
 */
crons.interval(
  "daily-email-analytics-rollup",
  { hours: 24 },
  internal.emailAnalyticsRollup.dailyAnalyticsRollup
);

/**
 * Fetch inbox replies (backup for webhooks)
 * Runs every hour to catch any missed emails
 */
crons.interval(
  "fetch-inbox-replies",
  { hours: 1 },
  internal.inboxSync.fetchInboxReplies
);

/**
 * Update fan counts for all stores
 * Runs every 6 hours to provide accurate total counts
 */
crons.interval(
  "update-fan-counts",
  { hours: 6 },
  internal.fanCountAggregation.updateAllStoreFanCounts
);

export default crons;
