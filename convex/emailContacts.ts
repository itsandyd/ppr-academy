import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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
    cursor: v.optional(v.string()), // Cursor for pagination (contact ID)
  },
  returns: v.object({
    contacts: v.array(v.any()),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 200); // Max 200 per page to stay under read limits

    // Build query based on filters
    let query;
    if (args.status) {
      // Use compound index for status filtering
      const status = args.status; // Capture for TypeScript narrowing
      query = ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_status", (q) =>
          q.eq("storeId", args.storeId).eq("status", status)
        );
    } else {
      query = ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));
    }

    // For tag filtering, we need to scan and filter manually
    // Fetch extra to account for filtering + check hasMore
    const fetchLimit = args.tagId ? limit * 5 : limit + 1;

    let contacts = await query.order("desc").take(fetchLimit);

    // Apply cursor - skip contacts until we find the cursor
    if (args.cursor) {
      const cursorIndex = contacts.findIndex((c) => c._id === args.cursor);
      if (cursorIndex >= 0) {
        contacts = contacts.slice(cursorIndex + 1);
      }
    }

    // Filter by tag if needed
    if (args.tagId) {
      contacts = contacts.filter((c) => c.tagIds.includes(args.tagId as Id<"emailTags">));
    }

    // Determine hasMore and trim to limit
    const hasMore = contacts.length > limit;
    const paginatedContacts = contacts.slice(0, limit);
    const nextCursor = paginatedContacts.length > 0
      ? paginatedContacts[paginatedContacts.length - 1]._id
      : null;

    // Resolve tags for display
    const tagsCache: Record<string, { _id: Id<"emailTags">; name: string; color?: string } | null> =
      {};

    const contactsWithTags = await Promise.all(
      paginatedContacts.map(async (contact) => {
        const tags = await Promise.all(
          contact.tagIds.map(async (tagId) => {
            if (tagsCache[tagId] === undefined) {
              const tag = await ctx.db.get(tagId) as { _id: Id<"emailTags">; name: string; color?: string } | null;
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
      nextCursor,
      hasMore,
    };
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
    const contacts = await Promise.all(
      args.contactIds.map((id) => ctx.db.get(id))
    );

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
 * Bulk import contacts from CSV data
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
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const now = Date.now();

    // Track emails we've seen in this batch to prevent duplicates within the batch
    const seenEmails = new Set<string>();

    for (const contact of args.contacts) {
      // Validate email
      const email = contact.email?.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        errors++;
        continue;
      }

      // Skip if we've already processed this email in this batch
      if (seenEmails.has(email)) {
        skipped++;
        continue;
      }
      seenEmails.add(email);

      // Check for existing contact using index (efficient single lookup)
      const existingContact = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", email)
        )
        .first();

      // Skip duplicates
      if (existingContact) {
        skipped++;
        continue;
      }

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

    return { imported, skipped, errors };
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
    // Use indexed queries to count each status separately
    // This avoids reading all documents at once
    const COUNT_LIMIT = 10000; // Max to count per status

    // Count subscribed contacts
    const subscribedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "subscribed")
      )
      .take(COUNT_LIMIT);
    const subscribed = subscribedContacts.length;

    // Count unsubscribed contacts
    const unsubscribedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "unsubscribed")
      )
      .take(COUNT_LIMIT);
    const unsubscribed = unsubscribedContacts.length;

    // Count bounced contacts
    const bouncedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "bounced")
      )
      .take(COUNT_LIMIT);
    const bounced = bouncedContacts.length;

    // Count complained contacts
    const complainedContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_status", (q) =>
        q.eq("storeId", args.storeId).eq("status", "complained")
      )
      .take(COUNT_LIMIT);
    const complained = complainedContacts.length;

    const total = subscribed + unsubscribed + bounced + complained;

    // Sample engagement scores from subscribed contacts (use what we already fetched)
    const engagementScores = subscribedContacts
      .slice(0, 1000) // Sample from first 1000
      .filter((c) => c.engagementScore !== undefined)
      .map((c) => c.engagementScore as number);

    const avgEngagement =
      engagementScores.length > 0
        ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
        : 0;

    // Flag if any count hit the limit (estimate)
    const isEstimate =
      subscribed >= COUNT_LIMIT ||
      unsubscribed >= COUNT_LIMIT ||
      bounced >= COUNT_LIMIT ||
      complained >= COUNT_LIMIT;

    return {
      total,
      subscribed,
      unsubscribed,
      bounced,
      avgEngagement: Math.round(avgEngagement),
      isEstimate,
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
      return { synced: 0, skipped: 0, total: 0, errors: ["No enrollments found for store courses"] };
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
        const firstEnrolledCourse = allCourses.find((c) => c._id.toString() === enrolledCourseIds[0]);

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
