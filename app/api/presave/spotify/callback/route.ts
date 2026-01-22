import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  exchangeSpotifyCode,
  getSpotifyUser,
  parseSpotifyUri,
  saveAlbumToLibrary,
  saveTrackToLibrary,
  followArtist,
  getArtistFromTrack,
  getArtistFromAlbum,
} from "@/lib/presave/spotify";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/presave/spotify/callback
 *
 * Handles Spotify OAuth callback, exchanges code for tokens,
 * and saves the album/track to user's library.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/presave/spotify/callback`;

    if (error) {
      console.error("Spotify OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/presave/error?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/presave/error?error=missing_params`
      );
    }

    // Decode state
    let stateData: { releaseId: string; returnUrl: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    } catch {
      return NextResponse.redirect(
        `${baseUrl}/presave/error?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeSpotifyCode(code, redirectUri);

    // Get user info
    const user = await getSpotifyUser(tokens.accessToken);

    // Get release info from Convex
    const release = await convex.query(api.digitalProducts.getProductById, {
      productId: stateData.releaseId as Id<"digitalProducts">,
    }) as { releaseConfig?: { spotifyUri?: string } } | null;

    if (!release || !release.releaseConfig?.spotifyUri) {
      return NextResponse.redirect(
        `${baseUrl}/presave/error?error=release_not_found`
      );
    }

    // Parse the Spotify URI
    const parsed = parseSpotifyUri(release.releaseConfig.spotifyUri);

    if (!parsed) {
      return NextResponse.redirect(
        `${baseUrl}/presave/error?error=invalid_spotify_uri`
      );
    }

    let saveSuccess = false;

    // Save to library based on type
    if (parsed.type === "album") {
      saveSuccess = await saveAlbumToLibrary(tokens.accessToken, parsed.id);

      // Also follow the artist
      const artistId = await getArtistFromAlbum(tokens.accessToken, parsed.id);
      if (artistId) {
        await followArtist(tokens.accessToken, artistId);
      }
    } else if (parsed.type === "track") {
      saveSuccess = await saveTrackToLibrary(tokens.accessToken, parsed.id);

      // Also follow the artist
      const artistId = await getArtistFromTrack(tokens.accessToken, parsed.id);
      if (artistId) {
        await followArtist(tokens.accessToken, artistId);
      }
    }

    // Record the pre-save in Convex
    await convex.mutation(api.releasePreSaves.createPreSave, {
      releaseId: stateData.releaseId as Id<"digitalProducts">,
      email: user.email,
      name: user.display_name,
      platforms: {
        spotify: saveSuccess,
      },
      spotifyAccessToken: tokens.accessToken,
      spotifyRefreshToken: tokens.refreshToken,
      spotifyUserId: user.id,
      source: "spotify_oauth",
    });

    // Redirect to success page
    const successUrl = new URL(`${baseUrl}/presave/success`);
    successUrl.searchParams.set("platform", "spotify");
    successUrl.searchParams.set("releaseId", stateData.releaseId);
    if (stateData.returnUrl) {
      successUrl.searchParams.set("returnUrl", stateData.returnUrl);
    }

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("Spotify callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/presave/error?error=callback_failed`
    );
  }
}
