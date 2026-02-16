import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all published blog posts (for public blog page)
 * Returns posts in reverse chronological order
 */
export const getPublishedPosts = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("blogPosts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      authorId: v.string(),
      authorName: v.optional(v.string()),
      authorAvatar: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      publishedAt: v.optional(v.number()),
      readTimeMinutes: v.optional(v.number()),
      views: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc");

    const posts = await query.take(500);

    // Filter by category if provided
    let filtered = args.category
      ? posts.filter((p) => p.category === args.category)
      : posts;

    // Apply limit if provided
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Map to return type (exclude content for listing)
    return filtered.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      category: post.category,
      tags: post.tags,
      publishedAt: post.publishedAt,
      readTimeMinutes: post.readTimeMinutes,
      views: post.views,
      createdAt: post.createdAt,
    }));
  },
});

/**
 * Get a single blog post by slug (for public post detail page)
 */
export const getPostBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("blogPosts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.optional(v.string()),
      content: v.string(),
      coverImage: v.optional(v.string()),
      authorId: v.string(),
      authorName: v.optional(v.string()),
      authorAvatar: v.optional(v.string()),
      storeId: v.optional(v.id("stores")),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      keywords: v.optional(v.array(v.string())),
      canonicalUrl: v.optional(v.string()),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      publishedAt: v.optional(v.number()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      views: v.optional(v.number()),
      readTimeMinutes: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post) {
      return null;
    }

    // Only return published posts for public access
    if (post.status !== "published") {
      return null;
    }

    return post;
  },
});

/**
 * Get posts by creator (for creator dashboard)
 */
export const getPostsByCreator = query({
  args: { 
    authorId: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
  },
  returns: v.array(
    v.object({
      _id: v.id("blogPosts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      publishedAt: v.optional(v.number()),
      category: v.optional(v.string()),
      views: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(500);

    // Filter by status if provided
    const filtered = args.status
      ? posts.filter((p) => p.status === args.status)
      : posts;

    return filtered.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      status: post.status,
      publishedAt: post.publishedAt,
      category: post.category,
      views: post.views,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  },
});

/**
 * Get a single post by ID (for editing)
 */
export const getPostById = query({
  args: { postId: v.id("blogPosts") },
  returns: v.union(
    v.object({
      _id: v.id("blogPosts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.optional(v.string()),
      content: v.string(),
      coverImage: v.optional(v.string()),
      authorId: v.string(),
      authorName: v.optional(v.string()),
      authorAvatar: v.optional(v.string()),
      storeId: v.optional(v.id("stores")),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      keywords: v.optional(v.array(v.string())),
      canonicalUrl: v.optional(v.string()),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      ),
      publishedAt: v.optional(v.number()),
      scheduledFor: v.optional(v.number()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      views: v.optional(v.number()),
      readTimeMinutes: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post;
  },
});

/**
 * Get blog categories with post counts
 */
export const getCategories = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500);

    // Count posts by category
    const categoryMap: Record<string, number> = {};
    for (const post of posts) {
      if (post.category) {
        categoryMap[post.category] = (categoryMap[post.category] || 0) + 1;
      }
    }

    // Convert to array and sort by count
    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new blog post
 */
export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImage: v.optional(v.string()),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    canonicalUrl: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    readTimeMinutes: v.optional(v.number()),
  },
  returns: v.object({
    postId: v.id("blogPosts"),
  }),
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("A blog post with this slug already exists");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("blogPosts", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      coverImage: args.coverImage,
      authorId: args.authorId,
      authorName: args.authorName,
      authorAvatar: args.authorAvatar,
      storeId: args.storeId,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      keywords: args.keywords,
      canonicalUrl: args.canonicalUrl,
      status: args.status,
      publishedAt: args.status === "published" ? now : undefined,
      category: args.category,
      tags: args.tags,
      views: 0,
      readTimeMinutes: args.readTimeMinutes,
      createdAt: now,
      updatedAt: now,
    });

    return { postId };
  },
});

/**
 * Update a blog post
 */
export const updatePost = mutation({
  args: {
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    canonicalUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived")
      )
    ),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    readTimeMinutes: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { postId, ...updates } = args;
    
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Blog post not found");
    }

    // Check if slug is being changed and if it conflicts
    if (updates.slug && updates.slug !== post.slug) {
      const newSlug = updates.slug; // Type narrowing for Convex
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .first();

      if (existing) {
        throw new Error("A blog post with this slug already exists");
      }
    }

    // Update published timestamp if publishing for the first time
    const updatedStatus = updates.status || post.status;
    const publishedAt =
      updatedStatus === "published" && post.status !== "published"
        ? Date.now()
        : post.publishedAt;

    await ctx.db.patch(postId, {
      ...updates,
      publishedAt,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Delete a blog post
 */
export const deletePost = mutation({
  args: { postId: v.id("blogPosts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Blog post not found");
    }

    await ctx.db.delete(args.postId);

    // Also delete associated comments
    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .take(500);

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    return null;
  },
});

/**
 * Increment view count
 */
export const incrementViews = mutation({
  args: { postId: v.id("blogPosts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return null;
    }

    await ctx.db.patch(args.postId, {
      views: (post.views || 0) + 1,
    });

    return null;
  },
});

