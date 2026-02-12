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
      .filter((q) => q.eq(q.field("userId"), email))
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
      .filter((q) => q.eq(q.field("userId"), email))
      .first();

    if (pref?.isUnsubscribed) {
      return { suppressed: true, reason: "unsubscribed" };
    }

    const recentBounce = await ctx.db
      .query("resendLogs")
      .filter((q) =>
        q.and(q.eq(q.field("recipientEmail"), email), q.eq(q.field("status"), "bounced"))
      )
      .order("desc")
      .first();

    if (recentBounce) {
      return { suppressed: true, reason: "bounced" };
    }

    const recentComplaint = await ctx.db
      .query("resendLogs")
      .filter((q) =>
        q.and(q.eq(q.field("recipientEmail"), email), q.eq(q.field("status"), "complained"))
      )
      .order("desc")
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

    const allPrefs = await ctx.db.query("resendPreferences").collect();
    const unsubscribedEmails = new Set(
      allPrefs.filter((p) => p.isUnsubscribed).map((p) => p.userId.toLowerCase())
    );

    const recentLogs = await ctx.db
      .query("resendLogs")
      .filter((q) =>
        q.or(q.eq(q.field("status"), "bounced"), q.eq(q.field("status"), "complained"))
      )
      .collect();

    const bouncedEmails = new Set(
      recentLogs.filter((l) => l.status === "bounced").map((l) => l.recipientEmail.toLowerCase())
    );
    const complainedEmails = new Set(
      recentLogs.filter((l) => l.status === "complained").map((l) => l.recipientEmail.toLowerCase())
    );

    for (const email of args.emails) {
      const emailLower = email.toLowerCase().trim();

      if (unsubscribedEmails.has(emailLower)) {
        results.push({ email, suppressed: true, reason: "unsubscribed" });
      } else if (bouncedEmails.has(emailLower)) {
        results.push({ email, suppressed: true, reason: "bounced" });
      } else if (complainedEmails.has(emailLower)) {
        results.push({ email, suppressed: true, reason: "complained" });
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
    const allPrefs = await ctx.db.query("resendPreferences").collect();
    const unsubscribed = allPrefs.filter((p) => p.isUnsubscribed);

    const bouncedLogs = await ctx.db
      .query("resendLogs")
      .filter((q) => q.eq(q.field("status"), "bounced"))
      .collect();
    const uniqueBounced = new Set(bouncedLogs.map((l) => l.recipientEmail.toLowerCase()));

    const complainedLogs = await ctx.db
      .query("resendLogs")
      .filter((q) => q.eq(q.field("status"), "complained"))
      .collect();
    const uniqueComplained = new Set(complainedLogs.map((l) => l.recipientEmail.toLowerCase()));

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
        .filter((q) => q.eq(q.field("userId"), email))
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

export const markComplained = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const existingPref = await ctx.db
      .query("resendPreferences")
      .filter((q) => q.eq(q.field("userId"), email))
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
