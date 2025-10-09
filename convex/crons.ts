import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Coaching Session Manager
 * 
 * Runs every 15 minutes to manage coaching session access:
 * - Setup: 2 hours before session (create channel/role, grant access)
 * - Cleanup: 1 hour after session (revoke access, delete channel/role)
 * 
 * This ensures:
 * ✅ Students can't access channels weeks before their session
 * ✅ Old participants can't join recycled channels
 * ✅ Discord stays clean and organized
 */
crons.interval(
  "manage coaching sessions",
  { minutes: 15 },
  internal.coachingSessionManager.manageCoachingSessions
);

export default crons;
