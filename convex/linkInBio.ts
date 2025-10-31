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
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      return { success: false };
    }

    await ctx.db.patch(args.linkId, {
      clicks: link.clicks + 1,
    });

    return { success: true };
  },
});

