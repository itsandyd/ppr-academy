import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// SOCIAL ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Connect a social media account to a store
 */
export const connectSocialAccount = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    platformDisplayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    grantedScopes: v.array(v.string()),
    platformData: v.optional(v.any()),
  },
  returns: v.id("socialAccounts"),
  handler: async (ctx, args) => {
    // Check if THIS SPECIFIC account already exists (by platformUserId)
    // This allows multiple accounts per platform (e.g., multiple Instagram accounts)
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_store_platform_user", (q) => 
        q.eq("storeId", args.storeId)
         .eq("platform", args.platform)
         .eq("platformUserId", args.platformUserId)
      )
      .first();

    if (existing) {
      // Update existing account (re-authorization or token refresh)
      await ctx.db.patch(existing._id, {
        platformUsername: args.platformUsername,
        platformDisplayName: args.platformDisplayName,
        profileImageUrl: args.profileImageUrl,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        grantedScopes: args.grantedScopes,
        platformData: args.platformData,
        isActive: true,
        isConnected: true,
        lastVerified: Date.now(),
        connectionError: undefined,
      });
      return existing._id;
    }

    // Create new account (supports multiple accounts per platform)
    return await ctx.db.insert("socialAccounts", {
      storeId: args.storeId,
      userId: args.userId,
      platform: args.platform,
      platformUserId: args.platformUserId,
      platformUsername: args.platformUsername,
      platformDisplayName: args.platformDisplayName,
      profileImageUrl: args.profileImageUrl,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      grantedScopes: args.grantedScopes,
      platformData: args.platformData,
      isActive: true,
      isConnected: true,
      lastVerified: Date.now(),
    });
  },
});

/**
 * Get all social accounts for a store
 */
export const getSocialAccounts = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("socialAccounts"),
    _creationTime: v.number(),
    storeId: v.string(),
    userId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),
    platformDisplayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    isConnected: v.boolean(),
    lastVerified: v.optional(v.number()),
    connectionError: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Don't return sensitive token data
    return accounts.map((account) => ({
      _id: account._id,
      _creationTime: account._creationTime,
      storeId: account.storeId,
      userId: account.userId,
      platform: account.platform,
      platformUserId: account.platformUserId,
      platformUsername: account.platformUsername,
      platformDisplayName: account.platformDisplayName,
      profileImageUrl: account.profileImageUrl,
      isActive: account.isActive,
      isConnected: account.isConnected,
      lastVerified: account.lastVerified,
      connectionError: account.connectionError,
    }));
  },
});

/**
 * Disconnect a social account
 */
export const disconnectSocialAccount = mutation({
  args: {
    accountId: v.id("socialAccounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.accountId, {
      isActive: false,
      isConnected: false,
      connectionError: "Disconnected by user",
    });

    return null;
  },
});

/**
 * Update account label to distinguish between multiple accounts
 */
export const updateAccountLabel = mutation({
  args: {
    accountId: v.id("socialAccounts"),
    userId: v.string(),
    label: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.accountId, {
      accountLabel: args.label,
    });

    return null;
  },
});

/**
 * Delete a social account permanently
 */
export const deleteSocialAccount = mutation({
  args: {
    accountId: v.id("socialAccounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Cancel any scheduled posts for this account
    const scheduledPosts = await ctx.db
      .query("scheduledPosts")
      .withIndex("by_socialAccountId", (q) => q.eq("socialAccountId", args.accountId))
      .filter((q) => q.eq(q.field("status"), "scheduled"))
      .collect();

    for (const post of scheduledPosts) {
      await ctx.db.patch(post._id, {
        status: "cancelled" as const,
      });
    }

    // Delete the account
    await ctx.db.delete(args.accountId);

    return null;
  },
});

// ============================================================================
// SCHEDULED POST MANAGEMENT
// ============================================================================

/**
 * Create a scheduled post
 */
export const createScheduledPost = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    socialAccountId: v.id("socialAccounts"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    scheduledFor: v.number(),
    timezone: v.string(),
    postType: v.union(
      v.literal("post"),
      v.literal("story"),
      v.literal("reel"),
      v.literal("tweet"),
      v.literal("thread")
    ),
    platformOptions: v.optional(v.any()),
  },
  returns: v.id("scheduledPosts"),
  handler: async (ctx, args) => {
    // Verify the social account belongs to this store
    const account = await ctx.db.get(args.socialAccountId);
    
    if (!account) {
      throw new Error("Social account not found");
    }

    if (account.storeId !== args.storeId || account.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (!account.isConnected || !account.isActive) {
      throw new Error("Social account is not connected");
    }

    // Create the scheduled post
    const postId = await ctx.db.insert("scheduledPosts", {
      storeId: args.storeId,
      userId: args.userId,
      socialAccountId: args.socialAccountId,
      content: args.content,
      mediaUrls: args.mediaUrls,
      mediaStorageIds: args.mediaStorageIds,
      scheduledFor: args.scheduledFor,
      timezone: args.timezone,
      postType: args.postType,
      platformOptions: args.platformOptions,
      status: "scheduled",
      retryCount: 0,
    });

    return postId;
  },
});

/**
 * Get media URLs from storage IDs
 */
export const getMediaUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  returns: v.array(v.object({
    storageId: v.id("_storage"),
    url: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, args) => {
    const results = [];
    
    for (const storageId of args.storageIds) {
      const url = await ctx.storage.getUrl(storageId);
      results.push({ storageId, url });
    }
    
    return results;
  },
});

/**
 * Generate upload URL for media files
 */
export const generateMediaUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Generate upload URL with extended timeout for large video files
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get scheduled posts for a store
 */
export const getScheduledPosts = query({
  args: {
    storeId: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let posts;

    if (args.status !== undefined) {
      // Store status in a local variable to help TypeScript with type narrowing
      const status = args.status;
      // Use the store_status index when status is provided
      posts = await ctx.db
        .query("scheduledPosts")
        .withIndex("by_store_status", (q) => 
          q.eq("storeId", args.storeId).eq("status", status)
        )
        .order("desc")
        .take(args.limit || 100);
    } else {
      // Use the storeId index when no status filter
      posts = await ctx.db
        .query("scheduledPosts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .take(args.limit || 100);
    }

    // Enrich with social account info
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const account = await ctx.db.get(post.socialAccountId);
        return {
          ...post,
          account: account ? {
            platform: (account as any)?.platform,
            platformUsername: (account as any)?.platformUsername,
            platformDisplayName: (account as any)?.platformDisplayName,
            profileImageUrl: (account as any)?.profileImageUrl,
          } : null,
        };
      })
    );

    return enrichedPosts;
  },
});

/**
 * Update a scheduled post
 */
export const updateScheduledPost = mutation({
  args: {
    postId: v.id("scheduledPosts"),
    userId: v.string(),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    scheduledFor: v.optional(v.number()),
    timezone: v.optional(v.string()),
    postType: v.optional(v.union(
      v.literal("post"),
      v.literal("story"),
      v.literal("reel"),
      v.literal("tweet"),
      v.literal("thread")
    )),
    platformOptions: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (post.status === "published" || post.status === "publishing") {
      throw new Error("Cannot update a post that is already published or publishing");
    }

    const updates: any = {};
    if (args.content !== undefined) updates.content = args.content;
    if (args.mediaUrls !== undefined) updates.mediaUrls = args.mediaUrls;
    if (args.mediaStorageIds !== undefined) updates.mediaStorageIds = args.mediaStorageIds;
    if (args.scheduledFor !== undefined) updates.scheduledFor = args.scheduledFor;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.postType !== undefined) updates.postType = args.postType;
    if (args.platformOptions !== undefined) updates.platformOptions = args.platformOptions;
    
    // Reset retry count and clear errors when updating
    updates.retryCount = 0;
    updates.publishError = undefined;
    if (post.status === "failed") {
      updates.status = "scheduled";
    }

    await ctx.db.patch(args.postId, updates);

    return null;
  },
});

/**
 * Delete a scheduled post
 */
export const deleteScheduledPost = mutation({
  args: {
    postId: v.id("scheduledPosts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (post.status === "publishing") {
      throw new Error("Cannot delete a post that is currently being published");
    }

    await ctx.db.delete(args.postId);

    return null;
  },
});

/**
 * Cancel a scheduled post
 */
export const cancelScheduledPost = mutation({
  args: {
    postId: v.id("scheduledPosts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (post.status === "published") {
      throw new Error("Cannot cancel a post that is already published");
    }

    await ctx.db.patch(args.postId, {
      status: "cancelled",
    });

    return null;
  },
});

// ============================================================================
// POST TEMPLATES
// ============================================================================

/**
 * Create a post template
 */
export const createPostTemplate = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    platforms: v.array(v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    )),
  },
  returns: v.id("postTemplates"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("postTemplates", {
      storeId: args.storeId,
      userId: args.userId,
      name: args.name,
      description: args.description,
      category: args.category,
      content: args.content,
      mediaUrls: args.mediaUrls,
      platforms: args.platforms,
      useCount: 0,
    });
  },
});

/**
 * Get post templates for a store
 */
export const getPostTemplates = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("postTemplates")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

// ============================================================================
// INTERNAL FUNCTIONS FOR CRON/BACKGROUND PROCESSING
// ============================================================================

/**
 * Get posts that need to be published (internal query for cron)
 */
export const getPostsToPublish = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // Don't retry posts older than 1 hour

    // Get posts scheduled for the next 5 minutes
    const posts = await ctx.db
      .query("scheduledPosts")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    // Filter posts that are due now (scheduledFor time has passed)
    const postsToPublish = posts.filter((post) => {
      // Post is due if scheduled time is in the past, but not too old (within 1 hour)
      return post.scheduledFor <= now && post.scheduledFor > oneHourAgo;
    });
    
    console.log(`📅 Current time: ${new Date(now).toISOString()}`);
    console.log(`📋 Found ${posts.length} scheduled posts, ${postsToPublish.length} are due now`);
    
    if (postsToPublish.length > 0) {
      postsToPublish.forEach(post => {
        console.log(`  ⏰ Post ${post._id} scheduled for ${new Date(post.scheduledFor).toISOString()} (${Math.round((now - post.scheduledFor) / 1000)}s ago)`);
      });
    }

    // Enrich with account data and media URLs
    const enrichedPosts = await Promise.all(
      postsToPublish.map(async (post) => {
        const account = await ctx.db.get(post.socialAccountId);
        
        // Convert storage IDs to public URLs for social media platforms
        // Instagram and other platforms need publicly accessible URLs with file extensions
        let mediaUrls: string[] = [];
        if (post.mediaStorageIds && post.mediaStorageIds.length > 0) {
          // Get the deployment URL from environment or use default
          const deploymentUrl = process.env.CONVEX_SITE_URL || process.env.CONVEX_URL;
          
          // Generate URLs with file extensions for better Instagram compatibility
          // Use .jpg as default extension - the endpoint will detect actual type and serve correctly
          mediaUrls = post.mediaStorageIds.map((storageId: any) => {
            return `${deploymentUrl}/social/media/${storageId}.jpg`;
          });
          
          console.log(`  📎 Converted ${mediaUrls.length} storage IDs to public URLs`);
        }
        
        return {
          ...post,
          account,
          mediaUrls,
        };
      })
    );

    return enrichedPosts;
  },
});

/**
 * Update post status after publishing attempt
 */
export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("scheduledPosts"),
    status: v.union(
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    ),
    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === "published") {
      updates.publishedAt = Date.now();
      updates.platformPostId = args.platformPostId;
      updates.platformPostUrl = args.platformPostUrl;
    } else if (args.status === "failed") {
      updates.errorMessage = args.errorMessage;
      const post = await ctx.db.get(args.postId);
      if (post) {
        updates.retryCount = post.retryCount + 1;
        updates.lastRetryAt = Date.now();
      }
    }

    await ctx.db.patch(args.postId, updates);

    return null;
  },
});

/**
 * Refresh token for a social account
 */
export const refreshAccountToken = internalMutation({
  args: {
    accountId: v.id("socialAccounts"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      lastVerified: Date.now(),
    });

    return null;
  },
});
