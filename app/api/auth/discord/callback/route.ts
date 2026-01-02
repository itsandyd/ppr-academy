import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

function getReturnUrl(request: NextRequest, defaultPath: string = "/home"): string {
  const stateParam = request.nextUrl.searchParams.get("state");
  if (stateParam) {
    try {
      const decoded = decodeURIComponent(stateParam);
      if (decoded.startsWith("/")) {
        return decoded;
      }
    } catch {}
  }
  return defaultPath;
}

function buildRedirectUrl(
  request: NextRequest,
  path: string,
  params: Record<string, string> = {}
): URL {
  const url = new URL(path, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export async function GET(request: NextRequest) {
  const returnPath = getReturnUrl(request);

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Discord OAuth error:", error);
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "Discord connection failed" })
      );
    }

    if (!code) {
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "missing_code" })
      );
    }

    const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Discord environment variables");
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "missing_config" })
      );
    }

    const redirectUri =
      process.env.DISCORD_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/discord/callback`;

    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Discord token exchange failed:", errorText);
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "token_exchange_failed" })
      );
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch Discord user info");
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "user_fetch_failed" })
      );
    }

    const discordUser = await userResponse.json();

    const convexResponse = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "discordPublic:connectDiscordAccount",
        args: {
          userId,
          discordUserId: discordUser.id,
          discordUsername: discordUser.username,
          discordDiscriminator: discordUser.discriminator,
          discordAvatar: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : undefined,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
        },
      }),
    });

    if (!convexResponse.ok) {
      console.error("Failed to save to Convex");
      return NextResponse.redirect(
        buildRedirectUrl(request, returnPath, { discord_error: "save_failed" })
      );
    }

    return NextResponse.redirect(
      buildRedirectUrl(request, returnPath, { discord_connected: "true" })
    );
  } catch (error) {
    console.error("Discord OAuth callback error:", error);
    return NextResponse.redirect(
      buildRedirectUrl(request, returnPath, { discord_error: "unexpected_error" })
    );
  }
}
