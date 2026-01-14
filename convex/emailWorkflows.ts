import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
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
    v.literal("action"),
    v.literal("stop"),
    v.literal("webhook"),
    v.literal("split"),
    v.literal("notify"),
    v.literal("goal")
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

export const getNodeExecutionCounts = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const counts: Record<string, number> = {};
    for (const exec of executions) {
      if (exec.currentNodeId) {
        counts[exec.currentNodeId] = (counts[exec.currentNodeId] || 0) + 1;
      }
    }
    return counts;
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
      if (triggerConfig.productId && triggerConfig.productId !== args.productId) {
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

    for (const contactId of args.contactIds) {
      const contact = await ctx.db.get(contactId);
      if (!contact) {
        errors.push(`Contact ${contactId} not found`);
        continue;
      }

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
        skipped++;
        continue;
      }

      await ctx.db.insert("workflowExecutions", {
        workflowId: args.workflowId,
        storeId: workflow.storeId,
        contactId,
        customerEmail: contact.email,
        status: "pending",
        currentNodeId: firstNode?.id || triggerNode?.id,
        scheduledFor: now,
        executionData: { enrolledManually: true },
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
        // Check if contact has made a purchase
        const purchases = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("customerEmail"), contact.email))
          .take(1);
        return purchases.length > 0;

      case "has_opened_email":
        // Check contact activity for email opens
        const opens = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("type"), "opened"))
          .take(1);
        return opens.length > 0;

      case "has_clicked_link":
        // Check contact activity for link clicks
        const clicks = await ctx.db
          .query("emailContactActivity")
          .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
          .filter((q) => q.eq(q.field("type"), "clicked"))
          .take(1);
        return clicks.length > 0;

      case "tag_applied":
        // Check if contact has a specific tag
        return contact.tags?.includes(args.goalValue as string) ?? false;

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
 * Track A/B test result
 */
export const trackABTestResult = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactId: v.optional(v.id("emailContacts")),
    variant: v.union(v.literal("A"), v.literal("B")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Track which variant was sent for analytics
    await ctx.db.insert("analyticsEvents", {
      type: "ab_test_assigned",
      workflowId: args.workflowId,
      contactId: args.contactId,
      variant: args.variant,
      timestamp: Date.now(),
    });
    return null;
  },
});
