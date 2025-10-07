import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

export async function GET(request: NextRequest) {
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
        new URL(`/home?discord_error=${encodeURIComponent("Discord connection failed")}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/home?discord_error=missing_code", request.url)
      );
    }

    // Check for required environment variables
    const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error("Missing Discord environment variables");
      return NextResponse.redirect(
        new URL("/home?discord_error=missing_config", request.url)
      );
    }

    // Calculate redirect URI
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 
      `${request.nextUrl.origin}/api/auth/discord/callback`;

    // Exchange code for access token
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
        new URL("/home?discord_error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Discord
    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch Discord user info");
      return NextResponse.redirect(
        new URL("/home?discord_error=user_fetch_failed", request.url)
      );
    }

    const discordUser = await userResponse.json();

    // Save to Convex
    const convexResponse = await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`,
      {
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
      }
    );

    if (!convexResponse.ok) {
      console.error("Failed to save to Convex");
      return NextResponse.redirect(
        new URL("/home?discord_error=save_failed", request.url)
      );
    }

    // Success! Redirect to home with success message
    return NextResponse.redirect(
      new URL("/home?discord_connected=true", request.url)
    );
  } catch (error) {
    console.error("Discord OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/home?discord_error=unexpected_error", request.url)
    );
  }
}
