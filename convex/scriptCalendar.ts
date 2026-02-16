import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Status validator for calendar entries
const calendarStatusValidator = v.union(
  v.literal("planned"),
  v.literal("in_progress"),
  v.literal("ready"),
  v.literal("published"),
  v.literal("skipped")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get calendar entries for an account within a date range
 */
export const getCalendarEntriesForAccount = query({
  args: {
    accountProfileId: v.id("socialAccountProfiles"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_account_date", (q) =>
        q
          .eq("accountProfileId", args.accountProfileId)
          .gte("scheduledDate", args.startDate)
      )
      .take(500);

    // Filter by end date
    const filtered = entries.filter((e) => e.scheduledDate <= args.endDate);

    // Fetch the associated scripts
    const entriesWithScripts = await Promise.all(
      filtered.map(async (entry) => {
        const script = await ctx.db.get(entry.generatedScriptId);
        return {
          ...entry,
          script,
        };
      })
    );

    return entriesWithScripts;
  },
});

/**
 * Get calendar entries for a specific week
 */
export const getCalendarEntriesForWeek = query({
  args: {
    accountProfileId: v.id("socialAccountProfiles"),
    weekStartDate: v.number(), // Unix timestamp of Monday
  },
  handler: async (ctx, args) => {
    // Calculate end of week (7 days)
    const weekEndDate = args.weekStartDate + 7 * 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_account_date", (q) =>
        q
          .eq("accountProfileId", args.accountProfileId)
          .gte("scheduledDate", args.weekStartDate)
      )
      .take(500);

    const filtered = entries.filter((e) => e.scheduledDate < weekEndDate);

    // Fetch scripts and organize by day
    const entriesWithScripts = await Promise.all(
      filtered.map(async (entry) => {
        const script = await ctx.db.get(entry.generatedScriptId);
        return {
          ...entry,
          script,
        };
      })
    );

    // Group by day of week
    const byDay: Record<number, typeof entriesWithScripts> = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
    };

    for (const entry of entriesWithScripts) {
      const date = new Date(entry.scheduledDate);
      const dayOfWeek = date.getUTCDay();
      byDay[dayOfWeek].push(entry);
    }

    return byDay;
  },
});

/**
 * Get calendar entries for a specific day
 */
export const getCalendarEntriesForDay = query({
  args: {
    accountProfileId: v.id("socialAccountProfiles"),
    date: v.number(), // Unix timestamp for the day (start of day)
  },
  handler: async (ctx, args) => {
    // Calculate end of day
    const endOfDay = args.date + 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_account_date", (q) =>
        q
          .eq("accountProfileId", args.accountProfileId)
          .gte("scheduledDate", args.date)
      )
      .take(500);

    const filtered = entries.filter((e) => e.scheduledDate < endOfDay);

    // Fetch scripts
    const entriesWithScripts = await Promise.all(
      filtered.map(async (entry) => {
        const script = await ctx.db.get(entry.generatedScriptId);
        return {
          ...entry,
          script,
        };
      })
    );

    // Sort by scheduled time or sequence order
    entriesWithScripts.sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime - b.scheduledTime;
      }
      return a.sequenceOrder - b.sequenceOrder;
    });

    return entriesWithScripts;
  },
});

/**
 * Get all calendar entries for a store (across all accounts)
 */
export const getAllCalendarEntries = query({
  args: {
    storeId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);

    // Filter by date range
    const filtered = entries.filter(
      (e) => e.scheduledDate >= args.startDate && e.scheduledDate <= args.endDate
    );

    // Fetch scripts and account profiles
    const entriesWithDetails = await Promise.all(
      filtered.map(async (entry) => {
        const [script, accountProfile] = await Promise.all([
          ctx.db.get(entry.generatedScriptId),
          ctx.db.get(entry.accountProfileId),
        ]);
        return {
          ...entry,
          script,
          accountProfile,
        };
      })
    );

    return entriesWithDetails;
  },
});

/**
 * Get calendar entry by ID
 */
export const getCalendarEntryById = query({
  args: {
    entryId: v.id("scriptCalendarEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) return null;

    const [script, accountProfile] = await Promise.all([
      ctx.db.get(entry.generatedScriptId),
      ctx.db.get(entry.accountProfileId),
    ]);

    return {
      ...entry,
      script,
      accountProfile,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Schedule a script to a calendar
 */
export const scheduleScript = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    accountProfileId: v.id("socialAccountProfiles"),
    generatedScriptId: v.id("generatedScripts"),
    scheduledDate: v.number(),
    scheduledTime: v.optional(v.number()),
    timezone: v.string(),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify script exists and is not already scheduled
    const script = await ctx.db.get(args.generatedScriptId);
    if (!script) {
      throw new Error("Script not found");
    }

    // Check if script is already scheduled
    const existingEntry = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_generatedScriptId", (q) =>
        q.eq("generatedScriptId", args.generatedScriptId)
      )
      .first();

    if (existingEntry) {
      throw new Error("Script is already scheduled");
    }

    // Calculate sequence order based on existing entries for this account on this day
    const date = new Date(args.scheduledDate);
    const startOfDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const existingEntriesForDay = await ctx.db
      .query("scriptCalendarEntries")
      .withIndex("by_account_date", (q) =>
        q
          .eq("accountProfileId", args.accountProfileId)
          .gte("scheduledDate", startOfDay)
      )
      .take(500);

    const entriesForDay = existingEntriesForDay.filter(
      (e) => e.scheduledDate < endOfDay
    );

    const maxSequence = entriesForDay.reduce(
      (max, e) => Math.max(max, e.sequenceOrder),
      0
    );

    const now = Date.now();

    // Create calendar entry
    const entryId = await ctx.db.insert("scriptCalendarEntries", {
      storeId: args.storeId,
      userId: args.userId,
      accountProfileId: args.accountProfileId,
      generatedScriptId: args.generatedScriptId,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      timezone: args.timezone,
      dayOfWeek: date.getUTCDay(),
      sequenceOrder: maxSequence + 1,
      status: "planned",
      userNotes: args.userNotes,
      createdAt: now,
      updatedAt: now,
    });

    // Update script status
    await ctx.db.patch(args.generatedScriptId, {
      status: "scheduled",
      updatedAt: now,
    });

    // Update account profile stats
    const profile = await ctx.db.get(args.accountProfileId);
    if (profile) {
      await ctx.db.patch(args.accountProfileId, {
        totalScheduledScripts: (profile.totalScheduledScripts || 0) + 1,
        updatedAt: now,
      });
    }

    return entryId;
  },
});

/**
 * Reschedule an entry to a new date/time
 */
export const rescheduleEntry = mutation({
  args: {
    entryId: v.id("scriptCalendarEntries"),
    newDate: v.number(),
    newTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Calendar entry not found");
    }

    const date = new Date(args.newDate);

    await ctx.db.patch(args.entryId, {
      scheduledDate: args.newDate,
      scheduledTime: args.newTime,
      dayOfWeek: date.getUTCDay(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update calendar entry status
 */
export const updateEntryStatus = mutation({
  args: {
    entryId: v.id("scriptCalendarEntries"),
    status: calendarStatusValidator,
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Calendar entry not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.entryId, {
      status: args.status,
      updatedAt: now,
    });

    // If published, update account stats
    if (args.status === "published") {
      const profile = await ctx.db.get(entry.accountProfileId);
      if (profile) {
        await ctx.db.patch(entry.accountProfileId, {
          totalPublishedScripts: (profile.totalPublishedScripts || 0) + 1,
          updatedAt: now,
        });
      }

      // Update script status
      await ctx.db.patch(entry.generatedScriptId, {
        status: "completed",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Remove from calendar (unschedule)
 */
export const removeFromCalendar = mutation({
  args: {
    entryId: v.id("scriptCalendarEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Calendar entry not found");
    }

    const now = Date.now();

    // Revert script status to generated
    await ctx.db.patch(entry.generatedScriptId, {
      status: "generated",
      updatedAt: now,
    });

    // Decrement account profile stats
    const profile = await ctx.db.get(entry.accountProfileId);
    if (profile && profile.totalScheduledScripts && profile.totalScheduledScripts > 0) {
      await ctx.db.patch(entry.accountProfileId, {
        totalScheduledScripts: profile.totalScheduledScripts - 1,
        updatedAt: now,
      });
    }

    // Delete entry
    await ctx.db.delete(args.entryId);

    return { success: true };
  },
});

/**
 * Bulk schedule scripts to consecutive days
 */
export const bulkScheduleScripts = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    accountProfileId: v.id("socialAccountProfiles"),
    scriptIds: v.array(v.id("generatedScripts")),
    startDate: v.number(),
    pattern: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("custom")
    ),
    customDays: v.optional(v.array(v.number())), // 0-6 for custom pattern
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify account profile exists
    const profile = await ctx.db.get(args.accountProfileId);
    if (!profile) {
      throw new Error("Account profile not found");
    }

    // Determine which days to schedule on
    let scheduleDays: number[];
    if (args.pattern === "daily") {
      scheduleDays = [0, 1, 2, 3, 4, 5, 6];
    } else if (args.pattern === "weekdays") {
      scheduleDays = [1, 2, 3, 4, 5]; // Mon-Fri
    } else {
      scheduleDays = args.customDays || [1, 2, 3, 4, 5];
    }

    const entryIds: Id<"scriptCalendarEntries">[] = [];
    let currentDate = new Date(args.startDate);
    let scriptIndex = 0;
    let sequenceOrder = 1;

    while (scriptIndex < args.scriptIds.length) {
      const dayOfWeek = currentDate.getUTCDay();

      // Check if we should schedule on this day
      if (scheduleDays.includes(dayOfWeek)) {
        const scriptId = args.scriptIds[scriptIndex];

        // Verify script exists and is not already scheduled
        const script = await ctx.db.get(scriptId);
        if (!script) {
          throw new Error(`Script ${scriptId} not found`);
        }

        const existingEntry = await ctx.db
          .query("scriptCalendarEntries")
          .withIndex("by_generatedScriptId", (q) =>
            q.eq("generatedScriptId", scriptId)
          )
          .first();

        if (existingEntry) {
          // Skip already scheduled scripts
          scriptIndex++;
          continue;
        }

        // Create entry
        const entryId = await ctx.db.insert("scriptCalendarEntries", {
          storeId: args.storeId,
          userId: args.userId,
          accountProfileId: args.accountProfileId,
          generatedScriptId: scriptId,
          scheduledDate: currentDate.getTime(),
          timezone: args.timezone,
          dayOfWeek,
          sequenceOrder,
          status: "planned",
          createdAt: now,
          updatedAt: now,
        });

        entryIds.push(entryId);

        // Update script status
        await ctx.db.patch(scriptId, {
          status: "scheduled",
          updatedAt: now,
        });

        scriptIndex++;
        sequenceOrder++;
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);

      // Safety: don't go more than 365 days out
      if (currentDate.getTime() > args.startDate + 365 * 24 * 60 * 60 * 1000) {
        break;
      }
    }

    // Update account profile stats
    await ctx.db.patch(args.accountProfileId, {
      totalScheduledScripts: (profile.totalScheduledScripts || 0) + entryIds.length,
      updatedAt: now,
    });

    return {
      success: true,
      scheduledCount: entryIds.length,
      entryIds,
    };
  },
});

/**
 * Update entry notes
 */
export const updateEntryNotes = mutation({
  args: {
    entryId: v.id("scriptCalendarEntries"),
    userNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Calendar entry not found");
    }

    await ctx.db.patch(args.entryId, {
      userNotes: args.userNotes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reorder entries within a day (update sequence order)
 */
export const reorderEntries = mutation({
  args: {
    entries: v.array(
      v.object({
        entryId: v.id("scriptCalendarEntries"),
        newSequenceOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const { entryId, newSequenceOrder } of args.entries) {
      await ctx.db.patch(entryId, {
        sequenceOrder: newSequenceOrder,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
