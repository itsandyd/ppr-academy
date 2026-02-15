"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// DEPRECATED: This processor has been replaced by emailWorkflowActions.ts
// Its cron was disabled in crons.ts due to OCC conflicts.
// Do NOT re-enable. All workflow processing goes through emailWorkflowActions.
export const processWorkflowExecutions = internalAction({
  args: {},
  handler: async () => {
    return { processed: 0, failed: 0 };
  },
});

export const processExecution = internalAction({
  args: { executionId: v.id("workflowExecutions") },
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(internal.workflowHelpers.getExecution, {
      executionId: args.executionId,
    });

    if (!execution) {
      throw new Error("Execution not found");
    }

    if (
      execution.status === "completed" ||
      execution.status === "failed" ||
      execution.status === "cancelled"
    ) {
      return;
    }

    const workflow = await ctx.runQuery(internal.workflowHelpers.getWorkflowInternal, {
      workflowId: execution.workflowId,
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      await ctx.runMutation(internal.workflowHelpers.markExecutionCancelled, {
        executionId: args.executionId,
      });
      return;
    }

    const currentNode = workflow.nodes.find((n: any) => n.id === execution.currentNodeId);

    if (!currentNode) {
      await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
        executionId: args.executionId,
      });
      return;
    }

    await ctx.runMutation(internal.workflowHelpers.updateExecutionStatus, {
      executionId: args.executionId,
      status: "running",
    });

    const suppressionResults = await ctx.runQuery(internal.emailUnsubscribe.checkSuppressionBatch, {
      emails: [execution.customerEmail],
    });
    const suppression = suppressionResults[0];

    if (suppression?.suppressed) {
      await ctx.runMutation(internal.workflowHelpers.markExecutionCancelled, {
        executionId: args.executionId,
      });
      return;
    }

    switch (currentNode.type) {
      case "trigger":
        await processNextNode(ctx, args.executionId, workflow, currentNode);
        break;

      case "email":
        await processEmailNode(ctx, args.executionId, execution, workflow, currentNode);
        break;

      case "delay":
        await processDelayNode(ctx, args.executionId, workflow, currentNode);
        break;

      case "condition":
        await processConditionNode(ctx, args.executionId, execution, workflow, currentNode);
        break;

      case "action":
        await processActionNode(ctx, args.executionId, execution, workflow, currentNode);
        break;

      case "stop":
        await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
          executionId: args.executionId,
        });
        break;

      case "webhook":
        await processWebhookNode(ctx, args.executionId, execution, workflow, currentNode);
        break;

      case "split":
        await processSplitNode(ctx, args.executionId, workflow, currentNode);
        break;

      case "notify":
        await processNotifyNode(ctx, args.executionId, execution, workflow, currentNode);
        break;

      case "goal":
        await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
          executionId: args.executionId,
        });
        break;

      default:
        await processNextNode(ctx, args.executionId, workflow, currentNode);
    }
  },
});

async function processEmailNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  execution: any,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  let subject = "";
  let htmlContent = "";

  if (nodeData.mode === "template" && nodeData.templateId) {
    const template = await ctx.runQuery(internal.workflowHelpers.getEmailTemplateInternal, {
      templateId: nodeData.templateId,
    });

    if (template) {
      subject = template.subject;
      htmlContent = template.htmlContent || template.body || "";
    }
  } else {
    subject = nodeData.subject || "No Subject";
    htmlContent = nodeData.body || "";
  }

  if (!subject || !htmlContent) {
    await processNextNode(ctx, executionId, workflow, node);
    return;
  }

  const contact = execution.contactId
    ? await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
        contactId: execution.contactId,
      })
    : null;

  const firstName = contact?.firstName || execution.customerEmail.split("@")[0];
  const lastName = contact?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  await ctx.runAction(internal.workflowActions.sendWorkflowEmail, {
    executionId,
    email: execution.customerEmail,
    firstName,
    name: fullName,
    subject,
    htmlContent,
    previewText: nodeData.previewText,
  });

  if (contact) {
    await ctx.runMutation(internal.workflowHelpers.incrementContactEmailsSent, {
      contactId: contact._id,
    });
  }

  await processNextNode(ctx, executionId, workflow, node);
}

async function processDelayNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const delayValue = nodeData.delayValue || 1;
  const delayUnit = nodeData.delayUnit || "hours";

  let delayMs = delayValue;
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
  }

  const nextEdge = workflow.edges.find((e: any) => e.source === node.id);
  const nextNodeId = nextEdge?.target;

  const scheduledFor = Date.now() + delayMs;

  await ctx.runMutation(internal.workflowHelpers.scheduleNextNode, {
    executionId,
    nextNodeId,
    scheduledFor,
  });
}

async function processConditionNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  execution: any,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const conditionType = nodeData.conditionType || "opened_email";

  let conditionMet = false;

  switch (conditionType) {
    case "opened_email":
      if (execution.contactId) {
        const contact = await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
          contactId: execution.contactId,
        });
        conditionMet = contact && contact.emailsOpened > 0;
      }
      break;

    case "clicked_link":
      if (execution.contactId) {
        const contact = await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
          contactId: execution.contactId,
        });
        conditionMet = contact && contact.emailsClicked > 0;
      }
      break;

    case "has_tag":
      if (execution.contactId) {
        const contact = await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
          contactId: execution.contactId,
        });
        const tagName = nodeData.tagName || nodeData.value;
        if (contact && contact.tagIds && tagName) {
          const tags = await ctx.runQuery(internal.workflowHelpers.getTagsByIds, {
            tagIds: contact.tagIds,
          });
          conditionMet = tags.some((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
        }
      }
      break;

    default:
      conditionMet = true;
  }

  const yesEdge = workflow.edges.find(
    (e: any) => e.source === node.id && (e.sourceHandle === "yes" || e.sourceHandle === "true")
  );
  const noEdge = workflow.edges.find(
    (e: any) => e.source === node.id && (e.sourceHandle === "no" || e.sourceHandle === "false")
  );
  const defaultEdge = workflow.edges.find((e: any) => e.source === node.id && !e.sourceHandle);

  const nextNodeId = conditionMet
    ? yesEdge?.target || defaultEdge?.target
    : noEdge?.target || defaultEdge?.target;

  if (nextNodeId) {
    await ctx.runMutation(internal.workflowHelpers.scheduleNextNode, {
      executionId,
      nextNodeId,
      scheduledFor: Date.now(),
    });
  } else {
    await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
      executionId,
    });
  }
}

async function processActionNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  execution: any,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const actionType = nodeData.actionType || "add_tag";

  if (execution.contactId) {
    switch (actionType) {
      case "add_tag":
        if (nodeData.value) {
          await ctx.runMutation(internal.workflowHelpers.addTagToContact, {
            contactId: execution.contactId,
            tagName: nodeData.value,
            storeId: execution.storeId,
          });
        }
        break;

      case "remove_tag":
        if (nodeData.value) {
          await ctx.runMutation(internal.workflowHelpers.removeTagFromContact, {
            contactId: execution.contactId,
            tagName: nodeData.value,
          });
        }
        break;
    }
  }

  await processNextNode(ctx, executionId, workflow, node);
}

async function processWebhookNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  execution: any,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const webhookUrl = nodeData.webhookUrl;

  if (webhookUrl) {
    try {
      const contact = execution.contactId
        ? await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
            contactId: execution.contactId,
          })
        : null;

      const payload = {
        event: "workflow_webhook",
        workflowId: workflow._id,
        workflowName: workflow.name,
        executionId,
        contact: contact
          ? {
              email: contact.email,
              firstName: contact.firstName,
              lastName: contact.lastName,
            }
          : { email: execution.customerEmail },
        executionData: execution.executionData,
        timestamp: Date.now(),
      };

      await ctx.runAction(internal.workflowActions.sendWebhook, {
        url: webhookUrl,
        payload: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`[Workflow] Webhook failed:`, error);
    }
  }

  await processNextNode(ctx, executionId, workflow, node);
}

async function processSplitNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const splitPercentage = nodeData.splitPercentage || 50;

  const random = Math.random() * 100;
  const pathId = random < splitPercentage ? "a" : "b";

  const nextEdge = workflow.edges.find(
    (e: any) => e.source === node.id && e.sourceHandle === pathId
  );

  if (!nextEdge) {
    const fallbackEdge = workflow.edges.find((e: any) => e.source === node.id);
    if (fallbackEdge) {
      await ctx.runMutation(internal.workflowHelpers.scheduleNextNode, {
        executionId,
        nextNodeId: fallbackEdge.target,
        scheduledFor: Date.now(),
      });
    } else {
      await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
        executionId,
      });
    }
    return;
  }

  await ctx.runMutation(internal.workflowHelpers.scheduleNextNode, {
    executionId,
    nextNodeId: nextEdge.target,
    scheduledFor: Date.now(),
  });
}

async function processNotifyNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  execution: any,
  workflow: any,
  node: any
) {
  const nodeData = node.data || {};
  const notifyMethod = nodeData.notifyMethod || "email";
  const message = nodeData.message || "Workflow notification";

  const contact = execution.contactId
    ? await ctx.runQuery(internal.workflowHelpers.getContactInternal, {
        contactId: execution.contactId,
      })
    : null;

  const notificationMessage = `${message}\n\nContact: ${contact?.email || execution.customerEmail}\nWorkflow: ${workflow.name}`;

  if (notifyMethod === "email") {
    const store = await ctx.runQuery(internal.workflowHelpers.getStoreOwnerEmail, {
      storeId: execution.storeId,
    });

    if (store?.ownerEmail) {
      await ctx.runAction(internal.workflowActions.sendNotificationEmail, {
        to: store.ownerEmail,
        subject: `[Workflow] ${workflow.name} - Notification`,
        message: notificationMessage,
      });
    }
  }

  await processNextNode(ctx, executionId, workflow, node);
}

async function processNextNode(
  ctx: any,
  executionId: Id<"workflowExecutions">,
  workflow: any,
  currentNode: any
) {
  const nextEdge = workflow.edges.find((e: any) => e.source === currentNode.id);

  if (!nextEdge) {
    await ctx.runMutation(internal.workflowHelpers.markExecutionCompleted, {
      executionId,
    });
    return;
  }

  await ctx.runMutation(internal.workflowHelpers.scheduleNextNode, {
    executionId,
    nextNodeId: nextEdge.target,
    scheduledFor: Date.now(),
  });
}

export const sendWorkflowEmail = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    email: v.string(),
    firstName: v.string(),
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    previewText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    const resend = new Resend(process.env.RESEND_API_KEY);

    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.email).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.email).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    const personalizedHtml = args.htmlContent
      .replace(/\{\{firstName\}\}/g, args.firstName)
      .replace(/\{\{first_name\}\}/g, args.firstName)
      .replace(/\{\{name\}\}/g, args.name || "there")
      .replace(/\{\{email\}\}/g, args.email)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const personalizedSubject = args.subject
      .replace(/\{\{firstName\}\}/g, args.firstName)
      .replace(/\{\{first_name\}\}/g, args.firstName)
      .replace(/\{\{name\}\}/g, args.name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    let html = personalizedHtml;
    if (args.previewText) {
      html = `<div style="display:none;max-height:0;overflow:hidden;">${args.previewText}</div>${html}`;
    }

    if (!html.includes("unsubscribe")) {
      html += `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#666;">
        <a href="${unsubscribeUrl}" style="color:#666;">Unsubscribe</a>
      </div>`;
    }

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: args.email,
      subject: personalizedSubject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

  },
});

export const sendWebhook = internalAction({
  args: {
    url: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(args.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: args.payload,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  },
});

export const sendNotificationEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");

    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: args.to,
      subject: args.subject,
      text: args.message,
      html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${args.message}</pre>`,
    });

  },
});
