import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
export const getScoreDistribution = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    const distribution = {
      hot: 0, // 70-100
      warm: 0, // 40-69
      cold: 0, // 10-39
      inactive: 0, // 0-9
    };

    for (const contact of contacts) {
      const score = contact.engagementScore || 0;
      if (score >= 70) distribution.hot++;
      else if (score >= 40) distribution.warm++;
      else if (score >= 10) distribution.cold++;
      else distribution.inactive++;
    }

    return {
      distribution,
      total: contacts.length,
    };
  },
});

// Get top leads
export const getTopLeads = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    // Sort by engagement score
    const sortedContacts = contacts
      .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
      .slice(0, limit);

    return sortedContacts.map((c) => ({
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
export const getLeadsNeedingAttention = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get contacts who haven't engaged in 14+ days
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "subscribed"),
          q.or(
            q.eq(q.field("lastOpenedAt"), undefined),
            q.lt(q.field("lastOpenedAt"), fourteenDaysAgo)
          )
        )
      )
      .collect();

    // Sort by engagement score (show those with higher potential first)
    const sortedContacts = contacts
      .filter((c) => (c.engagementScore || 0) > 20) // Only show those who were somewhat engaged
      .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
      .slice(0, limit);

    return sortedContacts.map((c) => ({
      _id: c._id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      score: c.engagementScore || 0,
      daysSinceLastOpen: c.lastOpenedAt
        ? Math.floor((Date.now() - c.lastOpenedAt) / (1000 * 60 * 60 * 24))
        : null,
      emailsSent: c.emailsSent,
    }));
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
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("leadScoreHistory")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(limit);

    return history;
  },
});

// Recalculate all scores for a store
export const recalculateAllScores = mutation({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    let updated = 0;

    for (const contact of contacts) {
      // Simple engagement score calculation
      const openRate = contact.emailsSent > 0 ? (contact.emailsOpened / contact.emailsSent) * 100 : 0;
      const clickRate = contact.emailsOpened > 0 ? (contact.emailsClicked / contact.emailsOpened) * 100 : 0;
      const daysSinceLastOpen = contact.lastOpenedAt
        ? Math.floor((Date.now() - contact.lastOpenedAt) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate score (0-100)
      let score = 0;
      score += Math.min(30, openRate * 0.6); // Up to 30 points for open rate
      score += Math.min(30, clickRate * 0.6); // Up to 30 points for click rate
      score += contact.tagIds?.length > 0 ? 10 : 0; // 10 points for having tags
      score += daysSinceLastOpen < 7 ? 20 : daysSinceLastOpen < 30 ? 10 : 0; // Recency bonus
      score -= contact.status === "unsubscribed" ? 50 : 0; // Penalty for unsubscribed

      const newScore = Math.max(0, Math.min(100, Math.round(score)));

      if (contact.engagementScore !== newScore) {
        await ctx.db.patch(contact._id, {
          engagementScore: newScore,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }

    return { updated, total: contacts.length };
  },
});

// Get lead scoring summary
export const getLeadScoringSummary = query({
  args: {
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    if (contacts.length === 0) {
      return {
        averageScore: 0,
        medianScore: 0,
        distribution: { hot: 0, warm: 0, cold: 0, inactive: 0 },
        topPerformers: 0,
        needsAttention: 0,
        total: 0,
      };
    }

    const scores = contacts.map((c) => c.engagementScore || 0);
    const sortedScores = [...scores].sort((a, b) => a - b);

    const distribution = {
      hot: scores.filter((s) => s >= 70).length,
      warm: scores.filter((s) => s >= 40 && s < 70).length,
      cold: scores.filter((s) => s >= 10 && s < 40).length,
      inactive: scores.filter((s) => s < 10).length,
    };

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const needsAttention = contacts.filter(
      (c) => (c.engagementScore || 0) > 20 && (!c.lastOpenedAt || c.lastOpenedAt < fourteenDaysAgo)
    ).length;

    return {
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      medianScore: sortedScores[Math.floor(sortedScores.length / 2)],
      distribution,
      topPerformers: distribution.hot,
      needsAttention,
      total: contacts.length,
    };
  },
});
