import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Admin Activity Logging System
 * Tracks all admin actions for audit trail and compliance
 */

// Helper to verify admin status
async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || !user.admin) {
    throw new Error("Unauthorized - Admin access required");
  }
  return user;
}

/**
 * Log an admin activity
 */
export const logActivity = mutation({
  args: {
    adminClerkId: v.string(),
    action: v.string(),
    actionType: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("approve"),
      v.literal("reject"),
      v.literal("export"),
      v.literal("view")
    ),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    resourceName: v.optional(v.string()),
    details: v.optional(v.string()),
    previousValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
  },
  returns: v.id("adminActivityLogs"),
  handler: async (ctx, args) => {
    // Get admin info
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.adminClerkId))
      .unique();

    if (!admin || !admin.admin) {
      throw new Error("Unauthorized - Admin access required");
    }

    const logId = await ctx.db.insert("adminActivityLogs", {
      adminId: args.adminClerkId,
      adminEmail: admin.email,
      adminName: admin.name || admin.firstName || "Admin",
      action: args.action,
      actionType: args.actionType,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      resourceName: args.resourceName,
      details: args.details,
      previousValue: args.previousValue,
      newValue: args.newValue,
      timestamp: Date.now(),
    });

    return logId;
  },
});

/**
 * Get recent admin activity logs
 */
export const getRecentActivity = query({
  args: {
    clerkId: v.optional(v.string()),
    limit: v.optional(v.number()),
    actionType: v.optional(
      v.union(
        v.literal("create"),
        v.literal("update"),
        v.literal("delete"),
        v.literal("approve"),
        v.literal("reject"),
        v.literal("export"),
        v.literal("view")
      )
    ),
    resourceType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminActivityLogs"),
      adminId: v.string(),
      adminEmail: v.optional(v.string()),
      adminName: v.optional(v.string()),
      action: v.string(),
      actionType: v.string(),
      resourceType: v.string(),
      resourceId: v.optional(v.string()),
      resourceName: v.optional(v.string()),
      details: v.optional(v.string()),
      timestamp: v.number(),
      timeAgo: v.string(),
    })
  ),
  handler: async (ctx, { clerkId, limit = 50, actionType, resourceType }) => {
    await verifyAdmin(ctx, clerkId);

    let logsQuery = ctx.db.query("adminActivityLogs").order("desc");

    const logs = await logsQuery.take(limit * 3); // Get extra to filter

    // Filter if needed
    let filteredLogs = logs;
    if (actionType) {
      filteredLogs = filteredLogs.filter((log) => log.actionType === actionType);
    }
    if (resourceType) {
      filteredLogs = filteredLogs.filter((log) => log.resourceType === resourceType);
    }

    // Take only what we need after filtering
    filteredLogs = filteredLogs.slice(0, limit);

    // Calculate time ago
    const now = Date.now();
    return filteredLogs.map((log) => ({
      _id: log._id,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      adminName: log.adminName,
      action: log.action,
      actionType: log.actionType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      details: log.details,
      timestamp: log.timestamp,
      timeAgo: getTimeAgo(now - log.timestamp),
    }));
  },
});

/**
 * Get activity summary for dashboard
 */
export const getActivitySummary = query({
  args: {
    clerkId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalActions: v.number(),
    byActionType: v.array(
      v.object({
        type: v.string(),
        count: v.number(),
      })
    ),
    byResourceType: v.array(
      v.object({
        type: v.string(),
        count: v.number(),
      })
    ),
    byAdmin: v.array(
      v.object({
        adminId: v.string(),
        adminName: v.optional(v.string()),
        count: v.number(),
      })
    ),
    recentActivity: v.array(
      v.object({
        date: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, { clerkId, days = 30 }) => {
    await verifyAdmin(ctx, clerkId);

    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    const logs = await ctx.db.query("adminActivityLogs").take(5000);
    const recentLogs = logs.filter((log) => log.timestamp >= startTime);

    // Count by action type
    const actionTypeCounts = new Map<string, number>();
    for (const log of recentLogs) {
      const count = actionTypeCounts.get(log.actionType) || 0;
      actionTypeCounts.set(log.actionType, count + 1);
    }

    // Count by resource type
    const resourceTypeCounts = new Map<string, number>();
    for (const log of recentLogs) {
      const count = resourceTypeCounts.get(log.resourceType) || 0;
      resourceTypeCounts.set(log.resourceType, count + 1);
    }

    // Count by admin
    const adminCounts = new Map<string, { name?: string; count: number }>();
    for (const log of recentLogs) {
      const existing = adminCounts.get(log.adminId);
      if (existing) {
        existing.count++;
      } else {
        adminCounts.set(log.adminId, { name: log.adminName, count: 1 });
      }
    }

    // Group by date for chart
    const dailyCounts = new Map<string, number>();
    for (const log of recentLogs) {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      const count = dailyCounts.get(date) || 0;
      dailyCounts.set(date, count + 1);
    }

    return {
      totalActions: recentLogs.length,
      byActionType: Array.from(actionTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      byResourceType: Array.from(resourceTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      byAdmin: Array.from(adminCounts.entries())
        .map(([adminId, { name, count }]) => ({ adminId, adminName: name, count }))
        .sort((a, b) => b.count - a.count),
      recentActivity: Array.from(dailyCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14), // Last 14 days
    };
  },
});

/**
 * Get activity for a specific resource
 */
export const getResourceActivity = query({
  args: {
    clerkId: v.optional(v.string()),
    resourceType: v.string(),
    resourceId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminActivityLogs"),
      adminName: v.optional(v.string()),
      action: v.string(),
      actionType: v.string(),
      details: v.optional(v.string()),
      timestamp: v.number(),
      timeAgo: v.string(),
    })
  ),
  handler: async (ctx, { clerkId, resourceType, resourceId }) => {
    await verifyAdmin(ctx, clerkId);

    const logs = await ctx.db
      .query("adminActivityLogs")
      .withIndex("by_resourceType", (q) => q.eq("resourceType", resourceType))
      .take(5000);

    const resourceLogs = logs
      .filter((log) => log.resourceId === resourceId)
      .sort((a, b) => b.timestamp - a.timestamp);

    const now = Date.now();
    return resourceLogs.map((log) => ({
      _id: log._id,
      adminName: log.adminName,
      action: log.action,
      actionType: log.actionType,
      details: log.details,
      timestamp: log.timestamp,
      timeAgo: getTimeAgo(now - log.timestamp),
    }));
  },
});

// Helper function to format time ago
function getTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}
