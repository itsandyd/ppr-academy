import { Resend } from "resend";

/**
 * Dual Resend client factory for transactional vs marketing email routing.
 *
 * TRANSACTIONAL (RESEND_API_KEY): purchase confirmations, reminders, legal,
 *   coaching, DM notifications, support replies, admin notifications.
 *   Uses resend.emails.send() — the standard transactional endpoint.
 *
 * MARKETING (RESEND_MARKETING_API_KEY): workflow sequences, drip campaigns,
 *   broadcasts, campaign batch sends. Falls back to transactional key if
 *   the marketing key is not configured (graceful migration).
 *   Uses resend.emails.send() for personalized sequences (workflows, drips).
 *   Uses resend.broadcasts.create() + .send() for one-to-many broadcasts.
 *   Uses resend.contacts.create() for contact management in audiences.
 *
 * AUDIENCE (RESEND_MARKETING_AUDIENCE_ID): The default audience/segment ID
 *   for the main subscriber list in the Resend marketing plan. Contacts are
 *   synced here for broadcasts and segmentation.
 */

let _transactionalClient: Resend | null = null;
let _marketingClient: Resend | null = null;

export function getTransactionalResendClient(): Resend {
  if (!_transactionalClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY not configured");
    }
    _transactionalClient = new Resend(key);
  }
  return _transactionalClient;
}

export function getMarketingResendClient(): Resend {
  if (!_marketingClient) {
    const key = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("Neither RESEND_MARKETING_API_KEY nor RESEND_API_KEY is configured");
    }
    _marketingClient = new Resend(key);
  }
  return _marketingClient;
}

/**
 * Get the default marketing audience/segment ID.
 * This is the audience all subscribers are synced to for broadcasts.
 */
export function getMarketingAudienceId(): string {
  const id = process.env.RESEND_MARKETING_AUDIENCE_ID;
  if (!id) {
    throw new Error("RESEND_MARKETING_AUDIENCE_ID not configured");
  }
  return id;
}

/**
 * Ensure a contact exists in the marketing audience before sending.
 * Creates the contact if it doesn't exist, silently ignores 409 (already exists).
 * Returns true if contact is ready (exists or was created), false on failure.
 */
export async function ensureMarketingContact(
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<boolean> {
  if (!process.env.RESEND_MARKETING_API_KEY || !process.env.RESEND_MARKETING_AUDIENCE_ID) {
    // Marketing not configured — skip contact creation (graceful degradation)
    return true;
  }

  try {
    const resend = getMarketingResendClient();
    const audienceId = getMarketingAudienceId();

    await resend.contacts.create({
      audienceId,
      email,
      firstName,
      lastName,
      unsubscribed: false,
    });
    return true;
  } catch (error: any) {
    // 409 = contact already exists, which is fine
    if (error?.statusCode === 409) {
      return true;
    }
    console.error(`[ResendClients] Failed to ensure contact ${email}:`, error);
    return false;
  }
}
