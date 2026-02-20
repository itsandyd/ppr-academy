import crypto from "crypto";

/**
 * Unsubscribe Token Utility
 *
 * Creates secure, signed tokens for one-click email unsubscribe links.
 * Uses HMAC-SHA256 for signing - no external JWT library needed.
 *
 * Token format: base64url(email):base64url(signature)
 */

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";

/**
 * Generate a secure unsubscribe token for an email address
 */
export function generateUnsubscribeToken(email: string): string {
  const emailBase64 = Buffer.from(email).toString("base64url");
  const signature = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email)
    .digest("base64url");

  return `${emailBase64}.${signature}`;
}

/**
 * Verify and decode an unsubscribe token
 * Returns the email if valid, null if invalid
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [emailBase64, providedSignature] = parts;
    const email = Buffer.from(emailBase64, "base64url").toString("utf-8");

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", UNSUBSCRIBE_SECRET)
      .update(email)
      .digest("base64url");

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return null;
    }

    return email;
  } catch (error) {
    console.error("[Unsubscribe] Token verification error:", error);
    return null;
  }
}

/**
 * Generate a full unsubscribe URL for an email
 */
export function generateUnsubscribeUrl(email: string, baseUrl?: string): string {
  const token = generateUnsubscribeToken(email);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";
  return `${base}/unsubscribe/${token}`;
}

/**
 * Generate List-Unsubscribe header value
 * Includes both mailto and https options for maximum compatibility
 */
export function generateListUnsubscribeHeader(
  email: string,
  baseUrl?: string
): { "List-Unsubscribe": string; "List-Unsubscribe-Post": string } {
  const unsubscribeUrl = generateUnsubscribeUrl(email, baseUrl);

  return {
    // RFC 8058 compliant - one-click unsubscribe
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
