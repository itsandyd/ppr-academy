import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";

// Default notification preferences
const DEFAULT_PREFERENCES = {
  emailNotifications: {
    announcements: true,
    courseUpdates: true,
    newContent: false,
    mentions: true,
    replies: true,
    purchases: true,
    earnings: true,
    systemAlerts: true,
    marketing: false,
  },
  inAppNotifications: {
    announcements: true,
    courseUpdates: true,
    newContent: true,
    mentions: true,
    replies: true,
    purchases: true,
    earnings: true,
    systemAlerts: true,
    marketing: true,
  },
  emailDigest: "realtime" as const,
};

// Get user's notification preferences (creates default if not exists)
export const getUserPreferences = query({
  args: {
    userId: v.string(), // Clerk ID
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    // If no preferences exist, return defaults (will be created on first save)
    if (!preferences) {
      return {
        ...DEFAULT_PREFERENCES,
        userId: args.userId,
        updatedAt: Date.now(),
      };
    }

    return preferences;
  },
});

// Update user's notification preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    emailNotifications: v.optional(
      v.object({
        announcements: v.boolean(),
        courseUpdates: v.boolean(),
        newContent: v.boolean(),
        mentions: v.boolean(),
        replies: v.boolean(),
        purchases: v.boolean(),
        earnings: v.boolean(),
        systemAlerts: v.boolean(),
        marketing: v.boolean(),
      })
    ),
    inAppNotifications: v.optional(
      v.object({
        announcements: v.boolean(),
        courseUpdates: v.boolean(),
        newContent: v.boolean(),
        mentions: v.boolean(),
        replies: v.boolean(),
        purchases: v.boolean(),
        earnings: v.boolean(),
        systemAlerts: v.boolean(),
        marketing: v.boolean(),
      })
    ),
    emailDigest: v.optional(
      v.union(
        v.literal("realtime"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("never")
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const updateData = {
      emailNotifications:
        args.emailNotifications || DEFAULT_PREFERENCES.emailNotifications,
      inAppNotifications:
        args.inAppNotifications || DEFAULT_PREFERENCES.inAppNotifications,
      emailDigest: args.emailDigest || DEFAULT_PREFERENCES.emailDigest,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        ...updateData,
      });
    }

    return null;
  },
});

// Check if user should receive email for a notification category
export const shouldSendEmail = query({
  args: {
    userId: v.string(),
    category: v.union(
      v.literal("announcements"),
      v.literal("courseUpdates"),
      v.literal("newContent"),
      v.literal("mentions"),
      v.literal("replies"),
      v.literal("purchases"),
      v.literal("earnings"),
      v.literal("systemAlerts"),
      v.literal("marketing")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!preferences) {
      // Use defaults
      return DEFAULT_PREFERENCES.emailNotifications[args.category];
    }

    return preferences.emailNotifications[args.category];
  },
});

// Batch check if users should receive email
export const batchShouldSendEmail = query({
  args: {
    userIds: v.array(v.string()),
    category: v.union(
      v.literal("announcements"),
      v.literal("courseUpdates"),
      v.literal("newContent"),
      v.literal("mentions"),
      v.literal("replies"),
      v.literal("purchases"),
      v.literal("earnings"),
      v.literal("systemAlerts"),
      v.literal("marketing")
    ),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      shouldSend: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const results = [];

    for (const userId of args.userIds) {
      const preferences = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      const shouldSend = preferences
        ? preferences.emailNotifications[args.category]
        : DEFAULT_PREFERENCES.emailNotifications[args.category];

      results.push({ userId, shouldSend });
    }

    return results;
  },
});

// Reset preferences to default
export const resetToDefaults = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...DEFAULT_PREFERENCES,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        ...DEFAULT_PREFERENCES,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Internal query for email processing
export const shouldSendEmailInternal = internalQuery({
  args: {
    userId: v.string(),
    category: v.union(
      v.literal("announcements"),
      v.literal("courseUpdates"),
      v.literal("newContent"),
      v.literal("mentions"),
      v.literal("replies"),
      v.literal("purchases"),
      v.literal("earnings"),
      v.literal("systemAlerts"),
      v.literal("marketing")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!preferences) {
      // Use defaults
      return DEFAULT_PREFERENCES.emailNotifications[args.category];
    }

    return preferences.emailNotifications[args.category];
  },
});

