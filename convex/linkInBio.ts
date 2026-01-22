/**
 * Link-in-Bio Management System
 * 
 * Allows creators to manage their custom links (similar to Linktree/Beacons)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all links for a store
 */
export const getStoreLinks = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.array(v.object({
    _id: v.id("linkInBioLinks"),
    storeId: v.id("stores"),
    userId: v.string(),
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    clicks: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("linkInBioLinks")
      .withIndex("by_storeId_order", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Sort by order
    return links.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get active public links for a store (for public profile display)
 */
export const getPublicStoreLinks = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.array(v.object({
    _id: v.id("linkInBioLinks"),
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
  })),
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("linkInBioLinks")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort and return only public fields
    return links
      .sort((a, b) => a.order - b.order)
      .map((link) => ({
        _id: link._id,
        title: link.title,
        url: link.url,
        description: link.description,
        thumbnailUrl: link.thumbnailUrl,
        icon: link.icon,
        order: link.order,
      }));
  },
});

/**
 * Create a new link
 */
export const createLink = mutation({
  args: {
    storeId: v.id("stores"),
    userId: v.string(),
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    linkId: v.optional(v.id("linkInBioLinks")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get existing links to determine order
    const existingLinks = await ctx.db
      .query("linkInBioLinks")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const now = Date.now();
    const order = existingLinks.length;

    const linkId = await ctx.db.insert("linkInBioLinks", {
      storeId: args.storeId,
      userId: args.userId,
      title: args.title,
      url: args.url,
      description: args.description,
      thumbnailUrl: args.thumbnailUrl,
      icon: args.icon,
      order,
      isActive: true,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      linkId,
      message: "Link created successfully",
    };
  },
});

/**
 * Update a link
 */
export const updateLink = mutation({
  args: {
    linkId: v.id("linkInBioLinks"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      return { success: false, message: "Link not found" };
    }

    const { linkId, ...updates } = args;
    
    await ctx.db.patch(args.linkId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Link updated successfully",
    };
  },
});

/**
 * Delete a link
 */
export const deleteLink = mutation({
  args: {
    linkId: v.id("linkInBioLinks"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      return { success: false, message: "Link not found" };
    }

    await ctx.db.delete(args.linkId);

    // Reorder remaining links
    const remainingLinks = await ctx.db
      .query("linkInBioLinks")
      .withIndex("by_storeId", (q) => q.eq("storeId", link.storeId))
      .collect();

    const sortedLinks = remainingLinks
      .filter((l) => l._id !== args.linkId)
      .sort((a, b) => a.order - b.order);

    // Update order
    for (let i = 0; i < sortedLinks.length; i++) {
      await ctx.db.patch(sortedLinks[i]._id, { order: i });
    }

    return {
      success: true,
      message: "Link deleted successfully",
    };
  },
});

/**
 * Reorder links
 */
export const reorderLinks = mutation({
  args: {
    storeId: v.id("stores"),
    linkIds: v.array(v.id("linkInBioLinks")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Update order for each link
    for (let i = 0; i < args.linkIds.length; i++) {
      await ctx.db.patch(args.linkIds[i], {
        order: i,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: "Links reordered successfully",
    };
  },
});

/**
 * Track a link click (for analytics)
 */
export const trackLinkClick = mutation({
  args: {
    linkId: v.id("linkInBioLinks"),
    // Optional analytics data
    source: v.optional(v.string()),
    medium: v.optional(v.string()),
    campaign: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceType: v.optional(v.union(v.literal("desktop"), v.literal("mobile"), v.literal("tablet"))),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      return { success: false };
    }

    // Increment click count on the link
    await ctx.db.patch(args.linkId, {
      clicks: link.clicks + 1,
    });

    // Store detailed click analytics
    await ctx.db.insert("linkClickAnalytics", {
      linkId: args.linkId,
      storeId: link.storeId,
      source: args.source,
      medium: args.medium,
      campaign: args.campaign,
      referrer: args.referrer,
      userAgent: args.userAgent,
      deviceType: args.deviceType,
      browser: args.browser,
      os: args.os,
      country: args.country,
      region: args.region,
      city: args.city,
      clickedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get link analytics for a specific link
 */
export const getLinkAnalytics = query({
  args: {
    linkId: v.id("linkInBioLinks"),
    days: v.optional(v.number()), // Default to 30 days
  },
  returns: v.object({
    totalClicks: v.number(),
    clicksBySource: v.array(v.object({
      source: v.string(),
      clicks: v.number(),
    })),
    clicksByDevice: v.array(v.object({
      device: v.string(),
      clicks: v.number(),
    })),
    clicksByCountry: v.array(v.object({
      country: v.string(),
      clicks: v.number(),
    })),
    clicksOverTime: v.array(v.object({
      date: v.string(),
      clicks: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const clicks = await ctx.db
      .query("linkClickAnalytics")
      .withIndex("by_linkId_clickedAt", (q) =>
        q.eq("linkId", args.linkId).gte("clickedAt", cutoff)
      )
      .collect();

    // Aggregate by source
    const sourceMap = new Map<string, number>();
    clicks.forEach((click) => {
      const source = click.source || "direct";
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const clicksBySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks);

    // Aggregate by device
    const deviceMap = new Map<string, number>();
    clicks.forEach((click) => {
      const device = click.deviceType || "unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const clicksByDevice = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks);

    // Aggregate by country
    const countryMap = new Map<string, number>();
    clicks.forEach((click) => {
      const country = click.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const clicksByCountry = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks);

    // Aggregate by date
    const dateMap = new Map<string, number>();
    clicks.forEach((click) => {
      const date = new Date(click.clickedAt).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    const clicksOverTime = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalClicks: clicks.length,
      clicksBySource,
      clicksByDevice,
      clicksByCountry,
      clicksOverTime,
    };
  },
});

/**
 * Get aggregated analytics for all links in a store
 */
export const getStoreLinksAnalytics = query({
  args: {
    storeId: v.id("stores"),
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalClicks: v.number(),
    linkPerformance: v.array(v.object({
      linkId: v.id("linkInBioLinks"),
      title: v.string(),
      url: v.string(),
      clicks: v.number(),
      percentOfTotal: v.number(),
    })),
    topSources: v.array(v.object({
      source: v.string(),
      clicks: v.number(),
    })),
    deviceBreakdown: v.array(v.object({
      device: v.string(),
      clicks: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all links for this store
    const links = await ctx.db
      .query("linkInBioLinks")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Get all clicks in the time period
    const clicks = await ctx.db
      .query("linkClickAnalytics")
      .withIndex("by_storeId_clickedAt", (q) =>
        q.eq("storeId", args.storeId).gte("clickedAt", cutoff)
      )
      .collect();

    const totalClicks = clicks.length;

    // Aggregate clicks by link
    const linkClickMap = new Map<string, number>();
    clicks.forEach((click) => {
      const linkIdStr = click.linkId as string;
      linkClickMap.set(linkIdStr, (linkClickMap.get(linkIdStr) || 0) + 1);
    });

    const linkPerformance = links.map((link) => ({
      linkId: link._id,
      title: link.title,
      url: link.url,
      clicks: linkClickMap.get(link._id as string) || 0,
      percentOfTotal: totalClicks > 0
        ? Math.round(((linkClickMap.get(link._id as string) || 0) / totalClicks) * 100)
        : 0,
    })).sort((a, b) => b.clicks - a.clicks);

    // Top sources
    const sourceMap = new Map<string, number>();
    clicks.forEach((click) => {
      const source = click.source || "direct";
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Device breakdown
    const deviceMap = new Map<string, number>();
    clicks.forEach((click) => {
      const device = click.deviceType || "unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, clicks: count }))
      .sort((a, b) => b.clicks - a.clicks);

    return {
      totalClicks,
      linkPerformance,
      topSources,
      deviceBreakdown,
    };
  },
});

