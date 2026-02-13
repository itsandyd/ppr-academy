import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================================
// EMAIL ANALYTICS - Mutations & Queries for dashboard
// ============================================================================

/**
 * Log a raw webhook event to webhookEmailEvents table.
 * Looks up resendLogs → resendConnections to attribute events to creators.
 */
export const logEmailEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("delivery_delayed")
    ),
    emailAddress: v.string(),
    emailId: v.string(),
    subject: v.optional(v.string()),
    timestamp: v.number(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Look up campaignId and storeId from resendLogs → resendConnections
    const log = await ctx.db
      .query("resendLogs")
      .withIndex("by_resend_id", (q) => q.eq("resendEmailId", args.emailId))
      .first();

    let storeId: string | undefined;
    if (log) {
      const connection = await ctx.db.get(log.connectionId);
      if (connection) {
        // Use the connection owner's Clerk ID as storeId (matches emailContacts.storeId)
        storeId = connection.userId;
      }
    }

    const eventId = await ctx.db.insert("webhookEmailEvents", {
      eventType: args.eventType,
      emailAddress: args.emailAddress.toLowerCase().trim(),
      emailId: args.emailId,
      campaignId: log?.campaignId ?? undefined,
      storeId,
      subject: args.subject || log?.subject,
      timestamp: args.timestamp,
      metadata: args.metadata,
    });

    // Check for alert conditions on bounces and complaints
    if (args.eventType === "bounced" || args.eventType === "complained") {
      await ctx.scheduler.runAfter(0, internal.emailAnalytics.checkAlertThresholds, {
        eventType: args.eventType,
        campaignId: log?.campaignId ?? undefined,
        storeId,
      });
    }

    return eventId;
  },
});

/**
 * Check if bounce/complaint rates exceed thresholds and create alerts
 */
export const checkAlertThresholds = internalMutation({
  args: {
    eventType: v.union(v.literal("bounced"), v.literal("complained")),
    campaignId: v.optional(v.id("resendCampaigns")),
    storeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.campaignId) return;

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.sentCount === 0) return;

    const bounceRate = (campaign.bouncedCount / campaign.sentCount) * 100;
    const complaintRate = (campaign.complainedCount / campaign.sentCount) * 100;

    // Check bounce rate > 2%
    if (args.eventType === "bounced" && bounceRate > 2) {
      const existingAlert = await ctx.db
        .query("emailAlerts")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("alertType"), "high_bounce_rate"),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();

      if (!existingAlert) {
        await ctx.db.insert("emailAlerts", {
          alertType: "high_bounce_rate",
          severity: bounceRate > 5 ? "critical" : "warning",
          campaignId: args.campaignId,
          campaignName: campaign.name,
          storeId: args.storeId,
          message: `Bounce rate for "${campaign.name}" is ${bounceRate.toFixed(1)}%, exceeding the 2% threshold`,
          metric: bounceRate,
          threshold: 2,
          recommendation:
            "Review your email list for invalid addresses. Consider cleaning your list and verifying emails before sending.",
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }

    // Check complaint rate > 0.1%
    if (args.eventType === "complained" && complaintRate > 0.1) {
      const existingAlert = await ctx.db
        .query("emailAlerts")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId!))
        .filter((q) =>
          q.and(
            q.eq(q.field("alertType"), "high_complaint_rate"),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();

      if (!existingAlert) {
        await ctx.db.insert("emailAlerts", {
          alertType: "high_complaint_rate",
          severity: complaintRate > 0.3 ? "critical" : "warning",
          campaignId: args.campaignId,
          campaignName: campaign.name,
          storeId: args.storeId,
          message: `Complaint rate for "${campaign.name}" is ${complaintRate.toFixed(2)}%, exceeding the 0.1% threshold`,
          metric: complaintRate,
          threshold: 0.1,
          recommendation:
            "Review your email content and targeting. Ensure recipients have opted in. Consider adding a more visible unsubscribe link.",
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// ============================================================================
// ADMIN DASHBOARD QUERIES (no storeId filter - sees everything)
// ============================================================================

/**
 * Overview stats: total emails sent (all time, 7 days, 30 days),
 * current rates, and health score
 */
export const getOverviewStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allEvents = await ctx.db.query("webhookEmailEvents").collect();

    const allTime = {
      sent: allEvents.filter((e) => e.eventType === "sent").length,
      delivered: allEvents.filter((e) => e.eventType === "delivered").length,
      bounced: allEvents.filter((e) => e.eventType === "bounced").length,
      complained: allEvents.filter((e) => e.eventType === "complained").length,
      opened: allEvents.filter((e) => e.eventType === "opened").length,
      clicked: allEvents.filter((e) => e.eventType === "clicked").length,
    };

    const last7Days = {
      sent: allEvents.filter((e) => e.eventType === "sent" && e.timestamp >= sevenDaysAgo).length,
      delivered: allEvents.filter((e) => e.eventType === "delivered" && e.timestamp >= sevenDaysAgo).length,
      bounced: allEvents.filter((e) => e.eventType === "bounced" && e.timestamp >= sevenDaysAgo).length,
      complained: allEvents.filter((e) => e.eventType === "complained" && e.timestamp >= sevenDaysAgo).length,
    };

    const last30Days = {
      sent: allEvents.filter((e) => e.eventType === "sent" && e.timestamp >= thirtyDaysAgo).length,
      delivered: allEvents.filter((e) => e.eventType === "delivered" && e.timestamp >= thirtyDaysAgo).length,
      bounced: allEvents.filter((e) => e.eventType === "bounced" && e.timestamp >= thirtyDaysAgo).length,
      complained: allEvents.filter((e) => e.eventType === "complained" && e.timestamp >= thirtyDaysAgo).length,
    };

    // Calculate rates from last 30 days
    const bounceRate = last30Days.sent > 0
      ? (last30Days.bounced / last30Days.sent) * 100
      : 0;
    const complaintRate = last30Days.sent > 0
      ? (last30Days.complained / last30Days.sent) * 100
      : 0;
    const deliveryRate = last30Days.sent > 0
      ? (last30Days.delivered / last30Days.sent) * 100
      : 0;

    // Health score from suppression list
    const allPrefs = await ctx.db.query("resendPreferences").collect();
    const totalContacts = allPrefs.length;
    const suppressedContacts = allPrefs.filter((p) => p.isUnsubscribed).length;
    const activeContacts = totalContacts - suppressedContacts;
    const healthScore = totalContacts > 0
      ? Math.round((activeContacts / totalContacts) * 100)
      : 100;

    return {
      allTime,
      last7Days,
      last30Days,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 1000) / 1000,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      healthScore,
      totalContacts,
      activeContacts,
      suppressedContacts,
    };
  },
});

/**
 * Trend data for charts - events grouped by day for the last N days
 */
export const getTrendData = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const numDays = args.days || 30;
    const now = Date.now();
    const startTime = now - numDays * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startTime))
      .collect();

    // Group by day
    const dayMap = new Map<string, {
      date: string;
      sent: number;
      delivered: number;
      bounced: number;
      complained: number;
      opened: number;
      clicked: number;
    }>();

    // Initialize all days
    for (let i = 0; i < numDays; i++) {
      const dayTs = now - (numDays - 1 - i) * 24 * 60 * 60 * 1000;
      const dateStr = new Date(dayTs).toISOString().split("T")[0];
      dayMap.set(dateStr, {
        date: dateStr,
        sent: 0,
        delivered: 0,
        bounced: 0,
        complained: 0,
        opened: 0,
        clicked: 0,
      });
    }

    for (const event of events) {
      const dateStr = new Date(event.timestamp).toISOString().split("T")[0];
      const day = dayMap.get(dateStr);
      if (day && event.eventType in day) {
        (day as any)[event.eventType]++;
      }
    }

    return Array.from(dayMap.values());
  },
});

/**
 * Get active alerts
 */
export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("emailAlerts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

/**
 * Get all alerts (including acknowledged)
 */
export const getAllAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("emailAlerts")
      .order("desc")
      .take(50);
  },
});

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("emailAlerts"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      isActive: false,
      acknowledgedAt: Date.now(),
      acknowledgedBy: args.clerkId,
    });
  },
});

// ============================================================================
// CAMPAIGN ANALYTICS (Admin)
// ============================================================================

/**
 * Get all campaigns with their analytics
 */
export const getCampaignAnalytics = query({
  args: {
    sortBy: v.optional(
      v.union(
        v.literal("date"),
        v.literal("bounceRate"),
        v.literal("complaintRate"),
        v.literal("name")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db.query("resendCampaigns").collect();

    const campaignData = campaigns.map((c) => {
      const bounceRate = c.sentCount > 0 ? (c.bouncedCount / c.sentCount) * 100 : 0;
      const complaintRate = c.sentCount > 0 ? (c.complainedCount / c.sentCount) * 100 : 0;
      const deliveryRate = c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0;
      const openRate = c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0;
      const clickRate = c.deliveredCount > 0 ? (c.clickedCount / c.deliveredCount) * 100 : 0;

      return {
        _id: c._id,
        name: c.name,
        subject: c.subject,
        status: c.status,
        targetAudience: c.targetAudience,
        sentAt: c.sentAt,
        createdAt: c.createdAt,
        recipientCount: c.recipientCount,
        sentCount: c.sentCount,
        deliveredCount: c.deliveredCount,
        openedCount: c.openedCount,
        clickedCount: c.clickedCount,
        bouncedCount: c.bouncedCount,
        complainedCount: c.complainedCount,
        failedCount: c.failedCount || 0,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 1000) / 1000,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      };
    });

    // Sort
    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";
    const multiplier = sortOrder === "desc" ? -1 : 1;

    campaignData.sort((a, b) => {
      switch (sortBy) {
        case "bounceRate":
          return (a.bounceRate - b.bounceRate) * multiplier;
        case "complaintRate":
          return (a.complaintRate - b.complaintRate) * multiplier;
        case "name":
          return a.name.localeCompare(b.name) * multiplier;
        case "date":
        default:
          return ((a.sentAt || a.createdAt) - (b.sentAt || b.createdAt)) * multiplier;
      }
    });

    return campaignData;
  },
});

/**
 * Get detailed analytics for a specific campaign
 */
export const getCampaignDetail = query({
  args: { campaignId: v.id("resendCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    // Get events for this campaign
    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Get alerts for this campaign
    const alerts = await ctx.db
      .query("emailAlerts")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    // Group events by type
    const eventsByType: Record<string, number> = {};
    for (const e of events) {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    }

    // Timeline - events by hour
    const timeline: Array<{ hour: string; count: number }> = [];
    if (events.length > 0) {
      const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
      const startTime = sortedEvents[0].timestamp;
      const endTime = sortedEvents[sortedEvents.length - 1].timestamp;
      const hourMs = 60 * 60 * 1000;

      for (let t = startTime; t <= endTime + hourMs; t += hourMs) {
        const hourStr = new Date(t).toISOString().slice(0, 13) + ":00";
        const count = events.filter(
          (e) => e.timestamp >= t && e.timestamp < t + hourMs
        ).length;
        timeline.push({ hour: hourStr, count });
      }
    }

    // Bounced addresses
    const bouncedAddresses = events
      .filter((e) => e.eventType === "bounced")
      .map((e) => ({
        email: e.emailAddress,
        timestamp: e.timestamp,
        reason: e.metadata?.bounceReason || e.metadata?.bounceType || "Unknown",
      }));

    const bounceRate = campaign.sentCount > 0 ? (campaign.bouncedCount / campaign.sentCount) * 100 : 0;
    const complaintRate = campaign.sentCount > 0 ? (campaign.complainedCount / campaign.sentCount) * 100 : 0;
    const deliveryRate = campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0;

    return {
      ...campaign,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 1000) / 1000,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      eventsByType,
      timeline,
      bouncedAddresses,
      alerts,
    };
  },
});

// ============================================================================
// SUPPRESSION LIST MANAGEMENT (Admin)
// ============================================================================

/**
 * Get paginated suppression list with filtering and search
 */
export const getSuppressionList = query({
  args: {
    search: v.optional(v.string()),
    reasonFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allPrefs = await ctx.db.query("resendPreferences").collect();
    let suppressed = allPrefs.filter((p) => p.isUnsubscribed);

    // Filter by reason
    if (args.reasonFilter && args.reasonFilter !== "all") {
      suppressed = suppressed.filter((p) => {
        const reason = (p.unsubscribeReason || "").toLowerCase();
        switch (args.reasonFilter) {
          case "bounced":
            return reason.includes("bounce");
          case "complained":
            return reason.includes("complaint") || reason.includes("spam");
          case "unsubscribed":
            return reason.includes("unsubscrib") && !reason.includes("bounce") && !reason.includes("spam") && !reason.includes("complaint");
          case "manual":
            return reason.includes("manual") || reason.includes("bulk");
          default:
            return true;
        }
      });
    }

    // Search by email
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      suppressed = suppressed.filter((p) =>
        p.userId.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent
    suppressed.sort((a, b) => (b.unsubscribedAt || 0) - (a.unsubscribedAt || 0));

    return suppressed.map((p) => ({
      _id: p._id,
      email: p.userId,
      reason: p.unsubscribeReason || "Unknown",
      suppressedAt: p.unsubscribedAt || p.createdAt,
      platformEmails: p.platformEmails,
      courseEmails: p.courseEmails,
      marketingEmails: p.marketingEmails,
    }));
  },
});

/**
 * Remove an email from suppression list (re-enable)
 */
export const removeSuppression = mutation({
  args: {
    prefId: v.id("resendPreferences"),
  },
  handler: async (ctx, args) => {
    const pref = await ctx.db.get(args.prefId);
    if (!pref) return { success: false, message: "Not found" };

    await ctx.db.patch(args.prefId, {
      isUnsubscribed: false,
      unsubscribedAt: undefined,
      unsubscribeReason: undefined,
      platformEmails: true,
      courseEmails: true,
      marketingEmails: true,
      weeklyDigest: true,
      updatedAt: Date.now(),
    });

    return { success: true, message: `${pref.userId} removed from suppression list` };
  },
});

/**
 * Manually add an email to suppression list
 */
export const addSuppression = mutation({
  args: {
    email: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const existing = await ctx.db
      .query("resendPreferences")
      .withIndex("by_user", (q) => q.eq("userId", email))
      .first();

    if (existing) {
      if (existing.isUnsubscribed) {
        return { success: true, message: "Already suppressed" };
      }
      await ctx.db.patch(existing._id, {
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: args.reason || "Manual suppression",
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("resendPreferences", {
        userId: email,
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: args.reason || "Manual suppression",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, message: `${email} added to suppression list` };
  },
});

// ============================================================================
// LIST HEALTH (Admin)
// ============================================================================

/**
 * Get list health breakdown
 */
export const getListHealth = query({
  args: {},
  handler: async (ctx) => {
    const allPrefs = await ctx.db.query("resendPreferences").collect();

    // Categorize by reason
    let active = 0;
    let unsubscribed = 0;
    let bounced = 0;
    let complained = 0;

    for (const pref of allPrefs) {
      if (!pref.isUnsubscribed) {
        active++;
        continue;
      }
      const reason = (pref.unsubscribeReason || "").toLowerCase();
      if (reason.includes("bounce")) {
        bounced++;
      } else if (reason.includes("complaint") || reason.includes("spam")) {
        complained++;
      } else {
        unsubscribed++;
      }
    }

    // Contacts added over time (group by month)
    const monthlyGrowth: Array<{ month: string; count: number }> = [];
    const monthMap = new Map<string, number>();
    for (const pref of allPrefs) {
      const monthStr = new Date(pref.createdAt).toISOString().slice(0, 7);
      monthMap.set(monthStr, (monthMap.get(monthStr) || 0) + 1);
    }
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [month, count] of sortedMonths) {
      monthlyGrowth.push({ month, count });
    }

    // Unsubscribe trend (group by month)
    const unsubTrend: Array<{ month: string; count: number }> = [];
    const unsubMonthMap = new Map<string, number>();
    for (const pref of allPrefs) {
      if (pref.isUnsubscribed && pref.unsubscribedAt) {
        const monthStr = new Date(pref.unsubscribedAt).toISOString().slice(0, 7);
        unsubMonthMap.set(monthStr, (unsubMonthMap.get(monthStr) || 0) + 1);
      }
    }
    const sortedUnsubMonths = Array.from(unsubMonthMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [month, count] of sortedUnsubMonths) {
      unsubTrend.push({ month, count });
    }

    // Flagged contacts: find emails that appear in bounce logs multiple times
    const bounceLogs = await ctx.db
      .query("resendLogs")
      .filter((q) => q.eq(q.field("status"), "bounced"))
      .collect();

    const bounceCountMap = new Map<string, number>();
    for (const log of bounceLogs) {
      const email = log.recipientEmail.toLowerCase();
      bounceCountMap.set(email, (bounceCountMap.get(email) || 0) + 1);
    }

    const flaggedContacts = Array.from(bounceCountMap.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([email, count]) => ({ email, bounceCount: count }));

    return {
      total: allPrefs.length,
      active,
      unsubscribed,
      bounced,
      complained,
      healthScore: allPrefs.length > 0 ? Math.round((active / allPrefs.length) * 100) : 100,
      monthlyGrowth,
      unsubTrend,
      flaggedContacts,
    };
  },
});

// ============================================================================
// CREATOR-SCOPED QUERIES (filtered by storeId = Clerk user ID)
// ============================================================================

/**
 * Creator overview stats - scoped to their storeId (Clerk user ID)
 */
export const getCreatorOverviewStats = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allEvents = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const allTime = {
      sent: allEvents.filter((e) => e.eventType === "sent").length,
      delivered: allEvents.filter((e) => e.eventType === "delivered").length,
      bounced: allEvents.filter((e) => e.eventType === "bounced").length,
      complained: allEvents.filter((e) => e.eventType === "complained").length,
      opened: allEvents.filter((e) => e.eventType === "opened").length,
      clicked: allEvents.filter((e) => e.eventType === "clicked").length,
    };

    const last7Days = {
      sent: allEvents.filter((e) => e.eventType === "sent" && e.timestamp >= sevenDaysAgo).length,
      delivered: allEvents.filter((e) => e.eventType === "delivered" && e.timestamp >= sevenDaysAgo).length,
      bounced: allEvents.filter((e) => e.eventType === "bounced" && e.timestamp >= sevenDaysAgo).length,
      complained: allEvents.filter((e) => e.eventType === "complained" && e.timestamp >= sevenDaysAgo).length,
    };

    const last30Days = {
      sent: allEvents.filter((e) => e.eventType === "sent" && e.timestamp >= thirtyDaysAgo).length,
      delivered: allEvents.filter((e) => e.eventType === "delivered" && e.timestamp >= thirtyDaysAgo).length,
      bounced: allEvents.filter((e) => e.eventType === "bounced" && e.timestamp >= thirtyDaysAgo).length,
      complained: allEvents.filter((e) => e.eventType === "complained" && e.timestamp >= thirtyDaysAgo).length,
    };

    const bounceRate = last30Days.sent > 0
      ? (last30Days.bounced / last30Days.sent) * 100
      : 0;
    const complaintRate = last30Days.sent > 0
      ? (last30Days.complained / last30Days.sent) * 100
      : 0;
    const deliveryRate = last30Days.sent > 0
      ? (last30Days.delivered / last30Days.sent) * 100
      : 0;

    // Health score from creator's emailContacts
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const totalContacts = contacts.length;
    const activeContacts = contacts.filter((c) => c.status === "subscribed").length;
    const suppressedContacts = totalContacts - activeContacts;
    const healthScore = totalContacts > 0
      ? Math.round((activeContacts / totalContacts) * 100)
      : 100;

    return {
      allTime,
      last7Days,
      last30Days,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 1000) / 1000,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      healthScore,
      totalContacts,
      activeContacts,
      suppressedContacts,
    };
  },
});

/**
 * Creator trend data - scoped by storeId
 */
export const getCreatorTrendData = query({
  args: { storeId: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const numDays = args.days || 30;
    const now = Date.now();
    const startTime = now - numDays * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", startTime)
      )
      .collect();

    const dayMap = new Map<string, {
      date: string;
      sent: number;
      delivered: number;
      bounced: number;
      complained: number;
      opened: number;
      clicked: number;
    }>();

    for (let i = 0; i < numDays; i++) {
      const dayTs = now - (numDays - 1 - i) * 24 * 60 * 60 * 1000;
      const dateStr = new Date(dayTs).toISOString().split("T")[0];
      dayMap.set(dateStr, {
        date: dateStr,
        sent: 0,
        delivered: 0,
        bounced: 0,
        complained: 0,
        opened: 0,
        clicked: 0,
      });
    }

    for (const event of events) {
      const dateStr = new Date(event.timestamp).toISOString().split("T")[0];
      const day = dayMap.get(dateStr);
      if (day && event.eventType in day) {
        (day as any)[event.eventType]++;
      }
    }

    return Array.from(dayMap.values());
  },
});

/**
 * Creator active alerts - scoped by storeId
 */
export const getCreatorActiveAlerts = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailAlerts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

/**
 * Creator campaign analytics - only campaigns belonging to their connections
 */
export const getCreatorCampaignAnalytics = query({
  args: {
    storeId: v.string(),
    sortBy: v.optional(
      v.union(
        v.literal("date"),
        v.literal("bounceRate"),
        v.literal("complaintRate"),
        v.literal("name")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    // Find creator's connections by their Clerk userId
    const connections = await ctx.db
      .query("resendConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.storeId))
      .collect();

    const connectionIds = new Set(connections.map((c) => c._id));

    // Get campaigns belonging to these connections
    const allCampaigns = await ctx.db.query("resendCampaigns").collect();
    const campaigns = allCampaigns.filter(
      (c) => c.connectionId && connectionIds.has(c.connectionId)
    );

    const campaignData = campaigns.map((c) => {
      const bounceRate = c.sentCount > 0 ? (c.bouncedCount / c.sentCount) * 100 : 0;
      const complaintRate = c.sentCount > 0 ? (c.complainedCount / c.sentCount) * 100 : 0;
      const deliveryRate = c.sentCount > 0 ? (c.deliveredCount / c.sentCount) * 100 : 0;
      const openRate = c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0;
      const clickRate = c.deliveredCount > 0 ? (c.clickedCount / c.deliveredCount) * 100 : 0;

      return {
        _id: c._id,
        name: c.name,
        subject: c.subject,
        status: c.status,
        targetAudience: c.targetAudience,
        sentAt: c.sentAt,
        createdAt: c.createdAt,
        recipientCount: c.recipientCount,
        sentCount: c.sentCount,
        deliveredCount: c.deliveredCount,
        openedCount: c.openedCount,
        clickedCount: c.clickedCount,
        bouncedCount: c.bouncedCount,
        complainedCount: c.complainedCount,
        failedCount: c.failedCount || 0,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 1000) / 1000,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      };
    });

    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";
    const multiplier = sortOrder === "desc" ? -1 : 1;

    campaignData.sort((a, b) => {
      switch (sortBy) {
        case "bounceRate":
          return (a.bounceRate - b.bounceRate) * multiplier;
        case "complaintRate":
          return (a.complaintRate - b.complaintRate) * multiplier;
        case "name":
          return a.name.localeCompare(b.name) * multiplier;
        case "date":
        default:
          return ((a.sentAt || a.createdAt) - (b.sentAt || b.createdAt)) * multiplier;
      }
    });

    return campaignData;
  },
});

/**
 * Creator campaign detail - verifies ownership before returning data
 */
export const getCreatorCampaignDetail = query({
  args: {
    campaignId: v.id("resendCampaigns"),
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    // Verify ownership: campaign.connectionId → connection.userId must match storeId
    if (campaign.connectionId) {
      const connection = await ctx.db.get(campaign.connectionId);
      if (!connection || connection.userId !== args.storeId) return null;
    } else {
      return null; // No connection = admin campaign, creator can't access
    }

    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const alerts = await ctx.db
      .query("emailAlerts")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const eventsByType: Record<string, number> = {};
    for (const e of events) {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    }

    const bouncedAddresses = events
      .filter((e) => e.eventType === "bounced")
      .map((e) => ({
        email: e.emailAddress,
        timestamp: e.timestamp,
        reason: e.metadata?.bounceReason || e.metadata?.bounceType || "Unknown",
      }));

    const bounceRate = campaign.sentCount > 0 ? (campaign.bouncedCount / campaign.sentCount) * 100 : 0;
    const complaintRate = campaign.sentCount > 0 ? (campaign.complainedCount / campaign.sentCount) * 100 : 0;
    const deliveryRate = campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0;

    return {
      ...campaign,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 1000) / 1000,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      eventsByType,
      bouncedAddresses,
      alerts,
    };
  },
});

/**
 * Creator subscribers - uses emailContacts table scoped by storeId
 */
export const getCreatorSubscribers = query({
  args: {
    storeId: v.string(),
    search: v.optional(v.string()),
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Filter by status
    if (args.statusFilter && args.statusFilter !== "all") {
      contacts = contacts.filter((c) => c.status === args.statusFilter);
    }

    // Search by email or name
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(searchLower) ||
          (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
          (c.lastName && c.lastName.toLowerCase().includes(searchLower))
      );
    }

    // Sort by most recent
    contacts.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));

    return contacts.map((c) => ({
      _id: c._id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      status: c.status,
      source: c.source,
      emailsSent: c.emailsSent || 0,
      emailsOpened: c.emailsOpened || 0,
      emailsClicked: c.emailsClicked || 0,
      createdAt: c._creationTime,
      lastEngagedAt: c.lastOpenedAt,
    }));
  },
});

/**
 * Creator subscriber stats summary
 */
export const getCreatorSubscriberStats = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const total = contacts.length;
    const subscribed = contacts.filter((c) => c.status === "subscribed").length;
    const unsubscribed = contacts.filter((c) => c.status === "unsubscribed").length;
    const bounced = contacts.filter((c) => c.status === "bounced").length;
    const complained = contacts.filter((c) => c.status === "complained").length;

    // Growth: new subscribers in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newLast30 = contacts.filter((c) => (c._creationTime || 0) >= thirtyDaysAgo).length;

    return {
      total,
      subscribed,
      unsubscribed,
      bounced,
      complained,
      newLast30,
    };
  },
});

/**
 * Creator list health - uses emailContacts scoped by storeId
 */
export const getCreatorListHealth = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    let active = 0;
    let unsubscribed = 0;
    let bounced = 0;
    let complained = 0;

    for (const c of contacts) {
      switch (c.status) {
        case "subscribed":
          active++;
          break;
        case "unsubscribed":
          unsubscribed++;
          break;
        case "bounced":
          bounced++;
          break;
        case "complained":
          complained++;
          break;
      }
    }

    const total = contacts.length;
    const healthScore = total > 0 ? Math.round((active / total) * 100) : 100;

    // Monthly growth
    const monthMap = new Map<string, number>();
    for (const c of contacts) {
      const monthStr = new Date(c._creationTime || 0).toISOString().slice(0, 7);
      monthMap.set(monthStr, (monthMap.get(monthStr) || 0) + 1);
    }
    const monthlyGrowth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Unsubscribe trend from webhook events
    const unsubEvents = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_eventType", (q) =>
        q.eq("storeId", args.storeId).eq("eventType", "complained")
      )
      .collect();

    const bounceEvents = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_eventType", (q) =>
        q.eq("storeId", args.storeId).eq("eventType", "bounced")
      )
      .collect();

    const unsubMonthMap = new Map<string, number>();
    for (const e of [...unsubEvents, ...bounceEvents]) {
      const monthStr = new Date(e.timestamp).toISOString().slice(0, 7);
      unsubMonthMap.set(monthStr, (unsubMonthMap.get(monthStr) || 0) + 1);
    }
    const unsubTrend = Array.from(unsubMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Flagged contacts from creator's bounce events
    const bounceCountMap = new Map<string, number>();
    for (const e of bounceEvents) {
      const email = e.emailAddress.toLowerCase();
      bounceCountMap.set(email, (bounceCountMap.get(email) || 0) + 1);
    }

    const flaggedContacts = Array.from(bounceCountMap.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([email, count]) => ({ email, bounceCount: count }));

    return {
      total,
      active,
      unsubscribed,
      bounced,
      complained,
      healthScore,
      monthlyGrowth,
      unsubTrend,
      flaggedContacts,
    };
  },
});
