"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { encryptToken, isEncrypted } from "./lib/encryption";

/**
 * One-time migration: encrypt all existing plaintext OAuth tokens at rest.
 *
 * Run from the Convex Dashboard:
 *   npx convex run migrateEncryptTokens:encryptExistingTokens
 *
 * Idempotent — skips values that are already encrypted (start with "v1:").
 * Processes records in batches to stay within Convex limits.
 *
 * IMPORTANT: Set OAUTH_ENCRYPTION_KEY in Convex environment variables BEFORE running.
 */
export const encryptExistingTokens = internalAction({
  args: {},
  returns: v.object({
    socialAccounts: v.object({ processed: v.number(), encrypted: v.number(), skipped: v.number() }),
    integrations: v.object({ processed: v.number(), encrypted: v.number(), skipped: v.number() }),
    discordIntegrations: v.object({ processed: v.number(), encrypted: v.number(), skipped: v.number() }),
    discordGuilds: v.object({ processed: v.number(), encrypted: v.number(), skipped: v.number() }),
  }),
  handler: async (ctx) => {
    // 1. Migrate socialAccounts table
    const socialResult = await migrateSocialAccounts(ctx);

    // 2. Migrate legacy integrations table
    const integrationsResult = await migrateIntegrations(ctx);

    // 3. Migrate discordIntegrations table
    const discordResult = await migrateDiscordIntegrations(ctx);

    // 4. Migrate discordGuilds table (botToken)
    const guildResult = await migrateDiscordGuilds(ctx);

    console.log("✅ Migration complete:", {
      socialAccounts: socialResult,
      integrations: integrationsResult,
      discordIntegrations: discordResult,
      discordGuilds: guildResult,
    });

    return {
      socialAccounts: socialResult,
      integrations: integrationsResult,
      discordIntegrations: discordResult,
      discordGuilds: guildResult,
    };
  },
});

async function migrateSocialAccounts(ctx: any) {
  const stats = { processed: 0, encrypted: 0, skipped: 0 };

  const accounts = await ctx.runQuery(
    internal.migrateEncryptTokensHelpers.getAllSocialAccounts
  );

  for (const account of accounts) {
    stats.processed++;
    const updates: Record<string, any> = {};

    // Encrypt accessToken
    if (account.accessToken && !isEncrypted(account.accessToken)) {
      updates.accessToken = encryptToken(account.accessToken);
    }

    // Encrypt refreshToken
    if (account.refreshToken && !isEncrypted(account.refreshToken)) {
      updates.refreshToken = encryptToken(account.refreshToken);
    }

    // Encrypt facebookPageAccessToken inside platformData
    if (
      account.platformData?.facebookPageAccessToken &&
      !isEncrypted(account.platformData.facebookPageAccessToken)
    ) {
      updates.platformData = {
        ...account.platformData,
        facebookPageAccessToken: encryptToken(
          account.platformData.facebookPageAccessToken
        ),
      };
    }

    if (Object.keys(updates).length > 0) {
      await ctx.runMutation(
        internal.migrateEncryptTokensHelpers.patchSocialAccount,
        { id: account._id, updates }
      );
      stats.encrypted++;
    } else {
      stats.skipped++;
    }
  }

  return stats;
}

async function migrateIntegrations(ctx: any) {
  const stats = { processed: 0, encrypted: 0, skipped: 0 };

  const integrations = await ctx.runQuery(
    internal.migrateEncryptTokensHelpers.getAllIntegrations
  );

  for (const integration of integrations) {
    stats.processed++;

    if (integration.token && !isEncrypted(integration.token)) {
      await ctx.runMutation(
        internal.migrateEncryptTokensHelpers.patchIntegration,
        {
          id: integration._id,
          updates: { token: encryptToken(integration.token) },
        }
      );
      stats.encrypted++;
    } else {
      stats.skipped++;
    }
  }

  return stats;
}

async function migrateDiscordIntegrations(ctx: any) {
  const stats = { processed: 0, encrypted: 0, skipped: 0 };

  const connections = await ctx.runQuery(
    internal.migrateEncryptTokensHelpers.getAllDiscordIntegrations
  );

  for (const conn of connections) {
    stats.processed++;
    const updates: Record<string, any> = {};

    if (conn.accessToken && !isEncrypted(conn.accessToken)) {
      updates.accessToken = encryptToken(conn.accessToken);
    }

    if (conn.refreshToken && !isEncrypted(conn.refreshToken)) {
      updates.refreshToken = encryptToken(conn.refreshToken);
    }

    if (Object.keys(updates).length > 0) {
      await ctx.runMutation(
        internal.migrateEncryptTokensHelpers.patchDiscordIntegration,
        { id: conn._id, updates }
      );
      stats.encrypted++;
    } else {
      stats.skipped++;
    }
  }

  return stats;
}

async function migrateDiscordGuilds(ctx: any) {
  const stats = { processed: 0, encrypted: 0, skipped: 0 };

  const guilds = await ctx.runQuery(
    internal.migrateEncryptTokensHelpers.getAllDiscordGuilds
  );

  for (const guild of guilds) {
    stats.processed++;

    if (guild.botToken && !isEncrypted(guild.botToken)) {
      await ctx.runMutation(
        internal.migrateEncryptTokensHelpers.patchDiscordGuild,
        {
          id: guild._id,
          updates: { botToken: encryptToken(guild.botToken) },
        }
      );
      stats.encrypted++;
    } else {
      stats.skipped++;
    }
  }

  return stats;
}
