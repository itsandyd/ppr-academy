import { v } from "convex/values";
import { query, mutation, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Default scoring rules that can be customized
const DEFAULT_SCORING_RULES = [
  { id: "email_open", category: "engagement", field: "emailsOpened", operator: "greater_than", value: 0, points: 5 },
  { id: "email_click", category: "engagement", field: "emailsClicked", operator: "greater_than", value: 0, points: 10 },
  { id: "high_engagement", category: "engagement", field: "engagementScore", operator: "greater_than", value: 50, points: 15 },
  { id: "recent_signup", category: "recency", field: "daysSinceSignup", operator: "less_than", value: 7, points: 10 },
  { id: "inactive_30days", category: "recency", field: "daysSinceLastOpen", operator: "greater_than", value: 30, points: -10 },
  { id: "has_tags", category: "demographic", field: "tagCount", operator: "greater_than", value: 0, points: 5 },
];

// Get lead scoring rules for a store
export const getScoringRules = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const rules = await ctx.db
      .query("leadScoringRules")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    return rules;
  },
});

// Get active scoring rules
export const getActiveScoringRules = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const rules = await ctx.db
      .query("leadScoringRules")
      .withIndex("by_active", (q) => q.eq("storeId", args.storeId).eq("isActive", true))
      .collect();

    return rules;
  },
});

// Create or update scoring rules
export const saveScoringRules = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    rules: v.array(
      v.object({
        id: v.string(),
        category: v.union(
          v.literal("engagement"),
          v.literal("demographic"),
          v.literal("behavior"),
          v.literal("recency")
        ),
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("between"),
          v.literal("contains")
        ),
        value: v.any(),
        points: v.number(),
        isNegative: v.optional(v.boolean()),
      })
    ),
    ruleSetId: v.optional(v.id("leadScoringRules")),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const now = Date.now();

    if (args.ruleSetId) {
      await ctx.db.patch(args.ruleSetId, {
        name: args.name,
        description: args.description,
        isActive: args.isActive,
        rules: args.rules,
        updatedAt: now,
      });
      return args.ruleSetId;
    } else {
      return await ctx.db.insert("leadScoringRules", {
        storeId: args.storeId,
        name: args.name,
        description: args.description,
        isActive: args.isActive,
        rules: args.rules,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete scoring rules
export const deleteScoringRules = mutation({
  args: {
    ruleSetId: v.id("leadScoringRules"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.ruleSetId);
  },
});

// Calculate lead score for a contact
export const calculateContactScore = query({
  args: {
    storeId: v.string(),
    contactId: v.id("emailContacts"),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return { score: 0, breakdown: [] };

    const activeRuleSets = await ctx.db
      .query("leadScoringRules")
      .withIndex("by_active", (q) => q.eq("storeId", args.storeId).eq("isActive", true))
      .collect();

    let totalScore = 0;
    const breakdown: Array<{ rule: string; points: number; matched: boolean }> = [];

    // Calculate days since signup
    const daysSinceSignup = Math.floor((Date.now() - contact.subscribedAt) / (1000 * 60 * 60 * 24));
    const daysSinceLastOpen = contact.lastOpenedAt
      ? Math.floor((Date.now() - contact.lastOpenedAt) / (1000 * 60 * 60 * 24))
      : 999;

    const contactData = {
      emailsOpened: contact.emailsOpened || 0,
      emailsClicked: contact.emailsClicked || 0,
      emailsSent: contact.emailsSent || 0,
      engagementScore: contact.engagementScore || 0,
      tagCount: contact.tagIds?.length || 0,
      daysSinceSignup,
      daysSinceLastOpen,
      status: contact.status,
    };

    for (const ruleSet of activeRuleSets) {
      for (const rule of ruleSet.rules) {
        const fieldValue = contactData[rule.field as keyof typeof contactData];
        let matched = false;

        switch (rule.operator) {
          case "equals":
            matched = fieldValue === rule.value;
            break;
          case "greater_than":
            matched = typeof fieldValue === "number" && fieldValue > rule.value;
            break;
          case "less_than":
            matched = typeof fieldValue === "number" && fieldValue < rule.value;
            break;
          case "between":
            if (Array.isArray(rule.value) && typeof fieldValue === "number") {
              matched = fieldValue >= rule.value[0] && fieldValue <= rule.value[1];
            }
            break;
          case "contains":
            matched = String(fieldValue).includes(String(rule.value));
            break;
        }

        if (matched) {
          const points = rule.isNegative ? -Math.abs(rule.points) : rule.points;
          totalScore += points;
        }

        breakdown.push({
          rule: `${rule.field} ${rule.operator} ${rule.value}`,
          points: rule.points,
          matched,
        });
      }
    }

    return {
      score: Math.max(0, Math.min(100, totalScore)),
      breakdown,
    };
  },
});

// Get lead score distribution
// IMPORTANT: This query reads from the pre-aggregated leadScoringSummary table
// to avoid exceeding Convex's 32k document read limit.
export const getScoreDistribution = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    // Read from pre-aggregated summary table (single doc read)
    const summary = await ctx.db
      .query("leadScoringSummary")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (!summary) {
      return {
        distribution: { hot: 0, warm: 0, cold: 0, inactive: 0 },
        total: 0,
      };
    }

    return {
      distribution: {
        hot: summary.hotCount,
        warm: summary.warmCount,
        cold: summary.coldCount,
        inactive: summary.inactiveCount,
      },
      total: summary.totalSubscribed,
    };
  },
});

// Get top leads
// IMPORTANT: This query uses the by_storeId_status_engagementScore index to efficiently
// fetch top leads without scanning all contacts (avoids 32k doc read limit).
export const getTopLeads = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const limit = args.limit || 20;

    // Use compound index to get subscribed contacts sorted by engagement score desc
    // This avoids full-table scan by leveraging the index
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_status_engagementScore", (q) =>
        q.eq("storeId", args.storeId).eq("status", "subscribed")
      )
      .order("desc")
      .take(limit);

    return contacts.map((c) => ({
      _id: c._id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      score: c.engagementScore || 0,
      emailsOpened: c.emailsOpened,
      emailsClicked: c.emailsClicked,
      lastOpenedAt: c.lastOpenedAt,
      subscribedAt: c.subscribedAt,
    }));
  },
});

// Get leads needing attention (score dropped recently)
// IMPORTANT: Uses .take() with a single query to stay under Convex's single-paginate-per-function limit.
// Fetches contacts with high engagement scores (sorted desc) and filters for inactive ones in memory.
export const getLeadsNeedingAttention = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const resultLimit = args.limit || 20;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    // Fetch more than needed since we'll filter; 500 is safe under 32k limit
    const FETCH_SIZE = 500;

    // Use compound index to get subscribed contacts sorted by engagement score desc
    // Take a larger batch and filter in memory for inactive contacts
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_status_engagementScore", (q) =>
        q.eq("storeId", args.storeId).eq("status", "subscribed")
      )
      .order("desc") // Highest scores first
      .take(FETCH_SIZE);

    const results: Array<{
      _id: Id<"emailContacts">;
      email: string;
      firstName?: string;
      lastName?: string;
      score: number;
      daysSinceLastOpen: number | null;
      emailsSent: number;
    }> = [];

    for (const contact of contacts) {
      const score = contact.engagementScore || 0;
      // Since we're sorted by score desc, stop once we hit score <= 20
      if (score <= 20) break;

      // Only include contacts who haven't opened in 14+ days
      const isInactive = !contact.lastOpenedAt || contact.lastOpenedAt < fourteenDaysAgo;
      if (isInactive) {
        results.push({
          _id: contact._id,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          score,
          daysSinceLastOpen: contact.lastOpenedAt
            ? Math.floor((Date.now() - contact.lastOpenedAt) / (1000 * 60 * 60 * 24))
            : null,
          emailsSent: contact.emailsSent,
        });

        if (results.length >= resultLimit) break;
      }
    }

    return results;
  },
});

// Update contact score (called after events)
export const updateContactScore = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    reason: v.string(),
    pointsDelta: v.number(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return;

    const previousScore = contact.engagementScore || 0;
    const newScore = Math.max(0, Math.min(100, previousScore + args.pointsDelta));

    // Update contact score
    await ctx.db.patch(args.contactId, {
      engagementScore: newScore,
      updatedAt: Date.now(),
    });

    // Record history
    await ctx.db.insert("leadScoreHistory", {
      storeId: contact.storeId,
      contactId: args.contactId,
      previousScore,
      newScore,
      changeReason: args.reason,
      timestamp: Date.now(),
    });
  },
});

// Get score history for a contact
export const getContactScoreHistory = query({
  args: {
    contactId: v.id("emailContacts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("leadScoreHistory")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(limit);

    return history;
  },
});

// Internal mutation to process a batch of contacts for score recalculation
// Uses a single paginate call per invocation (Convex requirement)
export const _recalculateScoresBatch = internalMutation({
  args: {
    storeId: v.string(),
    cursor: v.union(v.string(), v.null()),
    // Accumulated state from previous batches
    updated: v.number(),
    total: v.number(),
    hotCount: v.number(),
    warmCount: v.number(),
    coldCount: v.number(),
    inactiveCount: v.number(),
    totalSubscribed: v.number(),
    totalScore: v.number(),
    needsAttentionCount: v.number(),
    scoreBuckets: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 500;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    // Mutable accumulators
    let { updated, total, hotCount, warmCount, coldCount, inactiveCount, totalSubscribed, totalScore, needsAttentionCount } = args;
    const scoreBuckets = [...args.scoreBuckets];

    // Single paginate call per function invocation
    const page = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    for (const contact of page.page) {
      total++;

      const openRate = contact.emailsSent > 0 ? (contact.emailsOpened / contact.emailsSent) * 100 : 0;
      const clickRate = contact.emailsOpened > 0 ? (contact.emailsClicked / contact.emailsOpened) * 100 : 0;
      const daysSinceLastOpen = contact.lastOpenedAt
        ? Math.floor((Date.now() - contact.lastOpenedAt) / (1000 * 60 * 60 * 24))
        : 999;

      let score = 0;
      score += Math.min(30, openRate * 0.6);
      score += Math.min(30, clickRate * 0.6);
      score += contact.tagIds?.length > 0 ? 10 : 0;
      score += daysSinceLastOpen < 7 ? 20 : daysSinceLastOpen < 30 ? 10 : 0;
      score -= contact.status === "unsubscribed" ? 50 : 0;

      const newScore = Math.max(0, Math.min(100, Math.round(score)));

      if (contact.engagementScore !== newScore) {
        await ctx.db.patch(contact._id, {
          engagementScore: newScore,
          updatedAt: Date.now(),
        });
        updated++;
      }

      if (contact.status === "subscribed") {
        totalSubscribed++;
        totalScore += newScore;

        if (newScore >= 70) hotCount++;
        else if (newScore >= 40) warmCount++;
        else if (newScore >= 10) coldCount++;
        else inactiveCount++;

        const bucketIndex = Math.max(0, Math.min(100, newScore));
        scoreBuckets[bucketIndex]++;

        if (newScore > 20 && (!contact.lastOpenedAt || contact.lastOpenedAt < fourteenDaysAgo)) {
          needsAttentionCount++;
        }
      }
    }

    if (!page.isDone) {
      // Schedule next batch
      await ctx.scheduler.runAfter(0, internal.leadScoring._recalculateScoresBatch, {
        storeId: args.storeId,
        cursor: page.continueCursor,
        updated,
        total,
        hotCount,
        warmCount,
        coldCount,
        inactiveCount,
        totalSubscribed,
        totalScore,
        needsAttentionCount,
        scoreBuckets,
      });
    } else {
      // Final batch - save summary
      const now = Date.now();
      const existingSummary = await ctx.db
        .query("leadScoringSummary")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .first();

      if (existingSummary) {
        await ctx.db.patch(existingSummary._id, {
          hotCount,
          warmCount,
          coldCount,
          inactiveCount,
          totalSubscribed,
          totalScore,
          needsAttentionCount,
          scoreBuckets,
          lastRebuiltAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("leadScoringSummary", {
          storeId: args.storeId,
          hotCount,
          warmCount,
          coldCount,
          inactiveCount,
          totalSubscribed,
          totalScore,
          needsAttentionCount,
          scoreBuckets,
          lastRebuiltAt: now,
          updatedAt: now,
        });
      }
    }

    return { updated, total, isDone: page.isDone };
  },
});

// Recalculate all scores for a store
// IMPORTANT: Uses scheduled internal mutations to process contacts in batches,
// avoiding Convex's single-paginate-per-function limit. Returns immediately
// while background processing continues.
export const recalculateAllScores = mutation({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    // Kick off the first batch (it will schedule subsequent batches)
    await ctx.scheduler.runAfter(0, internal.leadScoring._recalculateScoresBatch, {
      storeId: args.storeId,
      cursor: null,
      updated: 0,
      total: 0,
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      inactiveCount: 0,
      totalSubscribed: 0,
      totalScore: 0,
      needsAttentionCount: 0,
      scoreBuckets: new Array(101).fill(0),
    });

    // Return immediately - processing happens in background
    return { status: "processing", message: "Score recalculation started in background" };
  },
});

// Get lead scoring summary
// IMPORTANT: This query reads from the pre-aggregated leadScoringSummary table
// to avoid exceeding Convex's 32k document read limit. The summary is updated
// incrementally when contact scores change, or can be rebuilt via rebuildLeadScoringSummary.
export const getLeadScoringSummary = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    // Read from pre-aggregated summary table (single doc read)
    const summary = await ctx.db
      .query("leadScoringSummary")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (!summary || summary.totalSubscribed === 0) {
      return {
        averageScore: 0,
        medianScore: 0,
        distribution: { hot: 0, warm: 0, cold: 0, inactive: 0 },
        topPerformers: 0,
        needsAttention: 0,
        total: 0,
      };
    }

    // Calculate median from score buckets if available
    let medianScore = 0;
    if (summary.scoreBuckets && summary.scoreBuckets.length > 0) {
      const halfCount = Math.floor(summary.totalSubscribed / 2);
      let cumulative = 0;
      for (let score = 0; score <= 100; score++) {
        cumulative += summary.scoreBuckets[score] || 0;
        if (cumulative >= halfCount) {
          medianScore = score;
          break;
        }
      }
    }

    return {
      averageScore: summary.totalSubscribed > 0
        ? Math.round(summary.totalScore / summary.totalSubscribed)
        : 0,
      medianScore,
      distribution: {
        hot: summary.hotCount,
        warm: summary.warmCount,
        cold: summary.coldCount,
        inactive: summary.inactiveCount,
      },
      topPerformers: summary.hotCount,
      needsAttention: summary.needsAttentionCount,
      total: summary.totalSubscribed,
    };
  },
});

// Internal mutation to process a batch for summary rebuild
// Uses a single paginate call per invocation (Convex requirement)
export const _rebuildSummaryBatch = internalMutation({
  args: {
    storeId: v.string(),
    cursor: v.union(v.string(), v.null()),
    hotCount: v.number(),
    warmCount: v.number(),
    coldCount: v.number(),
    inactiveCount: v.number(),
    totalSubscribed: v.number(),
    totalScore: v.number(),
    needsAttentionCount: v.number(),
    scoreBuckets: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 1000;
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    let { hotCount, warmCount, coldCount, inactiveCount, totalSubscribed, totalScore, needsAttentionCount } = args;
    const scoreBuckets = [...args.scoreBuckets];

    // Single paginate call per function invocation
    const page = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "subscribed")
      )
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    for (const contact of page.page) {
      const score = contact.engagementScore || 0;
      totalSubscribed++;
      totalScore += score;

      if (score >= 70) hotCount++;
      else if (score >= 40) warmCount++;
      else if (score >= 10) coldCount++;
      else inactiveCount++;

      const bucketIndex = Math.max(0, Math.min(100, Math.round(score)));
      scoreBuckets[bucketIndex]++;

      if (score > 20 && (!contact.lastOpenedAt || contact.lastOpenedAt < fourteenDaysAgo)) {
        needsAttentionCount++;
      }
    }

    if (!page.isDone) {
      // Schedule next batch
      await ctx.scheduler.runAfter(0, internal.leadScoring._rebuildSummaryBatch, {
        storeId: args.storeId,
        cursor: page.continueCursor,
        hotCount,
        warmCount,
        coldCount,
        inactiveCount,
        totalSubscribed,
        totalScore,
        needsAttentionCount,
        scoreBuckets,
      });
    } else {
      // Final batch - save summary
      const now = Date.now();
      const existingSummary = await ctx.db
        .query("leadScoringSummary")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .first();

      if (existingSummary) {
        await ctx.db.patch(existingSummary._id, {
          hotCount,
          warmCount,
          coldCount,
          inactiveCount,
          totalSubscribed,
          totalScore,
          needsAttentionCount,
          scoreBuckets,
          lastRebuiltAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("leadScoringSummary", {
          storeId: args.storeId,
          hotCount,
          warmCount,
          coldCount,
          inactiveCount,
          totalSubscribed,
          totalScore,
          needsAttentionCount,
          scoreBuckets,
          lastRebuiltAt: now,
          updatedAt: now,
        });
      }
    }

    return { totalSubscribed, isDone: page.isDone };
  },
});

// Rebuild lead scoring summary from scratch
// IMPORTANT: Uses scheduled internal mutations to process contacts in batches,
// avoiding Convex's single-paginate-per-function limit.
export const rebuildLeadScoringSummary = mutation({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    // Kick off the first batch
    await ctx.scheduler.runAfter(0, internal.leadScoring._rebuildSummaryBatch, {
      storeId: args.storeId,
      cursor: null,
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      inactiveCount: 0,
      totalSubscribed: 0,
      totalScore: 0,
      needsAttentionCount: 0,
      scoreBuckets: new Array(101).fill(0),
    });

    return { status: "processing", message: "Summary rebuild started in background" };
  },
});
