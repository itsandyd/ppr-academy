import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SPOTIFY_REDIRECT_URI = `${BASE_URL}/api/follow-gate/spotify/callback`;

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

interface StateData {
  artistId: string;
  returnUrl: string;
  productId?: string;
  mode: string;
  timestamp: number;
}

/**
 * Handle Spotify OAuth callback
 *
 * This callback:
 * 1. Exchanges the auth code for an access token
 * 2. Checks if the user already follows the artist
 * 3. If not following, triggers the follow via API
 * 4. Redirects back to the product page with success status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse state to get original params
  let stateData: StateData | null = null;

  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    }
  } catch {
    return createRedirect(BASE_URL, {
      spotifyError: "Invalid state parameter",
      platform: "spotify",
    });
  }

  const returnUrl = stateData?.returnUrl || BASE_URL;

  // Handle user cancellation or error
  if (error) {
    return createRedirect(returnUrl, {
      spotifyError: error === "access_denied" ? "Authorization cancelled" : `Spotify error: ${error}`,
      platform: "spotify",
    });
  }

  if (!code) {
    return createRedirect(returnUrl, {
      spotifyError: "No authorization code received",
      platform: "spotify",
    });
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return createRedirect(returnUrl, {
      spotifyError: "Spotify OAuth not configured",
      platform: "spotify",
    });
  }

  // Verify state is not too old (max 10 minutes)
  if (stateData && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    return createRedirect(returnUrl, {
      spotifyError: "Authorization session expired. Please try again.",
      platform: "spotify",
    });
  }

  try {
    // Step 1: Exchange code for access token
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
      return createRedirect(returnUrl, {
        spotifyError: "Failed to authenticate with Spotify",
        platform: "spotify",
      });
    }

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const artistId = stateData?.artistId;
    if (!artistId) {
      return createRedirect(returnUrl, {
        spotifyError: "Missing artist ID",
        platform: "spotify",
      });
    }

    // Step 2: Check if user already follows the artist
    const checkFollowResponse = await fetch(
      `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!checkFollowResponse.ok) {
      console.error("Spotify follow check error:", await checkFollowResponse.text());
      return createRedirect(returnUrl, {
        spotifyError: "Failed to check follow status",
        platform: "spotify",
      });
    }

    const followResults: boolean[] = await checkFollowResponse.json();
    let isFollowing = followResults[0] === true;

    // Step 3: If not following, trigger the follow
    if (!isFollowing) {
      const followResponse = await fetch(
        `https://api.spotify.com/v1/me/following?type=artist&ids=${artistId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (followResponse.ok || followResponse.status === 204) {
        isFollowing = true;

      } else {
        const errorText = await followResponse.text();
        console.error("Spotify follow error:", errorText);
        // Don't fail completely - user might have already followed manually
      }
    }

    // Step 4: Verify the follow was successful
    if (isFollowing || stateData?.mode === "verify") {
      // Double-check the follow status
      const verifyResponse = await fetch(
        `https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (verifyResponse.ok) {
        const verifyResults: boolean[] = await verifyResponse.json();
        isFollowing = verifyResults[0] === true;
      }
    }

    // Step 5: Redirect back with result
    return createRedirect(returnUrl, {
      spotifyVerified: isFollowing ? "true" : "false",
      spotifyFollowed: isFollowing ? "true" : "false",
      platform: "spotify",
      productId: stateData?.productId,
    });

  } catch (err) {
    console.error("Spotify OAuth error:", err);
    return createRedirect(returnUrl, {
      spotifyError: "An error occurred during Spotify verification",
      platform: "spotify",
    });
  }
}

function createRedirect(
  baseUrl: string,
  params: Record<string, string | undefined>
): NextResponse {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(url.toString());
}
