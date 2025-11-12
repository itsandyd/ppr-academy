# Discord Integration Setup Guide

Complete guide to set up Discord integration for PPR Academy.

---

## 📋 Prerequisites

- Discord account
- Discord server (guild) created
- Admin access to Discord server
- PPR Academy backend deployed

---

## Part 1: Discord Bot Setup

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it `PPR Academy Bot` (or your choice)
4. Click **"Create"**

### Step 2: Configure Bot

1. In left sidebar, click **"Bot"**
2. Click **"Add Bot"** → **"Yes, do it!"**
3. Under **"Privileged Gateway Intents"**, enable:
   - ✅ **Server Members Intent** (required for adding members)
   - ✅ **Presence Intent** (optional)
   - ✅ **Message Content Intent** (optional)
4. Click **"Save Changes"**

### Step 3: Get Bot Token

1. Under **"TOKEN"**, click **"Reset Token"**
2. **Copy the token** - you'll need this for `.env`
3. ⚠️ **Never share this token publicly!**

### Step 4: Configure OAuth2

1. In left sidebar, click **"OAuth2"** → **"General"**
2. Add redirect URL:
   ```
   http://localhost:3000/api/auth/discord/callback
   ```
   (For production, add your domain)
3. Click **"Save Changes"**

### Step 5: Get Client ID & Secret

1. Still in **"OAuth2"** → **"General"**
2. **Copy Client ID**
3. **Copy Client Secret** (click "Reset Secret" if needed)

### Step 6: Generate Bot Invite Link

1. Go to **"OAuth2"** → **"URL Generator"**
2. Under **"SCOPES"**, select:
   - ✅ `bot`
   - ✅ `identify` (for OAuth)
   - ✅ `guilds.join` (to add users to server)

3. Under **"BOT PERMISSIONS"**, select:
   - ✅ `Manage Roles`
   - ✅ `Manage Channels` (optional)
   - ✅ `Create Instant Invite`
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`

4. **Copy the generated URL**
5. Open URL in browser and add bot to your Discord server

---

## Part 2: Discord Server Setup

### Step 1: Get Server (Guild) ID

1. In Discord app/web, go to **User Settings** → **Advanced**
2. Enable **"Developer Mode"**
3. Right-click your server icon → **"Copy Server ID"**
4. Save this ID for database config

### Step 2: Create Course Roles

For each course you want to integrate:

1. Go to **Server Settings** → **Roles**
2. Click **"Create Role"**
3. Name it: `Course: [Course Name]` (e.g., "Course: Ableton Basics")
4. Set permissions (optional custom ones)
5. Right-click the role → **"Copy Role ID"**
6. Save this ID to map to course in database

### Step 3: Create General Member Role (Optional)

1. Create a role called `PPR Academy Member`
2. Right-click → **"Copy Role ID"**
3. This will be assigned to all users who connect Discord

### Step 4: Organize Bot Role

1. In **Server Settings** → **Roles**
2. Ensure `PPR Academy Bot` role is **above** all course roles
3. Discord roles are hierarchical - bot can only manage roles below it

---

## Part 3: Environment Variables

Add these to your `.env.local`:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_CLIENT_ID="YOUR_CLIENT_ID"
DISCORD_CLIENT_SECRET="YOUR_CLIENT_SECRET"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"

# Discord Server (Guild) Configuration  
DISCORD_GUILD_ID="YOUR_SERVER_ID"

# For production
# DISCORD_REDIRECT_URI="https://yourdomain.com/api/auth/discord/callback"
```

---

## Part 4: Database Configuration

### Add Discord Guild to Database

Use Convex dashboard or create a mutation:

```typescript
// In Convex dashboard, run this mutation:
{
  "storeId": "YOUR_STORE_ID",
  "guildId": "YOUR_GUILD_ID",
  "guildName": "PPR Academy Community",
  "inviteCode": "YOUR_PERMANENT_INVITE_CODE", // Optional
  "botToken": "YOUR_BOT_TOKEN",
  "courseRoles": {
    "COURSE_ID_1": "DISCORD_ROLE_ID_1",
    "COURSE_ID_2": "DISCORD_ROLE_ID_2"
  },
  "generalMemberRole": "MEMBER_ROLE_ID",
  "isActive": true,
  "createdAt": Date.now(),
  "updatedAt": Date.now()
}
```

### Map Courses to Roles

For each course:
1. Get course ID from Convex dashboard
2. Get Discord role ID (from Part 2, Step 2)
3. Add to `courseRoles` object

---

## Part 5: Testing

### Test OAuth Connection

1. Go to your app's settings page
2. Click **"Connect Discord"** button
3. Authorize the app in Discord OAuth popup
4. Verify connection appears in UI

### Test Auto-Invite

1. Enroll in a course (or simulate enrollment)
2. Check if you're automatically added to Discord server
3. Verify you have the correct course role assigned

### Test Role Sync

1. Enroll in multiple courses
2. Run sync function (or wait for automatic sync)
3. Check Discord server - verify all course roles assigned

---

## Part 6: Production Deployment

### Update OAuth Redirect URI

1. In Discord Developer Portal
2. Add production redirect URI:
   ```
   https://yourdomain.com/api/auth/discord/callback
   ```

### Secure Bot Token

1. Never commit bot token to Git
2. Use environment variables in production
3. Consider using secrets manager (Vercel Secrets, AWS Secrets Manager)

### Set Up Webhooks (Optional)

For real-time sync:
1. In Discord server, go to **Server Settings** → **Integrations**
2. Create webhook for events (member join/leave)
3. Point to your Convex HTTP endpoint

---

## 🔧 Troubleshooting

### "Invalid OAuth2 redirect_uri"
- Ensure redirect URI matches exactly in Discord portal
- Check for trailing slashes

### "Missing Access" Error When Adding User
- Ensure bot has `guilds.join` scope
- Bot must be in server before adding users
- Check bot role permissions

### Roles Not Assigning
- Ensure bot role is **above** course roles
- Bot needs `Manage Roles` permission
- Check if role IDs are correct

### User Not Added to Server
- User must complete OAuth flow first
- Check if access token is valid/not expired
- Ensure `guilds.join` scope was granted

---

## 📚 Resources

- [Discord Developer Docs](https://discord.com/developers/docs/intro)
- [Discord OAuth2 Guide](https://discord.com/developers/docs/topics/oauth2)
- [Discord Bot Guide](https://discord.com/developers/docs/topics/gateway)

---

## 🚀 Next Steps After Setup

1. Add "Connect Discord" button to user settings
2. Add "Join Discord Community" CTAs to course pages
3. Implement auto-sync on enrollment
4. Set up periodic role sync (daily/weekly)
5. Add Discord connection status to user dashboard
6. Create onboarding flow for new Discord members

---

*Need help? Check the implementation guide in `/convex/discord.ts`*

