import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Email Analytics for Creator Dashboard
 * Provides analytics queries for the /dashboard/emails/analytics page
 */

/**
 * Get overall email performance metrics for a creator
 */
export const getCreatorEmailMetrics = query({
  args: {
    storeId: v.string(),
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalSent: v.number(),
    totalDelivered: v.number(),
    totalOpened: v.number(),
    totalClicked: v.number(),
    totalBounced: v.number(),
    totalUnsubscribed: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
    unsubscribeRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get contact stats for this store
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);

    // Aggregate contact metrics
    const totalSent = contacts.reduce((sum, c) => sum + (c.emailsSent || 0), 0);
    const totalOpened = contacts.reduce((sum, c) => sum + (c.emailsOpened || 0), 0);
    const totalClicked = contacts.reduce((sum, c) => sum + (c.emailsClicked || 0), 0);

    // Count unsubscribed contacts
    const totalUnsubscribed = contacts.filter((c) => c.status === "unsubscribed").length;
    const totalBounced = contacts.filter((c) => c.status === "bounced").length;

    // Calculate rates
    const totalDelivered = totalSent - totalBounced;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const unsubscribeRate =
      contacts.length > 0 ? (totalUnsubscribed / contacts.length) * 100 : 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalUnsubscribed,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      bounceRate: Math.round(bounceRate * 10) / 10,
      unsubscribeRate: Math.round(unsubscribeRate * 10) / 10,
    };
  },
});

/**
 * Get workflow performance analytics
 */
export const getWorkflowAnalytics = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(
    v.object({
      workflowId: v.string(),
      workflowName: v.string(),
      isActive: v.boolean(),
      totalEnrolled: v.number(),
      totalCompleted: v.number(),
      totalActive: v.number(),
      completionRate: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all workflows for this store
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);

    const results = [];

    for (const workflow of workflows) {
      // Get execution stats for this workflow
      const executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
        .take(5000);

      const totalEnrolled = executions.length;
      const totalCompleted = executions.filter((e) => e.status === "completed").length;
      const totalActive = executions.filter((e) => e.status === "running" || e.status === "pending").length;
      const completionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;

      results.push({
        workflowId: workflow._id,
        workflowName: workflow.name || "Untitled Workflow",
        isActive: workflow.isActive || false,
        totalEnrolled,
        totalCompleted,
        totalActive,
        completionRate: Math.round(completionRate * 10) / 10,
      });
    }

    return results;
  },
});

/**
 * Get daily email activity for charts
 */
export const getDailyEmailActivity = query({
  args: {
    storeId: v.string(),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      sent: v.number(),
      opened: v.number(),
      clicked: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const now = Date.now();

    // Get contact activity for the date range
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const activity = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .take(5000);

    // Group by date
    const dailyStats = new Map<
      string,
      { sent: number; opened: number; clicked: number }
    >();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyStats.set(dateStr, { sent: 0, opened: 0, clicked: 0 });
    }

    // Aggregate activity by date
    for (const act of activity) {
      const dateStr = new Date(act.timestamp).toISOString().split("T")[0];
      const stats = dailyStats.get(dateStr);
      if (stats) {
        if (act.activityType === "email_sent") stats.sent++;
        if (act.activityType === "email_opened") stats.opened++;
        if (act.activityType === "email_clicked") stats.clicked++;
      }
    }

    // Convert to array and sort by date
    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get top performing emails/campaigns
 */
export const getTopPerformingEmails = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      emailSubject: v.string(),
      workflowName: v.optional(v.string()),
      sent: v.number(),
      opened: v.number(),
      clicked: v.number(),
      openRate: v.number(),
      clickRate: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all workflows for this store
    const workflows = await ctx.db
      .query("emailWorkflows")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);

    const emailStats = new Map<
      string,
      {
        subject: string;
        workflowName?: string;
        sent: number;
        opened: number;
        clicked: number;
      }
    >();

    // Aggregate stats from workflow email nodes
    for (const workflow of workflows) {
      const nodes = workflow.nodes || [];
      for (const node of nodes) {
        if (node.type === "email" && node.data?.subject) {
          const key = node.data.subject;
          const existing = emailStats.get(key) || {
            subject: node.data.subject,
            workflowName: workflow.name,
            sent: 0,
            opened: 0,
            clicked: 0,
          };

          // Get activity for this email (simplified - based on node executions)
          const nodeExecCount =
            (await ctx.db
              .query("workflowExecutions")
              .withIndex("by_workflowId", (q) => q.eq("workflowId", workflow._id))
              .filter((q) => q.eq(q.field("status"), "completed"))
              .take(5000)).length || 0;

          existing.sent += nodeExecCount;
          emailStats.set(key, existing);
        }
      }
    }

    // Get activity to enhance stats
    const activity = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);

    for (const act of activity) {
      const subject = act.metadata?.emailSubject;
      if (subject && emailStats.has(subject)) {
        const stats = emailStats.get(subject)!;
        if (act.activityType === "email_opened") stats.opened++;
        if (act.activityType === "email_clicked") stats.clicked++;
      }
    }

    // Convert to array, calculate rates, and sort by open rate
    return Array.from(emailStats.values())
      .map((stats) => ({
        emailSubject: stats.subject,
        workflowName: stats.workflowName,
        sent: stats.sent,
        opened: stats.opened,
        clicked: stats.clicked,
        openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 1000) / 10 : 0,
        clickRate: stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, limit);
  },
});

/**
 * Get contact engagement breakdown
 */
export const getEngagementBreakdown = query({
  args: {
    storeId: v.string(),
  },
  returns: v.object({
    highlyEngaged: v.number(),
    engaged: v.number(),
    lowEngagement: v.number(),
    inactive: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .take(5000);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    let highlyEngaged = 0;
    let engaged = 0;
    let lowEngagement = 0;
    let inactive = 0;

    for (const contact of contacts) {
      const sent = contact.emailsSent || 0;
      const opened = contact.emailsOpened || 0;
      const clicked = contact.emailsClicked || 0;
      const lastOpened = contact.lastOpenedAt;
      const lastClicked = contact.lastClickedAt;

      if (sent === 0) {
        inactive++;
        continue;
      }

      const openRate = opened / sent;
      const clickRate = clicked / sent;
      const hasRecentActivity =
        (lastOpened && lastOpened > thirtyDaysAgo) ||
        (lastClicked && lastClicked > thirtyDaysAgo);

      if (clickRate > 0.1 && hasRecentActivity) {
        highlyEngaged++;
      } else if (openRate > 0.3 && hasRecentActivity) {
        engaged++;
      } else if (openRate > 0.1 || (lastOpened && lastOpened > ninetyDaysAgo)) {
        lowEngagement++;
      } else {
        inactive++;
      }
    }

    return {
      highlyEngaged,
      engaged,
      lowEngagement,
      inactive,
      total: contacts.length,
    };
  },
});

/**
 * Get recent email activity feed
 */
export const getRecentActivity = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      type: v.string(),
      contactEmail: v.string(),
      contactName: v.optional(v.string()),
      metadata: v.optional(v.any()),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const activity = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit * 2); // Fetch extra to account for filtering

    const results = [];

    for (const act of activity) {
      if (results.length >= limit) break;

      // Get contact info
      const contact = await ctx.db.get(act.contactId);
      if (!contact) continue;

      results.push({
        id: act._id,
        type: act.activityType,
        contactEmail: contact.email,
        contactName:
          contact.firstName || contact.lastName
            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
            : undefined,
        metadata: act.metadata,
        timestamp: act.timestamp,
      });
    }

    return results;
  },
});

/**
 * Get best send time analysis
 */
export const getBestSendTimes = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(
    v.object({
      hour: v.number(),
      dayOfWeek: v.number(),
      openRate: v.number(),
      clickRate: v.number(),
      totalOpens: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all open/click activity
    const activity = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.or(
          q.eq(q.field("activityType"), "email_opened"),
          q.eq(q.field("activityType"), "email_clicked")
        )
      )
      .take(5000);

    // Group by hour and day of week
    const hourlyStats = new Map<
      string,
      { opens: number; clicks: number; total: number }
    >();

    for (const act of activity) {
      const date = new Date(act.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;

      const stats = hourlyStats.get(key) || { opens: 0, clicks: 0, total: 0 };
      stats.total++;
      if (act.activityType === "email_opened") stats.opens++;
      if (act.activityType === "email_clicked") stats.clicks++;
      hourlyStats.set(key, stats);
    }

    // Convert to array with calculated rates
    return Array.from(hourlyStats.entries())
      .map(([key, stats]) => {
        const [dayOfWeek, hour] = key.split("-").map(Number);
        return {
          hour,
          dayOfWeek,
          openRate: stats.total > 0 ? Math.round((stats.opens / stats.total) * 100) : 0,
          clickRate: stats.total > 0 ? Math.round((stats.clicks / stats.total) * 100) : 0,
          totalOpens: stats.opens,
        };
      })
      .sort((a, b) => b.openRate - a.openRate);
  },
});
