import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
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
    noTags: v.optional(v.boolean()), // Filter for contacts with no tags
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // Cursor for pagination (Convex pagination cursor)
  },
  returns: v.object({
    contacts: v.array(v.any()),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 200); // Max 200 per page to stay under read limits
    const needsFiltering = args.tagId || args.noTags;

    // Build base query
    let baseQuery;
    if (args.status) {
      const status = args.status;
      baseQuery = ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_status", (q) =>
          q.eq("storeId", args.storeId).eq("status", status)
        );
    } else {
      baseQuery = ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));
    }

    // Use proper Convex pagination
    const paginatedContacts: typeof baseQuery extends { collect: () => Promise<infer T> }
      ? T extends (infer U)[]
        ? U[]
        : any[]
      : any[] = [];
    let currentCursor = args.cursor || null;
    let hasMore = false;
    let finalCursor: string | null = null;

    if (needsFiltering) {
      // For filtered queries, we need to iterate through pages until we have enough results
      // This handles the case where we need to scan through many contacts to find matching ones
      const MAX_ITERATIONS = 100; // Safety limit to prevent infinite loops
      let iterations = 0;

      while (paginatedContacts.length < limit + 1 && iterations < MAX_ITERATIONS) {
        iterations++;

        const paginationResult = await baseQuery.order("desc").paginate({
          cursor: currentCursor,
          numItems: 500, // Fetch larger batches for efficiency when filtering
        });

        // Filter the batch
        let filteredBatch = paginationResult.page;

        if (args.tagId) {
          filteredBatch = filteredBatch.filter((c) =>
            c.tagIds?.includes(args.tagId as Id<"emailTags">)
          );
        }

        if (args.noTags) {
          filteredBatch = filteredBatch.filter((c) => !c.tagIds || c.tagIds.length === 0);
        }

        // Add filtered results
        paginatedContacts.push(...filteredBatch);

        // Check if we've exhausted all contacts
        if (paginationResult.isDone) {
          break;
        }

        currentCursor = paginationResult.continueCursor;
      }

      // Determine hasMore and trim to limit
      hasMore = paginatedContacts.length > limit;
      if (hasMore) {
        paginatedContacts.length = limit; // Trim to limit
      }

      // For filtered queries, we store the last Convex cursor we used
      // This allows continuation even if we haven't filled a full page
      finalCursor = hasMore ? currentCursor : null;
    } else {
      // For non-filtered queries, use simple pagination
      const paginationResult = await baseQuery.order("desc").paginate({
        cursor: currentCursor,
        numItems: limit + 1, // Fetch one extra to check hasMore
      });

      paginatedContacts.push(...paginationResult.page);
      hasMore = paginatedContacts.length > limit;

      if (hasMore) {
        paginatedContacts.length = limit; // Trim to limit
      }

      finalCursor = paginationResult.isDone ? null : paginationResult.continueCursor;
    }

    // Resolve tags for display
    const tagsCache: Record<string, { _id: Id<"emailTags">; name: string; color?: string } | null> =
      {};

    const contactsWithTags = await Promise.all(
      paginatedContacts.map(async (contact) => {
        const tags = await Promise.all(
          (contact.tagIds || []).map(async (tagId) => {
            if (tagsCache[tagId] === undefined) {
              const tag = (await ctx.db.get(tagId)) as {
                _id: Id<"emailTags">;
                name: string;
                color?: string;
              } | null;
              tagsCache[tagId] = tag;
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

    return {
      contacts: contactsWithTags,
      nextCursor: finalCursor,
      hasMore,
    };
  },
});

/**
 * Search contacts by email, name, or get recent contacts.
 * Uses a search index for efficient full-text search on email.
 */
export const searchContacts = query({
  args: {
    storeId: v.string(),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    const searchTerm = args.search?.trim();

    // If no search term, return recent contacts
    if (!searchTerm) {
      const recentContacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .take(limit);
      return recentContacts;
    }

    // First try exact email match with index (fast)
    const exactMatch = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", searchTerm.toLowerCase())
      )
      .first();

    if (exactMatch) {
      return [exactMatch];
    }

    // Use search index for partial email matches
    // This efficiently searches across all contacts
    const searchResults = await ctx.db
      .query("emailContacts")
      .withSearchIndex("search_email", (q) =>
        q.search("email", searchTerm).eq("storeId", args.storeId)
      )
      .take(limit);

    if (searchResults.length > 0) {
      return searchResults;
    }

    // Fallback: scan recent contacts for name matches
    // (search index only covers email field)
    const searchTermLower = searchTerm.toLowerCase();
    const recentContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(2000);

    const nameMatches = recentContacts.filter((contact) => {
      const firstName = contact.firstName?.toLowerCase() || "";
      const lastName = contact.lastName?.toLowerCase() || "";
      return firstName.includes(searchTermLower) || lastName.includes(searchTermLower);
    });

    return nameMatches.slice(0, limit);
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

    // Trigger any workflows that start when this tag is added
    await ctx.runMutation(internal.emailWorkflows.triggerTagAddedWorkflows, {
      storeId: contact.storeId,
      contactId: args.contactId,
      tagId: args.tagId,
      tagName: tag.name,
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

/**
 * Bulk add tag to multiple contacts
 */
export const bulkAddTagToContacts = mutation({
  args: {
    contactIds: v.array(v.id("emailContacts")),
    tagId: v.id("emailTags"),
  },
  returns: v.object({
    added: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) throw new Error("Tag not found");

    let added = 0;
    let skipped = 0;

    // Fetch all contacts in parallel
    const contacts = await Promise.all(args.contactIds.map((id) => ctx.db.get(id)));

    const now = Date.now();

    for (let i = 0; i < args.contactIds.length; i++) {
      const contactId = args.contactIds[i];
      const contact = contacts[i];

      if (!contact) {
        skipped++;
        continue;
      }

      // Skip if already has tag
      if (contact.tagIds.includes(args.tagId)) {
        skipped++;
        continue;
      }

      await ctx.db.patch(contactId, {
        tagIds: [...contact.tagIds, args.tagId],
        updatedAt: now,
      });

      await ctx.db.insert("emailContactActivity", {
        contactId,
        storeId: contact.storeId,
        activityType: "tag_added",
        metadata: {
          tagId: args.tagId,
          tagName: tag.name,
        },
        timestamp: now,
      });

      added++;
    }

    // Update tag count once at the end
    if (added > 0) {
      await ctx.db.patch(args.tagId, {
        contactCount: tag.contactCount + added,
        updatedAt: now,
      });
    }

    return { added, skipped };
  },
});

/**
 * Internal mutation to insert a small batch of contacts (no duplicate checking)
 */
export const importContactsBatchInternal = internalMutation({
  args: {
    storeId: v.string(),
    contacts: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({ inserted: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;

    for (const contact of args.contacts) {
      await ctx.db.insert("emailContacts", {
        storeId: args.storeId,
        email: contact.email,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        status: "subscribed",
        subscribedAt: now,
        tagIds: [],
        source: "import",
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }

    return { inserted };
  },
});

/**
 * Bulk import contacts from CSV data - fast insert without duplicate checking
 * Duplicates should be handled by frontend deduplication or cleanup job
 */
export const importContacts = mutation({
  args: {
    storeId: v.string(),
    contacts: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    imported: v.number(),
    skipped: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Dedupe within batch using Set
    const seenEmails = new Set<string>();

    for (const contact of args.contacts) {
      const email = contact.email?.trim().toLowerCase();

      // Validate email format
      if (!email || !email.includes("@")) {
        errors++;
        continue;
      }

      // Skip duplicates within this batch
      if (seenEmails.has(email)) {
        skipped++;
        continue;
      }
      seenEmails.add(email);

      // Insert directly without checking existing - much faster
      try {
        await ctx.db.insert("emailContacts", {
          storeId: args.storeId,
          email,
          firstName: contact.firstName?.trim() || undefined,
          lastName: contact.lastName?.trim() || undefined,
          status: "subscribed",
          subscribedAt: now,
          tagIds: [],
          source: "import",
          emailsSent: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      } catch {
        errors++;
      }
    }

    // Update stats if any contacts were imported
    if (imported > 0) {
      const existing = await ctx.db
        .query("emailContactStats")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          totalContacts: existing.totalContacts + imported,
          subscribedCount: existing.subscribedCount + imported,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("emailContactStats", {
          storeId: args.storeId,
          totalContacts: imported,
          subscribedCount: imported,
          unsubscribedCount: 0,
          bouncedCount: 0,
          complainedCount: 0,
          updatedAt: Date.now(),
        });
      }
    }

    return { imported, skipped, errors };
  },
});

/**
 * Internal query to count contacts with a specific status in batches
 */
export const countContactsBatch = internalMutation({
  args: {
    storeId: v.string(),
    status: v.string(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    count: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const BATCH_SIZE = 8000;

    const query = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", args.status as any)
      );

    // Use proper Convex pagination
    const paginationResult = await query.paginate({
      cursor: args.cursor || null,
      numItems: BATCH_SIZE,
    });

    return {
      count: paginationResult.page.length,
      nextCursor: paginationResult.isDone ? null : paginationResult.continueCursor,
      done: paginationResult.isDone,
    };
  },
});

/**
 * Internal mutation to save stats
 */
export const saveContactStats = internalMutation({
  args: {
    storeId: v.string(),
    subscribedCount: v.number(),
    unsubscribedCount: v.number(),
    bouncedCount: v.number(),
    complainedCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const totalContacts =
      args.subscribedCount + args.unsubscribedCount + args.bouncedCount + args.complainedCount;

    const existing = await ctx.db
      .query("emailContactStats")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalContacts,
        subscribedCount: args.subscribedCount,
        unsubscribedCount: args.unsubscribedCount,
        bouncedCount: args.bouncedCount,
        complainedCount: args.complainedCount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailContactStats", {
        storeId: args.storeId,
        totalContacts,
        subscribedCount: args.subscribedCount,
        unsubscribedCount: args.unsubscribedCount,
        bouncedCount: args.bouncedCount,
        complainedCount: args.complainedCount,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Action to count all contacts - can run longer and iterate through batches
 */
export const recalculateContactStats = action({
  args: { storeId: v.string() },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    // Count each status by iterating through batches
    let subscribedCount = 0;
    let unsubscribedCount = 0;
    let bouncedCount = 0;
    let complainedCount = 0;

    // Type for the batch result
    type BatchResult = { count: number; nextCursor: string | null; done: boolean };

    // Count subscribed
    let cursor: string | null = null;
    let done = false;
    while (!done) {
      const result: BatchResult = await ctx.runMutation(internal.emailContacts.countContactsBatch, {
        storeId: args.storeId,
        status: "subscribed",
        cursor: cursor ?? undefined,
      });
      subscribedCount += result.count;
      cursor = result.nextCursor;
      done = result.done;
    }

    // Count unsubscribed
    cursor = null;
    done = false;
    while (!done) {
      const result: BatchResult = await ctx.runMutation(internal.emailContacts.countContactsBatch, {
        storeId: args.storeId,
        status: "unsubscribed",
        cursor: cursor ?? undefined,
      });
      unsubscribedCount += result.count;
      cursor = result.nextCursor;
      done = result.done;
    }

    // Count bounced
    cursor = null;
    done = false;
    while (!done) {
      const result: BatchResult = await ctx.runMutation(internal.emailContacts.countContactsBatch, {
        storeId: args.storeId,
        status: "bounced",
        cursor: cursor ?? undefined,
      });
      bouncedCount += result.count;
      cursor = result.nextCursor;
      done = result.done;
    }

    // Count complained
    cursor = null;
    done = false;
    while (!done) {
      const result: BatchResult = await ctx.runMutation(internal.emailContacts.countContactsBatch, {
        storeId: args.storeId,
        status: "complained",
        cursor: cursor ?? undefined,
      });
      complainedCount += result.count;
      cursor = result.nextCursor;
      done = result.done;
    }

    // Save the stats
    await ctx.runMutation(internal.emailContacts.saveContactStats, {
      storeId: args.storeId,
      subscribedCount,
      unsubscribedCount,
      bouncedCount,
      complainedCount,
    });

    const total = subscribedCount + unsubscribedCount + bouncedCount + complainedCount;
    return {
      success: true,
      message: `Stats updated: ${total.toLocaleString()} total contacts (${subscribedCount.toLocaleString()} subscribed)`,
    };
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
    isEstimate: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    // Try to get cached stats first
    const cachedStats = await ctx.db
      .query("emailContactStats")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (cachedStats) {
      return {
        total: cachedStats.totalContacts,
        subscribed: cachedStats.subscribedCount,
        unsubscribed: cachedStats.unsubscribedCount,
        bounced: cachedStats.bouncedCount,
        avgEngagement: 0, // Not tracked in stats table
        isEstimate: false,
      };
    }

    // Fallback: count with limits if no cached stats
    const LIMIT = 10000;

    const subscribedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "subscribed")
      )
      .take(LIMIT);

    const unsubscribedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "unsubscribed")
      )
      .take(LIMIT);

    const bouncedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "bounced")
      )
      .take(LIMIT);

    const complainedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "complained")
      )
      .take(LIMIT);

    const subscribed = subscribedContacts.length;
    const unsubscribed = unsubscribedContacts.length;
    const bounced = bouncedContacts.length;
    const complained = complainedContacts.length;

    return {
      total: subscribed + unsubscribed + bounced + complained,
      subscribed,
      unsubscribed,
      bounced,
      avgEngagement: 0,
      isEstimate: subscribed >= LIMIT || unsubscribed >= LIMIT,
    };
  },
});

/**
 * Refresh contact stats by counting all contacts
 * This should be called after bulk operations or periodically
 */
export const refreshContactStats = internalMutation({
  args: { storeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Helper function to count all contacts with a specific status using proper pagination
    const countByStatus = async (status: string): Promise<number> => {
      const BATCH_SIZE = 8000;
      let count = 0;
      let cursor: string | null = null;

      while (true) {
        const query = ctx.db
          .query("emailContacts")
          .withIndex("by_storeId_and_status", (q) =>
            q.eq("storeId", args.storeId).eq("status", status as any)
          );

        const paginationResult = await query.paginate({
          cursor,
          numItems: BATCH_SIZE,
        });

        count += paginationResult.page.length;

        if (paginationResult.isDone) break;
        cursor = paginationResult.continueCursor;
      }

      return count;
    };

    // Count all statuses using proper pagination
    const subscribedCount = await countByStatus("subscribed");
    const unsubscribedCount = await countByStatus("unsubscribed");
    const bouncedCount = await countByStatus("bounced");
    const complainedCount = await countByStatus("complained");

    const totalContacts = subscribedCount + unsubscribedCount + bouncedCount + complainedCount;

    // Upsert stats
    const existing = await ctx.db
      .query("emailContactStats")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalContacts,
        subscribedCount,
        unsubscribedCount,
        bouncedCount,
        complainedCount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("emailContactStats", {
        storeId: args.storeId,
        totalContacts,
        subscribedCount,
        unsubscribedCount,
        bouncedCount,
        complainedCount,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Increment contact stats when a contact is added
 */
export const incrementContactStats = internalMutation({
  args: {
    storeId: v.string(),
    status: v.union(
      v.literal("subscribed"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained")
    ),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailContactStats")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (existing) {
      const updates: Record<string, number> = {
        totalContacts: existing.totalContacts + args.count,
        updatedAt: Date.now(),
      };

      if (args.status === "subscribed") {
        updates.subscribedCount = existing.subscribedCount + args.count;
      } else if (args.status === "unsubscribed") {
        updates.unsubscribedCount = existing.unsubscribedCount + args.count;
      } else if (args.status === "bounced") {
        updates.bouncedCount = existing.bouncedCount + args.count;
      } else if (args.status === "complained") {
        updates.complainedCount = existing.complainedCount + args.count;
      }

      await ctx.db.patch(existing._id, updates);
    } else {
      // Create new stats
      await ctx.db.insert("emailContactStats", {
        storeId: args.storeId,
        totalContacts: args.count,
        subscribedCount: args.status === "subscribed" ? args.count : 0,
        unsubscribedCount: args.status === "unsubscribed" ? args.count : 0,
        bouncedCount: args.status === "bounced" ? args.count : 0,
        complainedCount: args.status === "complained" ? args.count : 0,
        updatedAt: Date.now(),
      });
    }

    return null;
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

export const upsertFromCustomer = internalMutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    source: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  },
  returns: v.id("emailContacts"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    const now = Date.now();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.firstName && !existing.firstName) updates.firstName = args.firstName;
      if (args.lastName && !existing.lastName) updates.lastName = args.lastName;
      if (args.customerId) updates.customerId = args.customerId;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("emailContacts", {
      storeId: args.storeId,
      email: args.email.toLowerCase(),
      firstName: args.firstName,
      lastName: args.lastName,
      status: "subscribed",
      subscribedAt: now,
      tagIds: [],
      source: args.source || "customer",
      customerId: args.customerId,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const syncCustomersToEmailContacts = mutation({
  args: {
    storeId: v.string(),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    synced: v.number(),
    skipped: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 500;
    let synced = 0;
    let skipped = 0;

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(batchSize);

    const now = Date.now();

    for (const customer of customers) {
      const existing = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", customer.email.toLowerCase())
        )
        .first();

      if (existing) {
        if (!existing.customerId) {
          await ctx.db.patch(existing._id, {
            customerId: customer._id,
            updatedAt: now,
          });
        }
        skipped++;
        continue;
      }

      const nameParts = customer.name?.split(" ") || [];
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      await ctx.db.insert("emailContacts", {
        storeId: args.storeId,
        email: customer.email.toLowerCase(),
        firstName,
        lastName,
        status: "subscribed",
        subscribedAt: customer._creationTime,
        tagIds: [],
        source: customer.source || "customer_sync",
        customerId: customer._id,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        createdAt: now,
        updatedAt: now,
      });

      synced++;
    }

    return {
      synced,
      skipped,
      total: customers.length,
    };
  },
});

export const syncEnrolledUsersToEmailContacts = mutation({
  args: {
    storeId: v.string(), // This is actually the Clerk userId passed from frontend
  },
  returns: v.object({
    synced: v.number(),
    skipped: v.number(),
    total: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];
    const now = Date.now();

    // Step 1: Get the actual store by userId (the storeId passed is the Clerk user ID)
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .first();

    if (!store) {
      return { synced: 0, skipped: 0, total: 0, errors: ["No store found for this user"] };
    }

    const actualStoreId = store._id;

    // Step 2: Get all courses for this store (using actual Convex store ID)
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", actualStoreId))
      .collect();

    // Also get courses by userId (in case storeId isn't set on some courses)
    const coursesByUserId = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .collect();

    // Merge and deduplicate courses
    const allCourses = [...courses];
    for (const course of coursesByUserId) {
      if (!allCourses.some((c) => c._id === course._id)) {
        allCourses.push(course);
      }
    }

    if (allCourses.length === 0) {
      return { synced: 0, skipped: 0, total: 0, errors: ["No courses found for this store"] };
    }

    const courseIds = new Set(allCourses.map((c) => c._id.toString()));

    // Step 3: Get all enrollments
    const allEnrollmentsRaw = await ctx.db.query("enrollments").collect();

    // Filter enrollments to only those for courses in this store
    const storeEnrollments = allEnrollmentsRaw.filter((e) => courseIds.has(e.courseId));

    if (storeEnrollments.length === 0) {
      return {
        synced: 0,
        skipped: 0,
        total: 0,
        errors: ["No enrollments found for store courses"],
      };
    }

    // Get unique user IDs from enrollments
    const uniqueUserIds = [...new Set(storeEnrollments.map((e) => e.userId))];

    // Step 3: For each unique enrolled user, look up their info and create contact
    for (const clerkId of uniqueUserIds) {
      try {
        // Find user by clerkId
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
          .first();

        if (!user || !user.email) {
          errors.push(`User ${clerkId} not found or has no email`);
          continue;
        }

        // Check if contact already exists
        const existing = await ctx.db
          .query("emailContacts")
          .withIndex("by_storeId_and_email", (q) =>
            q.eq("storeId", args.storeId).eq("email", user.email!.toLowerCase())
          )
          .first();

        if (existing) {
          // Update with enrollment info if missing
          if (!existing.userId) {
            await ctx.db.patch(existing._id, {
              userId: user._id,
              updatedAt: now,
            });
          }
          skipped++;
          continue;
        }

        // Find which courses this user is enrolled in (for tagging)
        const userEnrollments = storeEnrollments.filter((e) => e.userId === clerkId);
        const enrolledCourseIds = userEnrollments.map((e) => e.courseId);

        // Get the first enrolled course for source reference
        const firstEnrolledCourse = allCourses.find(
          (c) => c._id.toString() === enrolledCourseIds[0]
        );

        // Create new contact
        await ctx.db.insert("emailContacts", {
          storeId: args.storeId,
          email: user.email.toLowerCase(),
          firstName: user.firstName || user.name?.split(" ")[0],
          lastName: user.lastName || user.name?.split(" ").slice(1).join(" "),
          status: "subscribed",
          subscribedAt: now,
          tagIds: [],
          source: "course_enrollment",
          sourceCourseId: firstEnrolledCourse?._id,
          userId: user._id,
          emailsSent: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          createdAt: now,
          updatedAt: now,
        });

        synced++;
      } catch (error) {
        errors.push(`Failed to process user ${clerkId}: ${error}`);
      }
    }

    return {
      synced,
      skipped,
      total: uniqueUserIds.length,
      errors,
    };
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

/**
 * Find duplicate contacts by email for a store
 * Returns a summary of duplicates found
 */
export const findDuplicateContacts = action({
  args: {
    storeId: v.string(),
  },
  returns: v.object({
    totalContacts: v.number(),
    uniqueEmails: v.number(),
    duplicateCount: v.number(),
    topDuplicates: v.array(
      v.object({
        email: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Use internal query to scan all contacts
    type ScanResult = { emails: string[]; nextCursor: string | null; done: boolean };

    const emailCounts: Record<string, number> = {};
    let cursor: string | null = null;
    let totalContacts = 0;

    // Iterate through all contacts
    while (true) {
      const result: ScanResult = await ctx.runQuery(internal.emailContacts.scanContactEmails, {
        storeId: args.storeId,
        cursor: cursor ?? undefined,
      });

      for (const email of result.emails) {
        const normalizedEmail = email.toLowerCase();
        emailCounts[normalizedEmail] = (emailCounts[normalizedEmail] || 0) + 1;
        totalContacts++;
      }

      if (result.done) break;
      cursor = result.nextCursor;
    }

    const uniqueEmails = Object.keys(emailCounts).length;
    const duplicateCount = totalContacts - uniqueEmails;

    // Find top duplicates (emails with most copies)
    const topDuplicates = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([email, count]) => ({ email, count }));

    return {
      totalContacts,
      uniqueEmails,
      duplicateCount,
      topDuplicates,
    };
  },
});

/**
 * Internal query to scan contact emails in batches
 */
export const scanContactEmails = internalQuery({
  args: {
    storeId: v.string(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    emails: v.array(v.string()),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const BATCH_SIZE = 8000;

    const query = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    const paginationResult = await query.paginate({
      cursor: args.cursor || null,
      numItems: BATCH_SIZE,
    });

    return {
      emails: paginationResult.page.map((c) => c.email),
      nextCursor: paginationResult.isDone ? null : paginationResult.continueCursor,
      done: paginationResult.isDone,
    };
  },
});

/**
 * Remove duplicate contacts, keeping the oldest one (first created)
 * This action processes duplicates in batches to handle large datasets
 */
export const removeDuplicateContacts = action({
  args: {
    storeId: v.string(),
    dryRun: v.optional(v.boolean()), // If true, just count without deleting
  },
  returns: v.object({
    processed: v.number(),
    deleted: v.number(),
    kept: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;

    // First, build a map of email -> contact IDs (sorted by creation time)
    type ScanResult = {
      contacts: Array<{ id: string; email: string; createdAt: number }>;
      nextCursor: string | null;
      done: boolean;
    };

    const emailToContacts: Record<string, Array<{ id: string; createdAt: number }>> = {};
    let cursor: string | null = null;
    let totalProcessed = 0;

    console.log(`[Dedup] Starting scan for store ${args.storeId}...`);

    // Scan all contacts
    while (true) {
      const result: ScanResult = await ctx.runQuery(internal.emailContacts.scanContactsForDedup, {
        storeId: args.storeId,
        cursor: cursor ?? undefined,
      });

      for (const contact of result.contacts) {
        const normalizedEmail = contact.email.toLowerCase();
        if (!emailToContacts[normalizedEmail]) {
          emailToContacts[normalizedEmail] = [];
        }
        emailToContacts[normalizedEmail].push({
          id: contact.id,
          createdAt: contact.createdAt,
        });
        totalProcessed++;
      }

      if (result.done) break;
      cursor = result.nextCursor;
    }

    console.log(
      `[Dedup] Scanned ${totalProcessed} contacts, found ${Object.keys(emailToContacts).length} unique emails`
    );

    // Collect all IDs to delete
    const idsToDelete: string[] = [];
    let kept = 0;

    for (const [_, contacts] of Object.entries(emailToContacts)) {
      if (contacts.length <= 1) {
        kept++;
        continue;
      }

      // Sort by createdAt ascending (oldest first)
      contacts.sort((a, b) => a.createdAt - b.createdAt);

      // Keep the oldest, mark the rest for deletion
      kept++;
      const toDelete = contacts.slice(1);
      idsToDelete.push(...toDelete.map((c) => c.id));
    }

    console.log(
      `[Dedup] Found ${idsToDelete.length} duplicates to delete, keeping ${kept} contacts`
    );

    if (dryRun) {
      return {
        processed: totalProcessed,
        deleted: idsToDelete.length,
        kept,
        errors: 0,
      };
    }

    // Delete in batches of 100 to avoid conflicts and timeouts
    const BATCH_SIZE = 100;
    let deleted = 0;
    let errors = 0;

    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);

      try {
        const result = await ctx.runMutation(internal.emailContacts.deleteContactsBatch, {
          contactIds: batch as Id<"emailContacts">[],
        });
        deleted += result.deleted;
        errors += result.errors;
      } catch (e) {
        console.error(`[Dedup] Batch delete error:`, e);
        errors += batch.length;
      }

      // Log progress every 1000 deletions
      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= idsToDelete.length) {
        console.log(
          `[Dedup] Progress: ${Math.min(i + BATCH_SIZE, idsToDelete.length)}/${idsToDelete.length} processed`
        );
      }
    }

    // Refresh stats after deduplication
    if (deleted > 0) {
      console.log(`[Dedup] Refreshing stats...`);
      await ctx.runMutation(internal.emailContacts.refreshContactStats, {
        storeId: args.storeId,
      });
    }

    console.log(`[Dedup] Complete! Deleted ${deleted}, kept ${kept}, errors ${errors}`);

    return {
      processed: totalProcessed,
      deleted,
      kept,
      errors,
    };
  },
});

/**
 * Internal mutation to delete contacts in batches (used by deduplication)
 * This is more efficient than deleting one at a time
 */
export const deleteContactsBatch = internalMutation({
  args: {
    contactIds: v.array(v.id("emailContacts")),
  },
  returns: v.object({
    deleted: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    let deleted = 0;
    let errors = 0;

    for (const contactId of args.contactIds) {
      try {
        const contact = await ctx.db.get(contactId);
        if (!contact) {
          continue; // Already deleted
        }

        // Just delete the contact - skip tag count updates for speed
        // Stats will be recalculated at the end
        await ctx.db.delete(contactId);
        deleted++;
      } catch (e) {
        errors++;
      }
    }

    return { deleted, errors };
  },
});

/**
 * Internal query to scan contacts for deduplication
 */
export const scanContactsForDedup = internalQuery({
  args: {
    storeId: v.string(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    contacts: v.array(
      v.object({
        id: v.string(),
        email: v.string(),
        createdAt: v.number(),
      })
    ),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const BATCH_SIZE = 8000;

    const query = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    const paginationResult = await query.paginate({
      cursor: args.cursor || null,
      numItems: BATCH_SIZE,
    });

    return {
      contacts: paginationResult.page.map((c) => ({
        id: c._id,
        email: c.email,
        createdAt: c.createdAt || c._creationTime,
      })),
      nextCursor: paginationResult.isDone ? null : paginationResult.continueCursor,
      done: paginationResult.isDone,
    };
  },
});

/**
 * Internal mutation to delete a contact (used by deduplication)
 */
export const deleteContactInternal = internalMutation({
  args: { contactId: v.id("emailContacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    // Update tag counts
    for (const tagId of contact.tagIds || []) {
      const tag = await ctx.db.get(tagId);
      if (tag && tag.contactCount > 0) {
        await ctx.db.patch(tagId, { contactCount: tag.contactCount - 1 });
      }
    }

    // Delete associated activities
    const activities = await ctx.db
      .query("emailContactActivity")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .take(100);

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(args.contactId);
    return null;
  },
});
