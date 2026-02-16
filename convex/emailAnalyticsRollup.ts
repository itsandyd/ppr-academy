import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Email Analytics Daily Rollup
 * 
 * Aggregates email events into daily analytics for:
 * - Domain health monitoring
 * - Creator performance tracking
 * - Reputation scoring
 * - Alert generation
 */

/**
 * Daily rollup - Aggregates yesterday's email events
 * Called by cron job every day at midnight
 */
export const dailyAnalyticsRollup = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    // Get all domains
    const domains = await ctx.runMutation(internal.emailAnalyticsRollup.getDomains);
    
    // Process each domain
    for (const domain of domains) {
      try {
        await ctx.runMutation(internal.emailAnalyticsRollup.rollupDomainAnalytics, {
          domainId: domain._id,
          date: yesterdayStr,
        });
      } catch (error) {
        console.error(`[Email Analytics Rollup] ❌ Failed for ${domain.domain}:`, error);
      }
    }
    
    // Update reputation scores
    await ctx.runMutation(internal.emailAnalyticsRollup.updateReputationScores);
    
    // Generate alerts if needed
    await ctx.runMutation(internal.emailAnalyticsRollup.generateHealthAlerts, {
      date: yesterdayStr,
    });
    
    return null;
  },
});


/**
 * Rollup analytics for a specific domain
 */
export const rollupDomainAnalytics = internalMutation({
  args: {
    domainId: v.id("emailDomains"),
    date: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date).setHours(23, 59, 59, 999);
    
    // Get all email events for this domain on this day
    const events = await ctx.db
      .query("emailEvents")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.gte(q.field("timestamp"), startOfDay),
        q.lte(q.field("timestamp"), endOfDay)
      ))
      .take(10000);
    
    // Aggregate metrics
    const metrics = {
      totalSent: events.filter(e => e.eventType === "sent").length,
      totalDelivered: events.filter(e => e.eventType === "delivered").length,
      totalBounced: events.filter(e => e.eventType === "bounced").length,
      totalFailed: 0, // Track separately if needed
      totalOpened: events.filter(e => e.eventType === "opened").length,
      totalClicked: events.filter(e => e.eventType === "clicked").length,
      spamComplaints: events.filter(e => e.eventType === "spam_complaint").length,
      unsubscribes: events.filter(e => e.eventType === "unsubscribed").length,
      hardBounces: events.filter(e => e.eventType === "bounced" && e.bounceType === "hard").length,
      softBounces: events.filter(e => e.eventType === "bounced" && e.bounceType === "soft").length,
    };
    
    // Count unique opens/clicks (by recipientEmail)
    const uniqueOpenEmails = new Set(
      events.filter(e => e.eventType === "opened").map(e => e.recipientEmail)
    );
    const uniqueClickEmails = new Set(
      events.filter(e => e.eventType === "clicked").map(e => e.recipientEmail)
    );
    
    // Calculate rates
    const deliveryRate = metrics.totalSent > 0 
      ? (metrics.totalDelivered / metrics.totalSent) * 100 
      : 0;
    const bounceRate = metrics.totalSent > 0 
      ? (metrics.totalBounced / metrics.totalSent) * 100 
      : 0;
    const openRate = metrics.totalDelivered > 0 
      ? (metrics.totalOpened / metrics.totalDelivered) * 100 
      : 0;
    const clickRate = metrics.totalDelivered > 0 
      ? (metrics.totalClicked / metrics.totalDelivered) * 100 
      : 0;
    const spamRate = metrics.totalSent > 0 
      ? (metrics.spamComplaints / metrics.totalSent) * 100 
      : 0;
    
    // Calculate hourly breakdown
    const hourlyStats = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(args.date).setHours(hour, 0, 0, 0);
      const hourEnd = new Date(args.date).setHours(hour, 59, 59, 999);
      
      const hourEvents = events.filter(e => 
        e.timestamp >= hourStart && e.timestamp <= hourEnd
      );
      
      hourlyStats.push({
        hour,
        sent: hourEvents.filter(e => e.eventType === "sent").length,
        delivered: hourEvents.filter(e => e.eventType === "delivered").length,
        opened: hourEvents.filter(e => e.eventType === "opened").length,
        clicked: hourEvents.filter(e => e.eventType === "clicked").length,
      });
    }
    
    // Check if analytics already exist for this date
    const existing = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.eq(q.field("date"), args.date)
      ))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        totalSent: metrics.totalSent,
        totalDelivered: metrics.totalDelivered,
        totalBounced: metrics.totalBounced,
        totalFailed: metrics.totalFailed,
        totalOpened: metrics.totalOpened,
        totalClicked: metrics.totalClicked,
        uniqueOpens: uniqueOpenEmails.size,
        uniqueClicks: uniqueClickEmails.size,
        spamComplaints: metrics.spamComplaints,
        unsubscribes: metrics.unsubscribes,
        hardBounces: metrics.hardBounces,
        softBounces: metrics.softBounces,
        deliveryRate,
        bounceRate,
        openRate,
        clickRate,
        spamRate,
        hourlyStats,
      });
    } else {
      // Create new
      await ctx.db.insert("emailDomainAnalytics", {
        domainId: args.domainId,
        date: args.date,
        totalSent: metrics.totalSent,
        totalDelivered: metrics.totalDelivered,
        totalBounced: metrics.totalBounced,
        totalFailed: metrics.totalFailed,
        totalOpened: metrics.totalOpened,
        totalClicked: metrics.totalClicked,
        uniqueOpens: uniqueOpenEmails.size,
        uniqueClicks: uniqueClickEmails.size,
        spamComplaints: metrics.spamComplaints,
        unsubscribes: metrics.unsubscribes,
        hardBounces: metrics.hardBounces,
        softBounces: metrics.softBounces,
        deliveryRate,
        bounceRate,
        openRate,
        clickRate,
        spamRate,
        hourlyStats,
      });
    }
    
    // Rollup creator stats for this domain
    await ctx.runMutation(internal.emailAnalyticsRollup.rollupCreatorStats, {
      domainId: args.domainId,
      date: args.date,
    });
    
    return null;
  },
});

/**
 * Rollup creator statistics
 */
export const rollupCreatorStats = internalMutation({
  args: {
    domainId: v.id("emailDomains"),
    date: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date).setHours(23, 59, 59, 999);
    
    // Get all events for this domain
    const events = await ctx.db
      .query("emailEvents")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.gte(q.field("timestamp"), startOfDay),
        q.lte(q.field("timestamp"), endOfDay)
      ))
      .take(10000);
    
    // Group by storeId
    const storeEvents = new Map<string, typeof events>();
    for (const event of events) {
      if (!event.storeId) continue;
      
      const storeId = event.storeId;
      if (!storeEvents.has(storeId)) {
        storeEvents.set(storeId, []);
      }
      storeEvents.get(storeId)!.push(event);
    }
    
    // Calculate stats for each store
    for (const [storeId, storeEventsList] of storeEvents) {
      const sent = storeEventsList.filter(e => e.eventType === "sent").length;
      const delivered = storeEventsList.filter(e => e.eventType === "delivered").length;
      const bounced = storeEventsList.filter(e => e.eventType === "bounced").length;
      const opened = storeEventsList.filter(e => e.eventType === "opened").length;
      const clicked = storeEventsList.filter(e => e.eventType === "clicked").length;
      const spamComplaints = storeEventsList.filter(e => e.eventType === "spam_complaint").length;
      const unsubscribes = storeEventsList.filter(e => e.eventType === "unsubscribed").length;
      
      const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const spamRate = sent > 0 ? (spamComplaints / sent) * 100 : 0;
      
      // Calculate reputation score (0-100)
      let reputationScore = 100;
      
      // Penalties
      if (bounceRate > 2) reputationScore -= (bounceRate - 2) * 5; // -5 per % over 2%
      if (spamRate > 0.01) reputationScore -= (spamRate - 0.01) * 100; // Heavy penalty
      if (openRate < 20) reputationScore -= (20 - openRate) * 2; // Low engagement penalty
      
      reputationScore = Math.max(0, Math.min(100, reputationScore));
      
      // Determine sending status
      let sendingStatus: "active" | "warning" | "suspended" = "active";
      const warnings = [];
      
      if (bounceRate > 5) {
        sendingStatus = "warning";
        warnings.push({
          type: "high_bounce" as const,
          message: `Bounce rate ${bounceRate.toFixed(1)}% exceeds 5% threshold`,
          timestamp: Date.now(),
        });
      }
      
      if (bounceRate > 10) {
        sendingStatus = "suspended";
      }
      
      if (spamRate > 0.1) {
        sendingStatus = "warning";
        warnings.push({
          type: "spam_complaints" as const,
          message: `Spam rate ${spamRate.toFixed(2)}% exceeds 0.1% threshold`,
          timestamp: Date.now(),
        });
      }
      
      if (spamRate > 0.2) {
        sendingStatus = "suspended";
      }
      
      if (reputationScore < 50) {
        sendingStatus = "warning";
        warnings.push({
          type: "low_engagement" as const,
          message: `Reputation score ${reputationScore.toFixed(0)}/100 is below healthy threshold`,
          timestamp: Date.now(),
        });
      }
      
      // Check if stats already exist
      const existing = await ctx.db
        .query("emailCreatorStats")
        .filter(q => q.and(
          q.eq(q.field("storeId"), storeId as any),
          q.eq(q.field("domainId"), args.domainId),
          q.eq(q.field("date"), args.date)
        ))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          sent,
          delivered,
          bounced,
          opened,
          clicked,
          spamComplaints,
          unsubscribes,
          bounceRate,
          openRate,
          spamRate,
          reputationScore,
          warnings: warnings.length > 0 ? warnings : undefined,
          sendingStatus,
        });
      } else {
        await ctx.db.insert("emailCreatorStats", {
          storeId: storeId as any,
          domainId: args.domainId,
          date: args.date,
          sent,
          delivered,
          bounced,
          opened,
          clicked,
          spamComplaints,
          unsubscribes,
          bounceRate,
          openRate,
          spamRate,
          reputationScore,
          warnings: warnings.length > 0 ? warnings : undefined,
          sendingStatus,
        });
      }
    }
    
    return null;
  },
});

/**
 * Update domain reputation scores
 */
export const updateReputationScores = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const domains = await ctx.db.query("emailDomains").take(10000);

    // Get last 7 days for reputation calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    
    for (const domain of domains) {
      // Get last 7 days of analytics
      const recentAnalytics = await ctx.db
        .query("emailDomainAnalytics")
        .filter(q => q.and(
          q.eq(q.field("domainId"), domain._id),
          q.gte(q.field("date"), sevenDaysAgoStr)
        ))
        .take(10000);
      
      if (recentAnalytics.length === 0) continue;
      
      // Calculate average rates
      const avgBounceRate = recentAnalytics.reduce((sum, a) => sum + a.bounceRate, 0) / recentAnalytics.length;
      const avgSpamRate = recentAnalytics.reduce((sum, a) => sum + a.spamRate, 0) / recentAnalytics.length;
      const avgOpenRate = recentAnalytics.reduce((sum, a) => sum + a.openRate, 0) / recentAnalytics.length;
      const avgDeliveryRate = recentAnalytics.reduce((sum, a) => sum + a.deliveryRate, 0) / recentAnalytics.length;
      
      // Calculate reputation score
      let score = 100;
      
      // Bounce rate penalty (max -40 points)
      if (avgBounceRate > 2) {
        score -= Math.min(40, (avgBounceRate - 2) * 5);
      }
      
      // Spam rate penalty (max -50 points)
      if (avgSpamRate > 0.01) {
        score -= Math.min(50, (avgSpamRate - 0.01) * 500);
      }
      
      // Low engagement penalty (max -20 points)
      if (avgOpenRate < 20) {
        score -= Math.min(20, (20 - avgOpenRate) * 2);
      }
      
      // Delivery rate penalty (max -30 points)
      if (avgDeliveryRate < 95) {
        score -= Math.min(30, (95 - avgDeliveryRate) * 3);
      }
      
      score = Math.max(0, Math.min(100, Math.round(score)));
      
      // Determine status
      let status: "excellent" | "good" | "fair" | "poor" | "critical";
      if (score >= 90) status = "excellent";
      else if (score >= 70) status = "good";
      else if (score >= 50) status = "fair";
      else if (score >= 30) status = "poor";
      else status = "critical";
      
      // Update domain reputation
      await ctx.db.patch(domain._id, {
        reputation: {
          score,
          status,
          lastUpdated: Date.now(),
        },
      });
    }
    
    return null;
  },
});

/**
 * Generate health alerts based on metrics
 */
export const generateHealthAlerts = internalMutation({
  args: { date: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all domain analytics for the date
    const analytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.eq(q.field("date"), args.date))
      .take(10000);
    
    for (const stat of analytics) {
      const domain = await ctx.db.get(stat.domainId);
      if (!domain) continue;
      
      // Check for high bounce rate
      if (stat.bounceRate > 5) {
        await ctx.db.insert("emailDomainAlerts", {
          domainId: stat.domainId,
          severity: stat.bounceRate > 10 ? "critical" : "warning",
          type: "high_bounce_rate",
          message: `High bounce rate detected: ${stat.bounceRate.toFixed(1)}%`,
          details: `Domain ${domain.domain} had ${stat.totalBounced} bounces out of ${stat.totalSent} emails sent on ${args.date}`,
          createdAt: Date.now(),
          resolved: false,
        });
      }
      
      // Check for spam complaints
      if (stat.spamRate > 0.1) {
        await ctx.db.insert("emailDomainAlerts", {
          domainId: stat.domainId,
          severity: stat.spamRate > 0.2 ? "critical" : "warning",
          type: "spam_complaints",
          message: `Spam complaints detected: ${stat.spamRate.toFixed(2)}%`,
          details: `Domain ${domain.domain} received ${stat.spamComplaints} spam complaints on ${args.date}`,
          createdAt: Date.now(),
          resolved: false,
        });
      }
      
      // Check for reputation drop
      if (domain.reputation.score < 50) {
        await ctx.db.insert("emailDomainAlerts", {
          domainId: stat.domainId,
          severity: domain.reputation.score < 30 ? "critical" : "warning",
          type: "reputation_drop",
          message: `Low reputation score: ${domain.reputation.score}/100`,
          details: `Domain ${domain.domain} reputation has dropped to ${domain.reputation.status}`,
          createdAt: Date.now(),
          resolved: false,
        });
      }
    }
    
    return null;
  },
});

/**
 * Get all domains for rollup
 */
export const getDomains = internalMutation({
  args: {},
  returns: v.array(v.object({
    _id: v.id("emailDomains"),
    domain: v.string(),
  })),
  handler: async (ctx) => {
    const domains = await ctx.db.query("emailDomains").take(10000);
    return domains.map(d => ({ _id: d._id, domain: d.domain }));
  },
});

