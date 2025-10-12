/**
 * Advanced Email Segmentation System
 * Dynamic segments with behavioral targeting (ActiveCampaign-level)
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all segments
 */
export const getSegments = query({
  args: {
    connectionId: v.optional(v.id("resendConnections")),
    isDynamic: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.isDynamic !== undefined) {
      let segments = await ctx.db
        .query("emailSegments")
        .withIndex("by_isDynamic", (q) => q.eq("isDynamic", args.isDynamic as boolean))
        .collect();
      
      if (args.connectionId !== undefined) {
        segments = segments.filter(s => s.connectionId === args.connectionId);
      }
      
      return segments;
    }
    
    if (args.connectionId !== undefined) {
      return await ctx.db
        .query("emailSegments")
        .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId as Id<"resendConnections">))
        .collect();
    }
    
    return await ctx.db.query("emailSegments").collect();
  },
});

/**
 * Get segment by ID
 */
export const getSegmentById = query({
  args: {
    segmentId: v.id("emailSegments"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.segmentId);
  },
});

/**
 * Check if user matches segment conditions
 */
export const userMatchesSegment = query({
  args: {
    userId: v.string(),
    segmentId: v.id("emailSegments"),
  },
  returns: v.object({
    matches: v.boolean(),
    reasons: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) {
      return { matches: false, reasons: ["Segment not found"] };
    }
    
    return await evaluateSegmentForUser(ctx, args.userId, segment);
  },
});

/**
 * Get users in a segment
 */
export const getSegmentMembers = query({
  args: {
    segmentId: v.id("emailSegments"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return [];
    
    // If segment has cached user IDs, return those
    if (segment.cachedUserIds && segment.cachedUserIds.length > 0) {
      const limit = args.limit || segment.cachedUserIds.length;
      return segment.cachedUserIds.slice(0, limit);
    }
    
    // Otherwise, evaluate segment for all users
    const allUsers = await ctx.db.query("users").collect();
    const matchingUsers: string[] = [];
    
    for (const user of allUsers) {
      if (!user.clerkId) continue;
      
      const result = await evaluateSegmentForUser(ctx, user.clerkId, segment);
      if (result.matches) {
        matchingUsers.push(user.clerkId);
        if (args.limit && matchingUsers.length >= args.limit) break;
      }
    }
    
    return matchingUsers;
  },
});

/**
 * Get segment size (member count)
 */
export const getSegmentSize = query({
  args: {
    segmentId: v.id("emailSegments"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return 0;
    
    return segment.memberCount;
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
    name: v.string(),
    description: v.string(),
    conditions: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("greater_than"),
        v.literal("less_than"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      logic: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
    })),
    isDynamic: v.boolean(),
    connectionId: v.optional(v.id("resendConnections")),
  },
  returns: v.id("emailSegments"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const segmentId = await ctx.db.insert("emailSegments", {
      connectionId: args.connectionId,
      name: args.name,
      description: args.description,
      conditions: args.conditions,
      isDynamic: args.isDynamic,
      memberCount: 0,
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
    });
    
    // If dynamic, calculate initial member count
    if (args.isDynamic) {
      await ctx.scheduler.runAfter(0, "emailSegmentation:updateSegmentMembers" as any, {
        segmentId,
      });
    }
    
    return segmentId;
  },
});

/**
 * Update segment members (for dynamic segments)
 */
export const updateSegmentMembers = internalMutation({
  args: {
    segmentId: v.id("emailSegments"),
  },
  returns: v.object({
    memberCount: v.number(),
    updated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) {
      return { memberCount: 0, updated: false };
    }
    
    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    const matchingUserIds: string[] = [];
    
    // Evaluate each user
    for (const user of allUsers) {
      if (!user.clerkId) continue;
      
      const result = await evaluateSegmentForUser(ctx, user.clerkId, segment);
      if (result.matches) {
        matchingUserIds.push(user.clerkId);
      }
    }
    
    // Update segment
    await ctx.db.patch(args.segmentId, {
      memberCount: matchingUserIds.length,
      cachedUserIds: matchingUserIds,
      lastUpdated: Date.now(),
      updatedAt: Date.now(),
    });
    
    return {
      memberCount: matchingUserIds.length,
      updated: true,
    };
  },
});

/**
 * Refresh all dynamic segments (cron job)
 */
export const refreshAllDynamicSegments = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    const dynamicSegments = await ctx.db
      .query("emailSegments")
      .withIndex("by_isDynamic", (q) => q.eq("isDynamic", true))
      .collect();
    
    let processed = 0;
    let updated = 0;
    
    for (const segment of dynamicSegments) {
      processed++;
      
      // Get all users
      const allUsers = await ctx.db.query("users").collect();
      const matchingUserIds: string[] = [];
      
      // Evaluate each user
      for (const user of allUsers) {
        if (!user.clerkId) continue;
        
        const result = await evaluateSegmentForUser(ctx, user.clerkId, segment);
        if (result.matches) {
          matchingUserIds.push(user.clerkId);
        }
      }
      
      // Update if count changed
      if (matchingUserIds.length !== segment.memberCount) {
        updated++;
        await ctx.db.patch(segment._id, {
          memberCount: matchingUserIds.length,
          cachedUserIds: matchingUserIds,
          lastUpdated: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    
    return { processed, updated };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Evaluate if a user matches segment conditions
 */
async function evaluateSegmentForUser(
  ctx: any,
  userId: string,
  segment: any
): Promise<{ matches: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  
  // Get user data
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", userId))
    .unique();
  
  if (!user) {
    return { matches: false, reasons: ["User not found"] };
  }
  
  // Get lead score
  const leadScore = await ctx.db
    .query("leadScores")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  
  // Get email engagement
  const emailLogs = await ctx.db
    .query("resendLogs")
    .withIndex("by_user", (q: any) => q.eq("recipientUserId", userId))
    .collect();
  
  // Get course enrollments
  const enrollments = await ctx.db
    .query("courseEnrollments")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .collect();
  
  // Build user context for evaluation
  const userContext = {
    user,
    leadScore,
    emailLogs,
    enrollments,
    totalEmailsReceived: emailLogs.length,
    totalEmailsOpened: emailLogs.filter((l: any) => l.status === "opened" || l.status === "clicked").length,
    totalEmailsClicked: emailLogs.filter((l: any) => l.status === "clicked").length,
    totalCoursesEnrolled: enrollments.length,
    totalCoursesCompleted: enrollments.filter((e: any) => e.progress === 100).length,
  };
  
  // Evaluate conditions
  let overallMatch = true;
  let currentLogic: "AND" | "OR" = "AND";
  
  for (let i = 0; i < segment.conditions.length; i++) {
    const condition = segment.conditions[i];
    const conditionMatches = evaluateCondition(condition, userContext);
    
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
    
    reasons.push(
      `Condition ${i + 1}: ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)} = ${conditionMatches ? "✓" : "✗"}`
    );
  }
  
  return { matches: overallMatch, reasons };
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: any, userContext: any): boolean {
  const { field, operator, value } = condition;
  
  // Get field value from user context
  let fieldValue: any;
  
  // Parse nested fields (e.g., "leadScore.score")
  const fieldParts = field.split(".");
  fieldValue = userContext;
  
  for (const part of fieldParts) {
    if (fieldValue && typeof fieldValue === "object" && part in fieldValue) {
      fieldValue = fieldValue[part];
    } else {
      fieldValue = undefined;
      break;
    }
  }
  
  // Handle undefined values
  if (fieldValue === undefined || fieldValue === null) {
    return operator === "not_equals" || operator === "not_contains" || operator === "not_in";
  }
  
  // Evaluate based on operator
  switch (operator) {
    case "equals":
      return fieldValue === value;
      
    case "not_equals":
      return fieldValue !== value;
      
    case "greater_than":
      return Number(fieldValue) > Number(value);
      
    case "less_than":
      return Number(fieldValue) < Number(value);
      
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      
    case "not_contains":
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      
    case "in":
      return Array.isArray(value) && value.includes(fieldValue);
      
    case "not_in":
      return Array.isArray(value) && !value.includes(fieldValue);
      
    default:
      return false;
  }
}

