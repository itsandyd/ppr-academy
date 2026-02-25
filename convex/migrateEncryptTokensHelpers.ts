import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// ============================================================================
// Helper queries and mutations for the token encryption migration.
// These run in the default Convex runtime (no Node.js needed).
// Called by migrateEncryptTokens.ts (a "use node" action).
// ============================================================================

// --- Queries to read all records ---

export const getAllSocialAccounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("socialAccounts").collect();
  },
});

export const getAllIntegrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("integrations").collect();
  },
});

export const getAllDiscordIntegrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("discordIntegrations").collect();
  },
});

export const getAllDiscordGuilds = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("discordGuilds").collect();
  },
});

// --- Mutations to patch individual records ---

export const patchSocialAccount = internalMutation({
  args: {
    id: v.id("socialAccounts"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});

export const patchIntegration = internalMutation({
  args: {
    id: v.id("integrations"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});

export const patchDiscordIntegration = internalMutation({
  args: {
    id: v.id("discordIntegrations"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});

export const patchDiscordGuild = internalMutation({
  args: {
    id: v.id("discordGuilds"),
    updates: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.updates);
  },
});
