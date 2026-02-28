import { v } from "convex/values";
import { internalMutation, internalQuery, query, mutation } from "./_generated/server";

// ==================== GOOGLE CALENDAR QUERIES/MUTATIONS ====================
// Separated from googleCalendarActions.ts because "use node" modules can only contain actions

export const storeCalendarConnection = internalMutation({
  args: {
    userId: v.string(),
    refreshToken: v.string(),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    calendarId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Upsert: delete existing connection, insert new one
    const existing = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.replace(existing._id, {
        userId: args.userId,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        tokenExpiresAt: args.tokenExpiresAt,
        calendarId: args.calendarId,
        connectedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("googleCalendarConnections", {
        userId: args.userId,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        tokenExpiresAt: args.tokenExpiresAt,
        calendarId: args.calendarId,
        connectedAt: Date.now(),
      });
    }

    // Also mark user as having Google Calendar connected
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { googleCalendarConnected: true });
    }

    return null;
  },
});

export const getCalendarConnection = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      refreshToken: v.string(),
      accessToken: v.string(),
      tokenExpiresAt: v.number(),
      calendarId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) return null;

    return {
      refreshToken: connection.refreshToken,
      accessToken: connection.accessToken,
      tokenExpiresAt: connection.tokenExpiresAt,
      calendarId: connection.calendarId,
    };
  },
});

export const updateAccessToken = internalMutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.patch(connection._id, {
        accessToken: args.accessToken,
        tokenExpiresAt: args.tokenExpiresAt,
      });
    }
    return null;
  },
});

export const storeEventId = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    googleCalendarEventId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      googleCalendarEventId: args.googleCalendarEventId,
    });
    return null;
  },
});

export const hasCalendarConnection = internalQuery({
  args: { userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return !!connection;
  },
});

// ==================== PUBLIC QUERIES ====================

export const isCalendarConnected = query({
  args: { userId: v.string() },
  returns: v.object({
    connected: v.boolean(),
    connectedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) return { connected: false };

    return {
      connected: true,
      connectedAt: connection.connectedAt,
    };
  },
});

// ==================== DISCONNECT ====================

/**
 * Disconnect Google Calendar. Removes stored tokens and clears user flag.
 * Token revocation with Google is handled by a separate action (best-effort).
 */
export const disconnectCalendar = mutation({
  args: { userId: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    // Clear user flag
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { googleCalendarConnected: false });
    }

    // Clear any cached busy times
    const cacheEntries = await ctx.db
      .query("googleCalendarCache")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const entry of cacheEntries) {
      await ctx.db.delete(entry._id);
    }

    return { success: true };
  },
});

// For the disconnect action to get the refresh token before deleting
export const getRefreshTokenForDisconnect = internalQuery({
  args: { userId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("googleCalendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return connection?.refreshToken ?? null;
  },
});

// ==================== BUSY TIME CACHE ====================

export const storeBusyTimes = internalMutation({
  args: {
    userId: v.string(),
    dateRangeStart: v.number(),
    dateRangeEnd: v.number(),
    busyPeriods: v.array(v.object({ start: v.number(), end: v.number() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete existing cache for this user (replace strategy)
    const existing = await ctx.db
      .query("googleCalendarCache")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const entry of existing) {
      await ctx.db.delete(entry._id);
    }

    await ctx.db.insert("googleCalendarCache", {
      userId: args.userId,
      dateRangeStart: args.dateRangeStart,
      dateRangeEnd: args.dateRangeEnd,
      busyPeriods: args.busyPeriods,
      cachedAt: Date.now(),
    });

    return null;
  },
});

export const getCachedBusyTimes = internalQuery({
  args: {
    userId: v.string(),
    dateStart: v.number(),
    dateEnd: v.number(),
  },
  returns: v.union(
    v.object({
      busyPeriods: v.array(v.object({ start: v.number(), end: v.number() })),
      cachedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const cache = await ctx.db
      .query("googleCalendarCache")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!cache) return null;

    // Check cache staleness (10 minutes)
    const CACHE_TTL_MS = 10 * 60 * 1000;
    if (Date.now() - cache.cachedAt > CACHE_TTL_MS) return null;

    // Check if cache covers the requested range
    if (cache.dateRangeStart > args.dateStart || cache.dateRangeEnd < args.dateEnd) {
      return null;
    }

    // Filter busy periods to the requested range
    const filteredPeriods = cache.busyPeriods.filter(
      (p) => p.end > args.dateStart && p.start < args.dateEnd
    );

    return {
      busyPeriods: filteredPeriods,
      cachedAt: cache.cachedAt,
    };
  },
});

/**
 * Public query for the booking page to read cached busy times.
 * Returns busy periods for a coach on a specific date, used by getAvailableSlots.
 */
export const getCoachBusyTimes = query({
  args: {
    coachId: v.string(),
    dateStart: v.number(),
    dateEnd: v.number(),
  },
  returns: v.array(v.object({ start: v.number(), end: v.number() })),
  handler: async (ctx, args) => {
    const cache = await ctx.db
      .query("googleCalendarCache")
      .withIndex("by_userId", (q) => q.eq("userId", args.coachId))
      .first();

    if (!cache) return [];

    // Check cache staleness (10 minutes)
    const CACHE_TTL_MS = 10 * 60 * 1000;
    if (Date.now() - cache.cachedAt > CACHE_TTL_MS) return [];

    // Filter busy periods to the requested range
    return cache.busyPeriods.filter(
      (p) => p.end > args.dateStart && p.start < args.dateEnd
    );
  },
});
