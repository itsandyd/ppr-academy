import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { ActionCtx, MutationCtx } from "../_generated/server";

/**
 * Rate limiter configuration for PPR Academy.
 * Includes both per-user limits and global system limits.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // ============================================================================
  // PER-USER LIMITS (keyed by userId)
  // ============================================================================

  // AI API calls - expensive services with per-user quotas
  userOpenaiCall: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 10,
  },
  userElevenlabsTTS: {
    kind: "token bucket",
    rate: 5,
    period: MINUTE,
    capacity: 3,
  },
  userFalaiImage: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },
  userTavilySearch: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },

  // Email sending limits
  userEmailSend: {
    kind: "fixed window",
    rate: 50,
    period: HOUR,
  },

  // Social media posting limits
  userBlotatoPost: {
    kind: "fixed window",
    rate: 20,
    period: HOUR,
  },

  // Payment operations
  userStripeOperation: {
    kind: "fixed window",
    rate: 20,
    period: MINUTE,
  },

  // Course generation (resource intensive)
  userCourseGeneration: {
    kind: "fixed window",
    rate: 5,
    period: HOUR,
  },

  // Audio generation (expensive)
  userAudioGeneration: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },

  // ============================================================================
  // GLOBAL SYSTEM LIMITS (for internal/system operations)
  // ============================================================================

  // Global LLM limit for system operations without userId
  systemLLMCall: {
    kind: "token bucket",
    rate: 100,
    period: MINUTE,
    capacity: 30,
  },

  // Global audio generation limit
  systemAudioGeneration: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 10,
  },

  // Global image generation limit
  systemImageGeneration: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 15,
  },
});

// Re-export time constants for convenience
export { MINUTE, HOUR } from "@convex-dev/rate-limiter";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export type RateLimitName = Parameters<typeof rateLimiter.limit>[1];

// Type for rate limit options
type RateLimitOptions = { key?: string; count?: number; reserve?: boolean; throws?: boolean };

/**
 * Check rate limit and throw ConvexError if exceeded.
 * Use this at the beginning of actions/mutations that need rate limiting.
 *
 * @param ctx - Convex action or mutation context
 * @param limitName - Name of the rate limit to check
 * @param key - User ID or other unique key (optional for system limits)
 * @throws ConvexError if rate limit exceeded
 */
export async function checkRateLimit(
  ctx: ActionCtx | MutationCtx,
  limitName: RateLimitName,
  key?: string
): Promise<void> {
  const options: RateLimitOptions = { key: key ?? "system" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ok, retryAfter } = await rateLimiter.limit(ctx, limitName, options as any);

  if (!ok) {
    const retryInSeconds = Math.ceil((retryAfter ?? 60000) / 1000);
    throw new ConvexError({
      code: "RATE_LIMITED",
      message: `Rate limit exceeded for ${limitName}. Please try again in ${retryInSeconds} seconds.`,
      retryAfter: retryInSeconds,
    });
  }
}

/**
 * Check rate limit without throwing - returns status for custom handling.
 *
 * @param ctx - Convex action or mutation context
 * @param limitName - Name of the rate limit to check
 * @param key - User ID or other unique key (optional for system limits)
 * @returns Object with ok (boolean) and retryAfter (milliseconds)
 */
export async function checkRateLimitSoft(
  ctx: ActionCtx | MutationCtx,
  limitName: RateLimitName,
  key?: string
): Promise<{ ok: boolean; retryAfter: number | null }> {
  const options: RateLimitOptions = { key: key ?? "system" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ok, retryAfter } = await rateLimiter.limit(ctx, limitName, options as any);

  return { ok, retryAfter: retryAfter ?? null };
}

/**
 * Check if operation would be rate limited without consuming quota.
 *
 * @param ctx - Convex action or mutation context
 * @param limitName - Name of the rate limit to check
 * @param key - User ID or other unique key (optional for system limits)
 * @returns true if operation would be allowed
 */
export async function wouldBeRateLimited(
  ctx: ActionCtx | MutationCtx,
  limitName: RateLimitName,
  key?: string
): Promise<boolean> {
  const options: RateLimitOptions = { key: key ?? "system" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ok } = await rateLimiter.check(ctx, limitName, options as any);

  return !ok;
}
