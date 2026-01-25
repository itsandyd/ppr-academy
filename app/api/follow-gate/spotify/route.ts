import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/follow-gate/spotify/callback`
  : "http://localhost:3000/api/follow-gate/spotify/callback";

/**
 * Initiate Spotify OAuth flow for follow verification
 * GET /api/follow-gate/spotify?artistId=xxx&returnUrl=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistId = searchParams.get("artistId");
  const returnUrl = searchParams.get("returnUrl");
  const productId = searchParams.get("productId");

  if (!artistId) {
    return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });
  }

  if (!SPOTIFY_CLIENT_ID) {
    return NextResponse.json(
      { error: "Spotify OAuth not configured" },
      { status: 500 }
    );
  }

  // Store state in a cookie for verification
  const state = Buffer.from(
    JSON.stringify({ artistId, returnUrl, productId, timestamp: Date.now() })
  ).toString("base64");

  // Build Spotify OAuth URL
  const scope = "user-follow-read";
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("show_dialog", "true");

  return NextResponse.redirect(authUrl.toString());
}
