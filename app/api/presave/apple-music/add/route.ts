import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  generateAppleMusicDeveloperToken,
  addAlbumToLibrary,
  addSongToLibrary,
} from "@/lib/presave/appleMusic";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/presave/apple-music/add
 *
 * Adds an album or song to the user's Apple Music library.
 * Requires the user's Music User Token from MusicKit JS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { releaseId, userToken, email, name } = body;

    if (!releaseId || !userToken) {
      return NextResponse.json(
        { error: "Release ID and user token are required" },
        { status: 400 }
      );
    }

    // Generate developer token
    const developerToken = await generateAppleMusicDeveloperToken();

    // Get release info from Convex
    const release = await convex.query(api.digitalProducts.getProductById, {
      productId: releaseId as Id<"digitalProducts">,
    }) as { releaseConfig?: { appleMusicAlbumId?: string } } | null;

    if (!release || !release.releaseConfig?.appleMusicAlbumId) {
      return NextResponse.json(
        { error: "Release not found or Apple Music not configured" },
        { status: 404 }
      );
    }

    const albumId = release.releaseConfig.appleMusicAlbumId;

    // Try to add album to library
    let success = false;

    // Apple Music IDs starting with "pl." are playlists, "a." are songs
    if (albumId.startsWith("a.")) {
      // It's a song
      success = await addSongToLibrary(developerToken, userToken, albumId);
    } else {
      // It's an album
      success = await addAlbumToLibrary(developerToken, userToken, albumId);
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to add to library" },
        { status: 500 }
      );
    }

    // Record the pre-save in Convex
    await convex.mutation(api.releasePreSaves.createPreSave, {
      releaseId: releaseId as Id<"digitalProducts">,
      email: email || "",
      name: name || "",
      platforms: {
        appleMusic: true,
      },
      appleMusicUserToken: userToken,
      source: "apple_music_oauth",
    });

    return NextResponse.json({
      success: true,
      message: "Added to your Apple Music library!",
    });
  } catch (error) {
    console.error("Apple Music add error:", error);
    return NextResponse.json(
      { error: "Failed to add to library" },
      { status: 500 }
    );
  }
}
