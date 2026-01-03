import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const createContact = mutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceProductId: v.optional(v.id("digitalProducts")),
    sourceCourseId: v.optional(v.id("courses")),
    tagIds: v.optional(v.array(v.id("emailTags"))),
    customFields: v.optional(v.any()),
  },
  returns: v.id("emailContacts"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    if (existing) {
      throw new Error("Contact with this email already exists");
    }

    const now = Date.now();
    const tagIds = args.tagIds || [];

    for (const tagId of tagIds) {
      const tag = await ctx.db.get(tagId);
      if (tag) {
        await ctx.db.patch(tagId, { contactCount: tag.contactCount + 1 });
      }
    }

    return await ctx.db.insert("emailContacts", {
      storeId: args.storeId,
      email: args.email.toLowerCase(),
      firstName: args.firstName,
      lastName: args.lastName,
      status: "subscribed",
      subscribedAt: now,
      tagIds,
      source: args.source,
      sourceProductId: args.sourceProductId,
      sourceCourseId: args.sourceCourseId,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      customFields: args.customFields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateContact = mutation({
  args: {
    contactId: v.id("emailContacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed"),
        v.literal("bounced"),
        v.literal("complained")
      )
    ),
    customFields: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { contactId, ...updates } = args;
    const contact = await ctx.db.get(contactId);
    if (!contact) throw new Error("Contact not found");

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (updates.status === "unsubscribed" && contact.status !== "unsubscribed") {
      filteredUpdates.unsubscribedAt = Date.now();
    }

    filteredUpdates.updatedAt = Date.now();
    await ctx.db.patch(contactId, filteredUpdates);
    return null;
  },
});

export const deleteContact = mutation({
  args: { contactId: v.id("emailContacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    for (const tagId of contact.tagIds) {
      const tag = await ctx.db.get(tagId);
      if (tag && tag.contactCount > 0) {
        await ctx.db.patch(tagId, { contactCount: tag.contactCount - 1 });
      }
    }

    const activities = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(args.contactId);
    return null;
  },
});

export const getContact = query({
  args: { contactId: v.id("emailContacts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    const tags = await Promise.all(contact.tagIds.map((tagId) => ctx.db.get(tagId)));

    return {
      ...contact,
      tags: tags.filter(Boolean),
    };
  },
});

export const getContactByEmail = query({
  args: { storeId: v.string(), email: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();
  },
});

export const listContacts = query({
  args: {
    storeId: v.string(),
    status: v.optional(
      v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed"),
        v.literal("bounced"),
        v.literal("complained")
      )
    ),
    tagId: v.optional(v.id("emailTags")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let contactsQuery = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    let contacts = await contactsQuery.order("desc").collect();

    if (args.status) {
      contacts = contacts.filter((c) => c.status === args.status);
    }

    if (args.tagId) {
      contacts = contacts.filter((c) => c.tagIds.includes(args.tagId as Id<"emailTags">));
    }

    if (args.limit) {
      contacts = contacts.slice(0, args.limit);
    }

    const tagsCache: Record<string, { _id: Id<"emailTags">; name: string; color?: string } | null> =
      {};

    return await Promise.all(
      contacts.map(async (contact) => {
        const tags = await Promise.all(
          contact.tagIds.map(async (tagId) => {
            if (tagsCache[tagId] === undefined) {
              tagsCache[tagId] = await ctx.db.get(tagId);
            }
            return tagsCache[tagId];
          })
        );
        return {
          ...contact,
          tags: tags.filter(Boolean),
        };
      })
    );
  },
});

export const addTagToContact = mutation({
  args: {
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const tag = await ctx.db.get(args.tagId);
    if (!tag) throw new Error("Tag not found");

    if (contact.tagIds.includes(args.tagId)) {
      return null;
    }

    await ctx.db.patch(args.contactId, {
      tagIds: [...contact.tagIds, args.tagId],
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.tagId, {
      contactCount: tag.contactCount + 1,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("emailContactActivity", {
      contactId: args.contactId,
      storeId: contact.storeId,
      activityType: "tag_added",
      metadata: {
        tagId: args.tagId,
        tagName: tag.name,
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

export const removeTagFromContact = mutation({
  args: {
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const tag = await ctx.db.get(args.tagId);
    if (!tag) throw new Error("Tag not found");

    if (!contact.tagIds.includes(args.tagId)) {
      return null;
    }

    await ctx.db.patch(args.contactId, {
      tagIds: contact.tagIds.filter((id) => id !== args.tagId),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.tagId, {
      contactCount: Math.max(0, tag.contactCount - 1),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("emailContactActivity", {
      contactId: args.contactId,
      storeId: contact.storeId,
      activityType: "tag_removed",
      metadata: {
        tagId: args.tagId,
        tagName: tag.name,
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

export const getContactActivity = query({
  args: {
    contactId: v.id("emailContacts"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_contactId_and_timestamp", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

export const getContactStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    total: v.number(),
    subscribed: v.number(),
    unsubscribed: v.number(),
    bounced: v.number(),
    avgEngagement: v.number(),
  }),
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const subscribed = contacts.filter((c) => c.status === "subscribed").length;
    const unsubscribed = contacts.filter((c) => c.status === "unsubscribed").length;
    const bounced = contacts.filter((c) => c.status === "bounced").length;

    const engagementScores = contacts
      .filter((c) => c.engagementScore !== undefined)
      .map((c) => c.engagementScore as number);

    const avgEngagement =
      engagementScores.length > 0
        ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
        : 0;

    return {
      total: contacts.length,
      subscribed,
      unsubscribed,
      bounced,
      avgEngagement: Math.round(avgEngagement),
    };
  },
});

export const recordEmailSent = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    campaignId: v.optional(v.id("dripCampaigns")),
    emailSubject: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    await ctx.db.patch(args.contactId, {
      emailsSent: contact.emailsSent + 1,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("emailContactActivity", {
      contactId: args.contactId,
      storeId: contact.storeId,
      activityType: "email_sent",
      metadata: {
        campaignId: args.campaignId,
        emailSubject: args.emailSubject,
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

export const recordEmailOpened = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    campaignId: v.optional(v.id("dripCampaigns")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    const now = Date.now();
    await ctx.db.patch(args.contactId, {
      emailsOpened: contact.emailsOpened + 1,
      lastOpenedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("emailContactActivity", {
      contactId: args.contactId,
      storeId: contact.storeId,
      activityType: "email_opened",
      metadata: {
        campaignId: args.campaignId,
      },
      timestamp: now,
    });

    return null;
  },
});

export const recordEmailClicked = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    campaignId: v.optional(v.id("dripCampaigns")),
    linkClicked: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    const now = Date.now();
    await ctx.db.patch(args.contactId, {
      emailsClicked: contact.emailsClicked + 1,
      lastClickedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("emailContactActivity", {
      contactId: args.contactId,
      storeId: contact.storeId,
      activityType: "email_clicked",
      metadata: {
        campaignId: args.campaignId,
        linkClicked: args.linkClicked,
      },
      timestamp: now,
    });

    return null;
  },
});

export const bulkImportContacts = mutation({
  args: {
    storeId: v.string(),
    contacts: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        tagNames: v.optional(v.array(v.string())),
      })
    ),
    source: v.optional(v.string()),
  },
  returns: v.object({
    imported: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const now = Date.now();

    const existingTags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const tagNameToId: Record<string, Id<"emailTags">> = {};
    for (const tag of existingTags) {
      tagNameToId[tag.name.toLowerCase()] = tag._id;
    }

    for (const contact of args.contacts) {
      try {
        const existing = await ctx.db
          .query("emailContacts")
          .withIndex("by_storeId_and_email", (q) =>
            q.eq("storeId", args.storeId).eq("email", contact.email.toLowerCase())
          )
          .first();

        if (existing) {
          skipped++;
          continue;
        }

        const tagIds: Id<"emailTags">[] = [];
        if (contact.tagNames) {
          for (const tagName of contact.tagNames) {
            const existingTagId = tagNameToId[tagName.toLowerCase()];
            if (existingTagId) {
              tagIds.push(existingTagId);
              const tag = await ctx.db.get(existingTagId);
              if (tag) {
                await ctx.db.patch(existingTagId, {
                  contactCount: tag.contactCount + 1,
                });
              }
            } else {
              const newTagId = await ctx.db.insert("emailTags", {
                storeId: args.storeId,
                name: tagName,
                contactCount: 1,
                createdAt: now,
                updatedAt: now,
              });
              tagIds.push(newTagId);
              tagNameToId[tagName.toLowerCase()] = newTagId;
            }
          }
        }

        await ctx.db.insert("emailContacts", {
          storeId: args.storeId,
          email: contact.email.toLowerCase(),
          firstName: contact.firstName,
          lastName: contact.lastName,
          status: "subscribed",
          subscribedAt: now,
          tagIds,
          source: args.source || "import",
          emailsSent: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          createdAt: now,
          updatedAt: now,
        });

        imported++;
      } catch (error) {
        errors.push(`Failed to import ${contact.email}: ${error}`);
      }
    }

    return { imported, skipped, errors };
  },
});
