/**
 * A/B Testing for Workflow Email Nodes
 * Enables split testing of subject lines and content within email workflows
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Variant schema for validation
const variantSchema = v.object({
  id: v.string(),
  name: v.string(),
  subject: v.string(),
  body: v.optional(v.string()),
  percentage: v.number(),
  sent: v.number(),
  delivered: v.number(),
  opened: v.number(),
  clicked: v.number(),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get A/B test configuration for a workflow email node
 */
export const getNodeABTest = query({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();
  },
});

/**
 * Get all A/B tests for a workflow
 */
export const getWorkflowABTests = query({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .take(1000);
  },
});

/**
 * Get variant stats for display in node
 */
export const getVariantStats = query({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      isEnabled: v.boolean(),
      variants: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          subject: v.string(),
          percentage: v.number(),
          sent: v.number(),
          opened: v.number(),
          clicked: v.number(),
          openRate: v.number(),
          clickRate: v.number(),
        })
      ),
      winner: v.union(v.null(), v.string()),
      isComplete: v.boolean(),
      totalSent: v.number(),
      sampleSize: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!test) return null;

    const variants = test.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
      subject: v.subject,
      percentage: v.percentage,
      sent: v.sent,
      opened: v.opened,
      clicked: v.clicked,
      openRate: v.sent > 0 ? Math.round((v.opened / v.sent) * 1000) / 10 : 0,
      clickRate: v.sent > 0 ? Math.round((v.clicked / v.sent) * 1000) / 10 : 0,
    }));

    const totalSent = test.variants.reduce((sum: number, v: any) => sum + v.sent, 0);

    return {
      isEnabled: test.isEnabled,
      variants,
      winner: test.winner || null,
      isComplete: test.status === "completed",
      totalSent,
      sampleSize: test.sampleSize,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create or update A/B test for an email node
 */
export const saveNodeABTest = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    isEnabled: v.boolean(),
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        subject: v.string(),
        body: v.optional(v.string()),
        percentage: v.number(),
      })
    ),
    sampleSize: v.number(),
    winnerMetric: v.union(v.literal("open_rate"), v.literal("click_rate")),
    autoSelectWinner: v.boolean(),
    winnerThreshold: v.optional(v.number()),
  },
  returns: v.id("workflowNodeABTests"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate percentages sum to 100
    const totalPercentage = args.variants.reduce((sum, v) => sum + v.percentage, 0);
    if (args.isEnabled && Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Variant percentages must sum to 100%");
    }

    // Check for existing test
    const existing = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    // Initialize variants with tracking data
    const variants = args.variants.map((v) => ({
      ...v,
      sent: existing?.variants.find((ev: any) => ev.id === v.id)?.sent || 0,
      delivered: existing?.variants.find((ev: any) => ev.id === v.id)?.delivered || 0,
      opened: existing?.variants.find((ev: any) => ev.id === v.id)?.opened || 0,
      clicked: existing?.variants.find((ev: any) => ev.id === v.id)?.clicked || 0,
    }));

    if (existing) {
      await ctx.db.patch(existing._id, {
        isEnabled: args.isEnabled,
        variants,
        sampleSize: args.sampleSize,
        winnerMetric: args.winnerMetric,
        autoSelectWinner: args.autoSelectWinner,
        winnerThreshold: args.winnerThreshold,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("workflowNodeABTests", {
      workflowId: args.workflowId,
      nodeId: args.nodeId,
      isEnabled: args.isEnabled,
      variants,
      sampleSize: args.sampleSize,
      winnerMetric: args.winnerMetric,
      autoSelectWinner: args.autoSelectWinner,
      winnerThreshold: args.winnerThreshold,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete A/B test for an email node
 */
export const deleteNodeABTest = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

/**
 * Assign a contact to a variant (deterministic based on contact ID)
 */
export const assignVariant = query({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    contactId: v.id("emailContacts"),
  },
  returns: v.union(
    v.null(),
    v.object({
      variantId: v.string(),
      variantName: v.string(),
      subject: v.string(),
      body: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!test || !test.isEnabled) return null;

    // If winner is selected, use winner variant
    if (test.winner) {
      const winner = test.variants.find((v: any) => v.id === test.winner);
      if (winner) {
        return {
          variantId: winner.id,
          variantName: winner.name,
          subject: winner.subject,
          body: winner.body,
        };
      }
    }

    // Deterministic assignment based on contact ID hash
    const hash = hashString(args.contactId);
    const percentage = (hash % 100) / 100;

    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.percentage / 100;
      if (percentage < cumulativePercentage) {
        return {
          variantId: variant.id,
          variantName: variant.name,
          subject: variant.subject,
          body: variant.body,
        };
      }
    }

    // Fallback to first variant
    const first = test.variants[0];
    return {
      variantId: first.id,
      variantName: first.name,
      subject: first.subject,
      body: first.body,
    };
  },
});

/**
 * Record an event for a variant (sent, opened, clicked)
 */
export const recordVariantEvent = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    variantId: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked")
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!test) return { success: false };

    const variantIndex = test.variants.findIndex((v: any) => v.id === args.variantId);
    if (variantIndex === -1) return { success: false };

    const updatedVariants = [...test.variants];
    const variant = { ...updatedVariants[variantIndex] };

    switch (args.eventType) {
      case "sent":
        variant.sent += 1;
        break;
      case "delivered":
        variant.delivered += 1;
        break;
      case "opened":
        variant.opened += 1;
        break;
      case "clicked":
        variant.clicked += 1;
        break;
    }

    updatedVariants[variantIndex] = variant;

    await ctx.db.patch(test._id, {
      variants: updatedVariants,
      updatedAt: Date.now(),
    });

    // Check if we should auto-select winner
    const totalSent = updatedVariants.reduce((sum, v) => sum + v.sent, 0);
    if (
      test.autoSelectWinner &&
      !test.winner &&
      totalSent >= test.sampleSize
    ) {
      await ctx.scheduler.runAfter(0, "emailWorkflowABTesting:calculateWinner" as any, {
        testId: test._id,
      });
    }

    return { success: true };
  },
});

/**
 * Calculate and select winner
 */
export const calculateWinner = internalMutation({
  args: {
    testId: v.id("workflowNodeABTests"),
  },
  returns: v.object({
    winner: v.union(v.null(), v.string()),
    confidence: v.number(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return { winner: null, confidence: 0 };

    // Calculate metrics for each variant
    const variantMetrics = test.variants.map((v: any) => {
      const openRate = v.sent > 0 ? (v.opened / v.sent) * 100 : 0;
      const clickRate = v.sent > 0 ? (v.clicked / v.sent) * 100 : 0;
      return {
        ...v,
        openRate,
        clickRate,
        metric: test.winnerMetric === "open_rate" ? openRate : clickRate,
      };
    });

    // Find winner
    let winner = variantMetrics[0];
    for (const variant of variantMetrics) {
      if (variant.metric > winner.metric) {
        winner = variant;
      }
    }

    // Calculate confidence (simplified)
    const sorted = [...variantMetrics].sort((a, b) => b.metric - a.metric);
    const best = sorted[0];
    const secondBest = sorted[1];
    const diff = best.metric - (secondBest?.metric || 0);
    const confidence = Math.min(95, Math.max(50, 50 + diff * 5));

    // Check if meets threshold
    const meetsThreshold =
      !test.winnerThreshold || diff >= test.winnerThreshold;

    if (meetsThreshold) {
      await ctx.db.patch(args.testId, {
        winner: winner.id,
        status: "completed",
        confidence,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { winner: winner.id, confidence };
    }

    return { winner: null, confidence };
  },
});

/**
 * Manually select a winner
 */
export const selectWinner = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
    variantId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!test) return { success: false };

    const variant = test.variants.find((v: any) => v.id === args.variantId);
    if (!variant) return { success: false };

    await ctx.db.patch(test._id, {
      winner: args.variantId,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reset A/B test stats
 */
export const resetTestStats = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const test = await ctx.db
      .query("workflowNodeABTests")
      .withIndex("by_workflowId_nodeId", (q) =>
        q.eq("workflowId", args.workflowId).eq("nodeId", args.nodeId)
      )
      .first();

    if (!test) return { success: false };

    const resetVariants = test.variants.map((v: any) => ({
      ...v,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
    }));

    await ctx.db.patch(test._id, {
      variants: resetVariants,
      winner: undefined,
      status: "active",
      confidence: undefined,
      completedAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
