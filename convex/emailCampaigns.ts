import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Email campaigns are now sent using store-specific Resend configurations
// See convex/emails.ts for the actual email sending actions

// Create a new email campaign
export const createCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    previewText: v.optional(v.string()),
    storeId: v.string(),
    adminUserId: v.string(),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()), // Track which template was used
  },
  returns: v.id("emailCampaigns"),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const campaignId = await ctx.db.insert("emailCampaigns", {
      name: args.name,
      subject: args.subject,
      content: args.content,
      previewText: args.previewText,
      storeId: args.storeId,
      adminUserId: args.adminUserId,
      status: "draft",
      fromEmail: args.fromEmail,
      replyToEmail: args.replyToEmail,
      tags: args.tags,
      templateId: args.templateId,
    });

    return campaignId;
  },
});

// Update an existing campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const { campaignId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(campaignId, cleanUpdates);
    }

    return null;
  },
});

// Get campaigns for a store
export const getCampaigns = query({
  args: {
    storeId: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed"),
        v.literal("paused"),
        v.literal("partial")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("emailCampaigns"),
      _creationTime: v.number(),
      name: v.string(),
      subject: v.string(),
      content: v.string(),
      previewText: v.optional(v.string()),
      storeId: v.string(),
      adminUserId: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed"),
        v.literal("paused"),
        v.literal("partial")
      ),
      scheduledAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      recipientCount: v.optional(v.number()),
      sentCount: v.optional(v.number()),
      deliveredCount: v.optional(v.number()),
      openedCount: v.optional(v.number()),
      clickedCount: v.optional(v.number()),
      fromEmail: v.string(),
      replyToEmail: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      templateId: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    let query = ctx.db
      .query("emailCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.order("desc").take(5000);
  },
});

// Get single campaign with details
export const getCampaign = query({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("emailCampaigns"),
      _creationTime: v.number(),
      name: v.string(),
      subject: v.string(),
      content: v.string(),
      storeId: v.string(),
      adminUserId: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed"),
        v.literal("paused"),
        v.literal("partial")
      ),
      scheduledAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      recipientCount: v.optional(v.number()),
      sentCount: v.optional(v.number()),
      deliveredCount: v.optional(v.number()),
      openedCount: v.optional(v.number()),
      clickedCount: v.optional(v.number()),
      fromEmail: v.string(),
      replyToEmail: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      previewText: v.optional(v.string()),
      templateId: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;
    await requireStoreOwner(ctx, campaign.storeId);
    return campaign;
  },
});

// Add recipients to a campaign
export const addRecipients = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    customerIds: v.array(v.id("customers")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    await requireStoreOwner(ctx, campaign.storeId);

    if (campaign.status !== "draft") {
      throw new Error("Can only add recipients to draft campaigns");
    }

    let addedCount = 0;

    for (const customerId of args.customerIds) {
      const customer = await ctx.db.get(customerId);
      if (!customer) continue;

      // Check if recipient already exists
      const existing = await ctx.db
        .query("emailCampaignRecipients")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
        .filter((q) => q.eq(q.field("customerId"), customerId))
        .first();

      if (!existing) {
        await ctx.db.insert("emailCampaignRecipients", {
          campaignId: args.campaignId,
          customerId: customerId,
          customerEmail: customer.email,
          customerName: customer.name,
          status: "queued",
        });
        addedCount++;
      }
    }

    // Update recipient count on campaign
    const totalRecipients = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    await ctx.db.patch(args.campaignId, {
      recipientCount: totalRecipients.length,
    });

    return addedCount;
  },
});

// Add ALL customers from a store as recipients (for bulk sends)
// Uses cursor-based pagination to avoid reading too many documents
export const addAllCustomersAsRecipients = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    storeId: v.string(),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()), // Pagination cursor from previous batch
    currentTotalCount: v.optional(v.number()), // Current total from previous batch
  },
  returns: v.object({
    addedCount: v.number(),
    totalCount: v.number(),
    hasMore: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "draft") {
      throw new Error("Can only add recipients to draft campaigns");
    }

    const batchSize = args.batchSize || 100;
    let currentTotalCount = args.currentTotalCount || 0;

    // Use cursor-based pagination - this is the only safe way for large datasets
    const paginationResult = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("asc")
      .paginate({
        cursor: args.cursor || null,
        numItems: batchSize,
      });

    if (paginationResult.page.length === 0) {
      // No more customers - update final count
      await ctx.db.patch(args.campaignId, {
        recipientCount: currentTotalCount,
      });

      return {
        addedCount: 0,
        totalCount: currentTotalCount,
        hasMore: false,
        nextCursor: undefined,
      };
    }

    // Add all customers in this batch
    let addedCount = 0;
    for (const customer of paginationResult.page) {
      await ctx.db.insert("emailCampaignRecipients", {
        campaignId: args.campaignId,
        customerId: customer._id,
        customerEmail: customer.email,
        customerName: customer.name,
        status: "queued",
      });
      addedCount++;
      currentTotalCount++;
    }

    const hasMore = !paginationResult.isDone;

    // Update count periodically (every ~10 batches to reduce writes)
    if (!hasMore || currentTotalCount % 1000 < batchSize) {
      await ctx.db.patch(args.campaignId, {
        recipientCount: currentTotalCount,
      });
    }

    return {
      addedCount,
      totalCount: currentTotalCount,
      hasMore,
      nextCursor: hasMore ? paginationResult.continueCursor : undefined,
    };
  },
});

// Duplicate all recipients from one campaign to another (for resending)
export const duplicateAllRecipients = mutation({
  args: {
    sourceCampaignId: v.id("emailCampaigns"),
    targetCampaignId: v.id("emailCampaigns"),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
    currentTotalCount: v.optional(v.number()),
  },
  returns: v.object({
    addedCount: v.number(),
    totalCount: v.number(),
    hasMore: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const targetCampaign = await ctx.db.get(args.targetCampaignId);
    if (!targetCampaign) throw new Error("Target campaign not found");
    await requireStoreOwner(ctx, targetCampaign.storeId);

    // Allow adding recipients to draft or sending campaigns
    // (sending status is set at the start of processing)
    if (targetCampaign.status !== "draft" && targetCampaign.status !== "sending") {
      throw new Error("Can only add recipients to draft or sending campaigns");
    }

    const batchSize = args.batchSize || 100;
    let currentTotalCount = args.currentTotalCount || 0;

    // Get a batch of recipients from the source campaign
    const paginationResult = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.sourceCampaignId))
      .paginate({
        cursor: args.cursor || null,
        numItems: batchSize,
      });

    // Copy each recipient to the target campaign
    let addedCount = 0;
    for (const sourceRecipient of paginationResult.page) {
      await ctx.db.insert("emailCampaignRecipients", {
        campaignId: args.targetCampaignId,
        customerId: sourceRecipient.customerId,
        customerEmail: sourceRecipient.customerEmail,
        customerName: sourceRecipient.customerName,
        status: "queued", // Reset status to queued for new campaign
      });
      addedCount++;
      currentTotalCount++;
    }

    const hasMore = !paginationResult.isDone;

    // Update count periodically
    if (!hasMore || currentTotalCount % 1000 < batchSize) {
      await ctx.db.patch(args.targetCampaignId, {
        recipientCount: currentTotalCount,
      });
    }

    return {
      addedCount,
      totalCount: currentTotalCount,
      hasMore,
      nextCursor: hasMore ? paginationResult.continueCursor : undefined,
    };
  },
});

// Remove recipients from a campaign
export const removeRecipients = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    customerIds: v.array(v.id("customers")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    await requireStoreOwner(ctx, campaign.storeId);

    if (campaign.status !== "draft") {
      throw new Error("Can only remove recipients from draft campaigns");
    }

    let removedCount = 0;

    for (const customerId of args.customerIds) {
      const recipient = await ctx.db
        .query("emailCampaignRecipients")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
        .filter((q) => q.eq(q.field("customerId"), customerId))
        .first();

      if (recipient) {
        await ctx.db.delete(recipient._id);
        removedCount++;
      }
    }

    // Update recipient count
    const totalRecipients = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    await ctx.db.patch(args.campaignId, {
      recipientCount: totalRecipients.length,
    });

    return removedCount;
  },
});

// Get campaign recipients
export const getCampaignRecipients = query({
  args: {
    campaignId: v.id("emailCampaigns"),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("opened"),
        v.literal("clicked"),
        v.literal("bounced"),
        v.literal("failed")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("emailCampaignRecipients"),
      _creationTime: v.number(),
      campaignId: v.id("emailCampaigns"),
      customerId: v.id("customers"),
      customerEmail: v.string(),
      customerName: v.string(),
      status: v.union(
        v.literal("queued"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("opened"),
        v.literal("clicked"),
        v.literal("bounced"),
        v.literal("failed")
      ),
      sentAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      openedAt: v.optional(v.number()),
      clickedAt: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      resendMessageId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    let query = ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.take(5000);
  },
});

// Note: The sendCampaign action has been moved to convex/emails.ts
// since it needs Node.js access for store-specific Resend integration

// Internal function to get campaign for sending
export const getCampaignForSending = query({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("emailCampaigns"),
      name: v.string(),
      subject: v.string(),
      content: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed"),
        v.literal("paused"),
        v.literal("partial")
      ),
      fromEmail: v.string(),
      replyToEmail: v.optional(v.string()),
      recipientCount: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

// Update campaign status (requires store ownership)
export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("paused"),
      v.literal("partial")
    ),
    sentAt: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const updates: any = { status: args.status };

    if (args.sentAt !== undefined) updates.sentAt = args.sentAt;
    if (args.deliveredCount !== undefined) updates.deliveredCount = args.deliveredCount;

    await ctx.db.patch(args.campaignId, updates);
    return null;
  },
});

// Note: Campaign processing functions have been moved to convex/emails.ts
// This file now contains only the core campaign management mutations and queries

// Delete campaign
export const deleteCampaign = mutation({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    await requireStoreOwner(ctx, campaign.storeId);

    if (campaign.status === "sending") {
      throw new Error("Cannot delete campaign that is currently sending");
    }

    // Delete all recipients first
    const recipients = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id);
    }

    // Delete the campaign
    await ctx.db.delete(args.campaignId);
    return null;
  },
});

export const addRecipientsFromTags = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    storeId: v.string(),
    targetTagIds: v.array(v.id("emailTags")),
    targetTagMode: v.optional(v.union(v.literal("all"), v.literal("any"))),
    excludeTagIds: v.optional(v.array(v.id("emailTags"))),
  },
  returns: v.object({
    addedCount: v.number(),
    skippedCount: v.number(),
    totalRecipients: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft") throw new Error("Can only add recipients to draft campaigns");

    const mode = args.targetTagMode || "all";
    let addedCount = 0;
    let skippedCount = 0;

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .take(5000);

    const matchingContacts = contacts.filter((contact) => {
      const contactTagIds = contact.tagIds || [];

      if (args.excludeTagIds && args.excludeTagIds.length > 0) {
        const hasExcludedTag = args.excludeTagIds.some((excludeId) =>
          contactTagIds.includes(excludeId)
        );
        if (hasExcludedTag) return false;
      }

      if (args.targetTagIds.length === 0) return true;

      if (mode === "all") {
        return args.targetTagIds.every((tagId) => contactTagIds.includes(tagId));
      } else {
        return args.targetTagIds.some((tagId) => contactTagIds.includes(tagId));
      }
    });

    for (const contact of matchingContacts) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_email_and_store", (q) =>
          q.eq("email", contact.email).eq("storeId", args.storeId)
        )
        .first();

      if (!customer) {
        skippedCount++;
        continue;
      }

      const existing = await ctx.db
        .query("emailCampaignRecipients")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
        .filter((q) => q.eq(q.field("customerId"), customer._id))
        .first();

      if (existing) {
        skippedCount++;
        continue;
      }

      await ctx.db.insert("emailCampaignRecipients", {
        campaignId: args.campaignId,
        customerId: customer._id,
        customerEmail: customer.email,
        customerName: customer.name,
        status: "queued",
      });
      addedCount++;
    }

    const totalRecipients = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    await ctx.db.patch(args.campaignId, {
      recipientCount: totalRecipients.length,
      targetTagIds: args.targetTagIds,
      targetTagMode: args.targetTagMode,
      excludeTagIds: args.excludeTagIds,
    });

    return {
      addedCount,
      skippedCount,
      totalRecipients: totalRecipients.length,
    };
  },
});

export const getTagPreview = query({
  args: {
    storeId: v.string(),
    targetTagIds: v.array(v.id("emailTags")),
    targetTagMode: v.optional(v.union(v.literal("all"), v.literal("any"))),
    excludeTagIds: v.optional(v.array(v.id("emailTags"))),
  },
  returns: v.object({
    matchingContacts: v.number(),
    matchingCustomers: v.number(),
    sampleEmails: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const mode = args.targetTagMode || "all";

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .take(5000);

    const matchingContacts = contacts.filter((contact) => {
      const contactTagIds = contact.tagIds || [];

      if (args.excludeTagIds && args.excludeTagIds.length > 0) {
        const hasExcludedTag = args.excludeTagIds.some((excludeId) =>
          contactTagIds.includes(excludeId)
        );
        if (hasExcludedTag) return false;
      }

      if (args.targetTagIds.length === 0) return true;

      if (mode === "all") {
        return args.targetTagIds.every((tagId) => contactTagIds.includes(tagId));
      } else {
        return args.targetTagIds.some((tagId) => contactTagIds.includes(tagId));
      }
    });

    let matchingCustomerCount = 0;
    const sampleEmails: string[] = [];

    for (const contact of matchingContacts.slice(0, 100)) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_email_and_store", (q) =>
          q.eq("email", contact.email).eq("storeId", args.storeId)
        )
        .first();

      if (customer) {
        matchingCustomerCount++;
        if (sampleEmails.length < 5) {
          sampleEmails.push(contact.email);
        }
      }
    }

    return {
      matchingContacts: matchingContacts.length,
      matchingCustomers: matchingCustomerCount,
      sampleEmails,
    };
  },
});

/**
 * Update resendCampaigns content - for fixing campaigns missing content (admin only)
 */
export const updateResendCampaignContent = mutation({
  args: {
    campaignId: v.id("resendCampaigns"),
    htmlContent: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user?.admin) throw new Error("Admin access required");

    await ctx.db.patch(args.campaignId, {
      htmlContent: args.htmlContent,
      updatedAt: Date.now(),
    });
  },
});
