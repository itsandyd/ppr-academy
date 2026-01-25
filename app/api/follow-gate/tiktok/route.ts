import { NextRequest, NextResponse } from "next/server";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TIKTOK_REDIRECT_URI = `${BASE_URL}/api/follow-gate/tiktok/callback`;

/**
 * TikTok OAuth Follow Gate Flow (Hypeddit-style)
 *
 * Since TikTok doesn't have a "follow" API for third-party apps,
 * this flow verifies the user is logged into TikTok via OAuth,
 * then opens the creator's profile page for manual follow.
 *
 * Flow:
 * 1. User clicks "Follow on TikTok" button
 * 2. User is redirected to TikTok OAuth to verify identity
 * 3. After auth, we redirect them to the creator's TikTok profile
 * 4. User manually clicks follow on TikTok
 * 5. User returns to our page and confirms they followed
 *
 * GET /api/follow-gate/tiktok?profileUrl=xxx&returnUrl=xxx&productId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const profileUrl = searchParams.get("profileUrl");
  const returnUrl = searchParams.get("returnUrl");
  const productId = searchParams.get("productId");

  if (!profileUrl) {
    return NextResponse.json({ error: "TikTok profile URL is required" }, { status: 400 });
  }

  if (!TIKTOK_CLIENT_KEY) {
    // Return JSON error for API calls, redirect for browser requests
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        { error: "TikTok OAuth not configured. Please add TIKTOK_CLIENT_KEY to environment variables." },
        { status: 500 }
      );
    }
    // Redirect back with error
    const errorUrl = new URL(returnUrl || BASE_URL);
    errorUrl.searchParams.set("tiktokError", "TikTok OAuth not configured");
    return NextResponse.redirect(errorUrl.toString());
  }

  // Store state in base64 for the callback
  const state = Buffer.from(
    JSON.stringify({
      profileUrl,
      returnUrl: returnUrl || BASE_URL,
      productId,
      timestamp: Date.now()
    })
  ).toString("base64");

  // Generate CSRF state token
  // TikTok requires a state parameter for security
  const csrfState = `${state}`;

  // Use basic TikTok OAuth scopes - we only need to verify identity
  // user.info.basic is the minimum scope to verify login
  const scopes = ["user.info.basic"];

  // Build TikTok OAuth URL
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set("redirect_uri", TIKTOK_REDIRECT_URI);
  authUrl.searchParams.set("scope", scopes.join(","));
  authUrl.searchParams.set("state", csrfState);
  authUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(authUrl.toString());
}
