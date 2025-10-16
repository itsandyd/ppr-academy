# 🔧 Discord Link Fix - Setup Guide

## Critical Bug Fixed

**Issue:** Discord invite button was redirecting to wrong server ("Gate2 Online" with 28 members)  
**Solution:** Centralized Discord configuration with environment variables

---

## ✅ What Was Fixed

### 1. Created Central Configuration
**File:** `lib/discord-config.ts`

- Single source of truth for all Discord URLs
- Uses environment variables
- Easy to update across entire app

### 2. Updated Components
- ✅ `components/dashboard/creator-dashboard-content.tsx` - Dashboard widget
- ✅ `components/coaching/DiscordVerificationCard.tsx` - Verification card
- ✅ `components/discord/discord-stats-widget.tsx` - Already using `inviteUrl` prop

### 3. Added Environment Variable Support
**File:** `.env.local.example`

---

## 🚀 How to Set Your Discord Invite Link

### Option 1: Environment Variable (Recommended)

1. **Get Your Discord Invite Link**
   - Go to your Discord server
   - Server Settings → Invites → Create Invite
   - Copy the code after `discord.gg/`
   - Example: If link is `https://discord.gg/pauseplayrepeat`, the code is `pauseplayrepeat`

2. **Create `.env.local` file** (if it doesn't exist):
   ```bash
   touch .env.local
   ```

3. **Add your invite code**:
   ```env
   NEXT_PUBLIC_DISCORD_INVITE_CODE=your-actual-invite-code
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Direct Update

If you don't want to use environment variables, update the default value in:

**File:** `lib/discord-config.ts`

```typescript
export const discordConfig = {
  inviteCode: "your-actual-invite-code", // Change this line
  // ...
};
```

---

## 🧪 Testing the Fix

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Go to `http://localhost:3001/home`
   - Scroll to "Community" section
   - See Discord stats widget

3. **Test the button**:
   - Click "Join Our Discord Community"
   - Should open your correct Discord server in new tab
   - Verify server name and member count match your community

4. **Test in incognito/private browsing**:
   - Ensures no cached redirects
   - Confirms new users see correct server

---

## 📍 Where Discord Links Are Used

All these now use the centralized config:

1. **Dashboard Widget** - Main Discord stats display
2. **Verification Card** - Coaching Discord verification
3. **Discord CTA** - Join Discord call-to-action components

---

## 🔐 Security Note

- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for invite codes)
- `DISCORD_BOT_TOKEN` (without NEXT_PUBLIC prefix) is server-side only (keep secret!)
- Never commit `.env.local` to git (already in `.gitignore`)

---

## 🎯 Recommended Discord Invite Settings

When creating your Discord invite:

1. **Never expire** ✅ (or set to 7 days max)
2. **Unlimited uses** ✅
3. **Temporary membership** ❌ (disabled)
4. **Custom URL** ✅ (e.g., `/pauseplayrepeat` instead of random code)

---

## 📊 Optional: Real Discord Stats Integration

The widget currently shows **mock data**. To show **real stats**:

### Steps to Integrate Discord API:

1. **Create Discord Bot**:
   - Go to https://discord.com/developers/applications
   - Create New Application
   - Bot → Add Bot
   - Copy Bot Token

2. **Add Bot to Server**:
   - OAuth2 → URL Generator
   - Scopes: `bot`
   - Permissions: `Read Messages/View Channels`
   - Visit generated URL to add bot

3. **Add Token to `.env.local`**:
   ```env
   DISCORD_BOT_TOKEN=your-bot-token-here
   NEXT_PUBLIC_DISCORD_SERVER_ID=your-server-id
   ```

4. **Create API Route**:
   ```typescript
   // app/api/discord/stats/route.ts
   import { REST } from '@discordjs/rest';
   import { Routes } from 'discord-api-types/v10';

   export async function GET() {
     const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
     
     try {
       const guild = await rest.get(
         Routes.guild(process.env.NEXT_PUBLIC_DISCORD_SERVER_ID!)
       ) as any;
       
       return Response.json({
         totalMembers: guild.approximate_member_count,
         onlineMembers: guild.approximate_presence_count,
       });
     } catch (error) {
       return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
     }
   }
   ```

5. **Update Widget to Fetch Real Data**:
   ```typescript
   // components/discord/discord-stats-widget.tsx
   const [stats, setStats] = useState(mockData);
   
   useEffect(() => {
     fetch('/api/discord/stats')
       .then(res => res.json())
       .then(data => setStats(data));
   }, []);
   ```

---

## ✅ Verification Checklist

- [ ] Discord invite code added to `.env.local`
- [ ] Dev server restarted
- [ ] Dashboard widget shows correct server stats
- [ ] "Join Discord" button opens correct server
- [ ] Tested in incognito/private browsing
- [ ] Server name matches "PausePlayRepeat Academy"
- [ ] Member count matches your actual Discord server
- [ ] No console errors when clicking Discord links

---

## 🐛 Troubleshooting

### Button still goes to wrong server
- Clear browser cache
- Check `.env.local` file exists and has correct code
- Restart dev server (`Ctrl+C`, then `npm run dev`)
- Try incognito/private browsing

### Environment variable not loading
- Ensure file is named `.env.local` (not `.env.local.txt`)
- Restart dev server after creating/editing `.env.local`
- Check for typos in variable name (`NEXT_PUBLIC_DISCORD_INVITE_CODE`)

### Discord invite doesn't work
- Check invite hasn't expired in Discord server settings
- Ensure invite has unlimited uses
- Try creating a new invite with custom URL

---

## 📝 Summary

**Before Fix:**
- ❌ Hardcoded wrong Discord server URL
- ❌ Scattered across multiple files
- ❌ Hard to update

**After Fix:**
- ✅ Centralized configuration
- ✅ Environment variable support
- ✅ Easy to update in one place
- ✅ Correct server for all users

**Next Steps:**
1. Set your Discord invite code
2. Test the button
3. Optional: Integrate real Discord API stats
4. Monitor join rate and community growth

---

**Questions?** Check `lib/discord-config.ts` for configuration options or create a GitHub issue.

