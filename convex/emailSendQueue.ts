import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Enqueue an email for sending via the batch queue.
 * Content must be fully resolved (personalized, variables replaced) before enqueueing.
 */
export const enqueueEmail = internalMutation({
  args: {
    storeId: v.string(),
    source: v.union(
      v.literal("workflow"),
      v.literal("drip"),
      v.literal("broadcast"),
      v.literal("transactional")
    ),
    workflowExecutionId: v.optional(v.id("workflowExecutions")),
    dripEnrollmentId: v.optional(v.id("dripCampaignEnrollments")),
    toEmail: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    headers: v.optional(v.any()),
    priority: v.optional(v.number()),
  },
  returns: v.id("emailSendQueue"),
  handler: async (ctx, args) => {
    // CAN-SPAM compliance: check suppression before enqueueing any non-transactional email
    if (args.source !== "transactional") {
      const emailLower = args.toEmail.toLowerCase().trim();

      // Check resendPreferences (global unsubscribe)
      const pref = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q) => q.eq("userId", emailLower))
        .first();
      if (pref?.isUnsubscribed) {
        // Return a dummy ID — the email will not be sent.
        // We insert with status "blocked" so it's visible in logs but never processed.
        const blockedId = await ctx.db.insert("emailSendQueue", {
          storeId: args.storeId,
          source: args.source,
          workflowExecutionId: args.workflowExecutionId,
          dripEnrollmentId: args.dripEnrollmentId,
          toEmail: args.toEmail,
          fromName: args.fromName,
          fromEmail: args.fromEmail,
          subject: args.subject,
          htmlContent: "",
          status: "failed" as const,
          priority: args.priority ?? 5,
          attempts: 0,
          maxAttempts: 0,
          queuedAt: Date.now(),
          lastError: "Blocked: recipient is unsubscribed",
        });
        return blockedId;
      }

      // Check emailContacts status across all stores
      const contacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_email", (q) => q.eq("email", emailLower))
        .take(5000);
      const isContactUnsubscribed = contacts.some(
        (c) => c.status === "unsubscribed" || c.status === "complained"
      );
      if (isContactUnsubscribed) {
        const blockedId = await ctx.db.insert("emailSendQueue", {
          storeId: args.storeId,
          source: args.source,
          workflowExecutionId: args.workflowExecutionId,
          dripEnrollmentId: args.dripEnrollmentId,
          toEmail: args.toEmail,
          fromName: args.fromName,
          fromEmail: args.fromEmail,
          subject: args.subject,
          htmlContent: "",
          status: "failed" as const,
          priority: args.priority ?? 5,
          attempts: 0,
          maxAttempts: 0,
          queuedAt: Date.now(),
          lastError: "Blocked: contact is unsubscribed",
        });
        return blockedId;
      }
    }

    const id = await ctx.db.insert("emailSendQueue", {
      storeId: args.storeId,
      source: args.source,
      workflowExecutionId: args.workflowExecutionId,
      dripEnrollmentId: args.dripEnrollmentId,
      toEmail: args.toEmail,
      fromName: args.fromName,
      fromEmail: args.fromEmail,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      replyTo: args.replyTo,
      headers: args.headers,
      status: "queued",
      priority: args.priority ?? 5,
      attempts: 0,
      maxAttempts: 3,
      queuedAt: Date.now(),
    });
    return id;
  },
});

/**
 * Enqueue a batch of emails in a single mutation (reduces OCC by batching inserts).
 */
export const enqueueEmailBatch = internalMutation({
  args: {
    emails: v.array(
      v.object({
        storeId: v.string(),
        source: v.union(
          v.literal("workflow"),
          v.literal("drip"),
          v.literal("broadcast"),
          v.literal("transactional")
        ),
        workflowExecutionId: v.optional(v.id("workflowExecutions")),
        dripEnrollmentId: v.optional(v.id("dripCampaignEnrollments")),
        toEmail: v.string(),
        fromName: v.string(),
        fromEmail: v.string(),
        subject: v.string(),
        htmlContent: v.string(),
        textContent: v.optional(v.string()),
        replyTo: v.optional(v.string()),
        headers: v.optional(v.any()),
        priority: v.optional(v.number()),
      })
    ),
  },
  returns: v.array(v.id("emailSendQueue")),
  handler: async (ctx, args) => {
    // Build suppression set for non-transactional emails
    const nonTransactionalEmails = args.emails
      .filter((e) => e.source !== "transactional")
      .map((e) => e.toEmail.toLowerCase().trim());
    const uniqueEmails = [...new Set(nonTransactionalEmails)];

    const suppressedSet = new Set<string>();
    for (const emailAddr of uniqueEmails) {
      // Check resendPreferences
      const pref = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q) => q.eq("userId", emailAddr))
        .first();
      if (pref?.isUnsubscribed) {
        suppressedSet.add(emailAddr);
        continue;
      }
      // Check emailContacts
      const contacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_email", (q) => q.eq("email", emailAddr))
        .take(5000);
      if (contacts.some((c) => c.status === "unsubscribed" || c.status === "complained")) {
        suppressedSet.add(emailAddr);
      }
    }

    const ids: Id<"emailSendQueue">[] = [];
    for (const email of args.emails) {
      // Block suppressed non-transactional emails
      if (email.source !== "transactional" && suppressedSet.has(email.toEmail.toLowerCase().trim())) {
        const blockedId = await ctx.db.insert("emailSendQueue", {
          storeId: email.storeId,
          source: email.source,
          workflowExecutionId: email.workflowExecutionId,
          dripEnrollmentId: email.dripEnrollmentId,
          toEmail: email.toEmail,
          fromName: email.fromName,
          fromEmail: email.fromEmail,
          subject: email.subject,
          htmlContent: "",
          status: "failed" as const,
          priority: email.priority ?? 5,
          attempts: 0,
          maxAttempts: 0,
          queuedAt: Date.now(),
          lastError: "Blocked: recipient is unsubscribed",
        });
        ids.push(blockedId);
        continue;
      }

      const id = await ctx.db.insert("emailSendQueue", {
        storeId: email.storeId,
        source: email.source,
        workflowExecutionId: email.workflowExecutionId,
        dripEnrollmentId: email.dripEnrollmentId,
        toEmail: email.toEmail,
        fromName: email.fromName,
        fromEmail: email.fromEmail,
        subject: email.subject,
        htmlContent: email.htmlContent,
        textContent: email.textContent,
        replyTo: email.replyTo,
        headers: email.headers,
        status: "queued",
        priority: email.priority ?? 5,
        attempts: 0,
        maxAttempts: 3,
        queuedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

/**
 * Get distinct store IDs that have queued emails.
 * Used by the round-robin processor to ensure fairness.
 */
export const getActiveStoreIds = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    // Get queued emails ordered by priority and queue time
    // Reduced from 500 to 100 to limit bandwidth — each record has full HTML body (2-5KB)
    // This only needs enough records to find unique storeIds, not all queued emails
    const queuedEmails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "queued"))
      .take(100);

    // Extract unique store IDs while preserving first-seen order
    const seen = new Set<string>();
    const storeIds: string[] = [];
    for (const email of queuedEmails) {
      if (!seen.has(email.storeId)) {
        seen.add(email.storeId);
        storeIds.push(email.storeId);
      }
    }
    return storeIds;
  },
});

/**
 * Get IDs of queued emails for a specific store (read-only, no OCC conflicts).
 * Used by the action to find candidates before claiming them.
 */
export const getQueuedEmailIds = internalQuery({
  args: {
    storeId: v.string(),
    limit: v.number(),
  },
  returns: v.array(v.id("emailSendQueue")),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_storeId_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "queued")
      )
      .take(args.limit);

    return emails.map((e) => e._id);
  },
});

/**
 * Claim a batch of queued emails by their IDs.
 * Only patches specific documents (by ID), avoiding index-range conflicts
 * with enqueueEmail which inserts new documents.
 */
export const claimBatchForStore = internalMutation({
  args: {
    emailIds: v.array(v.id("emailSendQueue")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const claimed = [];
    for (const id of args.emailIds) {
      const email = await ctx.db.get(id);
      if (!email || email.status !== "queued") continue;

      // Transactional emails (receipts, password resets) bypass suppression per CAN-SPAM
      if (email.source !== "transactional") {
        const emailLower = email.toEmail.toLowerCase().trim();

        // Check resendPreferences (global unsubscribe)
        const pref = await ctx.db
          .query("resendPreferences")
          .withIndex("by_user", (q) => q.eq("userId", emailLower))
          .first();
        if (pref?.isUnsubscribed) {
          await ctx.db.patch(email._id, {
            status: "failed",
            lastError: "Blocked at send time: recipient unsubscribed",
          });
          continue;
        }

        // Check emailContacts status
        const contacts = await ctx.db
          .query("emailContacts")
          .withIndex("by_email", (q) => q.eq("email", emailLower))
          .take(10);
        if (contacts.some((c) => c.status === "unsubscribed" || c.status === "complained")) {
          await ctx.db.patch(email._id, {
            status: "failed",
            lastError: "Blocked at send time: contact unsubscribed",
          });
          continue;
        }
      }

      // Mark as sending
      await ctx.db.patch(email._id, {
        status: "sending",
        attempts: email.attempts + 1,
      });
      claimed.push(email);
    }

    return claimed;
  },
});

/**
 * Mark emails as sent after successful Resend batch send.
 */
export const markEmailsSent = internalMutation({
  args: {
    emailIds: v.array(v.id("emailSendQueue")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.emailIds) {
      await ctx.db.patch(id, {
        status: "sent",
        sentAt: now,
      });
    }
    return null;
  },
});

/**
 * Mark emails as failed after Resend error.
 * If attempts < maxAttempts, requeue for retry with exponential backoff.
 */
export const markEmailsFailed = internalMutation({
  args: {
    emailIds: v.array(v.id("emailSendQueue")),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.emailIds) {
      const email = await ctx.db.get(id);
      if (!email) continue;

      if (email.attempts < email.maxAttempts) {
        // Exponential backoff: 1s, 4s, 16s base + jitter
        const backoffMs = Math.pow(4, email.attempts) * 1000 + Math.floor(Math.random() * 1000);
        await ctx.db.patch(id, {
          status: "queued", // Requeue for retry
          lastError: args.error,
          nextRetryAt: now + backoffMs,
        });
      } else {
        // Max retries exceeded
        await ctx.db.patch(id, {
          status: "failed",
          lastError: args.error,
        });
      }
    }
    return null;
  },
});

/**
 * Debug: inspect the actual htmlContent of sent emails to diagnose truncation.
 */
export const debugSentEmailContent = internalQuery({
  args: {
    limit: v.optional(v.number()),
    subject: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const sentEmails = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "sent"))
      .take(500);

    // Filter by subject if specified, then take last N (most recent by sentAt)
    let filtered = args.subject
      ? sentEmails.filter((e) => e.subject === args.subject)
      : sentEmails;

    // Sort by sentAt descending to get most recent first
    filtered.sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0));
    filtered = filtered.slice(0, limit);

    return filtered.map((e) => ({
      _id: e._id,
      toEmail: e.toEmail,
      subject: e.subject,
      htmlContentLength: e.htmlContent?.length ?? 0,
      htmlContentPreview: e.htmlContent?.substring(0, 500) ?? "(null)",
      htmlContentEnd: e.htmlContent?.substring(Math.max(0, (e.htmlContent?.length ?? 0) - 200)) ?? "(null)",
      sentAt: e.sentAt,
    }));
  },
});

/**
 * Get queue stats for monitoring - includes all statuses and recent activity.
 */
export const getQueueStats = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Reduced from 10000 but kept high enough for accurate counts
    // These are only called from admin dashboard, not by crons
    const queued = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "queued"))
      .take(2000);

    const sending = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "sending"))
      .take(200);

    const sent = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "sent"))
      .take(2000);

    const failed = await ctx.db
      .query("emailSendQueue")
      .withIndex("by_status_priority_queuedAt", (q) => q.eq("status", "failed"))
      .take(200);

    // Per-store breakdown of queued
    const perStore: Record<string, number> = {};
    for (const email of queued) {
      perStore[email.storeId] = (perStore[email.storeId] || 0) + 1;
    }

    // Recent sent samples
    const recentSent = sent.slice(-5).map((e) => ({
      toEmail: e.toEmail,
      subject: e.subject,
      sentAt: e.sentAt,
      source: e.source,
    }));

    return {
      totalQueued: queued.length,
      totalSending: sending.length,
      totalSent: sent.length,
      totalFailed: failed.length,
      perStore,
      recentSent,
      timestamp: Date.now(),
    };
  },
});
