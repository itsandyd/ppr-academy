/**
 * Creator-Level Email Segmentation
 * Allows creators to build and manage segments for their email contacts
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Condition schema for validation
const conditionSchema = v.object({
  id: v.string(),
  field: v.string(),
  operator: v.union(
    v.literal("equals"),
    v.literal("not_equals"),
    v.literal("greater_than"),
    v.literal("less_than"),
    v.literal("contains"),
    v.literal("not_contains"),
    v.literal("is_empty"),
    v.literal("is_not_empty"),
    v.literal("in_list"),
    v.literal("not_in_list"),
    v.literal("before"),
    v.literal("after"),
    v.literal("between")
  ),
  value: v.any(),
  logic: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all segments for a store/creator
 */
export const getCreatorSegments = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    return await ctx.db
      .query("creatorEmailSegments")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
  },
});

/**
 * Get segment by ID
 */
export const getSegmentById = query({
  args: {
    segmentId: v.id("creatorEmailSegments"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.segmentId);
  },
});

/**
 * Preview segment - get contacts that match without saving
 */
export const previewSegment = query({
  args: {
    storeId: v.string(),
    conditions: v.array(conditionSchema),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    count: v.number(),
    contacts: v.array(
      v.object({
        _id: v.id("emailContacts"),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        tags: v.array(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const limit = args.limit || 50;

    // Get all contacts for this store
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    // Get tags for lookups
    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    const tagMap = new Map(tags.map((t) => [t._id, t.name]));

    // Filter contacts that match conditions
    const matchingContacts = [];

    for (const contact of contacts) {
      const matches = evaluateConditionsForContact(contact, args.conditions, tagMap);
      if (matches) {
        matchingContacts.push({
          _id: contact._id,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          tags: (contact.tagIds || [])
            .map((id: Id<"emailTags">) => tagMap.get(id))
            .filter(Boolean) as string[],
        });
        if (matchingContacts.length >= limit) break;
      }
    }

    // Count total matches
    let totalCount = matchingContacts.length;
    if (matchingContacts.length >= limit) {
      // Count remaining
      for (let i = limit; i < contacts.length; i++) {
        if (evaluateConditionsForContact(contacts[i], args.conditions, tagMap)) {
          totalCount++;
        }
      }
    }

    return {
      count: totalCount,
      contacts: matchingContacts,
    };
  },
});

/**
 * Get contacts in a segment
 */
export const getSegmentContacts = query({
  args: {
    segmentId: v.id("creatorEmailSegments"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    contacts: v.array(v.any()),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return { contacts: [], total: 0 };

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // For static segments with cached IDs
    if (!segment.isDynamic && segment.cachedContactIds) {
      const contactIds = segment.cachedContactIds.slice(offset, offset + limit);
      const contacts = await Promise.all(
        contactIds.map((id: Id<"emailContacts">) => ctx.db.get(id))
      );
      return {
        contacts: contacts.filter(Boolean),
        total: segment.cachedContactIds.length,
      };
    }

    // For dynamic segments, evaluate conditions
    const allContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .collect();
    const tagMap = new Map(tags.map((t) => [t._id, t.name]));

    const matchingContacts = allContacts.filter((contact) =>
      evaluateConditionsForContact(contact, segment.conditions, tagMap)
    );

    return {
      contacts: matchingContacts.slice(offset, offset + limit),
      total: matchingContacts.length,
    };
  },
});

/**
 * Get segment contact IDs (for broadcasts)
 */
export const getSegmentContactIds = query({
  args: {
    segmentId: v.id("creatorEmailSegments"),
  },
  returns: v.array(v.id("emailContacts")),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return [];

    // For static segments with cached IDs
    if (!segment.isDynamic && segment.cachedContactIds) {
      return segment.cachedContactIds;
    }

    // For dynamic segments, evaluate conditions
    const allContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .collect();
    const tagMap = new Map(tags.map((t) => [t._id, t.name]));

    return allContacts
      .filter((contact) => evaluateConditionsForContact(contact, segment.conditions, tagMap))
      .map((contact) => contact._id);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new segment
 */
export const createSegment = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    conditions: v.array(conditionSchema),
    isDynamic: v.boolean(),
  },
  returns: v.id("creatorEmailSegments"),
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);
    const now = Date.now();

    // Calculate initial member count
    const allContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    const tagMap = new Map(tags.map((t) => [t._id, t.name]));

    const matchingContactIds = allContacts
      .filter((contact) => evaluateConditionsForContact(contact, args.conditions, tagMap))
      .map((contact) => contact._id);

    return await ctx.db.insert("creatorEmailSegments", {
      storeId: args.storeId,
      name: args.name,
      description: args.description || "",
      conditions: args.conditions,
      isDynamic: args.isDynamic,
      memberCount: matchingContactIds.length,
      cachedContactIds: args.isDynamic ? undefined : matchingContactIds,
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a segment
 */
export const updateSegment = mutation({
  args: {
    segmentId: v.id("creatorEmailSegments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(v.array(conditionSchema)),
    isDynamic: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return { success: false };

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isDynamic !== undefined) updates.isDynamic = args.isDynamic;

    if (args.conditions !== undefined) {
      updates.conditions = args.conditions;

      // Recalculate member count
      const allContacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
        .filter((q) => q.eq(q.field("status"), "subscribed"))
        .collect();

      const tags = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
        .collect();
      const tagMap = new Map(tags.map((t) => [t._id, t.name]));

      const matchingContactIds = allContacts
        .filter((contact) => evaluateConditionsForContact(contact, args.conditions!, tagMap))
        .map((contact) => contact._id);

      updates.memberCount = matchingContactIds.length;
      updates.lastUpdated = Date.now();

      if (!updates.isDynamic && !segment.isDynamic) {
        updates.cachedContactIds = matchingContactIds;
      }
    }

    await ctx.db.patch(args.segmentId, updates);
    return { success: true };
  },
});

/**
 * Delete a segment
 */
export const deleteSegment = mutation({
  args: {
    segmentId: v.id("creatorEmailSegments"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return { success: false };

    await ctx.db.delete(args.segmentId);
    return { success: true };
  },
});

/**
 * Refresh segment member count
 */
export const refreshSegment = mutation({
  args: {
    segmentId: v.id("creatorEmailSegments"),
  },
  returns: v.object({
    success: v.boolean(),
    memberCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return { success: false, memberCount: 0 };

    const allContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .collect();

    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", segment.storeId))
      .collect();
    const tagMap = new Map(tags.map((t) => [t._id, t.name]));

    const matchingContactIds = allContacts
      .filter((contact) => evaluateConditionsForContact(contact, segment.conditions, tagMap))
      .map((contact) => contact._id);

    await ctx.db.patch(args.segmentId, {
      memberCount: matchingContactIds.length,
      cachedContactIds: segment.isDynamic ? undefined : matchingContactIds,
      lastUpdated: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, memberCount: matchingContactIds.length };
  },
});

/**
 * Duplicate a segment
 */
export const duplicateSegment = mutation({
  args: {
    segmentId: v.id("creatorEmailSegments"),
  },
  returns: v.id("creatorEmailSegments"),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    const now = Date.now();

    return await ctx.db.insert("creatorEmailSegments", {
      storeId: segment.storeId,
      name: `${segment.name} (Copy)`,
      description: segment.description,
      conditions: segment.conditions,
      isDynamic: segment.isDynamic,
      memberCount: segment.memberCount,
      cachedContactIds: segment.cachedContactIds,
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Evaluate conditions for a contact
 */
function evaluateConditionsForContact(
  contact: any,
  conditions: any[],
  tagMap: Map<Id<"emailTags">, string>
): boolean {
  if (!conditions || conditions.length === 0) return true;

  let overallMatch = true;
  let currentLogic: "AND" | "OR" = "AND";

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionMatches = evaluateSingleCondition(contact, condition, tagMap);

    if (i === 0) {
      overallMatch = conditionMatches;
    } else {
      if (currentLogic === "AND") {
        overallMatch = overallMatch && conditionMatches;
      } else {
        overallMatch = overallMatch || conditionMatches;
      }
    }

    // Update logic for next condition
    if (condition.logic) {
      currentLogic = condition.logic;
    }
  }

  return overallMatch;
}

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(
  contact: any,
  condition: any,
  tagMap: Map<Id<"emailTags">, string>
): boolean {
  const { field, operator, value } = condition;

  // Get field value based on field path
  let fieldValue: any;

  switch (field) {
    case "email":
      fieldValue = contact.email;
      break;
    case "firstName":
      fieldValue = contact.firstName;
      break;
    case "lastName":
      fieldValue = contact.lastName;
      break;
    case "fullName":
      fieldValue = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
      break;
    case "status":
      fieldValue = contact.status;
      break;
    case "tags":
      fieldValue = (contact.tagIds || []).map((id: Id<"emailTags">) => tagMap.get(id)).filter(Boolean);
      break;
    case "tagCount":
      fieldValue = (contact.tagIds || []).length;
      break;
    case "emailsSent":
      fieldValue = contact.emailsSent || 0;
      break;
    case "emailsOpened":
      fieldValue = contact.emailsOpened || 0;
      break;
    case "emailsClicked":
      fieldValue = contact.emailsClicked || 0;
      break;
    case "openRate":
      fieldValue =
        contact.emailsSent > 0
          ? ((contact.emailsOpened || 0) / contact.emailsSent) * 100
          : 0;
      break;
    case "clickRate":
      fieldValue =
        contact.emailsSent > 0
          ? ((contact.emailsClicked || 0) / contact.emailsSent) * 100
          : 0;
      break;
    case "createdAt":
      fieldValue = contact.createdAt;
      break;
    case "lastOpenedAt":
      fieldValue = contact.lastOpenedAt;
      break;
    case "lastClickedAt":
      fieldValue = contact.lastClickedAt;
      break;
    case "daysSinceSignup":
      fieldValue = Math.floor((Date.now() - contact.createdAt) / (1000 * 60 * 60 * 24));
      break;
    case "daysSinceLastOpen":
      fieldValue = contact.lastOpenedAt
        ? Math.floor((Date.now() - contact.lastOpenedAt) / (1000 * 60 * 60 * 24))
        : null;
      break;
    default:
      // Try to get from contact object directly
      fieldValue = contact[field];
  }

  // Evaluate based on operator
  switch (operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();

    case "not_equals":
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase();

    case "greater_than":
      return Number(fieldValue) > Number(value);

    case "less_than":
      return Number(fieldValue) < Number(value);

    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((v) => String(v).toLowerCase().includes(String(value).toLowerCase()));
      }
      return String(fieldValue || "").toLowerCase().includes(String(value).toLowerCase());

    case "not_contains":
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some((v) => String(v).toLowerCase().includes(String(value).toLowerCase()));
      }
      return !String(fieldValue || "").toLowerCase().includes(String(value).toLowerCase());

    case "is_empty":
      return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);

    case "is_not_empty":
      return !!fieldValue && !(Array.isArray(fieldValue) && fieldValue.length === 0);

    case "in_list":
      if (Array.isArray(value)) {
        if (Array.isArray(fieldValue)) {
          return value.some((v) => fieldValue.includes(v));
        }
        return value.includes(fieldValue);
      }
      return false;

    case "not_in_list":
      if (Array.isArray(value)) {
        if (Array.isArray(fieldValue)) {
          return !value.some((v) => fieldValue.includes(v));
        }
        return !value.includes(fieldValue);
      }
      return true;

    case "before":
      return fieldValue && fieldValue < Number(value);

    case "after":
      return fieldValue && fieldValue > Number(value);

    case "between":
      if (Array.isArray(value) && value.length === 2) {
        return fieldValue >= Number(value[0]) && fieldValue <= Number(value[1]);
      }
      return false;

    default:
      return false;
  }
}
