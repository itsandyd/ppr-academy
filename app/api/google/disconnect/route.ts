import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api, internal } from "@/convex/_generated/api";

export async function POST() {
  try {
    const user = await requireAuth();

    // Get the refresh token before disconnecting so we can revoke it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = await fetchQuery(internal.googleCalendarQueries.getRefreshTokenForDisconnect as any, {
      userId: user.id,
    });

    // Delete connection and clear cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetchMutation(api.googleCalendarQueries.disconnectCalendar as any, {
      userId: user.id,
    });

    // Best-effort: revoke the token with Google
    if (refreshToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch {
        // Revocation failure is non-critical
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Google disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
