import { v } from "convex/values";
import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Get a waiting DM workflow execution for a given sender.
 * Used by the webhook handler to check if an incoming DM should resume a workflow.
 */
export const getWaitingExecution = internalQuery({
  args: {
    senderIgsid: v.string(),
    status: v.union(v.literal("waiting"), v.literal("fulfilled"), v.literal("expired")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const waiting = await ctx.db
      .query("dmWaitingExecutions")
      .withIndex("by_senderIgsid", (q) =>
        q.eq("senderIgsid", args.senderIgsid).eq("status", args.status)
      )
      .first();

    return waiting;
  },
});

/**
 * Fulfill a waiting DM workflow execution with reply data.
 * Marks the waiting execution as fulfilled and stores the reply content.
 */
export const fulfillWaitingExecution = internalMutation({
  args: {
    waitingId: v.id("dmWaitingExecutions"),
    replyData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.waitingId, {
      status: "fulfilled" as const,
      fulfilledAt: Date.now(),
      replyData: args.replyData,
    });
    return null;
  },
});

/**
 * Create a new waiting execution entry.
 * Called by DM workflow node handlers when they need to pause and wait for a reply.
 */
export const createWaitingExecution = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    workflowId: v.id("emailWorkflows"),
    storeId: v.id("stores"),
    socialAccountId: v.id("socialAccounts"),
    senderIgsid: v.string(),
    nodeId: v.string(),
    expectedResponseType: v.union(
      v.literal("any_reply"),
      v.literal("email_reply"),
      v.literal("keyword_reply"),
      v.literal("purchase_check")
    ),
    expectedKeywords: v.optional(v.array(v.string())),
  },
  returns: v.id("dmWaitingExecutions"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("dmWaitingExecutions", {
      ...args,
      waitingSince: Date.now(),
      status: "waiting",
    });
    return id;
  },
});

/**
 * Expire stale waiting executions that have been waiting too long.
 * Intended to be called by a cleanup cron job.
 */
export const expireStaleExecutions = internalMutation({
  args: {
    maxAgeMs: v.number(), // e.g. 24 * 60 * 60 * 1000 for 24 hours
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.maxAgeMs;
    const stale = await ctx.db
      .query("dmWaitingExecutions")
      .withIndex("by_status", (q) =>
        q.eq("status", "waiting").lt("waitingSince", cutoff)
      )
      .collect();

    for (const execution of stale) {
      await ctx.db.patch(execution._id, {
        status: "expired" as const,
      });
    }

    return stale.length;
  },
});

/**
 * Find an active DM workflow that matches a comment keyword trigger.
 * Used by the webhook handler to start a new DM workflow execution
 * when someone comments with a matching keyword.
 */
/**
 * Get the Instagram social account for a store.
 * Used by DM workflow node handlers to get access token and facebookPageId.
 */
export const getSocialAccountForStore = internalQuery({
  args: {
    storeId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isConnected"), true)
        )
      )
      .first();
  },
});

/**
 * Get chat history for a DM workflow execution.
 * Used by aiConversation node to build conversation context.
 */
export const getChatHistoryByExecution = internalQuery({
  args: {
    executionId: v.id("workflowExecutions"),
    senderIgsid: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Query by conversationId which we set to "wf:{executionId}"
    const conversationId = `wf:${args.executionId}`;
    const history = await ctx.db
      .query("chatHistory")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .take(20);

    return history.map((h: any) => ({
      role: h.role,
      content: h.message,
    }));
  },
});

/**
 * Update execution data on a workflow execution (stores DM context).
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
      status: "running",
    });
    return null;
  },
});

/**
 * Update the current node on a workflow execution.
 */
export const updateCurrentNode = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      currentNodeId: args.nodeId,
    });
    return null;
  },
});

/**
 * Create a chat history entry for DM workflow conversations.
 * Unlike automations.createChatHistory, this uses workflowExecutionId instead of automationId.
 */
export const createDMChatHistory = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    senderId: v.string(),
    receiverId: v.string(),
    message: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversationId = `wf:${args.executionId}`;

    // Count existing messages for turn number
    const existing = await ctx.db
      .query("chatHistory")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    await ctx.db.insert("chatHistory", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      message: args.message,
      role: args.role,
      conversationId,
      workflowExecutionId: args.executionId,
      createdAt: Date.now(),
      turnNumber: existing.length + 1,
    });

    return null;
  },
});

/**
 * Get all waiting executions (used by expireAndResume action to read IDs).
 */
export const getStaleWaitingExecutions = internalQuery({
  args: {
    maxAgeMs: v.number(),
  },
  returns: v.array(v.object({
    waitingId: v.id("dmWaitingExecutions"),
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
  })),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.maxAgeMs;
    const stale = await ctx.db
      .query("dmWaitingExecutions")
      .withIndex("by_status", (q) =>
        q.eq("status", "waiting").lt("waitingSince", cutoff)
      )
      .take(50); // Process in batches

    return stale.map((s) => ({
      waitingId: s._id,
      executionId: s.executionId,
      nodeId: s.nodeId,
    }));
  },
});

/**
 * Mark a single waiting execution as expired.
 */
export const markWaitingExpired = internalMutation({
  args: {
    waitingId: v.id("dmWaitingExecutions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const waiting = await ctx.db.get(args.waitingId);
    if (waiting && waiting.status === "waiting") {
      await ctx.db.patch(args.waitingId, {
        status: "expired" as const,
      });
    }
    return null;
  },
});

/**
 * Action: expire stale waiting executions AND resume their workflows with timeout.
 * Called by cron every 5 minutes.
 */
export const expireAndResumeStaleExecutions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours default

    const stale = await ctx.runQuery(
      internal.dmWorkflows.getStaleWaitingExecutions,
      { maxAgeMs }
    );

    if (stale.length === 0) return null;

    console.log(`[DM Workflow] Expiring ${stale.length} stale waiting executions`);

    for (const entry of stale) {
      // Mark as expired
      await ctx.runMutation(internal.dmWorkflows.markWaitingExpired, {
        waitingId: entry.waitingId,
      });

      // Resume the workflow with a timeout signal so the condition node routes to "no"
      await ctx.scheduler.runAfter(0, internal.dmWorkflowActions.resumeExecution, {
        executionId: entry.executionId,
        nodeId: entry.nodeId,
        replyData: { type: "timeout", text: "" },
      });
    }

    return null;
  },
});

export const findWorkflowByCommentKeyword = internalQuery({
  args: {
    keyword: v.string(),
    socialAccountId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Get all active DM workflows for stores connected to this social account
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.or(
          q.eq(q.field("platformUserId"), args.socialAccountId),
          q.eq(
            q.field("platformData.instagramBusinessAccountId"),
            args.socialAccountId
          )
        )
      )
      .first();

    if (!socialAccount) return null;

    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId_workflowType", (q) =>
        q.eq("storeId", socialAccount.storeId).eq("workflowType", "dm")
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check each workflow's trigger for a keyword match
    for (const workflow of workflows) {
      if (workflow.trigger?.type !== "comment_keyword") continue;

      const triggerKeywords: string[] =
        workflow.trigger?.config?.keywords ?? [];
      const lowerKeyword = args.keyword.toLowerCase();

      const matched = triggerKeywords.some(
        (k: string) => lowerKeyword.includes(k.toLowerCase())
      );

      if (matched) return workflow;
    }

    return null;
  },
});
