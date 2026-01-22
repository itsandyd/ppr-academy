/**
 * Spotify Pre-Save Integration
 *
 * This module handles the Spotify OAuth flow and pre-save functionality.
 * Uses Spotify Web API to save albums/tracks to user libraries.
 *
 * Required env vars:
 * - SPOTIFY_CLIENT_ID
 * - SPOTIFY_CLIENT_SECRET
 * - NEXT_PUBLIC_APP_URL (for callback URL)
 */

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Scopes needed for pre-save functionality
const SPOTIFY_SCOPES = [
  "user-library-modify", // To save albums/tracks
  "user-library-read", // To check if already saved
  "user-follow-modify", // To follow the artist
  "user-follow-read", // To check if already following
  "user-read-email", // To get user info for email matching
].join(" ");

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId?: string;
}

export interface SpotifyUser {
  id: string;
  email: string;
  display_name: string;
  images: Array<{ url: string }>;
}

/**
 * Generate the Spotify OAuth authorization URL
 */
export function getSpotifyAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "true", // Always show dialog for fresh consent
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string
): Promise<SpotifyTokens> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Spotify code: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshSpotifyToken(
  refreshToken: string
): Promise<SpotifyTokens> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Spotify token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Spotify may return a new refresh token
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Get the current user's Spotify profile
 */
export async function getSpotifyUser(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Spotify user: ${error}`);
  }

  return response.json();
}

/**
 * Save an album to the user's library (pre-save)
 */
export async function saveAlbumToLibrary(
  accessToken: string,
  albumId: string
): Promise<boolean> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/albums?ids=${albumId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to save album: ${error}`);
    return false;
  }

  return true;
}

/**
 * Save a track to the user's library (pre-save for singles)
 */
export async function saveTrackToLibrary(
  accessToken: string,
  trackId: string
): Promise<boolean> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/tracks?ids=${trackId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to save track: ${error}`);
    return false;
  }

  return true;
}

/**
 * Follow an artist
 */
export async function followArtist(
  accessToken: string,
  artistId: string
): Promise<boolean> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/following?type=artist&ids=${artistId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to follow artist: ${error}`);
    return false;
  }

  return true;
}

/**
 * Check if user has saved an album
 */
export async function checkAlbumSaved(
  accessToken: string,
  albumId: string
): Promise<boolean> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/albums/contains?ids=${albumId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data[0] === true;
}

/**
 * Check if user is following an artist
 */
export async function checkFollowingArtist(
  accessToken: string,
  artistId: string
): Promise<boolean> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/following/contains?type=artist&ids=${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data[0] === true;
}

/**
 * Parse a Spotify URI or URL to extract the ID and type
 */
export function parseSpotifyUri(
  uri: string
): { type: "track" | "album" | "artist"; id: string } | null {
  // Handle Spotify URI format: spotify:track:xxx or spotify:album:xxx
  if (uri.startsWith("spotify:")) {
    const parts = uri.split(":");
    if (parts.length === 3) {
      const type = parts[1] as "track" | "album" | "artist";
      const id = parts[2];
      if (["track", "album", "artist"].includes(type)) {
        return { type, id };
      }
    }
  }

  // Handle Spotify URL format: https://open.spotify.com/track/xxx
  try {
    const url = new URL(uri);
    if (url.hostname === "open.spotify.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const type = parts[0] as "track" | "album" | "artist";
        const id = parts[1].split("?")[0];
        if (["track", "album", "artist"].includes(type)) {
          return { type, id };
        }
      }
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

/**
 * Get artist ID from a track or album
 */
export async function getArtistFromTrack(
  accessToken: string,
  trackId: string
): Promise<string | null> {
  const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.artists?.[0]?.id || null;
}

export async function getArtistFromAlbum(
  accessToken: string,
  albumId: string
): Promise<string | null> {
  const response = await fetch(`${SPOTIFY_API_BASE}/albums/${albumId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.artists?.[0]?.id || null;
}
