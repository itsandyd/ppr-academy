import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Inbox Queries for Creator Dashboard
 */

/**
 * Create new inbox reply (called by webhook)
 */
export const createInboxReply = mutation({
  args: {
    messageId: v.string(),
    inReplyTo: v.optional(v.string()),
    references: v.optional(v.array(v.string())),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    toEmail: v.string(),
    subject: v.string(),
    textBody: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
    hasAttachments: v.optional(v.boolean()),
  },
  returns: v.id("emailReplies"),
  handler: async (ctx, args) => {
    const replyId = await ctx.db.insert("emailReplies", {
      messageId: args.messageId,
      inReplyTo: args.inReplyTo,
      references: args.references,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      toEmail: args.toEmail,
      subject: args.subject,
      textBody: args.textBody,
      htmlBody: args.htmlBody,
      receivedAt: Date.now(),
      status: "new",
      hasAttachments: args.hasAttachments,
    });
    
    // Trigger async matching to creator
    await ctx.scheduler.runAfter(0, internal.inboxSync.matchReplyToCreator, {
      replyId,
    });
    
    return replyId;
  },
});

/**
 * Get inbox for a specific creator/store
 */
export const getCreatorInbox = query({
  args: {
    storeId: v.id("stores"),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("spam"),
      v.literal("archived")
    )),
  },
  returns: v.array(v.object({
    _id: v.id("emailReplies"),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    subject: v.string(),
    textBody: v.optional(v.string()),
    receivedAt: v.number(),
    status: v.string(),
    matchConfidence: v.optional(v.string()),
    hasAttachments: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    // Use index for storeId lookup - much faster than filter
    const allReplies = await ctx.db
      .query("emailReplies")
      .withIndex("by_storeId", q => q.eq("storeId", args.storeId))
      .order("desc")
      .take(500);

    // Apply status filter in memory if needed (secondary filter)
    const replies = args.status
      ? allReplies.filter(r => r.status === args.status).slice(0, 100)
      : allReplies.slice(0, 100);
    
    return replies.map(r => ({
      _id: r._id,
      fromEmail: r.fromEmail,
      fromName: r.fromName,
      subject: r.subject,
      textBody: r.textBody,
      receivedAt: r.receivedAt,
      status: r.status,
      matchConfidence: r.matchConfidence,
      hasAttachments: r.hasAttachments,
      readAt: r.readAt,
    }));
  },
});

/**
 * Get single reply details
 */
export const getReplyDetails = query({
  args: { replyId: v.id("emailReplies") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.replyId);
  },
});

/**
 * Mark reply as read
 */
export const markReplyAsRead = mutation({
  args: { replyId: v.id("emailReplies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reply = await ctx.db.get(args.replyId);
    if (reply?.status === "new") {
      await ctx.db.patch(args.replyId, {
        status: "read",
        readAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Reply to customer (via platform)
 */
export const replyToCustomer = mutation({
  args: {
    replyId: v.id("emailReplies"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reply = await ctx.db.get(args.replyId);
    if (!reply) throw new Error("Reply not found");
    
    // Schedule sending the reply email
    await ctx.scheduler.runAfter(0, internal.inboxActions.sendReplyEmail, {
      replyId: args.replyId,
      message: args.message,
    });
    
    // Update status
    await ctx.db.patch(args.replyId, {
      status: "replied",
      repliedAt: Date.now(),
      creatorReply: {
        message: args.message,
        sentAt: Date.now(),
        sentVia: "dashboard",
      },
    });
    
    return null;
  },
});

/**
 * Get inbox stats for creator
 */
export const getInboxStats = query({
  args: { storeId: v.id("stores") },
  returns: v.object({
    total: v.number(),
    new: v.number(),
    read: v.number(),
    replied: v.number(),
  }),
  handler: async (ctx, args) => {
    const allReplies = await ctx.db
      .query("emailReplies")
      .filter(q => q.eq(q.field("storeId"), args.storeId))
      .take(500);
    
    return {
      total: allReplies.length,
      new: allReplies.filter(r => r.status === "new").length,
      read: allReplies.filter(r => r.status === "read").length,
      replied: allReplies.filter(r => r.status === "replied").length,
    };
  },
});

/**
 * Mark reply as spam
 */
export const markAsSpam = mutation({
  args: { replyId: v.id("emailReplies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.replyId, {
      status: "spam",
    });
    return null;
  },
});

/**
 * Archive reply
 */
export const archiveReply = mutation({
  args: { replyId: v.id("emailReplies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.replyId, {
      status: "archived",
    });
    return null;
  },
});

