import { cronJobs } from "convex/server";

const crons = cronJobs();

/* eslint-disable @typescript-eslint/no-var-requires */
const { internal } = require("./_generated/api");

crons.interval(
  "cleanup expired live viewers",
  { minutes: 5 },
  internal.liveViewers.cleanupExpiredViewers,
  {}
);

crons.interval(
  "process drip campaign emails",
  { minutes: 15 },
  internal.dripCampaignActions.processDueDripEmails,
  {}
);

crons.interval(
  "recover stuck drip enrollments",
  { hours: 1 },
  internal.dripCampaigns.recoverStuckEnrollments,
  {}
);

// DISABLED - was causing OCC conflicts with emailWorkflowActions cron
// Both were processing the same workflowExecutions table
// crons.interval(
//   "process workflow executions",
//   { minutes: 5 },
//   internal.workflowActions.processWorkflowExecutions,
//   {}
// );

crons.interval(
  "process email workflow executions",
  { seconds: 60 },
  internal.emailWorkflowActions.processEmailWorkflowExecutions,
  {}
);

crons.interval(
  "process course drip content unlocks",
  { minutes: 15 },
  internal.courseDrip.processPendingDripUnlocks,
  {}
);

crons.interval(
  "process email send queue",
  { seconds: 30 },
  internal.emailSendQueueActions.processEmailSendQueue,
  {}
);

crons.interval(
  "cleanup old webhook events",
  { hours: 24 },
  internal.webhookEvents.cleanupOldWebhookEvents,
  {}
);

crons.interval(
  "aggregate admin metrics",
  { hours: 1 },
  internal.adminMetricsAggregation.aggregateAdminMetrics,
  {}
);

export default crons;
