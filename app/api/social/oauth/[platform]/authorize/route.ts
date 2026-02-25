import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  PKCE_PLATFORMS,
  OAUTH_SESSION_COOKIE,
  OAUTH_SESSION_MAX_AGE,
} from "@/lib/oauth-pkce";
import { encryptToken } from "@/lib/encryption";

/**
 * Server-side OAuth initiation route.
 *
 * Generates a cryptographic state (CSRF protection) and, for platforms that
 * require it, a PKCE code_verifier / code_challenge pair. Both are persisted
 * in an encrypted, httpOnly cookie so the callback can validate and use them.
 *
 * GET /api/social/oauth/[platform]/authorize?storeId=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const { platform } = await params;
  const storeId = request.nextUrl.searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json(
      { error: "Missing storeId parameter" },
      { status: 400 }
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/social/oauth/${platform}/callback`;
  const state = generateOAuthState();

  // Generate PKCE params for platforms that require it
  const codeVerifier = PKCE_PLATFORMS.has(platform)
    ? generateCodeVerifier()
    : undefined;
  const codeChallenge = codeVerifier
    ? generateCodeChallenge(codeVerifier)
    : undefined;

  // Build session data stored in encrypted cookie
  const sessionData = JSON.stringify({
    state,
    storeId,
    platform,
    ...(codeVerifier && { codeVerifier }),
    createdAt: Date.now(),
  });

  // Build provider-specific authorization URL
  const authUrl = buildAuthUrl(platform, {
    redirectUri,
    state,
    codeChallenge,
  });

  if (!authUrl) {
    return NextResponse.json(
      { error: "Unsupported platform" },
      { status: 400 }
    );
  }

  const response = NextResponse.redirect(authUrl);

  response.cookies.set(OAUTH_SESSION_COOKIE, encryptToken(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/social/oauth",
    maxAge: OAUTH_SESSION_MAX_AGE,
  });

  return response;
}

// ---------------------------------------------------------------------------
// Platform-specific authorization URL builders
// ---------------------------------------------------------------------------

function buildAuthUrl(
  platform: string,
  opts: { redirectUri: string; state: string; codeChallenge?: string }
): string | null {
  const { redirectUri, state, codeChallenge } = opts;

  switch (platform) {
    case "instagram": {
      const facebookAppId =
        process.env.FACEBOOK_APP_ID ||
        process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!facebookAppId) throw new Error("Missing FACEBOOK_APP_ID");

      const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_comments",
        "instagram_manage_messages",
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "pages_manage_metadata",
        "pages_messaging",
        "pages_manage_engagement",
        "business_management",
      ].join(",");

      return (
        `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${facebookAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `display=popup&response_type=code&auth_type=rerequest`
      );
    }

    case "twitter": {
      const twitterClientId =
        process.env.TWITTER_CLIENT_ID ||
        process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
      if (!twitterClientId) throw new Error("Missing TWITTER_CLIENT_ID");
      if (!codeChallenge) throw new Error("PKCE code challenge required for Twitter");

      return (
        `https://twitter.com/i/oauth2/authorize?` +
        `client_id=${twitterClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent("tweet.read tweet.write users.read offline.access")}&` +
        `response_type=code&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`
      );
    }

    case "facebook": {
      const fbAppId =
        process.env.FACEBOOK_APP_ID ||
        process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!fbAppId) throw new Error("Missing FACEBOOK_APP_ID");

      const scopes = [
        "pages_read_engagement",
        "pages_manage_posts",
        "pages_show_list",
        "business_management",
      ].join(",");

      return (
        `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${fbAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `auth_type=rerequest`
      );
    }

    case "linkedin": {
      const linkedinClientId =
        process.env.LINKEDIN_CLIENT_ID ||
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      if (!linkedinClientId) throw new Error("Missing LINKEDIN_CLIENT_ID");

      return (
        `https://www.linkedin.com/oauth/v2/authorization?` +
        `client_id=${linkedinClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent("r_liteprofile r_emailaddress w_member_social")}&` +
        `response_type=code`
      );
    }

    case "tiktok": {
      const tiktokClientKey =
        process.env.TIKTOK_CLIENT_KEY ||
        process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
      if (!tiktokClientKey) throw new Error("Missing TIKTOK_CLIENT_KEY");

      const scopes = [
        "user.info.basic",
        "video.upload",
        "video.publish",
      ].join(",");

      return (
        `https://www.tiktok.com/auth/authorize/?` +
        `client_key=${tiktokClientKey}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_type=code`
      );
    }

    default:
      return null;
  }
}
