import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
    status: v.optional(v.union(
      v.literal("draft"), 
      v.literal("scheduled"), 
      v.literal("sending"), 
      v.literal("sent"), 
      v.literal("failed")
    )),
  },
  returns: v.array(v.object({
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
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("emailCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.order("desc").collect();
  },
});

// Get single campaign with details
export const getCampaign = query({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.union(v.null(), v.object({
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
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
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
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

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
        .withIndex("by_campaignId", (q) => 
          q.eq("campaignId", args.campaignId)
        )
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
      .collect();

    await ctx.db.patch(args.campaignId, {
      recipientCount: totalRecipients.length,
    });

    return addedCount;
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
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "draft") {
      throw new Error("Can only remove recipients from draft campaigns");
    }

    let removedCount = 0;

    for (const customerId of args.customerIds) {
      const recipient = await ctx.db
        .query("emailCampaignRecipients")
        .withIndex("by_campaignId", (q) => 
          q.eq("campaignId", args.campaignId)
        )
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
      .collect();

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
    status: v.optional(v.union(
      v.literal("queued"),
      v.literal("sent"), 
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    )),
  },
  returns: v.array(v.object({
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
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.collect();
  },
});

// Note: The sendCampaign action has been moved to convex/emails.ts 
// since it needs Node.js access for store-specific Resend integration

// Internal function to get campaign for sending
export const getCampaignForSending = query({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.union(v.null(), v.object({
    _id: v.id("emailCampaigns"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"), 
      v.literal("scheduled"), 
      v.literal("sending"), 
      v.literal("sent"), 
      v.literal("failed")
    ),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    recipientCount: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

// Internal function to update campaign status
export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    status: v.union(
      v.literal("draft"), 
      v.literal("scheduled"), 
      v.literal("sending"), 
      v.literal("sent"), 
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "sending") {
      throw new Error("Cannot delete campaign that is currently sending");
    }

    // Delete all recipients first
    const recipients = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id);
    }

    // Delete the campaign
    await ctx.db.delete(args.campaignId);
    return null;
  },
}); 