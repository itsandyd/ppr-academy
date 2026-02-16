import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Campaign type validator
const campaignTypeValidator = v.union(
  v.literal("product_launch"),
  v.literal("welcome_onboarding"),
  v.literal("flash_sale"),
  v.literal("reengagement"),
  v.literal("course_milestone"),
  v.literal("seasonal_holiday")
);

// Platform validator
const platformValidator = v.union(
  v.literal("email"),
  v.literal("instagram"),
  v.literal("twitter"),
  v.literal("facebook"),
  v.literal("linkedin"),
  v.literal("tiktok")
);

// Status validator
const statusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("paused")
);

// List campaigns for a store
export const listCampaigns = query({
  args: {
    storeId: v.string(),
    status: v.optional(statusValidator),
    campaignType: v.optional(campaignTypeValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    let query = ctx.db
      .query("marketingCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    let campaigns = await query.take(1000);

    // Filter by status if provided
    if (args.status) {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }

    // Filter by campaign type if provided
    if (args.campaignType) {
      campaigns = campaigns.filter((c) => c.campaignType === args.campaignType);
    }

    // Sort by createdAt descending
    campaigns.sort((a, b) => b.createdAt - a.createdAt);

    // Limit if provided
    if (args.limit) {
      campaigns = campaigns.slice(0, args.limit);
    }

    return campaigns;
  },
});

// List admin campaigns (for admin panel)
export const listAdminCampaigns = query({
  args: {
    status: v.optional(statusValidator),
    campaignType: v.optional(campaignTypeValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user?.admin) return [];

    let campaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", "admin"))
      .take(1000);

    // Filter by status if provided
    if (args.status) {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }

    // Filter by campaign type if provided
    if (args.campaignType) {
      campaigns = campaigns.filter((c) => c.campaignType === args.campaignType);
    }

    // Sort by createdAt descending
    campaigns.sort((a, b) => b.createdAt - a.createdAt);

    // Limit if provided
    if (args.limit) {
      campaigns = campaigns.slice(0, args.limit);
    }

    return campaigns;
  },
});

// Get a single campaign
export const getCampaign = query({
  args: { campaignId: v.id("marketingCampaigns") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;
    await requireStoreOwner(ctx, campaign.storeId);
    return campaign;
  },
});

// Create a new campaign
export const createCampaign = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    templateId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    campaignType: campaignTypeValidator,
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    variableValues: v.optional(v.any()),
    emailContent: v.optional(v.any()),
    instagramContent: v.optional(v.any()),
    twitterContent: v.optional(v.any()),
    facebookContent: v.optional(v.any()),
    linkedinContent: v.optional(v.any()),
    tiktokContent: v.optional(v.any()),
  },
  returns: v.id("marketingCampaigns"),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const now = Date.now();
    return await ctx.db.insert("marketingCampaigns", {
      storeId: args.storeId,
      userId: args.userId,
      templateId: args.templateId,
      name: args.name,
      description: args.description,
      status: "draft",
      campaignType: args.campaignType,
      productId: args.productId,
      courseId: args.courseId,
      variableValues: args.variableValues || {},
      emailContent: args.emailContent,
      instagramContent: args.instagramContent,
      twitterContent: args.twitterContent,
      facebookContent: args.facebookContent,
      linkedinContent: args.linkedinContent,
      tiktokContent: args.tiktokContent,
      scheduledPlatforms: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    variableValues: v.optional(v.any()),
    emailContent: v.optional(v.any()),
    instagramContent: v.optional(v.any()),
    twitterContent: v.optional(v.any()),
    facebookContent: v.optional(v.any()),
    linkedinContent: v.optional(v.any()),
    tiktokContent: v.optional(v.any()),
    scheduledPlatforms: v.optional(v.any()),
    analytics: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const { campaignId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(campaignId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Update platform content
export const updatePlatformContent = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    platform: platformValidator,
    content: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const contentField = `${args.platform}Content` as const;
    await ctx.db.patch(args.campaignId, {
      [contentField]: args.content,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Schedule platform
export const schedulePlatform = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    platform: platformValidator,
    scheduledAt: v.number(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const scheduledPlatforms = campaign.scheduledPlatforms || [];

    // Find existing platform entry
    const existingIndex = scheduledPlatforms.findIndex(
      (p: { platform: string }) => p.platform === args.platform
    );

    const platformEntry = {
      platform: args.platform,
      enabled: args.enabled,
      scheduledAt: args.scheduledAt,
      status: "pending" as const,
    };

    if (existingIndex >= 0) {
      scheduledPlatforms[existingIndex] = {
        ...scheduledPlatforms[existingIndex],
        ...platformEntry,
      };
    } else {
      scheduledPlatforms.push(platformEntry);
    }

    await ctx.db.patch(args.campaignId, {
      scheduledPlatforms,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Update platform status (after sending)
export const updatePlatformStatus = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    platform: platformValidator,
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    postId: v.optional(v.string()),
    emailCampaignId: v.optional(v.id("emailCampaigns")),
    scheduledPostId: v.optional(v.id("scheduledPosts")),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const scheduledPlatforms = campaign.scheduledPlatforms || [];
    const existingIndex = scheduledPlatforms.findIndex(
      (p: { platform: string }) => p.platform === args.platform
    );

    if (existingIndex >= 0) {
      scheduledPlatforms[existingIndex] = {
        ...scheduledPlatforms[existingIndex],
        status: args.status,
        postId: args.postId,
        emailCampaignId: args.emailCampaignId,
        scheduledPostId: args.scheduledPostId,
        error: args.error,
      };

      await ctx.db.patch(args.campaignId, {
        scheduledPlatforms,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Delete a campaign
export const deleteCampaign = mutation({
  args: { campaignId: v.id("marketingCampaigns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    await ctx.db.delete(args.campaignId);
    return null;
  },
});

// Duplicate a campaign
export const duplicateCampaign = mutation({
  args: { campaignId: v.id("marketingCampaigns") },
  returns: v.id("marketingCampaigns"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    const now = Date.now();
    const { _id, _creationTime, ...campaignData } = campaign;

    return await ctx.db.insert("marketingCampaigns", {
      ...campaignData,
      name: `${campaignData.name} (Copy)`,
      status: "draft",
      scheduledPlatforms: [],
      analytics: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update analytics
export const updateAnalytics = mutation({
  args: {
    campaignId: v.id("marketingCampaigns"),
    analytics: v.object({
      emailOpens: v.optional(v.number()),
      emailClicks: v.optional(v.number()),
      socialImpressions: v.optional(v.number()),
      socialEngagement: v.optional(v.number()),
      conversions: v.optional(v.number()),
      revenue: v.optional(v.number()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    await requireStoreOwner(ctx, campaign.storeId);

    await ctx.db.patch(args.campaignId, {
      analytics: args.analytics,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Get campaign stats for a store
export const getCampaignStats = query({
  args: { storeId: v.string() },
  returns: v.object({
    total: v.number(),
    draft: v.number(),
    scheduled: v.number(),
    active: v.number(),
    completed: v.number(),
    paused: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const campaigns = await ctx.db
      .query("marketingCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);

    const stats = {
      total: campaigns.length,
      draft: 0,
      scheduled: 0,
      active: 0,
      completed: 0,
      paused: 0,
    };

    for (const campaign of campaigns) {
      if (campaign.status in stats) {
        stats[campaign.status as keyof typeof stats]++;
      }
    }

    return stats;
  },
});
