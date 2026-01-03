import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
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
    v.literal("action")
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
    v.literal("time_delay"),
    v.literal("date_time"),
    v.literal("customer_action")
  ),
  config: v.any(),
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
  },
  returns: v.id("emailWorkflows"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailWorkflows", {
      name: args.name,
      description: args.description,
      storeId: args.storeId,
      userId: args.userId,
      isActive: false,
      trigger: args.trigger,
      nodes: args.nodes,
      edges: args.edges,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workflowId, ...updates } = args;
    const workflow = await ctx.db.get(workflowId);
    if (!workflow) throw new Error("Workflow not found");

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
  returns: v.null(),
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    for (const execution of executions) {
      await ctx.db.delete(execution._id);
    }

    await ctx.db.delete(args.workflowId);
    return null;
  },
});

export const getWorkflow = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

export const listWorkflows = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
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

    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) =>
        q.and(q.neq(q.field("scheduledFor"), undefined), q.lte(q.field("scheduledFor"), now))
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
    customerId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activeWorkflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const leadSignupWorkflows = activeWorkflows.filter((w) => w.trigger.type === "lead_signup");

    const now = Date.now();

    for (const workflow of leadSignupWorkflows) {
      await ctx.db.insert("workflowExecutions", {
        workflowId: workflow._id,
        storeId: args.storeId,
        customerId: args.customerId,
        customerEmail: args.customerEmail,
        status: "pending",
        currentNodeId: workflow.nodes[0]?.id,
        scheduledFor: now,
        executionData: {},
      });

      await ctx.db.patch(workflow._id, {
        totalExecutions: (workflow.totalExecutions || 0) + 1,
        lastExecuted: now,
      });
    }

    return null;
  },
});
