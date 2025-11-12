# Instagram OAuth Setup - Quick Fix

## 🔴 Issue: "Connect Instagram Account" Button Does Nothing

**Cause:** Missing environment variable `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID`

---

## ✅ Quick Fix (5 minutes)

### **Step 1: Create Meta App**

1. Go to: https://developers.facebook.com/apps
2. Click **"Create App"**
3. Select **"Business"** type
4. Name: "PPR Academy DM Automation"
5. Click **"Create App"**

### **Step 2: Add Instagram Product**

1. In your new app, find **"Instagram"** in products
2. Click **"Set Up"**
3. You'll see **App ID** and **App Secret**

### **Step 3: Add Environment Variables**

Add to your `.env.local` file:

```bash
# Instagram OAuth (Public - safe for client-side)
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_app_id_here

# Instagram API (Server-side only)
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (for Smart AI)
OPENAI_API_KEY=sk-proj-your_key_here

# Convex (should already exist)
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### **Step 4: Configure OAuth Redirect**

In Meta App Dashboard:

1. Go to **Instagram → Basic Settings**
2. Find **"OAuth Redirect URIs"**
3. Add these URLs:
   ```
   http://localhost:3000/auth/instagram/callback
   https://your-production-domain.com/auth/instagram/callback
   ```
4. Click **"Save Changes"**

### **Step 5: Restart Your App**

```bash
# Kill the dev server (Ctrl+C)
# Restart
npm run dev
```

### **Step 6: Test the Button**

1. Go to: `http://localhost:3000/store/[your-store-id]/social`
2. Click **"DM Automation"** tab
3. Click **"Connect Instagram Account"**
4. Should redirect to Instagram OAuth ✅

---

## 🔍 Debugging

**If button still does nothing:**

Open browser console (F12) and check for errors:

```javascript
// You should see:
🔗 Redirecting to Instagram OAuth: https://www.instagram.com/oauth/authorize?client_id=...

// If you see error:
❌ Missing NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
```

**Fix:** Make sure env var name is **exactly** `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID` (with `NEXT_PUBLIC_` prefix)

---

## 📋 Complete .env.local Example

```bash
# ============================================
# Instagram DM Automation
# ============================================

# Instagram OAuth (CLIENT-SIDE - requires NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123456789012345

# Instagram API (SERVER-SIDE - no NEXT_PUBLIC_ prefix)
INSTAGRAM_CLIENT_SECRET=abc123def456
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (for Smart AI chatbot)
OPENAI_API_KEY=sk-proj-xxxxx

# Stripe (for Pro plan subscriptions)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_PLAN_PRICE_ID=price_xxxxx

# Convex (should already be set)
CONVEX_DEPLOYMENT=fastidious-snake-859
NEXT_PUBLIC_CONVEX_URL=https://fastidious-snake-859.convex.cloud

# Clerk (should already be set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ⚠️ Important Notes

### **1. NEXT_PUBLIC_ Prefix**

Variables used in **client-side** code (like the OAuth button) MUST have `NEXT_PUBLIC_` prefix:

```bash
✅ NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=123  # Used in browser
❌ INSTAGRAM_CLIENT_ID=123              # Server-side only
```

### **2. Restart Required**

After adding environment variables, you MUST restart your dev server:

```bash
# Kill server (Ctrl+C)
npm run dev
```

### **3. Instagram Business Account Required**

Your Instagram account must be:
- ✅ Business or Creator account
- ✅ Linked to a Facebook Page
- ✅ Public (not private)

To convert: Instagram → Settings → Account → Switch to Professional Account

---

## 🧪 Test the OAuth Flow

### **Expected Flow:**

1. Click "Connect Instagram Account"
   ```
   → Browser console: "🔗 Redirecting to Instagram OAuth: https://..."
   → Redirects to Instagram login
   ```

2. Log in and authorize
   ```
   → Instagram shows permissions screen
   → Click "Allow"
   ```

3. Redirect back to your app
   ```
   → URL: http://localhost:3000/auth/instagram/callback?code=abc123...
   → Page shows: "Connecting Instagram..."
   → After 2 seconds: "Successfully Connected!"
   → Auto-redirect to social page
   ```

4. Back on social page
   ```
   → Toast notification: "Instagram connected successfully!"
   → DM Automation tab now shows automation list (not connection prompt)
   ```

---

## 🆘 Still Not Working?

### **Check Browser Console:**

Press F12 → Console tab → Look for:

**✅ Success:**
```
🔗 Redirecting to Instagram OAuth: https://www.instagram.com/oauth/authorize?client_id=...
```

**❌ Error:**
```
Missing NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
Instagram OAuth not configured
```

### **Check .env.local:**

```bash
# View your env file
cat .env.local | grep INSTAGRAM

# Should show:
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_app_id
INSTAGRAM_CLIENT_SECRET=your_secret
```

### **Check Meta App Dashboard:**

1. Go to: https://developers.facebook.com/apps/[your-app-id]/instagram-basic-display/basic-display/
2. Verify:
   - ✅ Valid OAuth Redirect URIs includes your callback URL
   - ✅ App is not in "Development Mode" restrictions
   - ✅ Instagram product is added

---

## 🚀 After Connection Works

Once Instagram is connected:

1. ✅ Button will redirect to Instagram
2. ✅ User authorizes permissions
3. ✅ Callback page processes OAuth code
4. ✅ Long-lived token (60 days) is saved
5. ✅ Redirects back to social page
6. ✅ "DM Automation" tab shows automation list
7. ✅ "New Automation" button creates automation
8. ✅ Build and activate automations

---

**Quick Action:** Add `NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_app_id` to `.env.local` and restart your dev server!

