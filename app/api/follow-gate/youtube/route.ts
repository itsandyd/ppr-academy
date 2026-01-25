import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/follow-gate/youtube/callback`
  : "http://localhost:3000/api/follow-gate/youtube/callback";

/**
 * Initiate YouTube OAuth flow for subscription verification
 * GET /api/follow-gate/youtube?channelId=xxx&returnUrl=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get("channelId");
  const returnUrl = searchParams.get("returnUrl");
  const productId = searchParams.get("productId");

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
  }

  if (!GOOGLE_CLIENT_ID) {
    // Return JSON error for API calls, redirect for browser requests
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        { error: "YouTube OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables." },
        { status: 500 }
      );
    }
    // Redirect back with error
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const errorUrl = new URL(returnUrl || BASE_URL);
    errorUrl.searchParams.set("youtubeError", "YouTube OAuth not configured");
    return NextResponse.redirect(errorUrl.toString());
  }

  // Store state in a cookie for verification
  const state = Buffer.from(
    JSON.stringify({ channelId, returnUrl, productId, timestamp: Date.now() })
  ).toString("base64");

  // Build Google OAuth URL for YouTube
  // We need both read and force (subscribe) scopes
  const scopes = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl" // Required for subscriptions.insert
  ];
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", YOUTUBE_REDIRECT_URI);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
