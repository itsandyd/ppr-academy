/**
 * Rate Limiting Utilities
 * Provides rate limiting functionality using Upstash Redis
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Check if Upstash is configured
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Different rate limiters for different routes
// Returns null for each limiter if Redis is not configured
export const rateLimiters = {
  // Strict limit for expensive operations (payment, AI generation)
  strict: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
        analytics: true,
      })
    : null,

  // Standard limit for API routes
  standard: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
        analytics: true,
      })
    : null,

  // Generous limit for reads
  generous: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
        analytics: true,
      })
    : null,
};

/**
 * Rate limit check helper
 * Returns a 429 response if rate limit exceeded
 * Gracefully allows requests through if rate limiting is unavailable
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null = rateLimiters.standard
) {
  // If rate limiting is not configured, allow the request
  if (!limiter) {

    return { success: true, remaining: 999, limit: 999 };
  }

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          limit,
          remaining: 0,
          reset: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetDate.toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return { success: true, remaining, limit };
  } catch (error) {
    // If rate limiting fails (network error, etc.), allow the request
    console.error("⚠️ Rate limiting error - allowing request:", error);
    return { success: true, remaining: 999, limit: 999 };
  }
}

/**
 * Get identifier for rate limiting
 * Uses user ID if available, otherwise IP address
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from various possible headers
  const ip = 
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  
  return `ip:${ip}`;
}

