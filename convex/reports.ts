import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all reports by status
export const getReportsByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// Get all reports (for admin overview)
export const getAllReports = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("reports").order("desc").collect();
  },
});

// Get report statistics
export const getReportStats = query({
  args: {},
  returns: v.object({
    pending: v.number(),
    reviewed: v.number(),
    resolved: v.number(),
    dismissed: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    const allReports = await ctx.db.query("reports").collect();

    return {
      pending: allReports.filter((r) => r.status === "pending").length,
      reviewed: allReports.filter((r) => r.status === "reviewed").length,
      resolved: allReports.filter((r) => r.status === "resolved").length,
      dismissed: allReports.filter((r) => r.status === "dismissed").length,
      total: allReports.length,
    };
  },
});

// Create a new report
export const createReport = mutation({
  args: {
    type: v.union(
      v.literal("course"),
      v.literal("comment"),
      v.literal("user"),
      v.literal("product")
    ),
    reportedBy: v.string(),
    reason: v.string(),
    contentId: v.string(),
    contentTitle: v.string(),
    contentPreview: v.optional(v.string()),
    reporterName: v.string(),
    reportedUserName: v.optional(v.string()),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      type: args.type,
      status: "pending",
      reportedBy: args.reportedBy,
      reportedAt: Date.now(),
      reason: args.reason,
      contentId: args.contentId,
      contentTitle: args.contentTitle,
      contentPreview: args.contentPreview,
      reporterName: args.reporterName,
      reportedUserName: args.reportedUserName,
    });
  },
});

// Update report status to "reviewed"
export const markAsReviewed = mutation({
  args: {
    reportId: v.id("reports"),
    reviewedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "reviewed",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
    });
    return null;
  },
});

// Update report status to "resolved" (content removed)
export const markAsResolved = mutation({
  args: {
    reportId: v.id("reports"),
    reviewedBy: v.string(),
    resolution: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "resolved",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      resolution: args.resolution || "Content removed",
    });
    return null;
  },
});

// Update report status to "dismissed"
export const markAsDismissed = mutation({
  args: {
    reportId: v.id("reports"),
    reviewedBy: v.string(),
    resolution: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "dismissed",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      resolution: args.resolution || "Report dismissed",
    });
    return null;
  },
});

// Delete a report (admin only - use sparingly)
export const deleteReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reportId);
    return null;
  },
});

// Create sample reports for testing (development only)
export const createSampleReports = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sampleReports = [
      {
        type: "course" as const,
        status: "pending" as const,
        reportedBy: "user123",
        reportedAt: Date.now() - 3600000,
        reason: "Inappropriate content - Contains misleading information",
        contentId: "course123",
        contentTitle: "Introduction to Web Development",
        contentPreview: "This course contains misleading information about modern web practices...",
        reporterName: "John Doe",
        reportedUserName: "Jane Smith",
      },
      {
        type: "comment" as const,
        status: "pending" as const,
        reportedBy: "user456",
        reportedAt: Date.now() - 7200000,
        reason: "Spam - Promoting external services",
        contentId: "comment456",
        contentTitle: "Comment on 'Advanced React Patterns'",
        contentPreview: "Check out my website for cheap courses at example.com...",
        reporterName: "Alice Johnson",
        reportedUserName: "Bob Wilson",
      },
      {
        type: "user" as const,
        status: "reviewed" as const,
        reportedBy: "user789",
        reportedAt: Date.now() - 86400000,
        reason: "Harassment - Sending inappropriate messages",
        contentId: "user789",
        contentTitle: "User Profile: spammer123",
        contentPreview: "User has been sending inappropriate messages to other students...",
        reporterName: "Chris Lee",
        reportedUserName: "spammer123",
      },
      {
        type: "product" as const,
        status: "pending" as const,
        reportedBy: "user101",
        reportedAt: Date.now() - 1800000,
        reason: "Copyright violation",
        contentId: "product101",
        contentTitle: "Premium Design Templates Pack",
        contentPreview: "These templates appear to be stolen from another creator...",
        reporterName: "Sarah Miller",
        reportedUserName: "Template Store",
      },
    ];

    for (const report of sampleReports) {
      await ctx.db.insert("reports", report);
    }

    return null;
  },
});

