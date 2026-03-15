/**
 * Admin Creator Outreach - Send emails to creators from admin panel
 *
 * Unlike the creator-facing email system (which targets a creator's audience),
 * this targets creators themselves from the admin/platform perspective.
 * Emails are sent FROM "Andrew" <andrew@pauseplayrepeat.com>.
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { internal } = require("../_generated/api") as { internal: any };

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Unsubscribe footer with placeholder — %%UNSUBSCRIBE_URL%% is replaced with
// the actual HMAC-signed URL at send time in emailSendQueueActions.ts
const PLAIN_TEXT_FOOTER = `\n\n---\nTo unsubscribe from creator updates: %%UNSUBSCRIBE_URL%%\nPPR Academy LLC, 651 N Broad St Suite 201, Middletown, DE 19709`;

const HTML_FOOTER = `<br><br><hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;"><a href="%%UNSUBSCRIBE_URL%%" style="color:#666;font-size:12px;">Unsubscribe from creator updates</a><br><span style="color:#999;font-size:11px;">PPR Academy LLC, 651 N Broad St Suite 201, Middletown, DE 19709</span>`;

/**
 * Convert HTML email content to plain text for deliverability.
 * - Converts <a href="URL">text</a> to naked URL
 * - Converts <br> and </p> to newlines
 * - Strips all remaining HTML tags
 */
function htmlToPlainText(html: string): string {
  let text = html;
  // Convert <a href="URL">text</a> to just URL
  text = text.replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>[^<]*<\/a>/gi, "$1");
  // Convert <br>, <br/>, <br /> to newline
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Convert </p> and </div> to newline
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");
  // Collapse multiple blank lines into max two newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}


async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) throw new Error("Unauthorized: Authentication required");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();
  if (!user || user.admin !== true) throw new Error("Unauthorized: Admin access required");
  return user;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/**
 * Get all creators with full outreach-relevant data
 */
export const getCreatorOutreachList = query({
  args: {
    clerkId: v.optional(v.string()),
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("inactive"),
        v.literal("active"),
        v.literal("no_stripe"),
        v.literal("no_products"),
        v.literal("churned")
      )
    ),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      signupDate: v.number(),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
      storeId: v.optional(v.id("stores")),
      productsUploaded: v.number(),
      courseCount: v.number(),
      digitalProductCount: v.number(),
      hasPublished: v.boolean(),
      stripeConnected: v.boolean(),
      stripeOnboardingComplete: v.boolean(),
      totalRevenue: v.number(),
      lastSaleAt: v.optional(v.number()),
      plan: v.optional(v.string()),
      status: v.string(), // "active" | "inactive" | "churned" | "new"
      outreachStatus: v.optional(v.string()), // Current outreach enrollment status
    })
  ),
  handler: async (ctx, { clerkId, filter = "all" }) => {
    await verifyAdmin(ctx, clerkId);

    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(2000);
    const products = await ctx.db.query("digitalProducts").take(2000);
    const purchases = await ctx.db.query("purchases").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const creators = [];

    for (const store of stores) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", store.userId))
        .first();

      if (!user?.email) continue;

      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorProducts = products.filter((p) => p.storeId === store._id);
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );

      const totalProducts = creatorCourses.length + creatorProducts.length;
      const hasPublished =
        creatorCourses.some((c) => c.isPublished) ||
        creatorProducts.some((p) => p.isPublished);
      const totalRevenue =
        creatorPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      const lastSale = creatorPurchases.sort(
        (a, b) => b._creationTime - a._creationTime
      )[0];
      const hasRecentSales = creatorPurchases.some(
        (p) => p._creationTime > thirtyDaysAgo
      );

      // Determine status
      let status: string;
      if (lastSale && lastSale._creationTime < sixtyDaysAgo) {
        status = "churned";
      } else if (hasRecentSales) {
        status = "active";
      } else if (totalProducts === 0) {
        status = "inactive";
      } else if (store._creationTime > thirtyDaysAgo) {
        status = "new";
      } else {
        status = "inactive";
      }

      // Check outreach enrollment
      const outreach = await ctx.db
        .query("adminCreatorOutreach")
        .withIndex("by_creatorUserId", (q: any) => q.eq("creatorUserId", store.userId))
        .first();

      const stripeConnected = !!(
        user.stripeConnectAccountId && user.stripeAccountStatus === "enabled"
      );

      const creator = {
        userId: store.userId,
        name: user.name || user.firstName || user.email,
        email: user.email,
        imageUrl: user.imageUrl,
        signupDate: store._creationTime,
        storeName: store.name,
        storeSlug: store.slug,
        storeId: store._id,
        productsUploaded: totalProducts,
        courseCount: creatorCourses.length,
        digitalProductCount: creatorProducts.length,
        hasPublished,
        stripeConnected,
        stripeOnboardingComplete: !!user.stripeOnboardingComplete,
        totalRevenue,
        lastSaleAt: lastSale?._creationTime,
        plan: store.plan,
        status,
        outreachStatus: outreach?.status,
      };

      // Apply filter
      switch (filter) {
        case "inactive":
          if (status !== "inactive") continue;
          break;
        case "active":
          if (status !== "active") continue;
          break;
        case "no_stripe":
          if (stripeConnected) continue;
          break;
        case "no_products":
          if (totalProducts > 0) continue;
          break;
        case "churned":
          if (status !== "churned") continue;
          break;
      }

      creators.push(creator);
    }

    return creators.sort((a, b) => b.signupDate - a.signupDate);
  },
});

/**
 * Get admin outreach sequences
 */
export const getOutreachSequences = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminOutreachSequences"),
      name: v.string(),
      description: v.optional(v.string()),
      fromName: v.string(),
      fromEmail: v.string(),
      replyTo: v.optional(v.string()),
      stepCount: v.number(),
      isActive: v.boolean(),
      totalEnrolled: v.number(),
      totalCompleted: v.number(),
      totalStopped: v.number(),
      stopOnProductUpload: v.boolean(),
      stopOnReply: v.boolean(),
      plainTextMode: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { clerkId }) => {
    await verifyAdmin(ctx, clerkId);

    const sequences = await ctx.db.query("adminOutreachSequences").take(100);

    return sequences.map((seq) => ({
      _id: seq._id,
      name: seq.name,
      description: seq.description,
      fromName: seq.fromName,
      fromEmail: seq.fromEmail,
      replyTo: seq.replyTo,
      stepCount: seq.steps.length,
      isActive: seq.isActive,
      totalEnrolled: seq.totalEnrolled,
      totalCompleted: seq.totalCompleted,
      totalStopped: seq.totalStopped,
      stopOnProductUpload: seq.stopOnProductUpload,
      stopOnReply: seq.stopOnReply,
      plainTextMode: seq.plainTextMode,
      createdAt: seq.createdAt,
      updatedAt: seq.updatedAt,
    }));
  },
});

/**
 * Get a single sequence with all steps
 */
export const getOutreachSequence = query({
  args: {
    clerkId: v.optional(v.string()),
    sequenceId: v.id("adminOutreachSequences"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("adminOutreachSequences"),
      name: v.string(),
      description: v.optional(v.string()),
      fromName: v.string(),
      fromEmail: v.string(),
      replyTo: v.optional(v.string()),
      steps: v.array(
        v.object({
          stepIndex: v.number(),
          subject: v.string(),
          htmlContent: v.string(),
          textContent: v.optional(v.string()),
          delayDays: v.number(),
        })
      ),
      nodes: v.optional(v.string()),
      edges: v.optional(v.string()),
      isActive: v.boolean(),
      stopOnProductUpload: v.boolean(),
      stopOnReply: v.boolean(),
      plainTextMode: v.optional(v.boolean()),
      totalEnrolled: v.number(),
      totalCompleted: v.number(),
      totalStopped: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { clerkId, sequenceId }) => {
    await verifyAdmin(ctx, clerkId);
    const seq = await ctx.db.get(sequenceId);
    if (!seq) return null;
    return {
      _id: seq._id,
      name: seq.name,
      description: seq.description,
      fromName: seq.fromName,
      fromEmail: seq.fromEmail,
      replyTo: seq.replyTo,
      steps: seq.steps,
      nodes: seq.nodes,
      edges: seq.edges,
      isActive: seq.isActive,
      stopOnProductUpload: seq.stopOnProductUpload,
      stopOnReply: seq.stopOnReply,
      plainTextMode: seq.plainTextMode,
      totalEnrolled: seq.totalEnrolled,
      totalCompleted: seq.totalCompleted,
      totalStopped: seq.totalStopped,
      createdAt: seq.createdAt,
      updatedAt: seq.updatedAt,
    };
  },
});

/**
 * Get enrollments for a sequence
 */
export const getSequenceEnrollments = query({
  args: {
    clerkId: v.optional(v.string()),
    sequenceId: v.id("adminOutreachSequences"),
  },
  returns: v.array(
    v.object({
      _id: v.id("adminCreatorOutreach"),
      creatorName: v.string(),
      creatorEmail: v.string(),
      status: v.string(),
      currentStepIndex: v.optional(v.number()),
      emailsSent: v.number(),
      emailsOpened: v.number(),
      emailsClicked: v.number(),
      enrolledAt: v.number(),
      lastEmailSentAt: v.optional(v.number()),
      stoppedReason: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { clerkId, sequenceId }) => {
    await verifyAdmin(ctx, clerkId);

    const enrollments = await ctx.db
      .query("adminCreatorOutreach")
      .withIndex("by_sequenceId", (q: any) => q.eq("sequenceId", sequenceId))
      .take(500);

    return enrollments.map((e) => ({
      _id: e._id,
      creatorName: e.creatorName,
      creatorEmail: e.creatorEmail,
      status: e.status,
      currentStepIndex: e.currentStepIndex,
      emailsSent: e.emailsSent,
      emailsOpened: e.emailsOpened,
      emailsClicked: e.emailsClicked,
      enrolledAt: e.enrolledAt,
      lastEmailSentAt: e.lastEmailSentAt,
      stoppedReason: e.stoppedReason,
    }));
  },
});

/**
 * Get outreach stats summary
 */
export const getOutreachStats = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    totalSequences: v.number(),
    activeSequences: v.number(),
    totalEnrolled: v.number(),
    totalEmailsSent: v.number(),
    totalOpened: v.number(),
    totalClicked: v.number(),
    stoppedByAction: v.number(),
  }),
  handler: async (ctx, { clerkId }) => {
    await verifyAdmin(ctx, clerkId);

    const sequences = await ctx.db.query("adminOutreachSequences").take(100);
    const enrollments = await ctx.db.query("adminCreatorOutreach").take(5000);

    return {
      totalSequences: sequences.length,
      activeSequences: sequences.filter((s) => s.isActive).length,
      totalEnrolled: enrollments.length,
      totalEmailsSent: enrollments.reduce((sum, e) => sum + e.emailsSent, 0),
      totalOpened: enrollments.reduce((sum, e) => sum + e.emailsOpened, 0),
      totalClicked: enrollments.reduce((sum, e) => sum + e.emailsClicked, 0),
      stoppedByAction: enrollments.filter((e) => e.status === "stopped_by_action").length,
    };
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create a new admin outreach sequence
 */
export const createOutreachSequence = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    steps: v.array(
      v.object({
        subject: v.string(),
        htmlContent: v.string(),
        textContent: v.optional(v.string()),
        delayDays: v.number(),
      })
    ),
    nodes: v.optional(v.string()),
    edges: v.optional(v.string()),
    stopOnProductUpload: v.optional(v.boolean()),
    stopOnReply: v.optional(v.boolean()),
    plainTextMode: v.optional(v.boolean()),
  },
  returns: v.id("adminOutreachSequences"),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const now = Date.now();
    return await ctx.db.insert("adminOutreachSequences", {
      name: args.name,
      description: args.description,
      fromName: args.fromName || "Andrew",
      fromEmail: args.fromEmail || "andrew@pauseplayrepeat.com",
      replyTo: args.replyTo || "andrew@pauseplayrepeat.com",
      steps: args.steps.map((step, index) => ({
        ...step,
        stepIndex: index,
      })),
      nodes: args.nodes,
      edges: args.edges,
      stopOnProductUpload: args.stopOnProductUpload ?? true,
      stopOnReply: args.stopOnReply ?? true,
      plainTextMode: args.plainTextMode ?? true,
      isActive: true,
      totalEnrolled: 0,
      totalCompleted: 0,
      totalStopped: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: args.clerkId,
    });
  },
});

/**
 * Update an existing outreach sequence
 */
export const updateOutreachSequence = mutation({
  args: {
    clerkId: v.string(),
    sequenceId: v.id("adminOutreachSequences"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    steps: v.optional(
      v.array(
        v.object({
          subject: v.string(),
          htmlContent: v.string(),
          textContent: v.optional(v.string()),
          delayDays: v.number(),
        })
      )
    ),
    nodes: v.optional(v.string()),
    edges: v.optional(v.string()),
    stopOnProductUpload: v.optional(v.boolean()),
    stopOnReply: v.optional(v.boolean()),
    plainTextMode: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const seq = await ctx.db.get(args.sequenceId);
    if (!seq) throw new Error("Sequence not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.fromName !== undefined) patch.fromName = args.fromName;
    if (args.fromEmail !== undefined) patch.fromEmail = args.fromEmail;
    if (args.replyTo !== undefined) patch.replyTo = args.replyTo;
    if (args.steps !== undefined) {
      patch.steps = args.steps.map((step, index) => ({ ...step, stepIndex: index }));
    }
    if (args.nodes !== undefined) patch.nodes = args.nodes;
    if (args.edges !== undefined) patch.edges = args.edges;
    if (args.stopOnProductUpload !== undefined) patch.stopOnProductUpload = args.stopOnProductUpload;
    if (args.stopOnReply !== undefined) patch.stopOnReply = args.stopOnReply;
    if (args.plainTextMode !== undefined) patch.plainTextMode = args.plainTextMode;

    await ctx.db.patch(args.sequenceId, patch);
    return null;
  },
});

/**
 * Enroll creators in an outreach sequence
 */
export const enrollCreatorsInSequence = mutation({
  args: {
    clerkId: v.string(),
    sequenceId: v.id("adminOutreachSequences"),
    creators: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        name: v.string(),
        storeId: v.optional(v.id("stores")),
        storeSlug: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    enrolled: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, { clerkId, sequenceId, creators }) => {
    await verifyAdmin(ctx, clerkId);

    const sequence = await ctx.db.get(sequenceId);
    if (!sequence) throw new Error("Sequence not found");

    const now = Date.now();
    let enrolled = 0;
    let skipped = 0;

    // For graph-based workflows, find the first node after trigger
    let firstNodeId: string | undefined;
    if (sequence.nodes && sequence.edges) {
      const graphNodes = JSON.parse(sequence.nodes) as Array<{ id: string; type: string }>;
      const graphEdges = JSON.parse(sequence.edges) as Array<{ source: string; target: string }>;
      const triggerNode = graphNodes.find((n) => n.type === "outreachTrigger");
      if (triggerNode) {
        const firstEdge = graphEdges.find((e) => e.source === triggerNode.id);
        firstNodeId = firstEdge?.target;
      }
    }

    for (const creator of creators) {
      // Check if already enrolled in this sequence
      const existing = await ctx.db
        .query("adminCreatorOutreach")
        .withIndex("by_creatorUserId", (q: any) => q.eq("creatorUserId", creator.userId))
        .first();

      if (
        existing &&
        existing.sequenceId === sequenceId &&
        (existing.status === "enrolled" || existing.status === "active")
      ) {
        skipped++;
        continue;
      }

      // Calculate first email time (first step delay)
      const firstDelay = sequence.steps[0]?.delayDays ?? 0;
      const nextEmailAt = now + firstDelay * 24 * 60 * 60 * 1000;

      await ctx.db.insert("adminCreatorOutreach", {
        creatorUserId: creator.userId,
        creatorEmail: creator.email,
        creatorName: creator.name,
        storeId: creator.storeId,
        storeSlug: creator.storeSlug,
        sequenceId,
        sequenceName: sequence.name,
        currentStepIndex: 0,
        currentNodeId: firstNodeId,
        nextEmailAt,
        status: "enrolled",
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        enrolledAt: now,
      });
      enrolled++;
    }

    // Update sequence stats
    await ctx.db.patch(sequenceId, {
      totalEnrolled: sequence.totalEnrolled + enrolled,
      updatedAt: now,
    });

    // Trigger immediate processing so the first email sends right away
    // instead of waiting up to 1 hour for the next cron cycle
    if (enrolled > 0) {
      await ctx.scheduler.runAfter(0, internal.admin.creatorOutreach.processOutreachEmails, {});
    }

    return { enrolled, skipped };
  },
});

/**
 * Manually trigger outreach email processing (admin only).
 * Useful for testing and for sending emails without waiting for the cron.
 */
export const triggerProcessOutreachEmails = mutation({
  args: { clerkId: v.string() },
  returns: v.null(),
  handler: async (ctx, { clerkId }) => {
    await verifyAdmin(ctx, clerkId);
    await ctx.scheduler.runAfter(0, internal.admin.creatorOutreach.processOutreachEmails, {});
    return null;
  },
});

/**
 * Send a one-off email to selected creators
 */
export const sendOneOffEmail = mutation({
  args: {
    clerkId: v.string(),
    creators: v.array(
      v.object({
        userId: v.string(),
        email: v.string(),
        name: v.string(),
        storeId: v.optional(v.id("stores")),
      })
    ),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
  },
  returns: v.object({
    queued: v.number(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const now = Date.now();
    const fromName = args.fromName || "Andrew";
    const fromEmail = args.fromEmail || "andrew@pauseplayrepeat.com";
    let queued = 0;

    for (const creator of args.creators) {
      // Check if creator has unsubscribed from creator-outreach list
      const emailLower = creator.email.toLowerCase().trim();
      const prefs = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q: any) => q.eq("userId", emailLower))
        .first();

      if (prefs?.isUnsubscribed || prefs?.unsubscribedLists?.includes("creator-outreach")) {
        continue; // Skip unsubscribed creators
      }

      // Create outreach record
      const outreachId = await ctx.db.insert("adminCreatorOutreach", {
        creatorUserId: creator.userId,
        creatorEmail: creator.email,
        creatorName: creator.name,
        storeId: creator.storeId,
        status: "completed",
        emailsSent: 1,
        emailsOpened: 0,
        emailsClicked: 0,
        lastEmailSentAt: now,
        enrolledAt: now,
        completedAt: now,
      });

      // Log the email
      await ctx.db.insert("adminOutreachEmails", {
        outreachId,
        toEmail: creator.email,
        fromName,
        fromEmail,
        subject: args.subject,
        status: "sent",
        sentAt: now,
      });

      // Add unsubscribe footer to email content
      // %%UNSUBSCRIBE_URL%% placeholder is replaced at send time with HMAC-signed URL
      const htmlWithFooter = args.htmlContent + HTML_FOOTER;
      const textWithFooter = (args.textContent || htmlToPlainText(args.htmlContent)) + PLAIN_TEXT_FOOTER;

      // Enqueue via the existing email send queue (uses "transactional" source
      // to bypass per-store unsubscribe checks — admin emails are platform-level)
      await ctx.db.insert("emailSendQueue", {
        storeId: "admin",
        source: "transactional",
        toEmail: creator.email,
        fromName,
        fromEmail,
        subject: args.subject,
        htmlContent: htmlWithFooter,
        textContent: textWithFooter,
        replyTo: fromEmail,
        status: "queued",
        priority: 3,
        attempts: 0,
        maxAttempts: 3,
        queuedAt: now,
      });

      queued++;
    }

    return { queued };
  },
});

/**
 * Pause/resume a creator in a sequence
 */
export const toggleCreatorOutreach = mutation({
  args: {
    clerkId: v.string(),
    outreachId: v.id("adminCreatorOutreach"),
  },
  returns: v.object({ newStatus: v.string() }),
  handler: async (ctx, { clerkId, outreachId }) => {
    await verifyAdmin(ctx, clerkId);

    const outreach = await ctx.db.get(outreachId);
    if (!outreach) throw new Error("Outreach record not found");

    const now = Date.now();

    if (outreach.status === "paused") {
      await ctx.db.patch(outreachId, { status: "active", pausedAt: undefined });
      return { newStatus: "active" };
    } else if (outreach.status === "enrolled" || outreach.status === "active") {
      await ctx.db.patch(outreachId, { status: "paused", pausedAt: now });
      return { newStatus: "paused" };
    }

    return { newStatus: outreach.status };
  },
});

/**
 * Toggle sequence active status
 */
export const toggleSequenceActive = mutation({
  args: {
    clerkId: v.string(),
    sequenceId: v.id("adminOutreachSequences"),
  },
  returns: v.object({ isActive: v.boolean() }),
  handler: async (ctx, { clerkId, sequenceId }) => {
    await verifyAdmin(ctx, clerkId);

    const seq = await ctx.db.get(sequenceId);
    if (!seq) throw new Error("Sequence not found");

    const newActive = !seq.isActive;
    await ctx.db.patch(sequenceId, { isActive: newActive, updatedAt: Date.now() });
    return { isActive: newActive };
  },
});

/**
 * Process outreach sequence emails (called by cron or manually)
 * Sends the next email in sequence for creators whose nextEmailAt has passed.
 */
export const processOutreachEmails = internalMutation({
  args: {},
  returns: v.object({ processed: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();

    // Get all enrolled/active outreach records with due emails
    const dueOutreach = await ctx.db
      .query("adminCreatorOutreach")
      .withIndex("by_nextEmailAt", (q: any) =>
        q.eq("status", "enrolled").lte("nextEmailAt", now)
      )
      .take(50);

    // Also get active ones
    const dueActive = await ctx.db
      .query("adminCreatorOutreach")
      .withIndex("by_nextEmailAt", (q: any) =>
        q.eq("status", "active").lte("nextEmailAt", now)
      )
      .take(50);

    const allDue = [...dueOutreach, ...dueActive];
    let processed = 0;

    for (const outreach of allDue) {
      if (!outreach.sequenceId) continue;

      const sequence = await ctx.db.get(outreach.sequenceId);
      if (!sequence || !sequence.isActive) continue;

      // Check if creator has unsubscribed from creator-outreach list
      const emailLower = outreach.creatorEmail.toLowerCase().trim();
      const prefs = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q: any) => q.eq("userId", emailLower))
        .first();

      if (prefs?.isUnsubscribed || prefs?.unsubscribedLists?.includes("creator-outreach")) {
        await ctx.db.patch(outreach._id, {
          status: "unsubscribed",
          stoppedReason: "Unsubscribed from creator-outreach list",
          completedAt: now,
        });
        continue;
      }

      // Check auto-stop: did creator upload a product AFTER enrollment?
      // Only counts products/courses created after the creator was enrolled,
      // not pre-existing content (otherwise the sequence would immediately stop
      // for any creator who already had content).
      if (sequence.stopOnProductUpload && outreach.storeId) {
        const store = await ctx.db.get(outreach.storeId);
        if (store) {
          const enrolledAt = outreach.enrolledAt;
          const newProducts = await ctx.db
            .query("digitalProducts")
            .withIndex("by_storeId", (q: any) => q.eq("storeId", store._id))
            .filter((q: any) => q.gt(q.field("_creationTime"), enrolledAt))
            .first();
          const newCourses = await ctx.db
            .query("courses")
            .withIndex("by_userId", (q: any) => q.eq("userId", store.userId))
            .filter((q: any) => q.gt(q.field("_creationTime"), enrolledAt))
            .first();

          if (newProducts || newCourses) {
            await ctx.db.patch(outreach._id, {
              status: "stopped_by_action",
              stoppedReason: "Creator uploaded a product after enrollment",
              completedAt: now,
            });
            await ctx.db.patch(outreach.sequenceId, {
              totalStopped: sequence.totalStopped + 1,
              updatedAt: now,
            });
            continue;
          }
        }
      }

      // Graph-based workflow path
      if (outreach.currentNodeId && sequence.nodes && sequence.edges) {
        const graphNodes = JSON.parse(sequence.nodes) as Array<{
          id: string;
          type: string;
          data: Record<string, any>;
        }>;
        const graphEdges = JSON.parse(sequence.edges) as Array<{
          source: string;
          target: string;
          sourceHandle?: string;
        }>;

        const getNextNodeId = (sourceId: string, handle?: string): string | null => {
          const edge = graphEdges.find(
            (e) => e.source === sourceId && (handle ? e.sourceHandle === handle : true)
          );
          return edge?.target ?? null;
        };

        let currentNodeId: string | null = outreach.currentNodeId;
        let advanceCount = 0;
        const MAX_ADVANCES = 10; // prevent infinite loops

        while (currentNodeId && advanceCount < MAX_ADVANCES) {
          const currentNode = graphNodes.find((n) => n.id === currentNodeId);
          if (!currentNode) {
            // Node not found — mark completed
            await ctx.db.patch(outreach._id, { status: "completed", completedAt: now });
            await ctx.db.patch(outreach.sequenceId, {
              totalCompleted: sequence.totalCompleted + 1,
              updatedAt: now,
            });
            break;
          }

          if (currentNode.type === "sendEmail") {
            // Send the email
            const personalizeStr = (str: string) =>
              str
                .replace(/\{\{name\}\}/g, outreach.creatorName)
                .replace(/\{\{firstName\}\}/g, outreach.creatorName.split(" ")[0])
                .replace(/\{\{email\}\}/g, outreach.creatorEmail)
                .replace(/\{\{storeName\}\}/g, outreach.storeSlug || "")
                .replace(/\{\{storeSlug\}\}/g, outreach.storeSlug || "");

            const subject = personalizeStr(currentNode.data.subject || "");
            const isPlainText = sequence.plainTextMode === true;

            let htmlContent: string;
            let textContent: string | undefined;

            if (isPlainText) {
              // True plain text mode: NO HTML at all. Gmail/Apple Mail/Outlook
              // auto-linkify naked URLs in text/plain emails.
              const rawContent = personalizeStr(currentNode.data.htmlContent || "");
              const plainBody = htmlToPlainText(rawContent);
              textContent = plainBody + PLAIN_TEXT_FOOTER;
              htmlContent = "";
            } else {
              htmlContent = personalizeStr(currentNode.data.htmlContent || "");
              if (!htmlContent.includes("<")) {
                htmlContent = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">${htmlContent.replace(/\n/g, "<br>")}</div>`;
              }
              // Append HTML unsubscribe footer
              htmlContent += HTML_FOOTER;
              textContent = (currentNode.data.textContent || htmlToPlainText(htmlContent)) + PLAIN_TEXT_FOOTER;
            }

            const sendQueueId = await ctx.db.insert("emailSendQueue", {
              storeId: "admin",
              source: "transactional",
              toEmail: outreach.creatorEmail,
              fromName: sequence.fromName,
              fromEmail: sequence.fromEmail,
              subject,
              htmlContent,
              textContent,
              replyTo: sequence.replyTo || sequence.fromEmail,
              status: "queued",
              priority: 3,
              attempts: 0,
              maxAttempts: 3,
              queuedAt: now,
            });

            await ctx.db.insert("adminOutreachEmails", {
              outreachId: outreach._id,
              sequenceId: outreach.sequenceId!,
              toEmail: outreach.creatorEmail,
              fromName: sequence.fromName,
              fromEmail: sequence.fromEmail,
              subject: currentNode.data.subject || "",
              status: "sent",
              sendQueueId,
              sentAt: now,
            });

            // Advance to next node
            const nextId = getNextNodeId(currentNode.id);
            if (!nextId) {
              // No next node — completed
              await ctx.db.patch(outreach._id, {
                status: "completed",
                currentNodeId: undefined,
                emailsSent: outreach.emailsSent + 1,
                lastEmailSentAt: now,
                completedAt: now,
              });
              await ctx.db.patch(outreach.sequenceId, {
                totalCompleted: sequence.totalCompleted + 1,
                updatedAt: now,
              });
            } else {
              // Check if next node is a delay
              const nextNode = graphNodes.find((n) => n.id === nextId);
              if (nextNode?.type === "delay") {
                const delayMs = getDelayMs(nextNode.data);
                const afterDelayId = getNextNodeId(nextNode.id);
                await ctx.db.patch(outreach._id, {
                  status: "active",
                  currentNodeId: afterDelayId || undefined,
                  nextEmailAt: now + delayMs,
                  emailsSent: outreach.emailsSent + 1,
                  lastEmailSentAt: now,
                });
              } else {
                // Next node is not a delay — process immediately next cron run
                await ctx.db.patch(outreach._id, {
                  status: "active",
                  currentNodeId: nextId,
                  nextEmailAt: now,
                  emailsSent: outreach.emailsSent + 1,
                  lastEmailSentAt: now,
                });
              }
            }
            processed++;
            break; // Only send one email per cron cycle per creator

          } else if (currentNode.type === "condition") {
            // Evaluate condition
            const condResult = await evaluateOutreachCondition(
              ctx,
              currentNode.data.conditionType,
              outreach
            );
            const nextId = getNextNodeId(currentNode.id, condResult ? "yes" : "no");
            if (!nextId) {
              await ctx.db.patch(outreach._id, { status: "completed", completedAt: now });
              await ctx.db.patch(outreach.sequenceId, {
                totalCompleted: sequence.totalCompleted + 1,
                updatedAt: now,
              });
              break;
            }
            currentNodeId = nextId;
            await ctx.db.patch(outreach._id, {
              status: "active",
              currentNodeId: nextId,
              nextEmailAt: now,
            });
            advanceCount++;
            continue; // Evaluate next node immediately

          } else if (currentNode.type === "delay") {
            // Delay nodes should be skipped during graph traversal
            // (they're handled as lookaheads from sendEmail)
            const nextId = getNextNodeId(currentNode.id);
            if (!nextId) {
              await ctx.db.patch(outreach._id, { status: "completed", completedAt: now });
              break;
            }
            currentNodeId = nextId;
            await ctx.db.patch(outreach._id, {
              status: "active",
              currentNodeId: nextId,
              nextEmailAt: now,
            });
            advanceCount++;
            continue;

          } else if (currentNode.type === "stop") {
            await ctx.db.patch(outreach._id, {
              status: "completed",
              currentNodeId: undefined,
              completedAt: now,
            });
            await ctx.db.patch(outreach.sequenceId, {
              totalCompleted: sequence.totalCompleted + 1,
              updatedAt: now,
            });
            break;

          } else {
            // Unknown node type — advance past it
            const nextId = getNextNodeId(currentNode.id);
            if (!nextId) {
              await ctx.db.patch(outreach._id, { status: "completed", completedAt: now });
              break;
            }
            currentNodeId = nextId;
            advanceCount++;
          }
        }
        continue; // Skip legacy path
      }

      // Legacy linear step-based path
      if (outreach.currentStepIndex === undefined) continue;

      const step = sequence.steps[outreach.currentStepIndex];
      if (!step) {
        // No more steps — mark completed
        await ctx.db.patch(outreach._id, {
          status: "completed",
          completedAt: now,
        });
        await ctx.db.patch(outreach.sequenceId, {
          totalCompleted: sequence.totalCompleted + 1,
          updatedAt: now,
        });
        continue;
      }

      // Personalize content
      const rawHtml = step.htmlContent
        .replace(/\{\{name\}\}/g, outreach.creatorName)
        .replace(/\{\{firstName\}\}/g, outreach.creatorName.split(" ")[0])
        .replace(/\{\{email\}\}/g, outreach.creatorEmail);

      const isPlainText = sequence.plainTextMode === true;
      let htmlContent: string;
      let textContent: string | undefined;
      if (isPlainText) {
        // True plain text mode: NO HTML at all. Gmail/Apple Mail/Outlook
        // auto-linkify naked URLs in text/plain emails.
        const plainBody = htmlToPlainText(rawHtml);
        textContent = plainBody + PLAIN_TEXT_FOOTER;
        htmlContent = "";
      } else {
        htmlContent = rawHtml + HTML_FOOTER;
        textContent = (step.textContent || htmlToPlainText(rawHtml)) + PLAIN_TEXT_FOOTER;
      }

      // Enqueue the email
      const sendQueueId = await ctx.db.insert("emailSendQueue", {
        storeId: "admin",
        source: "transactional",
        toEmail: outreach.creatorEmail,
        fromName: sequence.fromName,
        fromEmail: sequence.fromEmail,
        subject: step.subject.replace(
          /\{\{firstName\}\}/g,
          outreach.creatorName.split(" ")[0]
        ),
        htmlContent,
        textContent,
        replyTo: sequence.replyTo || sequence.fromEmail,
        status: "queued",
        priority: 3,
        attempts: 0,
        maxAttempts: 3,
        queuedAt: now,
      });

      // Log the email
      await ctx.db.insert("adminOutreachEmails", {
        outreachId: outreach._id,
        sequenceId: outreach.sequenceId,
        stepIndex: outreach.currentStepIndex,
        toEmail: outreach.creatorEmail,
        fromName: sequence.fromName,
        fromEmail: sequence.fromEmail,
        subject: step.subject,
        status: "sent",
        sendQueueId,
        sentAt: now,
      });

      // Calculate next step
      const nextIndex = outreach.currentStepIndex + 1;
      const nextStep = sequence.steps[nextIndex];

      if (nextStep) {
        const nextEmailAt = now + nextStep.delayDays * 24 * 60 * 60 * 1000;
        await ctx.db.patch(outreach._id, {
          status: "active",
          currentStepIndex: nextIndex,
          nextEmailAt,
          emailsSent: outreach.emailsSent + 1,
          lastEmailSentAt: now,
        });
      } else {
        // Last step sent — mark completed
        await ctx.db.patch(outreach._id, {
          status: "completed",
          emailsSent: outreach.emailsSent + 1,
          lastEmailSentAt: now,
          completedAt: now,
        });
        await ctx.db.patch(outreach.sequenceId, {
          totalCompleted: sequence.totalCompleted + 1,
          updatedAt: now,
        });
      }

      processed++;
    }

    return { processed };
  },
});

// ─── Graph Execution Helpers ──────────────────────────────────────────────────

function getDelayMs(data: Record<string, any>): number {
  const value = data.delayValue || 1;
  const unit = data.delayUnit || "days";
  switch (unit) {
    case "minutes":
      return value * 60 * 1000;
    case "hours":
      return value * 60 * 60 * 1000;
    case "days":
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

/**
 * Internal query to verify admin (needed by actions in creatorOutreachActions.ts)
 */
export const verifyAdminQuery = query({
  args: { clerkId: v.string() },
  returns: v.union(v.null(), v.object({ admin: v.boolean() })),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (!user || user.admin !== true) return null;
    return { admin: true };
  },
});

async function evaluateOutreachCondition(
  ctx: any,
  conditionType: string,
  outreach: {
    storeId?: any;
    creatorUserId: string;
    emailsOpened: number;
    emailsClicked: number;
  }
): Promise<boolean> {
  switch (conditionType) {
    case "has_products": {
      if (!outreach.storeId) return false;
      const store = await ctx.db.get(outreach.storeId);
      if (!store) return false;
      const product = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q: any) => q.eq("storeId", store._id))
        .first();
      if (product) return true;
      const course = await ctx.db
        .query("courses")
        .withIndex("by_userId", (q: any) => q.eq("userId", store.userId))
        .first();
      return !!course;
    }
    case "has_stripe": {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", outreach.creatorUserId))
        .unique();
      return !!(user?.stripeConnectAccountId && user?.stripeAccountStatus === "enabled");
    }
    case "is_churned": {
      if (!outreach.storeId) return false;
      const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      const recentPurchase = await ctx.db
        .query("purchases")
        .withIndex("by_storeId", (q: any) => q.eq("storeId", outreach.storeId))
        .first();
      if (!recentPurchase) return false;
      return recentPurchase._creationTime < sixtyDaysAgo;
    }
    case "emails_opened":
      return outreach.emailsOpened > 0;
    case "emails_clicked":
      return outreach.emailsClicked > 0;
    default:
      return false;
  }
}
