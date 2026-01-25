import { NextRequest, NextResponse } from "next/server";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TIKTOK_REDIRECT_URI = `${BASE_URL}/api/follow-gate/tiktok/callback`;

interface StateData {
  profileUrl: string;
  returnUrl: string;
  productId?: string;
  timestamp: number;
}

/**
 * Handle TikTok OAuth callback for follow gate
 *
 * This callback:
 * 1. Verifies the OAuth was successful (user is logged in)
 * 2. Returns an HTML page that:
 *    - Opens the TikTok profile in a new tab
 *    - Shows a countdown/confirmation UI
 *    - Redirects back to the product page with success status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Parse state to get original params
  let stateData: StateData | null = null;

  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    }
  } catch {
    return createRedirect(BASE_URL, {
      tiktokError: "Invalid state parameter",
      platform: "tiktok",
    });
  }

  const returnUrl = stateData?.returnUrl || BASE_URL;

  // Handle user cancellation or error
  if (error) {
    const errorMessage = error === "access_denied"
      ? "Authorization cancelled"
      : errorDescription || `TikTok error: ${error}`;
    return createRedirect(returnUrl, {
      tiktokError: errorMessage,
      platform: "tiktok",
    });
  }

  if (!code) {
    return createRedirect(returnUrl, {
      tiktokError: "No authorization code received",
      platform: "tiktok",
    });
  }

  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    return createRedirect(returnUrl, {
      tiktokError: "TikTok OAuth not configured",
      platform: "tiktok",
    });
  }

  // Verify state is not too old (max 10 minutes)
  if (stateData && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    return createRedirect(returnUrl, {
      tiktokError: "Authorization session expired. Please try again.",
      platform: "tiktok",
    });
  }

  try {
    // Exchange code for access token to verify the OAuth was successful
    // We don't actually need the token for anything since we can't follow via API
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("TikTok token error:", errorData);
      return createRedirect(returnUrl, {
        tiktokError: "Failed to verify TikTok login",
        platform: "tiktok",
      });
    }

    const tokenData = await tokenResponse.json();

    // TikTok returns error in the response body even with 200 status
    if (tokenData.error) {
      console.error("TikTok token error:", tokenData.error, tokenData.error_description);
      return createRedirect(returnUrl, {
        tiktokError: tokenData.error_description || "Failed to verify TikTok login",
        platform: "tiktok",
      });
    }

    // OAuth verified successfully!
    // Now we'll return an HTML page that opens the TikTok profile
    // and shows a nice UI before redirecting back

    const profileUrl = stateData?.profileUrl;
    if (!profileUrl) {
      return createRedirect(returnUrl, {
        tiktokError: "Missing profile URL",
        platform: "tiktok",
      });
    }

    // Build the return URL with success params
    const successUrl = new URL(returnUrl);
    successUrl.searchParams.set("tiktokVerified", "true");
    successUrl.searchParams.set("platform", "tiktok");
    if (stateData?.productId) {
      successUrl.searchParams.set("productId", stateData.productId);
    }

    // Return an HTML page that opens TikTok and guides the user
    return new NextResponse(
      generateFollowPage(profileUrl, successUrl.toString()),
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (err) {
    console.error("TikTok OAuth error:", err);
    return createRedirect(returnUrl, {
      tiktokError: "An error occurred during TikTok verification",
      platform: "tiktok",
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
 * 1. Opens the TikTok profile in a new tab
 * 2. Shows a nice UI with countdown
 * 3. Redirects back to the product page
 */
function generateFollowPage(profileUrl: string, returnUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow on TikTok</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #00f2ea 0%, #ff0050 50%, #000000 100%);
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
      background: #000000;
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
      color: #ff0050;
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
      background: linear-gradient(90deg, #00f2ea, #ff0050);
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
      background: #000000;
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
    <!-- Step 1: Opening TikTok -->
    <div class="step active" id="step1">
      <div class="icon">
        <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
      </div>
      <h1>Opening TikTok...</h1>
      <p>We're opening the TikTok profile in a new tab. Please follow the creator to unlock your download!</p>
      <div class="countdown" id="countdown">5</div>
      <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
      <div class="buttons">
        <a href="${profileUrl}" target="_blank" class="btn btn-primary" id="openBtn">Open TikTok Again</a>
      </div>
    </div>

    <!-- Step 2: Confirm follow -->
    <div class="step" id="step2">
      <div class="checkmark">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <h1>Did you follow?</h1>
      <p>If you've followed the creator on TikTok, click the button below to unlock your download!</p>
      <div class="buttons">
        <a href="${profileUrl}" target="_blank" class="btn btn-secondary">Open TikTok Again</a>
        <button class="btn btn-primary" id="confirmBtn">I've Followed!</button>
      </div>
    </div>
  </div>

  <script>
    // Open TikTok profile immediately
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
