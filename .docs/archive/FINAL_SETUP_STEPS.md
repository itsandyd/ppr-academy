# 🚀 FINAL SETUP - Step by Step

## 🐛 Current Issues Identified:
1. ❌ No Clerk API keys in `.env.local`
2. ❌ No JWT template created in Clerk dashboard  
3. ❌ User already signed in (causing modal error)
4. ❌ Need to restart servers with new environment

## ✅ SOLUTION - Follow These Exact Steps:

### Step 1: Get Clerk Keys
1. Go to: https://dashboard.clerk.com
2. Select your PPR Academy app
3. Navigate to: **"API Keys"**
4. Copy these keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

### Step 2: Update .env.local
Replace the placeholder keys in `.env.local`:
```env
# Replace YOUR_KEY_HERE with actual keys from Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
```

### Step 3: Create JWT Template (CRITICAL!)
1. In Clerk dashboard: **"Configure"** → **"JWT Templates"**
2. Click: **"New template"**
3. **Name**: `convex` (exactly this!)
4. **Leave default settings**
5. Click: **"Save"**

### Step 4: Clear Browser Session
1. Open browser developer tools (F12)
2. Go to **Application** tab → **Storage**
3. Click **"Clear storage"** for localhost
4. OR use incognito/private window

### Step 5: Start Servers
```bash
# Terminal 1
npm run convex:dev

# Terminal 2
npm run dev
```

### Step 6: Test
1. Visit: http://localhost:3001/dashboard/store (or 3002 if port changed)
2. Should see: **"Sign In to Continue"** button
3. Click button → Clerk sign-in
4. Complete sign-in → Should redirect to working dashboard

## 🎯 Expected Success:
- ✅ Clean sign-in flow (no modal errors)
- ✅ User auto-created in Convex after Clerk auth
- ✅ Store dashboard loads with real-time data
- ✅ Can create stores and products

## 🆘 If Still Having Issues:
1. Check browser console for errors
2. Verify Convex dashboard shows functions deployed
3. Confirm JWT template name is exactly `convex`
4. Try different browser or incognito mode

Once these steps are complete, the authentication should work perfectly! 🎉 