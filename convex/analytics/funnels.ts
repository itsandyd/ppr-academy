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
    
    // Step 3: Enrollments
    // Note: userEvents doesn't have by_timestamp index, using filter instead
    const allEnrollments = await ctx.db
      .query("userEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startTime),
          q.lte(q.field("timestamp"), endTime),
          q.eq(q.field("eventType"), "course_enrolled")
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
            .filter((e) => e.courseId && storeCourseIds.has(e.courseId) && signupUserIds.has(e.userId))
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
        median: 0, // TODO: Calculate from event timestamps
        average: 0,
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
          medianTimeToNext: 0, // TODO: Calculate
        },
        {
          name: "Publish First Item",
          count: publishCount,
          conversionRate: startCount > 0 ? (publishCount / startCount) * 100 : 0,
          dropOff: startCount > 0 ? ((startCount - publishCount) / startCount) * 100 : 0,
          medianTimeToNext: 0,
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

