/**
 * UTM Parameter Capture & Storage
 *
 * Stores UTM params in a cookie so they survive across pages and are
 * automatically sent with same-origin fetch requests to API routes.
 *
 * "Last touch" attribution — new UTM params overwrite old ones.
 */

const UTM_COOKIE_NAME = "ppr_utm";
const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

// ---------------------------------------------------------------------------
// Client-side helpers (browser only)
// ---------------------------------------------------------------------------

/**
 * Reads UTM params from the current URL. Returns null if none are present.
 */
function getUtmFromUrl(): UtmParams | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  let found = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
      found = true;
    }
  }

  return found ? utm : null;
}

/**
 * Captures UTM params from the current URL and stores them in a cookie.
 * Only writes the cookie when at least one utm_* param is present.
 * Uses "last touch" — new params fully replace old ones.
 */
export function captureUtmParams(): void {
  const utm = getUtmFromUrl();
  if (!utm) return;

  document.cookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(utm))}; path=/; max-age=${UTM_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Reads the stored UTM cookie from the browser.
 * Returns the parsed UTM object or null if no cookie exists.
 */
export function getUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${UTM_COOKIE_NAME}=`));

  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

/**
 * Deletes the UTM cookie.
 */
export function clearUtmParams(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${UTM_COOKIE_NAME}=; path=/; max-age=0`;
}

// ---------------------------------------------------------------------------
// Server-side helper (API routes / server components)
// ---------------------------------------------------------------------------

/**
 * Reads UTM params from a NextRequest's cookies (for use in API route handlers).
 *
 * Usage in an API route:
 *   import { getUtmParamsFromRequest } from "@/lib/utm";
 *   const utm = getUtmParamsFromRequest(request);
 */
export function getUtmParamsFromRequest(
  request: { cookies: { get: (name: string) => { value: string } | undefined } }
): UtmParams | null {
  const cookie = request.cookies.get(UTM_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.value));
  } catch {
    return null;
  }
}

/**
 * Reads UTM params from the Next.js cookies() async function (server components / route handlers).
 *
 * Usage:
 *   import { cookies } from "next/headers";
 *   import { getUtmParamsFromCookies } from "@/lib/utm";
 *   const cookieStore = await cookies();
 *   const utm = getUtmParamsFromCookies(cookieStore);
 */
export function getUtmParamsFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): UtmParams | null {
  const cookie = cookieStore.get(UTM_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.value));
  } catch {
    return null;
  }
}
