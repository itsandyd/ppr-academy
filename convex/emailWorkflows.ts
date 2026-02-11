import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
  internalAction,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const listEmailTemplates = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("emailTemplates"),
      name: v.string(),
      subject: v.string(),
      category: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("emailTemplates")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return templates.map((t) => ({
      _id: t._id,
      name: t.name,
      subject: t.subject,
      category: t.category,
    }));
  },
});

export const createEmailTemplate = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("emailTemplates"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const adminUserId = identity?.subject || "system";

    return await ctx.db.insert("emailTemplates", {
      storeId: args.storeId,
      adminUserId,
      name: args.name,
      subject: args.subject,
      content: args.content,
      category: args.category,
      description: args.description,
    });
  },
});

export const getEmailTemplate = query({
  args: { templateId: v.id("emailTemplates") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

const nodeValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("trigger"),
    v.literal("email"),
    v.literal("delay"),
    v.literal("condition"),
    v.literal("action"),
    v.literal("stop"),
    v.literal("webhook"),
    v.literal("split"),
    v.literal("notify"),
    v.literal("goal"),
    // Course Cycle nodes (perpetual nurture system)
    v.literal("courseCycle"),
    v.literal("courseEmail"),
    v.literal("purchaseCheck"),
    v.literal("cycleLoop")
  ),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  data: v.any(),
});

const edgeValidator = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
});

const triggerValidator = v.object({
  type: v.union(
    v.literal("lead_signup"),
    v.literal("product_purchase"),
    v.literal("tag_added"),
    v.literal("segment_member"),
    v.literal("manual"),
    v.literal("time_delay"),
    v.literal("date_time"),
    v.literal("customer_action"),
    // Phase 8: Expanded triggers
    v.literal("webhook"),
    v.literal("page_visit"),
    v.literal("cart_abandon"),
    v.literal("birthday"),
    v.literal("anniversary"),
    v.literal("custom_event"),
    v.literal("api_call"),
    v.literal("form_submit"),
    v.literal("email_reply"),
    // Admin-specific triggers (platform-wide)
    v.literal("all_users"),
    v.literal("all_creators"),
    v.literal("all_learners"),
    v.literal("new_signup"),
    v.literal("user_inactivity"),
    v.literal("any_purchase"),
    v.literal("any_course_complete")
  ),
  config: v.any(),
});

// Sequence type validator for categorizing workflows
const sequenceTypeValidator = v.optional(v.union(
  v.literal("welcome"),
  v.literal("buyer"),
  v.literal("course_student"),
  v.literal("coaching_client"),
  v.literal("lead_nurture"),
  v.literal("product_launch"),
  v.literal("reengagement"),
  v.literal("winback"),
  v.literal("custom")
));

/**
 * Pre-create tags from workflow nodes - call this BEFORE resolving tagNames to tagIds
 * Returns a map of tagName -> tagId for resolution
 */
export const preCreateWorkflowTags = mutation({
  args: {
    storeId: v.string(),
    nodes: v.array(v.any()),
  },
  returns: v.array(v.object({
    name: v.string(),
    tagId: v.id("emailTags"),
  })),
  handler: async (ctx, args) => {
    const tagMap: { name: string; tagId: any }[] = [];

    // Extract all tag names from action nodes
    const tagNames = new Set<string>();
    for (const node of args.nodes) {
      if (node.type === "action" && node.data) {
        const { actionType, tagName, value } = node.data;
        if (actionType === "add_tag" || actionType === "remove_tag") {
          const name = tagName || value;
          if (name && typeof name === "string") {
            tagNames.add(name);
          }
        }
      }
    }

    // Create or get each tag
    for (const name of tagNames) {
      const existingTag = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId_and_name", (q) =>
          q.eq("storeId", args.storeId).eq("name", name)
        )
        .first();

      if (existingTag) {
        tagMap.push({ name, tagId: existingTag._id });
      } else {
        const now = Date.now();
        const tagId = await ctx.db.insert("emailTags", {
          storeId: args.storeId,
          name,
          color: "#8b5cf6", // Purple for auto-created tags
          description: "Auto-created from AI workflow",
          contactCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        tagMap.push({ name, tagId });
        console.log(`[EmailWorkflows] Pre-created tag "${name}" (ID: ${tagId})`);
      }
    }

    return tagMap;
  },
});

export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    trigger: triggerValidator,
    nodes: v.array(nodeValidator),
    edges: v.array(edgeValidator),
    sequenceType: sequenceTypeValidator,
  },
  returns: v.id("emailWorkflows"),
  handler: async (ctx, args) => {
    // Auto-create any tags referenced in action nodes
    await ctx.scheduler.runAfter(0, internal.emailWorkflows.ensureWorkflowTagsExist, {
      storeId: args.storeId,
      nodes: args.nodes,
    });

    return await ctx.db.insert("emailWorkflows", {
      name: args.name,
      description: args.description,
      storeId: args.storeId,
      userId: args.userId,
      isActive: false,
      trigger: args.trigger,
      nodes: args.nodes,
      edges: args.edges,
      sequenceType: args.sequenceType,
      totalExecutions: 0,
    });
  },
});

export const updateWorkflow = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    trigger: v.optional(triggerValidator),
    nodes: v.optional(v.array(nodeValidator)),
    edges: v.optional(v.array(edgeValidator)),
    isActive: v.optional(v.boolean()),
    sequenceType: sequenceTypeValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workflowId, ...updates } = args;
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) throw new Error("Workflow not found");

    // Auto-create any tags referenced in action nodes when nodes are updated
    if (args.nodes && args.nodes.length > 0) {
      await ctx.scheduler.runAfter(0, internal.emailWorkflows.ensureWorkflowTagsExist, {
        storeId: workflow.storeId,
        nodes: args.nodes,
      });
    }

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(workflowId, filteredUpdates);
    return null;
  },
});

export const deleteWorkflow = mutation({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.object({
    deleted: v.boolean(),
    remainingExecutions: v.number(),
  }),
  handler: async (ctx, args) => {
    // Delete executions in batches to avoid 32k document limit
    // Process up to 5000 at a time (safe limit for mutations)
    const BATCH_SIZE = 5000;

    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .take(BATCH_SIZE);

    for (const execution of executions) {
      await ctx.db.delete(execution._id);
    }

    // Check if there are more executions to delete
    const remaining = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();

    if (remaining) {
      // More executions exist, client should call again
      return { deleted: false, remainingExecutions: 1 };
    }

    // All executions deleted, now delete the workflow
    await ctx.db.delete(args.workflowId);
    return { deleted: true, remainingExecutions: 0 };
  },
});

export const getWorkflow = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

export const getNodeExecutionCounts = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};
    // Use .take() instead of pagination since Convex only allows one paginated query per function
    // With compound index, we directly get only matching records (no filtering overhead)
    const LIMIT = 15000; // Stay under 32k total (15k pending + 15k running + buffer)

    // Get pending executions
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(LIMIT);

    for (const exec of pendingExecutions) {
      if (exec.currentNodeId) {
        counts[exec.currentNodeId] = (counts[exec.currentNodeId] || 0) + 1;
      }
    }

    // Get running executions
    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(LIMIT);

    for (const exec of runningExecutions) {
      if (exec.currentNodeId) {
        counts[exec.currentNodeId] = (counts[exec.currentNodeId] || 0) + 1;
      }
    }

    return counts;
  },
});

/**
 * Get detailed workflow node stats including delay timing information
 * Returns counts per node type with timing for delay nodes
 */
export const getWorkflowNodeStats = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.object({
    totalActive: v.number(),
    totalInDelay: v.number(),
    nodeStats: v.array(
      v.object({
        nodeId: v.string(),
        nodeType: v.string(),
        nodeName: v.optional(v.string()),
        count: v.number(),
        // Delay-specific fields
        nextScheduledAt: v.optional(v.number()),
        lastScheduledAt: v.optional(v.number()),
        averageWaitTimeMs: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Get the workflow to access node definitions
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      return { totalActive: 0, totalInDelay: 0, nodeStats: [] };
    }

    const nodes = workflow.nodes as Array<{
      id: string;
      type: string;
      data?: { label?: string; delayDays?: number; delayHours?: number; delayMinutes?: number };
    }>;

    // Build a map of nodeId -> node info
    const nodeMap = new Map<string, { type: string; name?: string }>();
    for (const node of nodes) {
      nodeMap.set(node.id, {
        type: node.type,
        name: node.data?.label,
      });
    }

    // Collect stats per node
    const nodeStatsMap = new Map<
      string,
      {
        count: number;
        scheduledTimes: number[];
      }
    >();

    const LIMIT = 15000;
    const now = Date.now();

    // Get pending executions (contacts waiting)
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(LIMIT);

    for (const exec of pendingExecutions) {
      if (exec.currentNodeId) {
        const stats = nodeStatsMap.get(exec.currentNodeId) || { count: 0, scheduledTimes: [] };
        stats.count++;
        if (exec.scheduledFor) {
          stats.scheduledTimes.push(exec.scheduledFor);
        }
        nodeStatsMap.set(exec.currentNodeId, stats);
      }
    }

    // Get running executions
    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(LIMIT);

    for (const exec of runningExecutions) {
      if (exec.currentNodeId) {
        const stats = nodeStatsMap.get(exec.currentNodeId) || { count: 0, scheduledTimes: [] };
        stats.count++;
        if (exec.scheduledFor) {
          stats.scheduledTimes.push(exec.scheduledFor);
        }
        nodeStatsMap.set(exec.currentNodeId, stats);
      }
    }

    // Build result array
    let totalActive = 0;
    let totalInDelay = 0;
    const nodeStats: Array<{
      nodeId: string;
      nodeType: string;
      nodeName?: string;
      count: number;
      nextScheduledAt?: number;
      lastScheduledAt?: number;
      averageWaitTimeMs?: number;
    }> = [];

    for (const [nodeId, stats] of nodeStatsMap) {
      const nodeInfo = nodeMap.get(nodeId);
      const nodeType = nodeInfo?.type || "unknown";
      const isDelayNode = nodeType === "delay";

      totalActive += stats.count;
      if (isDelayNode) {
        totalInDelay += stats.count;
      }

      // Calculate timing stats for nodes with scheduled times
      let nextScheduledAt: number | undefined;
      let lastScheduledAt: number | undefined;
      let averageWaitTimeMs: number | undefined;

      if (stats.scheduledTimes.length > 0) {
        const sortedTimes = stats.scheduledTimes.sort((a, b) => a - b);
        nextScheduledAt = sortedTimes[0];
        lastScheduledAt = sortedTimes[sortedTimes.length - 1];

        // Calculate average wait time from now
        const futureWaits = sortedTimes.filter((t) => t > now).map((t) => t - now);
        if (futureWaits.length > 0) {
          averageWaitTimeMs = Math.round(
            futureWaits.reduce((a, b) => a + b, 0) / futureWaits.length
          );
        }
      }

      nodeStats.push({
        nodeId,
        nodeType,
        nodeName: nodeInfo?.name,
        count: stats.count,
        nextScheduledAt,
        lastScheduledAt,
        averageWaitTimeMs,
      });
    }

    // Sort by count descending
    nodeStats.sort((a, b) => b.count - a.count);

    return {
      totalActive,
      totalInDelay,
      nodeStats,
    };
  },
});

export const getContactsAtNode = query({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      executionId: v.id("workflowExecutions"),
      contactId: v.optional(v.id("emailContacts")),
      email: v.string(),
      name: v.optional(v.string()),
      scheduledFor: v.optional(v.number()),
      startedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const maxResults = args.limit ?? 100; // Default to 100 contacts per node display
    const results: {
      executionId: Id<"workflowExecutions">;
      contactId: Id<"emailContacts"> | undefined;
      email: string;
      name: string | undefined;
      scheduledFor: number | undefined;
      startedAt: number | undefined;
    }[] = [];

    // Query pending executions at this node
    // We take more than maxResults since we're filtering by nodeId
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("currentNodeId"), args.nodeId))
      .take(maxResults);

    for (const exec of pendingExecutions) {
      let name: string | undefined;
      if (exec.contactId) {
        const contact = await ctx.db.get(exec.contactId);
        if (contact) {
          name = contact.firstName
            ? `${contact.firstName} ${contact.lastName || ""}`.trim()
            : undefined;
        }
      }
      results.push({
        executionId: exec._id,
        contactId: exec.contactId,
        email: exec.customerEmail,
        name,
        scheduledFor: exec.scheduledFor,
        startedAt: exec.startedAt,
      });
    }

    // If we need more results, query running executions
    if (results.length < maxResults) {
      const remainingLimit = maxResults - results.length;
      const runningExecutions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", args.workflowId).eq("status", "running")
        )
        .filter((q) => q.eq(q.field("currentNodeId"), args.nodeId))
        .take(remainingLimit);

      for (const exec of runningExecutions) {
        let name: string | undefined;
        if (exec.contactId) {
          const contact = await ctx.db.get(exec.contactId);
          if (contact) {
            name = contact.firstName
              ? `${contact.firstName} ${contact.lastName || ""}`.trim()
              : undefined;
          }
        }
        results.push({
          executionId: exec._id,
          contactId: exec.contactId,
          email: exec.customerEmail,
          name,
          scheduledFor: exec.scheduledFor,
          startedAt: exec.startedAt,
        });
      }
    }

    return results;
  },
});

export const listWorkflows = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // First try to find by storeId (Clerk user ID)
    const workflowsByStoreId = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();

    // Also check by userId in case storeId was stored incorrectly
    const workflowsByUserId = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .order("desc")
      .collect();

    // Merge and deduplicate
    const allWorkflows = [...workflowsByStoreId];
    for (const w of workflowsByUserId) {
      if (!allWorkflows.find((existing) => existing._id === w._id)) {
        allWorkflows.push(w);
      }
    }

    return allWorkflows.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * List workflows filtered by sequence type
 */
export const listWorkflowsBySequenceType = query({
  args: {
    storeId: v.string(),
    sequenceType: sequenceTypeValidator,
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (!args.sequenceType) {
      // If no type specified, return all workflows for this store
      return await ctx.db
        .query("emailWorkflows")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .collect();
    }

    // Use compound index to filter by both storeId and sequenceType
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId_sequenceType", (q) =>
        q.eq("storeId", args.storeId).eq("sequenceType", args.sequenceType)
      )
      .order("desc")
      .collect();

    return workflows;
  },
});

/**
 * Get count of workflows by sequence type for a store
 */
export const getWorkflowCountsByType = query({
  args: { storeId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const counts: Record<string, number> = {
      welcome: 0,
      buyer: 0,
      course_student: 0,
      coaching_client: 0,
      lead_nurture: 0,
      product_launch: 0,
      reengagement: 0,
      winback: 0,
      custom: 0,
      unassigned: 0,
    };

    for (const w of workflows) {
      const type = w.sequenceType || "unassigned";
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  },
});

/**
 * List admin workflows (platform-wide email automations)
 */
export const listAdminWorkflows = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_isAdminWorkflow", (q) => q.eq("isAdminWorkflow", true))
      .order("desc")
      .collect();

    return workflows;
  },
});

/**
 * Create an admin workflow (platform-wide targeting)
 */
export const createAdminWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    trigger: triggerValidator,
    nodes: v.array(nodeValidator),
    edges: v.array(edgeValidator),
  },
  returns: v.id("emailWorkflows"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailWorkflows", {
      name: args.name,
      description: args.description,
      storeId: "admin", // Special marker for admin workflows
      userId: args.userId,
      isActive: false,
      isAdminWorkflow: true,
      trigger: args.trigger,
      nodes: args.nodes,
      edges: args.edges,
      totalExecutions: 0,
    });
  },
});

export const toggleWorkflowActive = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workflowId, { isActive: args.isActive });
    return null;
  },
});

export const duplicateWorkflow = mutation({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.id("emailWorkflows"),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    return await ctx.db.insert("emailWorkflows", {
      name: `${workflow.name} (Copy)`,
      description: workflow.description,
      storeId: workflow.storeId,
      userId: workflow.userId,
      isActive: false,
      isAdminWorkflow: workflow.isAdminWorkflow,
      trigger: workflow.trigger,
      nodes: workflow.nodes,
      edges: workflow.edges,
      totalExecutions: 0,
    });
  },
});

export const processScheduledExecutions = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    // Use compound index for efficient querying without filtering
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending").lte("scheduledFor", now)
      )
      .take(50);

    for (const execution of pendingExecutions) {
      await ctx.db.patch(execution._id, {
        status: "running",
        startedAt: now,
      });
    }

    return null;
  },
});

export const triggerLeadSignupWorkflows = internalMutation({
  args: {
    storeId: v.string(),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activeWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const leadSignupWorkflows = activeWorkflows.filter((w) => w.trigger.type === "lead_signup");

    if (leadSignupWorkflows.length === 0) {
      console.log(`[Workflows] No active lead_signup workflows for store ${args.storeId}`);
      return null;
    }

    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.customerEmail.toLowerCase())
      )
      .first();

    const now = Date.now();

    for (const workflow of leadSignupWorkflows) {
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.customerEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[Workflows] ${args.customerEmail} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: args.storeId,
        contactId: contact?._id,
        customerEmail: args.customerEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "lead_signup",
          productId: args.productId,
          productName: args.productName,
          source: args.source,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(`[Workflows] Enrolled ${args.customerEmail} in workflow "${workflow.name}"`);
    }

    return null;
  },
});

export const triggerProductPurchaseWorkflows = internalMutation({
  args: {
    storeId: v.string(),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    productType: v.optional(v.string()),
    courseId: v.optional(v.string()),
    courseName: v.optional(v.string()),
    orderId: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activeWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const purchaseWorkflows = activeWorkflows.filter((w) => w.trigger.type === "product_purchase");

    if (purchaseWorkflows.length === 0) {
      console.log(`[Workflows] No active product_purchase workflows for store ${args.storeId}`);
      return null;
    }

    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.customerEmail.toLowerCase())
      )
      .first();

    const now = Date.now();

    for (const workflow of purchaseWorkflows) {
      const triggerConfig = workflow.trigger?.config || {};

      // Check if workflow is filtered to a specific product
      if (triggerConfig.productId && triggerConfig.productId !== args.productId) {
        continue;
      }

      // Check if workflow is filtered to a specific course
      if (triggerConfig.courseId && triggerConfig.courseId !== args.courseId) {
        continue;
      }

      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.customerEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[Workflows] ${args.customerEmail} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: args.storeId,
        contactId: contact?._id,
        customerEmail: args.customerEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "product_purchase",
          productId: args.productId,
          productName: args.productName,
          productType: args.productType,
          courseId: args.courseId,
          courseName: args.courseName,
          orderId: args.orderId,
          amount: args.amount,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(
        `[Workflows] Enrolled ${args.customerEmail} in purchase workflow "${workflow.name}"`
      );
    }

    return null;
  },
});

// Trigger workflows when a tag is added to a contact
export const triggerTagAddedWorkflows = internalMutation({
  args: {
    storeId: v.string(),
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
    tagName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activeWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter workflows with tag_added trigger
    // Optionally filter by specific tag if configured
    const tagAddedWorkflows = activeWorkflows.filter((w) => {
      if (w.trigger.type !== "tag_added") return false;
      // If a specific tag is configured, check it matches
      const configTagId = w.trigger.config?.tagId;
      if (configTagId && configTagId !== args.tagId) return false;
      return true;
    });

    if (tagAddedWorkflows.length === 0) {
      console.log(`[Workflows] No active tag_added workflows for store ${args.storeId}`);
      return null;
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      console.log(`[Workflows] Contact ${args.contactId} not found`);
      return null;
    }

    const now = Date.now();

    for (const workflow of tagAddedWorkflows) {
      // Check if contact is already in this workflow
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("contactId"), args.contactId),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[Workflows] Contact ${contact.email} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: args.storeId,
        contactId: args.contactId,
        customerEmail: contact.email,
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "tag_added",
          tagId: args.tagId,
          tagName: args.tagName,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(
        `[Workflows] Enrolled ${contact.email} in workflow "${workflow.name}" via tag "${args.tagName}"`
      );
    }

    return null;
  },
});

/**
 * Trigger admin workflows when a new user signs up (platform-wide)
 */
export const triggerAdminNewSignupWorkflows = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active admin workflows with new_signup trigger
    const adminWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_isAdminWorkflow", (q) => q.eq("isAdminWorkflow", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const newSignupWorkflows = adminWorkflows.filter((w) => w.trigger.type === "new_signup");

    if (newSignupWorkflows.length === 0) {
      console.log(`[AdminWorkflows] No active new_signup workflows`);
      return null;
    }

    const now = Date.now();

    for (const workflow of newSignupWorkflows) {
      // Check if user is already in this workflow
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[AdminWorkflows] ${args.userEmail} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: "admin",
        customerEmail: args.userEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "new_signup",
          userId: args.userId,
          userName: args.userName,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(`[AdminWorkflows] Enrolled ${args.userEmail} in admin workflow "${workflow.name}"`);
    }

    return null;
  },
});

/**
 * Trigger admin workflows when any purchase happens (platform-wide)
 */
export const triggerAdminPurchaseWorkflows = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    productType: v.optional(v.string()),
    courseId: v.optional(v.string()),
    courseName: v.optional(v.string()),
    amount: v.optional(v.number()),
    creatorStoreId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active admin workflows with any_purchase trigger
    const adminWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_isAdminWorkflow", (q) => q.eq("isAdminWorkflow", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const purchaseWorkflows = adminWorkflows.filter((w) => w.trigger.type === "any_purchase");

    if (purchaseWorkflows.length === 0) {
      console.log(`[AdminWorkflows] No active any_purchase workflows`);
      return null;
    }

    const now = Date.now();

    for (const workflow of purchaseWorkflows) {
      // Check if user is already in this workflow for this purchase type
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[AdminWorkflows] ${args.userEmail} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: "admin",
        customerEmail: args.userEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "any_purchase",
          userId: args.userId,
          userName: args.userName,
          productId: args.productId,
          productName: args.productName,
          productType: args.productType,
          courseId: args.courseId,
          courseName: args.courseName,
          amount: args.amount,
          creatorStoreId: args.creatorStoreId,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(`[AdminWorkflows] Enrolled ${args.userEmail} in admin workflow "${workflow.name}" (purchase trigger)`);
    }

    return null;
  },
});

/**
 * Trigger admin workflows when any course is completed (platform-wide)
 */
export const triggerAdminCourseCompleteWorkflows = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    courseId: v.string(),
    courseName: v.optional(v.string()),
    instructorId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active admin workflows with any_course_complete trigger
    const adminWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_isAdminWorkflow", (q) => q.eq("isAdminWorkflow", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const courseCompleteWorkflows = adminWorkflows.filter((w) => w.trigger.type === "any_course_complete");

    if (courseCompleteWorkflows.length === 0) {
      console.log(`[AdminWorkflows] No active any_course_complete workflows`);
      return null;
    }

    const now = Date.now();

    for (const workflow of courseCompleteWorkflows) {
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[AdminWorkflows] ${args.userEmail} already in workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: "admin",
        customerEmail: args.userEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "any_course_complete",
          userId: args.userId,
          userName: args.userName,
          courseId: args.courseId,
          courseName: args.courseName,
          instructorId: args.instructorId,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(`[AdminWorkflows] Enrolled ${args.userEmail} in admin workflow "${workflow.name}" (course complete trigger)`);
    }

    return null;
  },
});

/**
 * Trigger learner conversion workflows when a user hits a creator-readiness milestone
 * Triggered by: first enrollment, lessons milestone, certificate earned, expert level, course completed
 */
export const triggerLearnerConversionWorkflows = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    conversionContext: v.union(
      v.literal("first_enrollment"),
      v.literal("lessons_milestone"),
      v.literal("course_completed"),
      v.literal("certificate_earned"),
      v.literal("expert_level"),
      v.literal("leaderboard_visit"),
      v.literal("creator_profile_views")
    ),
    contextData: v.optional(v.object({
      courseName: v.optional(v.string()),
      courseId: v.optional(v.string()),
      lessonCount: v.optional(v.number()),
      level: v.optional(v.number()),
      totalXP: v.optional(v.number()),
      certificateCount: v.optional(v.number()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active admin workflows with learner_conversion trigger
    const adminWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_isAdminWorkflow", (q) => q.eq("isAdminWorkflow", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const conversionWorkflows = adminWorkflows.filter((w) => w.trigger.type === "learner_conversion");

    if (conversionWorkflows.length === 0) {
      console.log(`[AdminWorkflows] No active learner_conversion workflows for context: ${args.conversionContext}`);
      return null;
    }

    const now = Date.now();

    for (const workflow of conversionWorkflows) {
      // Check if workflow is configured for this specific context (or all contexts)
      const triggerContexts = workflow.trigger.config?.contexts || [];
      if (triggerContexts.length > 0 && !triggerContexts.includes(args.conversionContext)) {
        console.log(`[AdminWorkflows] Workflow "${workflow.name}" not configured for context: ${args.conversionContext}`);
        continue;
      }

      // Check if user is already in this workflow
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        console.log(`[AdminWorkflows] ${args.userEmail} already in workflow ${workflow.name}`);
        continue;
      }

      // Also check if user has already completed this workflow
      const completedExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
            q.eq(q.field("status"), "completed")
          )
        )
        .first();

      if (completedExecution && !workflow.trigger.config?.allowReentry) {
        console.log(`[AdminWorkflows] ${args.userEmail} already completed workflow ${workflow.name}`);
        continue;
      }

      const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: "admin",
        customerEmail: args.userEmail.toLowerCase(),
        status: "pending",
        currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {
          triggerType: "learner_conversion",
          conversionContext: args.conversionContext,
          userId: args.userId,
          userName: args.userName,
          ...args.contextData,
        },
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });

      console.log(`[AdminWorkflows] Enrolled ${args.userEmail} in learner conversion workflow "${workflow.name}" (context: ${args.conversionContext})`);
    }

    return null;
  },
});

/**
 * Enroll a user in an admin workflow (for manual triggers)
 * This works with user ID instead of contact ID since admin workflows target platform users
 */
export const enrollUserInAdminWorkflow = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  returns: v.id("workflowExecutions"),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");
    if (!workflow.isAdminWorkflow) throw new Error("Not an admin workflow");

    // Check if user is already in this workflow
    const existingExecution = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) =>
        q.and(
          q.eq(q.field("customerEmail"), args.userEmail.toLowerCase()),
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
        )
      )
      .first();

    if (existingExecution) {
      throw new Error("User is already enrolled in this workflow");
    }

    const now = Date.now();
    const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

    const executionId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      storeId: "admin",
      customerEmail: args.userEmail.toLowerCase(),
      status: "pending",
      currentNodeId: firstNode?.id || workflow.nodes[0]?.id,
      scheduledFor: now,
      executionData: {
        enrolledManually: true,
        userId: args.userId,
        userName: args.userName,
      },
    });

    // Trigger immediate execution
    await ctx.scheduler.runAfter(0, internal.emailWorkflowActions.executeWorkflowNode, {
      executionId,
    });

    await ctx.db.patch(args.workflowId, {
      totalExecutions: (workflow.totalExecutions || 0) + 1,
      lastExecuted: now,
    });

    return executionId;
  },
});

export const enrollContactInWorkflow = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactId: v.id("emailContacts"),
  },
  returns: v.id("workflowExecutions"),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const existingExecution = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) =>
        q.and(
          q.eq(q.field("customerEmail"), contact.email),
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
        )
      )
      .first();

    if (existingExecution) {
      throw new Error("Contact is already enrolled in this workflow");
    }

    const triggerNode = workflow.nodes.find((n: { type: string }) => n.type === "trigger");
    const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

    const now = Date.now();

    const executionId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      storeId: workflow.storeId,
      contactId: args.contactId,
      customerEmail: contact.email,
      status: "pending",
      currentNodeId: firstNode?.id || triggerNode?.id,
      scheduledFor: now,
      executionData: { enrolledManually: true },
    });

    // Trigger immediate execution instead of waiting for cron
    await ctx.scheduler.runAfter(0, internal.emailWorkflowActions.executeWorkflowNode, {
      executionId,
    });

    await ctx.db.patch(args.workflowId, {
      totalExecutions: (workflow.totalExecutions || 0) + 1,
      lastExecuted: now,
    });

    return executionId;
  },
});

export const bulkEnrollContactsInWorkflow = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactIds: v.array(v.id("emailContacts")),
  },
  returns: v.object({
    enrolled: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    let enrolled = 0;
    let skipped = 0;
    const errors: string[] = [];

    const triggerNode = workflow.nodes.find((n: { type: string }) => n.type === "trigger");
    const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");

    const now = Date.now();

    // Build a Set of emails already enrolled for O(1) lookup
    // Use .take() with limit to stay under 32k document read limit
    const LIMIT = 15000; // 15k per status = 30k total, under 32k limit

    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(LIMIT);

    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(LIMIT);

    const enrolledEmails = new Set<string>();
    for (const exec of pendingExecutions) {
      enrolledEmails.add(exec.customerEmail);
    }
    for (const exec of runningExecutions) {
      enrolledEmails.add(exec.customerEmail);
    }

    // Fetch all contacts in one batch using Promise.all
    const contacts = await Promise.all(args.contactIds.map((id) => ctx.db.get(id)));

    for (let i = 0; i < args.contactIds.length; i++) {
      const contactId = args.contactIds[i];
      const contact = contacts[i];

      if (!contact) {
        errors.push(`Contact ${contactId} not found`);
        continue;
      }

      // Check against the Set instead of querying
      if (enrolledEmails.has(contact.email)) {
        skipped++;
        continue;
      }

      // Add to Set to prevent duplicates within this batch
      enrolledEmails.add(contact.email);

      const executionId = await ctx.db.insert("workflowExecutions", {
        workflowId: args.workflowId,
        storeId: workflow.storeId,
        contactId,
        customerEmail: contact.email,
        status: "pending",
        currentNodeId: firstNode?.id || triggerNode?.id,
        scheduledFor: now,
        executionData: { enrolledManually: true },
      });

      // Trigger immediate execution instead of waiting for cron
      await ctx.scheduler.runAfter(0, internal.emailWorkflowActions.executeWorkflowNode, {
        executionId,
      });

      enrolled++;
    }

    if (enrolled > 0) {
      await ctx.db.patch(args.workflowId, {
        totalExecutions: (workflow.totalExecutions || 0) + enrolled,
        lastExecuted: now,
      });
    }

    return { enrolled, skipped, errors };
  },
});

/**
 * Internal mutation to enroll a batch of contacts by IDs
 */
export const enrollContactBatchInternal = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactIds: v.array(v.id("emailContacts")),
  },
  returns: v.object({
    enrolled: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return { enrolled: 0, skipped: 0 };

    const triggerNode = workflow.nodes.find((n: { type: string }) => n.type === "trigger");
    const firstNode = workflow.nodes.find((n: { type: string }) => n.type !== "trigger");
    const now = Date.now();

    let enrolled = 0;
    let skipped = 0;

    for (const contactId of args.contactIds) {
      const contact = await ctx.db.get(contactId);
      if (!contact) {
        skipped++;
        continue;
      }

      // Check if this contact is already enrolled in this workflow (active execution)
      const existingExecution = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_contactId", (q) => q.eq("contactId", contactId))
        .filter((q) =>
          q.and(
            q.eq(q.field("workflowId"), args.workflowId),
            q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
          )
        )
        .first();

      if (existingExecution) {
        skipped++;
        continue;
      }

      const executionId = await ctx.db.insert("workflowExecutions", {
        workflowId: args.workflowId,
        storeId: workflow.storeId,
        contactId,
        customerEmail: contact.email,
        status: "pending",
        currentNodeId: firstNode?.id || triggerNode?.id,
        scheduledFor: now,
        executionData: { enrolledManually: true },
      });

      await ctx.scheduler.runAfter(0, internal.emailWorkflowActions.executeWorkflowNode, {
        executionId,
      });

      enrolled++;
    }

    return { enrolled, skipped };
  },
});

/**
 * Public action to START bulk enrollment - kicks off the process
 * Returns immediately and processes in background via self-scheduling
 */
export const bulkEnrollAllContactsByFilter = action({
  args: {
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
    tagId: v.optional(v.id("emailTags")),
    noTags: v.optional(v.boolean()),
  },
  returns: v.object({
    enrolled: v.number(),
    skipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Start the bulk enrollment process via scheduler
    // This returns immediately and processes in background
    await ctx.scheduler.runAfter(0, internal.emailWorkflows.processBulkEnrollment, {
      workflowId: args.workflowId,
      storeId: args.storeId,
      tagId: args.tagId,
      noTags: args.noTags,
      cursor: undefined,
      totalEnrolled: 0,
      totalSkipped: 0,
      batchNumber: 0,
    });

    return {
      enrolled: 0,
      skipped: 0,
      message: `Bulk enrollment started! Processing all contacts in background. Check workflow stats for progress.`,
    };
  },
});

/**
 * Internal action that processes bulk enrollment in chunks with self-scheduling
 * Handles 47k+ contacts by processing MAX_BATCHES_PER_INVOCATION batches, then scheduling itself
 * This avoids the 10-minute action timeout
 */
export const processBulkEnrollment = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
    tagId: v.optional(v.id("emailTags")),
    noTags: v.optional(v.boolean()),
    cursor: v.optional(v.string()),
    totalEnrolled: v.number(),
    totalSkipped: v.number(),
    batchNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 50; // Contacts per mutation batch
    const MAX_BATCHES_PER_INVOCATION = 40; // ~2000 contacts per invocation (stays well under 10min timeout)

    let { totalEnrolled, totalSkipped, batchNumber } = args;
    let cursor: string | undefined = args.cursor;
    let batchesProcessed = 0;
    let done = false;

    console.log(`[BulkEnroll] Starting invocation #${Math.floor(batchNumber / MAX_BATCHES_PER_INVOCATION) + 1}, cursor: ${cursor || 'start'}, enrolled so far: ${totalEnrolled}`);

    // Type definitions for batch results
    type BatchResult = { contactIds: string[]; nextCursor: string | null; hasMore: boolean };
    type EnrollResult = { enrolled: number; skipped: number };

    while (batchesProcessed < MAX_BATCHES_PER_INVOCATION && !done) {
      // Fetch a batch of contact IDs
      const batch: BatchResult = await ctx.runQuery(internal.emailWorkflows.getContactIdsBatch, {
        storeId: args.storeId,
        tagId: args.tagId,
        noTags: args.noTags,
        cursor,
        limit: BATCH_SIZE,
      });

      if (batch.contactIds.length === 0) {
        done = true;
        break;
      }

      // Enroll this batch
      const result: EnrollResult = await ctx.runMutation(
        internal.emailWorkflows.enrollContactBatchInternal,
        {
          workflowId: args.workflowId,
          contactIds: batch.contactIds as Id<"emailContacts">[],
        }
      );

      totalEnrolled += result.enrolled;
      totalSkipped += result.skipped;
      batchNumber++;
      batchesProcessed++;

      cursor = batch.nextCursor ?? undefined;

      if (!batch.hasMore) {
        done = true;
      }

      // Log progress every 10 batches
      if (batchesProcessed % 10 === 0) {
        console.log(`[BulkEnroll] Progress: ${totalEnrolled} enrolled, ${totalSkipped} skipped (batch ${batchNumber})`);
      }
    }

    // If there are more contacts to process, schedule the next invocation
    if (!done && cursor) {
      console.log(`[BulkEnroll] Scheduling next invocation. Enrolled so far: ${totalEnrolled}, cursor: ${cursor}`);

      // Small delay to prevent overwhelming the scheduler
      await ctx.scheduler.runAfter(500, internal.emailWorkflows.processBulkEnrollment, {
        workflowId: args.workflowId,
        storeId: args.storeId,
        tagId: args.tagId,
        noTags: args.noTags,
        cursor,
        totalEnrolled,
        totalSkipped,
        batchNumber,
      });

      // Update partial stats so UI can show progress
      await ctx.runMutation(internal.emailWorkflows.updateWorkflowStats, {
        workflowId: args.workflowId,
        enrolledCount: totalEnrolled,
      });

      return;
    }

    // All done! Update final stats
    console.log(`[BulkEnroll] ✅ COMPLETE! Total enrolled: ${totalEnrolled}, skipped: ${totalSkipped}`);

    if (totalEnrolled > 0) {
      await ctx.runMutation(internal.emailWorkflows.updateWorkflowStats, {
        workflowId: args.workflowId,
        enrolledCount: totalEnrolled,
      });
    }
  },
});

/**
 * Get active execution emails for a workflow
 */
export const getActiveExecutionEmails = internalQuery({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Use compound index to query only pending/running executions directly
    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(10000);

    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(10000);

    return [
      ...pendingExecutions.map((e) => e.customerEmail),
      ...runningExecutions.map((e) => e.customerEmail),
    ];
  },
});

/**
 * Get a batch of contact IDs matching filter
 * Uses proper Convex pagination to handle large datasets (43,000+ contacts)
 */
export const getContactIdsBatch = internalQuery({
  args: {
    storeId: v.string(),
    tagId: v.optional(v.id("emailTags")),
    noTags: v.optional(v.boolean()),
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  returns: v.object({
    contactIds: v.array(v.string()),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const collectedContacts: { _id: Id<"emailContacts">; tagIds?: Id<"emailTags">[] }[] = [];
    let hasMore = false;
    let finalCursor: string | null = null;

    if (args.tagId) {
      // Use junction table for efficient tag filtering
      const tagRelations = await ctx.db
        .query("emailContactTags")
        .withIndex("by_storeId_and_tagId", (q) =>
          q.eq("storeId", args.storeId).eq("tagId", args.tagId as Id<"emailTags">)
        )
        .take(args.limit + 1);

      hasMore = tagRelations.length > args.limit;
      const relationsToUse = tagRelations.slice(0, args.limit);

      // Fetch contacts and filter by subscribed status
      for (const rel of relationsToUse) {
        const contact = await ctx.db.get(rel.contactId);
        if (contact && contact.status === "subscribed") {
          collectedContacts.push(contact);
        }
      }

      finalCursor = null; // Simple approach for filtered queries
    } else if (args.noTags) {
      // For no-tags filter, fetch contacts and filter
      const FETCH_SIZE = 1000;
      const contacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_status", (q) =>
          q.eq("storeId", args.storeId).eq("status", "subscribed")
        )
        .take(FETCH_SIZE);

      const noTagContacts = contacts.filter((c) => !c.tagIds || c.tagIds.length === 0);
      hasMore = noTagContacts.length > args.limit;
      collectedContacts.push(...noTagContacts.slice(0, args.limit));
      finalCursor = null;
    } else {
      // For non-filtered queries, use simple pagination
      const paginationResult = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_status", (q) =>
          q.eq("storeId", args.storeId).eq("status", "subscribed")
        )
        .paginate({
          cursor: args.cursor ?? null,
          numItems: args.limit + 1,
        });

      collectedContacts.push(...paginationResult.page);
      hasMore = collectedContacts.length > args.limit;

      if (hasMore) {
        collectedContacts.length = args.limit;
      }

      finalCursor = paginationResult.isDone ? null : paginationResult.continueCursor;
    }

    return {
      contactIds: collectedContacts.map((c) => c._id),
      nextCursor: finalCursor,
      hasMore,
    };
  },
});

/**
 * Update workflow stats after bulk enrollment
 */
export const updateWorkflowStats = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    enrolledCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return null;

    await ctx.db.patch(args.workflowId, {
      totalExecutions: (workflow.totalExecutions || 0) + args.enrolledCount,
      lastExecuted: Date.now(),
    });

    return null;
  },
});

export const getContactWorkflowStatus = query({
  args: {
    contactId: v.id("emailContacts"),
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return [];

    const executions = await ctx.db
      .query("workflowExecutions")
      .filter((q) => q.eq(q.field("customerEmail"), contact.email))
      .collect();

    const workflowIds = [...new Set(executions.map((e) => e.workflowId))];
    const workflows = await Promise.all(workflowIds.map((id) => ctx.db.get(id)));

    return executions.map((execution) => ({
      ...execution,
      workflow: workflows.find((w) => w?._id === execution.workflowId),
    }));
  },
});

// ============================================================================
// INTERNAL HELPERS FOR DURABLE WORKFLOWS
// These functions are called by the durable workflow component
// ============================================================================

/**
 * Internal query to get workflow definition for durable workflow processing
 */
export const getWorkflowInternal = internalQuery({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

/**
 * Evaluate a workflow condition
 */
export const evaluateCondition = internalQuery({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    condition: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.condition || !args.contactId) return true;

    const contact = await ctx.db.get(args.contactId);
    if (!contact) return false;

    const { field, operator, value } = args.condition as {
      field: string;
      operator: string;
      value: string;
    };

    const fieldValue = (contact as Record<string, unknown>)[field];

    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "contains":
        return String(fieldValue || "").includes(value);
      case "starts_with":
        return String(fieldValue || "").startsWith(value);
      case "ends_with":
        return String(fieldValue || "").endsWith(value);
      case "is_set":
        return fieldValue !== undefined && fieldValue !== null;
      case "is_not_set":
        return fieldValue === undefined || fieldValue === null;
      default:
        return true;
    }
  },
});

/**
 * Evaluate a workflow condition node
 * Supports: opened_email, clicked_link, has_tag, has_purchased_product, time_based
 */
export const evaluateWorkflowCondition = internalQuery({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    storeId: v.string(),
    customerEmail: v.string(),
    conditionType: v.optional(v.string()),
    conditionData: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.conditionType) return true;

    const contact = args.contactId ? await ctx.db.get(args.contactId) : null;

    switch (args.conditionType) {
      case "opened_email": {
        // Check if contact has opened any email (or specific email if emailNodeId is set)
        if (!args.contactId) return false;
        const emailNodeId = args.conditionData?.emailNodeId;

        const opens = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("activityType"), "email_opened"))
          .collect();

        if (emailNodeId && emailNodeId !== "any") {
          // Check for specific email open (would need to track which email was opened)
          return opens.length > 0;
        }
        return opens.length > 0;
      }

      case "clicked_link": {
        // Check if contact has clicked any link (or specific link if specified)
        if (!args.contactId) return false;
        const linkUrl = args.conditionData?.linkUrl;

        const clicks = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("activityType"), "email_clicked"))
          .collect();

        if (linkUrl) {
          // Check for specific link click
          return clicks.some((c) => c.metadata?.linkClicked?.includes(linkUrl));
        }
        return clicks.length > 0;
      }

      case "has_tag": {
        // Check if contact has a specific tag
        if (!contact || !args.conditionData?.tagId) return false;
        const tagIds = contact.tagIds || [];
        return tagIds.includes(args.conditionData.tagId);
      }

      case "has_purchased_product": {
        // Check if contact has purchased a specific product or any product
        const productId = args.conditionData?.productId;
        const courseId = args.conditionData?.courseId;

        // Find the user by email
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), args.customerEmail.toLowerCase()))
          .first();

        if (!user) return false;

        // Get all purchases by this user
        const purchases = await ctx.db
          .query("purchases")
          .withIndex("by_userId", (q) => q.eq("userId", user.clerkId || ""))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        if (productId) {
          // Check for specific product purchase
          return purchases.some((p) => p.productId === productId);
        }

        if (courseId) {
          // Check for specific course purchase
          return purchases.some((p) => p.courseId === courseId);
        }

        // Check for any purchase
        return purchases.length > 0;
      }

      case "time_based": {
        // Check time-based conditions (e.g., days since signup, last activity)
        if (!contact) return false;
        const timeField = args.conditionData?.timeField || "subscribedAt";
        const operator = args.conditionData?.timeOperator || "greater_than";
        const days = args.conditionData?.timeDays || 0;

        const fieldValue = (contact as Record<string, unknown>)[timeField] as number | undefined;
        if (!fieldValue) return false;

        const daysSinceField = (Date.now() - fieldValue) / (1000 * 60 * 60 * 24);

        switch (operator) {
          case "greater_than":
            return daysSinceField > days;
          case "less_than":
            return daysSinceField < days;
          case "equals":
            return Math.floor(daysSinceField) === days;
          default:
            return false;
        }
      }

      default:
        console.log(`[Workflows] Unknown condition type: ${args.conditionType}`);
        return true;
    }
  },
});

/**
 * Check if a workflow goal has been achieved
 */
export const checkGoalAchieved = internalQuery({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    goalType: v.optional(v.string()),
    goalValue: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!args.contactId || !args.goalType) return false;

    const contact = await ctx.db.get(args.contactId);
    if (!contact) return false;

    switch (args.goalType) {
      case "has_purchased":
        // Check if contact has made a purchase by looking up user by email
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", contact.email))
          .first();
        if (!user) return false;
        const purchases = await ctx.db
          .query("purchases")
          .withIndex("by_userId", (q) => q.eq("userId", user.clerkId || ""))
          .take(1);
        return purchases.length > 0;

      case "has_opened_email":
        // Check contact activity for email opens
        const opens = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("activityType"), "opened"))
          .take(1);
        return opens.length > 0;

      case "has_clicked_link":
        // Check contact activity for link clicks
        const clicks = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("activityType"), "clicked"))
          .take(1);
        return clicks.length > 0;

      case "tag_applied":
        // Check if contact has the specified tag applied
        if (!args.goalValue) return false;
        const tagId = args.goalValue as string;
        return contact.tagIds.some(t => t === tagId);

      default:
        return false;
    }
  },
});

/**
 * Call an external webhook
 */
export const callWebhook = internalAction({
  args: {
    url: v.string(),
    payload: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args.payload),
      });

      return {
        success: response.ok,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Track A/B test result - stores variant assignment and updates metrics
 */
export const trackABTestResult = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    variant: v.union(v.literal("A"), v.literal("B")),
    eventType: v.optional(
      v.union(v.literal("sent"), v.literal("delivered"), v.literal("opened"), v.literal("clicked"))
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const eventType = args.eventType || "sent";

    // Find or create the A/B test record for this workflow node
    let abTest = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!abTest) {
      // Create a new A/B test record with default variants
      const now = Date.now();
      const testId = await ctx.db.insert("workflowNodeABTests", {
        workflowId: args.workflowId,
        nodeId: args.nodeId,
        isEnabled: true,
        variants: [
          {
            id: "A",
            name: "Variant A",
            subject: "Variant A Subject",
            percentage: 50,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
          },
          {
            id: "B",
            name: "Variant B",
            subject: "Variant B Subject",
            percentage: 50,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
          },
        ],
        sampleSize: 100,
        winnerMetric: "open_rate",
        autoSelectWinner: true,
        winnerThreshold: 0.05,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      abTest = await ctx.db.get(testId);
    }

    if (!abTest) {
      console.error(`[ABTest] Failed to create/find A/B test for workflow ${args.workflowId}`);
      return null;
    }

    // Update the metrics for the specified variant
    const updatedVariants = abTest.variants.map((v) => {
      if (v.id === args.variant) {
        const currentValue = v[eventType as "sent" | "delivered" | "opened" | "clicked"];
        return {
          ...v,
          [eventType]: currentValue + 1,
        };
      }
      return v;
    });

    await ctx.db.patch(abTest._id, {
      variants: updatedVariants,
      updatedAt: Date.now(),
    });

    console.log(
      `[ABTest] Workflow ${args.workflowId}, Node ${args.nodeId}: Contact ${args.contactId} - variant ${args.variant} ${eventType}`
    );

    // Check if we should auto-select a winner
    if (abTest.autoSelectWinner && abTest.status === "active") {
      const totalSent = updatedVariants.reduce((sum, v) => sum + v.sent, 0);

      if (totalSent >= abTest.sampleSize) {
        // Calculate winner based on the configured metric
        const getRate = (v: (typeof updatedVariants)[0]) => {
          if (abTest.winnerMetric === "click_rate") {
            return v.sent > 0 ? v.clicked / v.sent : 0;
          }
          return v.sent > 0 ? v.opened / v.sent : 0;
        };

        const variantA = updatedVariants.find((v) => v.id === "A");
        const variantB = updatedVariants.find((v) => v.id === "B");

        if (variantA && variantB) {
          const rateA = getRate(variantA);
          const rateB = getRate(variantB);
          const diff = Math.abs(rateA - rateB);
          const threshold = abTest.winnerThreshold || 0.05;

          if (diff >= threshold) {
            const winner = rateA > rateB ? "A" : "B";
            const confidence = Math.min(0.99, 0.8 + diff * 2); // Simplified confidence

            await ctx.db.patch(abTest._id, {
              status: "completed",
              winner,
              confidence,
              completedAt: Date.now(),
            });

            console.log(
              `[ABTest] Winner selected: Variant ${winner} with ${(confidence * 100).toFixed(1)}% confidence`
            );
          }
        }
      }
    }

    return null;
  },
});

/**
 * Get email template (internal)
 */
export const getEmailTemplateInternal = internalQuery({
  args: { templateId: v.id("emailTemplates") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Get contact (internal)
 */
export const getContactInternal = internalQuery({
  args: { contactId: v.id("emailContacts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactId);
  },
});

/**
 * Get tag by name (internal) - for backwards compatibility with action nodes
 */
export const getTagByNameInternal = internalQuery({
  args: {
    storeId: v.string(),
    name: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) => q.eq("storeId", args.storeId).eq("name", args.name))
      .first();
  },
});

/**
 * Create tag (internal) - auto-create tags from workflow actions
 */
export const createTagInternal = internalMutation({
  args: {
    storeId: v.string(),
    name: v.string(),
  },
  returns: v.id("emailTags"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const tagId = await ctx.db.insert("emailTags", {
      storeId: args.storeId,
      name: args.name,
      color: "#6b7280", // Default gray color
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[EmailWorkflows] Auto-created tag "${args.name}" with ID ${tagId}`);
    return tagId;
  },
});

/**
 * Get or create tag - atomic upsert operation for tags
 * This is the preferred method for ensuring tags exist when saving workflows
 */
export const getOrCreateTag = internalMutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("emailTags"),
  handler: async (ctx, args) => {
    // Check if tag already exists
    const existingTag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) =>
        q.eq("storeId", args.storeId).eq("name", args.name)
      )
      .first();

    if (existingTag) {
      return existingTag._id;
    }

    // Create new tag with provided or default values
    const now = Date.now();
    const tagId = await ctx.db.insert("emailTags", {
      storeId: args.storeId,
      name: args.name,
      color: args.color || "#8b5cf6", // Default purple for workflow-created tags
      description: args.description || "Auto-created from workflow",
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[EmailWorkflows] Auto-created tag "${args.name}" (ID: ${tagId})`);
    return tagId;
  },
});

/**
 * Ensure all tags referenced in workflow nodes exist
 * Call this when saving a workflow to pre-create tags
 */
export const ensureWorkflowTagsExist = internalMutation({
  args: {
    storeId: v.string(),
    nodes: v.array(v.any()),
  },
  returns: v.object({
    created: v.array(v.string()),
    existing: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const created: string[] = [];
    const existing: string[] = [];

    // Extract all tag names from action nodes
    const tagNames = new Set<string>();
    for (const node of args.nodes) {
      if (node.type === "action" && node.data) {
        const { actionType, tagName, value } = node.data;
        if (actionType === "add_tag" || actionType === "remove_tag") {
          const name = tagName || value;
          if (name && typeof name === "string") {
            tagNames.add(name);
          }
        }
      }
    }

    // Create or verify each tag
    for (const name of tagNames) {
      const existingTag = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId_and_name", (q) =>
          q.eq("storeId", args.storeId).eq("name", name)
        )
        .first();

      if (existingTag) {
        existing.push(name);
      } else {
        const now = Date.now();
        await ctx.db.insert("emailTags", {
          storeId: args.storeId,
          name,
          color: "#8b5cf6", // Purple for auto-created tags
          description: "Auto-created from workflow",
          contactCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        created.push(name);
        console.log(`[EmailWorkflows] Pre-created tag "${name}" for workflow`);
      }
    }

    return { created, existing };
  },
});

/**
 * Get execution (internal)
 */
export const getExecutionInternal = internalQuery({
  args: { executionId: v.id("workflowExecutions") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.executionId);
  },
});

/**
 * Get store by Clerk user ID (internal) - for workflow notifications
 */
export const getStoreByClerkId = internalQuery({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get executions that are due to run
 * Reduced batch size to avoid OCC contention with large backlogs
 */
export const getDueExecutions = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();

    // Get pending executions that are scheduled for now or earlier
    // Processor runs in parallel batches, so we can handle more per tick
    // The cron runs every minute with parallel processing for high throughput
    const dueExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending").lte("scheduledFor", now)
      )
      .take(1000);

    // Also get running executions that might be stuck (but limit)
    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "running").lte("scheduledFor", now)
      )
      .take(50);

    return [...dueExecutions, ...runningExecutions];
  },
});

/**
 * Bulk-advance delay and action/tag nodes without action overhead.
 * Returns IDs of email nodes that need full action processing.
 */
export const bulkAdvanceSimpleNodes = internalMutation({
  args: {
    executionIds: v.array(v.id("workflowExecutions")),
  },
  returns: v.object({
    advanced: v.number(),
    emailNodeIds: v.array(v.id("workflowExecutions")),
    completed: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    let advanced = 0;
    let completed = 0;
    let skipped = 0;
    const emailNodeIds: any[] = [];
    const now = Date.now();

    // Cache workflows
    const workflowCache = new Map<string, any>();

    for (const execId of args.executionIds) {
      const execution = await ctx.db.get(execId);
      if (!execution || execution.status === "completed" || execution.status === "failed") {
        skipped++;
        continue;
      }

      // Get workflow
      let workflow = workflowCache.get(execution.workflowId);
      if (!workflow) {
        workflow = await ctx.db.get(execution.workflowId);
        if (workflow) workflowCache.set(execution.workflowId, workflow);
      }
      if (!workflow) { skipped++; continue; }

      const currentNode = workflow.nodes?.find((n: any) => n.id === execution.currentNodeId);
      if (!currentNode) {
        // No node - complete
        await ctx.db.patch(execId, { status: "completed", completedAt: now });
        completed++;
        continue;
      }

      // Email nodes need full action processing (Resend API call)
      if (currentNode.type === "email") {
        emailNodeIds.push(execId);
        continue;
      }

      // Goal/stop nodes - complete
      if (currentNode.type === "goal" || currentNode.type === "stop") {
        await ctx.db.patch(execId, { status: "completed", completedAt: now });
        completed++;
        continue;
      }

      // For delay, action, trigger nodes - find next node and advance
      const allOutgoingEdges = workflow.edges?.filter((e: any) => e.source === currentNode.id) || [];
      let connection = allOutgoingEdges[0];

      if (allOutgoingEdges.length > 1) {
        const sequenceEdge = allOutgoingEdges.find((e: any) => {
          const targetNode = workflow.nodes.find((n: any) => n.id === e.target);
          return targetNode && targetNode.type !== "action";
        });
        if (sequenceEdge) connection = sequenceEdge;
      }

      // Leaf action node fix
      if (!connection && currentNode.type === "action") {
        const incomingEdge = workflow.edges?.find((e: any) => e.target === currentNode.id);
        if (incomingEdge) {
          const parentNode = workflow.nodes.find((n: any) => n.id === incomingEdge.source);
          if (parentNode) {
            const siblingEdges = workflow.edges?.filter(
              (e: any) => e.source === parentNode.id && e.target !== currentNode.id
            ) || [];
            const sequenceSibling = siblingEdges.find((e: any) => {
              const targetNode = workflow.nodes.find((n: any) => n.id === e.target);
              return targetNode && targetNode.type !== "action";
            });
            if (sequenceSibling) connection = sequenceSibling;
          }
        }
      }

      if (!connection) {
        await ctx.db.patch(execId, { status: "completed", completedAt: now });
        completed++;
        continue;
      }

      const nextNode = workflow.nodes.find((n: any) => n.id === connection.target);
      if (!nextNode) {
        await ctx.db.patch(execId, { status: "completed", completedAt: now });
        completed++;
        continue;
      }

      // If next node is a delay, calculate scheduledFor
      if (nextNode.type === "delay") {
        const delayData = nextNode.data || {};
        const delayValue = delayData.delay || delayData.delayValue || 1;
        const delayUnit = delayData.delayUnit || delayData.delayType || "days";
        let delayMs = 0;
        switch (delayUnit) {
          case "minutes": delayMs = delayValue * 60 * 1000; break;
          case "hours": delayMs = delayValue * 60 * 60 * 1000; break;
          default: delayMs = delayValue * 24 * 60 * 60 * 1000;
        }
        await ctx.db.patch(execId, {
          currentNodeId: nextNode.id,
          scheduledFor: now + delayMs,
          status: "pending",
        });
      } else {
        // Advance immediately
        await ctx.db.patch(execId, {
          currentNodeId: nextNode.id,
          scheduledFor: now,
          status: "pending",
        });
      }
      advanced++;
    }

    return { advanced, emailNodeIds, completed, skipped };
  },
});

/**
 * Debug query to see what getDueExecutions returns (workflow breakdown, node types, sample IDs)
 */
export const debugDueExecutions = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const now = Date.now();

    const dueExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending").lte("scheduledFor", now)
      )
      .take(200);

    // Group by workflowId
    const byWorkflow: Record<string, { count: number; nodeIds: string[]; sampleIds: string[] }> = {};
    for (const exec of dueExecutions) {
      const wfId = exec.workflowId;
      if (!byWorkflow[wfId]) {
        byWorkflow[wfId] = { count: 0, nodeIds: [], sampleIds: [] };
      }
      byWorkflow[wfId].count++;
      const nodeId = exec.currentNodeId || "unknown";
      if (!byWorkflow[wfId].nodeIds.includes(nodeId)) {
        byWorkflow[wfId].nodeIds.push(nodeId);
      }
      if (byWorkflow[wfId].sampleIds.length < 3) {
        byWorkflow[wfId].sampleIds.push(exec._id);
      }
    }

    return {
      total: dueExecutions.length,
      byWorkflow,
      now,
      oldestScheduledFor: dueExecutions[0]?.scheduledFor,
      newestScheduledFor: dueExecutions[dueExecutions.length - 1]?.scheduledFor,
    };
  },
});

/**
 * Debug: Check executions at a specific node to verify scheduledFor timestamps.
 */
export const debugExecutionsAtNode = internalQuery({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 10;

    const pending = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(15000);

    const atNode = pending.filter((e) => e.currentNodeId === args.nodeId);
    const samples = atNode.slice(0, limit);

    return {
      totalAtNode: atNode.length,
      now,
      samples: samples.map((e) => ({
        _id: e._id,
        currentNodeId: e.currentNodeId,
        scheduledFor: e.scheduledFor,
        scheduledForDate: e.scheduledFor ? new Date(e.scheduledFor).toISOString() : null,
        hoursUntilDue: e.scheduledFor ? ((e.scheduledFor - now) / (1000 * 60 * 60)).toFixed(1) : null,
        status: e.status,
      })),
    };
  },
});

/**
 * Mark execution as failed
 */
export const markExecutionFailed = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: "failed",
      completedAt: Date.now(),
      errorMessage: args.error,
    });
    return null;
  },
});

/**
 * Complete execution
 */
export const completeExecution = internalMutation({
  args: { executionId: v.id("workflowExecutions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Create a new workflow execution (used for workflow chaining)
 */
export const createExecution = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
    customerEmail: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    currentNodeId: v.string(),
    scheduledFor: v.number(),
  },
  returns: v.id("workflowExecutions"),
  handler: async (ctx, args) => {
    const executionId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      storeId: args.storeId,
      customerEmail: args.customerEmail,
      contactId: args.contactId,
      currentNodeId: args.currentNodeId,
      status: "pending",
      startedAt: Date.now(),
      scheduledFor: args.scheduledFor,
    });
    return executionId;
  },
});

/**
 * Cancel/remove a contact from a workflow execution
 */
export const cancelExecution = mutation({
  args: { executionId: v.id("workflowExecutions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }

    // Only cancel if not already completed or failed
    if (execution.status === "completed" || execution.status === "failed") {
      throw new Error("Cannot cancel a completed or failed execution");
    }

    await ctx.db.patch(args.executionId, {
      status: "cancelled",
      completedAt: Date.now(),
    });

    console.log(
      `[EmailWorkflows] Cancelled execution ${args.executionId} for ${execution.customerEmail}`
    );
    return null;
  },
});

/**
 * Advance execution to next node
 */
export const advanceExecution = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    nextNodeId: v.string(),
    scheduledFor: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      currentNodeId: args.nextNodeId,
      scheduledFor: args.scheduledFor,
      status: "pending",
    });
    return null;
  },
});

/**
 * Update execution data (for course cycle state tracking)
 */
export const updateExecutionData = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    executionData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      executionData: args.executionData,
    });
    return null;
  },
});

/**
 * Internal mutation to add a tag to a contact (for workflow actions)
 */
export const addTagToContactInternal = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      console.log(`[EmailWorkflows] Contact ${args.contactId} not found for tag add`);
      return null;
    }

    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      console.log(`[EmailWorkflows] Tag ${args.tagId} not found`);
      return null;
    }

    const existingTagIds = contact.tagIds || [];
    if (!existingTagIds.includes(args.tagId)) {
      await ctx.db.patch(args.contactId, {
        tagIds: [...existingTagIds, args.tagId],
      });
      console.log(`[EmailWorkflows] Added tag "${tag.name}" to contact ${contact.email}`);
    }

    return null;
  },
});

/**
 * Add a tag to a contact by name, creating the tag if it doesn't exist
 */
export const addTagByName = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    storeId: v.string(),
    tagName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      console.log(`[EmailWorkflows] Contact ${args.contactId} not found for tag add`);
      return null;
    }

    // Find or create the tag
    let tag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) =>
        q.eq("storeId", args.storeId).eq("name", args.tagName)
      )
      .first();

    if (!tag) {
      // Create the tag
      const tagId = await ctx.db.insert("emailTags", {
        storeId: args.storeId,
        name: args.tagName,
        color: "#6366f1", // Default purple
        description: `Auto-created for course cycle`,
        contactCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      tag = await ctx.db.get(tagId);
    }

    if (!tag) {
      console.log(`[EmailWorkflows] Failed to create tag "${args.tagName}"`);
      return null;
    }

    // Add tag to contact if not already present
    const existingTagIds = contact.tagIds || [];
    if (!existingTagIds.includes(tag._id)) {
      await ctx.db.patch(args.contactId, {
        tagIds: [...existingTagIds, tag._id],
      });
      // Update tag count
      await ctx.db.patch(tag._id, {
        contactCount: (tag.contactCount || 0) + 1,
        updatedAt: Date.now(),
      });
      console.log(`[EmailWorkflows] Added tag "${args.tagName}" to contact ${contact.email}`);
    }

    return null;
  },
});

/**
 * Internal mutation to remove a tag from a contact (for workflow actions)
 */
export const removeTagFromContactInternal = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      console.log(`[EmailWorkflows] Contact ${args.contactId} not found for tag remove`);
      return null;
    }

    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      console.log(`[EmailWorkflows] Tag ${args.tagId} not found`);
      return null;
    }

    const existingTagIds = contact.tagIds || [];
    if (existingTagIds.includes(args.tagId)) {
      await ctx.db.patch(args.contactId, {
        tagIds: existingTagIds.filter((t: Id<"emailTags">) => t !== args.tagId),
      });
      console.log(`[EmailWorkflows] Removed tag "${tag.name}" from contact ${contact.email}`);
    }

    return null;
  },
});

// ============================================================================
// WORKFLOW TESTING UTILITIES
// ============================================================================

/**
 * List all active workflow executions for testing/monitoring
 * Shows executions with their current status and next scheduled time
 */
export const listActiveExecutions = query({
  args: {
    storeId: v.optional(v.string()),
    email: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("workflowExecutions"),
    workflowName: v.string(),
    customerEmail: v.string(),
    status: v.string(),
    currentNodeId: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    scheduledForReadable: v.optional(v.string()),
    waitingTime: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db.query("workflowExecutions");

    // Filter by status (active = pending or running)
    const executions = await query
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "running")
        )
      )
      .order("desc")
      .take(args.limit || 50);

    // Filter by email if provided
    let filtered = executions;
    if (args.email) {
      filtered = executions.filter((e) =>
        e.customerEmail.toLowerCase().includes(args.email!.toLowerCase())
      );
    }
    if (args.storeId) {
      filtered = filtered.filter((e) => e.storeId === args.storeId);
    }

    // Get workflow names
    const results = await Promise.all(
      filtered.map(async (exec) => {
        const workflow = await ctx.db.get(exec.workflowId);
        const now = Date.now();
        const scheduledFor = exec.scheduledFor;

        let waitingTime: string | undefined;
        if (scheduledFor && scheduledFor > now) {
          const diffMs = scheduledFor - now;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          if (diffDays > 0) {
            waitingTime = `${diffDays}d ${diffHours % 24}h`;
          } else if (diffHours > 0) {
            waitingTime = `${diffHours}h ${diffMins % 60}m`;
          } else {
            waitingTime = `${diffMins}m`;
          }
        }

        return {
          _id: exec._id,
          workflowName: workflow?.name || "Unknown",
          customerEmail: exec.customerEmail,
          status: exec.status,
          currentNodeId: exec.currentNodeId,
          scheduledFor: exec.scheduledFor,
          scheduledForReadable: scheduledFor
            ? new Date(scheduledFor).toLocaleString()
            : undefined,
          waitingTime,
          createdAt: exec._creationTime,
        };
      })
    );

    return results;
  },
});

/**
 * Skip the delay for a workflow execution - immediately advances to next step
 * USE FOR TESTING ONLY - makes the execution run immediately
 */
export const skipExecutionDelay = mutation({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);

    if (!execution) {
      return { success: false, message: "Execution not found" };
    }

    if (execution.status !== "pending") {
      return {
        success: false,
        message: `Cannot skip delay for execution with status "${execution.status}"`,
      };
    }

    // Set scheduledFor to now so it runs on the next cron tick
    await ctx.db.patch(args.executionId, {
      scheduledFor: Date.now(),
    });

    return {
      success: true,
      message: `Delay skipped! Execution will run on next processor cycle (within 1 minute).`,
    };
  },
});

/**
 * Force process a specific execution immediately (for testing)
 * This triggers the workflow processor for just this execution
 */
export const forceProcessExecution = action({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // First skip any delay
      await ctx.runMutation(internal.emailWorkflows.skipExecutionDelayInternal, {
        executionId: args.executionId,
      });

      // Then process it immediately
      await ctx.runAction(internal.emailWorkflowActions.executeWorkflowNode, {
        executionId: args.executionId,
      });

      return {
        success: true,
        message: "Execution processed! Check logs for details.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to process: ${error.message}`,
      };
    }
  },
});

/**
 * Internal version of skipExecutionDelay
 */
export const skipExecutionDelayInternal = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (execution && execution.status === "pending") {
      await ctx.db.patch(args.executionId, {
        scheduledFor: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Get recently completed executions (to verify delays are firing)
 */
export const getRecentCompletedExecutions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("workflowExecutions"),
    workflowName: v.string(),
    customerEmail: v.string(),
    status: v.string(),
    completedAt: v.optional(v.number()),
    completedAtReadable: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Use index for efficient query
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(args.limit || 10);

    const results = await Promise.all(
      executions.map(async (exec) => {
        const workflow = await ctx.db.get(exec.workflowId);
        return {
          _id: exec._id,
          workflowName: workflow?.name || "Unknown",
          customerEmail: exec.customerEmail,
          status: exec.status,
          completedAt: exec.completedAt,
          completedAtReadable: exec.completedAt
            ? new Date(exec.completedAt).toLocaleString()
            : undefined,
          createdAt: exec._creationTime,
        };
      })
    );

    return results;
  },
});

/**
 * Fast-forward ALL delays for a specific email (for testing entire workflow)
 * Skips delays for all active executions for this email
 */
export const fastForwardAllDelays = mutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    skippedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("workflowExecutions")
      .filter((q) =>
        q.and(
          q.eq(q.field("customerEmail"), args.email),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    let skippedCount = 0;
    for (const exec of executions) {
      await ctx.db.patch(exec._id, {
        scheduledFor: Date.now(),
      });
      skippedCount++;
    }

    return {
      success: true,
      message:
        skippedCount > 0
          ? `Skipped delays for ${skippedCount} execution(s). They will process on the next cycle.`
          : "No pending executions found for this email.",
      skippedCount,
    };
  },
});

/**
 * Re-enroll completed executions that got stuck at a specific node
 * Resets them to pending at a new target node
 * Processes in batches to avoid OCC conflicts
 */
export const reEnrollStuckCompletedExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    stuckAtNodeId: v.string(),
    targetNodeId: v.string(),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    reEnrolled: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.batchSize || 200;

    // Find completed executions stuck at the specified node
    const stuckExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "completed")
      )
      .take(limit + 1); // Take one extra to check if there are more

    // Filter to only those stuck at the specified node
    const toReEnroll = stuckExecs
      .filter((e) => e.currentNodeId === args.stuckAtNodeId)
      .slice(0, limit);

    for (const exec of toReEnroll) {
      await ctx.db.patch(exec._id, {
        status: "pending" as const,
        currentNodeId: args.targetNodeId,
        scheduledFor: Date.now(),
        completedAt: undefined,
      });
    }

    // Check if there might be more (rough check)
    const hasMore = stuckExecs.length > limit ||
      stuckExecs.filter((e) => e.currentNodeId === args.stuckAtNodeId).length >= limit;

    return { reEnrolled: toReEnroll.length, hasMore };
  },
});

/**
 * Batch re-enrollment action - processes re-enrollment in batches with delays
 * to avoid overwhelming Convex OCC and Resend rate limits
 */
export const batchReEnrollStuckExecutions = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    stuckAtNodeId: v.string(),
    targetNodeId: v.string(),
    totalReEnrolled: v.optional(v.number()),
    batchNumber: v.optional(v.number()),
  },
  returns: v.object({
    totalReEnrolled: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let totalReEnrolled = args.totalReEnrolled || 0;
    let batchNumber = args.batchNumber || 0;
    let hasMore = true;
    const BATCHES_PER_INVOCATION = 10; // 10 batches of 200 = 2000 per invocation
    let batchesProcessed = 0;

    while (hasMore && batchesProcessed < BATCHES_PER_INVOCATION) {
      const result = await ctx.runMutation(
        internal.emailWorkflows.reEnrollStuckCompletedExecutions,
        {
          workflowId: args.workflowId,
          stuckAtNodeId: args.stuckAtNodeId,
          targetNodeId: args.targetNodeId,
          batchSize: 200,
        }
      );

      totalReEnrolled += result.reEnrolled;
      hasMore = result.hasMore && result.reEnrolled > 0;
      batchNumber++;
      batchesProcessed++;

      console.log(
        `[ReEnroll] Batch ${batchNumber}: re-enrolled ${result.reEnrolled}, total: ${totalReEnrolled}, hasMore: ${hasMore}`
      );

      if (!hasMore) break;
    }

    if (hasMore) {
      // Schedule next batch with a 2-second delay to let the cron process some
      await ctx.scheduler.runAfter(
        2000,
        internal.emailWorkflows.batchReEnrollStuckExecutions,
        {
          workflowId: args.workflowId,
          stuckAtNodeId: args.stuckAtNodeId,
          targetNodeId: args.targetNodeId,
          totalReEnrolled,
          batchNumber,
        }
      );

      return {
        totalReEnrolled,
        message: `Re-enrolled ${totalReEnrolled} so far (batch ${batchNumber}), continuing in background...`,
      };
    }

    return {
      totalReEnrolled,
      message: `Done! Re-enrolled ${totalReEnrolled} executions to target node. The cron will process them at ~3000/hour.`,
    };
  },
});

/**
 * Diagnostic: Get sample completed executions for a workflow
 * Shows timing to help verify emails were actually sent
 */
export const getSampleCompletedExecutions = internalQuery({
  args: {
    workflowId: v.id("emailWorkflows"),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const execs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "completed")
      )
      .take(args.limit || 5);

    return execs.map((e) => ({
      id: e._id,
      email: e.customerEmail,
      createdAt: new Date(e._creationTime).toISOString(),
      startedAt: e.startedAt ? new Date(e.startedAt).toISOString() : null,
      completedAt: e.completedAt ? new Date(e.completedAt).toISOString() : null,
      currentNodeId: e.currentNodeId,
      durationHours: e.completedAt && e.startedAt
        ? ((e.completedAt - e.startedAt) / 3600000).toFixed(1)
        : e.completedAt
          ? ((e.completedAt - e._creationTime) / 3600000).toFixed(1)
          : null,
    }));
  },
});

/**
 * Diagnostic: List all workflows with their pending/failed execution counts
 * Used to quickly find which workflow has stuck executions
 */
export const listAllWorkflowsWithCounts = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const workflows = await ctx.db.query("emailWorkflows").take(100);

    const results = [];
    for (const wf of workflows) {
      const pending = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wf._id).eq("status", "pending")
        )
        .take(1);

      const failed = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wf._id).eq("status", "failed")
        )
        .take(1);

      const running = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wf._id).eq("status", "running")
        )
        .take(1);

      // Only show workflows that have active/failed executions
      if (pending.length > 0 || failed.length > 0 || running.length > 0) {
        results.push({
          id: wf._id,
          name: wf.name,
          storeId: wf.storeId,
          isActive: wf.isActive,
          hasPending: pending.length > 0,
          hasFailed: failed.length > 0,
          hasRunning: running.length > 0,
        });
      }
    }

    return results;
  },
});

/**
 * Diagnostic: Get execution status breakdown for a workflow
 * Shows counts by status and by node, plus failed execution details
 */
export const getWorkflowExecutionDiagnostics = internalQuery({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return { error: "Workflow not found" };

    // Build node map for readable output
    const nodes = (workflow.nodes || []) as Array<{ id: string; type: string; data?: any }>;
    const nodeMap = new Map<string, { type: string; label: string }>();
    for (const n of nodes) {
      nodeMap.set(n.id, { type: n.type, label: n.data?.label || n.data?.subject || n.type });
    }

    const statusCounts: Record<string, number> = {};
    const nodeBreakdown: Record<string, Record<string, number>> = {};
    const failedSamples: Array<{ email: string; error?: string; nodeId?: string }> = [];

    // Count by status
    for (const status of ["pending", "running", "completed", "failed", "cancelled"] as const) {
      const execs = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", args.workflowId).eq("status", status)
        )
        .take(15000);

      statusCounts[status] = execs.length;

      // Build node breakdown for active statuses
      if (status === "pending" || status === "running" || status === "failed") {
        for (const exec of execs) {
          const nodeId = exec.currentNodeId || "unknown";
          const nodeInfo = nodeMap.get(nodeId);
          // Sanitize label to only contain valid ASCII chars for Convex field names
          const rawLabel = nodeInfo ? `${nodeInfo.type}_${nodeInfo.label}` : nodeId;
          const nodeLabel = rawLabel.replace(/[^a-zA-Z0-9_\-. ]/g, "").substring(0, 60);

          if (!nodeBreakdown[status]) nodeBreakdown[status] = {};
          nodeBreakdown[status][nodeLabel] = (nodeBreakdown[status][nodeLabel] || 0) + 1;

          // Collect failed samples
          if (status === "failed" && failedSamples.length < 10) {
            failedSamples.push({
              email: exec.customerEmail,
              error: exec.errorMessage,
              nodeId: exec.currentNodeId,
            });
          }
        }
      }
    }

    return {
      workflowName: workflow.name,
      statusCounts,
      nodeBreakdown,
      failedSamples,
      totalNodes: nodes.length,
      nodeList: nodes.map((n) => `${n.id} (${n.type}: ${n.data?.label || n.data?.subject || ""})`),
    };
  },
});

/**
 * Resume failed executions for a workflow - resets them to pending
 * so the cron will pick them up again
 */
export const resumeFailedExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    batchSize: v.optional(v.number()),
    resetToNodeId: v.optional(v.string()),
  },
  returns: v.object({
    resumed: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.batchSize || 500;

    const failedExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "failed")
      )
      .take(limit);

    let resumed = 0;
    for (const exec of failedExecs) {
      const patch: any = {
        status: "pending" as const,
        scheduledFor: Date.now(),
        errorMessage: undefined,
        completedAt: undefined,
      };

      if (args.resetToNodeId) {
        patch.currentNodeId = args.resetToNodeId;
      }

      await ctx.db.patch(exec._id, patch);
      resumed++;
    }

    // Check if there are more
    const moreExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "failed")
      )
      .take(1);

    return { resumed, hasMore: moreExecs.length > 0 };
  },
});

/**
 * Batch resume action - handles resuming large numbers of failed executions
 * Processes in batches to avoid OCC conflicts
 */
export const batchResumeFailedExecutions = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    resetToNodeId: v.optional(v.string()),
    totalResumed: v.optional(v.number()),
  },
  returns: v.object({
    totalResumed: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let totalResumed = args.totalResumed || 0;
    let hasMore = true;
    let batchCount = 0;
    const MAX_BATCHES = 20; // Process 20 batches per invocation

    while (hasMore && batchCount < MAX_BATCHES) {
      const result = await ctx.runMutation(internal.emailWorkflows.resumeFailedExecutions, {
        workflowId: args.workflowId,
        batchSize: 200,
        resetToNodeId: args.resetToNodeId,
      });

      totalResumed += result.resumed;
      hasMore = result.hasMore;
      batchCount++;

      console.log(`[ResumeFailedExecutions] Batch ${batchCount}: resumed ${result.resumed}, total: ${totalResumed}`);
    }

    if (hasMore) {
      // Schedule continuation
      await ctx.scheduler.runAfter(500, internal.emailWorkflows.batchResumeFailedExecutions, {
        workflowId: args.workflowId,
        resetToNodeId: args.resetToNodeId,
        totalResumed,
      });

      return {
        totalResumed,
        message: `Resumed ${totalResumed} so far, continuing in background...`,
      };
    }

    return {
      totalResumed,
      message: `Successfully resumed ${totalResumed} failed executions. They will be processed by the cron.`,
    };
  },
});

/**
 * Get upcoming scheduled executions with timing info
 * Shows what's queued to run in the future
 */
export const getScheduledExecutions = query({
  args: {
    workflowId: v.optional(v.id("emailWorkflows")),
    storeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("workflowExecutions"),
      workflowName: v.string(),
      customerEmail: v.string(),
      status: v.string(),
      currentNodeType: v.optional(v.string()),
      currentNodeLabel: v.optional(v.string()),
      scheduledFor: v.optional(v.number()),
      scheduledForReadable: v.string(),
      timeUntilExecution: v.string(),
      startedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 100;

    // Get pending executions scheduled for the future
    let pendingExecs;
    if (args.workflowId) {
      const wfId = args.workflowId;
      pendingExecs = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId_status", (q) =>
          q.eq("workflowId", wfId).eq("status", "pending")
        )
        .take(limit);
    } else {
      pendingExecs = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_status_scheduledFor", (q) => q.eq("status", "pending"))
        .take(limit);
    }

    if (args.storeId) {
      pendingExecs = pendingExecs.filter((e) => e.storeId === args.storeId);
    }

    // Get workflow info for names
    const workflowCache = new Map<string, any>();

    const results = await Promise.all(
      pendingExecs.map(async (exec) => {
        const wfId = exec.workflowId as any;
        if (!workflowCache.has(wfId)) {
          workflowCache.set(wfId, await ctx.db.get(exec.workflowId));
        }
        const workflow = workflowCache.get(wfId);

        // Find current node info
        let currentNodeType: string | undefined;
        let currentNodeLabel: string | undefined;
        if (workflow && exec.currentNodeId) {
          const node = (workflow.nodes || []).find((n: any) => n.id === exec.currentNodeId);
          if (node) {
            currentNodeType = node.type;
            currentNodeLabel = node.data?.label || node.data?.subject || node.type;
          }
        }

        // Calculate time until execution
        const scheduledFor = exec.scheduledFor || now;
        const diffMs = scheduledFor - now;
        let timeUntilExecution: string;

        if (diffMs <= 0) {
          timeUntilExecution = "Overdue - waiting for processing";
        } else {
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          if (diffDays > 0) {
            timeUntilExecution = `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
          } else if (diffHours > 0) {
            timeUntilExecution = `${diffHours}h ${diffMins % 60}m`;
          } else {
            timeUntilExecution = `${diffMins}m`;
          }
        }

        return {
          _id: exec._id,
          workflowName: workflow?.name || "Unknown",
          customerEmail: exec.customerEmail,
          status: exec.status,
          currentNodeType,
          currentNodeLabel,
          scheduledFor: exec.scheduledFor,
          scheduledForReadable: exec.scheduledFor
            ? new Date(exec.scheduledFor).toISOString()
            : "Not scheduled",
          timeUntilExecution,
          startedAt: exec.startedAt,
        };
      })
    );

    // Sort by scheduledFor ascending (soonest first)
    results.sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0));

    return results;
  },
});

/**
 * Get execution status summary for a specific workflow
 * Queries each status separately to stay under Convex document read limits
 * Note: requires workflowId to avoid reading too many docs
 */
/**
 * Bulk-complete executions stuck at stop/goal nodes.
 * These only need a status flip — no emails to send.
 */
export const bulkCompleteStopNodeExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    completed: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.batchSize || 500;

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return { completed: 0, hasMore: false };

    // Find stop and goal node IDs
    const terminalNodeIds = (workflow.nodes || [])
      .filter((n: any) => n.type === "stop" || n.type === "goal")
      .map((n: any) => n.id);

    if (terminalNodeIds.length === 0) return { completed: 0, hasMore: false };

    // Get pending executions for this workflow
    const pendingExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(limit);

    let completed = 0;
    for (const exec of pendingExecs) {
      if (terminalNodeIds.includes(exec.currentNodeId)) {
        await ctx.db.patch(exec._id, {
          status: "completed",
          completedAt: Date.now(),
        });
        completed++;
      }
    }

    // Check for more
    const moreExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .filter((q) => {
        let condition = q.eq(q.field("currentNodeId"), terminalNodeIds[0]);
        for (let i = 1; i < terminalNodeIds.length; i++) {
          condition = q.or(condition, q.eq(q.field("currentNodeId"), terminalNodeIds[i]));
        }
        return condition;
      })
      .take(1);

    return { completed, hasMore: moreExecs.length > 0 };
  },
});

/**
 * Batch action to bulk-complete all stop/goal node executions for a workflow.
 * Processes in batches to avoid OCC conflicts and Convex limits.
 */
export const batchCompleteStopNodes = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    totalCompleted: v.optional(v.number()),
  },
  returns: v.object({
    totalCompleted: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let totalCompleted = args.totalCompleted || 0;
    let hasMore = true;
    let batchCount = 0;
    const MAX_BATCHES = 20;

    while (hasMore && batchCount < MAX_BATCHES) {
      const result = await ctx.runMutation(internal.emailWorkflows.bulkCompleteStopNodeExecutions, {
        workflowId: args.workflowId,
        batchSize: 300,
      });

      totalCompleted += result.completed;
      hasMore = result.hasMore;
      batchCount++;

      console.log(`[BulkComplete] Batch ${batchCount}: completed ${result.completed}, total: ${totalCompleted}`);

      if (result.completed === 0) break;
    }

    if (hasMore) {
      await ctx.scheduler.runAfter(500, internal.emailWorkflows.batchCompleteStopNodes, {
        workflowId: args.workflowId,
        totalCompleted,
      });

      return {
        totalCompleted,
        message: `Completed ${totalCompleted} so far, continuing in background...`,
      };
    }

    return {
      totalCompleted,
      message: `Bulk-completed ${totalCompleted} stop/goal node executions.`,
    };
  },
});

/**
 * Reroute pending executions stuck at a specific node to a different node.
 * Used to fix executions stuck at dead-end action/tag nodes.
 */
export const reroutePendingExecutions = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    fromNodeId: v.string(),
    toNodeId: v.string(),
    scheduledFor: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    rerouted: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.batchSize || 500;

    // Scan up to 8000 pending executions to find ones at the target node.
    // We need a large scan because the target node may not be the first ones in index order.
    const SCAN_SIZE = 8000;
    const pendingExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(SCAN_SIZE);

    const toReroute = pendingExecs
      .filter((e) => e.currentNodeId === args.fromNodeId)
      .slice(0, limit);

    for (const exec of toReroute) {
      await ctx.db.patch(exec._id, {
        currentNodeId: args.toNodeId,
        scheduledFor: args.scheduledFor || Date.now(),
      });
    }

    const totalAtNode = pendingExecs.filter(
      (e) => e.currentNodeId === args.fromNodeId
    ).length;
    const remaining = totalAtNode - toReroute.length;

    return { rerouted: toReroute.length, hasMore: remaining > 0 || pendingExecs.length >= SCAN_SIZE };
  },
});

/**
 * Batch reroute action - processes rerouting in batches
 */
export const batchReroutePendingExecutions = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    fromNodeId: v.string(),
    toNodeId: v.string(),
    scheduledFor: v.optional(v.number()),
    totalRerouted: v.optional(v.number()),
  },
  returns: v.object({
    totalRerouted: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let totalRerouted = args.totalRerouted || 0;
    let hasMore = true;
    let batchCount = 0;
    const MAX_BATCHES = 20;

    while (hasMore && batchCount < MAX_BATCHES) {
      const result = await ctx.runMutation(internal.emailWorkflows.reroutePendingExecutions, {
        workflowId: args.workflowId,
        fromNodeId: args.fromNodeId,
        toNodeId: args.toNodeId,
        scheduledFor: args.scheduledFor,
        batchSize: 100,
      });

      totalRerouted += result.rerouted;
      hasMore = result.hasMore;
      batchCount++;

      console.log(`[BatchReroute] Batch ${batchCount}: rerouted ${result.rerouted}, total: ${totalRerouted}`);

      if (result.rerouted === 0) break;

      // Wait 2s between batches to avoid OCC conflicts with the processing cron
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (hasMore) {
      await ctx.scheduler.runAfter(500, internal.emailWorkflows.batchReroutePendingExecutions, {
        workflowId: args.workflowId,
        fromNodeId: args.fromNodeId,
        toNodeId: args.toNodeId,
        scheduledFor: args.scheduledFor,
        totalRerouted,
      });

      return {
        totalRerouted,
        message: `Rerouted ${totalRerouted} so far, continuing in background...`,
      };
    }

    return {
      totalRerouted,
      message: `Rerouted ${totalRerouted} executions from ${args.fromNodeId} to ${args.toNodeId}.`,
    };
  },
});

export const getExecutionStatusSummary = query({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  returns: v.object({
    pending: v.number(),
    pendingOverdue: v.number(),
    pendingScheduledFuture: v.number(),
    running: v.number(),
    completed: v.number(),
    failed: v.number(),
    cancelled: v.number(),
    estimatedProcessingTime: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Query each status separately using the compound index (stays under read limits)
    const pendingExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "pending")
      )
      .take(15000);

    const runningExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "running")
      )
      .take(15000);

    // For completed/failed/cancelled, just get count (don't need details)
    const failedExecs = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId_status", (q) =>
        q.eq("workflowId", args.workflowId).eq("status", "failed")
      )
      .take(15000);

    let pendingOverdue = 0;
    let pendingScheduledFuture = 0;
    for (const exec of pendingExecs) {
      if (exec.scheduledFor && exec.scheduledFor <= now) {
        pendingOverdue++;
      } else if (exec.scheduledFor && exec.scheduledFor > now) {
        pendingScheduledFuture++;
      }
    }

    // Estimate processing time for overdue items (50 per minute)
    const overdueMinutes = Math.ceil(pendingOverdue / 50);
    const overdueHours = Math.floor(overdueMinutes / 60);
    const estimatedProcessingTime =
      pendingOverdue === 0
        ? "No overdue items"
        : overdueHours > 0
          ? `~${overdueHours}h ${overdueMinutes % 60}m to process ${pendingOverdue} overdue items`
          : `~${overdueMinutes}m to process ${pendingOverdue} overdue items`;

    return {
      pending: pendingExecs.length,
      pendingOverdue,
      pendingScheduledFuture,
      running: runningExecs.length,
      completed: -1, // Use -1 to indicate "not counted" (too many to query safely)
      failed: failedExecs.length,
      cancelled: -1,
      estimatedProcessingTime,
    };
  },
});
