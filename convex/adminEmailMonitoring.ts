import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Admin Email Monitoring Queries
 * 
 * Comprehensive analytics for platform email health monitoring
 */

// ============================================
// PLATFORM OVERVIEW
// ============================================

/**
 * Get platform-wide email health snapshot
 */
export const getPlatformOverview = query({
  args: {},
  returns: v.object({
    // Today's stats
    today: v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.number(),
      spamComplaints: v.number(),
      deliveryRate: v.number(),
      openRate: v.number(),
      bounceRate: v.number(),
      spamRate: v.number(),
    }),
    // Last 7 days trend
    trend: v.object({
      sent: v.number(),
      deliveryRate: v.number(),
      openRate: v.number(),
    }),
    // Domain health
    domains: v.object({
      total: v.number(),
      active: v.number(),
      warning: v.number(),
      suspended: v.number(),
    }),
    // Creators
    creators: v.object({
      total: v.number(),
      active: v.number(),
      flagged: v.number(),
    }),
    // Active alerts
    alerts: v.number(),
  }),
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    
    // Get all domains
    const domains = await ctx.db.query("emailDomains").collect();
    const activeDomains = domains.filter(d => d.status === "active");
    
    // Get today's analytics across all domains
    const todayAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.eq(q.field("date"), today))
      .collect();
    
    // Aggregate today's stats
    const todayStats = todayAnalytics.reduce((acc, stat) => ({
      sent: acc.sent + stat.totalSent,
      delivered: acc.delivered + stat.totalDelivered,
      opened: acc.opened + stat.totalOpened,
      clicked: acc.clicked + stat.totalClicked,
      bounced: acc.bounced + stat.totalBounced,
      spamComplaints: acc.spamComplaints + stat.spamComplaints,
    }), { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, spamComplaints: 0 });
    
    // Calculate rates
    const deliveryRate = todayStats.sent > 0 
      ? (todayStats.delivered / todayStats.sent) * 100 
      : 0;
    const openRate = todayStats.delivered > 0 
      ? (todayStats.opened / todayStats.delivered) * 100 
      : 0;
    const bounceRate = todayStats.sent > 0 
      ? (todayStats.bounced / todayStats.sent) * 100 
      : 0;
    const spamRate = todayStats.sent > 0 
      ? (todayStats.spamComplaints / todayStats.sent) * 100 
      : 0;
    
    // Get last 7 days for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    
    const last7DaysAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.gte(q.field("date"), sevenDaysAgoStr))
      .collect();
    
    const last7DaysStats = last7DaysAnalytics.reduce((acc, stat) => ({
      sent: acc.sent + stat.totalSent,
      delivered: acc.delivered + stat.totalDelivered,
      opened: acc.opened + stat.totalOpened,
    }), { sent: 0, delivered: 0, opened: 0 });
    
    // Get creator stats
    const creatorStats = await ctx.db
      .query("emailCreatorStats")
      .filter(q => q.eq(q.field("date"), today))
      .collect();
    
    const flaggedCreators = creatorStats.filter(
      s => s.sendingStatus === "warning" || s.sendingStatus === "suspended"
    ).length;
    
    // Get active alerts
    const activeAlerts = await ctx.db
      .query("emailDomainAlerts")
      .filter(q => q.eq(q.field("resolved"), false))
      .collect();
    
    return {
      today: {
        ...todayStats,
        deliveryRate,
        openRate,
        bounceRate,
        spamRate,
      },
      trend: {
        sent: last7DaysStats.sent,
        deliveryRate: last7DaysStats.sent > 0 
          ? (last7DaysStats.delivered / last7DaysStats.sent) * 100 
          : 0,
        openRate: last7DaysStats.delivered > 0 
          ? (last7DaysStats.opened / last7DaysStats.delivered) * 100 
          : 0,
      },
      domains: {
        total: domains.length,
        active: activeDomains.length,
        warning: domains.filter(d => 
          d.reputation.status === "fair" || d.reputation.status === "poor"
        ).length,
        suspended: domains.filter(d => d.status === "suspended").length,
      },
      creators: {
        total: creatorStats.length,
        active: creatorStats.filter(s => s.sendingStatus === "active").length,
        flagged: flaggedCreators,
      },
      alerts: activeAlerts.length,
    };
  },
});

// ============================================
// DOMAIN MANAGEMENT
// ============================================

/**
 * List all email domains
 */
export const listEmailDomains = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("emailDomains"),
    domain: v.string(),
    type: v.string(),
    status: v.string(),
    reputation: v.object({
      score: v.number(),
      status: v.string(),
      lastUpdated: v.number(),
    }),
    todayStats: v.optional(v.object({
      sent: v.number(),
      delivered: v.number(),
      bounceRate: v.number(),
      spamRate: v.number(),
    })),
    alerts: v.number(),
  })),
  handler: async (ctx) => {
    const domains = await ctx.db.query("emailDomains").collect();
    const today = new Date().toISOString().split("T")[0];
    
    const domainsWithStats = await Promise.all(
      domains.map(async (domain) => {
        // Get today's analytics
        const todayAnalytics = await ctx.db
          .query("emailDomainAnalytics")
          .filter(q => q.and(
            q.eq(q.field("domainId"), domain._id),
            q.eq(q.field("date"), today)
          ))
          .first();
        
        // Get active alerts
        const alerts = await ctx.db
          .query("emailDomainAlerts")
          .filter(q => q.and(
            q.eq(q.field("domainId"), domain._id),
            q.eq(q.field("resolved"), false)
          ))
          .collect();
        
        return {
          _id: domain._id,
          domain: domain.domain,
          type: domain.type,
          status: domain.status,
          reputation: domain.reputation,
          todayStats: todayAnalytics ? {
            sent: todayAnalytics.totalSent,
            delivered: todayAnalytics.totalDelivered,
            bounceRate: todayAnalytics.bounceRate,
            spamRate: todayAnalytics.spamRate,
          } : undefined,
          alerts: alerts.length,
        };
      })
    );
    
    return domainsWithStats;
  },
});

/**
 * Get detailed domain analytics
 */
export const getDomainDetails = query({
  args: { domainId: v.id("emailDomains") },
  returns: v.object({
    domain: v.any(),
    analytics: v.object({
      today: v.any(),
      last7Days: v.array(v.any()),
      last30Days: v.object({
        totalSent: v.number(),
        avgDeliveryRate: v.number(),
        avgOpenRate: v.number(),
        avgBounceRate: v.number(),
      }),
    }),
    topCreators: v.array(v.object({
      storeId: v.id("stores"),
      storeName: v.string(),
      sent: v.number(),
      bounceRate: v.number(),
      openRate: v.number(),
      status: v.string(),
    })),
    recentEvents: v.array(v.any()),
    alerts: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain) throw new Error("Domain not found");
    
    const today = new Date().toISOString().split("T")[0];
    
    // Today's analytics
    const todayAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.eq(q.field("date"), today)
      ))
      .first();
    
    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.gte(q.field("date"), sevenDaysAgo.toISOString().split("T")[0])
      ))
      .collect();
    
    // Last 30 days aggregates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.gte(q.field("date"), thirtyDaysAgo.toISOString().split("T")[0])
      ))
      .collect();
    
    const last30DaysStats = last30DaysAnalytics.reduce((acc, stat) => ({
      totalSent: acc.totalSent + stat.totalSent,
      totalDelivered: acc.totalDelivered + stat.totalDelivered,
      totalOpened: acc.totalOpened + stat.totalOpened,
      totalBounced: acc.totalBounced + stat.totalBounced,
    }), { totalSent: 0, totalDelivered: 0, totalOpened: 0, totalBounced: 0 });
    
    // Top creators on this domain
    const creatorStats = await ctx.db
      .query("emailCreatorStats")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.eq(q.field("date"), today)
      ))
      .collect();
    
    const topCreators = await Promise.all(
      creatorStats
        .sort((a, b) => b.sent - a.sent)
        .slice(0, 10)
        .map(async (stat) => {
          const store = await ctx.db.get(stat.storeId);
          return {
            storeId: stat.storeId,
            storeName: store?.name || "Unknown",
            sent: stat.sent,
            bounceRate: stat.bounceRate,
            openRate: stat.openRate,
            status: stat.sendingStatus,
          };
        })
    );
    
    // Recent events
    const recentEvents = await ctx.db
      .query("emailEvents")
      .filter(q => q.eq(q.field("domainId"), args.domainId))
      .order("desc")
      .take(50);
    
    // Active alerts
    const alerts = await ctx.db
      .query("emailDomainAlerts")
      .filter(q => q.and(
        q.eq(q.field("domainId"), args.domainId),
        q.eq(q.field("resolved"), false)
      ))
      .collect();
    
    return {
      domain,
      analytics: {
        today: todayAnalytics,
        last7Days: last7DaysAnalytics,
        last30Days: {
          totalSent: last30DaysStats.totalSent,
          avgDeliveryRate: last30DaysStats.totalSent > 0 
            ? (last30DaysStats.totalDelivered / last30DaysStats.totalSent) * 100 
            : 0,
          avgOpenRate: last30DaysStats.totalDelivered > 0 
            ? (last30DaysStats.totalOpened / last30DaysStats.totalDelivered) * 100 
            : 0,
          avgBounceRate: last30DaysStats.totalSent > 0 
            ? (last30DaysStats.totalBounced / last30DaysStats.totalSent) * 100 
            : 0,
        },
      },
      topCreators,
      recentEvents,
      alerts,
    };
  },
});

// ============================================
// CREATOR MONITORING
// ============================================

/**
 * List flagged creators (high bounce, spam, etc.)
 */
export const getFlaggedCreators = query({
  args: {},
  returns: v.array(v.object({
    storeId: v.id("stores"),
    storeName: v.string(),
    domain: v.string(),
    issues: v.array(v.string()),
    bounceRate: v.number(),
    spamRate: v.number(),
    reputationScore: v.number(),
    status: v.string(),
  })),
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    
    const creatorStats = await ctx.db
      .query("emailCreatorStats")
      .filter(q => q.and(
        q.eq(q.field("date"), today),
        q.or(
          q.eq(q.field("sendingStatus"), "warning"),
          q.eq(q.field("sendingStatus"), "suspended")
        )
      ))
      .collect();
    
    const flaggedCreators = await Promise.all(
      creatorStats.map(async (stat) => {
        const store = await ctx.db.get(stat.storeId);
        const domain = await ctx.db.get(stat.domainId);
        
        const issues = [];
        if (stat.bounceRate > 5) issues.push(`High bounce rate: ${stat.bounceRate.toFixed(1)}%`);
        if (stat.spamRate > 0.1) issues.push(`Spam complaints: ${stat.spamRate.toFixed(2)}%`);
        if (stat.reputationScore < 50) issues.push(`Low reputation: ${stat.reputationScore}/100`);
        
        return {
          storeId: stat.storeId,
          storeName: store?.name || "Unknown",
          domain: domain?.domain || "Unknown",
          issues,
          bounceRate: stat.bounceRate,
          spamRate: stat.spamRate,
          reputationScore: stat.reputationScore,
          status: stat.sendingStatus,
        };
      })
    );
    
    return flaggedCreators;
  },
});

// ============================================
// DOMAIN MANAGEMENT MUTATIONS
// ============================================

/**
 * Add new sending domain
 */
export const addEmailDomain = mutation({
  args: {
    domain: v.string(),
    type: v.union(v.literal("shared"), v.literal("dedicated"), v.literal("custom")),
  },
  returns: v.id("emailDomains"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const createdBy = identity?.subject || "system";

    // Check if domain already exists
    const existing = await ctx.db
      .query("emailDomains")
      .filter(q => q.eq(q.field("domain"), args.domain))
      .first();

    if (existing) {
      throw new Error("Domain already exists");
    }

    const domainId = await ctx.db.insert("emailDomains", {
      domain: args.domain,
      type: args.type,
      status: "pending",
      dnsRecords: {
        spf: { record: "", verified: false },
        dkim: [],
        dmarc: { record: "", verified: false },
      },
      reputation: {
        score: 100,
        status: "excellent",
        lastUpdated: Date.now(),
      },
      rateLimits: {
        dailyLimit: 10000,
        hourlyLimit: 1000,
        currentDailyUsage: 0,
        currentHourlyUsage: 0,
        resetAt: Date.now() + 24 * 60 * 60 * 1000,
      },
      createdBy,
      createdAt: Date.now(),
    });
    
    return domainId;
  },
});

/**
 * Update domain status
 */
export const updateDomainStatus = mutation({
  args: {
    domainId: v.id("emailDomains"),
    status: v.union(
      v.literal("pending"),
      v.literal("verifying"),
      v.literal("active"),
      v.literal("suspended"),
      v.literal("retired")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.domainId, {
      status: args.status,
    });
    return null;
  },
});

/**
 * Delete email domain
 */
export const deleteEmailDomain = mutation({
  args: {
    domainId: v.id("emailDomains"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if domain has any analytics data
    const hasAnalytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.eq(q.field("domainId"), args.domainId))
      .first();
    
    if (hasAnalytics) {
      throw new Error(
        "Cannot delete domain with existing analytics data. " +
        "Please archive or export the data first."
      );
    }
    
    // Delete the domain
    await ctx.db.delete(args.domainId);
    return null;
  },
});

/**
 * Create alert for domain issue
 */
export const createDomainAlert = mutation({
  args: {
    domainId: v.id("emailDomains"),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    type: v.union(
      v.literal("high_bounce_rate"),
      v.literal("spam_complaints"),
      v.literal("dns_issue"),
      v.literal("rate_limit_reached"),
      v.literal("reputation_drop"),
      v.literal("blacklist_detected")
    ),
    message: v.string(),
    details: v.optional(v.string()),
  },
  returns: v.id("emailDomainAlerts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailDomainAlerts", {
      domainId: args.domainId,
      severity: args.severity,
      type: args.type,
      message: args.message,
      details: args.details,
      createdAt: Date.now(),
      resolved: false,
    });
  },
});

/**
 * Resolve alert
 */
export const resolveAlert = mutation({
  args: {
    alertId: v.id("emailDomainAlerts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const resolvedBy = identity?.subject || "system";

    await ctx.db.patch(args.alertId, {
      resolved: true,
      resolvedAt: Date.now(),
      resolvedBy,
    });
    return null;
  },
});

// ============================================
// EMAIL ANALYTICS CHARTS DATA
// ============================================

/**
 * Get email analytics chart data for last N days
 */
export const getEmailAnalyticsChartData = query({
  args: {
    days: v.optional(v.number()), // Default 30 days
  },
  returns: v.array(v.object({
    date: v.string(),
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    spamComplaints: v.number(),
    deliveryRate: v.number(),
    openRate: v.number(),
    bounceRate: v.number(),
  })),
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Generate all dates in range
    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    // Get all analytics for date range
    const startDateStr = startDate.toISOString().split("T")[0];
    const analytics = await ctx.db
      .query("emailDomainAnalytics")
      .filter(q => q.gte(q.field("date"), startDateStr))
      .collect();

    // Aggregate by date
    const dataByDate = new Map<string, {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      spamComplaints: number;
    }>();

    for (const record of analytics) {
      const existing = dataByDate.get(record.date) || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spamComplaints: 0,
      };

      dataByDate.set(record.date, {
        sent: existing.sent + record.totalSent,
        delivered: existing.delivered + record.totalDelivered,
        opened: existing.opened + record.totalOpened,
        clicked: existing.clicked + record.totalClicked,
        bounced: existing.bounced + record.totalBounced,
        spamComplaints: existing.spamComplaints + record.spamComplaints,
      });
    }

    // Build result with all dates (fill zeros for missing days)
    return dates.map(date => {
      const data = dataByDate.get(date) || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spamComplaints: 0,
      };

      return {
        date,
        ...data,
        deliveryRate: data.sent > 0 ? (data.delivered / data.sent) * 100 : 0,
        openRate: data.delivered > 0 ? (data.opened / data.delivered) * 100 : 0,
        bounceRate: data.sent > 0 ? (data.bounced / data.sent) * 100 : 0,
      };
    });
  },
});

/**
 * Get recent email activity feed
 */
export const getRecentEmailActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    message: v.string(),
    email: v.optional(v.string()),
    domain: v.optional(v.string()),
    timestamp: v.number(),
    status: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get recent deliverability events
    const recentEvents = await ctx.db
      .query("emailDeliverabilityEvents")
      .order("desc")
      .take(limit);

    // Transform to activity feed format
    const activities = recentEvents.map(event => {
      let type = "event";
      let message = `Email event for ${event.email}`;

      switch (event.eventType) {
        case "hard_bounce":
          type = "bounce";
          message = `Hard bounce from ${event.email}`;
          break;
        case "soft_bounce":
          type = "bounce";
          message = `Soft bounce from ${event.email}`;
          break;
        case "spam_complaint":
          type = "error";
          message = `Spam complaint from ${event.email}`;
          break;
        case "blocked":
          type = "error";
          message = `Email blocked for ${event.email}`;
          break;
        case "unsubscribe":
          type = "unsubscribe";
          message = `${event.email} unsubscribed`;
          break;
        case "delivery_delay":
          type = "warning";
          message = `Delivery delayed to ${event.email}`;
          break;
      }

      return {
        id: event._id,
        type,
        message,
        email: event.email,
        domain: event.storeId,
        timestamp: event.timestamp,
        status: event.eventType,
      };
    });

    return activities;
  },
});

