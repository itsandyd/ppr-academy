import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "../_generated/api";

/**
 * Action retrier for reliable external API calls.
 * Automatically retries failed actions with exponential backoff.
 */
export const retrier = new ActionRetrier(components.actionRetrier, {
  // Initial delay after first failure (500ms)
  initialBackoffMs: 500,
  // Exponential backoff base (delays: 500ms, 1s, 2s, 4s)
  base: 2,
  // Maximum number of retry attempts
  maxFailures: 4,
});

/**
 * Usage example:
 *
 * import { retrier } from "./lib/retrier";
 * import { internal } from "./_generated/api";
 *
 * // In an action or mutation:
 * await retrier.run(ctx, internal.emails.sendEmail, {
 *   to: "user@example.com",
 *   subject: "Hello",
 *   body: "World"
 * });
 *
 * // With completion callback:
 * await retrier.run(
 *   ctx,
 *   internal.stripe.createCharge,
 *   { amount: 1000 },
 *   { onComplete: internal.orders.markPaid }
 * );
 */
