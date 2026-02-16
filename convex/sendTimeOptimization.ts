/**
 * Send Time Optimization
 * AI-powered optimal send time prediction (ActiveCampaign-level)
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get user's engagement pattern
 */
export const getUserEngagementPattern = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userEngagementPatterns")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

/**
 * Get optimal send time for user
 */
export const getOptimalSendTime = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    hour: v.number(),
    day: v.number(),
    score: v.number(),
    timezone: v.optional(v.string()),
    hasEnoughData: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pattern = await ctx.db
      .query("userEngagementPatterns")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!pattern || pattern.totalEngagements < 5) {
      // Not enough data, return default best time
      return {
        hour: 10, // 10 AM
        day: 2,   // Tuesday
        score: 0,
        hasEnoughData: false,
      };
    }
    
    return {
      hour: pattern.bestSendTime.hour,
      day: pattern.bestSendTime.day,
      score: pattern.bestSendTime.score,
      timezone: pattern.timezone,
      hasEnoughData: true,
    };
  },
});

/**
 * Get optimal send time for campaign (aggregate)
 */
export const getOptimalCampaignSendTime = query({
  args: {
    recipientUserIds: v.array(v.string()),
  },
  returns: v.object({
    recommendedTime: v.object({
      hour: v.number(),
      day: v.number(),
      timezone: v.string(),
    }),
    usersWithData: v.number(),
    totalUsers: v.number(),
    confidence: v.number(),
  }),
  handler: async (ctx, args) => {
    const patterns = await Promise.all(
      args.recipientUserIds.map(userId =>
        ctx.db
          .query("userEngagementPatterns")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
      )
    );
    
    const validPatterns = patterns.filter(p => p && p.totalEngagements >= 5);
    
    if (validPatterns.length === 0) {
      // No data, return default best time
      return {
        recommendedTime: {
          hour: 10,
          day: 2,
          timezone: "America/New_York",
        },
        usersWithData: 0,
        totalUsers: args.recipientUserIds.length,
        confidence: 0,
      };
    }
    
    // Aggregate hour preferences
    const hourScores: number[] = new Array(24).fill(0);
    const dayScores: number[] = new Array(7).fill(0);
    
    for (const pattern of validPatterns) {
      if (!pattern) continue;
      
      // Add weighted scores
      pattern.hourOfDay.forEach((score, hour) => {
        hourScores[hour] += score;
      });
      
      pattern.dayOfWeek.forEach((score, day) => {
        dayScores[day] += score;
      });
    }
    
    // Find best hour and day
    const bestHour = hourScores.indexOf(Math.max(...hourScores));
    const bestDay = dayScores.indexOf(Math.max(...dayScores));
    
    // Calculate confidence
    const confidence = Math.min(100, (validPatterns.length / args.recipientUserIds.length) * 100);
    
    return {
      recommendedTime: {
        hour: bestHour,
        day: bestDay,
        timezone: validPatterns[0]?.timezone || "America/New_York",
      },
      usersWithData: validPatterns.length,
      totalUsers: args.recipientUserIds.length,
      confidence: Math.round(confidence),
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Track email engagement (opens/clicks) to build pattern
 */
export const trackEngagement = mutation({
  args: {
    userId: v.string(),
    engagementType: v.union(v.literal("open"), v.literal("click")),
    timestamp: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    updatedPattern: v.any(),
  }),
  handler: async (ctx, args) => {
    const timestamp = args.timestamp || Date.now();
    const date = new Date(timestamp);
    
    // Extract hour and day
    const hour = date.getHours(); // 0-23
    const day = date.getDay();    // 0-6 (Sunday=0)
    
    // Get or create pattern
    let pattern = await ctx.db
      .query("userEngagementPatterns")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!pattern) {
      // Create new pattern
      const patternId = await ctx.db.insert("userEngagementPatterns", {
        userId: args.userId,
        hourOfDay: new Array(24).fill(0),
        dayOfWeek: new Array(7).fill(0),
        bestSendTime: { hour: 10, day: 2, score: 0 },
        timezone: args.timezone || "America/New_York",
        totalEngagements: 0,
        lastEngagement: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      
      pattern = await ctx.db.get(patternId);
      if (!pattern) {
        return { success: false, updatedPattern: null };
      }
    }
    
    // Update engagement scores
    const hourOfDay = [...pattern.hourOfDay];
    const dayOfWeek = [...pattern.dayOfWeek];
    
    // Increment score (weight clicks higher than opens)
    const weight = args.engagementType === "click" ? 2 : 1;
    hourOfDay[hour] += weight;
    dayOfWeek[day] += weight;
    
    // Find best send time
    const bestHour = hourOfDay.indexOf(Math.max(...hourOfDay));
    const bestDay = dayOfWeek.indexOf(Math.max(...dayOfWeek));
    const bestScore = Math.max(...hourOfDay) + Math.max(...dayOfWeek);
    
    // Update pattern
    await ctx.db.patch(pattern._id, {
      hourOfDay,
      dayOfWeek,
      bestSendTime: {
        hour: bestHour,
        day: bestDay,
        score: bestScore,
      },
      totalEngagements: pattern.totalEngagements + 1,
      lastEngagement: timestamp,
      updatedAt: timestamp,
    });
    
    const updatedPattern = await ctx.db.get(pattern._id);
    
    return {
      success: true,
      updatedPattern,
    };
  },
});

/**
 * Schedule campaign with optimal send time
 */
export const scheduleWithOptimalTime = mutation({
  args: {
    campaignId: v.id("resendCampaigns"),
    recipientUserIds: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    scheduledFor: v.number(),
    timezone: v.string(),
    confidence: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get campaign
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Get recipient IDs if not provided
    let recipientUserIds = args.recipientUserIds;
    if (!recipientUserIds) {
      // This would need to be implemented based on campaign targeting
      // For now, just return error
      throw new Error("Recipient user IDs required");
    }
    
    // Get optimal time
    const patterns = await Promise.all(
      recipientUserIds.map(userId =>
        ctx.db
          .query("userEngagementPatterns")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
      )
    );
    
    const validPatterns = patterns.filter(p => p && p.totalEngagements >= 5);
    
    let hour = 10; // Default
    let day = 2;   // Default (Tuesday)
    let timezone = "America/New_York";
    let confidence = 0;
    
    if (validPatterns.length > 0) {
      // Aggregate
      const hourScores: number[] = new Array(24).fill(0);
      const dayScores: number[] = new Array(7).fill(0);
      
      for (const pattern of validPatterns) {
        if (pattern) {
          pattern.hourOfDay.forEach((score, h) => {
            hourScores[h] += score;
          });
          
          pattern.dayOfWeek.forEach((score, d) => {
            dayScores[d] += score;
          });
        }
      }
      
      hour = hourScores.indexOf(Math.max(...hourScores));
      day = dayScores.indexOf(Math.max(...dayScores));
      timezone = validPatterns[0]?.timezone || "America/New_York";
      confidence = Math.min(100, (validPatterns.length / recipientUserIds.length) * 100);
    }
    
    // Calculate next occurrence of that day and hour
    const now = new Date();
    const scheduledDate = getNextOccurrence(day, hour, timezone);
    
    // Update campaign
    await ctx.db.patch(args.campaignId, {
      scheduledFor: scheduledDate.getTime(),
      status: "scheduled",
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      scheduledFor: scheduledDate.getTime(),
      timezone,
      confidence: Math.round(confidence),
    };
  },
});

/**
 * Decay engagement scores over time (cron job)
 */
export const decayEngagementScores = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    const allPatterns = await ctx.db.query("userEngagementPatterns").take(1000);
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    let processed = 0;
    let updated = 0;
    
    for (const pattern of allPatterns) {
      processed++;
      
      // Apply decay to scores if last engagement was over 30 days ago
      if (pattern.lastEngagement < thirtyDaysAgo) {
        const decayFactor = 0.9; // 10% decay
        
        const hourOfDay = pattern.hourOfDay.map(score => Math.round(score * decayFactor));
        const dayOfWeek = pattern.dayOfWeek.map(score => Math.round(score * decayFactor));
        
        // Recalculate best send time
        const bestHour = hourOfDay.indexOf(Math.max(...hourOfDay));
        const bestDay = dayOfWeek.indexOf(Math.max(...dayOfWeek));
        const bestScore = Math.max(...hourOfDay) + Math.max(...dayOfWeek);
        
        await ctx.db.patch(pattern._id, {
          hourOfDay,
          dayOfWeek,
          bestSendTime: {
            hour: bestHour,
            day: bestDay,
            score: bestScore,
          },
          updatedAt: now,
        });
        
        updated++;
      }
    }
    
    return { processed, updated };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get next occurrence of a day and hour
 */
function getNextOccurrence(targetDay: number, targetHour: number, timezone: string): Date {
  const now = new Date();
  
  // Create date for next occurrence
  const next = new Date(now);
  next.setHours(targetHour, 0, 0, 0);
  
  // Get current day (0-6)
  const currentDay = now.getDay();
  
  // Calculate days until target day
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  } else if (daysUntil === 0 && now.getHours() >= targetHour) {
    // If today is the target day but we've passed the hour, schedule for next week
    daysUntil = 7;
  }
  
  // Set the date
  next.setDate(next.getDate() + daysUntil);
  
  return next;
}

