# Discord Integration - Environment Variables

Add these to your `.env.local` file:

```env
# Discord Application Credentials
# Get these from: https://discord.com/developers/applications
DISCORD_CLIENT_ID="your_discord_client_id_here"
DISCORD_CLIENT_SECRET="your_discord_client_secret_here"
DISCORD_BOT_TOKEN="your_discord_bot_token_here"

# Discord OAuth Redirect URI
# Development
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"
# Production (uncomment and update):
# DISCORD_REDIRECT_URI="https://yourdomain.com/api/auth/discord/callback"

# Discord Server (Guild) Configuration
DISCORD_GUILD_ID="your_discord_server_id_here"

# Public env vars (exposed to client)
NEXT_PUBLIC_DISCORD_CLIENT_ID="your_discord_client_id_here"
```

## How to Get These Values

Follow the **Discord Setup Guide** (`DISCORD_SETUP_GUIDE.md`) to obtain:
1. Client ID & Secret from Discord Developer Portal
2. Bot Token from Bot page
3. Guild ID from your Discord server (enable Developer Mode first)

