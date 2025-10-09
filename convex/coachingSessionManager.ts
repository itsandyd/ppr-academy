"use node";

import { v } from "convex/values";
import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
    console.log("🔄 Running coaching session manager...");

    try {
      // Get sessions that need setup (starting in ~2 hours)
      const sessionsToSetup = await ctx.runQuery(
        internal.coachingSessionManager.getSessionsNeedingSetup
      );

      console.log(`Found ${sessionsToSetup.length} sessions needing setup`);

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
        internal.coachingSessionManager.getSessionsNeedingCleanup
      );

      console.log(`Found ${sessionsToCleanup.length} sessions needing cleanup`);

      // Cleanup each session
      for (const session of sessionsToCleanup) {
        try {
          await cleanupSessionAccess(ctx, session);
        } catch (error) {
          console.error(`Failed to cleanup session ${session._id}:`, error);
        }
      }

      console.log("✅ Session manager completed");
      return null;
    } catch (error) {
      console.error("❌ Session manager error:", error);
      return null;
    }
  },
});

// ==================== QUERIES ====================

// Get sessions that need Discord setup (starting in ~2 hours, not yet set up)
export const getSessionsNeedingSetup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      discordSetupComplete: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const twoHoursFromNow = now + 2 * 60 * 60 * 1000; // 2 hours
    const threeHoursFromNow = now + 3 * 60 * 60 * 1000; // 3 hours buffer

    // Get all scheduled sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .collect();

    // Filter for sessions starting in 2-3 hours that haven't been set up
    return sessions.filter((session) => {
      const sessionTime = session.scheduledDate;
      const notSetUp = !session.discordSetupComplete;
      const inTimeWindow = sessionTime >= twoHoursFromNow && sessionTime <= threeHoursFromNow;

      return notSetUp && inTimeWindow;
    });
  },
});

// Get sessions that need cleanup (ended >1 hour ago, not yet cleaned)
export const getSessionsNeedingCleanup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      endTime: v.string(),
      discordChannelId: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      discordSetupComplete: v.optional(v.boolean()),
      discordCleanedUp: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - 1 * 60 * 60 * 1000; // 1 hour ago

    // Get completed or in-progress sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "COMPLETED"),
          q.eq(q.field("status"), "IN_PROGRESS")
        )
      )
      .collect();

    // Filter for sessions that ended >1 hour ago and haven't been cleaned
    return sessions.filter((session) => {
      // Parse end time and add to scheduled date
      const [hours, minutes] = session.endTime.split(":").map(Number);
      const sessionEndTime = session.scheduledDate + (hours * 60 + minutes) * 60 * 1000;

      const hasDiscordResources = session.discordChannelId && session.discordRoleId;
      const notCleaned = !session.discordCleanedUp;
      const pastEndTime = sessionEndTime < oneHourAgo;

      return hasDiscordResources && notCleaned && pastEndTime;
    });
  },
});

// Get guild info for a session
export const getSessionGuildInfo = internalQuery({
  args: { coachId: v.string() },
  returns: v.union(
    v.object({
      guildId: v.string(),
      botToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get coach's store by userId (clerkId)
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.coachId))
      .first();

    if (!store) return null;

    // Get store's Discord guild
    const guild = await ctx.db
      .query("discordGuilds")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .first();

    if (!guild || !guild.isActive) return null;

    return {
      guildId: guild.guildId,
      botToken: guild.botToken,
    };
  },
});

// ==================== MUTATIONS ====================

export const markSessionSetupComplete = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    discordChannelId: v.string(),
    discordRoleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordChannelId: args.discordChannelId,
      discordRoleId: args.discordRoleId,
      discordSetupComplete: true,
    });
    return null;
  },
});

export const markSessionCleanedUp = internalMutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordCleanedUp: true,
    });
    return null;
  },
});

// ==================== HELPER FUNCTIONS ====================

async function setupSessionAccess(ctx: any, session: any) {
  console.log(`⚙️ Setting up session ${session._id}`);

  // Get guild info
  const guildInfo = await ctx.runQuery(
    internal.coachingSessionManager.getSessionGuildInfo,
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
  await ctx.runMutation(internal.coachingSessionManager.markSessionSetupComplete, {
    sessionId: session._id,
    discordChannelId: channelResult.channelId,
    discordRoleId: roleResult.roleId,
  });

  console.log(`✅ Session ${session._id} setup complete`);
}

async function cleanupSessionAccess(ctx: any, session: any) {
  console.log(`🧹 Cleaning up session ${session._id}`);

  if (!session.discordChannelId || !session.discordRoleId) {
    console.log("No Discord resources to clean");
    return;
  }

  // Get guild info
  const guildInfo = await ctx.runQuery(
    internal.coachingSessionManager.getSessionGuildInfo,
    { coachId: session.coachId }
  );

  if (!guildInfo) {
    console.error("No guild info found for cleanup");
    return;
  }

  // Delete channel
  try {
    await deleteChannel(guildInfo.guildId, guildInfo.botToken, session.discordChannelId);
    console.log(`Deleted channel ${session.discordChannelId}`);
  } catch (error) {
    console.error("Error deleting channel:", error);
  }

  // Delete role
  try {
    await deleteRole(guildInfo.guildId, guildInfo.botToken, session.discordRoleId);
    console.log(`Deleted role ${session.discordRoleId}`);
  } catch (error) {
    console.error("Error deleting role:", error);
  }

  // Mark as cleaned up
  await ctx.runMutation(internal.coachingSessionManager.markSessionCleanedUp, {
    sessionId: session._id,
  });

  console.log(`✅ Session ${session._id} cleaned up`);
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
    return { success: true, roleId: role.id };
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
    return { success: true, channelId: channel.id };
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

