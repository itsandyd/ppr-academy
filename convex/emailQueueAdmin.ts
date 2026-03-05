import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Requeue failed emails for retry.
 * Resets status to "queued", resets attempts to 0, and gives them fresh maxAttempts.
 * Use this to recover from rate-limit failures or temporary sending cap issues.
 *
 * Usage:
 *   npx convex run emailQueueAdmin:requeueFailedEmails                    # dry run (count only)
 *   npx convex run emailQueueAdmin:requeueFailedEmails '{"dryRun":false}' # actually requeue
 *   npx convex run emailQueueAdmin:requeueFailedEmails '{"dryRun":false,"errorFilter":"rate"}' # only rate-limit errors
 */
export const requeueFailedEmails = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    errorFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
    // Enhanced mode: also grab stale-queued items and deduplicate
    includeStaleQueued: v.optional(v.boolean()),
    subjectFilter: v.optional(v.string()),
  },
  returns: v.object({
    found: v.number(),
    requeued: v.number(),
    skipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const limit = args.limit ?? 5000;
    const includeStaleQueued = args.includeStaleQueued ?? false;
    const subjectFilter = args.subjectFilter;

    // Gather failed emails
    const failedEmails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "failed"))
      .take(limit);

    // Optionally gather stale queued emails (previously requeued)
    let staleQueued: typeof failedEmails = [];
    if (includeStaleQueued) {
      const queuedEmails = await ctx.db
        .query("emailSendQueue")
        .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "queued"))
        .take(limit);
      staleQueued = queuedEmails.filter(
        (e) => e.lastError?.includes("Requeued")
      );
    }

    const allEmails = [...failedEmails, ...staleQueued];

    // Double-send check: build set of recipients who already got this subject
    const alreadySentRecipients = new Set<string>();
    if (subjectFilter) {
      const sentEmails = await ctx.db
        .query("emailSendQueue")
        .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "sent"))
        .take(8000);
      for (const e of sentEmails) {
        if (e.subject === subjectFilter) {
          alreadySentRecipients.add(e.toEmail);
        }
      }
    }

    // Deduplicate by recipient
    const seenRecipients = new Set<string>();
    let requeued = 0;
    let skipped = 0;

    for (const email of allEmails) {
      // Skip emails that were blocked due to unsubscribe
      if (email.lastError?.startsWith("Blocked")) {
        skipped++;
        continue;
      }

      // If errorFilter is specified, only requeue emails whose error matches
      if (args.errorFilter && email.lastError && !email.lastError.toLowerCase().includes(args.errorFilter.toLowerCase())) {
        skipped++;
        continue;
      }

      // If subjectFilter set, skip non-matching subjects
      if (subjectFilter && email.subject !== subjectFilter) {
        skipped++;
        continue;
      }

      // Skip recipients who already received this email (prevent double-send)
      if (alreadySentRecipients.has(email.toEmail)) {
        skipped++;
        if (!dryRun) {
          await ctx.db.patch(email._id, {
            status: "cancelled" as const,
            lastError: "Cancelled: recipient already received this email",
          });
        }
        continue;
      }

      // Skip duplicate recipients within this batch
      if (seenRecipients.has(email.toEmail)) {
        skipped++;
        if (!dryRun) {
          await ctx.db.patch(email._id, {
            status: "cancelled" as const,
            lastError: "Cancelled: duplicate recipient in batch",
          });
        }
        continue;
      }

      seenRecipients.add(email.toEmail);

      if (!dryRun) {
        await ctx.db.patch(email._id, {
          status: "queued" as const,
          attempts: 0,
          maxAttempts: 3,
          lastError: `Requeued: was "${(email.lastError ?? "").slice(0, 100)}"`,
          nextRetryAt: undefined,
        });
      }
      requeued++;
    }

    const action = dryRun ? "would requeue" : "requeued";
    return {
      found: allEmails.length,
      requeued,
      skipped,
      message: `Found ${allEmails.length} emails (${failedEmails.length} failed + ${staleQueued.length} stale queued). ${action} ${requeued} for ${seenRecipients.size} unique recipients, skipped ${skipped}.${dryRun ? " Run with dryRun:false to actually requeue." : " Emails will be picked up by the next cron cycle (30s)."}`,
    };
  },
});

/**
 * Freeze queued emails back to "failed" to stop the cron from retrying them.
 * Use this when the sending quota is still exceeded and retries are pointless.
 *
 * Usage:
 *   npx convex run emailQueueAdmin:freezeQueuedEmails                    # dry run
 *   npx convex run emailQueueAdmin:freezeQueuedEmails '{"dryRun":false}' # actually freeze
 */
export const freezeQueuedEmails = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    found: v.number(),
    frozen: v.number(),
    skipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const limit = args.limit ?? 2000;

    const queuedEmails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "queued"))
      .take(limit);

    // Only freeze emails that have a quota/requeue error (not fresh legitimate queued items)
    const toFreeze = queuedEmails.filter(
      (e) => e.lastError?.includes("Requeued") || e.lastError?.includes("quota") || e.lastError?.includes("Retriggered")
    );

    let frozen = 0;
    for (const email of toFreeze) {
      if (!dryRun) {
        await ctx.db.patch(email._id, {
          status: "failed" as const,
          lastError: `Frozen: quota still exceeded. Was "${(email.lastError ?? "").slice(0, 80)}"`,
          maxAttempts: 0,
          attempts: 0,
        });
      }
      frozen++;
    }

    const action = dryRun ? "WOULD freeze" : "froze";
    return {
      found: queuedEmails.length,
      frozen,
      skipped: queuedEmails.length - toFreeze.length,
      message: `${action} ${frozen} of ${queuedEmails.length} queued emails back to failed.${dryRun ? " Run with dryRun:false to execute." : " Cron will no longer retry these."}`,
    };
  },
});

/**
 * Inspect queue errors - show distinct error messages and counts.
 */
export const inspectQueueErrors = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const status = args.status ?? "queued";
    const limit = args.limit ?? 2000;

    const emails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", status as any))
      .take(limit);

    // Group by lastError
    const errorCounts: Record<string, number> = {};
    const storeCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    for (const email of emails) {
      const err = email.lastError ?? "(none)";
      errorCounts[err] = (errorCounts[err] || 0) + 1;
      storeCounts[email.storeId] = (storeCounts[email.storeId] || 0) + 1;
      sourceCounts[email.source] = (sourceCounts[email.source] || 0) + 1;
    }

    return {
      total: emails.length,
      byError: errorCounts,
      byStore: storeCounts,
      bySource: sourceCounts,
    };
  },
});

/**
 * Count emails per status in queue. Uses small take() to avoid 16MB limit.
 */
export const countAllEmails = query({
  args: {
    status: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Count by taking IDs only, in chunks
    let total = 0;
    const subjects: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const CHUNK = 2000;

    const emails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", args.status as any))
      .take(CHUNK);

    for (const e of emails) {
      total++;
      subjects[e.subject] = (subjects[e.subject] || 0) + 1;
      sources[e.source] = (sources[e.source] || 0) + 1;
    }

    // Top 10 subjects by count
    const topSubjects = Object.entries(subjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([subject, count]) => ({ subject, count }));

    return { status: args.status, total, sources, topSubjects, note: total >= CHUNK ? `Capped at ${CHUNK}, likely more` : "Complete count" };
  },
});

/**
 * Lean requeue: reset failed send queue items back to queued (v2).
 * Filters by lastError containing errorFilter string.
 * Does NOT do double-send checks (use inspectQueueErrors first to verify).
 * Designed for small batches to stay under Convex mutation limits.
 *
 * Usage:
 *   npx convex run emailQueueAdmin:requeueQuotaFailed '{"dryRun":true}'
 *   npx convex run emailQueueAdmin:requeueQuotaFailed '{"dryRun":false,"batchSize":300}'
 */
export const requeueQuotaFailed = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    errorFilter: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const batchSize = args.batchSize ?? 300;
    const errorFilter = (args.errorFilter ?? "quota").toLowerCase();

    const failed = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "failed"))
      .take(batchSize);

    let requeued = 0;
    let skipped = 0;

    for (const item of failed) {
      const err = (item.lastError ?? "").toLowerCase();
      if (!err.includes(errorFilter)) {
        skipped++;
        continue;
      }

      if (!dryRun) {
        await ctx.db.patch(item._id, {
          status: "queued" as const,
          attempts: 0,
          maxAttempts: 3,
          lastError: undefined,
          nextRetryAt: undefined,
        });
      }
      requeued++;
    }

    return {
      dryRun,
      fetched: failed.length,
      requeued,
      skipped,
      hasMore: failed.length === batchSize,
      message: dryRun
        ? `DRY RUN: would requeue ${requeued} of ${failed.length} (skipped ${skipped}). Run with dryRun:false to execute.`
        : `Requeued ${requeued} of ${failed.length} items. ${failed.length === batchSize ? "More remain — run again." : "All done."}`,
    };
  },
});

/**
 * Analyze email volume to classify broadcast vs personalized sends.
 * Scans sent emails and groups by source + subject to identify:
 * - Broadcasts: same subject sent to many recipients (could use Broadcasts API)
 * - Personalized: unique per-recipient workflow/drip emails (must stay transactional)
 */
export const analyzeEmailVolume = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const status = args.status ?? "sent";
    const limit = args.limit ?? 5000;

    const emails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", status as any))
      .take(limit);

    // By source
    const bySource: Record<string, number> = {};
    // By subject (to find broadcast-like patterns)
    const bySubject: Record<string, { count: number; source: string; uniqueRecipients: Set<string> }> = {};

    for (const email of emails) {
      bySource[email.source] = (bySource[email.source] || 0) + 1;

      if (!bySubject[email.subject]) {
        bySubject[email.subject] = { count: 0, source: email.source, uniqueRecipients: new Set() };
      }
      bySubject[email.subject].count++;
      bySubject[email.subject].uniqueRecipients.add(email.toEmail);
    }

    // Classify subjects: if same subject sent to 10+ unique recipients, it's broadcast-like
    let broadcastLikeCount = 0;
    let personalizedCount = 0;
    const broadcastSubjects: { subject: string; recipients: number; source: string }[] = [];
    const personalizedSubjects: { subject: string; recipients: number; source: string }[] = [];

    for (const [subject, data] of Object.entries(bySubject)) {
      const uniqueCount = data.uniqueRecipients.size;
      if (uniqueCount >= 10) {
        broadcastLikeCount += data.count;
        broadcastSubjects.push({ subject, recipients: uniqueCount, source: data.source });
      } else {
        personalizedCount += data.count;
        personalizedSubjects.push({ subject, recipients: uniqueCount, source: data.source });
      }
    }

    // Sort broadcast subjects by recipient count descending
    broadcastSubjects.sort((a, b) => b.recipients - a.recipients);

    return {
      totalEmails: emails.length,
      bySource,
      broadcastLike: {
        totalEmails: broadcastLikeCount,
        percentage: emails.length > 0 ? Math.round((broadcastLikeCount / emails.length) * 100) : 0,
        topSubjects: broadcastSubjects.slice(0, 20),
      },
      personalized: {
        totalEmails: personalizedCount,
        percentage: emails.length > 0 ? Math.round((personalizedCount / emails.length) * 100) : 0,
        subjectCount: personalizedSubjects.length,
        sampleSubjects: personalizedSubjects.slice(0, 10),
      },
    };
  },
});
