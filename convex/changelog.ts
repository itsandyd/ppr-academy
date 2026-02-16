import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

// Get GitHub configuration
export const getGithubConfig = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    return await ctx.db.query("githubConfig").first();
  },
});

// Get all changelog entries
export const getChangelogEntries = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
    category: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("improvement"),
        v.literal("fix"),
        v.literal("breaking"),
        v.literal("internal")
      )
    ),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkId, limit = 50, category, publishedOnly }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    let entries = await ctx.db
      .query("changelogEntries")
      .withIndex("by_committedAt")
      .order("desc")
      .take(limit);

    if (category) {
      entries = entries.filter((e) => e.category === category);
    }

    if (publishedOnly) {
      entries = entries.filter((e) => e.isPublished);
    }

    return entries;
  },
});

// Get changelog stats
export const getChangelogStats = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const entries = await ctx.db.query("changelogEntries").take(500);
    const releases = await ctx.db.query("changelogReleases").take(500);

    const byCategory = {
      feature: entries.filter((e) => e.category === "feature").length,
      improvement: entries.filter((e) => e.category === "improvement").length,
      fix: entries.filter((e) => e.category === "fix").length,
      breaking: entries.filter((e) => e.category === "breaking").length,
      internal: entries.filter((e) => e.category === "internal").length,
    };

    return {
      totalEntries: entries.length,
      publishedEntries: entries.filter((e) => e.isPublished).length,
      unpublishedEntries: entries.filter((e) => !e.isPublished).length,
      notificationsSent: entries.filter((e) => e.notificationSent).length,
      totalReleases: releases.length,
      publishedReleases: releases.filter((r) => r.isPublished).length,
      byCategory,
    };
  },
});

// Get releases
export const getReleases = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, limit = 20 }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const releases = await ctx.db
      .query("changelogReleases")
      .withIndex("by_publishedAt")
      .order("desc")
      .take(limit);

    // Fetch entries for each release
    const releasesWithEntries = await Promise.all(
      releases.map(async (release) => {
        const entries = await Promise.all(release.entryIds.map((id) => ctx.db.get(id)));
        return {
          ...release,
          entries: entries.filter(Boolean),
        };
      })
    );

    return releasesWithEntries;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Save GitHub configuration
export const saveGithubConfig = mutation({
  args: {
    clerkId: v.string(),
    repository: v.string(),
    branch: v.string(),
  },
  handler: async (ctx, { clerkId, repository, branch }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const existing = await ctx.db.query("githubConfig").first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        repository,
        branch,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    }

    const id = await ctx.db.insert("githubConfig", {
      repository,
      branch,
      isConnected: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

// Save commits as changelog entries
export const saveCommitsAsEntries = mutation({
  args: {
    clerkId: v.string(),
    commits: v.array(
      v.object({
        sha: v.string(),
        message: v.string(),
        url: v.string(),
        authorName: v.string(),
        authorEmail: v.optional(v.string()),
        authorAvatar: v.optional(v.string()),
        committedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, { clerkId, commits }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const now = Date.now();
    let saved = 0;
    let skipped = 0;

    for (const commit of commits) {
      // Check if already exists
      const existing = await ctx.db
        .query("changelogEntries")
        .withIndex("by_commitSha", (q) => q.eq("commitSha", commit.sha))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Auto-categorize based on commit message
      const category = categorizeCommit(commit.message);
      const title = extractTitle(commit.message);

      await ctx.db.insert("changelogEntries", {
        commitSha: commit.sha,
        commitMessage: commit.message,
        commitUrl: commit.url,
        authorName: commit.authorName,
        authorEmail: commit.authorEmail,
        authorAvatar: commit.authorAvatar,
        committedAt: commit.committedAt,
        category,
        title,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
      });
      saved++;
    }

    // Update last sync
    const config = await ctx.db.query("githubConfig").first();
    if (config && commits.length > 0) {
      await ctx.db.patch(config._id, {
        lastSyncAt: now,
        lastSyncCommitSha: commits[0].sha,
      });
    }

    return { saved, skipped };
  },
});

// Update a changelog entry
export const updateEntry = mutation({
  args: {
    clerkId: v.string(),
    entryId: v.id("changelogEntries"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("improvement"),
        v.literal("fix"),
        v.literal("breaking"),
        v.literal("internal")
      )
    ),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkId, entryId, ...updates }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");

    await ctx.db.patch(entryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a changelog entry
export const deleteEntry = mutation({
  args: {
    clerkId: v.string(),
    entryId: v.id("changelogEntries"),
  },
  handler: async (ctx, { clerkId, entryId }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    await ctx.db.delete(entryId);
    return { success: true };
  },
});

// Create a release from selected entries
export const createRelease = mutation({
  args: {
    clerkId: v.string(),
    version: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    entryIds: v.array(v.id("changelogEntries")),
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkId, version, title, description, entryIds, publish }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const now = Date.now();

    const id = await ctx.db.insert("changelogReleases", {
      version,
      title,
      description,
      entryIds,
      isPublished: publish || false,
      publishedAt: publish ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Mark entries as published if release is published
    if (publish) {
      for (const entryId of entryIds) {
        await ctx.db.patch(entryId, {
          isPublished: true,
          updatedAt: now,
        });
      }
    }

    return { success: true, id };
  },
});

// Send notification for selected entries
export const sendChangelogNotification = mutation({
  args: {
    clerkId: v.string(),
    entryIds: v.array(v.id("changelogEntries")),
    title: v.string(),
    message: v.string(),
    targetType: v.union(v.literal("all"), v.literal("students"), v.literal("creators")),
  },
  handler: async (ctx, { clerkId, entryIds, title, message, targetType }) => {
    // Verify admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user?.admin) throw new Error("Unauthorized");

    const now = Date.now();

    // Get target users based on targetType
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("clerkId"), undefined))
      .take(500);

    let targetUserIds: string[] = [];

    if (targetType === "all") {
      targetUserIds = allUsers.map((u) => u.clerkId).filter((id): id is string => !!id);
    } else if (targetType === "creators") {
      // Users with stores or courses
      const stores = await ctx.db.query("stores").take(500);
      const storeUserIds = new Set(stores.map((s) => s.userId));
      targetUserIds = allUsers
        .filter((u) => u.clerkId && storeUserIds.has(u.clerkId))
        .map((u) => u.clerkId)
        .filter((id): id is string => !!id);
    } else if (targetType === "students") {
      // Users with enrollments
      const enrollments = await ctx.db.query("purchases").take(500);
      const enrolledUserIds = new Set(enrollments.map((e) => e.userId));
      targetUserIds = allUsers
        .filter((u) => u.clerkId && enrolledUserIds.has(u.clerkId))
        .map((u) => u.clerkId)
        .filter((id): id is string => !!id);
    }

    // Create notifications for each user
    let notificationCount = 0;
    for (const userId of targetUserIds) {
      await ctx.db.insert("notifications", {
        userId,
        title,
        message,
        type: "info",
        read: false,
        link: "/changelog",
        actionLabel: "View Updates",
        createdAt: now,
        senderType: "platform",
        senderName: "PPR Academy",
      });
      notificationCount++;
    }

    // Mark entries as notification sent
    for (const entryId of entryIds) {
      await ctx.db.patch(entryId, {
        notificationSent: true,
        notificationSentAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: `Notification sent to ${notificationCount} users`,
      notificationCount,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function categorizeCommit(
  message: string
): "feature" | "improvement" | "fix" | "breaking" | "internal" {
  const lowerMessage = message.toLowerCase();

  // Check for conventional commit prefixes
  if (lowerMessage.startsWith("feat:") || lowerMessage.startsWith("feat(")) {
    return "feature";
  }
  if (lowerMessage.startsWith("fix:") || lowerMessage.startsWith("fix(")) {
    return "fix";
  }
  if (lowerMessage.startsWith("breaking:") || lowerMessage.includes("breaking change")) {
    return "breaking";
  }
  if (
    lowerMessage.startsWith("docs:") ||
    lowerMessage.startsWith("chore:") ||
    lowerMessage.startsWith("ci:") ||
    lowerMessage.startsWith("test:")
  ) {
    return "internal";
  }

  // Check for keywords
  if (
    lowerMessage.includes("add ") ||
    lowerMessage.includes("new ") ||
    lowerMessage.includes("implement")
  ) {
    return "feature";
  }
  if (
    lowerMessage.includes("fix") ||
    lowerMessage.includes("bug") ||
    lowerMessage.includes("patch")
  ) {
    return "fix";
  }
  if (
    lowerMessage.includes("improve") ||
    lowerMessage.includes("enhance") ||
    lowerMessage.includes("update") ||
    lowerMessage.includes("refactor")
  ) {
    return "improvement";
  }

  return "internal";
}

function extractTitle(message: string): string {
  // Remove conventional commit prefix
  let title = message.replace(/^(feat|fix|docs|chore|ci|test|breaking)(\([^)]+\))?:\s*/i, "");

  // Take first line only
  title = title.split("\n")[0];

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Truncate if too long
  if (title.length > 100) {
    title = title.substring(0, 97) + "...";
  }

  return title;
}

// ============================================================================
// AI-POWERED NOTIFICATION GENERATION
// ============================================================================

// Internal query to verify admin (needed for action in changelogActions.ts)
export const verifyAdmin = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(v.object({ admin: v.boolean() }), v.null()),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.admin) return null;
    return { admin: true };
  },
});

// Internal query to get entries by IDs (needed for action in changelogActions.ts)
export const getEntriesByIds = internalQuery({
  args: { entryIds: v.array(v.id("changelogEntries")) },
  handler: async (ctx, { entryIds }) => {
    const entries = await Promise.all(entryIds.map((id) => ctx.db.get(id)));
    return entries.filter(Boolean).map((entry) => ({
      _id: entry!._id,
      commitSha: entry!.commitSha,
      commitMessage: entry!.commitMessage,
      title: entry!.title,
      category: entry!.category,
    }));
  },
});
