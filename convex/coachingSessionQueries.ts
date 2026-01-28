import { v } from "convex/values";
import { internalQuery, internalMutation, query, mutation } from "./_generated/server";

// ==================== QUERIES ====================

// Get sessions that need Discord setup (starting in ~2 hours, not yet set up)
export const getSessionsNeedingSetup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      discordSetupComplete: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const twoHoursFromNow = now + 2 * 60 * 60 * 1000; // 2 hours
    const threeHoursFromNow = now + 3 * 60 * 60 * 1000; // 3 hours buffer

    // Get all scheduled sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .collect();

    // Filter for sessions starting in 2-3 hours that haven't been set up
    return sessions.filter((session) => {
      const sessionTime = session.scheduledDate;
      const notSetUp = !session.discordSetupComplete;
      const inTimeWindow = sessionTime >= twoHoursFromNow && sessionTime <= threeHoursFromNow;

      return notSetUp && inTimeWindow;
    });
  },
});

// Get sessions that need cleanup (ended >1 hour ago, not yet cleaned)
export const getSessionsNeedingCleanup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      endTime: v.string(),
      discordChannelId: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      discordSetupComplete: v.optional(v.boolean()),
      discordCleanedUp: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - 1 * 60 * 60 * 1000; // 1 hour ago

    // Get completed or in-progress sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "COMPLETED"),
          q.eq(q.field("status"), "IN_PROGRESS")
        )
      )
      .collect();

    // Filter for sessions that ended >1 hour ago and haven't been cleaned
    return sessions.filter((session) => {
      // Parse end time and add to scheduled date
      const [hours, minutes] = session.endTime.split(":").map(Number);
      const sessionEndTime = session.scheduledDate + (hours * 60 + minutes) * 60 * 1000;

      const hasDiscordResources = session.discordChannelId && session.discordRoleId;
      const notCleaned = !session.discordCleanedUp;
      const pastEndTime = sessionEndTime < oneHourAgo;

      return hasDiscordResources && notCleaned && pastEndTime;
    });
  },
});

// Get guild info for a session
export const getSessionGuildInfo = internalQuery({
  args: { coachId: v.string() },
  returns: v.union(
    v.object({
      guildId: v.string(),
      botToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get coach's store by userId (clerkId)
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.coachId))
      .first();

    if (!store) return null;

    // Get store's Discord guild
    const guild = await ctx.db
      .query("discordGuilds")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .first();

    if (!guild || !guild.isActive) return null;

    return {
      guildId: guild.guildId,
      botToken: guild.botToken,
    };
  },
});

// ==================== MUTATIONS ====================

export const markSessionSetupComplete = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    discordChannelId: v.string(),
    discordRoleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordChannelId: args.discordChannelId,
      discordRoleId: args.discordRoleId,
      discordSetupComplete: true,
    });
    return null;
  },
});

export const markSessionCleanedUp = internalMutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordCleanedUp: true,
    });
    return null;
  },
});

// Get sessions that need reminder notifications (starting in 24h or 1h, not yet reminded)
export const getSessionsNeedingReminders = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      totalCost: v.number(),
      reminderSent: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourFromNow = now + 1 * 60 * 60 * 1000; // 1 hour
    const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000; // 24 hours

    // Get all scheduled sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .collect();

    // Filter for sessions that need reminders
    return sessions.filter((session) => {
      const sessionTime = session.scheduledDate;
      const notReminded = !session.reminderSent;

      // Sessions starting in ~1 hour or ~24 hours
      const isOneHourReminder = sessionTime >= now && sessionTime <= oneHourFromNow;
      const isTwentyFourHourReminder =
        sessionTime >= twentyFourHoursFromNow - (30 * 60 * 1000) &&
        sessionTime <= twentyFourHoursFromNow + (30 * 60 * 1000);

      return notReminded && (isOneHourReminder || isTwentyFourHourReminder);
    });
  },
});

// Mark session reminder as sent
export const markReminderSent = mutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      reminderSent: true,
    });
    return null;
  },
});

