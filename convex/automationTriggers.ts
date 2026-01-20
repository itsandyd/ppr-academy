import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to generate unique keys
function generateKey(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// WEBHOOK ENDPOINTS
// ============================================

// Get all webhook endpoints for a store
export const getWebhookEndpoints = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const endpoints = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Enrich with workflow info
    const enriched = await Promise.all(
      endpoints.map(async (endpoint) => {
        let workflow = null;
        if (endpoint.workflowId) {
          workflow = await ctx.db.get(endpoint.workflowId);
        }
        return {
          ...endpoint,
          workflowName: workflow?.name,
        };
      })
    );

    return enriched;
  },
});

// Get webhook endpoint by key (for incoming webhook calls)
export const getWebhookByKey = query({
  args: {
    endpointKey: v.string(),
  },
  handler: async (ctx, args) => {
    const endpoint = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_endpointKey", (q) => q.eq("endpointKey", args.endpointKey))
      .first();

    return endpoint;
  },
});

// Create a new webhook endpoint
export const createWebhookEndpoint = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    workflowId: v.optional(v.id("emailWorkflows")),
    rateLimitPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const endpointKey = generateKey(24);
    const secretKey = generateKey(48);

    const id = await ctx.db.insert("webhookEndpoints", {
      storeId: args.storeId,
      name: args.name,
      description: args.description,
      endpointKey,
      secretKey,
      isActive: true,
      workflowId: args.workflowId,
      rateLimitPerMinute: args.rateLimitPerMinute || 60,
      totalCalls: 0,
      createdAt: Date.now(),
    });

    return {
      id,
      endpointKey,
      secretKey,
      webhookUrl: `/api/webhooks/${endpointKey}`,
    };
  },
});

// Update webhook endpoint
export const updateWebhookEndpoint = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    workflowId: v.optional(v.id("emailWorkflows")),
    rateLimitPerMinute: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { webhookId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(webhookId, filteredUpdates);
  },
});

// Delete webhook endpoint
export const deleteWebhookEndpoint = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.webhookId);
  },
});

// Regenerate webhook secret key
export const regenerateWebhookSecret = mutation({
  args: {
    webhookId: v.id("webhookEndpoints"),
  },
  handler: async (ctx, args) => {
    const newSecretKey = generateKey(48);
    await ctx.db.patch(args.webhookId, { secretKey: newSecretKey });
    return newSecretKey;
  },
});

// Log a webhook call
export const logWebhookCall = internalMutation({
  args: {
    webhookEndpointId: v.id("webhookEndpoints"),
    storeId: v.string(),
    payload: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("rate_limited")),
    errorMessage: v.optional(v.string()),
    workflowTriggered: v.optional(v.boolean()),
    executionId: v.optional(v.id("workflowExecutions")),
  },
  handler: async (ctx, args) => {
    // Log the call
    await ctx.db.insert("webhookCallLogs", {
      ...args,
      timestamp: Date.now(),
    });

    // Update endpoint stats
    const endpoint = await ctx.db.get(args.webhookEndpointId);
    if (endpoint) {
      await ctx.db.patch(args.webhookEndpointId, {
        totalCalls: endpoint.totalCalls + 1,
        lastCalledAt: Date.now(),
      });
    }
  },
});

// Get webhook call logs
export const getWebhookCallLogs = query({
  args: {
    webhookEndpointId: v.id("webhookEndpoints"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("webhookCallLogs")
      .withIndex("by_webhookEndpointId", (q) => q.eq("webhookEndpointId", args.webhookEndpointId))
      .order("desc")
      .take(limit);

    return logs;
  },
});

// ============================================
// CUSTOM EVENTS
// ============================================

// Get all custom events for a store
export const getCustomEvents = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("customEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return events;
  },
});

// Create a custom event
export const createCustomEvent = mutation({
  args: {
    storeId: v.string(),
    eventName: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if event with this name already exists
    const existing = await ctx.db
      .query("customEvents")
      .withIndex("by_storeId_eventName", (q) =>
        q.eq("storeId", args.storeId).eq("eventName", args.eventName)
      )
      .first();

    if (existing) {
      throw new Error(`Event "${args.eventName}" already exists`);
    }

    return await ctx.db.insert("customEvents", {
      storeId: args.storeId,
      eventName: args.eventName,
      description: args.description,
      isActive: true,
      workflowCount: 0,
      totalFires: 0,
      createdAt: Date.now(),
    });
  },
});

// Update custom event
export const updateCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(eventId, filteredUpdates);
  },
});

// Delete custom event
export const deleteCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    // Check if any workflows are using this event
    const event = await ctx.db.get(args.eventId);
    if (event && event.workflowCount > 0) {
      throw new Error("Cannot delete event that is being used by workflows");
    }

    await ctx.db.delete(args.eventId);
  },
});

// Fire a custom event (used by API or internally)
export const fireCustomEvent = mutation({
  args: {
    storeId: v.string(),
    eventName: v.string(),
    contactEmail: v.optional(v.string()),
    contactId: v.optional(v.id("emailContacts")),
    eventData: v.optional(v.any()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the custom event
    const event = await ctx.db
      .query("customEvents")
      .withIndex("by_storeId_eventName", (q) =>
        q.eq("storeId", args.storeId).eq("eventName", args.eventName)
      )
      .first();

    if (!event) {
      throw new Error(`Event "${args.eventName}" not found`);
    }

    if (!event.isActive) {
      throw new Error(`Event "${args.eventName}" is not active`);
    }

    // Find contact if email provided but no contactId
    let contactId = args.contactId;
    if (!contactId && args.contactEmail) {
      const emailToSearch = args.contactEmail;
      const contact = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", emailToSearch)
        )
        .first();
      contactId = contact?._id;
    }

    // Log the event fire
    await ctx.db.insert("customEventLogs", {
      customEventId: event._id,
      storeId: args.storeId,
      contactId,
      contactEmail: args.contactEmail,
      eventData: args.eventData,
      source: args.source || "api",
      workflowsTriggered: 0, // Will be updated when workflows are triggered
      timestamp: Date.now(),
    });

    // Update event stats
    await ctx.db.patch(event._id, {
      totalFires: event.totalFires + 1,
      lastFiredAt: Date.now(),
    });

    // Find and trigger workflows with this event
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("trigger.type"), "custom_event")
        )
      )
      .collect();

    const matchingWorkflows = workflows.filter(
      (w) => w.trigger.config?.eventName === args.eventName
    );

    // Return info about triggered workflows
    return {
      eventId: event._id,
      eventName: args.eventName,
      workflowsTriggered: matchingWorkflows.length,
      workflows: matchingWorkflows.map((w) => ({ id: w._id, name: w.name })),
    };
  },
});

// Get custom event logs
export const getCustomEventLogs = query({
  args: {
    eventId: v.id("customEvents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("customEventLogs")
      .withIndex("by_customEventId", (q) => q.eq("customEventId", args.eventId))
      .order("desc")
      .take(limit);

    // Enrich with contact info
    const enriched = await Promise.all(
      logs.map(async (log) => {
        let contact = null;
        if (log.contactId) {
          contact = await ctx.db.get(log.contactId);
        }
        return {
          ...log,
          contactName: contact
            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
            : undefined,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// PAGE VISIT TRACKING
// ============================================

// Track a page visit
export const trackPageVisit = mutation({
  args: {
    storeId: v.string(),
    contactEmail: v.optional(v.string()),
    contactId: v.optional(v.id("emailContacts")),
    pageUrl: v.string(),
    pagePath: v.string(),
    pageTitle: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find contact if email provided but no contactId
    let contactId = args.contactId;
    if (!contactId && args.contactEmail) {
      const emailToSearch = args.contactEmail;
      const contact = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", emailToSearch)
        )
        .first();
      contactId = contact?._id;
    }

    // Log the page visit
    await ctx.db.insert("pageVisitEvents", {
      storeId: args.storeId,
      contactId,
      contactEmail: args.contactEmail,
      pageUrl: args.pageUrl,
      pagePath: args.pagePath,
      pageTitle: args.pageTitle,
      referrer: args.referrer,
      userAgent: args.userAgent,
      sessionId: args.sessionId,
      workflowTriggered: false,
      timestamp: Date.now(),
    });

    // Check for matching page_visit workflows
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("trigger.type"), "page_visit")
        )
      )
      .collect();

    // Filter workflows that match this page path
    const matchingWorkflows = workflows.filter((w) => {
      const config = w.trigger.config;
      if (!config?.pagePath) return false;

      // Support wildcards
      if (config.pagePath.endsWith("*")) {
        const prefix = config.pagePath.slice(0, -1);
        return args.pagePath.startsWith(prefix);
      }

      return args.pagePath === config.pagePath;
    });

    return {
      tracked: true,
      workflowsMatched: matchingWorkflows.length,
    };
  },
});

// Get page visit analytics
export const getPageVisitAnalytics = query({
  args: {
    storeId: v.string(),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 7;
    const startTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const visits = await ctx.db
      .query("pageVisitEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", startTime)
      )
      .collect();

    // Aggregate by page
    const pageStats: Record<string, { visits: number; uniqueVisitors: Set<string> }> = {};

    for (const visit of visits) {
      if (!pageStats[visit.pagePath]) {
        pageStats[visit.pagePath] = { visits: 0, uniqueVisitors: new Set() };
      }
      pageStats[visit.pagePath].visits++;
      if (visit.contactEmail) {
        pageStats[visit.pagePath].uniqueVisitors.add(visit.contactEmail);
      }
    }

    const topPages = Object.entries(pageStats)
      .map(([path, stats]) => ({
        pagePath: path,
        totalVisits: stats.visits,
        uniqueVisitors: stats.uniqueVisitors.size,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits)
      .slice(0, 20);

    return {
      totalVisits: visits.length,
      uniquePages: Object.keys(pageStats).length,
      topPages,
    };
  },
});

// ============================================
// CART ABANDON
// ============================================

// Track cart abandon
export const trackCartAbandon = mutation({
  args: {
    storeId: v.string(),
    contactEmail: v.string(),
    cartId: v.optional(v.string()),
    cartValue: v.optional(v.number()),
    cartItems: v.optional(
      v.array(
        v.object({
          productId: v.string(),
          productName: v.string(),
          quantity: v.number(),
          price: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Find contact
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.contactEmail)
      )
      .first();

    // Check if there's already an unrecovered cart for this contact
    const existingCart = await ctx.db
      .query("cartAbandonEvents")
      .withIndex("by_contactEmail", (q) =>
        q.eq("storeId", args.storeId).eq("contactEmail", args.contactEmail)
      )
      .filter((q) => q.eq(q.field("recovered"), false))
      .first();

    if (existingCart) {
      // Update existing cart
      await ctx.db.patch(existingCart._id, {
        cartId: args.cartId,
        cartValue: args.cartValue,
        cartItems: args.cartItems,
        abandonedAt: Date.now(),
      });
      return existingCart._id;
    }

    // Create new cart abandon event
    const id = await ctx.db.insert("cartAbandonEvents", {
      storeId: args.storeId,
      contactId: contact?._id,
      contactEmail: args.contactEmail,
      cartId: args.cartId,
      cartValue: args.cartValue,
      cartItems: args.cartItems,
      abandonedAt: Date.now(),
      recoveryEmailSent: false,
      recovered: false,
      workflowTriggered: false,
    });

    return id;
  },
});

// Mark cart as recovered
export const markCartRecovered = mutation({
  args: {
    cartId: v.id("cartAbandonEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cartId, {
      recovered: true,
      recoveredAt: Date.now(),
    });
  },
});

// Get abandoned carts
export const getAbandonedCarts = query({
  args: {
    storeId: v.string(),
    recoveredOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let carts = await ctx.db
      .query("cartAbandonEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit * 2); // Fetch more to account for filtering

    if (args.recoveredOnly !== undefined) {
      carts = carts.filter((c) => c.recovered === args.recoveredOnly);
    }

    // Enrich with contact info
    const enriched = await Promise.all(
      carts.slice(0, limit).map(async (cart) => {
        let contact = null;
        if (cart.contactId) {
          contact = await ctx.db.get(cart.contactId);
        }
        return {
          ...cart,
          contactName: contact
            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
            : undefined,
        };
      })
    );

    return enriched;
  },
});

// Get cart abandon stats
export const getCartAbandonStats = query({
  args: {
    storeId: v.string(),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 30;
    const startTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const carts = await ctx.db
      .query("cartAbandonEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.gte(q.field("abandonedAt"), startTime))
      .collect();

    const totalAbandoned = carts.length;
    const recovered = carts.filter((c) => c.recovered).length;
    const emailsSent = carts.filter((c) => c.recoveryEmailSent).length;
    const totalValue = carts
      .filter((c) => !c.recovered)
      .reduce((sum, c) => sum + (c.cartValue || 0), 0);
    const recoveredValue = carts
      .filter((c) => c.recovered)
      .reduce((sum, c) => sum + (c.cartValue || 0), 0);

    return {
      totalAbandoned,
      recovered,
      recoveryRate: totalAbandoned > 0 ? Math.round((recovered / totalAbandoned) * 100) : 0,
      emailsSent,
      pendingRecovery: totalAbandoned - recovered,
      totalAbandonedValue: Math.round(totalValue * 100) / 100,
      recoveredValue: Math.round(recoveredValue * 100) / 100,
    };
  },
});

// ============================================
// TRIGGER OVERVIEW & STATS
// ============================================

// Get overview of all automation triggers
export const getTriggerOverview = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get workflows by trigger type
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const triggerCounts: Record<string, { total: number; active: number }> = {};

    for (const workflow of workflows) {
      const type = workflow.trigger.type;
      if (!triggerCounts[type]) {
        triggerCounts[type] = { total: 0, active: 0 };
      }
      triggerCounts[type].total++;
      if (workflow.isActive) {
        triggerCounts[type].active++;
      }
    }

    // Get webhook count
    const webhooks = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Get custom events count
    const customEvents = await ctx.db
      .query("customEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return {
      triggerCounts,
      webhooks: {
        total: webhooks.length,
        active: webhooks.filter((w) => w.isActive).length,
      },
      customEvents: {
        total: customEvents.length,
        active: customEvents.filter((e) => e.isActive).length,
      },
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter((w) => w.isActive).length,
    };
  },
});
