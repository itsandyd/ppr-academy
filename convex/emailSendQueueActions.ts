"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  getTransactionalResendClient,
  getMarketingResendClient,
} from "./lib/resendClients";
import {
  getEmailProvider,
  sendBatchViaProvider,
} from "./lib/emailProvider";

type ClaimedEmail = {
  _id: Id<"emailSendQueue">;
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

/**
 * Main send queue processor - round-robin per account, Resend batch API.
 * Called by cron every 30 seconds.
 *
 * EMAIL ROUTING:
 *   TRANSACTIONAL (source="transactional") → RESEND_API_KEY
 *     Purchase confirmations, coaching reminders, legal notices, DM notifications,
 *     support replies, admin alerts. Uses resend.batch.send() via transactional key.
 *
 *   MARKETING (source="workflow"|"drip"|"broadcast") → RESEND_MARKETING_API_KEY
 *     Workflow sequences, drip campaigns, campaign batch sends. Uses
 *     resend.batch.send() via marketing key. These are promotional/nurture
 *     emails that require CAN-SPAM compliance and unsubscribe handling.
 *     Note: One-to-many broadcasts now use the Broadcasts API directly
 *     (resend.broadcasts.create + send) in emails.ts:sendBroadcastEmail,
 *     bypassing this queue entirely.
 *
 * Flow:
 * 1. Get all store IDs with queued emails
 * 2. Round-robin: claim up to EMAILS_PER_STORE from each store
 * 3. Split claimed emails into transactional vs marketing groups
 * 4. Group each into Resend batch API calls (max 100 per batch)
 * 5. Send with rate limiting (max 2 req/s to Resend per client)
 * 6. Mark sent/failed accordingly
 */
export const processEmailSendQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const transactionalResend = getTransactionalResendClient();
    const marketingResend = getMarketingResendClient();

    // Get active stores with queued emails
    const storeIds = await ctx.runQuery(internal.emailSendQueue.getActiveStoreIds, {});

    if (storeIds.length === 0) {
      return null;
    }

    // Round-robin: claim emails from each store fairly
    // With Resend batch API at 2 req/s and 30s cron interval,
    // we can do ~50 batch requests per cycle = 5,000 emails max
    // (leaving headroom below the theoretical 60 req limit)
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

    // Split claimed emails into transactional vs marketing based on source
    const transactionalEmails = allClaimed.filter((e) => e.source === "transactional");
    const marketingEmails = allClaimed.filter((e) => e.source !== "transactional");

    let totalSent = 0;
    let totalFailed = 0;

    // Process transactional emails through transactional Resend client
    const txResult = await sendBatchesWithClient(
      ctx,
      transactionalResend,
      transactionalEmails,
      "transactional"
    );
    totalSent += txResult.sent;
    totalFailed += txResult.failed;

    // Process marketing emails through marketing Resend client
    const mktResult = await sendBatchesWithClient(
      ctx,
      marketingResend,
      marketingEmails,
      "marketing"
    );
    totalSent += mktResult.sent;
    totalFailed += mktResult.failed;

    return null;
  },
});

/**
 * Send a group of emails through a specific Resend client in batches of 100.
 * When EMAIL_PROVIDER=ses, routes through AWS SES instead of Resend.
 */
async function sendBatchesWithClient(
  ctx: any,
  resend: any,
  emails: ClaimedEmail[],
  label: string
): Promise<{ sent: number; failed: number }> {
  if (emails.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const provider = getEmailProvider();
  console.log(`[SendQueue][${label}] EMAIL_PROVIDER=${provider}, batch of ${emails.length}`);
  const BATCH_SIZE = 100;
  const batches: ClaimedEmail[][] = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const emailPayloads = batch.map((email) => ({
      from: `${email.fromName} <${email.fromEmail}>`,
      to: email.toEmail,
      subject: email.subject,
      html: email.htmlContent,
      ...(email.textContent ? { text: email.textContent } : {}),
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      ...(email.headers ? { headers: email.headers } : {}),
    }));

    const batchIds = batch.map((e) => e._id);

    try {
      const result = await sendBatchViaProvider(resend, emailPayloads);

      if (!result.success) {
        console.error(`[SendQueue][${label}][${result.provider}] Batch ${batchIndex + 1}/${batches.length} error:`, result.error);
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
      console.error(`[SendQueue][${label}][${provider}] Batch ${batchIndex + 1}/${batches.length} exception:`, error);

      // Check for rate limit (Resend-specific, but handle generically)
      if (error?.statusCode === 429) {
        const retryAfter = error?.headers?.["retry-after"] || 2;
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

        // Retry this batch once
        try {
          const retryResult = await sendBatchViaProvider(resend, emailPayloads);
          if (!retryResult.success) {
            await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
              emailIds: batchIds,
              error: retryResult.error || "Retry failed",
            });
            totalFailed += batch.length;
          } else {
            await ctx.runMutation(internal.emailSendQueue.markEmailsSent, {
              emailIds: batchIds,
            });
            totalSent += batch.length;
          }
        } catch (retryErr: any) {
          await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
            emailIds: batchIds,
            error: String(retryErr),
          });
          totalFailed += batch.length;
        }
      } else {
        await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
          emailIds: batchIds,
          error: String(error),
        });
        totalFailed += batch.length;
      }
    }

    // Rate limit: stay under 2 req/s to Resend (or SES rate limits)
    // Wait 600ms between batch requests
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return { sent: totalSent, failed: totalFailed };
}
