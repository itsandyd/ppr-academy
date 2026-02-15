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

    // Step 1: Check if user is already subscribed
    let isSubscribed = await checkSubscription(tokenData.access_token, channelId);

    // Step 2: If not subscribed, trigger the subscription via API
    if (!isSubscribed) {
      const subscribeResult = await triggerSubscription(tokenData.access_token, channelId);
      if (subscribeResult.success) {
        isSubscribed = true;

      } else {
        console.error("YouTube subscribe error:", subscribeResult.error);
        // Don't fail completely - user might subscribe manually
      }
    }

    // Step 3: Verify the subscription was successful (double-check)
    if (isSubscribed) {
      const verified = await checkSubscription(tokenData.access_token, channelId);
      isSubscribed = verified;
    }

    // Step 4: Build redirect URL with result
    const returnUrl = new URL(stateData?.returnUrl || "/");
    returnUrl.searchParams.set("youtubeVerified", isSubscribed ? "true" : "false");
    returnUrl.searchParams.set("youtubeSubscribed", isSubscribed ? "true" : "false");
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
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(returnUrl || BASE_URL);
  url.searchParams.set("youtubeError", error);
  url.searchParams.set("platform", "youtube");
  return NextResponse.redirect(url.toString());
}

/**
 * Check if the user is subscribed to a specific YouTube channel
 */
async function checkSubscription(accessToken: string, channelId: string): Promise<boolean> {
  try {
    // Check first 100 subscriptions (2 pages of 50)
    let nextPageToken: string | undefined;

    for (let i = 0; i < 2; i++) {
      const subsUrl = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
      subsUrl.searchParams.set("part", "snippet");
      subsUrl.searchParams.set("mine", "true");
      subsUrl.searchParams.set("maxResults", "50");
      if (nextPageToken) {
        subsUrl.searchParams.set("pageToken", nextPageToken);
      }

      const subsResponse = await fetch(subsUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!subsResponse.ok) {
        console.error("YouTube subscriptions check error:", await subsResponse.text());
        return false;
      }

      const subsData: YouTubeSubscriptionsResponse = await subsResponse.json();

      // Check if the target channel is in the subscriptions
      if (subsData.items) {
        const found = subsData.items.some(
          (sub) => sub.snippet.resourceId.channelId === channelId
        );
        if (found) return true;
      }

      nextPageToken = subsData.nextPageToken;
      if (!nextPageToken) break;
    }

    return false;
  } catch (err) {
    console.error("Error checking YouTube subscription:", err);
    return false;
  }
}

/**
 * Subscribe the user to a YouTube channel
 */
async function triggerSubscription(
  accessToken: string,
  channelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscribeResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            resourceId: {
              kind: "youtube#channel",
              channelId: channelId,
            },
          },
        }),
      }
    );

    if (subscribeResponse.ok) {
      return { success: true };
    }

    // Handle specific error cases
    const errorData = await subscribeResponse.json();

    // If already subscribed, treat as success
    if (errorData.error?.errors?.[0]?.reason === "subscriptionDuplicate") {
      return { success: true };
    }

    return {
      success: false,
      error: errorData.error?.message || "Failed to subscribe"
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
}
