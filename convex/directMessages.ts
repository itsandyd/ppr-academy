import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

// Get all conversations for the current user
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    // Get conversations where user is participant1
    const asParticipant1 = await ctx.db
      .query("dmConversations")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
      .collect();

    // Get conversations where user is participant2
    const asParticipant2 = await ctx.db
      .query("dmConversations")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
      .collect();

    const allConversations = [...asParticipant1, ...asParticipant2];

    // Sort by lastMessageAt desc (most recent first)
    allConversations.sort(
      (a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );

    // Enrich with other user info and unread count
    const enrichedConversations = await Promise.all(
      allConversations.map(async (conv) => {
        const otherUserId =
          conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", otherUserId))
          .first();

        const unreadCount =
          conv.participant1Id === userId
            ? conv.unreadByParticipant1 || 0
            : conv.unreadByParticipant2 || 0;

        return {
          _id: conv._id,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          createdAt: conv.createdAt,
          otherUser: {
            id: otherUserId,
            name: otherUser?.name || otherUser?.firstName || "Unknown User",
            imageUrl: otherUser?.imageUrl,
          },
          unreadCount,
        };
      })
    );

    return enrichedConversations;
  },
});

// Get messages for a specific conversation
export const getMessages = query({
  args: {
    conversationId: v.id("dmConversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Verify user is participant
    const userId = identity.subject;
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("dmMessages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .take(args.limit || 100);

    // Resolve attachment URLs
    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        attachments: msg.attachments
          ? await Promise.all(
              msg.attachments.map(async (att) => ({
                ...att,
                url: att.storageId
                  ? await ctx.storage.getUrl(att.storageId as Id<"_storage">)
                  : att.url,
              }))
            )
          : [],
      }))
    );

    return messagesWithUrls;
  },
});

// Get total unread DM count (for navbar badge)
export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const userId = identity.subject;

    const asParticipant1 = await ctx.db
      .query("dmConversations")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
      .collect();

    const asParticipant2 = await ctx.db
      .query("dmConversations")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
      .collect();

    let total = 0;
    for (const conv of asParticipant1) {
      total += conv.unreadByParticipant1 || 0;
    }
    for (const conv of asParticipant2) {
      total += conv.unreadByParticipant2 || 0;
    }

    return total;
  },
});

// Get conversation details with other user info
export const getConversationDetails = query({
  args: {
    conversationId: v.id("dmConversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const userId = identity.subject;
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return null;
    }

    const otherUserId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const otherUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", otherUserId))
      .first();

    return {
      _id: conversation._id,
      otherUser: {
        id: otherUserId,
        name: otherUser?.name || otherUser?.firstName || "Unknown User",
        imageUrl: otherUser?.imageUrl,
      },
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.string(), // Clerk ID of the other user
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const currentUserId = identity.subject;

    // Can't message yourself
    if (currentUserId === args.otherUserId) {
      throw new Error("Cannot start conversation with yourself");
    }

    // Sort IDs alphabetically for consistent lookup
    const [participant1Id, participant2Id] = [currentUserId, args.otherUserId].sort();

    // Check if conversation exists
    const existing = await ctx.db
      .query("dmConversations")
      .withIndex("by_participants", (q) =>
        q.eq("participant1Id", participant1Id).eq("participant2Id", participant2Id)
      )
      .first();

    if (existing) return existing._id;

    // Verify other user exists
    const otherUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.otherUserId))
      .first();

    if (!otherUser) {
      throw new Error("User not found");
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("dmConversations", {
      participant1Id,
      participant2Id,
      createdAt: Date.now(),
      unreadByParticipant1: 0,
      unreadByParticipant2: 0,
    });

    return conversationId;
  },
});

// Send a message in a conversation
export const sendMessage = mutation({
  args: {
    conversationId: v.id("dmConversations"),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const senderId = identity.subject;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Verify sender is participant
    if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    // Insert message
    const messageId = await ctx.db.insert("dmMessages", {
      conversationId: args.conversationId,
      senderId,
      content: args.content,
      attachments: args.attachments,
      createdAt: now,
    });

    // Update conversation metadata
    const isParticipant1 = conversation.participant1Id === senderId;
    const currentUnread = isParticipant1
      ? conversation.unreadByParticipant2 || 0
      : conversation.unreadByParticipant1 || 0;

    const updateData: Record<string, unknown> = {
      lastMessageAt: now,
      lastMessagePreview: args.content.substring(0, 100),
    };

    if (isParticipant1) {
      updateData.unreadByParticipant2 = currentUnread + 1;
    } else {
      updateData.unreadByParticipant1 = currentUnread + 1;
    }

    await ctx.db.patch(args.conversationId, updateData);

    // Get sender info for email notification
    const sender = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", senderId))
      .first();

    // Get recipient ID
    const recipientId = isParticipant1
      ? conversation.participant2Id
      : conversation.participant1Id;

    // Schedule email notification
    await ctx.scheduler.runAfter(0, internal.directMessagesActions.sendNewMessageEmail, {
      recipientId,
      senderId,
      senderName: sender?.name || sender?.firstName || "Someone",
      senderAvatar: sender?.imageUrl,
      messagePreview: args.content.substring(0, 200),
      conversationId: args.conversationId,
    });

    return messageId;
  },
});

// Mark messages as read in a conversation
export const markAsRead = mutation({
  args: {
    conversationId: v.id("dmConversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const userId = identity.subject;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    // Verify user is participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return;
    }

    const now = Date.now();

    // Mark unread messages from other user as read
    const messages = await ctx.db
      .query("dmMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      if (msg.senderId !== userId && !msg.readAt) {
        await ctx.db.patch(msg._id, { readAt: now });
      }
    }

    // Reset unread count for this user
    const isParticipant1 = conversation.participant1Id === userId;

    if (isParticipant1) {
      await ctx.db.patch(args.conversationId, { unreadByParticipant1: 0 });
    } else {
      await ctx.db.patch(args.conversationId, { unreadByParticipant2: 0 });
    }
  },
});

// ============================================================================
// INTERNAL QUERIES (for use in actions)
// ============================================================================

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});
