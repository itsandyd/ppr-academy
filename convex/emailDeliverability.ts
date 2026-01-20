import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get deliverability health overview
export const getDeliverabilityHealth = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get recent events (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentEvents = await ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", thirtyDaysAgo)
      )
      .collect();

    // Count by event type
    const eventCounts = {
      hardBounces: 0,
      softBounces: 0,
      spamComplaints: 0,
      blocks: 0,
      unsubscribes: 0,
      deliveryDelays: 0,
    };

    for (const event of recentEvents) {
      switch (event.eventType) {
        case "hard_bounce":
          eventCounts.hardBounces++;
          break;
        case "soft_bounce":
          eventCounts.softBounces++;
          break;
        case "spam_complaint":
          eventCounts.spamComplaints++;
          break;
        case "blocked":
          eventCounts.blocks++;
          break;
        case "unsubscribe":
          eventCounts.unsubscribes++;
          break;
        case "delivery_delay":
          eventCounts.deliveryDelays++;
          break;
      }
    }

    // Get latest stats
    const latestStats = await ctx.db
      .query("emailDeliverabilityStats")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .first();

    // Calculate health score based on metrics
    const totalIssues =
      eventCounts.hardBounces +
      eventCounts.spamComplaints +
      eventCounts.blocks;

    // Simple health score calculation (can be made more sophisticated)
    let healthScore = 100;
    if (totalIssues > 0) {
      healthScore = Math.max(0, 100 - totalIssues * 2);
    }
    if (eventCounts.spamComplaints > 0) {
      healthScore -= eventCounts.spamComplaints * 10; // Spam complaints are severe
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (eventCounts.hardBounces > 5) {
      recommendations.push("Clean your email list to remove invalid addresses");
    }
    if (eventCounts.spamComplaints > 0) {
      recommendations.push("Review your email content and sending practices");
    }
    if (eventCounts.softBounces > 10) {
      recommendations.push("Check for recipient server issues and retry timing");
    }
    if (eventCounts.blocks > 0) {
      recommendations.push("Review your sending reputation and authentication");
    }

    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      eventCounts,
      totalEventsLast30Days: recentEvents.length,
      latestStats,
      recommendations,
    };
  },
});

// Get detailed deliverability events
export const getDeliverabilityEvents = query({
  args: {
    storeId: v.string(),
    eventType: v.optional(
      v.union(
        v.literal("hard_bounce"),
        v.literal("soft_bounce"),
        v.literal("spam_complaint"),
        v.literal("blocked"),
        v.literal("unsubscribe"),
        v.literal("delivery_delay")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let query = ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId_timestamp", (q) => q.eq("storeId", args.storeId))
      .order("desc");

    const events = await query.take(limit);

    // Filter by event type if specified
    const filteredEvents = args.eventType
      ? events.filter((e) => e.eventType === args.eventType)
      : events;

    return filteredEvents;
  },
});

// Get deliverability stats over time
export const getDeliverabilityTrends = query({
  args: {
    storeId: v.string(),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    const stats = await ctx.db
      .query("emailDeliverabilityStats")
      .withIndex("by_storeId_period", (q) =>
        q.eq("storeId", args.storeId).eq("period", args.period)
      )
      .order("desc")
      .take(limit);

    return stats.reverse(); // Return in chronological order
  },
});

// Get domain reputation
export const getDomainReputation = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const domains = await ctx.db
      .query("emailDomainReputation")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return domains;
  },
});

// Record a deliverability event
export const recordDeliverabilityEvent = mutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    eventType: v.union(
      v.literal("hard_bounce"),
      v.literal("soft_bounce"),
      v.literal("spam_complaint"),
      v.literal("blocked"),
      v.literal("unsubscribe"),
      v.literal("delivery_delay")
    ),
    reason: v.optional(v.string()),
    emailId: v.optional(v.string()),
    workflowId: v.optional(v.id("emailWorkflows")),
    broadcastId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the contact by email
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email)
      )
      .first();

    // Create the event
    const eventId = await ctx.db.insert("emailDeliverabilityEvents", {
      storeId: args.storeId,
      contactId: contact?._id,
      email: args.email,
      eventType: args.eventType,
      reason: args.reason,
      emailId: args.emailId,
      workflowId: args.workflowId,
      broadcastId: args.broadcastId,
      timestamp: Date.now(),
      processed: false,
    });

    // Update contact status for hard bounces and spam complaints
    if (contact && (args.eventType === "hard_bounce" || args.eventType === "spam_complaint")) {
      await ctx.db.patch(contact._id, {
        status: args.eventType === "hard_bounce" ? "bounced" : "unsubscribed",
      });
    }

    return eventId;
  },
});

// Get bounce rate analysis by email domain
export const getBounceRateByDomain = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", thirtyDaysAgo)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("eventType"), "hard_bounce"),
          q.eq(q.field("eventType"), "soft_bounce")
        )
      )
      .collect();

    // Group by recipient domain
    const domainStats: Record<string, { total: number; hard: number; soft: number }> = {};

    for (const event of events) {
      const domain = event.email.split("@")[1] || "unknown";
      if (!domainStats[domain]) {
        domainStats[domain] = { total: 0, hard: 0, soft: 0 };
      }
      domainStats[domain].total++;
      if (event.eventType === "hard_bounce") {
        domainStats[domain].hard++;
      } else {
        domainStats[domain].soft++;
      }
    }

    // Sort by total bounces
    const sortedDomains = Object.entries(domainStats)
      .map(([domain, stats]) => ({
        domain,
        ...stats,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return sortedDomains;
  },
});

// Get recent problematic contacts
export const getProblematicContacts = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 25;

    // Get contacts with bounce or spam issues
    const events = await ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(100);

    // Group by email and count issues
    const contactIssues: Record<
      string,
      { email: string; events: typeof events; contactId?: Id<"emailContacts"> }
    > = {};

    for (const event of events) {
      if (!contactIssues[event.email]) {
        contactIssues[event.email] = {
          email: event.email,
          events: [],
          contactId: event.contactId,
        };
      }
      contactIssues[event.email].events.push(event);
    }

    // Sort by number of issues
    const sortedContacts = Object.values(contactIssues)
      .map((c) => ({
        email: c.email,
        contactId: c.contactId,
        issueCount: c.events.length,
        lastEvent: c.events[0],
        hasHardBounce: c.events.some((e) => e.eventType === "hard_bounce"),
        hasSpamComplaint: c.events.some((e) => e.eventType === "spam_complaint"),
      }))
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, limit);

    return sortedContacts;
  },
});

// Update deliverability stats (called periodically)
export const updateDeliverabilityStats = internalMutation({
  args: {
    storeId: v.string(),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let periodStart: number;
    let periodMs: number;

    switch (args.period) {
      case "daily":
        periodMs = 24 * 60 * 60 * 1000;
        periodStart = now - (now % periodMs);
        break;
      case "weekly":
        periodMs = 7 * 24 * 60 * 60 * 1000;
        periodStart = now - (now % periodMs);
        break;
      case "monthly":
        periodMs = 30 * 24 * 60 * 60 * 1000;
        periodStart = now - (now % periodMs);
        break;
    }

    // Get events in this period
    const events = await ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId_timestamp", (q) =>
        q.eq("storeId", args.storeId).gte("timestamp", periodStart)
      )
      .collect();

    // Count events
    let hardBounces = 0;
    let softBounces = 0;
    let spamComplaints = 0;
    let blocks = 0;
    let unsubscribes = 0;

    for (const event of events) {
      switch (event.eventType) {
        case "hard_bounce":
          hardBounces++;
          break;
        case "soft_bounce":
          softBounces++;
          break;
        case "spam_complaint":
          spamComplaints++;
          break;
        case "blocked":
          blocks++;
          break;
        case "unsubscribe":
          unsubscribes++;
          break;
      }
    }

    // Estimate total sent (this would ideally come from email send logs)
    // For now, use a placeholder calculation
    const totalSent = 1000; // This should be calculated from actual sends
    const delivered = totalSent - hardBounces - softBounces - blocks;

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 100;
    const bounceRate = totalSent > 0 ? ((hardBounces + softBounces) / totalSent) * 100 : 0;
    const spamRate = totalSent > 0 ? (spamComplaints / totalSent) * 100 : 0;

    // Calculate health score
    let healthScore = 100;
    healthScore -= bounceRate * 2;
    healthScore -= spamRate * 20; // Spam complaints have heavy weight
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Check if stats for this period already exist
    const existingStats = await ctx.db
      .query("emailDeliverabilityStats")
      .withIndex("by_storeId_periodStart", (q) =>
        q.eq("storeId", args.storeId).eq("periodStart", periodStart)
      )
      .filter((q) => q.eq(q.field("period"), args.period))
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        totalSent,
        delivered,
        hardBounces,
        softBounces,
        spamComplaints,
        blocks,
        unsubscribes,
        deliveryRate,
        bounceRate,
        spamRate,
        healthScore,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("emailDeliverabilityStats", {
        storeId: args.storeId,
        period: args.period,
        periodStart,
        totalSent,
        delivered,
        hardBounces,
        softBounces,
        spamComplaints,
        blocks,
        unsubscribes,
        deliveryRate,
        bounceRate,
        spamRate,
        healthScore,
        updatedAt: now,
      });
    }
  },
});

// Mark event as processed
export const markEventProcessed = mutation({
  args: {
    eventId: v.id("emailDeliverabilityEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { processed: true });
  },
});

// Bulk clean bounced emails from list
export const cleanBouncedContacts = mutation({
  args: {
    storeId: v.string(),
    hardBouncesOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("emailDeliverabilityEvents")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => {
        if (args.hardBouncesOnly) {
          return q.eq(q.field("eventType"), "hard_bounce");
        }
        return q.or(
          q.eq(q.field("eventType"), "hard_bounce"),
          q.eq(q.field("eventType"), "soft_bounce")
        );
      })
      .collect();

    const processedEmails = new Set<string>();
    let cleanedCount = 0;

    for (const event of events) {
      if (processedEmails.has(event.email)) continue;
      processedEmails.add(event.email);

      if (event.contactId) {
        await ctx.db.patch(event.contactId, { status: "bounced" });
        cleanedCount++;
      }
    }

    return { cleanedCount };
  },
});
