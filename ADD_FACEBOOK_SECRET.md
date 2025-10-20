# Add Facebook App Secret to Convex

## ✅ What I Just Did

Set these environment variables in Convex:

```bash
✔ NEXT_PUBLIC_APP_URL = https://academy.pauseplayrepeat.com
✔ FACEBOOK_APP_ID = 1952586648637571
```

---

## 🔑 One More Step: Add Your Facebook App Secret

Run this command with YOUR actual Facebook App Secret:

```bash
npx convex env set FACEBOOK_APP_SECRET your_actual_app_secret_here
```

**Where to get your Facebook App Secret:**

1. Go to: https://developers.facebook.com/apps/1952586648637571/settings/basic/
2. Find "App Secret"
3. Click "Show"
4. Copy the secret
5. Run the command above with your actual secret

**Example:**

```bash
# If your secret is: abc123def456ghi789
npx convex env set FACEBOOK_APP_SECRET abc123def456ghi789
```

---

## 🎯 After Adding the Secret

### **Then try the OAuth flow again:**

1. Go to: `/store/[your-store-id]/social` → DM Automation tab
2. Click "Connect Instagram Account"
3. Log in to Facebook
4. Authorize permissions
5. Should now work! ✅

---

## 📋 All Required Convex Environment Variables

For Instagram DM automation, you need these in Convex:

```bash
✅ NEXT_PUBLIC_APP_URL = https://academy.pauseplayrepeat.com
✅ FACEBOOK_APP_ID = 1952586648637571
⏳ FACEBOOK_APP_SECRET = (you need to add this)
⏳ OPENAI_API_KEY = sk-proj-xxx (for Smart AI)
```

**To set them:**

```bash
npx convex env set FACEBOOK_APP_SECRET your_secret
npx convex env set OPENAI_API_KEY sk-proj-your_key
```

---

## 🔍 Check Your Environment Variables

To see what's currently set in Convex:

```bash
npx convex env list
```

---

**TL;DR:** Run `npx convex env set FACEBOOK_APP_SECRET your_actual_secret` then try OAuth again! 🚀

