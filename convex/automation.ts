import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// AUTOMATION FLOW MANAGEMENT
// ============================================================================

/**
 * Create a new automation flow
 */
export const createAutomationFlow = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("keyword"),
      v.literal("comment"),
      v.literal("dm"),
      v.literal("mention"),
      v.literal("hashtag"),
      v.literal("manual")
    ),
    triggerConditions: v.object({
      keywords: v.optional(v.array(v.string())),
      platforms: v.array(v.union(
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )),
      matchType: v.union(
        v.literal("exact"),
        v.literal("contains"),
        v.literal("starts_with"),
        v.literal("regex")
      ),
      socialAccountIds: v.optional(v.array(v.id("socialAccounts"))),
    }),
    flowDefinition: v.object({
      nodes: v.array(v.object({
        id: v.string(),
        type: v.union(
          v.literal("trigger"),
          v.literal("message"),
          v.literal("delay"),
          v.literal("condition"),
          v.literal("resource"),
          v.literal("tag"),
          v.literal("webhook")
        ),
        position: v.object({ x: v.number(), y: v.number() }),
        data: v.object({
          content: v.optional(v.string()),
          mediaUrls: v.optional(v.array(v.string())),
          delayMinutes: v.optional(v.number()),
          conditionType: v.optional(v.union(
            v.literal("keyword"),
            v.literal("user_response"),
            v.literal("time_based"),
            v.literal("tag_based")
          )),
          conditionValue: v.optional(v.string()),
          resourceType: v.optional(v.union(
            v.literal("link"),
            v.literal("file"),
            v.literal("course"),
            v.literal("product")
          )),
          resourceUrl: v.optional(v.string()),
          resourceId: v.optional(v.string()),
          tagName: v.optional(v.string()),
          webhookUrl: v.optional(v.string()),
          webhookData: v.optional(v.any()),
        }),
      })),
      connections: v.array(v.object({
        from: v.string(),
        to: v.string(),
        label: v.optional(v.string()),
      })),
    }),
    settings: v.optional(v.object({
      stopOnError: v.optional(v.boolean()),
      allowMultipleRuns: v.optional(v.boolean()),
      timeoutMinutes: v.optional(v.number()),
    })),
  },
  returns: v.id("automationFlows"),
  handler: async (ctx, args) => {
    // Verify user owns the store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("_id"), args.storeId))
      .first();

    if (!store) {
      throw new Error("Store not found or unauthorized");
    }

    // Validate social accounts belong to this store
    if (args.triggerConditions.socialAccountIds) {
      for (const accountId of args.triggerConditions.socialAccountIds) {
        const account = await ctx.db.get(accountId);
        if (!account || account.storeId !== args.storeId) {
          throw new Error("Invalid social account specified");
        }
      }
    }

    // Create the automation flow
    const flowId = await ctx.db.insert("automationFlows", {
      storeId: args.storeId,
      userId: args.userId,
      name: args.name,
      description: args.description,
      isActive: false, // Start as inactive
      triggerType: args.triggerType,
      triggerConditions: args.triggerConditions,
      flowDefinition: args.flowDefinition,
      totalTriggers: 0,
      totalCompletions: 0,
      settings: {
        stopOnError: args.settings?.stopOnError ?? true,
        allowMultipleRuns: args.settings?.allowMultipleRuns ?? false,
        timeoutMinutes: args.settings?.timeoutMinutes ?? 60,
      },
    });

    return flowId;
  },
});

/**
 * Update an automation flow
 */
export const updateAutomationFlow = mutation({
  args: {
    flowId: v.id("automationFlows"),
    userId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerConditions: v.optional(v.object({
      keywords: v.optional(v.array(v.string())),
      platforms: v.array(v.union(
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )),
      matchType: v.union(
        v.literal("exact"),
        v.literal("contains"),
        v.literal("starts_with"),
        v.literal("regex")
      ),
      socialAccountIds: v.optional(v.array(v.id("socialAccounts"))),
    })),
    flowDefinition: v.optional(v.object({
      nodes: v.array(v.object({
        id: v.string(),
        type: v.union(
          v.literal("trigger"),
          v.literal("message"),
          v.literal("delay"),
          v.literal("condition"),
          v.literal("resource"),
          v.literal("tag"),
          v.literal("webhook")
        ),
        position: v.object({ x: v.number(), y: v.number() }),
        data: v.object({
          content: v.optional(v.string()),
          mediaUrls: v.optional(v.array(v.string())),
          delayMinutes: v.optional(v.number()),
          conditionType: v.optional(v.union(
            v.literal("keyword"),
            v.literal("user_response"),
            v.literal("time_based"),
            v.literal("tag_based")
          )),
          conditionValue: v.optional(v.string()),
          resourceType: v.optional(v.union(
            v.literal("link"),
            v.literal("file"),
            v.literal("course"),
            v.literal("product")
          )),
          resourceUrl: v.optional(v.string()),
          resourceId: v.optional(v.string()),
          tagName: v.optional(v.string()),
          webhookUrl: v.optional(v.string()),
          webhookData: v.optional(v.any()),
        }),
      })),
      connections: v.array(v.object({
        from: v.string(),
        to: v.string(),
        label: v.optional(v.string()),
      })),
    })),
    settings: v.optional(v.object({
      stopOnError: v.optional(v.boolean()),
      allowMultipleRuns: v.optional(v.boolean()),
      timeoutMinutes: v.optional(v.number()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    
    if (!flow) {
      throw new Error("Automation flow not found");
    }

    if (flow.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Build update object
    const updates: any = {};
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.triggerConditions !== undefined) updates.triggerConditions = args.triggerConditions;
    if (args.flowDefinition !== undefined) updates.flowDefinition = args.flowDefinition;
    if (args.settings !== undefined) {
      updates.settings = {
        ...flow.settings,
        ...args.settings,
      };
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});

/**
 * Toggle automation flow active status
 */
export const toggleAutomationFlow = mutation({
  args: {
    flowId: v.id("automationFlows"),
    userId: v.string(),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    
    if (!flow) {
      throw new Error("Automation flow not found");
    }

    if (flow.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.flowId, { isActive: args.isActive });
    return null;
  },
});

/**
 * Delete an automation flow
 */
export const deleteAutomationFlow = mutation({
  args: {
    flowId: v.id("automationFlows"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    
    if (!flow) {
      throw new Error("Automation flow not found");
    }

    if (flow.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Delete related data
    const userStates = await ctx.db
      .query("userAutomationStates")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .collect();

    const triggers = await ctx.db
      .query("automationTriggers")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .collect();

    const messages = await ctx.db
      .query("automationMessages")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .collect();

    // Delete all related records
    for (const state of userStates) {
      await ctx.db.delete(state._id);
    }
    for (const trigger of triggers) {
      await ctx.db.delete(trigger._id);
    }
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the flow
    await ctx.db.delete(args.flowId);
    return null;
  },
});

/**
 * Get automation flows for a store
 */
export const getAutomationFlows = query({
  args: {
    storeId: v.string(),
    userId: v.string(),
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("automationFlows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    if (args.isActive !== undefined) {
      const isActive = args.isActive; // Extract to local variable for type narrowing
      query = ctx.db
        .query("automationFlows")
        .withIndex("by_store_active", (q) => q.eq("storeId", args.storeId).eq("isActive", isActive));
    }

    const flows = await query.collect();
    
    // Filter by user (additional security layer)
    return flows.filter(flow => flow.userId === args.userId);
  },
});

/**
 * Get a single automation flow with details
 */
export const getAutomationFlow = query({
  args: {
    flowId: v.id("automationFlows"),
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    
    if (!flow || flow.userId !== args.userId) {
      return null;
    }

    // Get recent statistics
    const recentTriggers = await ctx.db
      .query("automationTriggers")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .order("desc")
      .take(10);

    const activeUserStates = await ctx.db
      .query("userAutomationStates")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      ...flow,
      recentTriggers,
      activeUsersCount: activeUserStates.length,
    };
  },
});

// ============================================================================
// KEYWORD MONITORING AND TRIGGER PROCESSING
// ============================================================================

/**
 * Process incoming social media webhook for automation triggers
 */
export const processSocialWebhookForAutomation = internalAction({
  args: {
    webhookId: v.id("socialWebhooks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the webhook data
    const webhook = await ctx.runQuery(internal.automation.getSocialWebhook, { webhookId: args.webhookId });
    
    if (!webhook) {
      console.error(`Webhook ${args.webhookId} not found`);
      return null;
    }

    const payload = webhook.payload;
    
    // Process different types of webhook events
    switch (webhook.eventType) {
      case "comment.created":
      case "instagram.comment":
      case "facebook.comment":
        await processCommentForTriggers(ctx, webhook, payload);
        break;
      
      case "message.received":
      case "instagram.message":
      case "twitter.message":
        await processMessageForTriggers(ctx, webhook, payload);
        break;
      
      case "mention":
        await processMentionForTriggers(ctx, webhook, payload);
        break;
    }

    return null;
  },
});

/**
 * Get webhook for processing
 */
export const getSocialWebhook = internalQuery({
  args: { webhookId: v.id("socialWebhooks") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.webhookId);
  },
});

/**
 * Manual trigger processing for testing
 */
export const testAutomationTrigger = mutation({
  args: {
    flowId: v.id("automationFlows"),
    userId: v.string(),
    testData: v.object({
      platform: v.union(
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("tiktok"),
        v.literal("linkedin")
      ),
      platformUserId: v.string(),
      platformUsername: v.optional(v.string()),
      content: v.string(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    
    if (!flow || flow.userId !== args.userId) {
      throw new Error("Automation flow not found or unauthorized");
    }

    // Allow testing on inactive flows for development
    // if (!flow.isActive) {
    //   throw new Error("Flow is not active");
    // }

    // Get a real social account for testing, or use the first available one
    let testSocialAccountId: Id<"socialAccounts">;
    
    if (flow.triggerConditions.socialAccountIds && flow.triggerConditions.socialAccountIds.length > 0) {
      testSocialAccountId = flow.triggerConditions.socialAccountIds[0];
    } else {
      // Find any social account for this store and platform
      const availableAccount = await ctx.db
        .query("socialAccounts")
        .withIndex("by_store_platform", (q) => 
          q.eq("storeId", flow.storeId).eq("platform", args.testData.platform)
        )
        .filter((q) => q.eq(q.field("isConnected"), true))
        .first();

      if (!availableAccount) {
        throw new Error(`No connected ${args.testData.platform} account found for testing. Please connect an account first.`);
      }
      
      testSocialAccountId = availableAccount._id;
    }

    // Create test trigger
    const triggerId = await ctx.db.insert("automationTriggers", {
      storeId: flow.storeId,
      automationFlowId: args.flowId,
      triggerType: "manual",
      matchedText: args.testData.content,
      platform: args.testData.platform,
      socialAccountId: testSocialAccountId,
      platformUserId: args.testData.platformUserId,
      platformUsername: args.testData.platformUsername,
      fullContent: args.testData.content,
      status: "pending",
    });

    // Schedule trigger processing
    await ctx.scheduler.runAfter(0, internal.automation.processTrigger, { triggerId });
    
    return null;
  },
});

/**
 * Process a specific trigger
 */
export const processTrigger = internalAction({
  args: {
    triggerId: v.id("automationTriggers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const trigger = await ctx.runQuery(internal.automation.getTrigger, { triggerId: args.triggerId });
    
    if (!trigger) {
      console.error(`Trigger ${args.triggerId} not found`);
      return null;
    }

    if (trigger.status !== "pending") {
      console.log(`Trigger ${args.triggerId} already processed`);
      return null;
    }

    // Mark as processing
    await ctx.runMutation(internal.automation.updateTriggerStatus, {
      triggerId: args.triggerId,
      status: "processing",
    });

    try {
      // Get the automation flow
      const flow = await ctx.runQuery(internal.automation.getAutomationFlowInternal, {
        flowId: trigger.automationFlowId,
      });

      if (!flow || !flow.isActive) {
        await ctx.runMutation(internal.automation.updateTriggerStatus, {
          triggerId: args.triggerId,
          status: "ignored",
          errorMessage: "Flow not found or inactive",
        });
        return null;
      }

      // Check if user already has an active state for this flow
      const existingState = await ctx.runQuery(internal.automation.getUserAutomationState, {
        flowId: trigger.automationFlowId,
        platform: trigger.platform,
        platformUserId: trigger.platformUserId,
      });

      if (existingState && !flow.settings.allowMultipleRuns) {
        await ctx.runMutation(internal.automation.updateTriggerStatus, {
          triggerId: args.triggerId,
          status: "ignored",
          errorMessage: "User already has active flow and multiple runs not allowed",
        });
        return null;
      }

      // Create or update user automation state
      const stateId = await ctx.runMutation(internal.automation.createOrUpdateUserState, {
        storeId: trigger.storeId,
        automationFlowId: trigger.automationFlowId,
        platform: trigger.platform,
        platformUserId: trigger.platformUserId,
        platformUsername: trigger.platformUsername,
        triggerContext: {
          triggerType: trigger.triggerType,
          originalCommentId: trigger.commentId,
          originalPostId: trigger.postId,
          triggerMessage: trigger.fullContent,
          socialAccountId: trigger.socialAccountId,
        },
      });

      // Update trigger with user state
      await ctx.runMutation(internal.automation.updateTrigger, {
        triggerId: args.triggerId,
        userAutomationStateId: stateId,
        status: "completed",
        processedAt: Date.now(),
      });

      // Start the automation flow
      await ctx.runAction(internal.automation.executeAutomationFlow, {
        userStateId: stateId,
      });

      // Update flow statistics
      await ctx.runMutation(internal.automation.incrementFlowStats, {
        flowId: trigger.automationFlowId,
        field: "totalTriggers",
      });

    } catch (error) {
      console.error(`Error processing trigger ${args.triggerId}:`, error);
      await ctx.runMutation(internal.automation.updateTriggerStatus, {
        triggerId: args.triggerId,
        status: "failed",
        errorMessage: String(error),
      });
    }

    return null;
  },
});

// ============================================================================
// HELPER FUNCTIONS FOR WEBHOOK PROCESSING
// ============================================================================

async function processCommentForTriggers(ctx: any, webhook: any, payload: any) {
  const commentText = payload.text || payload.message || payload.comment || "";
  const platformUserId = payload.user?.id || payload.from?.id || "";
  const platformUsername = payload.user?.username || payload.from?.username || "";
  
  if (!commentText || !platformUserId) {
    console.log("Insufficient comment data for trigger processing");
    return;
  }

  // First, check if this is a response to a pending confirmation
  await ctx.runAction(internal.automation.processUserResponse, {
    platform: webhook.platform,
    platformUserId,
    responseText: commentText,
  });

  // Then, find matching automation flows for new triggers
  const flows = await ctx.runQuery(internal.automation.getActiveAutomationFlows, {
    platform: webhook.platform,
    triggerTypes: ["keyword", "comment"],
    socialAccountId: webhook.socialAccountId,
  });

  for (const flow of flows) {
    if (await checkTriggerMatch(flow, commentText)) {
      // Create trigger record
      await ctx.runMutation(internal.automation.createAutomationTrigger, {
        storeId: flow.storeId,
        automationFlowId: flow._id,
        triggerType: flow.triggerType,
        keyword: getMatchedKeyword(flow, commentText),
        matchedText: commentText,
        platform: webhook.platform,
        socialAccountId: webhook.socialAccountId,
        platformUserId,
        platformUsername,
        commentId: payload.id,
        postId: payload.post?.id || payload.media?.id,
        fullContent: commentText,
        webhookId: webhook._id,
      });
    }
  }
}

async function processMessageForTriggers(ctx: any, webhook: any, payload: any) {
  const messageText = payload.text || payload.message || "";
  const platformUserId = payload.sender?.id || payload.from?.id || "";
  const platformUsername = payload.sender?.username || payload.from?.username || "";
  
  if (!messageText || !platformUserId) {
    console.log("Insufficient message data for trigger processing");
    return;
  }

  // First, check if this is a response to a pending confirmation
  await ctx.runAction(internal.automation.processUserResponse, {
    platform: webhook.platform,
    platformUserId,
    responseText: messageText,
  });

  // Then, find matching automation flows for new triggers
  const flows = await ctx.runQuery(internal.automation.getActiveAutomationFlows, {
    platform: webhook.platform,
    triggerTypes: ["keyword", "dm"],
    socialAccountId: webhook.socialAccountId,
  });

  for (const flow of flows) {
    if (await checkTriggerMatch(flow, messageText)) {
      // Create trigger record
      await ctx.runMutation(internal.automation.createAutomationTrigger, {
        storeId: flow.storeId,
        automationFlowId: flow._id,
        triggerType: flow.triggerType,
        keyword: getMatchedKeyword(flow, messageText),
        matchedText: messageText,
        platform: webhook.platform,
        socialAccountId: webhook.socialAccountId,
        platformUserId,
        platformUsername,
        messageId: payload.id,
        fullContent: messageText,
        webhookId: webhook._id,
      });
    }
  }
}

async function processMentionForTriggers(ctx: any, webhook: any, payload: any) {
  const mentionText = payload.text || payload.message || "";
  const platformUserId = payload.user?.id || payload.from?.id || "";
  const platformUsername = payload.user?.username || payload.from?.username || "";
  
  if (!mentionText || !platformUserId) {
    console.log("Insufficient mention data for trigger processing");
    return;
  }

  // Find matching automation flows
  const flows = await ctx.runQuery(internal.automation.getActiveAutomationFlows, {
    platform: webhook.platform,
    triggerTypes: ["mention"],
    socialAccountId: webhook.socialAccountId,
  });

  for (const flow of flows) {
    // Create trigger record for mentions (always match)
    await ctx.runMutation(internal.automation.createAutomationTrigger, {
      storeId: flow.storeId,
      automationFlowId: flow._id,
      triggerType: "mention",
      matchedText: mentionText,
      platform: webhook.platform,
      socialAccountId: webhook.socialAccountId,
      platformUserId,
      platformUsername,
      fullContent: mentionText,
      webhookId: webhook._id,
    });
  }
}

function checkTriggerMatch(flow: any, text: string): boolean {
  const { keywords, matchType } = flow.triggerConditions;
  
  if (!keywords || keywords.length === 0) {
    // If no keywords specified, match any content for non-keyword triggers
    return flow.triggerType !== "keyword";
  }

  const normalizedText = text.toLowerCase().trim();
  
  return keywords.some((keyword: string) => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    switch (matchType) {
      case "exact":
        return normalizedText === normalizedKeyword;
      case "contains":
        return normalizedText.includes(normalizedKeyword);
      case "starts_with":
        return normalizedText.startsWith(normalizedKeyword);
      case "regex":
        try {
          const regex = new RegExp(keyword, "i");
          return regex.test(text);
        } catch {
          return false;
        }
      default:
        return normalizedText.includes(normalizedKeyword);
    }
  });
}

function getMatchedKeyword(flow: any, text: string): string | undefined {
  const { keywords, matchType } = flow.triggerConditions;
  
  if (!keywords || keywords.length === 0) {
    return undefined;
  }

  const normalizedText = text.toLowerCase().trim();
  
  return keywords.find((keyword: string) => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    switch (matchType) {
      case "exact":
        return normalizedText === normalizedKeyword;
      case "contains":
        return normalizedText.includes(normalizedKeyword);
      case "starts_with":
        return normalizedText.startsWith(normalizedKeyword);
      case "regex":
        try {
          const regex = new RegExp(keyword, "i");
          return regex.test(text);
        } catch {
          return false;
        }
      default:
        return normalizedText.includes(normalizedKeyword);
    }
  });
}

// ============================================================================
// INTERNAL HELPER QUERIES AND MUTATIONS
// ============================================================================

/**
 * Get trigger for processing
 */
export const getTrigger = internalQuery({
  args: { triggerId: v.id("automationTriggers") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.triggerId);
  },
});

/**
 * Update trigger status
 */
export const updateTriggerStatus = internalMutation({
  args: {
    triggerId: v.id("automationTriggers"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("ignored")
    ),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };
    if (args.errorMessage) {
      updates.errorMessage = args.errorMessage;
    }
    if (args.status === "completed") {
      updates.processedAt = Date.now();
    }
    
    await ctx.db.patch(args.triggerId, updates);
    return null;
  },
});

/**
 * Update trigger with additional data
 */
export const updateTrigger = internalMutation({
  args: {
    triggerId: v.id("automationTriggers"),
    userAutomationStateId: v.optional(v.id("userAutomationStates")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("ignored")
    )),
    processedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {};
    
    if (args.userAutomationStateId) {
      updates.userAutomationStateId = args.userAutomationStateId;
    }
    if (args.status) {
      updates.status = args.status;
    }
    if (args.processedAt) {
      updates.processedAt = args.processedAt;
    }
    
    await ctx.db.patch(args.triggerId, updates);
    return null;
  },
});

/**
 * Get automation flow for internal processing
 */
export const getAutomationFlowInternal = internalQuery({
  args: { flowId: v.id("automationFlows") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.flowId);
  },
});

/**
 * Get active automation flows for trigger matching
 */
export const getActiveAutomationFlows = internalQuery({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    triggerTypes: v.array(v.string()),
    socialAccountId: v.optional(v.id("socialAccounts")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Get all active flows
    const allFlows = await ctx.db
      .query("automationFlows")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Filter by criteria
    return allFlows.filter(flow => {
      // Check if trigger type matches
      if (!args.triggerTypes.includes(flow.triggerType)) {
        return false;
      }

      // Check if platform is supported
      if (!flow.triggerConditions.platforms.includes(args.platform)) {
        return false;
      }

      // Check if specific social account is required
      if (flow.triggerConditions.socialAccountIds && 
          flow.triggerConditions.socialAccountIds.length > 0 && 
          args.socialAccountId) {
        return flow.triggerConditions.socialAccountIds.includes(args.socialAccountId);
      }

      return true;
    });
  },
});

/**
 * Create automation trigger
 */
export const createAutomationTrigger = internalMutation({
  args: {
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),
    triggerType: v.string(),
    keyword: v.optional(v.string()),
    matchedText: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    socialAccountId: v.id("socialAccounts"),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    commentId: v.optional(v.string()),
    postId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    fullContent: v.string(),
    webhookId: v.optional(v.id("socialWebhooks")),
  },
  returns: v.id("automationTriggers"),
  handler: async (ctx, args) => {
    const triggerId = await ctx.db.insert("automationTriggers", {
      ...args,
      status: "pending",
    });

    // Schedule trigger processing
    await ctx.scheduler.runAfter(0, internal.automation.processTrigger, { triggerId });

    return triggerId;
  },
});

/**
 * Get user automation state
 */
export const getUserAutomationState = internalQuery({
  args: {
    flowId: v.id("automationFlows"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAutomationStates")
      .withIndex("by_automationFlowId", (q) => q.eq("automationFlowId", args.flowId))
      .filter((q) => 
        q.and(
          q.eq(q.field("platform"), args.platform),
          q.eq(q.field("platformUserId"), args.platformUserId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
  },
});

/**
 * Create or update user automation state
 */
export const createOrUpdateUserState = internalMutation({
  args: {
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    triggerContext: v.object({
      triggerType: v.string(),
      originalCommentId: v.optional(v.string()),
      originalPostId: v.optional(v.string()),
      triggerMessage: v.optional(v.string()),
      socialAccountId: v.optional(v.id("socialAccounts")),
    }),
  },
  returns: v.id("userAutomationStates"),
  handler: async (ctx, args) => {
    // Check if user already has a state for this flow
    const existingState = await ctx.db
      .query("userAutomationStates")
      .withIndex("by_store_platform_user", (q) => 
        q.eq("storeId", args.storeId)
         .eq("platform", args.platform)
         .eq("platformUserId", args.platformUserId)
      )
      .filter((q) => q.eq(q.field("automationFlowId"), args.automationFlowId))
      .first();

    if (existingState && existingState.status === "active") {
      // Update existing state
      await ctx.db.patch(existingState._id, {
        lastActivityAt: Date.now(),
        triggerContext: args.triggerContext,
      });
      return existingState._id;
    }

    // Create new state
    return await ctx.db.insert("userAutomationStates", {
      storeId: args.storeId,
      automationFlowId: args.automationFlowId,
      platform: args.platform,
      platformUserId: args.platformUserId,
      platformUsername: args.platformUsername,
      status: "active",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      triggerContext: args.triggerContext,
      retryCount: 0,
    });
  },
});

/**
 * Increment flow statistics
 */
export const incrementFlowStats = internalMutation({
  args: {
    flowId: v.id("automationFlows"),
    field: v.union(v.literal("totalTriggers"), v.literal("totalCompletions")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flowId);
    if (!flow) return null;

    const updates: any = {};
    updates[args.field] = flow[args.field] + 1;
    
    if (args.field === "totalTriggers") {
      updates.lastTriggered = Date.now();
    }

    await ctx.db.patch(args.flowId, updates);
    return null;
  },
});

// ============================================================================
// AUTOMATION FLOW EXECUTION ENGINE
// ============================================================================

/**
 * Execute automation flow for a user
 */
export const executeAutomationFlow = internalAction({
  args: {
    userStateId: v.id("userAutomationStates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userState = await ctx.runQuery(internal.automation.getUserState, { 
      userStateId: args.userStateId 
    });
    
    if (!userState || userState.status !== "active") {
      console.error(`User state ${args.userStateId} not found or not active`);
      return null;
    }

    const flow = await ctx.runQuery(internal.automation.getAutomationFlowInternal, {
      flowId: userState.automationFlowId,
    });

    if (!flow || !flow.isActive) {
      console.error(`Flow ${userState.automationFlowId} not found or not active`);
      return null;
    }

    // Find the starting node (trigger node)
    const triggerNode = flow.flowDefinition.nodes.find((node: any) => node.type === "trigger");
    if (!triggerNode) {
      console.error(`No trigger node found in flow ${flow._id}`);
      return null;
    }

    // Find the next node after trigger
    const connection = flow.flowDefinition.connections.find((conn: any) => conn.from === triggerNode.id);
    if (!connection) {
      console.log(`No connections from trigger node in flow ${flow._id}`);
      return null;
    }

    // Execute the next node
    await executeFlowNode(ctx, args.userStateId, connection.to, flow);

    return null;
  },
});

/**
 * Get user state for flow execution
 */
export const getUserState = internalQuery({
  args: { userStateId: v.id("userAutomationStates") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userStateId);
  },
});

/**
 * Execute a specific flow node
 */
async function executeFlowNode(ctx: any, userStateId: Id<"userAutomationStates">, nodeId: string, flow: any) {
  const node = flow.flowDefinition.nodes.find((n: any) => n.id === nodeId);
  if (!node) {
    console.error(`Node ${nodeId} not found in flow ${flow._id}`);
    return;
  }

  // Update user state with current node
  await ctx.runMutation(internal.automation.updateUserStateCurrentNode, {
    userStateId,
    currentNodeId: nodeId,
  });

  console.log(`Executing node ${nodeId} of type ${node.type} for user state ${userStateId}`);

  switch (node.type) {
    case "message":
      await executeMessageNode(ctx, userStateId, node, flow);
      break;
    
    case "delay":
      await executeDelayNode(ctx, userStateId, node, flow);
      break;
    
    case "resource":
      await executeResourceNode(ctx, userStateId, node, flow);
      break;
    
    case "tag":
      await executeTagNode(ctx, userStateId, node, flow);
      break;
    
    case "condition":
      await executeConditionNode(ctx, userStateId, node, flow);
      return; // Condition node handles its own next steps
    
    case "webhook":
      await executeWebhookNode(ctx, userStateId, node, flow);
      break;
  }

  // Find and execute next node(s)
  const nextConnections = flow.flowDefinition.connections.filter((conn: any) => conn.from === nodeId);
  
  if (nextConnections.length === 0) {
    // End of flow - mark as completed
    await ctx.runMutation(internal.automation.completeUserFlow, { userStateId });
  } else if (nextConnections.length === 1) {
    // Single next node
    await executeFlowNode(ctx, userStateId, nextConnections[0].to, flow);
  }
  // Multiple connections are handled by condition nodes
}

/**
 * Execute message node - send a message to the user
 */
async function executeMessageNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const userState = await ctx.runQuery(internal.automation.getUserState, { userStateId });
  if (!userState) return;

  const { content, mediaUrls } = node.data;
  
  if (!content) {
    console.error(`Message node ${node.id} has no content`);
    return;
  }

  // Create automation message record
  await ctx.runMutation(internal.automation.createAutomationMessage, {
    storeId: userState.storeId,
    automationFlowId: userState.automationFlowId,
    userAutomationStateId: userStateId,
    nodeId: node.id,
    messageType: "dm", // Default to DM for now
    content,
    mediaUrls,
    platform: userState.platform,
    platformUserId: userState.platformUserId,
    platformUsername: userState.platformUsername,
    socialAccountId: userState.triggerContext.socialAccountId,
  });
}

/**
 * Execute delay node - schedule next node execution
 */
async function executeDelayNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const { delayMinutes } = node.data;
  const delayMs = (delayMinutes || 1) * 60 * 1000;
  
  // Find next node
  const connection = flow.flowDefinition.connections.find((conn: any) => conn.from === node.id);
  if (connection) {
    // Schedule the next node execution
    await ctx.scheduler.runAfter(delayMs, internal.automation.executeDelayedNode, {
      userStateId,
      nodeId: connection.to,
      flowId: flow._id,
    });
  }
}

/**
 * Execute resource node - send a resource to the user
 */
async function executeResourceNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const userState = await ctx.runQuery(internal.automation.getUserState, { userStateId });
  if (!userState) return;

  const { resourceType, resourceUrl, resourceId } = node.data;
  
  let message = "Here's your resource:";
  
  switch (resourceType) {
    case "link":
      message = `Here's your resource: ${resourceUrl}`;
      break;
    case "course":
      // Get course details and create access link
      message = `Access your course here: ${resourceUrl || `https://yourapp.com/courses/${resourceId}`}`;
      break;
    case "product":
      // Get product details and create access link
      message = `Check out this product: ${resourceUrl || `https://yourapp.com/products/${resourceId}`}`;
      break;
    case "file":
      message = `Download your file: ${resourceUrl}`;
      break;
  }

  // Create automation message record
  await ctx.runMutation(internal.automation.createAutomationMessage, {
    storeId: userState.storeId,
    automationFlowId: userState.automationFlowId,
    userAutomationStateId: userStateId,
    nodeId: node.id,
    messageType: "dm",
    content: message,
    platform: userState.platform,
    platformUserId: userState.platformUserId,
    platformUsername: userState.platformUsername,
    socialAccountId: userState.triggerContext.socialAccountId,
  });
}

/**
 * Execute tag node - add tag to user
 */
async function executeTagNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const { tagName } = node.data;
  
  if (!tagName) return;

  await ctx.runMutation(internal.automation.addUserTag, {
    userStateId,
    tagName,
  });
}

/**
 * Execute condition node - handle conditional branching
 */
async function executeConditionNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const { conditionType, conditionValue } = node.data;
  
  let conditionMet = false;
  
  switch (conditionType) {
    case "user_response":
      // For user_response conditions, we need to wait for actual user input
      // This creates a pending state that will be resolved when user responds
      await ctx.runMutation(internal.automation.setPendingUserResponse, {
        userStateId,
        expectedResponse: conditionValue, // "yes" or "no"
        waitingNodeId: node.id,
      });
      return; // Don't continue flow, wait for user response
      
    case "keyword":
      // Check if user's last response contains keyword  
      const lastResponse = await ctx.runQuery(internal.automation.getLastUserResponse, { userStateId });
      conditionMet = lastResponse?.toLowerCase().includes(conditionValue?.toLowerCase()) || false;
      break;
      
    case "tag_based":
      // Check if user has specific tag
      const userState = await ctx.runQuery(internal.automation.getUserState, { userStateId });
      conditionMet = userState?.tags?.includes(conditionValue) || false;
      break;
      
    case "time_based":
      // Check time-based conditions (e.g., time since last activity)
      const userStateForTime = await ctx.runQuery(internal.automation.getUserState, { userStateId });
      const timeSinceActivity = Date.now() - userStateForTime.lastActivityAt;
      const timeThreshold = parseInt(conditionValue) * 60 * 1000; // conditionValue in minutes
      conditionMet = timeSinceActivity > timeThreshold;
      break;
      
    default:
      conditionMet = true;
  }

  // Find the appropriate next connection
  const connections = flow.flowDefinition.connections.filter((conn: any) => conn.from === node.id);
  const targetConnection = connections.find((conn: any) => 
    conditionMet ? 
      (conn.label === "yes" || conn.label === "true" || !conn.label) : 
      (conn.label === "no" || conn.label === "false")
  ) || connections[0]; // Fallback to first connection

  if (targetConnection) {
    await executeFlowNode(ctx, userStateId, targetConnection.to, flow);
  }
}

/**
 * Execute webhook node - send webhook
 */
async function executeWebhookNode(ctx: any, userStateId: Id<"userAutomationStates">, node: any, flow: any) {
  const { webhookUrl, webhookData } = node.data;
  
  if (!webhookUrl) return;

  const userState = await ctx.runQuery(internal.automation.getUserState, { userStateId });
  if (!userState) return;

  try {
    const payload = {
      userId: userState.platformUserId,
      platform: userState.platform,
      flowId: flow._id,
      nodeId: node.id,
      ...webhookData,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`Webhook sent successfully to ${webhookUrl}`);
  } catch (error) {
    console.error(`Failed to send webhook to ${webhookUrl}:`, error);
  }
}

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================================================

/**
 * Update user state current node
 */
export const updateUserStateCurrentNode = internalMutation({
  args: {
    userStateId: v.id("userAutomationStates"),
    currentNodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userStateId, {
      currentNodeId: args.currentNodeId,
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

/**
 * Complete user flow
 */
export const completeUserFlow = internalMutation({
  args: {
    userStateId: v.id("userAutomationStates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userState = await ctx.db.get(args.userStateId);
    if (!userState) return null;

    await ctx.db.patch(args.userStateId, {
      status: "completed",
      completedAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    // Increment completion stats for the flow
    await ctx.runMutation(internal.automation.incrementFlowStats, {
      flowId: userState.automationFlowId,
      field: "totalCompletions",
    });

    return null;
  },
});

/**
 * Create automation message
 */
export const createAutomationMessage = internalMutation({
  args: {
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),
    userAutomationStateId: v.id("userAutomationStates"),
    nodeId: v.string(),
    messageType: v.union(
      v.literal("dm"),
      v.literal("comment_reply"),
      v.literal("story_reply")
    ),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    socialAccountId: v.optional(v.id("socialAccounts")),
  },
  returns: v.id("automationMessages"),
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("automationMessages", {
      storeId: args.storeId,
      automationFlowId: args.automationFlowId,
      userAutomationStateId: args.userAutomationStateId,
      nodeId: args.nodeId,
      messageType: args.messageType,
      content: args.content,
      mediaUrls: args.mediaUrls,
      platform: args.platform,
      platformUserId: args.platformUserId,
      platformUsername: args.platformUsername,
      socialAccountId: args.socialAccountId || ("" as Id<"socialAccounts">),
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
    });

    // Schedule message sending
    await ctx.scheduler.runAfter(0, internal.automation.sendAutomationMessage, { messageId });

    return messageId;
  },
});

/**
 * Add tag to user
 */
export const addUserTag = internalMutation({
  args: {
    userStateId: v.id("userAutomationStates"),
    tagName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userState = await ctx.db.get(args.userStateId);
    if (!userState) return null;

    const currentTags = userState.tags || [];
    if (!currentTags.includes(args.tagName)) {
      await ctx.db.patch(args.userStateId, {
        tags: [...currentTags, args.tagName],
        lastActivityAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Execute delayed node (scheduled by delay nodes)
 */
export const executeDelayedNode = internalAction({
  args: {
    userStateId: v.id("userAutomationStates"),
    nodeId: v.string(),
    flowId: v.id("automationFlows"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userState = await ctx.runQuery(internal.automation.getUserState, { 
      userStateId: args.userStateId 
    });
    
    if (!userState || userState.status !== "active") {
      console.log(`User state ${args.userStateId} no longer active, skipping delayed execution`);
      return null;
    }

    const flow = await ctx.runQuery(internal.automation.getAutomationFlowInternal, {
      flowId: args.flowId,
    });

    if (!flow || !flow.isActive) {
      console.log(`Flow ${args.flowId} no longer active, skipping delayed execution`);
      return null;
    }

    // Execute the scheduled node
    await executeFlowNode(ctx, args.userStateId, args.nodeId, flow);

    return null;
  },
});

/**
 * Send automation message (scheduled by message nodes)
 */
export const sendAutomationMessage = internalAction({
  args: {
    messageId: v.id("automationMessages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.runQuery(internal.automation.getAutomationMessage, { 
      messageId: args.messageId 
    });
    
    if (!message || message.status !== "pending") {
      console.log(`Message ${args.messageId} not found or not pending`);
      return null;
    }

    // Mark as sending
    await ctx.runMutation(internal.automation.updateMessageStatus, {
      messageId: args.messageId,
      status: "sending",
    });

    try {
      // Get the social account for sending
      const socialAccount = await ctx.runQuery(internal.automation.getSocialAccount, {
        accountId: message.socialAccountId,
      });

      if (!socialAccount || !socialAccount.isConnected) {
        throw new Error("Social account not found or not connected");
      }

      // Send the message based on platform
      let success = false;
      let platformMessageId = "";

      switch (message.platform) {
        case "instagram":
          // Call Instagram API to send DM
          success = await sendInstagramDM(message, socialAccount);
          break;
        
        case "twitter":
          // Call Twitter API to send DM
          success = await sendTwitterDM(message, socialAccount);
          break;
        
        case "facebook":
          // Call Facebook API to send message
          success = await sendFacebookMessage(message, socialAccount);
          break;
        
        default:
          console.log(`Platform ${message.platform} not yet implemented for automation messages`);
          success = true; // For testing, mark as successful
          break;
      }

      if (success) {
        await ctx.runMutation(internal.automation.updateMessageStatus, {
          messageId: args.messageId,
          status: "sent",
          sentAt: Date.now(),
          platformMessageId,
        });
      } else {
        throw new Error("Failed to send message");
      }

    } catch (error) {
      console.error(`Error sending automation message ${args.messageId}:`, error);
      
      // Update retry count and status
      const newRetryCount = message.retryCount + 1;
      
      if (newRetryCount >= message.maxRetries) {
        await ctx.runMutation(internal.automation.updateMessageStatus, {
          messageId: args.messageId,
          status: "failed",
          errorMessage: String(error),
        });
      } else {
        await ctx.runMutation(internal.automation.updateMessageForRetry, {
          messageId: args.messageId,
          retryCount: newRetryCount,
          nextRetryAt: Date.now() + (newRetryCount * 5 * 60 * 1000), // 5, 10, 15 minutes
        });
        
        // Schedule retry
        await ctx.scheduler.runAt(
          Date.now() + (newRetryCount * 5 * 60 * 1000),
          internal.automation.sendAutomationMessage,
          { messageId: args.messageId }
        );
      }
    }

    return null;
  },
});

/**
 * Get automation message
 */
export const getAutomationMessage = internalQuery({
  args: { messageId: v.id("automationMessages") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

/**
 * Update message status
 */
export const updateMessageStatus = internalMutation({
  args: {
    messageId: v.id("automationMessages"),
    status: v.union(
      v.literal("pending"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("rate_limited")
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    platformMessageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };
    
    if (args.sentAt) updates.sentAt = args.sentAt;
    if (args.deliveredAt) updates.deliveredAt = args.deliveredAt;
    if (args.errorMessage) updates.errorMessage = args.errorMessage;
    if (args.platformMessageId) updates.platformMessageId = args.platformMessageId;
    
    await ctx.db.patch(args.messageId, updates);
    return null;
  },
});

/**
 * Update message for retry
 */
export const updateMessageForRetry = internalMutation({
  args: {
    messageId: v.id("automationMessages"),
    retryCount: v.number(),
    nextRetryAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "pending",
      retryCount: args.retryCount,
      nextRetryAt: args.nextRetryAt,
    });
    return null;
  },
});

/**
 * Get social account
 */
export const getSocialAccount = internalQuery({
  args: { accountId: v.id("socialAccounts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

// ============================================================================
// PLATFORM-SPECIFIC MESSAGE SENDING (Placeholder implementations)
// ============================================================================

async function sendInstagramDM(message: any, account: any): Promise<boolean> {
  // TODO: Implement Instagram DM sending via Graph API
  console.log(`Sending Instagram DM to ${message.platformUserId}: ${message.content}`);
  
  // Placeholder implementation
  // In real implementation, you would:
  // 1. Use Instagram Graph API
  // 2. Send message to user's Instagram ID
  // 3. Handle rate limits and errors
  
  return true; // Simulate success for now
}

async function sendTwitterDM(message: any, account: any): Promise<boolean> {
  // TODO: Implement Twitter DM sending via Twitter API v2
  console.log(`Sending Twitter DM to ${message.platformUserId}: ${message.content}`);
  
  // Placeholder implementation
  // In real implementation, you would:
  // 1. Use Twitter API v2 Direct Messages
  // 2. Send message to user's Twitter ID
  // 3. Handle rate limits and errors
  
  return true; // Simulate success for now
}

async function sendFacebookMessage(message: any, account: any): Promise<boolean> {
  // TODO: Implement Facebook Messenger sending
  console.log(`Sending Facebook message to ${message.platformUserId}: ${message.content}`);
  
  // Placeholder implementation
  // In real implementation, you would:
  // 1. Use Facebook Graph API
  // 2. Send message to user's Facebook ID
  // 3. Handle rate limits and errors
  
  return true; // Simulate success for now
}

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

/**
 * Set pending user response state
 */
export const setPendingUserResponse = internalMutation({
  args: {
    userStateId: v.id("userAutomationStates"),
    expectedResponse: v.string(),
    waitingNodeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userStateId, {
      isPendingResponse: true,
      expectedResponse: args.expectedResponse,
      waitingNodeId: args.waitingNodeId,
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

/**
 * Get user's last response
 */
export const getLastUserResponse = internalQuery({
  args: {
    userStateId: v.id("userAutomationStates"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const userState = await ctx.db.get(args.userStateId);
    return userState?.lastUserResponse || null;
  },
});

/**
 * Process user response for pending flows
 */
export const processUserResponse = internalAction({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    responseText: v.string(),
    storeId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find any pending user states for this user across all stores
    const pendingStates = await ctx.runQuery(internal.automation.getPendingUserStatesAnyStore, {
      platform: args.platform,
      platformUserId: args.platformUserId,
    });

    for (const userState of pendingStates) {
      if (!userState.isPendingResponse || !userState.waitingNodeId) continue;

      // Update user state with response
      await ctx.runMutation(internal.automation.updateUserResponse, {
        userStateId: userState._id,
        responseText: args.responseText,
      });

      // Check if response matches expected response
      if (!userState.expectedResponse) continue; // Skip if no expected response
      const responseMatch = checkResponseMatch(args.responseText, userState.expectedResponse);
      
      // Get the flow and continue execution
      const flow = await ctx.runQuery(internal.automation.getAutomationFlowInternal, {
        flowId: userState.automationFlowId,
      });

      if (flow && flow.isActive) {
        // Find the waiting node and its connections
        const waitingNode = flow.flowDefinition.nodes.find((n: any) => n.id === userState.waitingNodeId);
        if (waitingNode) {
          const connections = flow.flowDefinition.connections.filter((conn: any) => conn.from === waitingNode.id);
          const targetConnection = connections.find((conn: any) => 
            responseMatch ? 
              (conn.label === "yes" || conn.label === "true") : 
              (conn.label === "no" || conn.label === "false")
          );

          if (targetConnection) {
            await executeFlowNode(ctx, userState._id, targetConnection.to, flow);
          }
        }
      }
    }

    return null;
  },
});

/**
 * Get pending user states for specific store
 */
export const getPendingUserStates = internalQuery({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAutomationStates")
      .withIndex("by_store_platform_user", (q) => 
        q.eq("storeId", args.storeId)
         .eq("platform", args.platform)
         .eq("platformUserId", args.platformUserId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("isPendingResponse"), true)
        )
      )
      .collect();
  },
});

/**
 * Get pending user states across all stores
 */
export const getPendingUserStatesAnyStore = internalQuery({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAutomationStates")
      .withIndex("by_platformUser", (q) => 
        q.eq("platform", args.platform)
         .eq("platformUserId", args.platformUserId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("isPendingResponse"), true)
        )
      )
      .collect();
  },
});

/**
 * Update user response
 */
export const updateUserResponse = internalMutation({
  args: {
    userStateId: v.id("userAutomationStates"),
    responseText: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userStateId, {
      lastUserResponse: args.responseText,
      isPendingResponse: false,
      expectedResponse: undefined,
      waitingNodeId: undefined,
      lastActivityAt: Date.now(),
    });
    return null;
  },
});

/**
 * Check if user response matches expected response
 */
function checkResponseMatch(responseText: string, expectedResponse: string): boolean {
  const normalizedResponse = responseText.toLowerCase().trim();
  const normalizedExpected = expectedResponse.toLowerCase().trim();

  // Handle "yes" responses
  if (normalizedExpected === "yes") {
    return normalizedResponse === "yes" || 
           normalizedResponse === "y" || 
           normalizedResponse === "yep" || 
           normalizedResponse === "yeah" ||
           normalizedResponse === "sure" ||
           normalizedResponse === "ok" ||
           normalizedResponse === "okay" ||
           normalizedResponse === "👍" ||
           normalizedResponse.includes("yes");
  }

  // Handle "no" responses  
  if (normalizedExpected === "no") {
    return normalizedResponse === "no" || 
           normalizedResponse === "n" || 
           normalizedResponse === "nope" || 
           normalizedResponse === "nah" ||
           normalizedResponse === "stop" ||
           normalizedResponse === "👎" ||
           normalizedResponse.includes("no");
  }

  // Default exact match
  return normalizedResponse.includes(normalizedExpected);
}

/**
 * Create social webhook record
 */
export const createSocialWebhook = internalMutation({
  args: {
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    eventType: v.string(),
    payload: v.any(),
    signature: v.optional(v.string()),
    socialAccountId: v.optional(v.id("socialAccounts")),
    scheduledPostId: v.optional(v.id("scheduledPosts")),
  },
  returns: v.id("socialWebhooks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("socialWebhooks", {
      platform: args.platform,
      eventType: args.eventType,
      payload: args.payload,
      signature: args.signature,
      status: "pending",
      socialAccountId: args.socialAccountId,
      scheduledPostId: args.scheduledPostId,
    });
  },
});
