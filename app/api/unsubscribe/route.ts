import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Extracts the token from a request. Checks (in order):
 * 1. ?token= query parameter (used by List-Unsubscribe header URLs)
 * 2. JSON body { token } (used by the unsubscribe page)
 *
 * For RFC 8058 one-click unsubscribe, email clients POST
 * application/x-www-form-urlencoded with body "List-Unsubscribe=One-Click"
 * to the List-Unsubscribe URL, which already contains ?token=...
 */
function getTokenFromUrl(req: NextRequest): string | null {
  return new URL(req.url).searchParams.get("token");
}

function maskEmail(email: string): string {
  return email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
}

/**
 * POST /api/unsubscribe
 *
 * Handles two scenarios:
 * 1. RFC 8058 one-click: email client POSTs form-encoded "List-Unsubscribe=One-Click"
 *    to the URL from the List-Unsubscribe header (token is in the query string).
 * 2. Browser: the unsubscribe page POSTs JSON { token, scope? } where scope is
 *    "creator" (unsubscribe from one creator) or "all" (global unsubscribe).
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let token: string | null = getTokenFromUrl(req);
    let scope: "creator" | "all" = "creator"; // default: per-creator if storeId present

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // RFC 8058 one-click unsubscribe from email client.
      // Token is in the query string; body is "List-Unsubscribe=One-Click".
      // Scope defaults to per-creator (if token has storeId), falling back to global.
      if (!token) {
        return NextResponse.json(
          { success: false, error: "invalid_token", message: "No token provided" },
          { status: 400 }
        );
      }
    } else {
      // JSON body from our unsubscribe page
      try {
        const body = await req.json();
        token = token || body.token;
        if (body.scope === "all") {
          scope = "all";
        }
      } catch {
        // Body might be empty (some email clients POST with no body)
        // Token should already be in the query string
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "invalid_token", message: "No token provided" },
        { status: 400 }
      );
    }

    const verified = verifyUnsubscribeToken(token);

    if (!verified) {
      return NextResponse.json(
        { success: false, error: "invalid_token", message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const { email, storeId } = verified;

    // If user chose "all" or token is v1 (no storeId), do global unsubscribe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailUnsubscribeApi: any = api.emailUnsubscribe;

    if (scope === "all" || !storeId) {
      const result = await fetchMutation(emailUnsubscribeApi.unsubscribeByEmail, {
        email,
        reason: storeId
          ? "One-click unsubscribe (all creators)"
          : "One-click unsubscribe from email link",
      });

      return NextResponse.json({
        success: result.success,
        email: maskEmail(email),
        scope: "all",
        message: result.message,
      });
    }

    // Per-creator unsubscribe
    const result = await fetchMutation(emailUnsubscribeApi.unsubscribeByEmailForStore, {
      email,
      storeId,
      reason: "One-click unsubscribe from creator email",
    });

    return NextResponse.json({
      success: result.success,
      email: maskEmail(email),
      storeId,
      scope: "creator",
      message: result.message,
    });
  } catch (error: unknown) {
    console.error("[Unsubscribe API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process unsubscribe request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/unsubscribe
 *
 * Token validation endpoint. Used by the unsubscribe page to verify a token
 * before showing the confirmation UI.
 * Also serves as a fallback for email clients that GET instead of POST.
 */
export async function GET(req: NextRequest) {
  const token = getTokenFromUrl(req);

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const verified = verifyUnsubscribeToken(token);

  if (!verified) {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    email: maskEmail(verified.email),
    storeId: verified.storeId || null,
  });
}
