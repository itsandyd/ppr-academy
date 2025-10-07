"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Discord API Configuration
const DISCORD_API_BASE = "https://discord.com/api/v10";

// ==================== ACTIONS (Discord API Calls) ====================

// Add user to Discord server
export const addUserToGuild = action({
  args: {
    userId: v.string(),
    guildId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get user's Discord connection
      const connection = await ctx.runQuery(internal.discordInternal.getDiscordConnectionInternal, {
        userId: args.userId,
      });

      if (!connection) {
        return { success: false, error: "User hasn't connected Discord" };
      }

      // Get guild bot token
      const guild = await ctx.runQuery(internal.discordInternal.getDiscordGuildInternal, {
        guildId: args.guildId,
      });

      if (!guild) {
        return { success: false, error: "Discord server not found" };
      }

      // Add user to guild using Discord API
      const response = await fetch(
        `${DISCORD_API_BASE}/guilds/${args.guildId}/members/${connection.discordUserId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${guild.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: connection.accessToken,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Discord API error:", error);
        return { success: false, error: `Discord API error: ${response.status}` };
      }

      // Update guild member status
      await ctx.runMutation(internal.discordInternal.updateGuildMemberStatus, {
        userId: args.userId,
        status: "joined",
      });

      // Log event
      await ctx.runMutation(internal.discordInternal.logDiscordEvent, {
        eventType: "member_joined",
        userId: args.userId,
        discordUserId: connection.discordUserId,
        guildId: args.guildId,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error adding user to guild:", error);
      return { success: false, error: error.message };
    }
  },
});

// Assign role to user in Discord
export const assignDiscordRole = action({
  args: {
    userId: v.string(),
    guildId: v.string(),
    roleId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      const connection = await ctx.runQuery(internal.discordInternal.getDiscordConnectionInternal, {
        userId: args.userId,
      });

      if (!connection) {
        return { success: false, error: "User hasn't connected Discord" };
      }

      const guild = await ctx.runQuery(internal.discordInternal.getDiscordGuildInternal, {
        guildId: args.guildId,
      });

      if (!guild) {
        return { success: false, error: "Discord server not found" };
      }

      // Assign role using Discord API
      const response = await fetch(
        `${DISCORD_API_BASE}/guilds/${args.guildId}/members/${connection.discordUserId}/roles/${args.roleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${guild.botToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Discord API error:", error);
        return { success: false, error: `Failed to assign role: ${response.status}` };
      }

      // Update assigned roles in database
      await ctx.runMutation(internal.discordInternal.addAssignedRole, {
        userId: args.userId,
        roleId: args.roleId,
      });

      // Log event
      await ctx.runMutation(internal.discordInternal.logDiscordEvent, {
        eventType: "role_assigned",
        userId: args.userId,
        discordUserId: connection.discordUserId,
        guildId: args.guildId,
        metadata: { roleId: args.roleId },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error assigning role:", error);
      return { success: false, error: error.message };
    }
  },
});

// Sync user's course enrollments to Discord roles
export const syncUserRoles = action({
  args: { userId: v.string(), storeId: v.id("stores") },
  returns: v.object({
    success: v.boolean(),
    rolesAssigned: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get user's enrollments
      const enrollments = await ctx.runQuery(internal.discordInternal.getUserEnrollments, {
        userId: args.userId,
      });

      // Get store's Discord guild
      const guild = await ctx.runQuery(internal.discordInternal.getStoreDiscordGuildInternal, {
        storeId: args.storeId,
      });

      if (!guild || !guild.isActive) {
        return { success: false, rolesAssigned: 0, error: "No active Discord server" };
      }

      const guildData = await ctx.runQuery(internal.discordInternal.getDiscordGuildInternal, {
        guildId: guild.guildId,
      });

      if (!guildData || !guildData.courseRoles) {
        return { success: false, rolesAssigned: 0, error: "No course roles configured" };
      }

      let rolesAssigned = 0;

      // Assign role for each enrolled course
      for (const enrollment of enrollments) {
        const courseIdStr = enrollment.courseId;
        const roleId = (guildData.courseRoles as any)[courseIdStr];

        if (roleId) {
          const result = await ctx.runAction(internal.discord.assignDiscordRoleInternal, {
            userId: args.userId,
            guildId: guild.guildId,
            roleId,
          });

          if (result.success) {
            rolesAssigned++;
          }
        }
      }

      // Update last synced timestamp
      await ctx.runMutation(internal.discordInternal.updateLastSynced, {
        userId: args.userId,
      });

      return { success: true, rolesAssigned };
    } catch (error: any) {
      console.error("Error syncing roles:", error);
      return { success: false, rolesAssigned: 0, error: error.message };
    }
  },
});

// Internal action wrapper for assignDiscordRole (to avoid circular references)
export const assignDiscordRoleInternal = internalAction({
  args: {
    userId: v.string(),
    guildId: v.string(),
    roleId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      const connection = await ctx.runQuery(internal.discordInternal.getDiscordConnectionInternal, {
        userId: args.userId,
      });

      if (!connection) {
        return { success: false, error: "User hasn't connected Discord" };
      }

      const guild = await ctx.runQuery(internal.discordInternal.getDiscordGuildInternal, {
        guildId: args.guildId,
      });

      if (!guild) {
        return { success: false, error: "Discord server not found" };
      }

      // Assign role using Discord API
      const response = await fetch(
        `${DISCORD_API_BASE}/guilds/${args.guildId}/members/${connection.discordUserId}/roles/${args.roleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${guild.botToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Discord API error:", error);
        return { success: false, error: `Failed to assign role: ${response.status}` };
      }

      // Update assigned roles in database
      await ctx.runMutation(internal.discordInternal.addAssignedRole, {
        userId: args.userId,
        roleId: args.roleId,
      });

      // Log event
      await ctx.runMutation(internal.discordInternal.logDiscordEvent, {
        eventType: "role_assigned",
        userId: args.userId,
        discordUserId: connection.discordUserId,
        guildId: args.guildId,
        metadata: { roleId: args.roleId },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error assigning role:", error);
      return { success: false, error: error.message };
    }
  },
});

