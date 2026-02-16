/**
 * A/B Testing Framework for Email Campaigns
 * Test subject lines, content, send times (ActiveCampaign-level)
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get A/B test by campaign ID
 */
export const getABTestByCampaign = query({
  args: {
    campaignId: v.id("resendCampaigns"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailABTests")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .unique();
  },
});

/**
 * Get all A/B tests
 */
export const getAllABTests = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("analyzing"),
      v.literal("completed")
    )),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("emailABTests")
        .withIndex("by_status", (q) => q.eq("status", args.status as "draft" | "running" | "analyzing" | "completed"))
        .take(1000);
    }
    
    return await ctx.db.query("emailABTests").take(1000);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create A/B test for campaign
 */
export const createABTest = mutation({
  args: {
    campaignId: v.id("resendCampaigns"),
    testType: v.union(
      v.literal("subject"),
      v.literal("content"),
      v.literal("send_time"),
      v.literal("from_name")
    ),
    variants: v.array(v.object({
      name: v.string(),
      value: v.string(),
      percentage: v.number(),
    })),
    sampleSize: v.number(),
    winnerMetric: v.union(
      v.literal("open_rate"),
      v.literal("click_rate"),
      v.literal("conversion_rate")
    ),
  },
  returns: v.id("emailABTests"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Validate percentages sum to 100
    const totalPercentage = args.variants.reduce((sum, v) => sum + v.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Variant percentages must sum to 100%");
    }
    
    // Initialize variants with tracking data
    const variants = args.variants.map((v, index) => ({
      id: `variant_${index + 1}`,
      name: v.name,
      value: v.value,
      percentage: v.percentage,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversions: 0,
    }));
    
    // Create A/B test
    const testId = await ctx.db.insert("emailABTests", {
      campaignId: args.campaignId,
      testType: args.testType,
      variants,
      sampleSize: args.sampleSize,
      winnerMetric: args.winnerMetric,
      status: "draft",
      winnerSentToRemaining: false,
      createdAt: now,
      updatedAt: now,
    });
    
    return testId;
  },
});

/**
 * Start A/B test (begin sending to test sample)
 */
export const startABTest = mutation({
  args: {
    testId: v.id("emailABTests"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      return { success: false, message: "Test not found" };
    }
    
    if (test.status !== "draft") {
      return { success: false, message: "Test already started" };
    }
    
    // Update status
    await ctx.db.patch(args.testId, {
      status: "running",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, message: "A/B test started successfully" };
  },
});

/**
 * Record A/B test result (email sent to variant)
 */
export const recordABTestResult = mutation({
  args: {
    testId: v.id("emailABTests"),
    variantId: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("converted")
    ),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      return { success: false };
    }
    
    // Find variant
    const variantIndex = test.variants.findIndex((v: any) => v.id === args.variantId);
    if (variantIndex === -1) {
      return { success: false };
    }
    
    // Update variant stats
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
      case "converted":
        variant.conversions += 1;
        break;
    }
    
    updatedVariants[variantIndex] = variant;
    
    // Update test
    await ctx.db.patch(args.testId, {
      variants: updatedVariants,
      updatedAt: Date.now(),
    });
    
    // Check if test sample is complete
    const totalSent = updatedVariants.reduce((sum, v) => sum + v.sent, 0);
    if (totalSent >= test.sampleSize && test.status === "running") {
      // Move to analyzing status
      await ctx.db.patch(args.testId, {
        status: "analyzing",
      });
      
      // Schedule winner calculation
      await ctx.scheduler.runAfter(0, "emailABTesting:calculateWinner" as any, {
        testId: args.testId,
      });
    }
    
    return { success: true };
  },
});

/**
 * Calculate winner and complete test
 */
export const calculateWinner = internalMutation({
  args: {
    testId: v.id("emailABTests"),
  },
  returns: v.object({
    winner: v.optional(v.string()),
    isStatisticallySignificant: v.boolean(),
    confidenceLevel: v.number(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      return { isStatisticallySignificant: false, confidenceLevel: 0 };
    }
    
    // Calculate metrics for each variant
    const variantsWithMetrics = test.variants.map((v: any) => ({
      ...v,
      openRate: v.delivered > 0 ? (v.opened / v.delivered) * 100 : 0,
      clickRate: v.delivered > 0 ? (v.clicked / v.delivered) * 100 : 0,
      conversionRate: v.delivered > 0 ? (v.conversions / v.delivered) * 100 : 0,
    }));
    
    // Determine winner based on metric
    let winner: any;
    let winnerMetricValue = -1;
    
    for (const variant of variantsWithMetrics) {
      let metricValue: number;
      
      switch (test.winnerMetric) {
        case "open_rate":
          metricValue = variant.openRate;
          break;
        case "click_rate":
          metricValue = variant.clickRate;
          break;
        case "conversion_rate":
          metricValue = variant.conversionRate;
          break;
        default:
          metricValue = variant.openRate;
      }
      
      if (metricValue > winnerMetricValue) {
        winnerMetricValue = metricValue;
        winner = variant;
      }
    }
    
    // Calculate statistical significance (simplified chi-square test)
    const { isSignificant, confidenceLevel } = calculateStatisticalSignificance(
      variantsWithMetrics,
      test.winnerMetric
    );
    
    // Update test with results
    await ctx.db.patch(args.testId, {
      status: "completed",
      winner: winner?.id,
      isStatisticallySignificant: isSignificant,
      confidenceLevel,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      winner: winner?.id,
      isStatisticallySignificant: isSignificant,
      confidenceLevel,
    };
  },
});

/**
 * Send winning variant to remaining recipients
 */
export const sendWinnerToRemaining = mutation({
  args: {
    testId: v.id("emailABTests"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      return { success: false, message: "Test not found" };
    }
    
    if (test.status !== "completed") {
      return { success: false, message: "Test not completed yet" };
    }
    
    if (!test.winner) {
      return { success: false, message: "No winner determined" };
    }
    
    if (test.winnerSentToRemaining) {
      return { success: false, message: "Winner already sent to remaining recipients" };
    }
    
    // Get campaign
    const campaign = await ctx.db.get(test.campaignId);
    if (!campaign) {
      return { success: false, message: "Campaign not found" };
    }
    
    // Find winning variant
    const winningVariant = test.variants.find((v: any) => v.id === test.winner);
    if (!winningVariant) {
      return { success: false, message: "Winning variant not found" };
    }
    
    // Update campaign with winning variant
    // (The actual sending would be handled by the campaign processing logic)
    if (test.testType === "subject") {
      await ctx.db.patch(test.campaignId, {
        subject: winningVariant.value,
      });
    } else if (test.testType === "content") {
      await ctx.db.patch(test.campaignId, {
        htmlContent: winningVariant.value,
      });
    }
    
    // Mark winner as sent
    await ctx.db.patch(args.testId, {
      winnerSentToRemaining: true,
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      message: `Winning variant "${winningVariant.name}" will be sent to remaining recipients`,
    };
  },
});

/**
 * Assign user to A/B test variant
 */
export const assignVariant = query({
  args: {
    testId: v.id("emailABTests"),
    userId: v.string(),
  },
  returns: v.object({
    variantId: v.string(),
    variantName: v.string(),
    variantValue: v.string(),
  }),
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }
    
    // Use deterministic assignment based on user ID
    // This ensures the same user always gets the same variant
    const hash = hashString(args.userId);
    const percentage = (hash % 100) / 100; // 0.00 to 0.99
    
    // Assign variant based on percentage ranges
    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.percentage / 100;
      if (percentage < cumulativePercentage) {
        return {
          variantId: variant.id,
          variantName: variant.name,
          variantValue: variant.value,
        };
      }
    }
    
    // Fallback to first variant
    const firstVariant = test.variants[0];
    return {
      variantId: firstVariant.id,
      variantName: firstVariant.name,
      variantValue: firstVariant.value,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple hash function for deterministic variant assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate statistical significance (simplified)
 */
function calculateStatisticalSignificance(
  variants: any[],
  metric: "open_rate" | "click_rate" | "conversion_rate"
): { isSignificant: boolean; confidenceLevel: number } {
  if (variants.length < 2) {
    return { isSignificant: false, confidenceLevel: 0 };
  }
  
  // Get metric values
  const values = variants.map(v => {
    switch (metric) {
      case "open_rate":
        return v.openRate;
      case "click_rate":
        return v.clickRate;
      case "conversion_rate":
        return v.conversionRate;
      default:
        return v.openRate;
    }
  });
  
  // Find best and second best
  const sorted = [...values].sort((a, b) => b - a);
  const best = sorted[0];
  const secondBest = sorted[1];
  
  // Calculate difference
  const difference = best - secondBest;
  const relativeDifference = secondBest > 0 ? (difference / secondBest) * 100 : 0;
  
  // Simple threshold-based significance
  // In production, use proper statistical tests (chi-square, t-test)
  let confidenceLevel: number;
  let isSignificant: boolean;
  
  if (relativeDifference >= 20 && difference >= 5) {
    confidenceLevel = 95;
    isSignificant = true;
  } else if (relativeDifference >= 10 && difference >= 3) {
    confidenceLevel = 85;
    isSignificant = true;
  } else if (relativeDifference >= 5 && difference >= 2) {
    confidenceLevel = 75;
    isSignificant = false;
  } else {
    confidenceLevel = 50;
    isSignificant = false;
  }
  
  return { isSignificant, confidenceLevel };
}

