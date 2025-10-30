import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired live viewer records every 5 minutes
crons.interval(
  "cleanup expired live viewers",
  { minutes: 5 },
  internal.liveViewers.cleanupExpiredViewers,
  {}
);

export default crons;
