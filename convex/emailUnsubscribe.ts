import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

export const unsubscribeByEmail = mutation({
  args: {
    email: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const existingPref = await ctx.db
      .query("resendPreferences")
      .withIndex("by_user", (q) => q.eq("userId", email))
      .first();

    if (existingPref) {
      if (existingPref.isUnsubscribed) {
        return { success: true, message: "Already unsubscribed" };
      }

      await ctx.db.patch(existingPref._id, {
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: args.reason || "One-click unsubscribe",
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("resendPreferences", {
        userId: email,
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: args.reason || "One-click unsubscribe",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Also update all emailContacts records for this email across all stores
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .take(5000);

    for (const contact of contacts) {
      if (contact.status !== "unsubscribed") {
        await ctx.db.patch(contact._id, {
          status: "unsubscribed",
          unsubscribedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Cancel any active workflow executions for this email
    const activeExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_customerEmail", (q) => q.eq("customerEmail", email))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "failed"),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .take(100);

    for (const execution of activeExecutions) {
      await ctx.db.patch(execution._id, {
        status: "cancelled" as const,
        completedAt: Date.now(),
      });
    }

    // Cancel any active drip campaign enrollments for this email
    const activeEnrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(100);

    for (const enrollment of activeEnrollments) {
      await ctx.db.patch(enrollment._id, {
        status: "cancelled" as const,
      });
    }

    return { success: true, message: "Successfully unsubscribed" };
  },
});

export const checkSuppression = query({
  args: {
    email: v.string(),
  },
  returns: v.object({
    suppressed: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const pref = await ctx.db
      .query("resendPreferences")
      .withIndex("by_user", (q) => q.eq("userId", email))
      .first();

    if (pref?.isUnsubscribed) {
      return { suppressed: true, reason: "unsubscribed" };
    }

    const recentBounce = await ctx.db
      .query("resendLogs")
      .withIndex("by_recipient", (q) => q.eq("recipientEmail", email))
      .filter((q) => q.eq(q.field("status"), "bounced"))
      .first();

    if (recentBounce) {
      return { suppressed: true, reason: "bounced" };
    }

    const recentComplaint = await ctx.db
      .query("resendLogs")
      .withIndex("by_recipient", (q) => q.eq("recipientEmail", email))
      .filter((q) => q.eq(q.field("status"), "complained"))
      .first();

    if (recentComplaint) {
      return { suppressed: true, reason: "complained" };
    }

    return { suppressed: false };
  },
});

export const checkSuppressionBatch = internalQuery({
  args: {
    emails: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      email: v.string(),
      suppressed: v.boolean(),
      reason: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const results: Array<{ email: string; suppressed: boolean; reason?: string }> = [];

    // Check each email individually using indexes instead of loading entire tables
    for (const email of args.emails) {
      const emailLower = email.toLowerCase().trim();

      // Check resendPreferences by userId index
      const pref = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q) => q.eq("userId", emailLower))
        .first();
      if (pref?.isUnsubscribed) {
        results.push({ email, suppressed: true, reason: "unsubscribed" });
        continue;
      }

      // Check resendLogs for bounces/complaints by recipient index
      const bouncedLog = await ctx.db
        .query("resendLogs")
        .withIndex("by_recipient", (q) => q.eq("recipientEmail", emailLower))
        .filter((q) => q.eq(q.field("status"), "bounced"))
        .first();
      if (bouncedLog) {
        results.push({ email, suppressed: true, reason: "bounced" });
        continue;
      }

      const complainedLog = await ctx.db
        .query("resendLogs")
        .withIndex("by_recipient", (q) => q.eq("recipientEmail", emailLower))
        .filter((q) => q.eq(q.field("status"), "complained"))
        .first();
      if (complainedLog) {
        results.push({ email, suppressed: true, reason: "complained" });
        continue;
      }

      // Check emailContacts table for unsubscribed/complained status
      const contacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_email", (q) => q.eq("email", emailLower))
        .take(5000);
      const contactSuppressed = contacts.some(
        (c) => c.status === "unsubscribed" || c.status === "complained"
      );
      if (contactSuppressed) {
        results.push({ email, suppressed: true, reason: "contact_unsubscribed" });
      } else {
        results.push({ email, suppressed: false });
      }
    }

    return results;
  },
});

export const getUnsubscribeStats = query({
  args: {},
  returns: v.object({
    totalUnsubscribed: v.number(),
    totalBounced: v.number(),
    totalComplained: v.number(),
    recentUnsubscribes: v.array(
      v.object({
        email: v.string(),
        unsubscribedAt: v.number(),
        reason: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx) => {
    // Use status indexes on resendLogs instead of full table scans
    const bouncedLogs = await ctx.db
      .query("resendLogs")
      .withIndex("by_status", (q) => q.eq("status", "bounced"))
      .take(5000);
    const uniqueBounced = new Set(bouncedLogs.map((l) => l.recipientEmail.toLowerCase()));

    const complainedLogs = await ctx.db
      .query("resendLogs")
      .withIndex("by_status", (q) => q.eq("status", "complained"))
      .take(5000);
    const uniqueComplained = new Set(complainedLogs.map((l) => l.recipientEmail.toLowerCase()));

    // For unsubscribed prefs, we still need to scan since there's no isUnsubscribed index,
    // but resendPreferences is a much smaller table than users (only people who have prefs set).
    // Use take() to cap the scan for the count + recent list.
    const allPrefs = await ctx.db.query("resendPreferences").take(5000);
    const unsubscribed = allPrefs.filter((p) => p.isUnsubscribed);

    const recentUnsubscribes = unsubscribed
      .filter((p) => p.unsubscribedAt)
      .sort((a, b) => (b.unsubscribedAt || 0) - (a.unsubscribedAt || 0))
      .slice(0, 10)
      .map((p) => ({
        email: p.userId,
        unsubscribedAt: p.unsubscribedAt || 0,
        reason: p.unsubscribeReason,
      }));

    return {
      totalUnsubscribed: unsubscribed.length,
      totalBounced: uniqueBounced.size,
      totalComplained: uniqueComplained.size,
      recentUnsubscribes,
    };
  },
});

export const markBounced = internalMutation({
  args: {
    email: v.string(),
    bounceType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // For hard bounces, suppress the address entirely
    if (args.bounceType === "hard") {
      const existingPref = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q) => q.eq("userId", email))
        .first();

      if (existingPref) {
        await ctx.db.patch(existingPref._id, {
          isUnsubscribed: true,
          unsubscribedAt: Date.now(),
          unsubscribeReason: `Hard bounce - auto-suppressed`,
          platformEmails: false,
          courseEmails: false,
          marketingEmails: false,
          weeklyDigest: false,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("resendPreferences", {
          userId: email,
          platformEmails: false,
          courseEmails: false,
          marketingEmails: false,
          weeklyDigest: false,
          isUnsubscribed: true,
          unsubscribedAt: Date.now(),
          unsubscribeReason: `Hard bounce - auto-suppressed`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Also update any emailContacts record
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (contact) {
      await ctx.db.patch(contact._id, {
        status: "bounced" as const,
      });
    }

    return null;
  },
});

/**
 * Bulk suppress bounced emails - for one-time list cleanup
 * Processes up to 100 emails per call (Convex mutation limits)
 */
export const bulkSuppressBounced = mutation({
  args: {
    emails: v.array(v.string()),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    processed: v.number(),
    newlySuppressed: v.number(),
    alreadySuppressed: v.number(),
  }),
  handler: async (ctx, args) => {
    let newlySuppressed = 0;
    let alreadySuppressed = 0;

    for (const rawEmail of args.emails) {
      const email = rawEmail.toLowerCase().trim();
      if (!email) continue;

      const existingPref = await ctx.db
        .query("resendPreferences")
        .withIndex("by_user", (q) => q.eq("userId", email))
        .first();

      if (existingPref) {
        if (existingPref.isUnsubscribed) {
          alreadySuppressed++;
          continue;
        }
        await ctx.db.patch(existingPref._id, {
          isUnsubscribed: true,
          unsubscribedAt: Date.now(),
          unsubscribeReason: args.reason || "Historical bounce - bulk suppression",
          platformEmails: false,
          courseEmails: false,
          marketingEmails: false,
          weeklyDigest: false,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("resendPreferences", {
          userId: email,
          platformEmails: false,
          courseEmails: false,
          marketingEmails: false,
          weeklyDigest: false,
          isUnsubscribed: true,
          unsubscribedAt: Date.now(),
          unsubscribeReason: args.reason || "Historical bounce - bulk suppression",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      newlySuppressed++;
    }

    return {
      processed: args.emails.length,
      newlySuppressed,
      alreadySuppressed,
    };
  },
});

export const markComplained = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const existingPref = await ctx.db
      .query("resendPreferences")
      .withIndex("by_user", (q) => q.eq("userId", email))
      .first();

    if (existingPref) {
      await ctx.db.patch(existingPref._id, {
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: "Spam complaint",
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("resendPreferences", {
        userId: email,
        platformEmails: false,
        courseEmails: false,
        marketingEmails: false,
        weeklyDigest: false,
        isUnsubscribed: true,
        unsubscribedAt: Date.now(),
        unsubscribeReason: "Spam complaint",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});
