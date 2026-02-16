import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTag = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("emailTags"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) => q.eq("storeId", args.storeId).eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Tag with this name already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("emailTags", {
      storeId: args.storeId,
      name: args.name,
      color: args.color,
      description: args.description,
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTag = mutation({
  args: {
    tagId: v.id("emailTags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { tagId, ...updates } = args;
    const tag = await ctx.db.get(tagId);
    if (!tag) throw new Error("Tag not found");

    if (updates.name && updates.name !== tag.name) {
      const existing = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId_and_name", (q) =>
          q.eq("storeId", tag.storeId).eq("name", updates.name as string)
        )
        .first();

      if (existing) {
        throw new Error("Tag with this name already exists");
      }
    }

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    filteredUpdates.updatedAt = Date.now();
    await ctx.db.patch(tagId, filteredUpdates);
    return null;
  },
});

export const deleteTag = mutation({
  args: { tagId: v.id("emailTags") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) throw new Error("Tag not found");

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", tag.storeId))
      .take(1000);

    for (const contact of contacts) {
      if (contact.tagIds.includes(args.tagId)) {
        await ctx.db.patch(contact._id, {
          tagIds: contact.tagIds.filter((id) => id !== args.tagId),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.tagId);
    return null;
  },
});

export const getTag = query({
  args: { tagId: v.id("emailTags") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tagId);
  },
});

export const listTags = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(1000);
  },
});

export const getTagByName = query({
  args: { storeId: v.string(), name: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) => q.eq("storeId", args.storeId).eq("name", args.name))
      .first();
  },
});

export const getTagStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    totalTags: v.number(),
    totalTaggedContacts: v.number(),
    mostUsedTags: v.array(
      v.object({
        _id: v.id("emailTags"),
        name: v.string(),
        contactCount: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);

    const totalTaggedContacts = tags.reduce((sum, tag) => sum + tag.contactCount, 0);

    const sortedTags = [...tags]
      .sort((a, b) => b.contactCount - a.contactCount)
      .slice(0, 5)
      .map((tag) => ({
        _id: tag._id,
        name: tag.name,
        contactCount: tag.contactCount,
      }));

    return {
      totalTags: tags.length,
      totalTaggedContacts,
      mostUsedTags: sortedTags,
    };
  },
});

export const mergeTags = mutation({
  args: {
    sourceTagId: v.id("emailTags"),
    targetTagId: v.id("emailTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.sourceTagId === args.targetTagId) {
      throw new Error("Cannot merge a tag with itself");
    }

    const sourceTag = await ctx.db.get(args.sourceTagId);
    const targetTag = await ctx.db.get(args.targetTagId);

    if (!sourceTag || !targetTag) {
      throw new Error("Tag not found");
    }

    if (sourceTag.storeId !== targetTag.storeId) {
      throw new Error("Tags must belong to the same store");
    }

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", sourceTag.storeId))
      .take(1000);

    let mergedCount = 0;
    for (const contact of contacts) {
      if (contact.tagIds.includes(args.sourceTagId)) {
        const newTagIds = contact.tagIds.filter((id) => id !== args.sourceTagId);
        if (!newTagIds.includes(args.targetTagId)) {
          newTagIds.push(args.targetTagId);
          mergedCount++;
        }
        await ctx.db.patch(contact._id, {
          tagIds: newTagIds,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.targetTagId, {
      contactCount: targetTag.contactCount + mergedCount,
      updatedAt: Date.now(),
    });

    await ctx.db.delete(args.sourceTagId);
    return null;
  },
});
