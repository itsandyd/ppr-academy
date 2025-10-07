import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Discord Integration Schema
export const discordSchema = {
  // Link between PPR Academy users and Discord accounts
  discordIntegrations: defineTable({
    userId: v.string(), // Clerk user ID
    discordUserId: v.string(), // Discord user ID
    discordUsername: v.string(), // Discord username for display
    discordDiscriminator: v.optional(v.string()), // Discord #tag (deprecated but some have it)
    discordAvatar: v.optional(v.string()), // Discord avatar URL
    accessToken: v.string(), // Discord OAuth access token (encrypted)
    refreshToken: v.string(), // Discord OAuth refresh token (encrypted)
    expiresAt: v.number(), // Token expiration timestamp
    enrolledCourseIds: v.array(v.id("courses")), // Courses user is enrolled in
    assignedRoles: v.array(v.string()), // Discord role IDs assigned to user
    guildMemberStatus: v.optional(v.union(
      v.literal("invited"),
      v.literal("joined"),
      v.literal("left"),
      v.literal("kicked"),
      v.literal("banned")
    )),
    lastSyncedAt: v.number(), // Last time roles were synced
    connectedAt: v.number(), // When user connected Discord
  })
    .index("by_userId", ["userId"])
    .index("by_discordUserId", ["discordUserId"])
    .index("by_lastSynced", ["lastSyncedAt"]),

  // Discord server/guild configuration per store
  discordGuilds: defineTable({
    storeId: v.id("stores"), // Which store this Discord server belongs to
    guildId: v.string(), // Discord server/guild ID
    guildName: v.string(), // Discord server name
    inviteCode: v.optional(v.string()), // Permanent invite code
    botToken: v.string(), // Bot token for this server (encrypted)
    
    // Role mapping (courseId -> Discord role ID)
    courseRoles: v.optional(v.record(v.string(), v.string())), // { "courseId": "roleId" }
    
    // General roles
    generalMemberRole: v.optional(v.string()), // Role for all members
    creatorRole: v.optional(v.string()), // Role for course creator
    
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_guildId", ["guildId"]),

  // Discord webhook events (for tracking)
  discordEvents: defineTable({
    eventType: v.union(
      v.literal("member_joined"),
      v.literal("member_left"),
      v.literal("role_assigned"),
      v.literal("role_removed"),
      v.literal("invite_created"),
      v.literal("sync_completed")
    ),
    userId: v.optional(v.string()), // Clerk user ID
    discordUserId: v.optional(v.string()), // Discord user ID
    guildId: v.string(),
    metadata: v.optional(v.any()), // Additional event data
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventType", ["eventType"])
    .index("by_timestamp", ["timestamp"]),
};

