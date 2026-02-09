"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Main send queue processor - round-robin per account, Resend batch API.
 * Called by cron every 30 seconds.
 *
 * Flow:
 * 1. Get all store IDs with queued emails
 * 2. Round-robin: claim up to EMAILS_PER_STORE from each store
 * 3. Group into Resend batch API calls (max 100 per batch)
 * 4. Send with rate limiting (max 2 req/s to Resend)
 * 5. Mark sent/failed accordingly
 */
export const processEmailSendQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get active stores with queued emails
    const storeIds = await ctx.runQuery(internal.emailSendQueue.getActiveStoreIds, {});

    if (storeIds.length === 0) {
      return null;
    }

    console.log(`[SendQueue] Processing queue for ${storeIds.length} stores`);

    // Round-robin: claim emails from each store fairly
    // With Resend batch API at 2 req/s and 30s cron interval,
    // we can do ~50 batch requests per cycle = 5,000 emails max
    // (leaving headroom below the theoretical 60 req limit)
    // Distribute fairly across stores
    const EMAILS_PER_STORE = Math.min(
      200, // Cap per store per cycle
      Math.floor(5000 / storeIds.length) // Fair share
    );

    const allClaimed: Array<{
      _id: Id<"emailSendQueue">;
      toEmail: string;
      fromName: string;
      fromEmail: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      replyTo?: string;
      headers?: any;
    }> = [];

    // Claim from each store in round-robin
    for (const storeId of storeIds) {
      try {
        const claimed = await ctx.runMutation(internal.emailSendQueue.claimBatchForStore, {
          storeId,
          limit: EMAILS_PER_STORE,
        });
        allClaimed.push(...claimed);
      } catch (error) {
        console.error(`[SendQueue] Failed to claim batch for store ${storeId}:`, error);
      }
    }

    if (allClaimed.length === 0) {
      console.log(`[SendQueue] No emails claimed`);
      return null;
    }

    console.log(`[SendQueue] Claimed ${allClaimed.length} emails across ${storeIds.length} stores`);

    // Group into Resend batch API calls (max 100 per batch)
    const BATCH_SIZE = 100;
    const batches: typeof allClaimed[] = [];
    for (let i = 0; i < allClaimed.length; i += BATCH_SIZE) {
      batches.push(allClaimed.slice(i, i + BATCH_SIZE));
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
        const { data, error } = await resend.batch.send(emailPayloads);

        if (error) {
          console.error(`[SendQueue] Batch ${batchIndex + 1}/${batches.length} error:`, error);
          await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
            emailIds: batchIds,
            error: JSON.stringify(error),
          });
          totalFailed += batch.length;
        } else {
          await ctx.runMutation(internal.emailSendQueue.markEmailsSent, {
            emailIds: batchIds,
          });
          totalSent += batch.length;
        }
      } catch (error: any) {
        console.error(`[SendQueue] Batch ${batchIndex + 1}/${batches.length} exception:`, error);

        // Check for rate limit
        if (error?.statusCode === 429) {
          const retryAfter = error?.headers?.["retry-after"] || 2;
          console.log(`[SendQueue] Rate limited, waiting ${retryAfter}s`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

          // Retry this batch once
          try {
            const { data, error: retryError } = await resend.batch.send(emailPayloads);
            if (retryError) {
              await ctx.runMutation(internal.emailSendQueue.markEmailsFailed, {
                emailIds: batchIds,
                error: JSON.stringify(retryError),
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

      // Rate limit: stay under 2 req/s to Resend
      // Wait 600ms between batch requests
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    console.log(
      `[SendQueue] Cycle complete: ${totalSent} sent, ${totalFailed} failed, ` +
        `${batches.length} batches, ${storeIds.length} stores`
    );

    return null;
  },
});
