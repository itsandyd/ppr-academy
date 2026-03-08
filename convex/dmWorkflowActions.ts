"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { decryptToken, isEncrypted } from "./lib/encryption";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Load execution + workflow + social account context needed by every node handler.
 * Returns null if any required piece is missing.
 */
async function loadNodeContext(
  ctx: any,
  executionId: any,
  nodeId: string
) {
  const execution = await ctx.runQuery(
    internal.emailWorkflows.getExecutionInternal,
    { executionId }
  );
  if (!execution || execution.status === "completed" || execution.status === "cancelled") {
    return null;
  }

  const workflow = await ctx.runQuery(
    internal.emailWorkflows.getWorkflowInternal,
    { workflowId: execution.workflowId }
  );
  if (!workflow) return null;

  const node = workflow.nodes.find((n: any) => n.id === nodeId);
  if (!node) return null;

  // Extract DM-specific context from executionData or customerEmail
  const senderIgsid =
    execution.executionData?.senderIgsid ||
    execution.customerEmail?.replace("dm:", "") ||
    null;

  if (!senderIgsid) {
    console.error(`[DM Workflow] No senderIgsid for execution ${executionId}`);
    return null;
  }

  // Get the Instagram social account — prefer the trigger node's configured account
  let socialAccount: any = null;

  // Check if the trigger node has a specific socialAccountId configured
  const triggerNode = workflow.nodes.find((n: any) => n.type === "trigger");
  const triggerSocialAccountId = triggerNode?.data?.socialAccountId;

  if (triggerSocialAccountId) {
    socialAccount = await ctx.runQuery(
      internal.dmWorkflows.getSocialAccountById,
      { socialAccountId: triggerSocialAccountId }
    );
  }

  // Fallback to the first Instagram account for the store
  if (!socialAccount) {
    socialAccount = await ctx.runQuery(
      internal.dmWorkflows.getSocialAccountForStore,
      { storeId: execution.storeId }
    );
  }

  if (!socialAccount) {
    console.error(`[DM Workflow] No Instagram account for store ${execution.storeId}`);
    return null;
  }

  // Decrypt access token
  const accessToken = isEncrypted(socialAccount.accessToken)
    ? decryptToken(socialAccount.accessToken)
    : socialAccount.accessToken;

  const facebookPageId = socialAccount.platformData?.facebookPageId;
  if (!facebookPageId) {
    console.error(`[DM Workflow] No facebookPageId for social account ${socialAccount._id}`);
    return null;
  }

  return {
    execution,
    workflow,
    node,
    senderIgsid,
    socialAccount,
    accessToken,
    facebookPageId,
    storeId: execution.storeId,
  };
}

/**
 * Find the next node by following the outgoing edge from the current node.
 * For nodes with multiple outgoing edges (conditions), use sourceHandle to pick the branch.
 */
function findNextNode(
  workflow: any,
  currentNodeId: string,
  sourceHandle?: string
): { nodeId: string; node: any } | null {
  const edge = sourceHandle
    ? workflow.edges.find(
        (e: any) => e.source === currentNodeId && e.sourceHandle === sourceHandle
      )
    : workflow.edges.find((e: any) => e.source === currentNodeId);

  if (!edge) return null;

  const node = workflow.nodes.find((n: any) => n.id === edge.target);
  if (!node) return null;

  return { nodeId: edge.target, node };
}

/**
 * Advance the workflow execution to the next node.
 * Updates currentNodeId and schedules resumeExecution.
 */
async function advanceToNextNode(
  ctx: any,
  executionId: any,
  workflow: any,
  currentNodeId: string,
  sourceHandle?: string
) {
  const next = findNextNode(workflow, currentNodeId, sourceHandle);

  if (!next) {
    // No outgoing edge — workflow is done
    await ctx.runMutation(internal.emailWorkflows.completeExecution, {
      executionId,
    });
    console.log(`[DM Workflow] Completed execution ${executionId} — no next node after ${currentNodeId}`);
    return;
  }

  await ctx.runMutation(internal.dmWorkflows.updateCurrentNode, {
    executionId,
    nodeId: next.nodeId,
  });

  await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.resumeExecution, {
    executionId,
    nodeId: next.nodeId,
    replyData: null,
  });
}

// ─────────────────────────────────────────────────────────────
// startExecution — kicks off a DM workflow
// ─────────────────────────────────────────────────────────────

/**
 * Start a new DM workflow execution.
 * Called when a trigger fires (e.g. comment keyword, dm_received, story_reply).
 */
export const startExecution = internalAction({
  args: {
    workflowId: v.id("emailWorkflows"),
    triggerData: v.object({
      type: v.string(),
      senderId: v.string(),
      senderIgsid: v.string(),
      keyword: v.optional(v.string()),
      postId: v.optional(v.string()),
      commentId: v.optional(v.string()),
      messageText: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.runQuery(
      internal.emailWorkflows.getWorkflowInternal,
      { workflowId: args.workflowId }
    );

    if (!workflow || !workflow.isActive) return null;

    // Find the trigger node and its outgoing edge
    const triggerNode = workflow.nodes.find((n: any) => n.type === "trigger");
    if (!triggerNode) return null;

    const firstEdge = workflow.edges.find(
      (e: any) => e.source === triggerNode.id
    );
    if (!firstEdge) return null;

    // Create a workflow execution
    const executionId = await ctx.runMutation(
      internal.emailWorkflows.createExecution,
      {
        workflowId: args.workflowId,
        storeId: workflow.storeId,
        customerEmail: `dm:${args.triggerData.senderIgsid}`,
        currentNodeId: firstEdge.target,
        scheduledFor: 0,
      }
    );

    // Store the DM-specific trigger context on the execution
    await ctx.runMutation(internal.dmWorkflows.updateExecutionData, {
      executionId,
      executionData: {
        senderIgsid: args.triggerData.senderIgsid,
        senderId: args.triggerData.senderId,
        triggerType: args.triggerData.type,
        keyword: args.triggerData.keyword,
        postId: args.triggerData.postId,
        commentId: args.triggerData.commentId,
      },
    });

    console.log(`[DM Workflow] Started execution ${executionId} for workflow ${args.workflowId}, sender ${args.triggerData.senderIgsid}`);

    // Schedule immediate processing of the first node
    await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.resumeExecution, {
      executionId,
      nodeId: firstEdge.target,
      replyData: null,
    });

    return null;
  },
});

// ─────────────────────────────────────────────────────────────
// resumeExecution — routes to the correct node handler
// ─────────────────────────────────────────────────────────────

/**
 * Resume a DM workflow execution at a specific node.
 * Called after a waiting execution is fulfilled or after startExecution.
 */
export const resumeExecution = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
    replyData: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(
      internal.emailWorkflows.getExecutionInternal,
      { executionId: args.executionId }
    );
    if (!execution || execution.status === "completed" || execution.status === "cancelled") {
      return null;
    }

    const workflow = await ctx.runQuery(
      internal.emailWorkflows.getWorkflowInternal,
      { workflowId: execution.workflowId }
    );
    if (!workflow) return null;

    const node = workflow.nodes.find((n: any) => n.id === args.nodeId);
    if (!node) return null;

    // Route to the appropriate node handler
    switch (node.type) {
      case "sendDM":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeSendDMNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
        });
        break;

      case "aiConversation":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeAIConversationNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
        });
        break;

      case "dmCondition":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeDMConditionNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
          replyData: args.replyData,
        });
        break;

      case "captureEmail":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeCaptureEmailNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
          replyData: args.replyData,
        });
        break;

      case "checkDMPurchase":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeCheckDMPurchaseNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
        });
        break;

      case "enterEmailWorkflow":
        await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.executeEnterEmailWorkflowNode, {
          executionId: args.executionId,
          nodeId: args.nodeId,
        });
        break;

      case "delay": {
        // Parse delay from node data and schedule resumeExecution after the delay
        const delayMs = node.data?.delayMs || node.data?.delay || 0;
        const delayUnit = node.data?.delayUnit; // "minutes", "hours", "days"
        let totalDelayMs = delayMs;

        if (delayUnit && node.data?.delayValue) {
          const val = Number(node.data.delayValue);
          switch (delayUnit) {
            case "minutes": totalDelayMs = val * 60 * 1000; break;
            case "hours": totalDelayMs = val * 60 * 60 * 1000; break;
            case "days": totalDelayMs = val * 24 * 60 * 60 * 1000; break;
            default: totalDelayMs = delayMs;
          }
        }

        // Find the next node after the delay
        const nextAfterDelay = findNextNode(workflow, args.nodeId);
        if (nextAfterDelay) {
          await ctx.runMutation(internal.dmWorkflows.updateCurrentNode, {
            executionId: args.executionId,
            nodeId: nextAfterDelay.nodeId,
          });

          console.log(`[DM Workflow] Delay node: scheduling resume in ${totalDelayMs}ms for execution ${args.executionId}`);
          await ctx.scheduler.runAfter(totalDelayMs, internal.dmWorkflowActions.resumeExecution, {
            executionId: args.executionId,
            nodeId: nextAfterDelay.nodeId,
            replyData: null,
          });
        } else {
          // No next node after delay — complete
          await ctx.runMutation(internal.emailWorkflows.completeExecution, {
            executionId: args.executionId,
          });
        }
        break;
      }

      case "stop":
        await ctx.runMutation(internal.emailWorkflows.completeExecution, {
          executionId: args.executionId,
        });
        break;

      default:
        console.warn(`DM workflow: unhandled node type "${node.type}" at node ${args.nodeId}`);
        break;
    }

    return null;
  },
});

// ─────────────────────────────────────────────────────────────
// Node handlers
// ─────────────────────────────────────────────────────────────

/**
 * Send a DM to the workflow participant.
 */
export const executeSendDMNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, senderIgsid, accessToken, facebookPageId, workflow, execution } = context;

    // Read node configuration
    let messageText: string = node.data?.messageText || node.data?.message || "";
    const includeLink: string | undefined = node.data?.includeLink;

    if (!messageText) {
      console.error(`[DM Workflow] sendDM node ${args.nodeId}: no messageText configured`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    // Simple merge tag replacement
    if (execution.executionData?.keyword) {
      messageText = messageText.replace(/\{\{keyword\}\}/gi, execution.executionData.keyword);
    }
    if (execution.executionData?.senderId) {
      messageText = messageText.replace(/\{\{senderId\}\}/gi, execution.executionData.senderId);
    }

    // Append link if configured
    if (includeLink) {
      messageText = `${messageText}\n\n${includeLink}`;
    }

    // Send the DM via sendDMInternal
    try {
      const result = await ctx.runAction(internal.socialDM.sendDMInternal, {
        platform: "instagram" as const,
        accessToken,
        recipientId: senderIgsid,
        message: messageText,
        facebookPageId,
      });

      if (!result.success) {
        console.error(`[DM Workflow] sendDM failed for execution ${args.executionId}: ${result.error}`);
      } else {
        console.log(`[DM Workflow] sendDM sent to ${senderIgsid}, messageId: ${result.messageId}`);
      }

      // Log to chatHistory
      await ctx.runMutation(internal.dmWorkflows.createDMChatHistory, {
        executionId: args.executionId,
        senderId: facebookPageId, // We (the business) are the sender
        receiverId: senderIgsid,
        message: messageText,
        role: "assistant" as const,
      });
    } catch (error: any) {
      console.error(`[DM Workflow] sendDM exception for execution ${args.executionId}:`, error.message);
    }

    // Advance to next node regardless of send success/failure
    await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
    return null;
  },
});

/**
 * Generate and send an AI-powered contextual DM reply.
 */
export const executeAIConversationNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, senderIgsid, accessToken, facebookPageId, workflow, execution, socialAccount } = context;

    // Load conversation history for this execution
    const history = await ctx.runQuery(
      internal.dmWorkflows.getChatHistoryByExecution,
      { executionId: args.executionId, senderIgsid }
    ) as Array<{ role: string; content: string }>;

    // Build the system prompt with the workflow's goal
    const goalDescription = node.data?.goalDescription || "";
    const customPrompt = node.data?.systemPrompt || node.data?.prompt || "";

    let systemPrompt = `You are a helpful AI assistant for a creator on Instagram.

Your personality:
- Friendly and conversational
- Helpful but not pushy about sales
- Keep responses SHORT and suitable for Instagram DMs (1-3 sentences max)

Guidelines:
- Always be helpful and engaging
- Never pretend to be human - if asked, say you're an AI assistant
- Use emojis sparingly for personality
- End conversations naturally`;

    if (customPrompt) {
      systemPrompt = customPrompt;
    }

    if (goalDescription) {
      systemPrompt += `\n\nCONVERSATION GOAL: ${goalDescription}
Steer the conversation naturally toward this goal without being pushy.`;
    }

    // Get social post context for better responses
    let socialPostContext = "";
    try {
      // Look up the user (store owner) for embeddings search
      const storeOwnerUserId = socialAccount.userId;
      if (storeOwnerUserId) {
        const user = await ctx.runQuery(
          internal.socialMedia.getUserByIdInternal,
          { userId: storeOwnerUserId }
        );

        if (user?.clerkId) {
          const contextResult = await ctx.runAction(
            internal.socialPostEmbeddings.searchSocialPostContext,
            {
              userId: user.clerkId,
              query: history.length > 0
                ? history[history.length - 1].content
                : (execution.executionData?.keyword || ""),
              limit: 3,
            }
          ) as { context: string; matchCount: number };

          if (contextResult.matchCount > 0) {
            socialPostContext = contextResult.context;
          }
        }
      }
    } catch (error) {
      console.warn("[DM Workflow] Could not fetch social post context:", error);
    }

    // Generate AI response using OpenAI
    let enhancedSystemPrompt = systemPrompt;
    if (socialPostContext) {
      enhancedSystemPrompt += `\n\nRELEVANT CONTENT FROM CREATOR'S POSTS:\n${socialPostContext}\n\nUse this context to give accurate, personalized responses when relevant. Don't mention that you have this context unless directly asked.`;
    }

    const messages: any[] = [
      { role: "system", content: enhancedSystemPrompt },
    ];

    // Add conversation history (limit to last 10)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // If this is the first message (no history), use the trigger keyword/message as context
    if (history.length === 0 && execution.executionData?.keyword) {
      messages.push({
        role: "user",
        content: execution.executionData.keyword,
      });
    }

    let aiResponse: string | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 150,
        temperature: 0.7,
        presence_penalty: 0.1,
      });
      aiResponse = completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("[DM Workflow] OpenAI error:", error);
    }

    if (!aiResponse) {
      console.error(`[DM Workflow] No AI response for execution ${args.executionId}`);
      // Still advance to avoid getting stuck
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    // Send the AI-generated DM
    try {
      const result = await ctx.runAction(internal.socialDM.sendDMInternal, {
        platform: "instagram" as const,
        accessToken,
        recipientId: senderIgsid,
        message: aiResponse,
        facebookPageId,
      });

      if (!result.success) {
        console.error(`[DM Workflow] AI DM send failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`[DM Workflow] AI DM send exception:`, error.message);
    }

    // Log the AI response to chatHistory
    await ctx.runMutation(internal.dmWorkflows.createDMChatHistory, {
      executionId: args.executionId,
      senderId: facebookPageId,
      receiverId: senderIgsid,
      message: aiResponse,
      role: "assistant" as const,
    });

    // Check if we should wait for a reply
    const waitForReply = node.data?.waitForReply ?? true;

    if (waitForReply) {
      // Create a waiting execution entry and pause
      const expectedResponseType =
        node.data?.expectedResponseType || "any_reply";

      await ctx.runMutation(internal.dmWorkflows.createWaitingExecution, {
        executionId: args.executionId,
        workflowId: execution.workflowId,
        storeId: socialAccount.storeId as any,
        socialAccountId: socialAccount._id,
        senderIgsid,
        nodeId: args.nodeId,
        expectedResponseType,
        expectedKeywords: node.data?.expectedKeywords,
      });

      console.log(`[DM Workflow] aiConversation waiting for reply from ${senderIgsid}, execution ${args.executionId}`);
      // Do NOT advance — workflow pauses here until fulfillWaitingExecution is called
    } else {
      // Advance immediately
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
    }

    return null;
  },
});

// ─────────────────────────────────────────────────────────────
// Remaining node handler stubs — will be fully implemented in later phases
// ─────────────────────────────────────────────────────────────

/**
 * Branch based on DM reply content (keyword matching, email detection, purchase, etc.).
 */
export const executeDMConditionNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
    replyData: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, workflow, execution, senderIgsid, socialAccount } = context;

    const conditionType: string = node.data?.conditionType || "replied";
    const keywords: string[] = node.data?.keywords || [];
    const productId: string | undefined = node.data?.productId;
    const courseId: string | undefined = node.data?.courseId;

    // Get reply data — either passed directly or from execution context
    const replyData = args.replyData || execution.executionData?.replyData;
    const replyText: string = replyData?.text || replyData?.message || "";

    // ── Conditions that require a reply ──
    const needsReply = ["replied", "contains_email", "contains_keyword"].includes(conditionType);

    if (needsReply && !replyData && conditionType !== "timeout") {
      // No reply yet — create a waiting execution and pause
      await ctx.runMutation(internal.dmWorkflows.createWaitingExecution, {
        executionId: args.executionId,
        workflowId: execution.workflowId,
        storeId: socialAccount.storeId as any,
        socialAccountId: socialAccount._id,
        senderIgsid,
        nodeId: args.nodeId,
        expectedResponseType:
          conditionType === "contains_email" ? "email_reply" :
          conditionType === "contains_keyword" ? "keyword_reply" :
          "any_reply",
        expectedKeywords: conditionType === "contains_keyword" ? keywords : undefined,
      });

      console.log(`[DM Workflow] dmCondition waiting for reply from ${senderIgsid}, conditionType=${conditionType}`);
      return null; // Pause — workflow resumes when fulfillWaitingExecution is called
    }

    // ── Evaluate the condition ──
    let conditionResult = false;

    switch (conditionType) {
      case "replied":
        conditionResult = !!replyData && replyText.length > 0;
        break;

      case "contains_email": {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        conditionResult = emailRegex.test(replyText);
        break;
      }

      case "contains_keyword":
        conditionResult = keywords.some((kw) =>
          replyText.toLowerCase().includes(kw.toLowerCase())
        );
        break;

      case "purchased": {
        // Resolve sender's email from execution context
        const capturedEmail: string | undefined =
          execution.executionData?.capturedEmail;

        if (capturedEmail && (courseId || productId)) {
          if (courseId) {
            conditionResult = await ctx.runQuery(
              internal.courseCycles.checkCoursePurchase,
              { customerEmail: capturedEmail, courseId: courseId as any }
            );
          }
          // productId-based check could be added here if a general purchase query exists
        }
        break;
      }

      case "clicked_link":
        // Instagram API does not provide link click tracking in DMs.
        // Always evaluates to false — noted in logs.
        console.log(`[DM Workflow] clicked_link condition is not trackable via Instagram API — defaulting to false`);
        conditionResult = false;
        break;

      case "timeout":
        // Timeout always routes to the "no" branch
        conditionResult = false;
        break;

      default:
        console.warn(`[DM Workflow] Unknown conditionType "${conditionType}"`);
        conditionResult = false;
    }

    // ── Route to the correct branch ──
    const sourceHandle = conditionResult ? "yes" : "no";
    console.log(`[DM Workflow] dmCondition ${conditionType} => ${sourceHandle} for execution ${args.executionId}`);

    // Store the reply data on the execution context for downstream nodes
    if (replyData) {
      const updatedData = {
        ...execution.executionData,
        replyData,
        lastReplyText: replyText,
      };
      await ctx.runMutation(internal.dmWorkflows.updateExecutionData, {
        executionId: args.executionId,
        executionData: updatedData,
      });
    }

    await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, sourceHandle);
    return null;
  },
});

/**
 * Extract an email address from a DM reply and create/update a contact.
 */
export const executeCaptureEmailNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
    replyData: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, workflow, execution, senderIgsid, socialAccount, facebookPageId, accessToken } = context;

    // Get reply data — either passed directly or from execution context
    const replyData = args.replyData || execution.executionData?.replyData;
    const replyText: string = replyData?.text || replyData?.message || "";

    // If no reply data yet, create a waiting execution and pause
    if (!replyData) {
      await ctx.runMutation(internal.dmWorkflows.createWaitingExecution, {
        executionId: args.executionId,
        workflowId: execution.workflowId,
        storeId: socialAccount.storeId as any,
        socialAccountId: socialAccount._id,
        senderIgsid,
        nodeId: args.nodeId,
        expectedResponseType: "email_reply",
      });

      console.log(`[DM Workflow] captureEmail waiting for reply from ${senderIgsid}`);
      return null;
    }

    // Extract email from the reply
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = replyText.match(emailRegex);

    if (match) {
      const capturedEmail = match[0].toLowerCase();
      const tags: string[] = node.data?.tags || ["dm-lead", "instagram-lead"];

      // Create or update the email contact
      const contactId = await ctx.runMutation(
        internal.emailContacts.createContactInternal,
        {
          storeId: execution.storeId,
          email: capturedEmail,
          source: "instagram_dm",
          tags,
          customFields: {
            instagramIgsid: senderIgsid,
            capturedVia: "dm_workflow",
            workflowExecutionId: args.executionId,
          },
        }
      );

      // Store the captured email in execution context for downstream nodes
      const updatedData = {
        ...execution.executionData,
        capturedEmail,
        contactId: contactId,
        emailCapturedAt: Date.now(),
      };
      await ctx.runMutation(internal.dmWorkflows.updateExecutionData, {
        executionId: args.executionId,
        executionData: updatedData,
      });

      // Log to chat history
      await ctx.runMutation(internal.dmWorkflows.createDMChatHistory, {
        executionId: args.executionId,
        senderId: senderIgsid,
        receiverId: facebookPageId,
        message: replyText,
        role: "user" as const,
      });

      console.log(`[DM Workflow] Captured email ${capturedEmail} from ${senderIgsid}`);

      // Advance to the next node (success path)
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, "yes");
    } else {
      // No email found in reply
      const retryOnFail = node.data?.retryOnFail ?? false;

      if (retryOnFail) {
        // Send a follow-up DM asking for the email and wait again
        const retryMessage =
          node.data?.retryMessage ||
          "I didn't catch that — could you drop your email so I can send you the info? 📧";

        try {
          await ctx.runAction(internal.socialDM.sendDMInternal, {
            platform: "instagram" as const,
            accessToken,
            recipientId: senderIgsid,
            message: retryMessage,
            facebookPageId,
          });

          await ctx.runMutation(internal.dmWorkflows.createDMChatHistory, {
            executionId: args.executionId,
            senderId: facebookPageId,
            receiverId: senderIgsid,
            message: retryMessage,
            role: "assistant" as const,
          });
        } catch (error: any) {
          console.error(`[DM Workflow] captureEmail retry DM failed:`, error.message);
        }

        // Create a new waiting execution for the retry
        await ctx.runMutation(internal.dmWorkflows.createWaitingExecution, {
          executionId: args.executionId,
          workflowId: execution.workflowId,
          storeId: socialAccount.storeId as any,
          socialAccountId: socialAccount._id,
          senderIgsid,
          nodeId: args.nodeId,
          expectedResponseType: "email_reply",
        });

        console.log(`[DM Workflow] captureEmail retry — waiting again for ${senderIgsid}`);
      } else {
        // No retry — advance to the "no email" branch
        console.log(`[DM Workflow] captureEmail: no email found in reply from ${senderIgsid}`);
        await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, "no");
      }
    }

    return null;
  },
});

/**
 * Check if the DM recipient has purchased a specific product.
 */
export const executeCheckDMPurchaseNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, workflow, execution, senderIgsid, storeId } = context;

    const productId: string | undefined = node.data?.productId;
    const courseId: string | undefined = node.data?.courseId;

    if (!productId && !courseId) {
      console.warn(`[DM Workflow] checkDMPurchase: no productId or courseId configured on node ${args.nodeId}`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, "no");
      return null;
    }

    // ── Resolve sender's email ──
    let email: string | undefined = execution.executionData?.capturedEmail;

    // Fallback: check emailContacts for a contact with matching Instagram metadata
    if (!email) {
      const contacts = await ctx.runQuery(
        internal.emailContacts.getContactByEmailInternal,
        { storeId, email: `ig:${senderIgsid}` } // won't match, but structure for future
      );
      // This won't work since ig:senderIgsid isn't an email — email must come from prior capture
    }

    // Fallback: check chatHistory for any email shared by this sender
    if (!email) {
      const history = await ctx.runQuery(
        internal.dmWorkflows.getChatHistoryByExecution,
        { executionId: args.executionId, senderIgsid }
      ) as Array<{ role: string; content: string }>;

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      for (const msg of history) {
        if (msg.role === "user") {
          const match = msg.content.match(emailRegex);
          if (match) {
            email = match[0].toLowerCase();
            break;
          }
        }
      }
    }

    if (!email) {
      console.log(`[DM Workflow] checkDMPurchase: could not resolve email for ${senderIgsid} — routing to "no"`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, "no");
      return null;
    }

    // ── Check purchase ──
    let hasPurchased = false;

    if (courseId) {
      hasPurchased = await ctx.runQuery(
        internal.courseCycles.checkCoursePurchase,
        { customerEmail: email, courseId: courseId as any }
      );
    }

    const sourceHandle = hasPurchased ? "yes" : "no";
    console.log(`[DM Workflow] checkDMPurchase: email=${email}, purchased=${hasPurchased} for execution ${args.executionId}`);

    await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId, sourceHandle);
    return null;
  },
});

/**
 * Bridge: enroll the captured contact into an email workflow.
 */
export const executeEnterEmailWorkflowNode = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await loadNodeContext(ctx, args.executionId, args.nodeId);
    if (!context) return null;

    const { node, workflow, execution, senderIgsid } = context;

    const targetWorkflowId: string | undefined = node.data?.targetWorkflowId;
    const tags: string[] = node.data?.tags || [];

    // Get the contact's email from execution context
    const capturedEmail: string | undefined = execution.executionData?.capturedEmail;

    if (!capturedEmail) {
      console.warn(`[DM Workflow] enterEmailWorkflow: no email in execution context for ${senderIgsid} — skipping bridge`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    if (!targetWorkflowId) {
      console.warn(`[DM Workflow] enterEmailWorkflow: no targetWorkflowId configured on node ${args.nodeId}`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    // Ensure the email contact exists (create if not)
    const contactId = await ctx.runMutation(
      internal.emailContacts.createContactInternal,
      {
        storeId: execution.storeId,
        email: capturedEmail,
        source: "instagram_dm",
        tags: tags.length > 0 ? tags : ["dm-lead"],
        customFields: {
          instagramIgsid: senderIgsid,
          bridgedFromDMWorkflow: args.executionId,
        },
      }
    );

    // Verify the target email workflow exists and is active
    const targetWorkflow = await ctx.runQuery(
      internal.emailWorkflows.getWorkflowInternal,
      { workflowId: targetWorkflowId as any }
    );

    if (!targetWorkflow) {
      console.error(`[DM Workflow] enterEmailWorkflow: target workflow ${targetWorkflowId} not found`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    if (!targetWorkflow.isActive) {
      console.warn(`[DM Workflow] enterEmailWorkflow: target workflow ${targetWorkflowId} is inactive — skipping enrollment`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    // Find the first non-trigger node in the target workflow
    const firstNode = targetWorkflow.nodes.find((n: any) => n.type !== "trigger");
    const startNodeId = firstNode?.id || targetWorkflow.nodes[0]?.id;

    if (!startNodeId) {
      console.error(`[DM Workflow] enterEmailWorkflow: target workflow has no nodes`);
      await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
      return null;
    }

    // Create the email workflow execution
    const emailExecutionId = await ctx.runMutation(
      internal.emailWorkflows.createExecution,
      {
        workflowId: targetWorkflowId as any,
        storeId: execution.storeId,
        customerEmail: capturedEmail,
        contactId,
        currentNodeId: startNodeId,
        scheduledFor: Date.now(),
      }
    );

    console.log(
      `[DM Workflow] Bridge: DM workflow ${args.executionId} → email workflow ${targetWorkflowId}, ` +
      `email=${capturedEmail}, emailExecutionId=${emailExecutionId}`
    );

    // Advance the DM workflow to the next node (or complete)
    await advanceToNextNode(ctx, args.executionId, workflow, args.nodeId);
    return null;
  },
});
