import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== PUBLIC QUERIES ====================

// Get user's Discord connection
export const getUserDiscordConnection = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("discordIntegrations"),
      userId: v.string(),
      discordUserId: v.string(),
      discordUsername: v.string(),
      discordAvatar: v.optional(v.string()),
      guildMemberStatus: v.optional(v.string()),
      lastSyncedAt: v.number(),
      connectedAt: v.number(),
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
      _id: connection._id,
      userId: connection.userId,
      discordUserId: connection.discordUserId,
      discordUsername: connection.discordUsername,
      discordAvatar: connection.discordAvatar,
      guildMemberStatus: connection.guildMemberStatus,
      lastSyncedAt: connection.lastSyncedAt,
      connectedAt: connection.connectedAt,
    };
  },
});

// Get Discord guild info for a store
export const getStoreDiscordGuild = query({
  args: { storeId: v.id("stores") },
  returns: v.union(
    v.object({
      _id: v.id("discordGuilds"),
      guildId: v.string(),
      guildName: v.string(),
      inviteCode: v.optional(v.string()),
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
      _id: guild._id,
      guildId: guild.guildId,
      guildName: guild.guildName,
      inviteCode: guild.inviteCode,
      isActive: guild.isActive,
    };
  },
});

// ==================== PUBLIC MUTATIONS ====================

// Connect Discord account (called after OAuth)
export const connectDiscordAccount = mutation({
  args: {
    userId: v.string(),
    discordUserId: v.string(),
    discordUsername: v.string(),
    discordDiscriminator: v.optional(v.string()),
    discordAvatar: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(), // seconds until expiration
  },
  returns: v.object({
    success: v.boolean(),
    connectionId: v.optional(v.id("discordIntegrations")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if connection already exists
      const existing = await ctx.db
        .query("discordIntegrations")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .unique();

      const expiresAt = Date.now() + args.expiresIn * 1000;

      if (existing) {
        // Update existing connection
        await ctx.db.patch(existing._id, {
          discordUserId: args.discordUserId,
          discordUsername: args.discordUsername,
          discordDiscriminator: args.discordDiscriminator,
          discordAvatar: args.discordAvatar,
          accessToken: args.accessToken,
          refreshToken: args.refreshToken,
          expiresAt,
          lastSyncedAt: Date.now(),
        });

        return { success: true, connectionId: existing._id };
      }

      // Create new connection
      const connectionId = await ctx.db.insert("discordIntegrations", {
        userId: args.userId,
        discordUserId: args.discordUserId,
        discordUsername: args.discordUsername,
        discordDiscriminator: args.discordDiscriminator,
        discordAvatar: args.discordAvatar,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt,
        enrolledCourseIds: [],
        assignedRoles: [],
        lastSyncedAt: Date.now(),
        connectedAt: Date.now(),
      });

      return { success: true, connectionId };
    } catch (error: any) {
      console.error("Error connecting Discord account:", error);
      return { success: false, error: error.message };
    }
  },
});

// Disconnect Discord
export const disconnectDiscord = mutation({
  args: { userId: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    return { success: true };
  },
});

// Update Discord guild configuration
export const updateDiscordGuildConfig = mutation({
  args: {
    storeId: v.id("stores"),
    guildId: v.string(),
    guildName: v.string(),
    inviteCode: v.optional(v.string()),
    botToken: v.string(),
    courseRoles: v.optional(v.any()),
    isActive: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    guildConfigId: v.optional(v.id("discordGuilds")),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("discordGuilds")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        guildId: args.guildId,
        guildName: args.guildName,
        inviteCode: args.inviteCode,
        botToken: args.botToken,
        courseRoles: args.courseRoles,
        isActive: args.isActive,
        updatedAt: Date.now(),
      });

      return { success: true, guildConfigId: existing._id };
    }

    const guildConfigId = await ctx.db.insert("discordGuilds", {
      storeId: args.storeId,
      guildId: args.guildId,
      guildName: args.guildName,
      inviteCode: args.inviteCode,
      botToken: args.botToken,
      courseRoles: args.courseRoles,
      isActive: args.isActive,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, guildConfigId };
  },
});

