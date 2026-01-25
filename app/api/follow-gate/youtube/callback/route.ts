import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/follow-gate/youtube/callback`
  : "http://localhost:3000/api/follow-gate/youtube/callback";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface YouTubeSubscription {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    resourceId: {
      kind: string;
      channelId: string;
    };
    channelId: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
  };
}

interface YouTubeSubscriptionsResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items?: YouTubeSubscription[];
  nextPageToken?: string;
}

/**
 * Handle YouTube OAuth callback and verify subscription status
 * GET /api/follow-gate/youtube/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Parse state to get original params
  let stateData: {
    channelId: string;
    returnUrl: string;
    productId: string;
    timestamp: number;
  } | null = null;

  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    }
  } catch {
    return createErrorRedirect("Invalid state parameter", stateData?.returnUrl);
  }

  if (error) {
    return createErrorRedirect(`YouTube auth failed: ${error}`, stateData?.returnUrl);
  }

  if (!code) {
    return createErrorRedirect("No authorization code received", stateData?.returnUrl);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return createErrorRedirect("YouTube OAuth not configured", stateData?.returnUrl);
  }

  // Verify state is not too old (max 10 minutes)
  if (stateData && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    return createErrorRedirect("Authorization session expired", stateData.returnUrl);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("YouTube token error:", errorData);
      return createErrorRedirect("Failed to get YouTube access token", stateData?.returnUrl);
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // Check if user is subscribed to the channel
    const channelId = stateData?.channelId;
    if (!channelId) {
      return createErrorRedirect("Missing channel ID", stateData?.returnUrl);
    }

    // Check subscriptions - we need to iterate through pages to find the channel
    let isSubscribed = false;
    let nextPageToken: string | undefined;

    // Check first 100 subscriptions (2 pages of 50)
    for (let i = 0; i < 2 && !isSubscribed; i++) {
      const subsUrl = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
      subsUrl.searchParams.set("part", "snippet");
      subsUrl.searchParams.set("mine", "true");
      subsUrl.searchParams.set("maxResults", "50");
      if (nextPageToken) {
        subsUrl.searchParams.set("pageToken", nextPageToken);
      }

      const subsResponse = await fetch(subsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!subsResponse.ok) {
        console.error("YouTube subscriptions check error:", await subsResponse.text());
        return createErrorRedirect("Failed to check subscription status", stateData?.returnUrl);
      }

      const subsData: YouTubeSubscriptionsResponse = await subsResponse.json();

      // Check if the target channel is in the subscriptions
      if (subsData.items) {
        isSubscribed = subsData.items.some(
          (sub) => sub.snippet.resourceId.channelId === channelId
        );
      }

      nextPageToken = subsData.nextPageToken;
      if (!nextPageToken) break;
    }

    // Build redirect URL with result
    const returnUrl = new URL(stateData?.returnUrl || "/");
    returnUrl.searchParams.set("youtubeVerified", isSubscribed ? "true" : "false");
    returnUrl.searchParams.set("platform", "youtube");
    if (stateData?.productId) {
      returnUrl.searchParams.set("productId", stateData.productId);
    }

    return NextResponse.redirect(returnUrl.toString());
  } catch (err) {
    console.error("YouTube OAuth error:", err);
    return createErrorRedirect("An error occurred during verification", stateData?.returnUrl);
  }
}

function createErrorRedirect(error: string, returnUrl?: string | null): NextResponse {
  const url = new URL(returnUrl || "/");
  url.searchParams.set("youtubeError", error);
  return NextResponse.redirect(url.toString());
}
