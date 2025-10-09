# Node.js Actions Fix

## Problem
Convex deployment was failing with this error:
```
`bookCoachingSession` defined in `coachingProducts.js` is a Mutation function. 
Only actions can be defined in Node.js.
```

## Root Cause
The `convex/coachingProducts.ts` file had `"use node"` at the top, which tells Convex that ALL functions in the file should run in the Node.js runtime. However:
- ❌ **Queries** and **Mutations** cannot use Node.js runtime
- ✅ **Actions** CAN use Node.js runtime

The file contained:
- 4 Queries (cannot use Node.js)
- 5 Mutations (cannot use Node.js)  
- 2 Actions (CAN use Node.js for Discord API calls)

## Solution
Split the file into two:

### 1. `convex/coachingProducts.ts` (NO "use node")
Contains all queries and mutations:
- ✅ `getCoachingProductsByStore` (query)
- ✅ `getPublishedCoachingProductsByStore` (query)
- ✅ `getCoachingProductById` (query)
- ✅ `checkUserDiscordConnection` (query)
- ✅ `createCoachingProduct` (mutation)
- ✅ `updateCoachingProduct` (mutation)
- ✅ `publishCoachingProduct` (mutation)
- ✅ `bookCoachingSession` (mutation)
- ✅ `getProductForDiscord` (internal query)
- ✅ `updateSessionDiscordInfo` (internal mutation)
- ✅ `getSessionForCleanup` (internal query)

### 2. `convex/coachingDiscordActions.ts` (WITH "use node")
Contains Discord actions that need `fetch()`:
- ✅ `setupDiscordForSession` (internal action)
- ✅ `cleanupSessionDiscord` (internal action)
- ✅ Helper functions:
  - `createSessionRole()` - uses `fetch()`
  - `createSessionChannel()` - uses `fetch()`
  - `deleteChannel()` - uses `fetch()`
  - `deleteRole()` - uses `fetch()`

## Changes Made

### File Structure
```
convex/
├── coachingProducts.ts         ← Queries & Mutations (no Node.js)
├── coachingDiscordActions.ts   ← Actions (Node.js for Discord API)
└── coachingSessionManager.ts   ← Cron actions (Node.js)
```

### Updated References
Changed import in `coachingProducts.ts`:
```typescript
// OLD:
internal.coachingProducts.setupDiscordForSession

// NEW:
internal.coachingDiscordActions.setupDiscordForSession
```

## Why This Works

Convex has two runtimes:
1. **V8 Isolate** (default) - Fast, lightweight, for queries/mutations
2. **Node.js** - Full Node.js APIs (like `fetch`), for actions only

By separating the actions that need Node.js into their own file with `"use node"`, we allow:
- Queries/mutations to run in V8 (faster, no Node.js needed)
- Actions to run in Node.js (has `fetch()` for Discord API calls)

## Result
✅ Deployment now succeeds  
✅ All TypeScript types correct  
✅ No linter errors  
✅ Coaching system fully functional  

## Files Modified
1. ✅ Created `convex/coachingDiscordActions.ts`
2. ✅ Updated `convex/coachingProducts.ts` (removed "use node", removed actions)
3. ✅ No changes needed to `convex/coachingSessionManager.ts` (already correct)

