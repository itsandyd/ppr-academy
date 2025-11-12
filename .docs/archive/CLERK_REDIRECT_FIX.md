# Clerk Sign-Up Redirect Fix

## Issue
After signing up from the storefront CTA, users are being redirected to `/library` instead of `/home` (creator dashboard).

## Root Cause
Clerk environment variables in `.env.local` may be overriding the `fallbackRedirectUrl` prop in the SignUp component.

## Solution

### Check Your `.env.local` File

Look for these environment variables:
```bash
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/library  # ❌ This might be set
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/library  # ❌ This might be set
```

### Update Environment Variables

**Option 1: Remove the environment variables** (Recommended)
```bash
# Comment out or remove these lines from .env.local:
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/library
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/library
```

This allows the `fallbackRedirectUrl` prop in our code to work correctly.

**Option 2: Keep them but set to creator dashboard**
```bash
# Set these in .env.local:
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
```

⚠️ **Note:** Option 2 will redirect ALL users to `/home` after sign-up, even students. Option 1 is better because it respects the `intent=creator` parameter.

## How It Works Now

1. **Storefront CTA** → `/sign-up?intent=creator`
2. **Sign-Up Page** reads `intent=creator` parameter
3. **Sets fallbackRedirectUrl**:
   - If `intent=creator` → `/home` (creator dashboard)
   - Otherwise → `/library` (student view)
4. **After sign-up** → Redirects based on intent

## Code Changes Made

### `/app/[slug]/page.tsx`
```typescript
const handleStartStorefront = () => {
  router.push('/sign-up?intent=creator'); // ✅ Added intent parameter
};
```

### `/app/sign-up/[[...sign-up]]/page.tsx`
```typescript
<SignUp 
  fallbackRedirectUrl={params.redirect_url || (isCreator ? "/home" : "/library")}
  // ... other props
/>
```

## Testing

1. Clear your browser cache/cookies
2. Go to any storefront page
3. Click "Get Started Free"
4. Complete sign-up
5. Should redirect to `/home` (creator dashboard)

## Priority of Redirects (Clerk)

Clerk follows this priority order:
1. ✅ **`redirect_url` query parameter** (highest priority)
2. ✅ **Environment variables** (`NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`)
3. ✅ **Component prop** (`fallbackRedirectUrl`)
4. ❌ **Clerk Dashboard settings** (lowest priority)

**To make our dynamic routing work, remove the environment variables from `.env.local`!**

## Quick Fix Command

```bash
# Open your .env.local file and remove or comment out:
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
```

Then restart your dev server:
```bash
npm run dev
```

