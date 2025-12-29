import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup expired live viewers",
  { minutes: 5 },
  internal.liveViewers.cleanupExpiredViewers,
  {}
);

crons.interval(
  "process drip campaign emails",
  { minutes: 15 },
  internal.dripCampaigns.processDueDripEmails,
  {}
);

crons.interval(
  "recover stuck drip enrollments",
  { hours: 1 },
  internal.dripCampaigns.recoverStuckEnrollments,
  {}
);

crons.interval(
  "process scheduled workflow executions",
  { minutes: 30 },
  internal.emailWorkflows.processScheduledExecutions,
  {}
);

export default crons;
