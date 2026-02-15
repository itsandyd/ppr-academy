import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Migration to fix workflow executions that should be showing at delay nodes.
 *
 * The bug: When contacts entered a delay, their currentNodeId was set to the node
 * AFTER the delay, making them invisible when querying "who's in the delay?"
 *
 * This migration finds pending executions with future scheduledFor times and
 * updates their currentNodeId to the delay node that precedes their current node.
 *
 * NOTE: Run multiple times until "processed" returns 0 (or hasMore is false)
 *
 * Usage:
 *   // First do a dry run to see what would change:
 *   npx convex run migrations/fixDelayNodeTracking:fixDelayNodeTracking '{"dryRun": true}'
 *
 *   // Then run for real (run multiple times until hasMore is false):
 *   npx convex run migrations/fixDelayNodeTracking:fixDelayNodeTracking '{"dryRun": false}'
 *
 *   // Or for a specific workflow:
 *   npx convex run migrations/fixDelayNodeTracking:fixDelayNodeTracking '{"workflowId": "...", "dryRun": false}'
 */
export const fixDelayNodeTracking = internalMutation({
  args: {
    workflowId: v.optional(v.id("emailWorkflows")), // Optional: only fix specific workflow
    dryRun: v.optional(v.boolean()), // Default true for safety
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    fixed: v.number(),
    skipped: v.number(),
    alreadyCorrect: v.number(),
    hasMore: v.boolean(),
    isDryRun: v.boolean(),
    details: v.array(
      v.object({
        executionId: v.string(),
        email: v.string(),
        oldNodeId: v.string(),
        newNodeId: v.string(),
        scheduledFor: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const batchSize = args.batchSize || 200; // Small batch to stay under limits
    const now = Date.now();

    let processed = 0;
    let fixed = 0;
    let skipped = 0;
    let alreadyCorrect = 0;
    const details: Array<{
      executionId: string;
      email: string;
      oldNodeId: string;
      newNodeId: string;
      scheduledFor: number;
    }> = [];

    // First, get the workflow if specified (single read)
    let targetWorkflow: any = null;
    if (args.workflowId) {
      targetWorkflow = await ctx.db.get(args.workflowId);
      if (!targetWorkflow) {
        return {
          success: false,
          processed: 0,
          fixed: 0,
          skipped: 0,
          alreadyCorrect: 0,
          hasMore: false,
          isDryRun: dryRun,
          details: [],
        };
      }
    }

    // Get pending executions with future scheduledFor (these are likely in delays)
    // Use .take() with small batch to avoid hitting limits
    let executions;
    if (args.workflowId) {
      const wfId = args.workflowId;
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wfId).eq("status", "pending")
        )
        .take(batchSize);
    } else {
      // Get all pending executions
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(batchSize);
    }

    // Filter to only those with future scheduledFor
    const futureExecutions = executions.filter(
      (e) => e.scheduledFor && e.scheduledFor > now
    );

    console.log(`[Migration] Processing ${futureExecutions.length} pending executions with future scheduledFor`);

    // Cache workflows to avoid repeated lookups (but limit cache size)
    const workflowCache = new Map<string, any>();
    if (targetWorkflow) {
      workflowCache.set(args.workflowId!, targetWorkflow);
    }

    for (const execution of futureExecutions) {
      processed++;

      if (!execution.currentNodeId) {
        skipped++;
        continue;
      }

      // Get workflow (from cache or DB)
      let workflow = workflowCache.get(execution.workflowId);
      if (!workflow) {
        workflow = await ctx.db.get(execution.workflowId);
        if (workflow) {
          workflowCache.set(execution.workflowId, workflow);
        }
      }

      if (!workflow || !workflow.nodes || !workflow.edges) {
        skipped++;
        continue;
      }

      // Find the current node
      const currentNode = workflow.nodes.find((n: any) => n.id === execution.currentNodeId);
      if (!currentNode) {
        skipped++;
        continue;
      }

      // If already at a delay node, nothing to fix
      if (currentNode.type === "delay") {
        alreadyCorrect++;
        continue;
      }

      // Find the edge that leads TO the current node
      const incomingEdge = workflow.edges.find((e: any) => e.target === execution.currentNodeId);
      if (!incomingEdge) {
        skipped++;
        continue;
      }

      // Find the source node of that edge
      const sourceNode = workflow.nodes.find((n: any) => n.id === incomingEdge.source);
      if (!sourceNode) {
        skipped++;
        continue;
      }

      // If the source node is a delay, this execution should be AT the delay node
      if (sourceNode.type === "delay") {
        fixed++;
        details.push({
          executionId: execution._id,
          email: execution.customerEmail,
          oldNodeId: execution.currentNodeId,
          newNodeId: sourceNode.id,
          scheduledFor: execution.scheduledFor || 0,
        });

        if (!dryRun) {
          await ctx.db.patch(execution._id, {
            currentNodeId: sourceNode.id,
          });
        }
      } else {
        // Not preceded by a delay - this execution is pending for some other reason
        skipped++;
      }
    }

    const hasMore = executions.length === batchSize;

    console.log(
      `[Migration] ${dryRun ? "[DRY RUN] " : ""}Batch complete: ${fixed} fixed, ${alreadyCorrect} already correct, ${skipped} skipped out of ${processed} processed. hasMore: ${hasMore}`
    );

    return {
      success: true,
      processed,
      fixed,
      skipped,
      alreadyCorrect,
      hasMore,
      isDryRun: dryRun,
      details: details.slice(0, 20), // Limit details for readability
    };
  },
});

/**
 * Diagnose why pending executions aren't being processed
 */
export const diagnosePendingExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  returns: v.object({
    totalPending: v.number(),
    withScheduledFor: v.number(),
    withoutScheduledFor: v.number(),
    inPast: v.number(),
    inFuture: v.number(),
    samples: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const wfId = args.workflowId;

    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "pending")
      )
      .take(1000);

    let withScheduledFor = 0;
    let withoutScheduledFor = 0;
    let inPast = 0;
    let inFuture = 0;
    const samples: any[] = [];

    for (const exec of pendingExecutions) {
      if (exec.scheduledFor) {
        withScheduledFor++;
        if (exec.scheduledFor <= now) {
          inPast++;
        } else {
          inFuture++;
        }
      } else {
        withoutScheduledFor++;
      }

      // Collect samples
      if (samples.length < 5) {
        samples.push({
          id: exec._id,
          email: exec.customerEmail,
          currentNodeId: exec.currentNodeId,
          scheduledFor: exec.scheduledFor,
          scheduledForDate: exec.scheduledFor ? new Date(exec.scheduledFor).toISOString() : null,
          nowDate: new Date(now).toISOString(),
          isPast: exec.scheduledFor ? exec.scheduledFor <= now : null,
        });
      }
    }

    return {
      totalPending: pendingExecutions.length,
      withScheduledFor,
      withoutScheduledFor,
      inPast,
      inFuture,
      samples,
    };
  },
});

/**
 * Force process stuck pending executions that should have run
 */
export const forceProcessStuckExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    scheduled: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const batchSize = args.batchSize ?? 100;
    const now = Date.now();
    const wfId = args.workflowId;

    // Get pending executions that are past due
    const stuckExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "pending")
      )
      .take(batchSize);

    // Filter to those with scheduledFor in the past (or no scheduledFor)
    const toProcess = stuckExecutions.filter(
      (e) => !e.scheduledFor || e.scheduledFor <= now
    );

    let scheduled = 0;

    if (!dryRun) {
      for (const exec of toProcess) {
        // Schedule immediate processing
        await ctx.scheduler.runAfter(0, internal.emailWorkflowActions.executeWorkflowNode, {
          executionId: exec._id,
        });
        scheduled++;

        // Small batches to avoid overwhelming
        if (scheduled >= 50) break;
      }
    }

    console.log(`[ForceProcess] ${dryRun ? "[DRY RUN] " : ""}Found ${toProcess.length} stuck executions, scheduled ${scheduled}`);

    return {
      processed: toProcess.length,
      scheduled: dryRun ? 0 : scheduled,
      hasMore: stuckExecutions.length === batchSize,
    };
  },
});

/**
 * Reset failed executions back to pending with staggered scheduledFor times
 * This lets them retry without all competing at once
 */
export const resetFailedExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    dryRun: v.optional(v.boolean()),
    spreadMinutes: v.optional(v.number()), // Spread retries over this many minutes
  },
  returns: v.object({
    found: v.number(),
    reset: v.number(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const spreadMinutes = args.spreadMinutes ?? 10;
    const wfId = args.workflowId;
    const now = Date.now();

    const failed = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "failed")
      )
      .take(500);

    let reset = 0;

    if (!dryRun) {
      for (let i = 0; i < failed.length; i++) {
        // Spread retries over the specified time window
        const jitterMs = Math.floor((i / failed.length) * spreadMinutes * 60 * 1000);

        await ctx.db.patch(failed[i]._id, {
          status: "pending",
          errorMessage: undefined,
          scheduledFor: now + jitterMs,
        });
        reset++;
      }
    }

    return {
      found: failed.length,
      reset: dryRun ? 0 : reset,
    };
  },
});

/**
 * Spread out pending executions to reduce OCC contention
 * Uses tiny batches to avoid fighting with the cron
 */
export const spreadPendingExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    dryRun: v.optional(v.boolean()),
    spreadMinutes: v.optional(v.number()), // Spread over this many minutes
  },
  returns: v.object({
    found: v.number(),
    updated: v.number(),
    hasMore: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const spreadMinutes = args.spreadMinutes ?? 60; // Default 60 min spread
    const wfId = args.workflowId;
    const now = Date.now();

    // Use TINY batch to avoid OCC with cron (which processes 500 at a time)
    const TINY_BATCH = 20;

    const pending = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "pending")
      )
      .take(TINY_BATCH);

    // Filter to only past-due ones
    const pastDue = pending.filter((e) => e.scheduledFor && e.scheduledFor <= now);

    let updated = 0;

    if (!dryRun && pastDue.length > 0) {
      for (let i = 0; i < pastDue.length; i++) {
        // Random spread over the time window
        const randomMs = Math.floor(Math.random() * spreadMinutes * 60 * 1000);

        await ctx.db.patch(pastDue[i]._id, {
          scheduledFor: now + randomMs,
        });
        updated++;
      }
    }

    // Check if there are more pending overall
    const totalPending = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "pending")
      )
      .take(100);

    const morePastDue = totalPending.filter((e) => e.scheduledFor && e.scheduledFor <= now).length;

    return {
      found: pastDue.length,
      updated: dryRun ? 0 : updated,
      hasMore: morePastDue > updated,
      message: dryRun
        ? `[DRY RUN] Would spread ${pastDue.length} executions over ${spreadMinutes} minutes`
        : `Spread ${updated} executions. Run again (${morePastDue - updated} more past-due)`,
    };
  },
});

/**
 * Get failed executions to see what errors are happening
 */
export const getFailedExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const wfId = args.workflowId;

    const failed = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", wfId).eq("status", "failed")
      )
      .take(20);

    return failed.map((e) => ({
      id: e._id,
      email: e.customerEmail,
      currentNodeId: e.currentNodeId,
      errorMessage: e.errorMessage,
      scheduledFor: e.scheduledFor,
    }));
  },
});

/**
 * Check what the cron is seeing - does getDueExecutions return anything?
 */
export const checkCronView = internalMutation({
  args: {},
  returns: v.object({
    dueCount: v.number(),
    samples: v.array(v.any()),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    // This is exactly what the cron does
    const dueExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending").lte("scheduledFor", now)
      )
      .take(500);

    return {
      dueCount: dueExecutions.length,
      samples: dueExecutions.slice(0, 5).map((e) => ({
        id: e._id,
        email: e.customerEmail,
        currentNodeId: e.currentNodeId,
        scheduledFor: e.scheduledFor,
        scheduledForDate: e.scheduledFor ? new Date(e.scheduledFor).toISOString() : null,
      })),
    };
  },
});

/**
 * Get stats about workflow executions to help diagnose issues
 * For a specific workflow only (to avoid hitting limits)
 */
/**
 * Check a specific execution's status
 */
export const checkExecution = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      return { error: "Execution not found" };
    }

    const workflow = await ctx.db.get(execution.workflowId);
    const currentNode = workflow?.nodes?.find((n: any) => n.id === execution.currentNodeId);

    return {
      id: execution._id,
      status: execution.status,
      customerEmail: execution.customerEmail,
      currentNodeId: execution.currentNodeId,
      currentNodeType: currentNode?.type,
      currentNodeLabel: currentNode?.data?.label,
      scheduledFor: execution.scheduledFor,
      scheduledForDate: execution.scheduledFor
        ? new Date(execution.scheduledFor).toISOString()
        : null,
      completedAt: execution.completedAt,
      errorMessage: execution.errorMessage,
      contactId: execution.contactId,
    };
  },
});

export const getExecutionStats = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"), // Required to avoid hitting limits
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.any(),
    pendingWithFutureSchedule: v.number(),
    byNodeType: v.any(),
    sampleEmails: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const wfId = args.workflowId;

    // Get the workflow first
    const workflow = await ctx.db.get(wfId);
    if (!workflow) {
      return {
        total: 0,
        byStatus: {},
        pendingWithFutureSchedule: 0,
        byNodeType: {},
        sampleEmails: [],
      };
    }

    const byStatus: Record<string, number> = {};
    const byNodeType: Record<string, number> = {};
    let pendingWithFutureSchedule = 0;
    let total = 0;
    const sampleEmails: string[] = [];

    // Query each status separately to stay under limits
    const statuses = ["pending", "running", "completed", "failed", "cancelled"] as const;

    for (const status of statuses) {
      const executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wfId).eq("status", status)
        )
        .take(5000);

      byStatus[status] = executions.length;
      total += executions.length;

      for (const exec of executions) {
        // Count pending with future schedule
        if (status === "pending" && exec.scheduledFor && exec.scheduledFor > now) {
          pendingWithFutureSchedule++;

          // Collect sample emails
          if (sampleEmails.length < 10) {
            sampleEmails.push(exec.customerEmail);
          }
        }

        // Count by node type (only for active executions)
        if ((status === "pending" || status === "running") && exec.currentNodeId && workflow.nodes) {
          const node = workflow.nodes.find((n: any) => n.id === exec.currentNodeId);
          if (node) {
            byNodeType[node.type] = (byNodeType[node.type] || 0) + 1;
          }
        }
      }
    }

    return {
      total,
      byStatus,
      pendingWithFutureSchedule,
      byNodeType,
      sampleEmails,
    };
  },
});

/**
 * Reset all pending executions for a workflow to a specific node.
 * Use this to restart stuck executions from a specific point in the sequence.
 *
 * Usage:
 *   npx convex run migrations/fixDelayNodeTracking:resetPendingToNode '{
 *     "workflowId": "...",
 *     "targetNodeId": "email-1-1770194191344",
 *     "dryRun": true
 *   }'
 */
/**
 * Reroute executions stuck at a specific node (both pending AND running) to another node.
 * Handles the orphaned "running" status executions that processScheduledExecutions created.
 */
export const rerouteStuckAtNode = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    fromNodeId: v.string(),
    toNodeId: v.string(),
    scheduledFor: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 500;
    const targetScheduledFor = args.scheduledFor ?? Date.now();

    // Get PENDING executions at the source node - scan larger window
    const pending = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(15000);

    const pendingAtNode = pending
      .filter((e) => e.currentNodeId === args.fromNodeId)
      .slice(0, batchSize);

    // Get RUNNING executions at the source node
    const running = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(15000);

    const runningAtNode = running
      .filter((e) => e.currentNodeId === args.fromNodeId)
      .slice(0, batchSize);

    let rerouted = 0;

    for (const exec of pendingAtNode) {
      await ctx.db.patch(exec._id, {
        currentNodeId: args.toNodeId,
        scheduledFor: targetScheduledFor,
        status: "pending",
      });
      rerouted++;
    }

    for (const exec of runningAtNode) {
      await ctx.db.patch(exec._id, {
        currentNodeId: args.toNodeId,
        scheduledFor: targetScheduledFor,
        status: "pending",
      });
      rerouted++;
    }

    return {
      pendingFound: pendingAtNode.length,
      runningFound: runningAtNode.length,
      totalRerouted: rerouted,
      hasMore: pendingAtNode.length >= batchSize || runningAtNode.length >= batchSize,
    };
  },
});

export const resetPendingToNode = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    targetNodeId: v.string(),
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const batchSize = args.batchSize ?? 500;
    const now = Date.now();

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return { error: "Workflow not found" };

    // Verify target node exists
    const targetNode = workflow.nodes.find((n: any) => n.id === args.targetNodeId);
    if (!targetNode) return { error: `Node ${args.targetNodeId} not found in workflow` };

    // Get pending executions
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(batchSize);

    let reset = 0;

    if (!dryRun) {
      for (const exec of pendingExecutions) {
        await ctx.db.patch(exec._id, {
          currentNodeId: args.targetNodeId,
          scheduledFor: now,
          status: "pending",
        });
        reset++;
      }
    }

    return {
      dryRun,
      targetNode: `${targetNode.id} (${targetNode.type}: ${targetNode.data?.label || targetNode.data?.subject || ""})`,
      totalPendingFound: pendingExecutions.length,
      reset,
      hasMore: pendingExecutions.length >= batchSize,
      message: dryRun
        ? `Would reset ${pendingExecutions.length} executions to ${args.targetNodeId}`
        : `Reset ${reset} executions to ${args.targetNodeId}`,
    };
  },
});
