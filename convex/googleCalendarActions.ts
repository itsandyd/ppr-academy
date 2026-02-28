"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ==================== TOKEN MANAGEMENT ====================

async function getValidAccessToken(ctx: any, userId: string): Promise<string | null> {
  const connection = await ctx.runQuery(
    internal.googleCalendarQueries.getCalendarConnection,
    { userId }
  );

  if (!connection) return null;

  // Check if token is still valid (with 5 min buffer)
  if (connection.tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return connection.accessToken;
  }

  // Refresh the token
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh Google token:", await response.text());
    return null;
  }

  const tokens = await response.json() as { access_token: string; expires_in: number };

  await ctx.runMutation(internal.googleCalendarQueries.updateAccessToken, {
    userId,
    accessToken: tokens.access_token,
    tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
  });

  return tokens.access_token;
}

// ==================== CALENDAR EVENT ACTIONS ====================

export const createCalendarEvent = internalAction({
  args: {
    coachId: v.string(),
    sessionId: v.id("coachingSessions"),
    title: v.string(),
    description: v.string(),
    startTime: v.number(), // Unix timestamp
    durationMinutes: v.number(),
    location: v.optional(v.string()), // Meeting link
    attendeeEmail: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    eventId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = await getValidAccessToken(ctx, args.coachId);
    if (!accessToken) {
      // Coach doesn't have Google Calendar connected — silently skip
      return { success: false, error: "No valid Google Calendar connection" };
    }

    const startDate = new Date(args.startTime);
    const endDate = new Date(args.startTime + args.durationMinutes * 60 * 1000);

    const event: any = {
      summary: args.title,
      description: args.description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "UTC",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    if (args.location) {
      event.location = args.location;
    }

    if (args.attendeeEmail) {
      event.attendees = [{ email: args.attendeeEmail }];
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Calendar event creation failed:", errorText);
        return { success: false, error: `Calendar API error: ${response.status}` };
      }

      const createdEvent = await response.json() as { id: string };

      // Store event ID on the session
      await ctx.runMutation(internal.googleCalendarQueries.storeEventId, {
        sessionId: args.sessionId,
        googleCalendarEventId: createdEvent.id,
      });

      return { success: true, eventId: createdEvent.id };
    } catch (error: any) {
      console.error("Failed to create calendar event:", error);
      return { success: false, error: error.message };
    }
  },
});

export const updateCalendarEvent = internalAction({
  args: {
    coachId: v.string(),
    eventId: v.string(),
    startTime: v.number(),
    durationMinutes: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    attendeeEmail: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const accessToken = await getValidAccessToken(ctx, args.coachId);
    if (!accessToken) {
      return { success: false, error: "No valid Google Calendar connection" };
    }

    const startDate = new Date(args.startTime);
    const endDate = new Date(args.startTime + args.durationMinutes * 60 * 1000);

    const patch: Record<string, unknown> = {
      start: { dateTime: startDate.toISOString(), timeZone: "UTC" },
      end: { dateTime: endDate.toISOString(), timeZone: "UTC" },
    };

    if (args.title) patch.summary = args.title;
    if (args.description) patch.description = args.description;
    if (args.location) patch.location = args.location;
    if (args.attendeeEmail) patch.attendees = [{ email: args.attendeeEmail }];

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patch),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Calendar event update failed:", errorText);
        return { success: false, error: `Calendar API error: ${response.status}` };
      }

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update calendar event:", error);
      return { success: false, error: message };
    }
  },
});

export const deleteCalendarEvent = internalAction({
  args: {
    coachId: v.string(),
    eventId: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const accessToken = await getValidAccessToken(ctx, args.coachId);
    if (!accessToken) {
      return { success: false, error: "No valid Google Calendar connection" };
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${args.eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok && response.status !== 410) {
        return { success: false, error: `Calendar API error: ${response.status}` };
      }

      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to delete calendar event:", error);
      return { success: false, error: message };
    }
  },
});

// ==================== BUSY TIME FETCHING (for conflict checking) ====================

/**
 * Fetch busy times from Google Calendar's FreeBusy API and cache them.
 * Called from the booking page when a buyer selects a date range.
 */
export const refreshCalendarCache = internalAction({
  args: {
    coachId: v.string(),
    dateRangeStart: v.number(), // Unix timestamp
    dateRangeEnd: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    busyPeriodCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = await getValidAccessToken(ctx, args.coachId);
    if (!accessToken) {
      return { success: false, error: "No valid Google Calendar connection" };
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin: new Date(args.dateRangeStart).toISOString(),
            timeMax: new Date(args.dateRangeEnd).toISOString(),
            items: [{ id: "primary" }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google FreeBusy API failed:", errorText);
        return { success: false, error: `FreeBusy API error: ${response.status}` };
      }

      const data = await response.json() as {
        calendars: {
          primary: {
            busy: Array<{ start: string; end: string }>;
          };
        };
      };

      const busyPeriods = (data.calendars?.primary?.busy || []).map((period) => ({
        start: new Date(period.start).getTime(),
        end: new Date(period.end).getTime(),
      }));

      // Store in cache
      await ctx.runMutation(internal.googleCalendarQueries.storeBusyTimes, {
        userId: args.coachId,
        dateRangeStart: args.dateRangeStart,
        dateRangeEnd: args.dateRangeEnd,
        busyPeriods,
      });

      return { success: true, busyPeriodCount: busyPeriods.length };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to fetch calendar busy times:", error);
      return { success: false, error: message };
    }
  },
});
