import { NextRequest, NextResponse } from "next/server";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const INSTAGRAM_REDIRECT_URI = `${BASE_URL}/api/follow-gate/instagram/callback`;

/**
 * Instagram OAuth Follow Gate Flow (Hypeddit-style)
 *
 * Since Instagram doesn't have a "follow" API for third-party apps,
 * this flow verifies the user is logged into Instagram via OAuth,
 * then opens the creator's profile page for manual follow.
 *
 * Flow:
 * 1. User clicks "Follow on Instagram" button
 * 2. User is redirected to Instagram/Facebook OAuth to verify identity
 * 3. After auth, we redirect them to the creator's Instagram profile
 * 4. User manually clicks follow on Instagram
 * 5. User returns to our page and confirms they followed
 *
 * GET /api/follow-gate/instagram?profileUrl=xxx&returnUrl=xxx&productId=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const profileUrl = searchParams.get("profileUrl");
  const returnUrl = searchParams.get("returnUrl");
  const productId = searchParams.get("productId");

  if (!profileUrl) {
    return NextResponse.json({ error: "Instagram profile URL is required" }, { status: 400 });
  }

  if (!FACEBOOK_APP_ID) {
    // Return JSON error for API calls, redirect for browser requests
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json(
        { error: "Instagram OAuth not configured. Please add FACEBOOK_APP_ID to environment variables." },
        { status: 500 }
      );
    }
    // Redirect back with error
    const errorUrl = new URL(returnUrl || BASE_URL);
    errorUrl.searchParams.set("instagramError", "Instagram OAuth not configured");
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

  // Use basic Instagram/Facebook OAuth scopes - we only need to verify identity
  // We don't need any special permissions since we can't follow programmatically anyway
  // Note: public_profile is implicit, email is needed for OAuth dialog to work
  const scopes = ["email"];

  // Build Facebook OAuth URL
  // Using Facebook OAuth because Instagram Basic Display API is deprecated
  // and Instagram uses Facebook's OAuth infrastructure
  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
  authUrl.searchParams.set("redirect_uri", INSTAGRAM_REDIRECT_URI);
  authUrl.searchParams.set("scope", scopes.join(","));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(authUrl.toString());
}
