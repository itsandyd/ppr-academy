"use node";

import crypto from "crypto";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  sendBatchViaProvider,
} from "./lib/emailProvider";

type ClaimedEmail = {
  _id: Id<"emailSendQueue">;
  storeId: string;
  source: "workflow" | "drip" | "broadcast" | "transactional";
  toEmail: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  headers?: any;
};

// ─── Unsubscribe URL generation (HMAC-SHA256 signed) ─────────────────────────

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";

function generateListUnsubscribeToken(email: string, list: string): string {
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${email}|list:${list}`)
    .digest("base64url");
}

function generateListUnsubscribeUrl(email: string, list: string): string {
  const token = generateListUnsubscribeToken(email, list);
  const baseUrl = process.env.SITE_URL || "https://pauseplayrepeat.com";
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&list=${encodeURIComponent(list)}&token=${token}`;
}

/**
 * Inject unsubscribe URL and headers for admin outreach emails.
 * Replaces %%UNSUBSCRIBE_URL%% placeholder in HTML and text content,
 * and adds List-Unsubscribe headers for RFC 8058 / Gmail compliance.
 */
function injectUnsubscribeForOutreach(email: ClaimedEmail): {
  htmlContent: string;
  textContent?: string;
  headers: Record<string, string>;
} {
  const unsubscribeUrl = generateListUnsubscribeUrl(email.toEmail, "creator-outreach");

  const htmlContent = email.htmlContent.replace(/%%UNSUBSCRIBE_URL%%/g, unsubscribeUrl);
  const textContent = email.textContent?.replace(/%%UNSUBSCRIBE_URL%%/g, unsubscribeUrl);
  const headers = {
    ...(email.headers || {}),
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  return { htmlContent, textContent, headers };
}

/**
 * Main send queue processor — AWS SES batch sends.
 * Called by cron every 30 seconds.
 *
 * Flow:
 * 1. Get all store IDs with queued emails
 * 2. Round-robin: claim up to EMAILS_PER_STORE from each store
 * 3. Group into batch API calls (max 100 per batch)
 * 4. Send via AWS SES with rate limiting
 * 5. Mark sent/failed accordingly
 */
export const processEmailSendQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get active stores with queued emails
    const storeIds = await ctx.runQuery(internal.emailSendQueue.getActiveStoreIds, {});

    if (storeIds.length === 0) {
      return null;
    }

    // Round-robin: claim emails from each store fairly
    // Distribute fairly across stores
    const EMAILS_PER_STORE = Math.min(
      200, // Cap per store per cycle
      Math.floor(5000 / storeIds.length) // Fair share
    );

    const allClaimed: ClaimedEmail[] = [];

    // Claim from each store in round-robin (two-step: query IDs, then claim by ID)
    // Splitting into query + mutation avoids OCC conflicts with enqueueEmail,
    // because the query doesn't take a read lock on the index range.
    for (const storeId of storeIds) {
      try {
        const emailIds = await ctx.runQuery(internal.emailSendQueue.getQueuedEmailIds, {
          storeId,
          limit: EMAILS_PER_STORE,
        });
        if (emailIds.length === 0) continue;

        const claimed = await ctx.runMutation(internal.emailSendQueue.claimBatchForStore, {
          emailIds,
        });
        allClaimed.push(...claimed);
      } catch (error) {
        console.error(`[SendQueue] Failed to claim batch for store ${storeId}:`, error);
      }
    }

    if (allClaimed.length === 0) {
      return null;
    }

    // Send all claimed emails via SES
    const result = await sendBatchesWithClient(
      ctx,
      allClaimed,
      "ses"
    );
    const totalSent = result.sent;

    return null;
  },
});

/**
 * Send a group of emails via AWS SES in batches of 100.
 */
async function sendBatchesWithClient(
  ctx: any,
  emails: ClaimedEmail[],
  label: string
): Promise<{ sent: number; failed: number }> {
  if (emails.length === 0) {
    return { sent: 0, failed: 0 };
  }

  console.log(`[SendQueue][${label}] SES batch of ${emails.length}`);
  const BATCH_SIZE = 100;
  const batches: ClaimedEmail[][] = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const emailPayloads = batch.map((email) => {
      // For admin outreach emails, inject signed unsubscribe URL and headers
      const isAdminOutreach =
        email.storeId === "admin" &&
        (email.htmlContent?.includes("%%UNSUBSCRIBE_URL%%") ||
          email.textContent?.includes("%%UNSUBSCRIBE_URL%%"));

      if (isAdminOutreach) {
        const { htmlContent, textContent, headers } = injectUnsubscribeForOutreach(email);
        return {
          from: `${email.fromName} <${email.fromEmail}>`,
          to: email.toEmail,
          subject: email.subject,
          ...(htmlContent ? { html: htmlContent } : {}),
          ...(textContent ? { text: textContent } : {}),
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
          headers,
        };
      }

      return {
        from: `${email.fromName} <${email.fromEmail}>`,
        to: email.toEmail,
        subject: email.subject,
        ...(email.htmlContent ? { html: email.htmlContent } : {}),
        ...(email.textContent ? { text: email.textContent } : {}),
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        ...(email.headers ? { headers: email.headers } : {}),
      };
    });

    const batchIds = batch.map((e) => e._id);

    try {
      const result = await sendBatchViaProvider(emailPayloads);

      if (!result.success) {
        console.error(`[SendQueue][${label}][SES] Batch ${batchIndex + 1}/${batches.length} error:`, result.error);
        await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
          emailIds: batchIds,
          error: result.error || "Unknown error",
        });
        totalFailed += batch.length;
      } else {
        await ctx.runMutation(internal.emailSendQueue.markEmailsSent, {
          emailIds: batchIds,
        });
        totalSent += batch.length;
      }
    } catch (error: any) {
      console.error(`[SendQueue][${label}][SES] Batch ${batchIndex + 1}/${batches.length} exception:`, error);
      await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
        emailIds: batchIds,
        error: String(error),
      });
      totalFailed += batch.length;
    }

    // Rate limit: stay under SES rate limits
    // Wait 600ms between batch requests
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return { sent: totalSent, failed: totalFailed };
}
