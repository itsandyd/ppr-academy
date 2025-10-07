import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== INTERNAL QUERIES ====================

export const getStoreDiscordGuildInternal = internalQuery({
  args: { storeId: v.id("stores") },
  returns: v.union(
    v.object({
      guildId: v.string(),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const guild = await ctx.db
      .query("discordGuilds")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (!guild) return null;

    return {
      guildId: guild.guildId,
      isActive: guild.isActive,
    };
  },
});

export const getDiscordConnectionInternal = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      discordUserId: v.string(),
      accessToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) return null;

    return {
      discordUserId: connection.discordUserId,
      accessToken: connection.accessToken,
    };
  },
});

export const getDiscordGuildInternal = internalQuery({
  args: { guildId: v.string() },
  returns: v.union(
    v.object({
      botToken: v.string(),
      courseRoles: v.optional(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const guild = await ctx.db
      .query("discordGuilds")
      .withIndex("by_guildId", (q) => q.eq("guildId", args.guildId))
      .unique();

    if (!guild) return null;

    return {
      botToken: guild.botToken,
      courseRoles: guild.courseRoles,
    };
  },
});

export const getUserEnrollments = internalQuery({
  args: { userId: v.string() },
  returns: v.array(v.object({ courseId: v.string() })),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return enrollments.map((e) => ({ courseId: e.courseId as any }));
  },
});

// ==================== INTERNAL MUTATIONS ====================

export const updateGuildMemberStatus = internalMutation({
  args: {
    userId: v.string(),
    status: v.union(
      v.literal("invited"),
      v.literal("joined"),
      v.literal("left"),
      v.literal("kicked"),
      v.literal("banned")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.patch(connection._id, {
        guildMemberStatus: args.status,
      });
    }

    return null;
  },
});

export const addAssignedRole = internalMutation({
  args: { userId: v.string(), roleId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      const currentRoles = connection.assignedRoles || [];
      if (!currentRoles.includes(args.roleId)) {
        await ctx.db.patch(connection._id, {
          assignedRoles: [...currentRoles, args.roleId],
        });
      }
    }

    return null;
  },
});

export const updateLastSynced = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.patch(connection._id, {
        lastSyncedAt: Date.now(),
      });
    }

    return null;
  },
});

export const logDiscordEvent = internalMutation({
  args: {
    eventType: v.union(
      v.literal("member_joined"),
      v.literal("member_left"),
      v.literal("role_assigned"),
      v.literal("role_removed"),
      v.literal("invite_created"),
      v.literal("sync_completed")
    ),
    userId: v.optional(v.string()),
    discordUserId: v.optional(v.string()),
    guildId: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("discordEvents", {
      eventType: args.eventType,
      userId: args.userId,
      discordUserId: args.discordUserId,
      guildId: args.guildId,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return null;
  },
});

