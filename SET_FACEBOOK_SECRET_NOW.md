# 🔑 Set Facebook App Secret (Required)

## ❌ Current Error

```
Error validating client secret
```

## ✅ What's Missing

Your Convex environment has:

```
✓ FACEBOOK_APP_ID = 1952586648637571
✗ FACEBOOK_APP_SECRET = (not set)
```

---

## 🚀 Fix (30 seconds)

### **Step 1: Get Your Facebook App Secret**

1. Go to: https://developers.facebook.com/apps/1952586648637571/settings/basic/
2. Find **"App Secret"**
3. Click **"Show"**
4. Copy the secret (it's a long string like `abc123def456...`)

### **Step 2: Set in Convex**

Run this command (replace with YOUR actual secret):

```bash
npx convex env set FACEBOOK_APP_SECRET your_actual_app_secret_here
```

**Example:**
```bash
# If your secret is: a1b2c3d4e5f6g7h8i9j0
npx convex env set FACEBOOK_APP_SECRET a1b2c3d4e5f6g7h8i9j0
```

### **Step 3: Verify It's Set**

```bash
npx convex env list | grep FACEBOOK
```

Should show:
```
FACEBOOK_APP_ID=1952586648637571
FACEBOOK_APP_SECRET=your_secret ✓
```

### **Step 4: Try OAuth Again**

1. Go back to: `/store/[storeId]/social` → DM Automation tab
2. Click **"Connect Instagram Account"**
3. Log in and authorize
4. Should now work! ✅

---

## 🔐 Security Note

**NEVER commit your App Secret to git!**

Your `.env.local` file should already be in `.gitignore`. Convex stores secrets securely server-side.

---

## 📋 Complete Environment Checklist

**In Convex (server-side):**

```bash
✓ FACEBOOK_APP_ID = 1952586648637571
⏳ FACEBOOK_APP_SECRET = (add this now!)
✓ NEXT_PUBLIC_APP_URL = https://academy.pauseplayrepeat.com
⏳ OPENAI_API_KEY = sk-proj-xxx (for Smart AI, add later)
```

**In `.env.local` (client-side):**

```bash
NEXT_PUBLIC_FACEBOOK_APP_ID=1952586648637571
NEXT_PUBLIC_APP_URL=https://academy.pauseplayrepeat.com
```

---

**Quick action:** Go to Facebook App dashboard, copy your App Secret, run `npx convex env set FACEBOOK_APP_SECRET your_secret`, then retry! 🚀

