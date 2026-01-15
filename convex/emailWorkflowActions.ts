"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Main workflow execution processor - called by cron every 5 minutes
 * Processes all due workflow executions
 */
export const processEmailWorkflowExecutions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get executions that are due to run
    const dueExecutions = await ctx.runQuery(internal.emailWorkflows.getDueExecutions, {});

    console.log(`[EmailWorkflows] Processing ${dueExecutions.length} due executions`);

    for (const execution of dueExecutions) {
      try {
        await ctx.runAction(internal.emailWorkflowActions.executeWorkflowNode, {
          executionId: execution._id,
        });
      } catch (error) {
        console.error(`[EmailWorkflows] Failed to process execution ${execution._id}:`, error);
        await ctx.runMutation(internal.emailWorkflows.markExecutionFailed, {
          executionId: execution._id,
          error: String(error),
        });
      }
    }

    return null;
  },
});

/**
 * Execute a single workflow node
 */
export const executeWorkflowNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(internal.emailWorkflows.getExecutionInternal, {
      executionId: args.executionId,
    });

    if (!execution) {
      console.error(`[EmailWorkflows] Execution ${args.executionId} not found`);
      return null;
    }

    if (execution.status === "completed" || execution.status === "failed") {
      return null;
    }

    const workflow = await ctx.runQuery(internal.emailWorkflows.getWorkflowInternal, {
      workflowId: execution.workflowId,
    });

    if (!workflow) {
      console.error(`[EmailWorkflows] Workflow not found for execution ${args.executionId}`);
      return null;
    }

    // Find current node
    const currentNode = workflow.nodes.find((n: any) => n.id === execution.currentNodeId);
    if (!currentNode) {
      console.log(`[EmailWorkflows] No current node, completing execution`);
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    console.log(`[EmailWorkflows] Executing node ${currentNode.id} (${currentNode.type}) for ${execution.customerEmail}`);

    // Execute based on node type
    if (currentNode.type === "email") {
      // Send email
      const templateId = currentNode.data?.templateId;
      const customSubject = currentNode.data?.subject;
      const customContent = currentNode.data?.content;

      if (templateId) {
        await ctx.runAction(internal.emailWorkflowActions.sendWorkflowEmail, {
          contactId: execution.contactId,
          templateId,
          storeId: execution.storeId,
          customerEmail: execution.customerEmail,
        });
      } else if (customSubject && customContent) {
        await ctx.runAction(internal.emailWorkflowActions.sendCustomWorkflowEmail, {
          contactId: execution.contactId,
          subject: customSubject,
          content: customContent,
          storeId: execution.storeId,
          customerEmail: execution.customerEmail,
        });
      }
    } else if (currentNode.type === "delay") {
      // Delay is handled by scheduling - just log
      console.log(`[EmailWorkflows] Processing delay node for ${execution.customerEmail}`);
    } else if (currentNode.type === "condition") {
      // For now, just take the "yes" path
      // TODO: Implement actual condition evaluation
      console.log(`[EmailWorkflows] Processing condition node for ${execution.customerEmail}`);
    }

    // Find next node
    const connection = workflow.edges?.find((e: any) => e.source === currentNode.id);

    if (!connection) {
      // No more nodes - complete the workflow
      console.log(`[EmailWorkflows] No next node, completing workflow for ${execution.customerEmail}`);
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    const nextNode = workflow.nodes.find((n: any) => n.id === connection.target);
    if (!nextNode) {
      await ctx.runMutation(internal.emailWorkflows.completeExecution, {
        executionId: args.executionId,
      });
      return null;
    }

    // Calculate delay if next node is a delay node OR if current was delay
    let delayMs = 0;
    if (nextNode.type === "delay" || currentNode.type === "delay") {
      const delayNode = currentNode.type === "delay" ? currentNode : nextNode;
      const delayData = delayNode.data || {};
      const delayValue = delayData.delay || delayData.delayValue || 1;
      const delayUnit = delayData.delayUnit || "days";

      switch (delayUnit) {
        case "minutes":
          delayMs = delayValue * 60 * 1000;
          break;
        case "hours":
          delayMs = delayValue * 60 * 60 * 1000;
          break;
        case "days":
          delayMs = delayValue * 24 * 60 * 60 * 1000;
          break;
        default:
          delayMs = delayValue * 24 * 60 * 60 * 1000;
      }
    }

    // Schedule next node
    const scheduledFor = Date.now() + delayMs;

    await ctx.runMutation(internal.emailWorkflows.advanceExecution, {
      executionId: args.executionId,
      nextNodeId: nextNode.id,
      scheduledFor,
    });

    console.log(`[EmailWorkflows] Advanced to node ${nextNode.id}, scheduled for ${new Date(scheduledFor).toISOString()}`);

    return null;
  },
});

/**
 * Send a custom email (not from template) from workflow
 */
export const sendCustomWorkflowEmail = internalAction({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    subject: v.string(),
    content: v.string(),
    storeId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    // Get contact info if available
    let firstName = "there";
    let name = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(internal.emailWorkflows.getContactInternal, {
        contactId: args.contactId,
      });
      if (contact) {
        firstName = contact.firstName || contact.email.split("@")[0];
        name = contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "";
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate unsubscribe URL
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.customerEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.customerEmail).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    // Personalize content
    const htmlContent = args.content
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there")
      .replace(/\{\{email\}\}/g, args.customerEmail)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const subject = args.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: args.customerEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[WorkflowEmail] Sent custom email to ${args.customerEmail}: ${subject}`);
    } catch (error) {
      console.error(`[WorkflowEmail] Failed to send custom email:`, error);
      throw error;
    }

    return null;
  },
});

/**
 * Send email from a workflow using a template
 * Used by the durable workflow system
 */
export const sendWorkflowEmail = internalAction({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    templateId: v.id("emailTemplates"),
    storeId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    // Get the template
    const template = await ctx.runQuery(internal.emailWorkflows.getEmailTemplateInternal, {
      templateId: args.templateId,
    });

    if (!template) {
      console.error(`[WorkflowEmail] Template ${args.templateId} not found`);
      return null;
    }

    // Get contact info if available
    let firstName = "there";
    let name = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(internal.emailWorkflows.getContactInternal, {
        contactId: args.contactId,
      });
      if (contact) {
        firstName = contact.firstName || contact.email.split("@")[0];
        name = contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "";
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate unsubscribe URL
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.customerEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.customerEmail).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    // Personalize content
    const htmlContent = (template.htmlContent || template.content || "")
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there")
      .replace(/\{\{email\}\}/g, args.customerEmail)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const subject = template.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: args.customerEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[WorkflowEmail] Sent email to ${args.customerEmail}: ${subject}`);
    } catch (error) {
      console.error(`[WorkflowEmail] Failed to send email:`, error);
      throw error;
    }

    return null;
  },
});
