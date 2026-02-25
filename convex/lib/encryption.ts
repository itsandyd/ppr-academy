"use node";

/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 *
 * This file lives in convex/lib/ so it can be imported by Convex "use node"
 * actions. It re-implements the same logic as lib/encryption.ts (used by
 * Next.js API routes) to avoid cross-boundary imports.
 *
 * IMPORTANT: Only usable from "use node" action files — Convex's default
 * runtime does not have Node.js `crypto`.
 *
 * The encryption key MUST be set as the Convex environment variable
 * OAUTH_ENCRYPTION_KEY (set via Convex Dashboard → Settings → Environment Variables).
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION_PREFIX = "v1";

function getKey(): Buffer {
  const raw = process.env.OAUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY environment variable is not set in Convex. " +
        "Set it in Convex Dashboard → Settings → Environment Variables."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `OAUTH_ENCRYPTION_KEY must be exactly 32 bytes (256 bits) when base64-decoded. Got ${key.length} bytes.`
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString("base64"),
    encrypted.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Invalid encrypted token format");
  }

  const [, ivB64, encB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(`${VERSION_PREFIX}:`);
}
