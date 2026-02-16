/**
 * KPI Queries - Shared between Creator Dashboard and Admin Dashboard
 * Optional storeId parameter allows scoping to specific creator or platform-wide
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get key performance indicators for a time window
 * Can be scoped to a single creator (storeId) or platform-wide (no storeId)
 */
export const getKPIs = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    storeId: v.optional(v.string()), // Optional: filter to specific creator
  },
  returns: v.object({
    newSignups: v.number(),
    newCreatorSignups: v.number(),
    learnerActivationRate: v.number(),
    creatorActivationRate: v.number(),
    totalRevenue: v.number(),
    emailHealth: v.object({
      sent: v.number(),
      delivered: v.number(),
      bounced: v.number(),
      bounceRate: v.number(),
    }),
    traffic: v.object({
      total: v.number(),
      instagram: v.number(),
      tiktok: v.number(),
      email: v.number(),
      direct: v.number(),
    }),
  }),
  handler: async (ctx, { startTime, endTime, storeId }) => {
    // Query analytics events using index for efficiency (bounded)
    const allEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .take(10000);

    // Filter by storeId if provided (creator scope)
    const events = storeId
      ? allEvents.filter((e) => e.storeId === storeId)
      : allEvents;

    // 1. New signups
    const signups = events.filter((e) => e.eventType === "signup");

    // 2. New creator signups
    const creatorSignups = events.filter((e) => e.eventType === "creator_started");

    // 3. Learner activation rate - use analyticsEvents enrollment events instead of userEvents
    const enrollmentEvents = events.filter((e) => e.eventType === "enrollment");
    const enrolledUserIds = new Set(enrollmentEvents.map((e) => e.userId));
    
    // Calculate learner activation rate
    const filteredEnrollments = enrolledUserIds.size;

    const learnerActivationRate = signups.length > 0
      ? (filteredEnrollments / signups.length) * 100
      : 0;
    
    // 4. Creator activation rate (published / started)
    const publishedCreators = events.filter((e) => e.eventType === "creator_published");
    const creatorActivationRate = creatorSignups.length > 0
      ? (publishedCreators.length / creatorSignups.length) * 100
      : 0;
    
    // 5. Total revenue
    const purchases = events.filter((e) => e.eventType === "purchase");
    const totalRevenue = purchases.reduce((sum, e) => {
      return sum + (e.metadata?.value || 0);
    }, 0);
    
    // 6. Email health
    const emailEvents = {
      sent: events.filter((e) => e.eventType === "email_sent").length,
      delivered: events.filter((e) => e.eventType === "email_delivered").length,
      bounced: events.filter((e) => e.eventType === "email_bounced").length,
    };
    
    const bounceRate = emailEvents.sent > 0
      ? (emailEvents.bounced / emailEvents.sent) * 100
      : 0;
    
    // 7. Traffic sources
    const pageViews = events.filter((e) => e.eventType === "page_view");
    const traffic = {
      total: pageViews.length,
      instagram: pageViews.filter((e) => e.metadata?.source === "instagram").length,
      tiktok: pageViews.filter((e) => e.metadata?.source === "tiktok").length,
      email: pageViews.filter((e) => e.metadata?.source === "email").length,
      direct: pageViews.filter((e) => !e.metadata?.source || e.metadata.source === "direct").length,
    };
    
    return {
      newSignups: signups.length,
      newCreatorSignups: creatorSignups.length,
      learnerActivationRate: Math.round(learnerActivationRate * 10) / 10,
      creatorActivationRate: Math.round(creatorActivationRate * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      emailHealth: {
        ...emailEvents,
        bounceRate: Math.round(bounceRate * 10) / 10,
      },
      traffic,
    };
  },
});

/**
 * Get quick stats for dashboard cards
 */
export const getQuickStats = query({
  args: {
    storeId: v.optional(v.string()),
  },
  returns: v.object({
    totalUsers: v.number(),
    totalCourses: v.number(),
    totalRevenue: v.number(),
    activeCampaigns: v.number(),
  }),
  handler: async (ctx, { storeId }) => {
    if (storeId) {
      // Creator-scoped stats
      const store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("_id"), storeId))
        .first();
      
      if (!store) {
        return {
          totalUsers: 0,
          totalCourses: 0,
          totalRevenue: 0,
          activeCampaigns: 0,
        };
      }
      
      // Get creator's courses
      const courses = await ctx.db
        .query("courses")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .take(10000);
      
      // Get creator's enrollments
      const enrollments = await ctx.db
        .query("purchases")
        .withIndex("by_adminUserId", (q) => q.eq("adminUserId", store.userId))
        .take(10000);
      
      // Get creator's revenue events
      const revenueEvents = await ctx.db
        .query("revenueEvents")
        .withIndex("by_storeId", (q) => q.eq("storeId", storeId))
        .take(10000);
      
      const totalRevenue = revenueEvents.reduce((sum, e) => sum + e.netAmount, 0);
      
      // Get creator's campaigns
      const campaigns = await ctx.db
        .query("campaigns")
        .filter((q) => q.eq(q.field("createdBy"), store.userId))
        .take(10000);
      
      const activeCampaigns = campaigns.filter(
        (c) => c.status === "active" || c.status === "scheduled"
      ).length;
      
      return {
        totalUsers: new Set(enrollments.map((e) => e.userId)).size,
        totalCourses: courses.length,
        totalRevenue: Math.round(totalRevenue) / 100, // Convert cents to dollars
        activeCampaigns,
      };
    } else {
      // Platform-wide stats (bounded)
      const users = await ctx.db.query("users").take(10000);
      const courses = await ctx.db.query("courses").take(1000);
      const revenueEvents = await ctx.db.query("revenueEvents").take(5000);
      const campaigns = await ctx.db.query("campaigns").take(1000);
      
      const totalRevenue = revenueEvents.reduce((sum, e) => sum + e.grossAmount, 0);
      const activeCampaigns = campaigns.filter(
        (c) => c.status === "active" || c.status === "scheduled"
      ).length;
      
      return {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalRevenue: Math.round(totalRevenue) / 100,
        activeCampaigns,
      };
    }
  },
});

