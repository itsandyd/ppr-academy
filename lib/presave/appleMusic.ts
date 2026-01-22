/**
 * Apple Music Pre-Add Integration
 *
 * This module handles the Apple Music MusicKit JS integration for pre-add functionality.
 * Uses the Apple Music API to add albums to user libraries.
 *
 * Required env vars:
 * - APPLE_MUSIC_TEAM_ID
 * - APPLE_MUSIC_KEY_ID
 * - APPLE_MUSIC_PRIVATE_KEY (base64 encoded)
 *
 * Note: Apple Music pre-add works differently from Spotify:
 * 1. Generate a developer token (server-side)
 * 2. User authenticates with MusicKit JS (client-side)
 * 3. Add album to library using user token
 */

import * as jose from "jose";

const APPLE_MUSIC_API_BASE = "https://api.music.apple.com/v1";

export interface AppleMusicTokens {
  developerToken: string;
  userToken?: string;
  expiresAt: number;
}

/**
 * Generate an Apple Music developer token
 * This token is used to make API requests and initialize MusicKit
 */
export async function generateAppleMusicDeveloperToken(): Promise<string> {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKeyBase64 = process.env.APPLE_MUSIC_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKeyBase64) {
    throw new Error("Apple Music credentials not configured");
  }

  // Decode the private key from base64
  const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf-8");

  // Import the private key
  const key = await jose.importPKCS8(privateKey, "ES256");

  // Create the JWT
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({
      alg: "ES256",
      kid: keyId,
    })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("180d") // Max 6 months
    .sign(key);

  return jwt;
}

/**
 * Add an album to the user's library (pre-add)
 * Requires a user music token from MusicKit JS authorization
 */
export async function addAlbumToLibrary(
  developerToken: string,
  userToken: string,
  albumId: string,
  storefront: string = "us"
): Promise<boolean> {
  const response = await fetch(
    `${APPLE_MUSIC_API_BASE}/me/library?ids[albums]=${albumId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": userToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to add album to library: ${error}`);
    return false;
  }

  return true;
}

/**
 * Add a song to the user's library
 */
export async function addSongToLibrary(
  developerToken: string,
  userToken: string,
  songId: string
): Promise<boolean> {
  const response = await fetch(
    `${APPLE_MUSIC_API_BASE}/me/library?ids[songs]=${songId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": userToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to add song to library: ${error}`);
    return false;
  }

  return true;
}

/**
 * Check if user has added an album to their library
 */
export async function checkAlbumInLibrary(
  developerToken: string,
  userToken: string,
  albumId: string
): Promise<boolean> {
  const response = await fetch(
    `${APPLE_MUSIC_API_BASE}/me/library/albums/${albumId}`,
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": userToken,
      },
    }
  );

  // 404 means not in library
  return response.ok;
}

/**
 * Search for an album in the Apple Music catalog
 */
export async function searchAlbum(
  developerToken: string,
  query: string,
  storefront: string = "us"
): Promise<Array<{
  id: string;
  name: string;
  artistName: string;
  artwork: string;
}>> {
  const response = await fetch(
    `${APPLE_MUSIC_API_BASE}/catalog/${storefront}/search?term=${encodeURIComponent(query)}&types=albums&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const albums = data.results?.albums?.data || [];

  return albums.map((album: any) => ({
    id: album.id,
    name: album.attributes.name,
    artistName: album.attributes.artistName,
    artwork: album.attributes.artwork?.url
      ?.replace("{w}", "300")
      .replace("{h}", "300"),
  }));
}

/**
 * Get album details from Apple Music
 */
export async function getAlbumDetails(
  developerToken: string,
  albumId: string,
  storefront: string = "us"
): Promise<{
  id: string;
  name: string;
  artistName: string;
  artwork: string;
  releaseDate: string;
  trackCount: number;
} | null> {
  const response = await fetch(
    `${APPLE_MUSIC_API_BASE}/catalog/${storefront}/albums/${albumId}`,
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const album = data.data?.[0];

  if (!album) {
    return null;
  }

  return {
    id: album.id,
    name: album.attributes.name,
    artistName: album.attributes.artistName,
    artwork: album.attributes.artwork?.url
      ?.replace("{w}", "300")
      .replace("{h}", "300"),
    releaseDate: album.attributes.releaseDate,
    trackCount: album.attributes.trackCount,
  };
}

/**
 * Parse an Apple Music URL to extract the album ID
 * URL format: https://music.apple.com/{storefront}/album/{album-name}/{album-id}
 */
export function parseAppleMusicUrl(url: string): {
  id: string;
  storefront: string;
} | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname !== "music.apple.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    // Format: /{storefront}/album/{name}/{id}
    if (parts.length >= 3 && parts[1] === "album") {
      const storefront = parts[0];
      const id = parts[parts.length - 1];

      // Apple Music IDs are numeric
      if (/^\d+$/.test(id)) {
        return { id, storefront };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate MusicKit JS configuration for client-side initialization
 */
export function getMusicKitConfig(developerToken: string) {
  return {
    developerToken,
    app: {
      name: "PPR Academy",
      build: "1.0.0",
    },
  };
}
