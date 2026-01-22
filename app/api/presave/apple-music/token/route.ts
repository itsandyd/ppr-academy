import { NextRequest, NextResponse } from "next/server";
import { generateAppleMusicDeveloperToken } from "@/lib/presave/appleMusic";

/**
 * GET /api/presave/apple-music/token
 *
 * Generates an Apple Music developer token for MusicKit JS initialization.
 * This token is used client-side to authorize with Apple Music.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Apple Music is configured
    if (
      !process.env.APPLE_MUSIC_TEAM_ID ||
      !process.env.APPLE_MUSIC_KEY_ID ||
      !process.env.APPLE_MUSIC_PRIVATE_KEY
    ) {
      return NextResponse.json(
        { error: "Apple Music is not configured" },
        { status: 503 }
      );
    }

    const developerToken = await generateAppleMusicDeveloperToken();

    return NextResponse.json({
      developerToken,
      // Token is valid for 180 days, but we'll refresh more often
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
  } catch (error) {
    console.error("Apple Music token error:", error);
    return NextResponse.json(
      { error: "Failed to generate Apple Music token" },
      { status: 500 }
    );
  }
}
