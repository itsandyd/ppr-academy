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
 * Action to enroll ALL contacts matching a filter into a workflow
 * Can handle 47k+ contacts by processing in batches
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
    let totalEnrolled = 0;
    let totalSkipped = 0;

    // Type definitions for batch results
    type BatchResult = { contactIds: string[]; nextCursor: string | null; hasMore: boolean };
    type EnrollResult = { enrolled: number; skipped: number };

    // Process contacts in batches
    let cursor: string | undefined = undefined;
    let done = false;
    const BATCH_SIZE = 50; // Small batches for mutations

    while (!done) {
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

      // Enroll this batch (duplicate checking happens in the mutation via DB query)
      const result: EnrollResult = await ctx.runMutation(
        internal.emailWorkflows.enrollContactBatchInternal,
        {
          workflowId: args.workflowId,
          contactIds: batch.contactIds as Id<"emailContacts">[],
        }
      );

      totalEnrolled += result.enrolled;
      totalSkipped += result.skipped;

      cursor = batch.nextCursor ?? undefined;
      done = !batch.hasMore;
    }

    // Update workflow stats
    if (totalEnrolled > 0) {
      await ctx.runMutation(internal.emailWorkflows.updateWorkflowStats, {
        workflowId: args.workflowId,
        enrolledCount: totalEnrolled,
      });
    }

    return {
      enrolled: totalEnrolled,
      skipped: totalSkipped,
      message: `Enrolled ${totalEnrolled.toLocaleString()} contacts, skipped ${totalSkipped.toLocaleString()} (already enrolled or invalid)`,
    };
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
 */
export const getDueExecutions = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();

    // Get pending executions that are scheduled for now or earlier
    // Using compound index for efficient querying without filtering
    const dueExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "pending").lte("scheduledFor", now)
      )
      .take(500);

    // Also get running executions that might be stuck
    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status_scheduledFor", (q) =>
        q.eq("status", "running").lte("scheduledFor", now)
      )
      .take(100);

    return [...dueExecutions, ...runningExecutions];
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
