import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAuthUrl } from "@/lib/presave/spotify";

/**
 * GET /api/presave/spotify/authorize
 *
 * Initiates Spotify OAuth flow for pre-save functionality.
 * Returns the Spotify authorization URL.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get("releaseId");
    const returnUrl = searchParams.get("returnUrl");

    if (!releaseId) {
      return NextResponse.json(
        { error: "Release ID is required" },
        { status: 400 }
      );
    }

    // Create state with release info for callback
    const state = Buffer.from(
      JSON.stringify({
        releaseId,
        returnUrl: returnUrl || "/",
        timestamp: Date.now(),
      })
    ).toString("base64url");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/presave/spotify/callback`;

    const authUrl = getSpotifyAuthUrl(state, redirectUri);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Spotify authorize error:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
