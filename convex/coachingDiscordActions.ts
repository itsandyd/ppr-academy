"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ==================== DISCORD SETUP ACTION ====================

export const setupDiscordForSession = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
    coachId: v.string(),
    studentId: v.string(),
    productId: v.id("digitalProducts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get the product to find the store
      const product = await ctx.runQuery(
        internal.coachingProducts.getProductForDiscord,
        { productId: args.productId }
      );

      if (!product) {
        console.error("Product not found for Discord setup");
        return null;
      }

      // Get store's Discord guild
      const guild = await ctx.runQuery(
        internal.discordInternal.getStoreDiscordGuildInternal,
        { storeId: product.storeId as any }
      );

      if (!guild || !guild.isActive) {
        return null;
      }

      // Get guild details (with bot token)
      const guildData = await ctx.runQuery(
        internal.discordInternal.getDiscordGuildInternal,
        { guildId: guild.guildId }
      );

      if (!guildData) {
        console.error("Guild data not found");
        return null;
      }

      // Get student and coach Discord info
      const studentDiscord = await ctx.runQuery(
        internal.discordInternal.getDiscordConnectionInternal,
        { userId: args.studentId }
      );

      const coachDiscord = await ctx.runQuery(
        internal.discordInternal.getDiscordConnectionInternal,
        { userId: args.coachId }
      );

      if (!studentDiscord) {
        console.error("Student Discord connection not found");
        return null;
      }

      if (!coachDiscord) {
        console.warn("Coach Discord connection not found - channel will be created but coach won't have access");
      }

      // Create unique role for this session
      const sessionRoleResult = await createSessionRole(
        guild.guildId,
        guildData.botToken,
        args.sessionId,
        product.title
      );

      if (!sessionRoleResult.success || !sessionRoleResult.roleId) {
        console.error("Failed to create session role");
        return null;
      }

      const roleId = sessionRoleResult.roleId;

      // Create private channel for this session
      const channelResult = await createSessionChannel(
        guild.guildId,
        guildData.botToken,
        args.sessionId,
        product.title,
        roleId
      );

      if (!channelResult.success || !channelResult.channelId) {
        console.error("Failed to create session channel");
        // Try to clean up the role
        await deleteRole(guild.guildId, guildData.botToken, roleId);
        return null;
      }

      // Assign role to student
      await ctx.runAction(
        internal.discord.assignDiscordRoleInternal,
        {
          userId: args.studentId,
          guildId: guild.guildId,
          roleId,
        }
      );

      // Assign role to coach (if connected)
      if (coachDiscord) {
        await ctx.runAction(internal.discord.assignDiscordRoleInternal, {
          userId: args.coachId,
          guildId: guild.guildId,
          roleId,
        });
      }

      // Update session with Discord details
      await ctx.runMutation(internal.coachingProducts.updateSessionDiscordInfo, {
        sessionId: args.sessionId,
        discordChannelId: channelResult.channelId,
        discordRoleId: roleId,
      });

      return null;
    } catch (error) {
      console.error("Error setting up Discord for session:", error);
      return null;
    }
  },
});

// ==================== DISCORD CLEANUP ACTION ====================

export const cleanupSessionDiscord = internalAction({
  args: {
    sessionId: v.id("coachingSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get session details
      const session = await ctx.runQuery(
        internal.coachingProducts.getSessionForCleanup,
        { sessionId: args.sessionId }
      );

      if (!session) {
        return null;
      }

      if (!session.discordChannelId || !session.discordRoleId) {
        return null;
      }

      // Get guild info
      const product = await ctx.runQuery(
        internal.coachingProducts.getProductForDiscord,
        { productId: session.productId }
      );

      if (!product) {
        console.error("Product not found for cleanup");
        return null;
      }

      const guild = await ctx.runQuery(
        internal.discordInternal.getStoreDiscordGuildInternal,
        { storeId: product.storeId as any }
      );

      if (!guild || !guild.isActive) {
        return null;
      }

      const guildData = await ctx.runQuery(
        internal.discordInternal.getDiscordGuildInternal,
        { guildId: guild.guildId }
      );

      if (!guildData) {
        console.error("Guild data not found for cleanup");
        return null;
      }

      // Delete channel
      await deleteChannel(
        guild.guildId,
        guildData.botToken,
        session.discordChannelId
      );

      // Delete role
      await deleteRole(guild.guildId, guildData.botToken, session.discordRoleId);

      return null;
    } catch (error) {
      console.error("Error cleaning up Discord:", error);
      return null;
    }
  },
});

// ==================== HELPER FUNCTIONS ====================

// Helper function to create a unique role for a coaching session
async function createSessionRole(
  guildId: string,
  botToken: string,
  sessionId: string,
  productTitle: string
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  try {
    const roleName = `Session ${sessionId.slice(-8)}`;
    
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleName,
          permissions: "0", // No special permissions
          color: 0x5865f2, // Discord blurple
          hoist: false, // Don't display separately
          mentionable: false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create role:", error);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const role = await response.json();
    return { success: true, roleId: (role as any)?.id };
  } catch (error: any) {
    console.error("Error creating session role:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to create a private channel for a coaching session
async function createSessionChannel(
  guildId: string,
  botToken: string,
  sessionId: string,
  productTitle: string,
  roleId: string
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  try {
    const channelName = `coaching-${sessionId.slice(-8)}`;

    // Create the channel
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: channelName,
          type: 2, // Voice channel
          permission_overwrites: [
            {
              id: guildId, // @everyone
              type: 0,
              deny: "1024", // VIEW_CHANNEL
            },
            {
              id: roleId, // Session role
              type: 0,
              allow: "3147776", // VIEW_CHANNEL + CONNECT + SPEAK
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create channel:", error);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const channel = await response.json();
    return { success: true, channelId: (channel as any)?.id };
  } catch (error: any) {
    console.error("Error creating session channel:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to delete a channel (cleanup)
async function deleteChannel(
  guildId: string,
  botToken: string,
  channelId: string
): Promise<void> {
  try {
    await fetch(
      `https://discord.com/api/v10/channels/${channelId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error deleting channel:", error);
  }
}

// Helper function to delete a role (cleanup)
async function deleteRole(
  guildId: string,
  botToken: string,
  roleId: string
): Promise<void> {
  try {
    await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error deleting role:", error);
  }
}

