# 🚀 Quick Setup: Fix Discord Invite Link

## ⚡ 2-Minute Fix

The Discord button is now centralized. Just add your invite code:

### Step 1: Get Your Discord Invite Code

1. Go to your Discord server
2. Right-click any channel → **Invite People**
3. Create invite with:
   - ✅ Never expire (or 7 days max)
   - ✅ Unlimited uses
4. Copy the link: `https://discord.gg/YOUR-CODE`
5. Save just the code part: `YOUR-CODE`

### Step 2: Add to Environment Variables

Create or update `.env.local` in your project root:

```env
# Discord Configuration
NEXT_PUBLIC_DISCORD_INVITE_CODE=YOUR-CODE
```

**Example:**
If your invite is `https://discord.gg/pauseplayrepeat`, add:
```env
NEXT_PUBLIC_DISCORD_INVITE_CODE=pauseplayrepeat
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test

1. Go to `http://localhost:3001/home`
2. Scroll to Community section
3. Click "Join Our Discord Community"
4. Should open YOUR server (not Gate2 Online)

---

## ✅ That's It!

All Discord links across the app now use this central config.

**Files auto-updated:**
- Dashboard Discord widget
- Coaching verification card
- Any future Discord components

---

## 🔍 Where to Update (If Not Using .env)

If you prefer to skip environment variables, edit:

**File:** `lib/discord-config.ts`

```typescript
export const discordConfig = {
  inviteCode: "your-actual-code-here", // ← Change this
  serverName: "PausePlayRepeat Academy",
};
```

Then restart your dev server.

---

**Need help?** Check `DISCORD_SETUP_FIX.md` for detailed guide.

