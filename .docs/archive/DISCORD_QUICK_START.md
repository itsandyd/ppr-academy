# Discord Integration - Quick Start Guide

## 🚨 You're Seeing This Error:
```json
{"client_id": ["Value \"undefined\" is not snowflake."]}
```

**Why?** The Discord environment variables aren't set up yet.

**Fix:** Follow the 5-minute setup below! 👇

---

## ✅ 5-Minute Setup

### Step 1: Create Discord Application (2 min)

1. Go to **https://discord.com/developers/applications**
2. Click the blue **"New Application"** button (top right)
3. Name it **"PPR Academy"** (or your app name)
4. Click **"Create"**
5. ✅ Done! You now have a Discord application

### Step 2: Get Your Client ID & Secret (1 min)

1. In your new Discord application, look at the left sidebar
2. Click **"OAuth2"** → **"General"**
3. You'll see **"CLIENT ID"** - click **"Copy"** and save it somewhere
4. Scroll down to **"CLIENT SECRET"** 
5. Click **"Reset Secret"** button
6. Click **"Yes, do it!"** to confirm
7. Click **"Copy"** to copy your secret (⚠️ you'll only see it once!)
8. ✅ Save both of these - you'll need them in the next step

### Step 3: Add to .env.local (1 min)

1. In your project root, open (or create) `.env.local`
2. Add these lines:

```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=paste_your_client_id_here
DISCORD_CLIENT_ID=paste_your_client_id_here
DISCORD_CLIENT_SECRET=paste_your_client_secret_here
```

**⚠️ IMPORTANT:** 
- Replace `paste_your_client_id_here` with your actual Client ID
- Replace `paste_your_client_secret_here` with your actual Client Secret
- NO quotes needed!
- NO spaces!

**Example:**
```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_ID=1234567890123456789
DISCORD_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 4: Add Redirect URI in Discord (1 min)

1. Back in Discord Developer Portal, still in **"OAuth2" → "General"**
2. Scroll down to **"Redirects"**
3. In the text box, paste:
   ```
   http://localhost:3000/api/auth/discord/callback
   ```
4. Click **"Add"** button
5. Click **"Save Changes"** at the bottom
6. ✅ Done!

### Step 5: Restart Your Dev Server

```bash
# In your terminal, press Ctrl+C to stop the server
# Then restart it:
npm run dev
```

**OR if using Convex:**
```bash
# Press Ctrl+C to stop
npx convex dev
```

---

## 🎉 Test It!

1. Go to **http://localhost:3000/home**
2. Scroll down to the **"Community"** section
3. You should now see the Discord card with a yellow warning gone!
4. Click **"Connect Discord"**
5. You'll be redirected to Discord to authorize
6. Click **"Authorize"**
7. You'll be redirected back and see: **"Connected"** with your Discord info!

✅ **Success!** Your Discord OAuth is now working!

---

## 🤖 Optional: Bot Setup (For Auto-Invites)

The OAuth connection works now, but if you want:
- ✅ Auto-invite users to your Discord server
- ✅ Auto-assign roles based on course purchases

You'll need to set up a Discord bot. See **`DISCORD_SETUP_GUIDE.md`** for full instructions.

**You can skip this for now!** The basic OAuth connection is working.

---

## ❓ Troubleshooting

### Still seeing "client_id is not snowflake"?
1. ✅ Make sure you added the variables to `.env.local` (not `.env`)
2. ✅ Make sure you restarted your dev server
3. ✅ Check for typos in the variable names
4. ✅ Make sure there are no quotes or spaces

### "redirect_uri_mismatch" error?
1. ✅ Go back to Discord Developer Portal
2. ✅ OAuth2 → General → Redirects
3. ✅ Make sure you added: `http://localhost:3000/api/auth/discord/callback`
4. ✅ Click "Save Changes"

### "Invalid client_secret"?
1. ✅ The secret might have been copied wrong
2. ✅ Go back to Discord Portal
3. ✅ Click "Reset Secret" again
4. ✅ Copy the new secret carefully
5. ✅ Update `.env.local`
6. ✅ Restart dev server

### Button says "Setup Required"?
✅ Perfect! That means the app detected that Discord isn't configured yet. Follow the steps above to set it up!

---

## 📚 Full Documentation

- **Detailed Bot Setup**: `DISCORD_SETUP_GUIDE.md`
- **All Environment Variables**: `DISCORD_ENV_VARS.md`
- **Implementation Details**: `DISCORD_IMPLEMENTATION_SUMMARY.md`

---

**Questions?** Let me know! 🚀

