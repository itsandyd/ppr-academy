# 🔧 Clerk + Convex Setup (Legacy Integration)

## ✅ Current Status
- ✅ Convex client setup complete
- ✅ ConvexProviderWithClerk configured  
- ✅ Store components updated
- ✅ Auth flow implemented

## 🔑 Required Environment Variables

Add these to your `.env.local` file:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://peaceful-monitor-895.convex.cloud

# Clerk Authentication  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard/store
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/store
```

## 🎯 CRITICAL: Create JWT Template

This is **MANDATORY** for Convex-Clerk integration:

### Step 1: Access Clerk Dashboard
1. Go to: https://dashboard.clerk.com
2. Select your PPR Academy app

### Step 2: Create JWT Template
1. Navigate to: **Configure** → **JWT Templates**
2. Click: **New template**
3. **Name**: `convex` (exactly this name)
4. **Default settings** are fine
5. Click: **Save**

### Step 3: Get Your Clerk Keys
1. In Clerk dashboard: **API Keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## 🚀 Testing

### Start Both Servers:
```bash
# Terminal 1 - Convex
npm run convex:dev

# Terminal 2 - Next.js  
npm run dev
```

### Test Flow:
1. Visit: http://localhost:3001/dashboard/store
2. Should see **"Sign In to Continue"** button
3. Click sign in → Clerk authentication
4. After sign in → Redirects to store dashboard
5. User automatically created in Convex
6. Store interface loads with real-time data

## 🐛 Troubleshooting

### "No JWT template exists with name: convex"
- ✅ Create JWT template named exactly `convex` in Clerk dashboard

### "Failed to authenticate"
- ✅ Check CLERK_SECRET_KEY in .env.local
- ✅ Restart both dev servers

### 404 on /dashboard/store
- ✅ Check middleware.ts includes dashboard routes
- ✅ Verify file exists at app/(dashboard)/store/page.tsx

### Store shows loading forever
- ✅ Check browser console for errors
- ✅ Verify Convex URL is correct
- ✅ Check Convex dashboard for function errors

## 📁 File Structure
```
convex/
├── users.ts          ✅ User CRUD functions
├── stores.ts         ✅ Store CRUD functions  
├── digitalProducts.ts ✅ Product CRUD functions
└── schema.ts         ✅ Database schema

app/
├── (dashboard)/store/page.tsx    ✅ Main store interface
├── sign-in/[[...sign-in]]/page.tsx ✅ Clerk sign-in
└── sign-up/[[...sign-up]]/page.tsx ✅ Clerk sign-up

lib/
└── convex-provider.tsx ✅ ConvexProviderWithClerk
```

## ✨ What's Working
- 🔐 Clerk authentication with custom pages
- 📊 Real-time data with Convex useQuery/useMutation
- 🏪 Store creation and management
- 📱 Product CRUD operations
- 🎨 Live phone preview
- 👤 Automatic user creation from Clerk → Convex

Once you add your Clerk keys and create the JWT template, everything should work perfectly! 🎉 