import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "../_generated/api";

/**
 * Workflow manager for durable long-running processes.
 * Workflows survive server restarts and support:
 * - Durable sleep (ctx.sleep)
 * - Automatic retries
 * - Event coordination (ctx.awaitEvent)
 * - Nested workflows (ctx.runWorkflow)
 */
export const workflow = new WorkflowManager(components.workflow);

/**
 * Usage example:
 *
 * import { workflow } from "./lib/workflow";
 * import { v } from "convex/values";
 * import { internal } from "./_generated/api";
 *
 * // Define a workflow
 * export const emailDripWorkflow = workflow.define({
 *   args: {
 *     contactId: v.id("emailContacts"),
 *     workflowId: v.id("emailWorkflows"),
 *   },
 *   handler: async (ctx, args): Promise<void> => {
 *     // Step 1: Send welcome email
 *     await ctx.runAction(internal.emails.sendEmail, {
 *       contactId: args.contactId,
 *       templateId: "welcome"
 *     });
 *
 *     // Step 2: Wait 3 days (durable - survives restarts!)
 *     await ctx.sleep(3 * 24 * 60 * 60 * 1000);
 *
 *     // Step 3: Send follow-up
 *     await ctx.runAction(internal.emails.sendEmail, {
 *       contactId: args.contactId,
 *       templateId: "followup"
 *     });
 *
 *     // Step 4: Wait for user action or timeout
 *     const result = await ctx.awaitEvent("user_purchased", {
 *       timeoutMs: 7 * 24 * 60 * 60 * 1000 // 7 days
 *     });
 *
 *     if (!result) {
 *       // User didn't purchase, send reminder
 *       await ctx.runAction(internal.emails.sendEmail, {
 *         contactId: args.contactId,
 *         templateId: "reminder"
 *       });
 *     }
 *   }
 * });
 *
 * // Start a workflow from a mutation or action
 * export const startDripCampaign = mutation({
 *   args: { contactId: v.id("emailContacts"), workflowId: v.id("emailWorkflows") },
 *   handler: async (ctx, args) => {
 *     const workflowRunId = await workflow.start(ctx, emailDripWorkflow, {
 *       contactId: args.contactId,
 *       workflowId: args.workflowId
 *     });
 *     return workflowRunId;
 *   }
 * });
 */
