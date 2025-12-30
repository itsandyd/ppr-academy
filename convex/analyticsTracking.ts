import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track a general analytics event
 */
export const trackEvent = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    eventType: v.union(
      // Core events
      v.literal("page_view"),
      v.literal("product_view"),
      v.literal("course_view"),
      v.literal("purchase"),
      v.literal("download"),
      v.literal("video_play"),
      v.literal("video_complete"),
      v.literal("lesson_complete"),
      v.literal("course_complete"),
      v.literal("search"),
      v.literal("click"),
      v.literal("signup"),
      v.literal("login"),
      // Creator funnel events
      v.literal("creator_started"),
      v.literal("creator_profile_completed"),
      v.literal("creator_published"),
      v.literal("first_sale"),
      // Learner activation events
      v.literal("enrollment"),
      v.literal("return_week_2"),
      // Email & campaign events
      v.literal("email_sent"),
      v.literal("email_delivered"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("email_bounced"),
      v.literal("email_complained"),
      // Campaign & outreach events
      v.literal("dm_sent"),
      v.literal("cta_clicked"),
      v.literal("campaign_view"),
      // System events
      v.literal("error"),
      v.literal("webhook_failed")
    ),
    resourceId: v.optional(v.string()),
    resourceType: v.optional(
      v.union(
        v.literal("course"),
        v.literal("digitalProduct"),
        v.literal("lesson"),
        v.literal("chapter"),
        v.literal("page")
      )
    ),
    metadata: v.optional(
      v.object({
        // Core metadata
        page: v.optional(v.string()),
        referrer: v.optional(v.string()),
        searchTerm: v.optional(v.string()),
        duration: v.optional(v.number()),
        progress: v.optional(v.number()),
        value: v.optional(v.number()),
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        device: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        // Campaign tracking
        source: v.optional(v.string()),
        campaign_id: v.optional(v.string()),
        utm_source: v.optional(v.string()),
        utm_medium: v.optional(v.string()),
        utm_campaign: v.optional(v.string()),
        // Creator-specific
        daw: v.optional(v.string()),
        audience_size: v.optional(v.number()),
        // Product/revenue specific
        product_id: v.optional(v.string()),
        amount_cents: v.optional(v.number()),
        currency: v.optional(v.string()),
        // Experiment tracking
        experiment_id: v.optional(v.string()),
        variant: v.optional(v.string()),
        // Error tracking
        error_code: v.optional(v.string()),
        error_message: v.optional(v.string()),
      })
    ),
    sessionId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("analyticsEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyticsEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Track a product or course view
 */
export const trackProductView = mutation({
  args: {
    userId: v.optional(v.string()),
    storeId: v.string(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("course"), v.literal("digitalProduct")),
    viewDuration: v.optional(v.number()),
    referrer: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  returns: v.id("productViews"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("productViews", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Track a revenue event (purchase)
 */
export const trackRevenue = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    creatorId: v.string(),
    purchaseId: v.id("purchases"),
    resourceId: v.string(),
    resourceType: v.union(
      v.literal("course"),
      v.literal("digitalProduct"),
      v.literal("coaching"),
      v.literal("bundle")
    ),
    grossAmount: v.number(),
    platformFee: v.number(),
    processingFee: v.number(),
    netAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  returns: v.id("revenueEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("revenueEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Start or update a user session
 */
export const trackSession = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    sessionId: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    pageViews: v.optional(v.number()),
    events: v.optional(v.number()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    referrer: v.optional(v.string()),
    landingPage: v.optional(v.string()),
    exitPage: v.optional(v.string()),
  },
  returns: v.union(v.id("userSessions"), v.null()),
  handler: async (ctx, args) => {
    const { sessionId, userId } = args;

    // Try to find existing session
    const existingSession = await ctx.db
      .query("userSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        endTime: args.endTime || Date.now(),
        duration: args.endTime ? args.endTime - existingSession.startTime : undefined,
        pageViews: args.pageViews || existingSession.pageViews,
        events: args.events || existingSession.events,
        exitPage: args.exitPage,
      });
      return existingSession._id;
    } else {
      // Create new session
      return await ctx.db.insert("userSessions", {
        userId,
        storeId: args.storeId,
        sessionId,
        startTime: args.startTime || Date.now(),
        endTime: args.endTime,
        duration: args.endTime && args.startTime ? args.endTime - args.startTime : undefined,
        pageViews: args.pageViews || 1,
        events: args.events || 1,
        country: args.country,
        city: args.city,
        device: args.device,
        browser: args.browser,
        os: args.os,
        referrer: args.referrer,
        landingPage: args.landingPage,
        exitPage: args.exitPage,
      });
    }
  },
});

/**
 * Batch track multiple events for performance
 */
const eventTypeValidator = v.union(
  v.literal("page_view"),
  v.literal("product_view"),
  v.literal("course_view"),
  v.literal("purchase"),
  v.literal("download"),
  v.literal("video_play"),
  v.literal("video_complete"),
  v.literal("lesson_complete"),
  v.literal("course_complete"),
  v.literal("search"),
  v.literal("click"),
  v.literal("signup"),
  v.literal("login"),
  v.literal("creator_started"),
  v.literal("creator_profile_completed"),
  v.literal("creator_published"),
  v.literal("first_sale"),
  v.literal("enrollment"),
  v.literal("return_week_2"),
  v.literal("email_sent"),
  v.literal("email_delivered"),
  v.literal("email_opened"),
  v.literal("email_clicked"),
  v.literal("email_bounced"),
  v.literal("email_complained"),
  v.literal("dm_sent"),
  v.literal("cta_clicked"),
  v.literal("campaign_view"),
  v.literal("error"),
  v.literal("webhook_failed")
);

const metadataValidator = v.optional(
  v.object({
    page: v.optional(v.string()),
    referrer: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    duration: v.optional(v.number()),
    progress: v.optional(v.number()),
    value: v.optional(v.number()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    source: v.optional(v.string()),
    campaign_id: v.optional(v.string()),
    utm_source: v.optional(v.string()),
    utm_medium: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    daw: v.optional(v.string()),
    audience_size: v.optional(v.number()),
    product_id: v.optional(v.string()),
    amount_cents: v.optional(v.number()),
    currency: v.optional(v.string()),
    experiment_id: v.optional(v.string()),
    variant: v.optional(v.string()),
    error_code: v.optional(v.string()),
    error_message: v.optional(v.string()),
  })
);

export const trackEventsBatch = mutation({
  args: {
    events: v.array(
      v.object({
        userId: v.string(),
        storeId: v.optional(v.string()),
        eventType: eventTypeValidator,
        resourceId: v.optional(v.string()),
        resourceType: v.optional(
          v.union(
            v.literal("course"),
            v.literal("digitalProduct"),
            v.literal("lesson"),
            v.literal("chapter"),
            v.literal("page")
          )
        ),
        metadata: metadataValidator,
        sessionId: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
      })
    ),
  },
  returns: v.array(v.id("analyticsEvents")),
  handler: async (ctx, args) => {
    const results = [];
    const timestamp = Date.now();

    for (const event of args.events) {
      const id = await ctx.db.insert("analyticsEvents", {
        ...event,
        timestamp,
      });
      results.push(id);
    }

    return results;
  },
});
