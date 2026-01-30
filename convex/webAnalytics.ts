import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Helper: Extract store/product slugs from URL path
 */
function extractSlugs(path: string): { storeSlug: string | null; productSlug: string | null } {
  // /store/my-store-slug/... → storeSlug: "my-store-slug"
  const storeMatch = path.match(/^\/store\/([^\/]+)/);
  // /products/my-product-slug → productSlug: "my-product-slug"
  const productMatch = path.match(/^\/products\/([^\/]+)/);

  return {
    storeSlug: storeMatch?.[1] || null,
    productSlug: productMatch?.[1] || null,
  };
}

// ==================== INGESTION ====================

/**
 * Internal mutation to ingest analytics events from Vercel drain
 */
export const ingestEvents = internalMutation({
  args: {
    events: v.array(v.any()),
  },
  handler: async (ctx, { events }) => {
    const insertPromises = events.map((event: any) => {
      // Extract slugs from path for efficient creator queries
      const { storeSlug, productSlug } = extractSlugs(event.path || "");

      return ctx.db.insert("webAnalyticsEvents", {
        eventType: event.eventType || "pageview",
        eventName: event.eventName || undefined,
        path: event.path || "/",
        origin: event.origin || undefined,
        referrer: event.referrer || undefined,
        queryParams: event.queryParams || undefined,
        country: event.country || undefined,
        region: event.region || undefined,
        city: event.city || undefined,
        deviceType: event.deviceType || undefined,
        osName: event.osName || undefined,
        clientName: event.clientName || undefined,
        sessionId: event.sessionId || undefined,
        deviceId: event.deviceId || undefined,
        projectId: event.projectId || undefined,
        timestamp: event.timestamp || Date.now(),
        storeSlug: storeSlug || undefined,
        productSlug: productSlug || undefined,
      });
    });

    await Promise.all(insertPromises);
    return { inserted: events.length };
  },
});

// ==================== ADMIN QUERIES ====================

/**
 * Get total pageviews for a time period
 */
export const getPageViews = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .filter((q) => q.eq(q.field("eventType"), "pageview"))
      .collect();

    return { total: events.length, days };
  },
});

/**
 * Get unique visitors (by sessionId) for a time period
 */
export const getUniqueVisitors = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .collect();

    const uniqueSessions = new Set(events.map((e) => e.sessionId).filter(Boolean));
    return { total: uniqueSessions.size, days };
  },
});

/**
 * Get top pages by pageviews
 */
export const getTopPages = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .filter((q) => q.eq(q.field("eventType"), "pageview"))
      .collect();

    // Aggregate by path
    const pathCounts: Record<string, number> = {};
    for (const event of events) {
      pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
    }

    // Sort and limit
    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, views]) => ({ path, views }));
  },
});

/**
 * Get top referrers
 */
export const getTopReferrers = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .filter((q) => q.neq(q.field("referrer"), undefined))
      .collect();

    // Aggregate by referrer domain
    const referrerCounts: Record<string, number> = {};
    for (const event of events) {
      if (event.referrer) {
        try {
          const domain = new URL(event.referrer).hostname;
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
        }
      }
    }

    return Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([referrer, visits]) => ({ referrer, visits }));
  },
});

/**
 * Get device type breakdown
 */
export const getDeviceBreakdown = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .collect();

    // Aggregate by device type
    const deviceCounts: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0,
    };

    for (const event of events) {
      const device = event.deviceType?.toLowerCase() || "unknown";
      if (device in deviceCounts) {
        deviceCounts[device]++;
      } else {
        deviceCounts["unknown"]++;
      }
    }

    return Object.entries(deviceCounts).map(([device, count]) => ({ device, count }));
  },
});

/**
 * Get country breakdown
 */
export const getCountryBreakdown = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .collect();

    // Aggregate by country
    const countryCounts: Record<string, number> = {};
    for (const event of events) {
      const country = event.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }

    return Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([country, visits]) => ({ country, visits }));
  },
});

/**
 * Get traffic over time (time series data)
 */
export const getTrafficOverTime = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .filter((q) => q.eq(q.field("eventType"), "pageview"))
      .collect();

    // Group by day
    const dayBuckets: Record<string, { views: number; visitors: Set<number | undefined> }> = {};

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split("T")[0];
      if (!dayBuckets[date]) {
        dayBuckets[date] = { views: 0, visitors: new Set() };
      }
      dayBuckets[date].views++;
      if (event.sessionId) {
        dayBuckets[date].visitors.add(event.sessionId);
      }
    }

    // Convert to array sorted by date
    return Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }));
  },
});

// ==================== CREATOR QUERIES (Store-scoped) ====================

/**
 * Get traffic for a specific store
 */
export const getStoreTraffic = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    const pageviews = events.filter((e) => e.eventType === "pageview").length;
    const uniqueSessions = new Set(events.map((e) => e.sessionId).filter(Boolean));

    return {
      pageviews,
      visitors: uniqueSessions.size,
      days,
    };
  },
});

/**
 * Get top pages within a store
 */
export const getStoreTopPages = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) =>
        q.and(q.gte(q.field("timestamp"), cutoff), q.eq(q.field("eventType"), "pageview"))
      )
      .collect();

    // Aggregate by path
    const pathCounts: Record<string, number> = {};
    for (const event of events) {
      pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
    }

    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, views]) => ({ path, views }));
  },
});

/**
 * Get referrers for a store
 */
export const getStoreReferrers = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) =>
        q.and(q.gte(q.field("timestamp"), cutoff), q.neq(q.field("referrer"), undefined))
      )
      .collect();

    // Aggregate by referrer domain
    const referrerCounts: Record<string, number> = {};
    for (const event of events) {
      if (event.referrer) {
        try {
          const domain = new URL(event.referrer).hostname;
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
        }
      }
    }

    return Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([referrer, visits]) => ({ referrer, visits }));
  },
});

/**
 * Get device breakdown for a store
 */
export const getStoreDevices = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    const deviceCounts: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0,
    };

    for (const event of events) {
      const device = event.deviceType?.toLowerCase() || "unknown";
      if (device in deviceCounts) {
        deviceCounts[device]++;
      } else {
        deviceCounts["unknown"]++;
      }
    }

    return Object.entries(deviceCounts).map(([device, count]) => ({ device, count }));
  },
});

/**
 * Get traffic over time for a store
 */
export const getStoreTrafficOverTime = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) =>
        q.and(q.gte(q.field("timestamp"), cutoff), q.eq(q.field("eventType"), "pageview"))
      )
      .collect();

    // Group by day
    const dayBuckets: Record<string, { views: number; visitors: Set<number | undefined> }> = {};

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split("T")[0];
      if (!dayBuckets[date]) {
        dayBuckets[date] = { views: 0, visitors: new Set() };
      }
      dayBuckets[date].views++;
      if (event.sessionId) {
        dayBuckets[date].visitors.add(event.sessionId);
      }
    }

    return Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }));
  },
});

/**
 * Get country breakdown for a store
 */
export const getStoreCountries = query({
  args: {
    storeSlug: v.string(),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { storeSlug, days = 7, limit = 10 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("webAnalyticsEvents")
      .withIndex("by_store_slug", (q) => q.eq("storeSlug", storeSlug))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    const countryCounts: Record<string, number> = {};
    for (const event of events) {
      const country = event.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }

    return Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([country, visits]) => ({ country, visits }));
  },
});
