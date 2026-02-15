/**
 * Email Health Monitoring System
 * Track deliverability, engagement, and list health (ActiveCampaign-level)
 */

import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get domain health stats for the dashboard
 * Returns delivery rate, open rate, bounce rate, spam rate, and sending volume
 */
export const getDomainHealthStats = query({
  args: {},
  returns: v.object({
    // Performance metrics (percentages)
    deliveryRate: v.number(),
    openRate: v.number(),
    bounceRate: v.number(),
    spamRate: v.number(),
    // Sending volume
    sentToday: v.number(),
    sentThisWeek: v.number(),
    sentThisMonth: v.number(),
    // Raw counts for context
    totalSent: v.number(),
    totalDelivered: v.number(),
    totalOpened: v.number(),
    totalBounced: v.number(),
    totalComplained: v.number(),
    // Domain info
    domain: v.string(),
    status: v.string(),
    // Reputation
    reputationScore: v.number(),
    reputationStatus: v.string(),
    reputationTrend: v.string(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const startOfToday = getStartOfDay(now);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Get all email logs from the last 30 days
    const allLogs = await ctx.db.query("resendLogs").take(5000);
    const recentLogs = allLogs.filter(log => log.createdAt >= oneMonthAgo);

    // Count by status
    const totalSent = recentLogs.length;
    const delivered = recentLogs.filter(l =>
      l.status === "delivered" || l.status === "opened" || l.status === "clicked"
    ).length;
    const opened = recentLogs.filter(l =>
      l.status === "opened" || l.status === "clicked"
    ).length;
    const bounced = recentLogs.filter(l => l.status === "bounced").length;
    const complained = recentLogs.filter(l => l.status === "complained").length;

    // Calculate time-based volume
    const sentToday = recentLogs.filter(l => l.createdAt >= startOfToday).length;
    const sentThisWeek = recentLogs.filter(l => l.createdAt >= oneWeekAgo).length;
    const sentThisMonth = totalSent;

    // Calculate rates (as percentages)
    const deliveryRate = totalSent > 0
      ? Math.round((delivered / totalSent) * 1000) / 10
      : 0;
    const openRate = delivered > 0
      ? Math.round((opened / delivered) * 1000) / 10
      : 0;
    const bounceRate = totalSent > 0
      ? Math.round((bounced / totalSent) * 1000) / 10
      : 0;
    const spamRate = totalSent > 0
      ? Math.round((complained / totalSent) * 10000) / 100
      : 0;

    // Calculate reputation score (0-100)
    let reputationScore = 100;
    // Penalize for bounces (each 1% bounce = -5 points)
    reputationScore -= bounceRate * 5;
    // Penalize heavily for spam complaints (each 0.1% = -10 points)
    reputationScore -= spamRate * 100;
    // Bonus for good open rates (>30% open = +5 points)
    if (openRate > 30) reputationScore += 5;
    // Ensure within bounds
    reputationScore = Math.max(0, Math.min(100, Math.round(reputationScore)));

    // Determine reputation status
    let reputationStatus = "excellent";
    if (reputationScore < 50) reputationStatus = "poor";
    else if (reputationScore < 70) reputationStatus = "fair";
    else if (reputationScore < 85) reputationStatus = "good";

    // Get trend from previous metrics if available
    const previousMetric = await ctx.db
      .query("emailHealthMetrics")
      .order("desc")
      .first();

    let reputationTrend = "stable";
    if (previousMetric) {
      const prevScore = previousMetric.deliverabilityScore || 0;
      if (reputationScore > prevScore + 5) reputationTrend = "up";
      else if (reputationScore < prevScore - 5) reputationTrend = "down";
    }

    // Get domain from admin connection
    const adminConnection = await ctx.db
      .query("resendConnections")
      .withIndex("by_type", (q) => q.eq("type", "admin"))
      .first();

    const domain = adminConnection?.fromEmail?.split("@")[1] || "pauseplayrepeat.com";
    const status = adminConnection?.isActive ? "active" : "pending";

    return {
      deliveryRate,
      openRate,
      bounceRate,
      spamRate,
      sentToday,
      sentThisWeek,
      sentThisMonth,
      totalSent,
      totalDelivered: delivered,
      totalOpened: opened,
      totalBounced: bounced,
      totalComplained: complained,
      domain,
      status,
      reputationScore,
      reputationStatus,
      reputationTrend,
    };
  },
});

/**
 * Get current email health metrics
 */
export const getEmailHealthMetrics = query({
  args: {
    connectionId: v.optional(v.id("resendConnections")),
    period: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
  },
  returns: v.union(
    v.object({
      listHealthScore: v.number(),
      engagementRate: v.number(),
      deliverabilityScore: v.number(),
      totalSubscribers: v.number(),
      activeSubscribers: v.number(),
      inactiveSubscribers: v.number(),
      bounceRate: v.number(),
      spamComplaintRate: v.number(),
      unsubscribeRate: v.number(),
      subscriberGrowth: v.number(),
      engagementTrend: v.union(v.literal("up"), v.literal("down"), v.literal("stable")),
      recommendations: v.array(v.object({
        type: v.union(v.literal("warning"), v.literal("alert"), v.literal("suggestion")),
        message: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })),
      date: v.number(),
      period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      createdAt: v.number(),
      _id: v.id("emailHealthMetrics"),
      _creationTime: v.number(),
      connectionId: v.optional(v.id("resendConnections")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const period = args.period || "daily";
    
    // Get most recent health metric
    if (args.connectionId !== undefined) {
      const metrics = await ctx.db
        .query("emailHealthMetrics")
        .withIndex("by_connectionId", (q) => q.eq("connectionId", args.connectionId as Id<"resendConnections">))
        .order("desc")
        .first();
      return metrics;
    }
    
    const metrics = await ctx.db.query("emailHealthMetrics").order("desc").first();
    return metrics;
  },
});

/**
 * Get email health history
 */
export const getEmailHealthHistory = query({
  args: {
    connectionId: v.optional(v.id("resendConnections")),
    days: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let metrics;
    
    if (args.connectionId !== undefined) {
      metrics = await ctx.db
        .query("emailHealthMetrics")
        .withIndex("by_connectionId", (q) => q.eq("connectionId", args.connectionId as Id<"resendConnections">))
        .take(1000);
    } else {
      metrics = await ctx.db.query("emailHealthMetrics").take(1000);
    }
    
    // Filter by date and sort
    return metrics
      .filter(m => m.date >= cutoff)
      .sort((a, b) => a.date - b.date);
  },
});

// ============================================================================
// INTERNAL MUTATIONS (Called by Cron)
// ============================================================================

/**
 * Calculate and store email health metrics (run daily)
 */
export const calculateEmailHealthMetrics = internalMutation({
  args: {
    connectionId: v.optional(v.id("resendConnections")),
  },
  returns: v.object({
    success: v.boolean(),
    metrics: v.any(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const startOfDay = getStartOfDay(now);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Get all email logs for the last 30 days
    let allLogs;
    
    if (args.connectionId !== undefined) {
      allLogs = await ctx.db
        .query("resendLogs")
        .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId as Id<"resendConnections">))
        .take(5000);
    } else {
      allLogs = await ctx.db.query("resendLogs").take(5000);
    }
    const recentLogs = allLogs.filter(log => log.createdAt >= thirtyDaysAgo);
    
    // Get all users (subscribers)
    const allUsers = await ctx.db.query("users").take(5000);
    const totalSubscribers = allUsers.length;
    
    // Get lead scores to determine active subscribers
    const leadScores = await ctx.db.query("leadScores").take(5000);
    const activeSubscribers = leadScores.filter(score => {
      const daysSinceActivity = (now - score.lastActivity) / (24 * 60 * 60 * 1000);
      return daysSinceActivity <= 30;
    }).length;
    
    const inactiveSubscribers = totalSubscribers - activeSubscribers;
    
    // Calculate metrics
    const totalSent = recentLogs.length;
    const delivered = recentLogs.filter(l => l.status === "delivered" || l.status === "opened" || l.status === "clicked").length;
    const opened = recentLogs.filter(l => l.status === "opened" || l.status === "clicked").length;
    const clicked = recentLogs.filter(l => l.status === "clicked").length;
    const bounced = recentLogs.filter(l => l.status === "bounced").length;
    const complained = recentLogs.filter(l => l.status === "complained").length;
    
    // Get unsubscribe count from preferences
    const unsubscribed = await ctx.db
      .query("resendPreferences")
      .filter(q => q.eq(q.field("isUnsubscribed"), true))
      .take(5000);
    
    // Calculate rates
    const engagementRate = totalSubscribers > 0 ? (activeSubscribers / totalSubscribers) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const spamComplaintRate = totalSent > 0 ? (complained / totalSent) * 100 : 0;
    const unsubscribeRate = totalSubscribers > 0 ? (unsubscribed.length / totalSubscribers) * 100 : 0;
    
    // Calculate health scores
    const deliverabilityScore = calculateDeliverabilityScore(bounceRate, spamComplaintRate);
    const listHealthScore = calculateListHealthScore(
      engagementRate,
      deliverabilityScore,
      bounceRate,
      spamComplaintRate,
      unsubscribeRate
    );
    
    // Get previous metric for comparison
    const previousMetric = await ctx.db
      .query("emailHealthMetrics")
      .withIndex("by_date", (q) => q.lt("date", startOfDay))
      .order("desc")
      .first();
    
    // Calculate subscriber growth
    const subscriberGrowth = previousMetric 
      ? ((totalSubscribers - previousMetric.totalSubscribers) / previousMetric.totalSubscribers) * 100
      : 0;
    
    // Determine engagement trend
    let engagementTrend: "up" | "down" | "stable" = "stable";
    if (previousMetric) {
      const diff = engagementRate - previousMetric.engagementRate;
      if (diff > 5) engagementTrend = "up";
      else if (diff < -5) engagementTrend = "down";
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations({
      listHealthScore,
      engagementRate,
      bounceRate,
      spamComplaintRate,
      unsubscribeRate,
      inactiveSubscribers,
      totalSubscribers,
    });
    
    // Store metrics
    const metrics = {
      connectionId: args.connectionId,
      date: startOfDay,
      period: "daily" as const,
      listHealthScore,
      engagementRate,
      deliverabilityScore,
      totalSubscribers,
      activeSubscribers,
      inactiveSubscribers,
      bounceRate,
      spamComplaintRate,
      unsubscribeRate,
      subscriberGrowth,
      engagementTrend,
      recommendations,
      createdAt: now,
    };
    
    await ctx.db.insert("emailHealthMetrics", metrics);
    
    return {
      success: true,
      metrics,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function calculateDeliverabilityScore(bounceRate: number, spamComplaintRate: number): number {
  // Start with 100, deduct points for issues
  let score = 100;
  
  // Bounce rate penalties
  if (bounceRate > 5) score -= 30; // Very high bounce rate
  else if (bounceRate > 2) score -= 20;
  else if (bounceRate > 1) score -= 10;
  
  // Spam complaint penalties
  if (spamComplaintRate > 0.5) score -= 40; // Critical issue
  else if (spamComplaintRate > 0.1) score -= 20;
  else if (spamComplaintRate > 0.05) score -= 10;
  
  return Math.max(0, score);
}

function calculateListHealthScore(
  engagementRate: number,
  deliverabilityScore: number,
  bounceRate: number,
  spamComplaintRate: number,
  unsubscribeRate: number
): number {
  // Weighted average of factors
  let score = 0;
  
  // Engagement (40% weight)
  if (engagementRate >= 40) score += 40;
  else if (engagementRate >= 30) score += 30;
  else if (engagementRate >= 20) score += 20;
  else if (engagementRate >= 10) score += 10;
  
  // Deliverability (40% weight)
  score += (deliverabilityScore / 100) * 40;
  
  // Unsubscribe rate (20% weight)
  if (unsubscribeRate < 0.5) score += 20;
  else if (unsubscribeRate < 1) score += 15;
  else if (unsubscribeRate < 2) score += 10;
  else if (unsubscribeRate < 5) score += 5;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

interface RecommendationFactors {
  listHealthScore: number;
  engagementRate: number;
  bounceRate: number;
  spamComplaintRate: number;
  unsubscribeRate: number;
  inactiveSubscribers: number;
  totalSubscribers: number;
}

function generateRecommendations(factors: RecommendationFactors): Array<{
  type: "warning" | "alert" | "suggestion";
  message: string;
  priority: "high" | "medium" | "low";
}> {
  const recommendations: Array<{
    type: "warning" | "alert" | "suggestion";
    message: string;
    priority: "high" | "medium" | "low";
  }> = [];
  
  // Critical issues (alerts)
  if (factors.spamComplaintRate > 0.5) {
    recommendations.push({
      type: "alert",
      message: "High spam complaint rate detected. Review email content and improve targeting.",
      priority: "high",
    });
  }
  
  if (factors.bounceRate > 5) {
    recommendations.push({
      type: "alert",
      message: "Very high bounce rate. Clean your email list and validate email addresses.",
      priority: "high",
    });
  }
  
  if (factors.listHealthScore < 40) {
    recommendations.push({
      type: "alert",
      message: "Poor list health score. Take immediate action to improve email quality.",
      priority: "high",
    });
  }
  
  // Warnings
  if (factors.engagementRate < 20) {
    recommendations.push({
      type: "warning",
      message: "Low engagement rate. Consider segmenting your audience and improving content.",
      priority: "medium",
    });
  }
  
  if (factors.bounceRate > 2) {
    recommendations.push({
      type: "warning",
      message: "Elevated bounce rate. Remove hard bounces and monitor soft bounces.",
      priority: "medium",
    });
  }
  
  if (factors.unsubscribeRate > 2) {
    recommendations.push({
      type: "warning",
      message: "High unsubscribe rate. Review email frequency and content relevance.",
      priority: "medium",
    });
  }
  
  // Suggestions
  const inactivePercentage = (factors.inactiveSubscribers / factors.totalSubscribers) * 100;
  if (inactivePercentage > 50) {
    recommendations.push({
      type: "suggestion",
      message: "Over 50% of subscribers are inactive. Run a re-engagement campaign.",
      priority: "medium",
    });
  }
  
  if (factors.engagementRate > 30 && factors.bounceRate < 2) {
    recommendations.push({
      type: "suggestion",
      message: "Great engagement! Consider increasing email frequency to maintain momentum.",
      priority: "low",
    });
  }
  
  if (factors.listHealthScore >= 80) {
    recommendations.push({
      type: "suggestion",
      message: "Excellent list health! Keep up the good work with quality content.",
      priority: "low",
    });
  }
  
  return recommendations;
}

