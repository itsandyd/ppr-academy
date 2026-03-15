/**
 * Legacy stub — Resend has been fully replaced by AWS SES.
 *
 * These no-op functions exist because some files still reference them
 * (e.g., marketing contact sync). All email sending goes through
 * emailProvider.ts → sesClient.ts now.
 */

/**
 * No-op: marketing contact management is handled in Convex DB only.
 * Returns true so callers don't need to change their control flow.
 */
export async function ensureMarketingContact(
  _email: string,
  _firstName?: string,
  _lastName?: string,
): Promise<boolean> {
  return true;
}
