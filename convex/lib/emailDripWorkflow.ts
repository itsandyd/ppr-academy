import { v } from "convex/values";
import { workflow } from "./workflow";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Durable Email Drip Workflow
 *
 * This workflow executes email drip campaigns with durable sleep.
 * Unlike the scheduler-based approach, these workflows:
 * - Survive server restarts
 * - Can pause for days/weeks with ctx.sleep()
 * - Have built-in retry logic
 * - Can be cancelled at any time
 *
 * Usage:
 * ```typescript
 * // Start a drip campaign workflow
 * const workflowRunId = await workflow.start(ctx, emailDripWorkflow, {
 *   workflowId,
 *   contactId,
 *   storeId,
 * });
 *
 * // Later, cancel if needed
 * await workflow.cancel(ctx, workflowRunId);
 * ```
 */

// Node types matching the existing workflow schema
type NodeType =
  | "trigger"
  | "email"
  | "delay"
  | "condition"
  | "action"
  | "stop"
  | "webhook"
  | "split"
  | "notify"
  | "goal";

interface WorkflowNode {
  id: string;
  type: NodeType;
  data: {
    templateId?: Id<"emailTemplates">;
    delayMinutes?: number;
    delayHours?: number;
    delayDays?: number;
    condition?: {
      field: string;
      operator: string;
      value: string;
    };
    [key: string]: unknown;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Calculate delay in milliseconds from node data
 */
function calculateDelayMs(node: WorkflowNode): number {
  const { delayMinutes = 0, delayHours = 0, delayDays = 0 } = node.data;
  return (delayMinutes * 60 + delayHours * 3600 + delayDays * 86400) * 1000;
}

/**
 * Find the next node in the workflow graph
 */
function findNextNode(
  currentNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  handle?: string
): WorkflowNode | null {
  const edge = edges.find(
    (e) =>
      e.source === currentNodeId && (handle ? e.sourceHandle === handle : true)
  );
  if (!edge) return null;
  return nodes.find((n) => n.id === edge.target) || null;
}

/**
 * Durable email drip campaign workflow
 *
 * Processes workflow nodes sequentially with durable sleeps between steps.
 * Can survive server restarts and run for days/weeks.
 */
export const emailDripWorkflow = workflow.define({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactId: v.optional(v.id("emailContacts")),
    storeId: v.string(),
    customerEmail: v.string(),
    executionData: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ completed: boolean; stoppedAt?: string }> => {
    console.log(`[DripWorkflow] Starting for ${args.customerEmail}`);

    // Get workflow definition
    const workflowDef = await ctx.runQuery(
      internal.emailWorkflows.getWorkflowInternal,
      { workflowId: args.workflowId }
    );

    if (!workflowDef) {
      console.error(`[DripWorkflow] Workflow ${args.workflowId} not found`);
      return { completed: false, stoppedAt: "workflow_not_found" };
    }

    const nodes = workflowDef.nodes as WorkflowNode[];
    const edges = workflowDef.edges as WorkflowEdge[];

    // Find first non-trigger node
    let currentNode = nodes.find((n) => n.type !== "trigger");
    if (!currentNode) {
      console.log(`[DripWorkflow] No nodes to process`);
      return { completed: true };
    }

    // Process nodes sequentially
    while (currentNode) {
      console.log(`[DripWorkflow] Processing node: ${currentNode.type} (${currentNode.id})`);

      switch (currentNode.type) {
        case "email": {
          // Send email via the existing email action
          if (currentNode.data.templateId) {
            await ctx.runAction(internal.dripCampaignActions.sendDripEmail, {
              contactId: args.contactId,
              templateId: currentNode.data.templateId,
              storeId: args.storeId,
              customerEmail: args.customerEmail,
            });
            console.log(`[DripWorkflow] Sent email to ${args.customerEmail}`);
          }
          break;
        }

        case "delay": {
          // DURABLE SLEEP - survives server restarts!
          const delayMs = calculateDelayMs(currentNode);
          if (delayMs > 0) {
            console.log(`[DripWorkflow] Sleeping for ${delayMs}ms (${delayMs / 3600000} hours)`);
            await ctx.sleep(delayMs);
            console.log(`[DripWorkflow] Woke up after delay`);
          }
          break;
        }

        case "condition": {
          // Evaluate condition and choose path
          const conditionResult = await ctx.runQuery(
            internal.emailWorkflows.evaluateCondition,
            {
              contactId: args.contactId,
              condition: currentNode.data.condition,
            }
          );

          // Find next node based on condition result
          const handle = conditionResult ? "true" : "false";
          currentNode = findNextNode(currentNode.id, nodes, edges, handle);
          continue; // Skip the default next node lookup
        }

        case "stop": {
          console.log(`[DripWorkflow] Stop node reached`);
          return { completed: true, stoppedAt: currentNode.id };
        }

        case "webhook": {
          // Call external webhook
          if (currentNode.data.webhookUrl) {
            await ctx.runAction(internal.emailWorkflows.callWebhook, {
              url: currentNode.data.webhookUrl as string,
              payload: {
                contactId: args.contactId,
                customerEmail: args.customerEmail,
                workflowId: args.workflowId,
                nodeId: currentNode.id,
              },
            });
          }
          break;
        }

        case "goal": {
          // Check if goal is achieved
          const goalAchieved = await ctx.runQuery(
            internal.emailWorkflows.checkGoalAchieved,
            {
              contactId: args.contactId,
              goalType: currentNode.data.goalType as string,
              goalValue: currentNode.data.goalValue,
            }
          );

          if (goalAchieved) {
            console.log(`[DripWorkflow] Goal achieved, stopping workflow`);
            return { completed: true, stoppedAt: `goal:${currentNode.id}` };
          }
          break;
        }

        default:
          console.log(`[DripWorkflow] Unknown node type: ${currentNode.type}`);
      }

      // Move to next node
      currentNode = findNextNode(currentNode.id, nodes, edges);
    }

    console.log(`[DripWorkflow] Workflow completed for ${args.customerEmail}`);
    return { completed: true };
  },
});

/**
 * A/B Split test workflow - runs two variants and tracks results
 */
export const abTestWorkflow = workflow.define({
  args: {
    workflowId: v.id("emailWorkflows"),
    contactId: v.optional(v.id("emailContacts")),
    storeId: v.string(),
    customerEmail: v.string(),
    variantA: v.object({
      templateId: v.id("emailTemplates"),
      delayMs: v.number(),
    }),
    variantB: v.object({
      templateId: v.id("emailTemplates"),
      delayMs: v.number(),
    }),
    splitPercentage: v.number(), // 0-100, percentage for variant A
  },
  handler: async (ctx, args): Promise<{ variant: "A" | "B"; completed: boolean }> => {
    // Deterministically assign variant based on email hash
    const hash = args.customerEmail.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const useVariantA = Math.abs(hash % 100) < args.splitPercentage;
    const variant = useVariantA ? args.variantA : args.variantB;
    const variantName = useVariantA ? "A" : "B";

    console.log(`[ABTest] ${args.customerEmail} assigned to variant ${variantName}`);

    // Wait the specified delay
    if (variant.delayMs > 0) {
      await ctx.sleep(variant.delayMs);
    }

    // Send the email
    await ctx.runAction(internal.dripCampaignActions.sendDripEmail, {
      contactId: args.contactId,
      templateId: variant.templateId,
      storeId: args.storeId,
      customerEmail: args.customerEmail,
    });

    // Track which variant was sent
    await ctx.runMutation(internal.emailWorkflows.trackABTestResult, {
      workflowId: args.workflowId,
      contactId: args.contactId,
      variant: variantName,
    });

    return { variant: variantName, completed: true };
  },
});
