import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Helper function to verify admin access
async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) {
    throw new Error("Unauthorized: Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || user.admin !== true) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

// Get all notifications (admin only)
export const getAllNotifications = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);
    
    return await ctx.db
      .query("notifications")
      .order("desc")
      .take(10000);
  },
});

// Get user's notifications
export const getUserNotifications = query({
  args: {
    userId: v.string(), // Clerk ID
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("notifications"),
    _creationTime: v.number(),
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    link: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
    createdAt: v.number(),
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),
    senderType: v.optional(v.union(
      v.literal("platform"),
      v.literal("creator"),
      v.literal("system")
    )),
    senderId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {
    userId: v.string(), // Clerk ID
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1000);

    return notifications.filter(n => !n.read).length;
  },
});

// Create notification (admin only)
export const createNotification = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    targetType: v.union(
      v.literal("all"),
      v.literal("students"),
      v.literal("creators"),
      v.literal("specific")
    ),
    targetUserIds: v.optional(v.array(v.string())), // Clerk IDs
    link: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("announcements"),
        v.literal("courseUpdates"),
        v.literal("newContent"),
        v.literal("mentions"),
        v.literal("replies"),
        v.literal("purchases"),
        v.literal("earnings"),
        v.literal("systemAlerts"),
        v.literal("marketing")
      )
    ),
    sendEmail: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    notificationCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);
    
    let targetUsers: string[] = [];
    
    // Determine target users based on targetType
    if (args.targetType === "all") {
      const users = await ctx.db.query("users").take(10000);
      targetUsers = users
        .map(u => u.clerkId)
        .filter((id): id is string => id !== undefined);
    } else if (args.targetType === "students") {
      // Get users who have enrollments (students)
      const enrollments = await ctx.db.query("enrollments").take(10000);
      const studentIds = new Set(enrollments.map(e => e.userId));
      targetUsers = Array.from(studentIds).filter((id): id is string => id !== undefined);
    } else if (args.targetType === "creators") {
      // Get users who have created courses or stores
      const courses = await ctx.db.query("courses").take(10000);
      const stores = await ctx.db.query("stores").take(500);
      const creatorIds = new Set([
        ...courses.map(c => c.userId),
        ...stores.map(s => s.userId)
      ]);
      targetUsers = Array.from(creatorIds).filter((id): id is string => id !== undefined);
    } else if (args.targetType === "specific" && args.targetUserIds) {
      targetUsers = args.targetUserIds;
    }
    
    // Create notifications for all target users
    const notificationIds: Id<"notifications">[] = [];
    for (const userId of targetUsers) {
      const notificationId = await ctx.db.insert("notifications", {
        userId,
        title: args.title,
        message: args.message,
        type: args.type,
        read: false,
        link: args.link,
        actionLabel: args.actionLabel,
        createdAt: Date.now(),
        emailSent: false,
      });
      notificationIds.push(notificationId);
    }
    
    // Schedule email sending if requested
    if (args.sendEmail !== false) {
      await ctx.scheduler.runAfter(0, internal.notificationsActions.processNotificationEmails, {
        notificationIds,
        category: args.category || "announcements",
      });
    }
    
    return {
      success: true,
      message: `Successfully created ${notificationIds.length} notifications`,
      notificationCount: notificationIds.length,
    };
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    if (notification.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
    
    return null;
  },
});

// Mark all as read
export const markAllAsRead = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(1000);

    for (const notification of notifications) {
      if (!notification.read) {
        await ctx.db.patch(notification._id, {
          read: true,
          readAt: Date.now(),
        });
      }
    }
    
    return null;
  },
});

// Delete notification (admin only)
export const deleteNotification = mutation({
  args: {
    clerkId: v.string(),
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);
    
    await ctx.db.delete(args.notificationId);
    
    return null;
  },
});

// Get notification stats (admin only)
export const getNotificationStats = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    unread: v.number(),
    byType: v.object({
      info: v.number(),
      success: v.number(),
      warning: v.number(),
      error: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);
    
    const notifications = await ctx.db.query("notifications").take(10000);
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        info: notifications.filter(n => n.type === "info").length,
        success: notifications.filter(n => n.type === "success").length,
        warning: notifications.filter(n => n.type === "warning").length,
        error: notifications.filter(n => n.type === "error").length,
      },
    };
  },
});

// Internal queries and mutations for email processing
export const getNotificationById = internalQuery({
  args: { notificationId: v.id("notifications") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.notificationId);
  },
});

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const markEmailSent = internalMutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      emailSent: true,
      emailSentAt: Date.now(),
    });
    return null;
  },
});

export const markEmailSkipped = internalMutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      emailSent: false,
    });
    return null;
  },
});

