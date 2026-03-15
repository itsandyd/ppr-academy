import crypto from "crypto";

/**
 * Unsubscribe Token Utility
 *
 * Creates secure, signed tokens for one-click email unsubscribe links.
 * Uses HMAC-SHA256 for signing - no external JWT library needed.
 *
 * Token format (v1 - legacy, global): base64url(email).base64url(signature)
 * Token format (v2 - per-creator):    base64url(email).base64url(storeId).base64url(signature)
 *
 * v2 tokens sign over "email|storeId" so the storeId can't be tampered with.
 * v1 tokens are still verified for backwards compatibility (global unsubscribe).
 */

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";

/**
 * Generate a secure unsubscribe token for an email address.
 * If storeId is provided, generates a v2 per-creator token.
 */
export function generateUnsubscribeToken(email: string, storeId?: string): string {
  if (storeId) {
    const emailBase64 = Buffer.from(email).toString("base64url");
    const storeBase64 = Buffer.from(storeId).toString("base64url");
    const signature = crypto
      .createHmac("sha256", UNSUBSCRIBE_SECRET)
      .update(`${email}|${storeId}`)
      .digest("base64url");
    return `${emailBase64}.${storeBase64}.${signature}`;
  }

  // v1 legacy: global unsubscribe
  const emailBase64 = Buffer.from(email).toString("base64url");
  const signature = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email)
    .digest("base64url");

  return `${emailBase64}.${signature}`;
}

/**
 * Verify and decode an unsubscribe token.
 * Returns { email, storeId? } if valid, null if invalid.
 * Handles both v1 (2-part) and v2 (3-part) tokens.
 */
export function verifyUnsubscribeToken(
  token: string
): { email: string; storeId?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2 && parts.length !== 3) return null;

    if (parts.length === 3) {
      // v2 per-creator token
      const [emailBase64, storeBase64, providedSignature] = parts;
      const email = Buffer.from(emailBase64, "base64url").toString("utf-8");
      const storeId = Buffer.from(storeBase64, "base64url").toString("utf-8");

      const expectedSignature = crypto
        .createHmac("sha256", UNSUBSCRIBE_SECRET)
        .update(`${email}|${storeId}`)
        .digest("base64url");

      if (
        providedSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(
          Buffer.from(providedSignature),
          Buffer.from(expectedSignature)
        )
      ) {
        return null;
      }

      return { email, storeId };
    }

    // v1 legacy global token
    const [emailBase64, providedSignature] = parts;
    const email = Buffer.from(emailBase64, "base64url").toString("utf-8");

    const expectedSignature = crypto
      .createHmac("sha256", UNSUBSCRIBE_SECRET)
      .update(email)
      .digest("base64url");

    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    return { email };
  } catch (error) {
    console.error("[Unsubscribe] Token verification error:", error);
    return null;
  }
}

/**
 * Generate a full unsubscribe URL for an email.
 * If storeId is provided, generates a per-creator unsubscribe link.
 */
export function generateUnsubscribeUrl(email: string, baseUrl?: string, storeId?: string): string {
  const token = generateUnsubscribeToken(email, storeId);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";
  return `${base}/unsubscribe/${token}`;
}

/**
 * Generate List-Unsubscribe header value (RFC 8058 compliant).
 * The URL points to /api/unsubscribe which handles both GET (browser)
 * and POST with form-encoded body (email client one-click).
 */
export function generateListUnsubscribeHeader(
  email: string,
  baseUrl?: string,
  storeId?: string
): { "List-Unsubscribe": string; "List-Unsubscribe-Post": string } {
  const token = generateUnsubscribeToken(email, storeId);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";
  // RFC 8058: List-Unsubscribe URL must support POST with form body
  const apiUrl = `${base}/api/unsubscribe?token=${token}`;

  return {
    "List-Unsubscribe": `<${apiUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// ─── List-based unsubscribe (for admin outreach, marketing, etc.) ────────────

/**
 * Generate an HMAC token for list-based unsubscribe.
 * Signs over "email|list:listName" to bind the token to both values.
 */
export function generateListUnsubscribeToken(email: string, list: string): string {
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${email}|list:${list}`)
    .digest("base64url");
}

/**
 * Verify a list-based unsubscribe token.
 * Returns true if the token is valid for the given email + list.
 */
export function verifyListUnsubscribeToken(
  email: string,
  list: string,
  token: string
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", UNSUBSCRIBE_SECRET)
      .update(`${email}|list:${list}`)
      .digest("base64url");

    if (token.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Generate a full unsubscribe URL for a specific email list.
 * Format: /unsubscribe?email=...&list=...&token=...
 */
export function generateListUnsubscribeUrl(
  email: string,
  list: string,
  baseUrl?: string
): string {
  const token = generateListUnsubscribeToken(email, list);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&list=${encodeURIComponent(list)}&token=${token}`;
}

/**
 * Generate List-Unsubscribe headers for a specific email list (RFC 8058).
 */
export function generateListUnsubscribeHeaderForList(
  email: string,
  list: string,
  baseUrl?: string
): { "List-Unsubscribe": string; "List-Unsubscribe-Post": string } {
  const url = generateListUnsubscribeUrl(email, list, baseUrl);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
