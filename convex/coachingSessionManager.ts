"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ==================== CRON JOB: Session Manager ====================

/**
 * This cron job runs every 15 minutes and manages coaching session access:
 * 
 * 1. SETUP (2 hours before session):
 *    - Create Discord channel + role
 *    - Assign role to coach + student
 *    - Mark session as "setup_complete"
 * 
 * 2. CLEANUP (1 hour after session):
 *    - Revoke roles from coach + student
 *    - Delete Discord channel + role
 *    - Mark session as "cleaned_up"
 * 
 * This prevents:
 * - Students accessing channels weeks before their session
 * - Old participants joining recycled channels
 * - Channel/role buildup in Discord
 */
export const manageCoachingSessions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      // Get sessions that need setup (starting in ~2 hours)
      const sessionsToSetup = await ctx.runQuery(
        internal.coachingSessionQueries.getSessionsNeedingSetup
      );

      // Setup each session
      for (const session of sessionsToSetup) {
        try {
          await setupSessionAccess(ctx, session);
        } catch (error) {
          console.error(`Failed to setup session ${session._id}:`, error);
        }
      }

      // Get sessions that need cleanup (ended >1 hour ago)
      const sessionsToCleanup = await ctx.runQuery(
        internal.coachingSessionQueries.getSessionsNeedingCleanup
      );

      // Cleanup each session
      for (const session of sessionsToCleanup) {
        try {
          await cleanupSessionAccess(ctx, session);
        } catch (error) {
          console.error(`Failed to cleanup session ${session._id}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Session manager error:", error);
      return null;
    }
  },
});

// ==================== HELPER FUNCTIONS ====================

async function setupSessionAccess(ctx: any, session: any) {
  // Get guild info
  const guildInfo = await ctx.runQuery(
    internal.coachingSessionQueries.getSessionGuildInfo,
    { coachId: session.coachId }
  );

  if (!guildInfo) {
    console.error("No guild info found for session");
    return;
  }

  // Get Discord connections
  const studentDiscord = await ctx.runQuery(
    internal.discordInternal.getDiscordConnectionInternal,
    { userId: session.studentId }
  );

  const coachDiscord = await ctx.runQuery(
    internal.discordInternal.getDiscordConnectionInternal,
    { userId: session.coachId }
  );

  if (!studentDiscord) {
    console.error("Student Discord not connected");
    return;
  }

  // Create unique role for this session
  const roleResult = await createSessionRole(
    guildInfo.guildId,
    guildInfo.botToken,
    session._id,
    `Session ${session._id.slice(-8)}`
  );

  if (!roleResult.success || !roleResult.roleId) {
    console.error("Failed to create role");
    return;
  }

  // Create private channel for this session
  const channelResult = await createSessionChannel(
    guildInfo.guildId,
    guildInfo.botToken,
    session._id,
    roleResult.roleId
  );

  if (!channelResult.success || !channelResult.channelId) {
    console.error("Failed to create channel");
    await deleteRole(guildInfo.guildId, guildInfo.botToken, roleResult.roleId);
    return;
  }

  // Assign role to student
  await assignRoleToUser(
    guildInfo.guildId,
    guildInfo.botToken,
    studentDiscord.discordUserId,
    roleResult.roleId
  );

  // Assign role to coach (if connected)
  if (coachDiscord) {
    await assignRoleToUser(
      guildInfo.guildId,
      guildInfo.botToken,
      coachDiscord.discordUserId,
      roleResult.roleId
    );
  }

  // Mark session as set up
  await ctx.runMutation(internal.coachingSessionQueries.markSessionSetupComplete, {
    sessionId: session._id,
    discordChannelId: channelResult.channelId,
    discordRoleId: roleResult.roleId,
  });
}

async function cleanupSessionAccess(ctx: any, session: any) {
  if (!session.discordChannelId || !session.discordRoleId) {
    return;
  }

  // Get guild info
  const guildInfo = await ctx.runQuery(
    internal.coachingSessionQueries.getSessionGuildInfo,
    { coachId: session.coachId }
  );

  if (!guildInfo) {
    console.error("No guild info found for cleanup");
    return;
  }

  // Delete channel
  try {
    await deleteChannel(guildInfo.guildId, guildInfo.botToken, session.discordChannelId);
  } catch (error) {
    console.error("Error deleting channel:", error);
  }

  // Delete role
  try {
    await deleteRole(guildInfo.guildId, guildInfo.botToken, session.discordRoleId);
  } catch (error) {
    console.error("Error deleting role:", error);
  }

  // Mark as cleaned up
  await ctx.runMutation(internal.coachingSessionQueries.markSessionCleanedUp, {
    sessionId: session._id,
  });
}

// ==================== DISCORD API HELPERS ====================

async function createSessionRole(
  guildId: string,
  botToken: string,
  sessionId: string,
  roleName: string
): Promise<{ success: boolean; roleId?: string }> {
  try {
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
          permissions: "0",
          color: 0x5865f2,
          hoist: false,
          mentionable: false,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to create role:", await response.text());
      return { success: false };
    }

    const role = await response.json();
    return { success: true, roleId: (role as any)?.id };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false };
  }
}

async function createSessionChannel(
  guildId: string,
  botToken: string,
  sessionId: string,
  roleId: string
): Promise<{ success: boolean; channelId?: string }> {
  try {
    const channelName = `coaching-${sessionId.slice(-8)}`;

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
      console.error("Failed to create channel:", await response.text());
      return { success: false };
    }

    const channel = await response.json();
    return { success: true, channelId: (channel as any)?.id };
  } catch (error) {
    console.error("Error creating channel:", error);
    return { success: false };
  }
}

async function assignRoleToUser(
  guildId: string,
  botToken: string,
  discordUserId: string,
  roleId: string
): Promise<void> {
  try {
    await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );
  } catch (error) {
    console.error("Error assigning role:", error);
  }
}

async function deleteChannel(
  guildId: string,
  botToken: string,
  channelId: string
): Promise<void> {
  await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });
}

async function deleteRole(
  guildId: string,
  botToken: string,
  roleId: string
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );
}

