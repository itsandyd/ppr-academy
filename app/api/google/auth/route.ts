import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/dashboard/coaching/sessions";

    const state = JSON.stringify({
      userId: user.id,
      returnUrl,
    });

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state: Buffer.from(state).toString("base64"),
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    console.error("Google auth initiation failed:", error);
    return NextResponse.json({ error: "Failed to initiate Google auth" }, { status: 500 });
  }
}
