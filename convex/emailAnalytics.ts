import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireStoreOwner, requireAuth } from "./lib/auth";

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
    await requireAuth(ctx);
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
    await requireAuth(ctx);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Count per event type using the by_eventType_timestamp index
    // This avoids collecting the entire webhookEmailEvents table
    const eventTypes = ["sent", "delivered", "bounced", "complained", "opened", "clicked"] as const;

    const allTime: Record<string, number> = {};
    const last7Days: Record<string, number> = {};
    const last30Days: Record<string, number> = {};

    for (const eventType of eventTypes) {
      // All-time count: use take with a reasonable cap
      const allTimeEvents = await ctx.db
        .query("webhookEmailEvents")
        .withIndex("by_eventType_timestamp", (q) => q.eq("eventType", eventType))
        .collect();
      allTime[eventType] = allTimeEvents.length;

      // Last 7 days
      const last7Events = await ctx.db
        .query("webhookEmailEvents")
        .withIndex("by_eventType_timestamp", (q) =>
          q.eq("eventType", eventType).gte("timestamp", sevenDaysAgo)
        )
        .collect();
      last7Days[eventType] = last7Events.length;

      // Last 30 days
      const last30Events = await ctx.db
        .query("webhookEmailEvents")
        .withIndex("by_eventType_timestamp", (q) =>
          q.eq("eventType", eventType).gte("timestamp", thirtyDaysAgo)
        )
        .collect();
      last30Days[eventType] = last30Events.length;
    }

    // Calculate rates from last 30 days
    const bounceRate = (last30Days.sent ?? 0) > 0
      ? ((last30Days.bounced ?? 0) / last30Days.sent) * 100
      : 0;
    const complaintRate = (last30Days.sent ?? 0) > 0
      ? ((last30Days.complained ?? 0) / last30Days.sent) * 100
      : 0;
    const deliveryRate = (last30Days.sent ?? 0) > 0
      ? ((last30Days.delivered ?? 0) / last30Days.sent) * 100
      : 0;

    // Health score — count only unsub'd prefs with a bounded query
    const suppressedPrefs = await ctx.db
      .query("resendPreferences")
      .filter((q) => q.eq(q.field("isUnsubscribed"), true))
      .collect();
    const suppressedContacts = suppressedPrefs.length;

    const allPrefsCount = await ctx.db
      .query("resendPreferences")
      .collect();
    const totalContacts = allPrefsCount.length;
    const activeContacts = totalContacts - suppressedContacts;
    const healthScore = totalContacts > 0
      ? Math.round((activeContacts / totalContacts) * 100)
      : 100;

    return {
      allTime: {
        sent: allTime.sent ?? 0,
        delivered: allTime.delivered ?? 0,
        bounced: allTime.bounced ?? 0,
        complained: allTime.complained ?? 0,
        opened: allTime.opened ?? 0,
        clicked: allTime.clicked ?? 0,
      },
      last7Days: {
        sent: last7Days.sent ?? 0,
        delivered: last7Days.delivered ?? 0,
        bounced: last7Days.bounced ?? 0,
        complained: last7Days.complained ?? 0,
      },
      last30Days: {
        sent: last30Days.sent ?? 0,
        delivered: last30Days.delivered ?? 0,
        bounced: last30Days.bounced ?? 0,
        complained: last30Days.complained ?? 0,
      },
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
    await requireAuth(ctx);
    const numDays = args.days || 30;
    const now = Date.now();
    const startTime = now - numDays * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", startTime))
      .take(10000);

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
    await requireAuth(ctx);
    return await ctx.db
      .query("emailAlerts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(50);
  },
});

/**
 * Get all alerts (including acknowledged)
 */
export const getAllAlerts = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
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
    await requireAuth(ctx);
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
    await requireAuth(ctx);
    const campaigns = await ctx.db.query("resendCampaigns").take(200);

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
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    // Get events for this campaign — bounded to limit bandwidth
    const events = await ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

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
    await requireAuth(ctx);
    const allPrefs = await ctx.db.query("resendPreferences").take(5000);
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
    await requireAuth(ctx);
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
    await requireAuth(ctx);
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
    await requireAuth(ctx);
    const allPrefs = await ctx.db.query("resendPreferences").take(10000);

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
    await requireStoreOwner(ctx, args.storeId);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allTime = { sent: 0, delivered: 0, bounced: 0, complained: 0, opened: 0, clicked: 0 };
    const last7Days = { sent: 0, delivered: 0, bounced: 0, complained: 0 };
    const last30Days = { sent: 0, delivered: 0, bounced: 0, complained: 0 };

    // Only count last-30-day events using the timestamp index to minimize reads.
    // For all-time, we approximate by also reading a capped window.
    const EVENT_LIMIT = 25000;
    let eventCount = 0;
    for await (const e of ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")) {
      const type = e.eventType as keyof typeof allTime;
      if (type in allTime) allTime[type]++;

      const type30 = e.eventType as keyof typeof last30Days;
      if (e.timestamp >= thirtyDaysAgo && type30 in last30Days) {
        last30Days[type30]++;
      }
      if (e.timestamp >= sevenDaysAgo && type30 in last7Days) {
        last7Days[type30]++;
      }
      eventCount++;
      if (eventCount >= EVENT_LIMIT) break;
    }

    const bounceRate = last30Days.sent > 0
      ? (last30Days.bounced / last30Days.sent) * 100
      : 0;
    const complaintRate = last30Days.sent > 0
      ? (last30Days.complained / last30Days.sent) * 100
      : 0;
    const deliveryRate = last30Days.sent > 0
      ? (last30Days.delivered / last30Days.sent) * 100
      : 0;

    // Health score from creator's emailContacts - stream with cap
    let totalContacts = 0;
    let activeContacts = 0;
    for await (const c of ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))) {
      totalContacts++;
      if (c.status === "subscribed") activeContacts++;
      if (totalContacts >= 5000) break;
    }
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
    await requireStoreOwner(ctx, args.storeId);
    const numDays = args.days || 30;
    const now = Date.now();
    const startTime = now - numDays * 24 * 60 * 60 * 1000;

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

    // Stream through events instead of collecting all
    for await (const event of ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", startTime)
      )) {
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
    await requireStoreOwner(ctx, args.storeId);
    return await ctx.db
      .query("emailAlerts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(50);
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
    await requireStoreOwner(ctx, args.storeId);
    // Find creator's connections by their Clerk userId
    const connections = await ctx.db
      .query("resendConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.storeId))
      .collect();

    const connectionIds = new Set(connections.map((c) => c._id));

    // Get campaigns belonging to these connections
    const allCampaigns = await ctx.db.query("resendCampaigns").take(200);
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
    await requireStoreOwner(ctx, args.storeId);
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
      .take(5000);

    const alerts = await ctx.db
      .query("emailAlerts")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(100);

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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const maxResults = args.limit || 100;

    // Use indexed query - order by creation time descending (most recent first)
    let queryBuilder = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc");

    const results: Array<{
      _id: any;
      email: string;
      firstName?: string;
      lastName?: string;
      status: string;
      source?: string;
      emailsSent: number;
      emailsOpened: number;
      emailsClicked: number;
      createdAt: number;
      lastEngagedAt?: number;
    }> = [];

    // Stream through results with early termination to avoid 32k doc limit
    for await (const c of queryBuilder) {
      // Filter by status
      if (args.statusFilter && args.statusFilter !== "all" && c.status !== args.statusFilter) {
        continue;
      }

      // Search by email or name
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        const matches =
          c.email.toLowerCase().includes(searchLower) ||
          (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
          (c.lastName && c.lastName.toLowerCase().includes(searchLower));
        if (!matches) continue;
      }

      results.push({
        _id: c._id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        status: c.status || "subscribed",
        source: c.source,
        emailsSent: c.emailsSent || 0,
        emailsOpened: c.emailsOpened || 0,
        emailsClicked: c.emailsClicked || 0,
        createdAt: c._creationTime,
        lastEngagedAt: c.lastOpenedAt,
      });

      if (results.length >= maxResults) break;
    }

    return results;
  },
});

/**
 * Creator subscriber stats summary
 */
export const getCreatorSubscriberStats = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    let total = 0;
    let subscribed = 0;
    let unsubscribed = 0;
    let bounced = 0;
    let complained = 0;
    let newLast30 = 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Stream through contacts with cap to stay under 32k doc limit
    for await (const c of ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))) {
      total++;
      switch (c.status) {
        case "subscribed": subscribed++; break;
        case "unsubscribed": unsubscribed++; break;
        case "bounced": bounced++; break;
        case "complained": complained++; break;
      }
      if ((c._creationTime || 0) >= thirtyDaysAgo) {
        newLast30++;
      }
      if (total >= 30000) break;
    }

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
    await requireStoreOwner(ctx, args.storeId);
    // Use getCreatorSubscriberStats-style counting with a hard cap
    // to stay under the 32k document read limit.
    // We sample up to 20,000 contacts max for status counts.
    let active = 0;
    let unsubscribed = 0;
    let bounced = 0;
    let complained = 0;
    let total = 0;

    const monthMap = new Map<string, number>();
    const CONTACT_LIMIT = 20000;

    for await (const c of ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))) {
      total++;
      switch (c.status) {
        case "subscribed": active++; break;
        case "unsubscribed": unsubscribed++; break;
        case "bounced": bounced++; break;
        case "complained": complained++; break;
      }
      const monthStr = new Date(c._creationTime || 0).toISOString().slice(0, 7);
      monthMap.set(monthStr, (monthMap.get(monthStr) || 0) + 1);
      if (total >= CONTACT_LIMIT) break;
    }

    const healthScore = total > 0 ? Math.round((active / total) * 100) : 100;
    // Only show last 12 months of growth
    const monthlyGrowth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    // Bounce & complaint trend - limit to last 2000 events each
    // to leave room within the 32k doc budget
    const unsubMonthMap = new Map<string, number>();
    const bounceCountMap = new Map<string, number>();
    const EVENT_LIMIT = 2000;

    let eventCount = 0;
    for await (const e of ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_eventType", (q) =>
        q.eq("storeId", args.storeId).eq("eventType", "complained")
      )
      .order("desc")) {
      const monthStr = new Date(e.timestamp).toISOString().slice(0, 7);
      unsubMonthMap.set(monthStr, (unsubMonthMap.get(monthStr) || 0) + 1);
      eventCount++;
      if (eventCount >= EVENT_LIMIT) break;
    }

    eventCount = 0;
    for await (const e of ctx.db
      .query("webhookEmailEvents")
      .withIndex("by_storeId_eventType", (q) =>
        q.eq("storeId", args.storeId).eq("eventType", "bounced")
      )
      .order("desc")) {
      const monthStr = new Date(e.timestamp).toISOString().slice(0, 7);
      unsubMonthMap.set(monthStr, (unsubMonthMap.get(monthStr) || 0) + 1);
      const email = e.emailAddress.toLowerCase();
      bounceCountMap.set(email, (bounceCountMap.get(email) || 0) + 1);
      eventCount++;
      if (eventCount >= EVENT_LIMIT) break;
    }

    const unsubTrend = Array.from(unsubMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

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
