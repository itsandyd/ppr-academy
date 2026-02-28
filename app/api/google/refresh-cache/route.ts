import { NextRequest, NextResponse } from "next/server";
import { fetchAction } from "convex/nextjs";
import { internal } from "@/convex/_generated/api";

/**
 * Refresh Google Calendar busy-time cache for a coach.
 * Called from the booking page when a buyer views available slots.
 * No auth required — this only caches public busy/free info for the coach.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coachId, dateRangeStart, dateRangeEnd } = body;

    if (!coachId || !dateRangeStart || !dateRangeEnd) {
      return NextResponse.json(
        { error: "Missing required fields: coachId, dateRangeStart, dateRangeEnd" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await fetchAction(internal.googleCalendarActions.refreshCalendarCache as any, {
      coachId,
      dateRangeStart,
      dateRangeEnd,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Calendar cache refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh calendar cache" },
      { status: 500 }
    );
  }
}
