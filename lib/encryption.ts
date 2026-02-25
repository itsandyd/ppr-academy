import crypto from "crypto";

/**
 * AES-256-GCM encryption for OAuth tokens at rest.
 *
 * Usage:
 *   encrypt("plaintext-token")   -> "v1:base64iv:base64ciphertext:base64tag"
 *   decrypt("v1:base64iv:...")   -> "plaintext-token"
 *
 * The encryption key MUST be set as the environment variable OAUTH_ENCRYPTION_KEY.
 * Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * This module is used in Next.js API routes (full Node.js) and imported by
 * Convex "use node" actions via convex/lib/encryption.ts re-export.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag
const VERSION_PREFIX = "v1";

function getKey(): Buffer {
  const raw = process.env.OAUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "OAUTH_ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
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

/**
 * Encrypt a plaintext string.
 * Returns a versioned, self-contained ciphertext string:
 *   "v1:<base64-iv>:<base64-ciphertext>:<base64-authtag>"
 */
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

/**
 * Decrypt a ciphertext string produced by encryptToken().
 * Returns the original plaintext.
 */
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

/**
 * Check whether a string looks like an encrypted token (starts with "v1:").
 * Used to make migration idempotent — skip already-encrypted values.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(`${VERSION_PREFIX}:`);
}
