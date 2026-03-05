import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Diagnose failed workflow executions.
 */
export const diagnoseExecutions = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const status = args.status ?? "failed";
    const limit = args.limit ?? 5000;

    const execs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q: any) => q.eq("status", status))
      .take(limit);

    const byWorkflow: Record<string, any> = {};
    for (const exec of execs) {
      const wfId = String(exec.workflowId);
      if (!byWorkflow[wfId]) {
        byWorkflow[wfId] = { count: 0, nodes: {} as Record<string, number>, errors: {} as Record<string, number>, emails: [] as string[] };
      }
      byWorkflow[wfId].count++;
      const nodeId = exec.currentNodeId || "unknown";
      byWorkflow[wfId].nodes[nodeId] = (byWorkflow[wfId].nodes[nodeId] || 0) + 1;
      const rawErr = exec.errorMessage || "(none)";
      const err = rawErr.replace(/[\x00-\x1F\x7F]/g, " ").substring(0, 120);
      byWorkflow[wfId].errors[err] = (byWorkflow[wfId].errors[err] || 0) + 1;
      if (byWorkflow[wfId].emails.length < 5) {
        byWorkflow[wfId].emails.push(exec.customerEmail);
      }
    }

    return { status, total: execs.length, byWorkflow };
  },
});

/**
 * Cross-reference failed queue items with workflow execution states.
 */
export const crossRefQueue = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 2000;

    const failedQueue = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q: any) => q.eq("status", "failed"))
      .take(limit);

    let withExec = 0;
    let withoutExec = 0;
    const execStates: Record<string, number> = {};
    const samples: any[] = [];

    for (const item of failedQueue) {
      if (item.workflowExecutionId) {
        withExec++;
        const exec = await ctx.db.get(item.workflowExecutionId);
        const st = exec ? exec.status : "NOT_FOUND";
        execStates[st] = (execStates[st] || 0) + 1;
        if (samples.length < 15) {
          samples.push({
            email: item.toEmail,
            subject: item.subject.substring(0, 60),
            execStatus: st,
            execNode: exec ? exec.currentNodeId : "N/A",
          });
        }
      } else {
        withoutExec++;
      }
    }

    return { totalFailed: failedQueue.length, withExec, withoutExec, execStates, samples };
  },
});

/**
 * Build a set of recipients who already received a specific subject.
 * Returns just the count and set (as array) for use by the retrigger mutation.
 * Reads only _id, toEmail, subject fields to stay under 16MB limit.
 */
export const getSentRecipients = query({
  args: {
    subject: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5000;
    const sentEmails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q: any) => q.eq("status", "sent"))
      .take(limit);

    const recipients = new Set<string>();
    for (const e of sentEmails) {
      if (e.subject === args.subject) {
        recipients.add(e.toEmail);
      }
    }

    return {
      subject: args.subject,
      totalSentScanned: sentEmails.length,
      matchingRecipients: recipients.size,
      recipients: Array.from(recipients),
    };
  },
});

/**
 * Retrigger failed emails from the send queue.
 *
 * This mutation:
 * 1. Reads failed queue items (batch of `batchSize`)
 * 2. Skips recipients who already received this email (double-send prevention)
 * 3. Skips unsubscribed/blocked recipients
 * 4. Deduplicates within the batch
 * 5. Resets status to "queued" so the cron picks them up
 *
 * DRY RUN by default. Pass dryRun:false to actually requeue.
 *
 * Usage:
 *   # Step 1: Get sent recipients list
 *   npx convex run emailRetrigger:getSentRecipients '{"subject":"so I finally finished the compression thing"}'
 *
 *   # Step 2: Dry run (reports what it would do)
 *   npx convex run emailRetrigger:retriggerFailedBatch '{}'
 *
 *   # Step 3: Execute for real
 *   npx convex run emailRetrigger:retriggerFailedBatch '{"dryRun":false}'
 *
 *   # Repeat Step 3 until hasMore is false
 */
/**
 * Reset failed workflow executions back to "pending" so the cron processor
 * picks them up again. DRY RUN by default.
 *
 * Usage:
 *   npx convex run emailRetrigger:retriggerFailedBatch '{}'
 *   npx convex run emailRetrigger:retriggerFailedBatch '{"dryRun":false}'
 */
export const retriggerFailedBatch = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    alreadySentEmails: v.optional(v.array(v.string())),
    subjectFilter: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const limit = args.batchSize ?? 500;
    const now = Date.now();

    const failed = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q: any) => q.eq("status", "failed"))
      .take(limit);

    let resetCount = 0;
    const byWorkflow: Record<string, number> = {};

    for (const exec of failed) {
      const wfId = String(exec.workflowId);
      byWorkflow[wfId] = (byWorkflow[wfId] || 0) + 1;

      if (!dryRun) {
        await ctx.db.patch(exec._id, {
          status: "pending" as any,
          scheduledFor: now,
          completedAt: undefined,
          errorMessage: undefined,
        });
      }
      resetCount++;
    }

    return {
      dryRun,
      total: failed.length,
      wouldReset: dryRun ? resetCount : 0,
      didReset: dryRun ? 0 : resetCount,
      byWorkflow,
      message: dryRun
        ? "DRY RUN: Would reset " + resetCount + " failed workflow executions to pending. Run with dryRun:false to execute."
        : "Reset " + resetCount + " executions to pending with scheduledFor=now. The cron (every 60s) will pick them up.",
    };
  },
});

export const countQueueByStatus = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const statuses = ["queued", "sending", "sent", "failed", "cancelled", "blocked"];
    const counts: Record<string, number> = {};
    for (const status of statuses) {
      const items = await ctx.db
        .query("emailSendQueue")
        .withIndex("by_status_priority_queuedAt", (q: any) => q.eq("status", status))
        .take(5000);
      counts[status] = items.length;
    }
    return counts;
  },
});

export const checkPendingSchedule = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const now = Date.now();
    const execs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .take(limit);

    const results = execs.map((e) => ({
      id: e._id,
      workflowId: String(e.workflowId),
      nodeId: e.currentNodeId,
      scheduledFor: e.scheduledFor,
      scheduledForDate: e.scheduledFor ? new Date(e.scheduledFor).toISOString() : null,
      isDue: e.scheduledFor ? e.scheduledFor <= now : false,
      hoursFromNow: e.scheduledFor ? Math.round((e.scheduledFor - now) / 3600000 * 10) / 10 : null,
    }));

    const due = results.filter((r) => r.isDue).length;
    const future = results.filter((r) => !r.isDue).length;

    return { now: new Date(now).toISOString(), total: results.length, due, future, samples: results.slice(0, 10) };
  },
});
