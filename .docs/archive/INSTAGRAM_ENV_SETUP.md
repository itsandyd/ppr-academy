# Instagram OAuth - Environment Variables Setup

## 🔴 IMPORTANT: Required to Make "Connect Instagram" Button Work

The button currently does nothing because `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID` is missing.

---

## ✅ Quick Fix (Copy & Paste)

### **Step 1: Add to `.env.local`**

Open your `.env.local` file and add these variables:

```bash
# ============================================
# Instagram DM Automation (REQUIRED)
# ============================================

# Instagram OAuth (PUBLIC - used in browser)
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=paste_your_app_id_here

# Instagram API (SERVER - used in Convex)
INSTAGRAM_CLIENT_SECRET=paste_your_app_secret_here
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (for Smart AI)
OPENAI_API_KEY=sk-proj-paste_your_key_here
```

### **Step 2: Get Your Instagram App ID**

**Don't have a Meta App yet?** Follow this:

1. Go to: https://developers.facebook.com/apps/create
2. Click **"Create App"**
3. Select type: **"Business"**
4. App name: `PPR Academy Automations`
5. Click **"Create App"**

**App created?** Get your credentials:

1. In your app dashboard, click **"Settings"** → **"Basic"**
2. Copy **"App ID"** → Paste as `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID`
3. Click **"Show"** next to App Secret → Paste as `INSTAGRAM_CLIENT_SECRET`

### **Step 3: Add Instagram Product**

Still in Meta App Dashboard:

1. Scroll down to **"Add Products"**
2. Find **"Instagram"** → Click **"Set Up"**
3. You'll be taken to Instagram configuration

### **Step 4: Configure OAuth Redirect**

In Instagram Basic Display settings:

1. Find **"Valid OAuth Redirect URIs"**
2. Click **"Add URI"**
3. Add: `http://localhost:3000/auth/instagram/callback`
4. If you have production URL, add: `https://your-domain.com/auth/instagram/callback`
5. Click **"Save Changes"**

### **Step 5: Restart Dev Server**

```bash
# In your terminal, kill the server (Ctrl+C)
npm run dev

# Or if using bun:
bun run dev
```

---

## 🧪 Test It Works

### **Step 1: Open Social Page**

```
http://localhost:3000/store/[your-store-id]/social
```

### **Step 2: Click DM Automation Tab**

### **Step 3: Click "Connect Instagram Account"**

**Expected behavior:**

1. ✅ Browser console shows:
   ```
   🔗 Redirecting to Instagram OAuth: https://www.instagram.com/oauth/authorize?client_id=...
   ```

2. ✅ Redirects to Instagram login page

3. ✅ Shows permissions screen:
   ```
   [App Name] wants to:
   - View your basic Instagram info
   - Manage your messages
   - Manage comments
   [Allow] [Cancel]
   ```

4. ✅ Click "Allow" → Redirects to `/auth/instagram/callback?code=...`

5. ✅ Shows "Connecting Instagram..." spinner

6. ✅ After 2 seconds: "Successfully Connected!"

7. ✅ Redirects back to social page

**If it does nothing:**
- ❌ Check browser console for error
- ❌ Verify `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID` is in `.env.local`
- ❌ Verify you restarted dev server after adding env vars

---

## 🔍 Debugging Checklist

### **Issue: Button does nothing**

```bash
# Check 1: Environment variable exists
echo $NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
# Should output your app ID

# Check 2: Restart dev server
# Ctrl+C to kill
npm run dev

# Check 3: Browser console
# F12 → Console tab
# Click button → Look for errors
```

### **Issue: "Instagram OAuth not configured" toast**

**Cause:** `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID` is undefined

**Fix:**
1. Add to `.env.local` (with `NEXT_PUBLIC_` prefix!)
2. Restart dev server
3. Hard refresh browser (Cmd+Shift+R)

### **Issue: Redirects to Instagram but shows error**

**Possible causes:**

1. **Redirect URI mismatch**
   - Fix: Add exact callback URL to Meta App OAuth settings
   - Must match: `http://localhost:3000/auth/instagram/callback`

2. **App not set up correctly**
   - Fix: Add Instagram product to Meta App
   - Make sure app is in "Development" or "Live" mode

3. **Invalid App ID**
   - Fix: Double-check App ID from Meta Dashboard
   - Copy-paste carefully (no extra spaces)

---

## 📝 Environment Variable Reference

| Variable | Where to Get It | Used For |
|----------|-----------------|----------|
| `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID` | Meta App → Settings → Basic → App ID | OAuth URL (client-side) |
| `INSTAGRAM_CLIENT_SECRET` | Meta App → Settings → Basic → App Secret | Token exchange (server) |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | You choose this (e.g., "testing123") | Webhook verification |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Smart AI chatbot |

---

## ⚡ Quick Copy-Paste Setup

**If you already have a Meta App:**

```bash
# Add to .env.local (replace YOUR_VALUES):

NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=YOUR_APP_ID
INSTAGRAM_CLIENT_SECRET=YOUR_APP_SECRET  
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token
OPENAI_API_KEY=YOUR_OPENAI_KEY
```

**Then:**

```bash
# Restart
npm run dev

# Test
# Click "Connect Instagram Account" button
# Should now redirect to Instagram OAuth ✅
```

---

## 🎯 Next Steps After OAuth Works

1. ✅ Connect Instagram (button works)
2. ⏳ Create first automation
3. ⏳ Configure webhook (for receiving Instagram events)
4. ⏳ Test comment automation
5. ⏳ Test DM automation
6. ⏳ Enable Smart AI (Pro plan)
7. ⏳ Deploy to production
8. ⏳ Launch! 🚀

---

**TL;DR:** Add `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_app_id` to `.env.local` and restart your dev server. The button will work!

