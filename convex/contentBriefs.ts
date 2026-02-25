import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List briefs for a store (with optional filters) ─────────────────────────
export const list = query({
  args: {
    storeId: v.string(),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    week: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Pick the most selective index
    if (args.status) {
      const results = await ctx.db
        .query("contentBriefs")
        .withIndex("by_storeId_status", (q) =>
          q.eq("storeId", args.storeId).eq("status", args.status!)
        )
        .take(500);
      if (args.week !== undefined) return results.filter((b) => b.week === args.week);
      if (args.category) return results.filter((b) => b.category === args.category);
      return results;
    }

    if (args.category) {
      const results = await ctx.db
        .query("contentBriefs")
        .withIndex("by_storeId_category", (q) =>
          q.eq("storeId", args.storeId).eq("category", args.category!)
        )
        .take(500);
      if (args.week !== undefined) return results.filter((b) => b.week === args.week);
      return results;
    }

    if (args.week !== undefined) {
      return await ctx.db
        .query("contentBriefs")
        .withIndex("by_storeId_week", (q) =>
          q.eq("storeId", args.storeId).eq("week", args.week!)
        )
        .take(500);
    }

    return await ctx.db
      .query("contentBriefs")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);
  },
});

// ── Get a single brief ──────────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("contentBriefs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Create a brief ──────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    storeId: v.string(),
    postNumber: v.number(),
    title: v.string(),
    category: v.string(),
    platform: v.string(),
    hook: v.string(),
    brief: v.string(),
    visualDirection: v.optional(v.string()),
    cta: v.optional(v.string()),
    dmKeyword: v.optional(v.string()),
    source: v.optional(v.string()),
    scriptedContent: v.optional(v.string()),
    assets: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.string()),
          name: v.string(),
          notes: v.optional(v.string()),
        })
      )
    ),
    week: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
    scheduledDate: v.optional(v.string()),
    status: v.string(),
    socialPostId: v.optional(v.id("socialMediaPosts")),
    productId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contentBriefs", args);
  },
});

// ── Update any fields on a brief ────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("contentBriefs"),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    platform: v.optional(v.string()),
    hook: v.optional(v.string()),
    brief: v.optional(v.string()),
    visualDirection: v.optional(v.string()),
    cta: v.optional(v.string()),
    dmKeyword: v.optional(v.string()),
    source: v.optional(v.string()),
    scriptedContent: v.optional(v.string()),
    assets: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.string()),
          name: v.string(),
          notes: v.optional(v.string()),
        })
      )
    ),
    week: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
    scheduledDate: v.optional(v.string()),
    status: v.optional(v.string()),
    socialPostId: v.optional(v.id("socialMediaPosts")),
    productId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Content brief not found");

    // Only patch defined fields
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }

    return { success: true };
  },
});

// ── Quick status change ─────────────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("contentBriefs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Content brief not found");
    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

// ── Reorder (update week/dayOfWeek) ─────────────────────────────────────────
export const reorder = mutation({
  args: {
    id: v.id("contentBriefs"),
    week: v.optional(v.number()),
    dayOfWeek: v.optional(v.number()),
    scheduledDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Content brief not found");
    await ctx.db.patch(id, fields);
    return { success: true };
  },
});

// ── Delete a brief ──────────────────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("contentBriefs") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Content brief not found");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ── Bulk create (for seeding) ───────────────────────────────────────────────
export const bulkCreate = mutation({
  args: {
    briefs: v.array(
      v.object({
        storeId: v.string(),
        postNumber: v.number(),
        title: v.string(),
        category: v.string(),
        platform: v.string(),
        hook: v.string(),
        brief: v.string(),
        visualDirection: v.optional(v.string()),
        cta: v.optional(v.string()),
        dmKeyword: v.optional(v.string()),
        source: v.optional(v.string()),
        scriptedContent: v.optional(v.string()),
        assets: v.optional(
          v.array(
            v.object({
              type: v.string(),
              url: v.optional(v.string()),
              storageId: v.optional(v.string()),
              name: v.string(),
              notes: v.optional(v.string()),
            })
          )
        ),
        week: v.optional(v.number()),
        dayOfWeek: v.optional(v.number()),
        scheduledDate: v.optional(v.string()),
        status: v.string(),
        socialPostId: v.optional(v.id("socialMediaPosts")),
        productId: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const brief of args.briefs) {
      const id = await ctx.db.insert("contentBriefs", brief);
      ids.push(id);
    }
    return { success: true, count: ids.length, ids };
  },
});
