import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get user's notification preferences
export const getUserPreferences = query({
  args: {
    userId: v.string(), // Clerk ID
  },
  returns: v.union(
    v.object({
      _id: v.id("notificationPreferences"),
      userId: v.string(),
      emailNotifications: v.object({
        announcements: v.boolean(),
        courseUpdates: v.boolean(),
        newContent: v.boolean(),
        mentions: v.boolean(),
        replies: v.boolean(),
        purchases: v.boolean(),
        earnings: v.boolean(),
        systemAlerts: v.boolean(),
        marketing: v.boolean(),
      }),
      inAppNotifications: v.object({
        announcements: v.boolean(),
        courseUpdates: v.boolean(),
        newContent: v.boolean(),
        mentions: v.boolean(),
        replies: v.boolean(),
        purchases: v.boolean(),
        earnings: v.boolean(),
        systemAlerts: v.boolean(),
        marketing: v.boolean(),
      }),
      emailDigest: v.union(
        v.literal("realtime"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("never")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // If no preferences exist, return defaults (all enabled)
    if (!preferences) {
      return null;
    }

    return preferences;
  },
});

// Create or update notification preferences
export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    emailNotifications: v.optional(v.object({
      announcements: v.boolean(),
      courseUpdates: v.boolean(),
      newContent: v.boolean(),
      mentions: v.boolean(),
      replies: v.boolean(),
      purchases: v.boolean(),
      earnings: v.boolean(),
      systemAlerts: v.boolean(),
      marketing: v.boolean(),
    })),
    inAppNotifications: v.optional(v.object({
      announcements: v.boolean(),
      courseUpdates: v.boolean(),
      newContent: v.boolean(),
      mentions: v.boolean(),
      replies: v.boolean(),
      purchases: v.boolean(),
      earnings: v.boolean(),
      systemAlerts: v.boolean(),
      marketing: v.boolean(),
    })),
    emailDigest: v.optional(v.union(
      v.literal("realtime"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("never")
    )),
  },
  returns: v.object({
    success: v.boolean(),
    preferencesId: v.id("notificationPreferences"),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const defaultPreferences = {
      announcements: true,
      courseUpdates: true,
      newContent: true,
      mentions: true,
      replies: true,
      purchases: true,
      earnings: true,
      systemAlerts: true,
      marketing: true,
    };

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        emailNotifications: args.emailNotifications || existing.emailNotifications,
        inAppNotifications: args.inAppNotifications || existing.inAppNotifications,
        emailDigest: args.emailDigest || existing.emailDigest,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        preferencesId: existing._id,
      };
    } else {
      // Create new preferences
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        emailNotifications: args.emailNotifications || defaultPreferences,
        inAppNotifications: args.inAppNotifications || defaultPreferences,
        emailDigest: args.emailDigest || "realtime",
        updatedAt: Date.now(),
      });

      return {
        success: true,
        preferencesId,
      };
    }
  },
});

// Check if user should receive email for a specific category (internal helper)
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
      .first();

    // If no preferences exist, default to enabled
    if (!preferences) {
      return true;
    }

    // Check if email notifications are enabled for this category
    return preferences.emailNotifications[args.category] !== false;
  },
});

// Quick toggle for specific notification type
export const toggleEmailNotification = mutation({
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
    enabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const defaultPreferences = {
      announcements: true,
      courseUpdates: true,
      newContent: true,
      mentions: true,
      replies: true,
      purchases: true,
      earnings: true,
      systemAlerts: true,
      marketing: true,
    };

    if (existing) {
      // Update existing
      const updatedEmailPrefs = {
        ...existing.emailNotifications,
        [args.category]: args.enabled,
      };

      await ctx.db.patch(existing._id, {
        emailNotifications: updatedEmailPrefs,
      });
    } else {
      // Create new with this one toggled
      const newEmailPrefs = {
        ...defaultPreferences,
        [args.category]: args.enabled,
      };

      await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        emailNotifications: newEmailPrefs,
        inAppNotifications: defaultPreferences,
        emailDigest: "realtime",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
