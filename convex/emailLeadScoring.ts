/**
 * Lead Scoring System - Track and score user engagement
 * ActiveCampaign-level lead scoring with engagement tracking
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// SCORING RULES (Points)
// ============================================================================

const SCORING_RULES = {
  EMAIL_OPENED: 5,
  EMAIL_CLICKED: 10,
  COURSE_ENROLLED: 25,
  COURSE_PROGRESS_50: 15,
  COURSE_COMPLETED: 50,
  PURCHASE: 100,
  QUIZ_COMPLETED: 10,
  CERTIFICATE_EARNED: 30,
  INACTIVE_DAY_PENALTY: -1,
  BOUNCE_PENALTY: -10,
  UNSUBSCRIBE_PENALTY: -100,
} as const;

const GRADE_THRESHOLDS = {
  A: 300, // Hot leads
  B: 200, // Warm leads
  C: 100, // Cold leads
  D: 0,   // Inactive
} as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get lead score for a user
 */
export const getUserLeadScore = query({
  args: {
    userId: v.string(), // Clerk ID
  },
  returns: v.union(
    v.object({
      userId: v.string(),
      score: v.number(),
      grade: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
      emailEngagement: v.number(),
      courseEngagement: v.number(),
      purchaseActivity: v.number(),
      lastActivity: v.number(),
      totalEmailsOpened: v.number(),
      totalEmailsClicked: v.number(),
      totalPurchases: v.number(),
      daysSinceLastActivity: v.number(),
      scoreHistory: v.array(v.object({
        score: v.number(),
        reason: v.string(),
        timestamp: v.number(),
      })),
      lastDecayAt: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      _id: v.id("leadScores"),
      _creationTime: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("leadScores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    return score;
  },
});

/**
 * Get top leads by score
 */
export const getTopLeads = query({
  args: {
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
    grade: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let scores;
    
    if (args.grade !== undefined) {
      scores = await ctx.db
        .query("leadScores")
        .withIndex("by_grade", (q) => q.eq("grade", args.grade as "A" | "B" | "C" | "D"))
        .order("desc")
        .take(limit);
    } else {
      scores = await ctx.db
        .query("leadScores")
        .withIndex("by_score")
        .order("desc")
        .take(limit);
    }
    
    // Filter by minimum score if provided
    const filtered = args.minScore !== undefined
      ? scores.filter(s => s.score >= args.minScore!)
      : scores;
    
    return filtered;
  },
});

/**
 * Get lead score distribution
 */
export const getLeadScoreDistribution = query({
  args: {},
  returns: v.object({
    totalLeads: v.number(),
    gradeA: v.number(),
    gradeB: v.number(),
    gradeC: v.number(),
    gradeD: v.number(),
    averageScore: v.number(),
  }),
  handler: async (ctx) => {
    const allScores = await ctx.db.query("leadScores").take(5000);
    
    const distribution = {
      totalLeads: allScores.length,
      gradeA: allScores.filter(s => s.grade === "A").length,
      gradeB: allScores.filter(s => s.grade === "B").length,
      gradeC: allScores.filter(s => s.grade === "C").length,
      gradeD: allScores.filter(s => s.grade === "D").length,
      averageScore: allScores.length > 0 
        ? allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length 
        : 0,
    };
    
    return distribution;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update lead score based on activity
 */
export const updateLeadScore = mutation({
  args: {
    userId: v.string(),
    activityType: v.union(
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("course_enrolled"),
      v.literal("course_progress_50"),
      v.literal("course_completed"),
      v.literal("purchase"),
      v.literal("quiz_completed"),
      v.literal("certificate_earned"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    ),
    metadata: v.optional(v.any()),
  },
  returns: v.object({
    newScore: v.number(),
    newGrade: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    pointsAdded: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get existing score or create new one
    let scoreDoc = await ctx.db
      .query("leadScores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    // Calculate points to add
    const pointsMap: Record<string, number> = {
      email_opened: SCORING_RULES.EMAIL_OPENED,
      email_clicked: SCORING_RULES.EMAIL_CLICKED,
      course_enrolled: SCORING_RULES.COURSE_ENROLLED,
      course_progress_50: SCORING_RULES.COURSE_PROGRESS_50,
      course_completed: SCORING_RULES.COURSE_COMPLETED,
      purchase: SCORING_RULES.PURCHASE,
      quiz_completed: SCORING_RULES.QUIZ_COMPLETED,
      certificate_earned: SCORING_RULES.CERTIFICATE_EARNED,
      bounced: SCORING_RULES.BOUNCE_PENALTY,
      unsubscribed: SCORING_RULES.UNSUBSCRIBE_PENALTY,
    };
    
    const pointsToAdd = pointsMap[args.activityType];
    
    if (!scoreDoc) {
      // Create new score document
      const newScore = Math.max(0, pointsToAdd);
      const grade = calculateGrade(newScore);
      
      await ctx.db.insert("leadScores", {
        userId: args.userId,
        score: newScore,
        grade,
        emailEngagement: args.activityType.startsWith("email_") ? pointsToAdd : 0,
        courseEngagement: args.activityType.startsWith("course_") || args.activityType === "quiz_completed" || args.activityType === "certificate_earned" ? pointsToAdd : 0,
        purchaseActivity: args.activityType === "purchase" ? pointsToAdd : 0,
        lastActivity: now,
        totalEmailsOpened: args.activityType === "email_opened" ? 1 : 0,
        totalEmailsClicked: args.activityType === "email_clicked" ? 1 : 0,
        totalPurchases: args.activityType === "purchase" ? 1 : 0,
        daysSinceLastActivity: 0,
        scoreHistory: [{
          score: newScore,
          reason: `Initial score from ${args.activityType}`,
          timestamp: now,
        }],
        lastDecayAt: now,
        createdAt: now,
        updatedAt: now,
      });
      
      return {
        newScore,
        newGrade: grade,
        pointsAdded: pointsToAdd,
      };
    }
    
    // Update existing score
    const newScore = Math.max(0, scoreDoc.score + pointsToAdd);
    const newGrade = calculateGrade(newScore);
    
    // Update engagement breakdown
    const emailEngagement = args.activityType.startsWith("email_") 
      ? scoreDoc.emailEngagement + pointsToAdd 
      : scoreDoc.emailEngagement;
    const courseEngagement = args.activityType.startsWith("course_") || args.activityType === "quiz_completed" || args.activityType === "certificate_earned"
      ? scoreDoc.courseEngagement + pointsToAdd 
      : scoreDoc.courseEngagement;
    const purchaseActivity = args.activityType === "purchase" 
      ? scoreDoc.purchaseActivity + pointsToAdd 
      : scoreDoc.purchaseActivity;
    
    // Update counters
    const totalEmailsOpened = args.activityType === "email_opened" 
      ? scoreDoc.totalEmailsOpened + 1 
      : scoreDoc.totalEmailsOpened;
    const totalEmailsClicked = args.activityType === "email_clicked" 
      ? scoreDoc.totalEmailsClicked + 1 
      : scoreDoc.totalEmailsClicked;
    const totalPurchases = args.activityType === "purchase" 
      ? scoreDoc.totalPurchases + 1 
      : scoreDoc.totalPurchases;
    
    // Add to history (keep last 10)
    const scoreHistory = [
      {
        score: newScore,
        reason: `${args.activityType} (+${pointsToAdd})`,
        timestamp: now,
      },
      ...scoreDoc.scoreHistory.slice(0, 9),
    ];
    
    await ctx.db.patch(scoreDoc._id, {
      score: newScore,
      grade: newGrade,
      emailEngagement,
      courseEngagement,
      purchaseActivity,
      lastActivity: now,
      totalEmailsOpened,
      totalEmailsClicked,
      totalPurchases,
      daysSinceLastActivity: 0,
      scoreHistory,
      updatedAt: now,
    });
    
    return {
      newScore,
      newGrade,
      pointsAdded: pointsToAdd,
    };
  },
});

/**
 * Apply time-based score decay for inactive users (Internal - called by cron)
 */
export const applyScoreDecay = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    decayed: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Get all scores
    const allScores = await ctx.db.query("leadScores").take(5000);
    
    let processed = 0;
    let decayed = 0;
    
    for (const scoreDoc of allScores) {
      processed++;
      
      // Calculate days since last activity
      const daysSinceLastActivity = Math.floor((now - scoreDoc.lastActivity) / oneDayMs);
      
      // Calculate days since last decay
      const daysSinceLastDecay = Math.floor((now - scoreDoc.lastDecayAt) / oneDayMs);
      
      // Only decay if at least 1 day has passed since last decay
      if (daysSinceLastDecay > 0) {
        // Decay: -1 point per day of inactivity
        const decayPoints = daysSinceLastDecay * SCORING_RULES.INACTIVE_DAY_PENALTY;
        const newScore = Math.max(0, scoreDoc.score + decayPoints);
        const newGrade = calculateGrade(newScore);
        
        if (newScore !== scoreDoc.score) {
          decayed++;
          
          // Add to history
          const scoreHistory = [
            {
              score: newScore,
              reason: `Time decay: ${daysSinceLastDecay} days inactive (${decayPoints})`,
              timestamp: now,
            },
            ...scoreDoc.scoreHistory.slice(0, 9),
          ];
          
          await ctx.db.patch(scoreDoc._id, {
            score: newScore,
            grade: newGrade,
            daysSinceLastActivity,
            scoreHistory,
            lastDecayAt: now,
            updatedAt: now,
          });
        }
      }
    }
    
    return { processed, decayed };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= GRADE_THRESHOLDS.A) return "A";
  if (score >= GRADE_THRESHOLDS.B) return "B";
  if (score >= GRADE_THRESHOLDS.C) return "C";
  return "D";
}

