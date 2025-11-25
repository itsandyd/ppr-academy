import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ==================== QUERIES ====================

/**
 * Get all automations for a user (by Clerk ID)
 */
export const getUserAutomations = query({
  args: { clerkId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return [];
    }

    const automations = await ctx.db
      .query("automations")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    // Fetch related data for each automation
    const automationsWithData = await Promise.all(
      automations.map(async (automation) => {
        const [keywords, trigger, listener, posts] = await Promise.all([
          ctx.db
            .query("keywords")
            .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
            .collect(),
          ctx.db
            .query("triggers")
            .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
            .first(),
          ctx.db
            .query("listeners")
            .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
            .first(),
          ctx.db
            .query("posts")
            .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
            .collect(),
        ]);

        return {
          ...automation,
          keywords: keywords || [],
          trigger: trigger || null,
          listener: listener || null,
          posts: posts || [],
        };
      })
    );

    return automationsWithData;
  },
});

/**
 * Get single automation by ID with all related data
 */
export const getAutomationById = query({
  args: { automationId: v.id("automations") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    
    if (!automation) {
      return null;
    }

    const [keywords, trigger, listener, posts, user] = await Promise.all([
      ctx.db
        .query("keywords")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .collect(),
      ctx.db
        .query("triggers")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .first(),
      ctx.db
        .query("listeners")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .first(),
      ctx.db
        .query("posts")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .collect(),
      ctx.db.get(automation.userId),
    ]);

    // Get user subscription
    const subscription = user 
      ? await ctx.db
          .query("userSubscriptions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first()
      : null;

    return {
      ...automation,
      keywords: keywords || [],
      trigger: trigger || null,
      listener: listener || null,
      posts: posts || [],
      user: user ? {
        ...user,
        subscription,
      } : null,
    };
  },
});

/**
 * Find automation by keyword (for webhook matcher)
 */
export const findAutomationByKeyword = query({
  args: { keyword: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // Case-insensitive keyword match
    const keywordMatch = await ctx.db
      .query("keywords")
      .filter((q) => 
        q.eq(q.field("word"), args.keyword.toLowerCase())
      )
      .first();

    if (!keywordMatch) {
      return null;
    }

    // Get the full automation with all related data
    const automation = await ctx.db.get(keywordMatch.automationId);
    
    if (!automation) {
      return null;
    }

    const [trigger, listener, posts, user, keywords] = await Promise.all([
      ctx.db
        .query("triggers")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .first(),
      ctx.db
        .query("listeners")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .first(),
      ctx.db
        .query("posts")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .collect(),
      ctx.db.get(automation.userId),
      ctx.db
        .query("keywords")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .collect(),
    ]);

    // Get user's Instagram integration
    const integration = user
      ? await ctx.db
          .query("integrations")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first()
      : null;

    // Get subscription for Smart AI check
    const subscription = user
      ? await ctx.db
          .query("userSubscriptions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first()
      : null;

    return {
      ...automation,
      trigger,
      listener,
      posts: posts || [],
      keywords: keywords || [],
      user: user ? {
        ...user,
        subscription,
        integration,
      } : null,
    };
  },
});

// ==================== MUTATIONS ====================

/**
 * Create a new automation
 */
export const createAutomation = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    automationId: v.optional(v.string()),
  },
  returns: v.object({
    status: v.number(),
    data: v.union(v.any(), v.null()),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();

      if (!user) {
        return { status: 404, data: null };
      }

      const automationId = await ctx.db.insert("automations", {
        userId: user._id,
        name: args.name || "Untitled",
        active: false,
      });

      return { 
        status: 201, 
        data: { 
          _id: automationId,
          name: args.name || "Untitled",
          active: false,
          userId: user._id,
          _creationTime: Date.now(),
        } 
      };
    } catch (error) {
      console.error("Error creating automation:", error);
      return { status: 500, data: null };
    }
  },
});

/**
 * Update automation name or active status
 */
export const updateAutomation = mutation({
  args: {
    automationId: v.id("automations"),
    name: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const updateData: any = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.active !== undefined) updateData.active = args.active;

      await ctx.db.patch(args.automationId, updateData);

      return {
        status: 200,
        message: "Automation updated successfully",
      };
    } catch (error) {
      console.error("Error updating automation:", error);
      return { status: 500, message: "Failed to update automation" };
    }
  },
});

/**
 * Delete automation and all related data
 */
export const deleteAutomation = mutation({
  args: {
    automationId: v.id("automations"),
    clerkId: v.string(),
  },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user from clerk ID
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .unique();

      if (!user) {
        return { status: 404, message: "User not found" };
      }

      // Get automation and verify ownership
      const automation = await ctx.db.get(args.automationId);
      if (!automation) {
        return { status: 404, message: "Automation not found" };
      }

      if (automation.userId !== user._id) {
        return { status: 403, message: "Unauthorized" };
      }

      // Delete related keywords
      const keywords = await ctx.db
        .query("keywords")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .collect();
      
      for (const keyword of keywords) {
        await ctx.db.delete(keyword._id);
      }

      // Delete related triggers
      const triggers = await ctx.db
        .query("triggers")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .collect();
      
      for (const trigger of triggers) {
        await ctx.db.delete(trigger._id);
      }

      // Delete related listeners
      const listeners = await ctx.db
        .query("listeners")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .collect();
      
      for (const listener of listeners) {
        await ctx.db.delete(listener._id);
      }

      // Finally delete the automation itself
      await ctx.db.delete(args.automationId);

      return {
        status: 200,
        message: "Automation deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting automation:", error);
      return { status: 500, message: "Failed to delete automation" };
    }
  },
});

/**
 * Add keyword to automation
 */
export const addKeyword = mutation({
  args: {
    automationId: v.id("automations"),
    keyword: v.string(),
  },
  returns: v.object({
    status: v.number(),
    data: v.union(v.any(), v.null()),
  }),
  handler: async (ctx, args) => {
    try {
      const keywordId = await ctx.db.insert("keywords", {
        automationId: args.automationId,
        word: args.keyword.toLowerCase(), // Case-insensitive
      });

      return {
        status: 200,
        data: {
          _id: keywordId,
          word: args.keyword.toLowerCase(),
          automationId: args.automationId,
        },
      };
    } catch (error) {
      console.error("Error adding keyword:", error);
      return { status: 500, data: null };
    }
  },
});

/**
 * Delete keyword
 */
export const deleteKeyword = mutation({
  args: { keywordId: v.id("keywords") },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.keywordId);
      return { status: 200, message: "Keyword deleted" };
    } catch (error) {
      return { status: 500, message: "Failed to delete keyword" };
    }
  },
});

/**
 * Save trigger (creates or updates trigger for automation)
 */
export const saveTrigger = mutation({
  args: {
    automationId: v.id("automations"),
    types: v.array(v.union(v.literal("COMMENT"), v.literal("DM"))),
  },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Delete existing triggers for this automation
      const existingTriggers = await ctx.db
        .query("triggers")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .collect();

      for (const trigger of existingTriggers) {
        await ctx.db.delete(trigger._id);
      }

      // Create new triggers
      for (const type of args.types) {
        await ctx.db.insert("triggers", {
          automationId: args.automationId,
          type,
        });
      }

      return { status: 200, message: "Trigger saved" };
    } catch (error) {
      console.error("Error saving trigger:", error);
      return { status: 500, message: "Failed to save trigger" };
    }
  },
});

/**
 * Save listener (action/response)
 */
export const saveListener = mutation({
  args: {
    automationId: v.id("automations"),
    listenerType: v.union(v.literal("MESSAGE"), v.literal("SMART_AI")),
    prompt: v.optional(v.string()),
    reply: v.optional(v.string()),
  },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if listener exists, update or create
      const existing = await ctx.db
        .query("listeners")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          listener: args.listenerType,
          prompt: args.prompt || "",
          commentReply: args.reply || "",
        });
      } else {
        await ctx.db.insert("listeners", {
          automationId: args.automationId,
          listener: args.listenerType,
          prompt: args.prompt || "",
          commentReply: args.reply || "",
          dmCount: 0,
          commentCount: 0,
        });
      }

      return { status: 200, message: "Listener created" };
    } catch (error) {
      console.error("Error saving listener:", error);
      return { status: 500, message: "Failed to save listener" };
    }
  },
});

/**
 * Attach posts to automation
 */
export const savePosts = mutation({
  args: {
    automationId: v.id("automations"),
    posts: v.array(
      v.object({
        postId: v.string(),
        caption: v.optional(v.string()),
        media: v.string(),
        mediaType: v.union(
          v.literal("IMAGE"),
          v.literal("VIDEO"),
          v.literal("CAROUSEL_ALBUM")
        ),
      })
    ),
  },
  returns: v.object({
    status: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Delete existing posts
      const existingPosts = await ctx.db
        .query("posts")
        .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
        .collect();

      for (const post of existingPosts) {
        await ctx.db.delete(post._id);
      }

      // Create new posts
      for (const post of args.posts) {
        await ctx.db.insert("posts", {
          automationId: args.automationId,
          postId: post.postId,
          caption: post.caption,
          media: post.media,
          mediaType: post.mediaType,
          timestamp: Date.now(),
        });
      }

      console.log(`✅ Attached ${args.posts.length} posts to automation ${args.automationId}`);
      
      return { status: 200, message: `${args.posts.length} post${args.posts.length > 1 ? 's' : ''} attached successfully` };
    } catch (error) {
      console.error("Error saving posts:", error);
      return { status: 500, message: "Failed to save posts" };
    }
  },
});

/**
 * Track DM/comment response (for analytics)
 */
export const trackResponse = internalMutation({
  args: {
    automationId: v.id("automations"),
    type: v.union(v.literal("COMMENT"), v.literal("DM")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const listener = await ctx.db
      .query("listeners")
      .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
      .first();

    if (!listener) return null;

    if (args.type === "COMMENT") {
      await ctx.db.patch(listener._id, {
        commentCount: (listener.commentCount || 0) + 1,
      });
    } else {
      await ctx.db.patch(listener._id, {
        dmCount: (listener.dmCount || 0) + 1,
      });
    }

    return null;
  },
});

/**
 * Create chat history entry (for Smart AI)
 */
export const createChatHistory = internalMutation({
  args: {
    automationId: v.id("automations"),
    senderId: v.string(),
    receiverId: v.string(),
    message: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  returns: v.id("chatHistory"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatHistory", {
      automationId: args.automationId,
      senderId: args.senderId,
      receiverId: args.receiverId,
      message: args.message,
      role: args.role,
    });
  },
});

/**
 * Get chat history for Smart AI context
 */
export const getChatHistory = query({
  args: {
    automationId: v.id("automations"),
    instagramUserId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("chatHistory")
      .withIndex("by_automationId_and_sender", (q) =>
        q.eq("automationId", args.automationId).eq("senderId", args.instagramUserId)
      )
      .order("desc")
      .take(10); // Last 10 messages for context

    return history.reverse(); // Oldest first for OpenAI
  },
});

// ==================== INTERNAL QUERIES (for webhook) ====================

/**
 * Get keyword automation details (internal version for webhook)
 * Matches the original getKeywordAutomation function signature
 */
export const getKeywordAutomation = internalQuery({
  args: {
    automationId: v.id("automations"),
    includePosts: v.boolean(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    
    if (!automation) return null;

    // Get the trigger
    const trigger = await ctx.db
      .query("triggers")
      .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
      .first();

    // Get the listener
    const listener = await ctx.db
      .query("listeners")
      .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
      .first();

    // Get user
    const user = await ctx.db.get(automation.userId);

    let subscription = null;
    let integrations = [];
    
    if (user) {
      // Get subscription - note: subscriptions use customerId, not userId
      // For now, we skip subscription fetching since it requires customer mapping
      // subscription = await ctx.db
      //   .query("subscriptions")
      //   .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      //   .first();

      // Get Instagram integration
      integrations = await ctx.db
        .query("socialAccounts")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), user.clerkId),
            q.eq(q.field("platform"), "instagram"),
            q.eq(q.field("isConnected"), true)
          )
        )
        .collect();
    }

    let posts = null;
    if (args.includePosts) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_automationId", (q) => q.eq("automationId", automation._id))
        .collect();
    }

    return {
      ...automation,
      trigger,
      listener,
      posts,
      User: user ? {
        ...user,
        subscription,
        integrations,
      } : null,
    };
  },
});

/**
 * Get keyword post (check if post is attached to automation)
 * Matches the original getKeywordPost function signature
 */
export const getKeywordPost = internalQuery({
  args: {
    mediaId: v.string(),
    automationId: v.id("automations"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    // Check for specific post match
    const post = await ctx.db
      .query("posts")
      .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
      .filter((q) => q.eq(q.field("postId"), args.mediaId))
      .first();

    if (post) return post;

    // Check for global monitoring (ALL_POSTS_AND_FUTURE)
    const globalPost = await ctx.db
      .query("posts")
      .withIndex("by_automationId", (q) => q.eq("automationId", args.automationId))
      .filter((q) => q.eq(q.field("postId"), "ALL_POSTS_AND_FUTURE"))
      .first();

    return globalPost;
  },
});

/**
 * Find automation by chat history (for continuing conversations)
 * Matches the original getChatHistory(receiverId, senderId) function signature
 */
export const findAutomationByChatHistory = internalQuery({
  args: {
    receiverId: v.string(),
    senderId: v.string(),
  },
  returns: v.union(
    v.object({
      automationId: v.id("automations"),
      history: v.array(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Find recent chat history for this sender
    const recentChat = await ctx.db
      .query("chatHistory")
      .filter((q) => 
        q.and(
          q.eq(q.field("senderId"), args.senderId),
          q.eq(q.field("receiverId"), args.receiverId)
        )
      )
      .order("desc")
      .first();

    if (!recentChat) return null;

    // Get all history for this automation and sender
    const history = await ctx.db
      .query("chatHistory")
      .withIndex("by_automationId_and_sender", (q) =>
        q.eq("automationId", recentChat.automationId)
         .eq("senderId", args.senderId)
      )
      .order("asc")
      .collect();

    return {
      automationId: recentChat.automationId,
      history: history.map(h => ({
        role: h.role,
        content: h.message,
      })),
    };
  },
});
