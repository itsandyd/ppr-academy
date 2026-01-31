/**
 * Funnel Queries - Track user journeys through conversion funnels
 * Supports both learner and creator funnels with optional store scoping
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get learner funnel: Visit → Signup → Enroll → Return Week 2
 */
export const getLearnerFunnel = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    storeId: v.optional(v.string()), // Optional: filter to creator's courses
  },
  returns: v.object({
    steps: v.array(
      v.object({
        name: v.string(),
        count: v.number(),
        conversionRate: v.number(),
        dropOff: v.number(),
      })
    ),
    totalDuration: v.object({
      median: v.number(),
      average: v.number(),
    }),
  }),
  handler: async (ctx, { startTime, endTime, storeId }) => {
    // Step 1: Visits (page views)
    // Note: Using filter instead of withIndex due to TypeScript limitations
    const allVisits = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      )
      .collect();
    
    const visits = storeId
      ? allVisits.filter((e) => e.storeId === storeId && e.eventType === "page_view")
      : allVisits.filter((e) => e.eventType === "page_view");
    
    const uniqueVisitors = new Set(
      visits.map((v) => v.userId || v.sessionId).filter(Boolean)
    );
    
    // Step 2: Signups
    // Note: Using filter instead of withIndex due to TypeScript limitations
    const allSignups = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime),
          q.eq(q.field("eventType"), "signup")
        )
      )
      .collect();
    
    const signups = storeId
      ? allSignups.filter((e) => e.storeId === storeId)
      : allSignups;
    
    const signupUserIds = new Set(signups.map((s) => s.userId));
    
    // Step 3: Enrollments (from analyticsEvents table with "enrollment" event type)
    const allEnrollments = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime),
          q.eq(q.field("eventType"), "enrollment")
        )
      )
      .collect();
    
    let enrolledUsers: Set<string>;
    
    if (storeId) {
      // Filter to store's courses
      const store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("_id"), storeId))
        .first();

      if (store) {
        const storeCourses = await ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", store.userId))
          .collect();

        const storeCourseIds = new Set(storeCourses.map((c) => c._id));

        enrolledUsers = new Set(
          allEnrollments
            .filter((e) => e.resourceId && storeCourseIds.has(e.resourceId as any) && signupUserIds.has(e.userId))
            .map((e) => e.userId)
        );
      } else {
        enrolledUsers = new Set();
      }
    } else {
      enrolledUsers = new Set(
        allEnrollments
          .filter((e) => signupUserIds.has(e.userId))
          .map((e) => e.userId)
      );
    }
    
    // Step 4: Week 2 returns (users who return 7-14 days after signup)
    const week2Start = endTime + (7 * 24 * 60 * 60 * 1000);
    const week2End = endTime + (14 * 24 * 60 * 60 * 1000);
    
    // Note: Using filter instead of withIndex due to TypeScript limitations
    const week2Events = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), week2Start),
          q.lte(q.field("timestamp"), week2End),
          q.eq(q.field("eventType"), "page_view")
        )
      )
      .collect();
    
    const returnedUsers = new Set(
      week2Events
        .filter((v) => signupUserIds.has(v.userId))
        .map((v) => v.userId)
    );
    
    // Calculate steps
    const visitCount = uniqueVisitors.size;
    const signupCount = signups.length;
    const enrollCount = enrolledUsers.size;
    const returnCount = returnedUsers.size;

    // Calculate funnel duration (time from first visit to enrollment)
    // Build a map of user timestamps for each stage
    const userVisitTimes: Record<string, number> = {};
    const userEnrollTimes: Record<string, number> = {};

    for (const visit of visits) {
      const userId = visit.userId || visit.sessionId;
      if (userId && (!userVisitTimes[userId] || visit.timestamp < userVisitTimes[userId])) {
        userVisitTimes[userId] = visit.timestamp;
      }
    }

    for (const enrollment of allEnrollments) {
      if (!userEnrollTimes[enrollment.userId] || enrollment.timestamp < userEnrollTimes[enrollment.userId]) {
        userEnrollTimes[enrollment.userId] = enrollment.timestamp;
      }
    }

    // Calculate durations for users who completed the funnel
    const funnelDurations: number[] = [];
    for (const userId of enrolledUsers) {
      if (userVisitTimes[userId] && userEnrollTimes[userId]) {
        const duration = userEnrollTimes[userId] - userVisitTimes[userId];
        if (duration > 0) {
          funnelDurations.push(duration);
        }
      }
    }

    // Calculate median and average duration (in hours)
    let median = 0;
    let average = 0;

    if (funnelDurations.length > 0) {
      // Sort for median
      const sorted = [...funnelDurations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

      // Convert to hours
      median = Math.round(median / (1000 * 60 * 60) * 10) / 10;

      // Calculate average in hours
      const sum = funnelDurations.reduce((a, b) => a + b, 0);
      average = Math.round((sum / funnelDurations.length) / (1000 * 60 * 60) * 10) / 10;
    }

    return {
      steps: [
        {
          name: "Visit",
          count: visitCount,
          conversionRate: 100,
          dropOff: 0,
        },
        {
          name: "Signup",
          count: signupCount,
          conversionRate: visitCount > 0 ? (signupCount / visitCount) * 100 : 0,
          dropOff: visitCount > 0 ? ((visitCount - signupCount) / visitCount) * 100 : 0,
        },
        {
          name: "Enroll",
          count: enrollCount,
          conversionRate: signupCount > 0 ? (enrollCount / signupCount) * 100 : 0,
          dropOff: signupCount > 0 ? ((signupCount - enrollCount) / signupCount) * 100 : 0,
        },
        {
          name: "Return Week 2",
          count: returnCount,
          conversionRate: signupCount > 0 ? (returnCount / signupCount) * 100 : 0,
          dropOff: enrollCount > 0 ? ((enrollCount - returnCount) / enrollCount) * 100 : 0,
        },
      ],
      totalDuration: {
        median, // Time in hours from visit to enrollment
        average,
      },
    };
  },
});

/**
 * Get creator funnel: Visit → Start Creator Flow → Publish → First Sale
 */
export const getCreatorFunnel = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    storeId: v.optional(v.string()), // Not typically used for creator funnel (they're the creator!)
  },
  returns: v.object({
    steps: v.array(
      v.object({
        name: v.string(),
        count: v.number(),
        conversionRate: v.number(),
        dropOff: v.number(),
        medianTimeToNext: v.optional(v.number()), // Days
      })
    ),
    stuckCreators: v.array(
      v.object({
        userId: v.string(),
        currentStep: v.string(),
        daysSinceStep: v.number(),
      })
    ),
  }),
  handler: async (ctx, { startTime, endTime }) => {
    // Query all relevant events
    // Note: Using filter instead of withIndex due to TypeScript limitations
    const events = await ctx.db
      .query("analyticsEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime)
        )
      )
      .collect();
    
    // Step 1: Visits
    const visits = events.filter((e) => e.eventType === "page_view");
    const uniqueVisitors = new Set(
      visits.map((v) => v.userId || v.sessionId).filter(Boolean)
    );
    
    // Step 2: Started creator flow
    const creatorStarts = events.filter((e) => e.eventType === "creator_started");
    const startedUserIds = new Set(creatorStarts.map((e) => e.userId));
    
    // Step 3: Published first item
    const published = events.filter((e) => e.eventType === "creator_published");
    const publishedUserIds = new Set(published.map((e) => e.userId));
    
    // Step 4: First sale
    const firstSales = events.filter((e) => e.eventType === "first_sale");
    const firstSaleUserIds = new Set(firstSales.map((e) => e.userId));
    
    // Find stuck creators (started but not published after 3+ days)
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const stuckCreatorsList = creatorStarts
      .filter((e) => {
        const published = publishedUserIds.has(e.userId);
        const isOld = e.timestamp < threeDaysAgo;
        return !published && isOld;
      })
      .map((e) => ({
        userId: e.userId,
        currentStep: "drafting",
        daysSinceStep: Math.floor((Date.now() - e.timestamp) / (24 * 60 * 60 * 1000)),
      }));
    
    const visitCount = uniqueVisitors.size;
    const startCount = creatorStarts.length;
    const publishCount = published.length;
    const saleCount = firstSales.length;

    // Calculate time between steps (median in days)
    // Build maps of user timestamps for each step
    const userStartTimes: Record<string, number> = {};
    const userPublishTimes: Record<string, number> = {};
    const userSaleTimes: Record<string, number> = {};

    for (const event of creatorStarts) {
      if (!userStartTimes[event.userId] || event.timestamp < userStartTimes[event.userId]) {
        userStartTimes[event.userId] = event.timestamp;
      }
    }

    for (const event of published) {
      if (!userPublishTimes[event.userId] || event.timestamp < userPublishTimes[event.userId]) {
        userPublishTimes[event.userId] = event.timestamp;
      }
    }

    for (const event of firstSales) {
      if (!userSaleTimes[event.userId] || event.timestamp < userSaleTimes[event.userId]) {
        userSaleTimes[event.userId] = event.timestamp;
      }
    }

    // Helper to calculate median in days
    const calculateMedianDays = (durations: number[]): number => {
      if (durations.length === 0) return 0;
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const medianMs = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      return Math.round(medianMs / (1000 * 60 * 60 * 24) * 10) / 10;
    };

    // Time from start to publish
    const startToPublishDurations: number[] = [];
    for (const userId of publishedUserIds) {
      if (userStartTimes[userId] && userPublishTimes[userId]) {
        const duration = userPublishTimes[userId] - userStartTimes[userId];
        if (duration > 0) {
          startToPublishDurations.push(duration);
        }
      }
    }

    // Time from publish to first sale
    const publishToSaleDurations: number[] = [];
    for (const userId of firstSaleUserIds) {
      if (userPublishTimes[userId] && userSaleTimes[userId]) {
        const duration = userSaleTimes[userId] - userPublishTimes[userId];
        if (duration > 0) {
          publishToSaleDurations.push(duration);
        }
      }
    }

    const medianStartToPublish = calculateMedianDays(startToPublishDurations);
    const medianPublishToSale = calculateMedianDays(publishToSaleDurations);

    return {
      steps: [
        {
          name: "Visit",
          count: visitCount,
          conversionRate: 100,
          dropOff: 0,
        },
        {
          name: "Start Creator Flow",
          count: startCount,
          conversionRate: visitCount > 0 ? (startCount / visitCount) * 100 : 0,
          dropOff: visitCount > 0 ? ((visitCount - startCount) / visitCount) * 100 : 0,
          medianTimeToNext: medianStartToPublish,
        },
        {
          name: "Publish First Item",
          count: publishCount,
          conversionRate: startCount > 0 ? (publishCount / startCount) * 100 : 0,
          dropOff: startCount > 0 ? ((startCount - publishCount) / startCount) * 100 : 0,
          medianTimeToNext: medianPublishToSale,
        },
        {
          name: "First Sale",
          count: saleCount,
          conversionRate: publishCount > 0 ? (saleCount / publishCount) * 100 : 0,
          dropOff: publishCount > 0 ? ((publishCount - saleCount) / publishCount) * 100 : 0,
        },
      ],
      stuckCreators: stuckCreatorsList.slice(0, 10), // Limit to 10
    };
  },
});

/**
 * Get users stuck at a specific funnel step
 */
export const getStuckUsers = query({
  args: {
    funnelType: v.union(v.literal("learner"), v.literal("creator")),
    step: v.string(),
    daysStuck: v.number(), // Minimum days stuck
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      stuckAt: v.string(),
      daysSinceStep: v.number(),
      lastActivity: v.number(),
    })
  ),
  handler: async (ctx, { funnelType, step, daysStuck }) => {
    const cutoffTime = Date.now() - (daysStuck * 24 * 60 * 60 * 1000);
    
    if (funnelType === "creator") {
      // Find creators who started but haven't published
      if (step === "drafting") {
        const starts = await ctx.db
          .query("analyticsEvents")
          .withIndex("by_eventType", (q) => q.eq("eventType", "creator_started"))
          .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
          .collect();
        
        const published = await ctx.db
          .query("analyticsEvents")
          .withIndex("by_eventType", (q) => q.eq("eventType", "creator_published"))
          .collect();
        
        const publishedUserIds = new Set(published.map((e) => e.userId));
        
        return starts
          .filter((e) => !publishedUserIds.has(e.userId))
          .map((e) => ({
            userId: e.userId,
            stuckAt: "drafting",
            daysSinceStep: Math.floor((Date.now() - e.timestamp) / (24 * 60 * 60 * 1000)),
            lastActivity: e.timestamp,
          }))
          .slice(0, 50); // Limit results
      }
    }
    
    // Add more stuck user logic for other steps...
    
    return [];
  },
});

