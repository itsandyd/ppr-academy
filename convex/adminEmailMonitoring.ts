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
      createdBy: "admin", // TODO: Get from auth
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
    await ctx.db.patch(args.alertId, {
      resolved: true,
      resolvedAt: Date.now(),
      resolvedBy: "admin", // TODO: Get from auth
    });
    return null;
  },
});

