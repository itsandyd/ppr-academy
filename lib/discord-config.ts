/**
 * Discord Server Configuration
 * 
 * Update this file with your actual Discord server details
 */

export const discordConfig = {
  // Your Discord server invite code (the part after discord.gg/)
  // Example: If your invite link is https://discord.gg/abc123, use "abc123"
  inviteCode: process.env.NEXT_PUBLIC_DISCORD_INVITE_CODE || "dX2JNRqpZd",
  
  // Full invite URL
  get inviteUrl() {
    return `https://discord.gg/${this.inviteCode}`;
  },
  
  // Server ID (optional, for API integration)
  serverId: process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || "",
  
  // Bot token (server-side only, never expose to client)
  botToken: process.env.DISCORD_BOT_TOKEN || "",
  
  // Server name
  serverName: "PausePlayRepeat",
  
  // Server description
  serverDescription: "Music production community for creators and students",
};

// Helper function to get invite URL
export function getDiscordInviteUrl(): string {
  return discordConfig.inviteUrl;
}

// Helper function to open Discord invite in new tab
export function openDiscordInvite(): void {
  window.open(discordConfig.inviteUrl, '_blank', 'noopener,noreferrer');
}

