import crypto from "crypto";

/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 flows.
 *
 * RFC 7636 — prevents authorization code interception attacks by binding the
 * token exchange to the original authorization request via a
 * cryptographically random code verifier and its SHA-256 challenge.
 */

/**
 * Generate a cryptographically random code verifier.
 * RFC 7636 §4.1: 43-128 characters from [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 * base64url encoding of 32 random bytes yields a 43-character string.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Derive the code challenge from a code verifier using SHA-256.
 * RFC 7636 §4.2: BASE64URL(SHA256(code_verifier))
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generate a cryptographically random state parameter for CSRF protection.
 * The state is opaque to the authorization server and returned verbatim on
 * the callback so we can verify the request originated from us.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Platforms that require or support PKCE. */
export const PKCE_PLATFORMS = new Set(["twitter"]);

/** Cookie name used to store the OAuth session between initiation and callback. */
export const OAUTH_SESSION_COOKIE = "oauth_pkce_session";

/** Max age for the OAuth session cookie (10 minutes). */
export const OAUTH_SESSION_MAX_AGE = 600;
