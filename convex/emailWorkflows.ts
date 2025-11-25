import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Workflow node and edge types
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

// Get all workflows for a store
export const getWorkflowsByStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.object({
    _id: v.id("emailWorkflows"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isActive: v.optional(v.boolean()),
    trigger: v.object({
      type: v.union(
        v.literal("lead_signup"),
        v.literal("product_purchase"),
        v.literal("time_delay"),
        v.literal("date_time"),
        v.literal("customer_action")
      ),
      config: v.any(),
    }),
    nodes: v.array(nodeValidator),
    edges: v.array(edgeValidator),
    totalExecutions: v.optional(v.number()),
    lastExecuted: v.optional(v.number()),
    avgOpenRate: v.optional(v.number()),
    avgClickRate: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// Get a specific workflow
export const getWorkflow = query({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.union(v.null(), v.object({
    _id: v.id("emailWorkflows"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isActive: v.optional(v.boolean()),
    trigger: v.object({
      type: v.union(
        v.literal("lead_signup"),
        v.literal("product_purchase"),
        v.literal("time_delay"),
        v.literal("date_time"),
        v.literal("customer_action")
      ),
      config: v.any(),
    }),
    nodes: v.array(nodeValidator),
    edges: v.array(edgeValidator),
    totalExecutions: v.optional(v.number()),
    lastExecuted: v.optional(v.number()),
    avgOpenRate: v.optional(v.number()),
    avgClickRate: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

// Create a new workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
  },
  returns: v.id("emailWorkflows"),
  handler: async (ctx, args) => {
    // Create default trigger node
    const triggerNode = {
      id: "trigger-1",
      type: "trigger" as const,
      position: { x: 100, y: 100 },
      data: {
        label: "Lead Signup",
        triggerType: "lead_signup",
      },
    };

    return await ctx.db.insert("emailWorkflows", {
      name: args.name,
      description: args.description,
      storeId: args.storeId,
      userId: args.userId,
      isActive: false,
      trigger: {
        type: "lead_signup",
        config: {},
      },
      nodes: [triggerNode],
      edges: [],
      totalExecutions: 0,
    });
  },
});

// Update workflow (save changes from React Flow)
export const updateWorkflow = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    trigger: v.optional(v.object({
      type: v.union(
        v.literal("lead_signup"),
        v.literal("product_purchase"),
        v.literal("time_delay"),
        v.literal("date_time"),
        v.literal("customer_action")
      ),
      config: v.any(),
    })),
    nodes: v.optional(v.array(nodeValidator)),
    edges: v.optional(v.array(edgeValidator)),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const { workflowId, ...updates } = args;
      
      const workflow = await ctx.db.get(workflowId);
      if (!workflow) {
        return { success: false, message: "Workflow not found" };
      }

      await ctx.db.patch(workflowId, updates);
      return { success: true, message: "Workflow updated successfully" };
    } catch (error) {
      console.error("Failed to update workflow:", error);
      return { success: false, message: "Failed to update workflow" };
    }
  },
});

// Delete workflow
export const deleteWorkflow = mutation({
  args: { workflowId: v.id("emailWorkflows") },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const workflow = await ctx.db.get(args.workflowId);
      if (!workflow) {
        return { success: false, message: "Workflow not found" };
      }

      // Delete all executions for this workflow
      const executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
        .collect();

      for (const execution of executions) {
        await ctx.db.delete(execution._id);
      }

      // Delete the workflow
      await ctx.db.delete(args.workflowId);
      return { success: true, message: "Workflow deleted successfully" };
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      return { success: false, message: "Failed to delete workflow" };
    }
  },
});

// Toggle workflow active status
export const toggleWorkflowStatus = mutation({
  args: { 
    workflowId: v.id("emailWorkflows"),
    isActive: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const workflow = await ctx.db.get(args.workflowId);
      if (!workflow) {
        return { success: false, message: "Workflow not found" };
      }

      await ctx.db.patch(args.workflowId, {
        isActive: args.isActive,
      });

      return { 
        success: true, 
        message: `Workflow ${args.isActive ? 'activated' : 'deactivated'} successfully` 
      };
    } catch (error) {
      console.error("Failed to toggle workflow status:", error);
      return { success: false, message: "Failed to update workflow status" };
    }
  },
});

// Trigger workflow execution (called when trigger conditions are met)
export const triggerWorkflow = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    customerEmail: v.string(),
    customerId: v.optional(v.string()),
    triggerData: v.any(), // Data that triggered the workflow
  },
  returns: v.object({
    success: v.boolean(),
    executionId: v.optional(v.id("workflowExecutions")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // @ts-expect-error - Convex circular type instantiation
      const apiAny: any = api;
      const workflow: any = await ctx.runQuery(apiAny.emailWorkflows.getWorkflow, {
        workflowId: args.workflowId,
      });

      if (!workflow || !workflow.isActive) {
        return { 
          success: false, 
          message: "Workflow not found or not active" 
        };
      }

      // Create workflow execution record
      const executionId: Id<"workflowExecutions"> = await ctx.runMutation(internal.emailWorkflows.createExecution, {
        workflowId: args.workflowId,
        storeId: workflow.storeId,
        customerId: args.customerId,
        customerEmail: args.customerEmail,
        executionData: args.triggerData,
      });

      // Schedule the workflow execution
      await ctx.scheduler.runAfter(0, internal.emailWorkflows.executeWorkflow, {
        executionId,
      });

      return {
        success: true,
        executionId,
        message: "Workflow execution started",
      };
    } catch (error) {
      console.error("Failed to trigger workflow:", error);
      return { success: false, message: "Failed to trigger workflow" };
    }
  },
});

// Internal function to create execution record
export const createExecution = internalMutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
    customerId: v.optional(v.string()),
    customerEmail: v.string(),
    executionData: v.any(),
  },
  returns: v.id("workflowExecutions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      storeId: args.storeId,
      customerId: args.customerId,
      customerEmail: args.customerEmail,
      status: "pending",
      startedAt: Date.now(),
      executionData: args.executionData,
    });
  },
});

// Internal function to execute workflow steps
export const executeWorkflow = internalAction({
  args: { executionId: v.id("workflowExecutions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log("🔄 Starting workflow execution:", args.executionId);
      
      // Get execution details
      const execution = await ctx.runQuery(internal.emailWorkflows.getExecution, {
        executionId: args.executionId,
      });

      if (!execution) {
        console.error("❌ Execution not found:", args.executionId);
        return null;
      }

      // Update status to running
      await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
        executionId: args.executionId,
        status: "running",
      });

      // Get the workflow
      const workflow = await ctx.runQuery(api.emailWorkflows.getWorkflow, {
        workflowId: execution.workflowId,
      });

      if (!workflow) {
        console.error("❌ Workflow not found:", execution.workflowId);
        await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
          executionId: args.executionId,
          status: "failed",
          errorMessage: "Workflow not found",
        });
        return null;
      }

      // Execute workflow nodes in sequence
      await executeWorkflowNodes(ctx, workflow, execution);

      console.log("✅ Workflow execution completed:", args.executionId);
    } catch (error) {
      console.error("❌ Workflow execution failed:", error);
      await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
        executionId: args.executionId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Helper function to execute workflow nodes
async function executeWorkflowNodes(ctx: any, workflow: any, execution: any) {
  // Find the trigger node
  const triggerNode = workflow.nodes.find((node: any) => node.type === "trigger");
  if (!triggerNode) {
    throw new Error("No trigger node found in workflow");
  }

  // Execute nodes starting from trigger
  let currentNodeId = triggerNode.id;
  const visitedNodes = new Set<string>();

  while (currentNodeId && !visitedNodes.has(currentNodeId)) {
    visitedNodes.add(currentNodeId);
    
    const currentNode = workflow.nodes.find((node: any) => node.id === currentNodeId);
    if (!currentNode) break;

    console.log(`🔄 Executing node: ${currentNode.type} (${currentNodeId})`);

    // Update current node in execution
    // @ts-expect-error - Convex circular type instantiation
    await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
      executionId: execution._id,
      currentNodeId: currentNodeId,
    });

    // Execute the node based on its type
    const nextNodeId = await executeNode(ctx, currentNode, workflow, execution);
    currentNodeId = nextNodeId;

    // Add small delay between nodes
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Mark execution as completed
  await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
    executionId: execution._id,
    status: "completed",
    completedAt: Date.now(),
  });
}

// Execute individual node
async function executeNode(ctx: any, node: any, workflow: any, execution: any): Promise<string | null> {
  switch (node.type) {
    case "trigger":
      // Trigger node - just pass through to next node
      return getNextNodeId(workflow, node.id);

    case "email":
      // Send email
      await executeEmailNode(ctx, node, execution);
      return getNextNodeId(workflow, node.id);

    case "delay":
      // Schedule delayed execution
      await executeDelayNode(ctx, node, workflow, execution);
      return null; // Stop execution here, will resume after delay

    case "condition":
      // Evaluate condition and choose path
      return executeConditionNode(node, execution);

    case "action":
      // Execute custom action
      await executeActionNode(ctx, node, execution);
      return getNextNodeId(workflow, node.id);

    default:
      console.warn(`Unknown node type: ${node.type}`);
      return getNextNodeId(workflow, node.id);
  }
}

// Get next node ID from edges
function getNextNodeId(workflow: any, currentNodeId: string): string | null {
  const edge = workflow.edges.find((edge: any) => edge.source === currentNodeId);
  return edge ? edge.target : null;
}

// Execute email node
async function executeEmailNode(ctx: any, node: any, execution: any) {
  const emailData = node.data;
  console.log(`📧 Sending workflow email: ${emailData.subject}`);

  // Use optimized workflow email function with Resend
  const result = await ctx.runAction("emails:sendWorkflowEmail" as any, {
    storeId: execution.storeId,
    customerEmail: execution.customerEmail,
    customerName: execution.executionData?.customerName,
    subject: emailData.subject || "Automated Email",
    body: emailData.body || "This is an automated email.",
    downloadUrl: emailData.downloadUrl,
    executionData: execution.executionData, // Pass through any additional data for personalization
  });

  if (!result.success) {
    console.error(`❌ Failed to send workflow email: ${result.error}`);
    throw new Error(`Email sending failed: ${result.error}`);
  }

  console.log(`✅ Workflow email sent successfully: ${result.emailId}`);
}

// Execute delay node
async function executeDelayNode(ctx: any, node: any, workflow: any, execution: any) {
  const delayData = node.data;
  const delayMs = (delayData.delay || 1) * (delayData.unit === "hours" ? 3600000 : 
                                           delayData.unit === "days" ? 86400000 : 60000); // default minutes

  console.log(`⏱️ Scheduling delay: ${delayData.delay} ${delayData.unit}`);

  // Schedule continuation of workflow after delay
  await ctx.scheduler.runAfter(delayMs, internal.emailWorkflows.continueWorkflow, {
    executionId: execution._id,
    fromNodeId: node.id,
  });
}

// Execute condition node
function executeConditionNode(node: any, execution: any): string | null {
  const conditionData = node.data;
  // Simple condition evaluation - can be expanded
  const value = execution.executionData?.[conditionData.field];
  const passes = evaluateCondition(value, conditionData.operator, conditionData.value);
  
  console.log(`🔍 Condition ${passes ? "passed" : "failed"}: ${conditionData.field} ${conditionData.operator} ${conditionData.value}`);
  
  // Return appropriate edge based on condition result
  return conditionData[passes ? "trueOutput" : "falseOutput"];
}

// Execute action node
async function executeActionNode(ctx: any, node: any, execution: any) {
  const actionData = node.data;
  console.log(`⚡ Executing action: ${actionData.actionType}`);
  
  // Can be expanded with different action types
  switch (actionData.actionType) {
    case "add_tag":
      // Add tag to customer
      break;
    case "update_field":
      // Update customer field
      break;
    default:
      console.log(`Unknown action type: ${actionData.actionType}`);
  }
}

// Simple condition evaluator
function evaluateCondition(value: any, operator: string, expected: any): boolean {
  switch (operator) {
    case "equals": return value === expected;
    case "not_equals": return value !== expected;
    case "contains": return String(value).includes(String(expected));
    case "greater_than": return Number(value) > Number(expected);
    case "less_than": return Number(value) < Number(expected);
    default: return false;
  }
}

// Continue workflow after delay
export const continueWorkflow = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    fromNodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log(`🔄 Continuing workflow from node: ${args.fromNodeId}`);
      
      const execution = await ctx.runQuery(internal.emailWorkflows.getExecution, {
        executionId: args.executionId,
      });

      if (!execution) {
        console.error("❌ Execution not found:", args.executionId);
        return null;
      }

      const workflow = await ctx.runQuery(api.emailWorkflows.getWorkflow, {
        workflowId: execution.workflowId,
      });

      if (!workflow) {
        console.error("❌ Workflow not found:", execution.workflowId);
        return null;
      }

      // Find next node after the delay
      const nextNodeId = getNextNodeId(workflow, args.fromNodeId);
      if (!nextNodeId) {
        // No more nodes, complete the workflow
        await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
          executionId: args.executionId,
          status: "completed",
          completedAt: Date.now(),
        });
        return null;
      }

      // Continue execution from next node
      const nextNode = workflow.nodes.find((node: any) => node.id === nextNodeId);
      if (nextNode) {
        const followingNodeId = await executeNode(ctx, nextNode, workflow, execution);
        if (followingNodeId) {
          // Continue with remaining nodes
          await ctx.scheduler.runAfter(0, internal.emailWorkflows.continueWorkflow, {
            executionId: args.executionId,
            fromNodeId: nextNodeId,
          });
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to continue workflow:", error);
      await ctx.runMutation(internal.emailWorkflows.updateExecutionStatus, {
        executionId: args.executionId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  },
});

// Helper queries
export const getExecution = internalQuery({
  args: { executionId: v.id("workflowExecutions") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.executionId);
  },
});

export const updateExecutionStatus = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    currentNodeId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { executionId, ...updates } = args;
    await ctx.db.patch(executionId, updates);
    return null;
  },
});

// Get workflow executions for analytics
export const getWorkflowExecutions = query({
  args: { 
    workflowId: v.id("emailWorkflows"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(limit);
  },
});

// Trigger workflows when lead signs up
export const triggerLeadSignupWorkflows = action({
  args: {
    storeId: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    productId: v.string(),
    productName: v.string(),
    source: v.string(),
    isReturningUser: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log("🎯 Searching for lead signup workflows for store:", args.storeId);
      
      // Get all active workflows for this store with lead_signup trigger
      const workflows = await ctx.runQuery(internal.emailWorkflows.getActiveLeadSignupWorkflows, {
        storeId: args.storeId,
      });

      console.log(`📋 Found ${workflows.length} active lead signup workflows`);

      for (const workflow of workflows) {
        try {
          console.log(`🚀 Triggering workflow: ${workflow.name} (${workflow._id})`);
          
          await ctx.runAction(internal.emailWorkflows.triggerWorkflow, {
            workflowId: workflow._id,
            customerEmail: args.customerEmail,
            triggerData: {
              customerName: args.customerName,
              productId: args.productId,
              productName: args.productName,
              source: args.source,
              isReturningUser: args.isReturningUser || false,
              timestamp: Date.now(),
            },
          });

          console.log(`✅ Workflow triggered successfully: ${workflow.name}`);
        } catch (workflowError) {
          console.error(`❌ Failed to trigger workflow ${workflow.name}:`, workflowError);
        }
      }
    } catch (error) {
      console.error("❌ Error in triggerLeadSignupWorkflows:", error);
    }
    
    return null;
  },
});

// Get active workflows with lead signup trigger
export const getActiveLeadSignupWorkflows = internalQuery({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("trigger.type"), "lead_signup")
        )
      )
      .collect();
  },
});
