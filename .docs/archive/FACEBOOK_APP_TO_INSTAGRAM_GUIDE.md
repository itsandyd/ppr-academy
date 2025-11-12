# Using Your Existing Facebook App for Instagram DM Automation

## ✅ Good News: You Can Use Your Facebook App!

Instagram and Facebook are both Meta products. You use the **SAME App ID and Secret** for both.

---

## 🔧 Quick Setup (3 Steps)

### **Step 1: Add Instagram Product to Your Facebook App**

1. Go to: https://developers.facebook.com/apps
2. Click on your existing Facebook app
3. Scroll down to **"Add Products"**
4. Find **"Instagram"** → Click **"Set Up"**
5. That's it! Your Facebook app now supports Instagram API

### **Step 2: Add to `.env.local`**

Use your **existing Facebook credentials**:

```bash
# Use your EXISTING Facebook App credentials
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# New variables for Instagram
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (if you have it)
OPENAI_API_KEY=sk-proj-your_key_here
```

**Example:**

```bash
# If you have:
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456ghi789

# Use the SAME values:
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123456789012345
INSTAGRAM_CLIENT_SECRET=abc123def456ghi789
```

### **Step 3: Configure OAuth Redirect URI**

In your Facebook App Dashboard:

1. Go to **Instagram → Basic Display** (or **Instagram Graph API**)
2. Find **"Valid OAuth Redirect URIs"**
3. Add:
   ```
   http://localhost:3000/auth/instagram/callback
   ```
4. Add your production URL too:
   ```
   https://your-production-domain.com/auth/instagram/callback
   ```
5. Click **"Save Changes"**

### **Step 4: Restart Dev Server**

```bash
npm run dev
```

---

## 🎯 Test It Works

1. Go to: `http://localhost:3000/store/[your-store-id]/social`
2. Click **"DM Automation"** tab
3. Click **"Connect Instagram Account"**
4. Should redirect to Instagram OAuth ✅

---

## 📋 Complete Environment Variables

Here's what your `.env.local` should look like:

```bash
# ============================================
# Meta (Facebook + Instagram use SAME app)
# ============================================

# Use your EXISTING Facebook App credentials:
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123456789012345
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# New Instagram-specific variables:
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# ============================================
# AI Features
# ============================================

OPENAI_API_KEY=sk-proj-xxxxx

# ============================================
# Existing PPR Academy Variables
# ============================================

# Convex
CONVEX_DEPLOYMENT=fastidious-snake-859
NEXT_PUBLIC_CONVEX_URL=https://fastidious-snake-859.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# ... all your other existing variables
```

---

## 🔑 Key Points

### **1. Same App, Different Products**

```
Your Facebook App
├── Facebook Product ✅ (you already have this)
├── Instagram Product ⚡ (add this - it's free!)
└── Uses SAME App ID and Secret
```

### **2. Instagram Product Setup**

In your Facebook App dashboard:

1. Click **"Add Products"**
2. Find **Instagram** section
3. Two options:
   - **Instagram Basic Display** (simpler, good for testing)
   - **Instagram Graph API** (more powerful, production use)
4. Click **"Set Up"** on either one
5. Configure OAuth redirect URIs
6. Done! ✅

### **3. Required Instagram Account Type**

Your Instagram account must be:
- ✅ **Business** or **Creator** account (not personal)
- ✅ Linked to a **Facebook Page**
- ✅ **Public** (not private)

**To convert:**
- Instagram app → Settings → Account
- → Switch to Professional Account
- → Choose Business or Creator

**To link to Facebook Page:**
- Instagram → Settings → Account
- → Linked accounts → Facebook
- → Connect to Facebook Page (create one if needed)

---

## 🧪 Quick Test

After adding env vars and restarting:

```bash
# Open browser console (F12)
# Navigate to: /store/[storeId]/social → DM Automation tab
# Click "Connect Instagram Account"

# You should see in console:
🔗 Redirecting to Instagram OAuth: https://www.instagram.com/oauth/authorize?client_id=123456789012345&redirect_uri=...

# If you see error:
❌ Missing NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
→ Check: Env var is added
→ Check: Dev server was restarted
→ Check: Hard refresh browser (Cmd+Shift+R)
```

---

## 🎬 Complete Flow

```
1. Add Instagram product to your Facebook app (one-time)
2. Copy App ID → NEXT_PUBLIC_INSTAGRAM_CLIENT_ID in .env.local
3. Copy App Secret → INSTAGRAM_CLIENT_SECRET in .env.local
4. Add OAuth redirect URI: http://localhost:3000/auth/instagram/callback
5. Restart dev server
6. Click "Connect Instagram Account" → Works! ✅
7. Log in with Instagram Business account
8. Grant permissions
9. Redirect to callback → Token saved
10. Create automation → Test it → Launch! 🚀
```

---

## ⚡ Super Quick Copy-Paste

**If you have Facebook App ID: `123456789012345` and Secret: `abc123def456`**

Add to `.env.local`:

```bash
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123456789012345
INSTAGRAM_CLIENT_SECRET=abc123def456ghi789
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token
```

Then:

```bash
npm run dev
```

**Done!** Button should now work. 🎉

---

## 📝 Summary

**Question:** "I have Facebook app ID and secret, is what I need different?"

**Answer:** Nope! Use the SAME credentials. Just:
1. Add Instagram product to your Facebook app
2. Use Facebook App ID as `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID`
3. Use Facebook App Secret as `INSTAGRAM_CLIENT_SECRET`
4. That's it!

**Meta made it simple:** One app, multiple products (Facebook, Instagram, WhatsApp, etc.)

---

**Next:** Add the env vars with your existing Facebook credentials and restart! The button will work. 🚀

