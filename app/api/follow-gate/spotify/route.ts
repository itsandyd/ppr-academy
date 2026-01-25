import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SPOTIFY_REDIRECT_URI = `${BASE_URL}/api/follow-gate/spotify/callback`;

/**
 * Spotify OAuth Follow Gate Flow
 *
 * This implements a Hypeddit-style follow gate where:
 * 1. User clicks "Follow on Spotify" button
 * 2. User is redirected to Spotify OAuth to authorize
 * 3. After auth, we check if they follow the artist
 * 4. If not following, we trigger the follow via API
 * 5. User is redirected back with success status
 *
 * GET /api/follow-gate/spotify?artistId=xxx&returnUrl=xxx&productId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistId = searchParams.get("artistId");
  const returnUrl = searchParams.get("returnUrl");
  const productId = searchParams.get("productId");
  const mode = searchParams.get("mode") || "follow"; // "follow" or "verify"

  if (!artistId) {
    return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });
  }

  if (!SPOTIFY_CLIENT_ID) {
    // Return JSON error for API calls, redirect for browser requests
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        { error: "Spotify OAuth not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to environment variables." },
        { status: 500 }
      );
    }
    // Redirect back with error
    const errorUrl = new URL(returnUrl || BASE_URL);
    errorUrl.searchParams.set("spotifyError", "Spotify OAuth not configured");
    return NextResponse.redirect(errorUrl.toString());
  }

  // Store state in base64 for the callback
  const state = Buffer.from(
    JSON.stringify({
      artistId,
      returnUrl: returnUrl || BASE_URL,
      productId,
      mode,
      timestamp: Date.now()
    })
  ).toString("base64");

  // Request both read and modify scopes for full functionality
  // user-follow-read: Check if user follows artist
  // user-follow-modify: Trigger follow action
  const scopes = ["user-follow-read", "user-follow-modify"];

  // Build Spotify OAuth URL
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("show_dialog", "false"); // Don't force re-auth if already authorized

  return NextResponse.redirect(authUrl.toString());
}
