# Fix: "Invalid platform app" Error

## 🔴 Error Message

```
Invalid Request: Request parameters are invalid: Invalid platform app
```

## 🎯 Root Cause

Your Facebook app exists, but Instagram OAuth isn't configured correctly. For Instagram **Business** accounts (which you need for DM automation), you must use **Facebook Login**, not Instagram Basic Display.

---

## ✅ Solution (Already Fixed!)

I've updated the code to use **Facebook Login** instead of Instagram OAuth. This is the correct approach for Instagram Business API.

---

## 🔧 What You Need to Do

### **Step 1: Add Environment Variables**

Add to your `.env.local`:

```bash
# Use your EXISTING Facebook App credentials
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Also add (for backward compatibility):
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# Instagram-specific
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (for Smart AI)
OPENAI_API_KEY=sk-proj-your_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 2: Configure Facebook App**

In your Facebook App dashboard (https://developers.facebook.com/apps/[your-app-id]):

#### **2a. Add Facebook Login Product**

1. Scroll to **"Add Products"**
2. Find **"Facebook Login"** → Click **"Set Up"**
3. Select platform: **"Web"**
4. Site URL: `http://localhost:3000`
5. Click **"Save"**

#### **2b. Configure Valid OAuth Redirect URIs**

1. Go to **Facebook Login → Settings**
2. Find **"Valid OAuth Redirect URIs"**
3. Add:
   ```
   http://localhost:3000/auth/instagram/callback
   https://your-production-domain.com/auth/instagram/callback
   ```
4. Click **"Save Changes"**

#### **2c. Add Instagram Product** (if not already added)

1. Scroll to **"Add Products"**
2. Find **"Instagram"** → Click **"Set Up"**
3. This enables Instagram Graph API access

### **Step 3: Link Instagram to Facebook Page**

**Critical requirement:** Your Instagram account must be linked to a Facebook Page.

**To check/fix:**

1. Go to your **Facebook Page** (not profile)
2. Settings → Linked accounts
3. Connect Instagram
4. Log in with your Instagram Business account
5. Grant permissions

**Or from Instagram:**

1. Instagram app → Settings → Account
2. Linked accounts → Facebook
3. Connect to your Facebook Page

### **Step 4: Restart Dev Server**

```bash
npm run dev
```

---

## 🧪 Test the Fixed Flow

### **Step 1: Click Connect Button**

Navigate to: `/store/[your-store-id]/social` → "DM Automation" tab

Click: **"Connect Instagram Account"**

**Expected:**
```
Browser console:
🔗 Redirecting to Facebook Login (for Instagram permissions): https://www.facebook.com/v21.0/dialog/oauth?client_id=...

Redirects to Facebook (not Instagram!)
```

### **Step 2: Authorize on Facebook**

You'll see:

```
[Your App Name] wants to access:

✓ Public profile
✓ Manage your pages
✓ Instagram account info
✓ Instagram messages
✓ Instagram comments

[Continue as [Your Name]]
```

Click **"Continue"**

### **Step 3: Select Facebook Page**

If you have multiple pages:

```
Which Page do you want to connect?

○ Page 1 (linked to @instagram_account_1)
● Page 2 (linked to @your_music_page) ← Select this
○ Page 3

[Next]
```

Select the page that's linked to your Instagram Business account.

### **Step 4: Callback Processing**

```
URL: /auth/instagram/callback?code=xxx&state=instagram

Page shows:
"Connecting Instagram..."

Backend logs (check Convex dashboard):
✅ Facebook access token obtained
✅ Facebook pages found: 2
✅ Instagram Business account found: 123456789
✅ Instagram account info: { id: "123...", username: "pauseplayrepeat" }
✅ Instagram integration saved

After 2 seconds:
"Successfully Connected!" ✓

Redirects to: /store/[storeId]/social
```

---

## 🎯 Why This Approach Works

### **The Correct Flow:**

```
Facebook Login
    ↓
Get Facebook Pages
    ↓
Get Page Access Token
    ↓
Get Instagram Business Account (linked to page)
    ↓
Use Page Token for Instagram API calls
    ↓
Send DMs, read comments, etc. ✅
```

### **Why Not Instagram OAuth:**

Instagram Basic Display OAuth only works for:
- ❌ Personal Instagram accounts
- ❌ Reading user's own media/profile
- ❌ Cannot send messages or manage comments

Instagram Graph API (what you need) requires:
- ✅ Instagram Business account
- ✅ Linked to Facebook Page
- ✅ Authenticated via Facebook Login
- ✅ Can send messages and manage comments

---

## 📋 Complete Setup Checklist

- [ ] Facebook app exists
- [ ] Instagram product added to Facebook app
- [ ] Facebook Login product added to app
- [ ] OAuth redirect URI configured in Facebook Login settings
- [ ] Instagram account is Business/Creator type
- [ ] Instagram linked to Facebook Page
- [ ] Environment variables added to `.env.local`
- [ ] Dev server restarted
- [ ] Test: Click "Connect Instagram" → Redirects to Facebook ✅

---

## 🐛 Common Errors & Fixes

### **Error: "Invalid platform app"**

**Cause:** Using Instagram OAuth URL instead of Facebook Login

**Fix:** ✅ Already fixed in code! Now uses Facebook Login.

### **Error: "No Facebook pages found"**

**Cause:** Your Facebook account has no pages

**Fix:** Create a Facebook Page
1. Facebook → Pages → Create new page
2. Name: "PausePlayRepeat Music"
3. Category: "Musician/Band"
4. Link your Instagram to this page

### **Error: "No Instagram Business account linked"**

**Cause:** Your Instagram isn't linked to the Facebook Page

**Fix:** 
1. Facebook Page → Settings → Instagram
2. Connect account → Log in with Instagram
3. Or: Instagram app → Settings → Linked accounts → Facebook

### **Error: "Instagram account must be Business account"**

**Cause:** Your Instagram is a personal account

**Fix:**
1. Instagram → Settings → Account
2. Switch to Professional Account
3. Select "Business" or "Creator"

---

## ✅ Environment Variables Summary

**Required (use your existing Facebook app):**

```bash
# Same as your Facebook credentials
NEXT_PUBLIC_FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456

# Also add (for compatibility):
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123456789012345
INSTAGRAM_CLIENT_SECRET=abc123def456

# New ones:
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-xxx
```

---

## 🎬 After It Works

Once connected:

1. ✅ DM Automation tab shows automation list (not connection prompt)
2. ✅ Click "New Automation"
3. ✅ Configure: Trigger (COMMENT/DM) + Keywords + Action
4. ✅ Activate
5. ✅ Test on Instagram
6. ✅ Receive automated DM
7. ✅ Launch! 🚀

---

## 🚀 Quick Action Items

**Right now:**

1. Copy your Facebook App ID → Add as `NEXT_PUBLIC_FACEBOOK_APP_ID` in `.env.local`
2. Copy your Facebook App Secret → Add as `FACEBOOK_APP_SECRET` in `.env.local`
3. Add Facebook Login product to your app (if not already added)
4. Add OAuth redirect URI: `http://localhost:3000/auth/instagram/callback`
5. Restart: `npm run dev`
6. Test: Click "Connect Instagram Account"
7. Should now work! ✅

---

**TL;DR:** The code is fixed to use Facebook Login. Just add your Facebook app credentials to `.env.local` with the variable names above, and it will work!


<function_calls>
<invoke name="search_replace">
<parameter name="file_path">/Users/adysart/Documents/GitHub/ppr-academy/app/(dashboard)/store/[storeId]/social/components/instagram-automations.tsx
