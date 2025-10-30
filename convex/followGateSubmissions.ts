import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Follow Gate Submissions
 * 
 * Manages social media follow gates for digital products.
 * Allows creators to gate downloads behind email + social follows.
 */

// Submit a follow gate (user completes requirements)
export const submitFollowGate = mutation({
  args: {
    productId: v.id("digitalProducts"),
    email: v.string(),
    name: v.optional(v.string()),
    followedPlatforms: v.object({
      instagram: v.optional(v.boolean()),
      tiktok: v.optional(v.boolean()),
      youtube: v.optional(v.boolean()),
      spotify: v.optional(v.boolean()),
    }),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    submissionId: v.id("followGateSubmissions"),
    alreadySubmitted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get product to find store and creator
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if user already submitted for this product
    const existing = await ctx.db
      .query("followGateSubmissions")
      .withIndex("by_email_product", (q) =>
        q.eq("email", args.email).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      // Update existing submission with new follow data
      await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        followedPlatforms: args.followedPlatforms,
        submittedAt: Date.now(), // Update timestamp
      });

      return {
        success: true,
        submissionId: existing._id,
        alreadySubmitted: true,
      };
    }

    // Create new submission
    const submissionId = await ctx.db.insert("followGateSubmissions", {
      productId: args.productId,
      storeId: product.storeId,
      creatorId: product.userId,
      email: args.email,
      name: args.name,
      followedPlatforms: args.followedPlatforms,
      submittedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      hasDownloaded: false,
      downloadCount: 0,
    });

    return {
      success: true,
      submissionId,
      alreadySubmitted: false,
    };
  },
});

// Check if user has already submitted follow gate for a product
export const checkFollowGateSubmission = query({
  args: {
    productId: v.id("digitalProducts"),
    email: v.string(),
  },
  returns: v.union(
    v.object({
      hasSubmitted: v.literal(true),
      submission: v.object({
        _id: v.id("followGateSubmissions"),
        submittedAt: v.number(),
        followedPlatforms: v.object({
          instagram: v.optional(v.boolean()),
          tiktok: v.optional(v.boolean()),
          youtube: v.optional(v.boolean()),
          spotify: v.optional(v.boolean()),
        }),
        hasDownloaded: v.optional(v.boolean()),
        downloadCount: v.optional(v.number()),
      }),
    }),
    v.object({
      hasSubmitted: v.literal(false),
    })
  ),
  handler: async (ctx, args) => {
    const submission = await ctx.db
      .query("followGateSubmissions")
      .withIndex("by_email_product", (q) =>
        q.eq("email", args.email).eq("productId", args.productId)
      )
      .first();

    if (!submission) {
      return { hasSubmitted: false as const };
    }

    return {
      hasSubmitted: true as const,
      submission: {
        _id: submission._id,
        submittedAt: submission.submittedAt,
        followedPlatforms: submission.followedPlatforms,
        hasDownloaded: submission.hasDownloaded,
        downloadCount: submission.downloadCount,
      },
    };
  },
});

// Track download after follow gate completion
export const trackFollowGateDownload = mutation({
  args: {
    submissionId: v.id("followGateSubmissions"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      hasDownloaded: true,
      downloadCount: (submission.downloadCount || 0) + 1,
      lastDownloadAt: Date.now(),
    });

    return { success: true };
  },
});

// Get follow gate submissions for a product (creator view)
export const getProductFollowGateSubmissions = query({
  args: {
    productId: v.id("digitalProducts"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("followGateSubmissions"),
      email: v.string(),
      name: v.optional(v.string()),
      followedPlatforms: v.object({
        instagram: v.optional(v.boolean()),
        tiktok: v.optional(v.boolean()),
        youtube: v.optional(v.boolean()),
        spotify: v.optional(v.boolean()),
      }),
      submittedAt: v.number(),
      hasDownloaded: v.optional(v.boolean()),
      downloadCount: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const submissions = await ctx.db
      .query("followGateSubmissions")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(limit);

    return submissions.map((s) => ({
      _id: s._id,
      email: s.email,
      name: s.name,
      followedPlatforms: s.followedPlatforms,
      submittedAt: s.submittedAt,
      hasDownloaded: s.hasDownloaded,
      downloadCount: s.downloadCount,
    }));
  },
});

// Get follow gate analytics for creator
export const getFollowGateAnalytics = query({
  args: {
    productId: v.optional(v.id("digitalProducts")),
    creatorId: v.optional(v.string()),
    storeId: v.optional(v.string()),
  },
  returns: v.object({
    totalSubmissions: v.number(),
    totalDownloads: v.number(),
    platformBreakdown: v.object({
      instagram: v.number(),
      tiktok: v.number(),
      youtube: v.number(),
      spotify: v.number(),
    }),
    conversionRate: v.number(), // % who downloaded after submitting
    recentSubmissions: v.array(
      v.object({
        email: v.string(),
        submittedAt: v.number(),
        platformCount: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    let submissions;

    // Filter by product, creator, or store
    if (args.productId) {
      submissions = await ctx.db
        .query("followGateSubmissions")
        .withIndex("by_product", (q) => q.eq("productId", args.productId!))
        .collect();
    } else if (args.creatorId) {
      submissions = await ctx.db
        .query("followGateSubmissions")
        .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId!))
        .collect();
    } else if (args.storeId) {
      submissions = await ctx.db
        .query("followGateSubmissions")
        .withIndex("by_store", (q) => q.eq("storeId", args.storeId!))
        .collect();
    } else {
      submissions = await ctx.db.query("followGateSubmissions").collect();
    }

    // Calculate analytics
    const totalSubmissions = submissions.length;
    const totalDownloads = submissions.filter((s) => s.hasDownloaded).length;

    const platformBreakdown = {
      instagram: 0,
      tiktok: 0,
      youtube: 0,
      spotify: 0,
    };

    submissions.forEach((s) => {
      if (s.followedPlatforms.instagram) platformBreakdown.instagram++;
      if (s.followedPlatforms.tiktok) platformBreakdown.tiktok++;
      if (s.followedPlatforms.youtube) platformBreakdown.youtube++;
      if (s.followedPlatforms.spotify) platformBreakdown.spotify++;
    });

    const conversionRate =
      totalSubmissions > 0 ? (totalDownloads / totalSubmissions) * 100 : 0;

    // Get recent submissions (last 10)
    const recentSubmissions = submissions
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, 10)
      .map((s) => {
        const platformCount = Object.values(s.followedPlatforms).filter(
          Boolean
        ).length;
        return {
          email: s.email,
          submittedAt: s.submittedAt,
          platformCount,
        };
      });

    return {
      totalSubmissions,
      totalDownloads,
      platformBreakdown,
      conversionRate,
      recentSubmissions,
    };
  },
});

