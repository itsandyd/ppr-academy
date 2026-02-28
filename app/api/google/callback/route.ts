import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { internal } from "@/convex/_generated/api";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const stateParam = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/coaching/sessions?google_error=denied", request.url)
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL("/dashboard/coaching/sessions?google_error=missing_params", request.url)
      );
    }

    // Decode state
    let state: { userId: string; returnUrl: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/coaching/sessions?google_error=invalid_state", request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Google token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL(`${state.returnUrl}?google_error=token_exchange_failed`, request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Store tokens in Convex
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetchMutation(internal.googleCalendarQueries.storeCalendarConnection as any, {
      userId: state.userId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
      calendarId: "primary",
    });

    return NextResponse.redirect(
      new URL(`${state.returnUrl}?google_connected=true`, request.url)
    );
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/coaching/sessions?google_error=unknown", request.url)
    );
  }
}
