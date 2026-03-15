import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken, verifyListUnsubscribeToken } from "@/lib/unsubscribe";
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

// Map list names to human-readable labels
const LIST_LABELS: Record<string, string> = {
  "creator-outreach": "creator updates",
  "marketing": "marketing emails",
};

/**
 * POST /api/unsubscribe
 *
 * Handles three scenarios:
 * 1. RFC 8058 one-click: email client POSTs form-encoded "List-Unsubscribe=One-Click"
 *    to the URL from the List-Unsubscribe header (token is in the query string).
 * 2. Browser: the unsubscribe page POSTs JSON { token, scope? } where scope is
 *    "creator" (unsubscribe from one creator) or "all" (global unsubscribe).
 * 3. List-based: query params include email + list + token for per-list unsubscribe.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const contentType = req.headers.get("content-type") || "";

    // Check for list-based unsubscribe (email + list + token as query params)
    const listEmail = url.searchParams.get("email");
    const list = url.searchParams.get("list");
    const listToken = url.searchParams.get("token");

    if (listEmail && list && listToken) {
      // List-based unsubscribe (from outreach emails)
      const email = listEmail.toLowerCase().trim();

      if (!verifyListUnsubscribeToken(email, list, listToken)) {
        return NextResponse.json(
          { success: false, error: "invalid_token", message: "Invalid or expired token" },
          { status: 400 }
        );
      }

      // Check if this is a "unsubscribe from all" request from the page
      let scope: "list" | "all" = "list";
      if (!contentType.includes("application/x-www-form-urlencoded")) {
        try {
          const body = await req.json();
          if (body.scope === "all") {
            scope = "all";
          }
        } catch {
          // Body might be empty (RFC 8058 one-click)
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailUnsubscribeApi: any = api.emailUnsubscribe;

      if (scope === "all") {
        const result = await fetchMutation(emailUnsubscribeApi.unsubscribeFromAllLists, {
          email,
          reason: "Unsubscribed from all lists via email link",
        });
        return NextResponse.json({
          success: result.success,
          email: maskEmail(email),
          list,
          scope: "all",
          message: result.message,
        });
      }

      const result = await fetchMutation(emailUnsubscribeApi.unsubscribeFromList, {
        email,
        list,
        reason: "One-click unsubscribe from email link",
      });

      return NextResponse.json({
        success: result.success,
        email: maskEmail(email),
        list,
        scope: "list",
        listLabel: LIST_LABELS[list] || list,
        message: result.message,
      });
    }

    // Existing token-based unsubscribe (v1/v2 tokens)
    let token: string | null = getTokenFromUrl(req);
    let scope: "creator" | "all" = "creator";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: "invalid_token", message: "No token provided" },
          { status: 400 }
        );
      }
    } else {
      try {
        const body = await req.json();
        token = token || body.token;
        if (body.scope === "all") {
          scope = "all";
        }
      } catch {
        // Body might be empty
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
 *
 * Supports both:
 * - Legacy token-in-path: ?token=...
 * - List-based: ?email=...&list=...&token=...
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Check for list-based unsubscribe
  const listEmail = url.searchParams.get("email");
  const list = url.searchParams.get("list");
  const listToken = url.searchParams.get("token");

  if (listEmail && list && listToken) {
    const email = listEmail.toLowerCase().trim();
    const valid = verifyListUnsubscribeToken(email, list, listToken);

    if (!valid) {
      return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: maskEmail(email),
      list,
      listLabel: LIST_LABELS[list] || list,
    });
  }

  // Legacy token-based verification
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
