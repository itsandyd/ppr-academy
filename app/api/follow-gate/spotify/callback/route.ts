import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/follow-gate/spotify/callback`
  : "http://localhost:3000/api/follow-gate/spotify/callback";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Handle Spotify OAuth callback and verify follow status
 * GET /api/follow-gate/spotify/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse state to get original params
  let stateData: {
    artistId: string;
    returnUrl: string;
    productId: string;
    timestamp: number;
  } | null = null;

  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    }
  } catch {
    return createErrorRedirect("Invalid state parameter", stateData?.returnUrl);
  }

  if (error) {
    return createErrorRedirect(`Spotify auth failed: ${error}`, stateData?.returnUrl);
  }

  if (!code) {
    return createErrorRedirect("No authorization code received", stateData?.returnUrl);
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return createErrorRedirect("Spotify OAuth not configured", stateData?.returnUrl);
  }

  // Verify state is not too old (max 10 minutes)
  if (stateData && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    return createErrorRedirect("Authorization session expired", stateData.returnUrl);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Spotify token error:", errorData);
      return createErrorRedirect("Failed to get Spotify access token", stateData?.returnUrl);
    }

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();

    // Check if user follows the artist
    const artistId = stateData?.artistId;
    if (!artistId) {
      return createErrorRedirect("Missing artist ID", stateData?.returnUrl);
    }

    const followCheckResponse = await fetch(
      `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!followCheckResponse.ok) {
      console.error("Spotify follow check error:", await followCheckResponse.text());
      return createErrorRedirect("Failed to check follow status", stateData?.returnUrl);
    }

    const followResults: boolean[] = await followCheckResponse.json();
    const isFollowing = followResults[0] === true;

    // Build redirect URL with result
    const returnUrl = new URL(stateData?.returnUrl || "/");
    returnUrl.searchParams.set("spotifyVerified", isFollowing ? "true" : "false");
    returnUrl.searchParams.set("platform", "spotify");
    if (stateData?.productId) {
      returnUrl.searchParams.set("productId", stateData.productId);
    }

    return NextResponse.redirect(returnUrl.toString());
  } catch (err) {
    console.error("Spotify OAuth error:", err);
    return createErrorRedirect("An error occurred during verification", stateData?.returnUrl);
  }
}

function createErrorRedirect(error: string, returnUrl?: string | null): NextResponse {
  const url = new URL(returnUrl || "/");
  url.searchParams.set("spotifyError", error);
  return NextResponse.redirect(url.toString());
}
