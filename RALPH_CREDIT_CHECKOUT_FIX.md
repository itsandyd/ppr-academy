# RALPH: Fix Credit Checkout 500 Error

## Problem Statement
The credit purchase checkout flow is failing with a 500 error. The toast shows "s.map is not a function" which suggests either:
1. The API is returning an unexpected response format
2. The Convex query for packages is failing
3. There's a deployment/caching issue

## Current Error
```
POST https://academy.pauseplayrepeat.com/api/credits/create-checkout-session 500
Checkout error: Error: s.map is not a function
```

## Files to Investigate

### 1. API Route
**File:** `app/api/credits/create-checkout-session/route.ts`
- Check Stripe initialization
- Verify all required env vars are set
- Test the endpoint locally

### 2. Purchase Page
**File:** `app/credits/purchase/page.tsx`
- Line 31: `const packages = useQuery(api.credits.getCreditPackages) || [];`
- Line 121: `packages.map((pkg: any, index: number) => ...`
- If `packages` returns a non-array, `.map()` fails

### 3. Convex Query
**File:** `convex/credits.ts`
- `getCreditPackages` query - verify it returns an array
- Check if CREDIT_PACKAGES constant is correct

## Phase 1: Verify Convex Query Works

### Task 1.1: Check getCreditPackages query
```bash
# In Convex dashboard or locally, test the query
npx convex run credits:getCreditPackages
```

### Task 1.2: Add defensive coding to purchase page
If `packages` could be undefined/null/non-array, add safeguards:
```typescript
const packages = useQuery(api.credits.getCreditPackages);
const safePackages = Array.isArray(packages) ? packages : [];
```

## Phase 2: Test API Endpoint Locally

### Task 2.1: Run locally and test
```bash
npm run dev
```

### Task 2.2: Test with curl
```bash
curl -X POST http://localhost:3000/api/credits/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"packageId":"pro","packageName":"50 Credits","credits":50,"bonusCredits":15,"priceUsd":34.99,"customerEmail":"test@test.com","userId":"test123"}'
```

## Phase 3: Check Environment Variables

### Required env vars for credit checkout:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_APP_URL` - Base URL for success/cancel redirects

### Verify in Vercel:
1. Go to Vercel dashboard
2. Project settings → Environment Variables
3. Confirm `STRIPE_SECRET_KEY` is set for Production

## Phase 4: Add Better Error Handling

### Task 4.1: Update purchase page error handling
The error message should show the actual API error, not a JavaScript error from the response processing.

### Task 4.2: Add loading states
Ensure the page handles loading/error states for the Convex query properly.

## Completion Criteria
- [ ] Credit packages display correctly on /credits/purchase
- [ ] Clicking "Buy" opens Stripe checkout
- [ ] No 500 errors in production
- [ ] Proper error messages shown to user on failure

## Quick Fixes to Try

### Fix 1: Defensive array check in purchase page
```typescript
// Line 31 - change from:
const packages = useQuery(api.credits.getCreditPackages) || [];
// To:
const packagesQuery = useQuery(api.credits.getCreditPackages);
const packages = Array.isArray(packagesQuery) ? packagesQuery : [];
```

### Fix 2: Check Stripe key exists before using
```typescript
// In route.ts, add at the top:
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set!");
}
```

### Fix 3: Verify deployment has latest code
```bash
git log --oneline -5  # Check recent commits
# Then force redeploy in Vercel
```

---
RALPH_COMPLETE when checkout works in production
