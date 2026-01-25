import { NextRequest, NextResponse } from "next/server";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const INSTAGRAM_REDIRECT_URI = `${BASE_URL}/api/follow-gate/instagram/callback`;

interface StateData {
  profileUrl: string;
  returnUrl: string;
  productId?: string;
  timestamp: number;
}

/**
 * Handle Instagram OAuth callback for follow gate
 *
 * This callback:
 * 1. Verifies the OAuth was successful (user is logged in)
 * 2. Returns an HTML page that:
 *    - Opens the Instagram profile in a new tab
 *    - Shows a countdown/confirmation UI
 *    - Redirects back to the product page with success status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  // Parse state to get original params
  let stateData: StateData | null = null;

  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    }
  } catch {
    return createRedirect(BASE_URL, {
      instagramError: "Invalid state parameter",
      platform: "instagram",
    });
  }

  const returnUrl = stateData?.returnUrl || BASE_URL;

  // Handle user cancellation or error
  if (error) {
    const errorMessage = errorReason === "user_denied"
      ? "Authorization cancelled"
      : `Instagram error: ${error}`;
    return createRedirect(returnUrl, {
      instagramError: errorMessage,
      platform: "instagram",
    });
  }

  if (!code) {
    return createRedirect(returnUrl, {
      instagramError: "No authorization code received",
      platform: "instagram",
    });
  }

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return createRedirect(returnUrl, {
      instagramError: "Instagram OAuth not configured",
      platform: "instagram",
    });
  }

  // Verify state is not too old (max 10 minutes)
  if (stateData && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    return createRedirect(returnUrl, {
      instagramError: "Authorization session expired. Please try again.",
      platform: "instagram",
    });
  }

  try {
    // Exchange code for access token to verify the OAuth was successful
    // We don't actually need the token for anything since we can't follow via API
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&code=${code}`,
      { method: "GET" }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Instagram token error:", errorData);
      return createRedirect(returnUrl, {
        instagramError: "Failed to verify Instagram login",
        platform: "instagram",
      });
    }

    // OAuth verified successfully!
    // Now we'll return an HTML page that opens the Instagram profile
    // and shows a nice UI before redirecting back

    const profileUrl = stateData?.profileUrl;
    if (!profileUrl) {
      return createRedirect(returnUrl, {
        instagramError: "Missing profile URL",
        platform: "instagram",
      });
    }

    // Build the return URL with success params
    const successUrl = new URL(returnUrl);
    successUrl.searchParams.set("instagramVerified", "true");
    successUrl.searchParams.set("platform", "instagram");
    if (stateData?.productId) {
      successUrl.searchParams.set("productId", stateData.productId);
    }

    // Return an HTML page that opens Instagram and guides the user
    return new NextResponse(
      generateFollowPage(profileUrl, successUrl.toString()),
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return createRedirect(returnUrl, {
      instagramError: "An error occurred during Instagram verification",
      platform: "instagram",
    });
  }
}

function createRedirect(
  baseUrl: string,
  params: Record<string, string | undefined>
): NextResponse {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(url.toString());
}

/**
 * Generate an HTML page that:
 * 1. Opens the Instagram profile in a new tab
 * 2. Shows a nice UI with countdown
 * 3. Redirects back to the product page
 */
function generateFollowPage(profileUrl: string, returnUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow on Instagram</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 40px; height: 40px; fill: white; }
    h1 { font-size: 24px; color: #333; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; margin-bottom: 24px; }
    .countdown {
      font-size: 48px;
      font-weight: bold;
      color: #833ab4;
      margin-bottom: 24px;
    }
    .progress {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #833ab4, #fd1d1d);
      width: 0%;
      transition: width 1s linear;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-primary {
      background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 100%);
      color: white;
      margin-right: 10px;
    }
    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }
    .buttons { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .step { display: none; }
    .step.active { display: block; }
    .checkmark {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.3s ease-out;
    }
    .checkmark svg { width: 40px; height: 40px; fill: white; }
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="card">
    <!-- Step 1: Opening Instagram -->
    <div class="step active" id="step1">
      <div class="icon">
        <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </div>
      <h1>Opening Instagram...</h1>
      <p>We're opening the Instagram profile in a new tab. Please follow the creator to unlock your download!</p>
      <div class="countdown" id="countdown">5</div>
      <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
      <div class="buttons">
        <a href="${profileUrl}" target="_blank" class="btn btn-primary" id="openBtn">Open Instagram Again</a>
      </div>
    </div>

    <!-- Step 2: Confirm follow -->
    <div class="step" id="step2">
      <div class="checkmark">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <h1>Did you follow?</h1>
      <p>If you've followed the creator on Instagram, click the button below to unlock your download!</p>
      <div class="buttons">
        <a href="${profileUrl}" target="_blank" class="btn btn-secondary">Open Instagram Again</a>
        <button class="btn btn-primary" id="confirmBtn">I've Followed!</button>
      </div>
    </div>
  </div>

  <script>
    // Open Instagram profile immediately
    window.open('${profileUrl}', '_blank');

    // Countdown timer
    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    const progressBar = document.getElementById('progressBar');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const confirmBtn = document.getElementById('confirmBtn');

    const interval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      progressBar.style.width = ((5 - seconds) / 5 * 100) + '%';

      if (seconds <= 0) {
        clearInterval(interval);
        step1.classList.remove('active');
        step2.classList.add('active');
      }
    }, 1000);

    // Confirm button - redirect back
    confirmBtn.addEventListener('click', () => {
      window.location.href = '${returnUrl}';
    });
  </script>
</body>
</html>`;
}
