import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getDueExecutions = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const pendingExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) =>
        q.or(q.eq(q.field("scheduledFor"), undefined), q.lte(q.field("scheduledFor"), now))
      )
      .take(args.limit);

    const runningExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .filter((q) =>
        q.or(q.eq(q.field("scheduledFor"), undefined), q.lte(q.field("scheduledFor"), now))
      )
      .take(args.limit - pendingExecutions.length);

    return [...pendingExecutions, ...runningExecutions];
  },
});

export const getExecution = internalQuery({
  args: { executionId: v.id("workflowExecutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.executionId);
  },
});

export const getWorkflowInternal = internalQuery({
  args: { workflowId: v.id("emailWorkflows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

export const getEmailTemplateInternal = internalQuery({
  args: { templateId: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

export const getContactInternal = internalQuery({
  args: { contactId: v.id("emailContacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactId);
  },
});

export const getTagsByIds = internalQuery({
  args: { tagIds: v.array(v.id("emailTags")) },
  handler: async (ctx, args) => {
    const tags = await Promise.all(args.tagIds.map((id) => ctx.db.get(id)));
    return tags.filter(Boolean);
  },
});

export const updateExecutionStatus = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: args.status,
      startedAt: args.status === "running" ? Date.now() : undefined,
    });
  },
});

export const scheduleNextNode = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    nextNodeId: v.optional(v.string()),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.nextNodeId) {
      await ctx.db.patch(args.executionId, {
        status: "completed",
        completedAt: Date.now(),
      });
      return;
    }

    await ctx.db.patch(args.executionId, {
      status: "pending",
      currentNodeId: args.nextNodeId,
      scheduledFor: args.scheduledFor,
    });
  },
});

export const markExecutionCompleted = internalMutation({
  args: { executionId: v.id("workflowExecutions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const markExecutionFailed = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: "failed",
      completedAt: Date.now(),
      errorMessage: args.errorMessage,
    });
  },
});

export const markExecutionCancelled = internalMutation({
  args: { executionId: v.id("workflowExecutions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});

export const incrementContactEmailsSent = internalMutation({
  args: { contactId: v.id("emailContacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (contact) {
      await ctx.db.patch(args.contactId, {
        emailsSent: (contact.emailsSent || 0) + 1,
      });
    }
  },
});

export const addTagToContact = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    tagName: v.string(),
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    let tag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("name"), args.tagName))
      .first();

    if (!tag) {
      const now = Date.now();
      const tagId = await ctx.db.insert("emailTags", {
        storeId: args.storeId,
        name: args.tagName,
        color: "#3b82f6",
        createdAt: now,
        updatedAt: now,
        contactCount: 0,
      });
      tag = await ctx.db.get(tagId);
    }

    if (tag) {
      const contact = await ctx.db.get(args.contactId);
      if (contact) {
        const currentTags = contact.tagIds || [];
        if (!currentTags.includes(tag._id)) {
          await ctx.db.patch(args.contactId, {
            tagIds: [...currentTags, tag._id],
          });
        }
      }
    }
  },
});

export const removeTagFromContact = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
    tagName: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.tagIds) return;

    const tags = await Promise.all(contact.tagIds.map((id: Id<"emailTags">) => ctx.db.get(id)));
    const tagToRemove = tags.find((t) => t && t.name.toLowerCase() === args.tagName.toLowerCase());

    if (tagToRemove) {
      await ctx.db.patch(args.contactId, {
        tagIds: contact.tagIds.filter((id: Id<"emailTags">) => id !== tagToRemove._id),
      });
    }
  },
});

export const getStoreOwnerEmail = internalQuery({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), args.storeId))
      .first();

    if (!store) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
      .first();

    return {
      ownerEmail: user?.email || null,
      storeName: store.name,
    };
  },
});
