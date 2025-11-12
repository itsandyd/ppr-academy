# Node.js Actions Fix

## Problem
Convex deployment was failing with these errors:
1. `bookCoachingSession` defined in `coachingProducts.js` is a Mutation function. Only actions can be defined in Node.js.
2. `getSessionGuildInfo` defined in `coachingSessionManager.js` is a Query function. Only actions can be defined in Node.js.

## Root Cause
Two files had `"use node"` at the top, which tells Convex that ALL functions in the file should run in the Node.js runtime. However:
- ❌ **Queries** and **Mutations** cannot use Node.js runtime
- ✅ **Actions** CAN use Node.js runtime

The files contained a mix of queries, mutations, and actions.

## Solution
Split the files to separate queries/mutations from actions:

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

### 3. `convex/coachingSessionQueries.ts` (NO "use node")
Contains session management queries and mutations:
- ✅ `getSessionsNeedingSetup` (internal query)
- ✅ `getSessionsNeedingCleanup` (internal query)
- ✅ `getSessionGuildInfo` (internal query)
- ✅ `markSessionSetupComplete` (internal mutation)
- ✅ `markSessionCleanedUp` (internal mutation)

### 4. `convex/coachingSessionManager.ts` (WITH "use node")
Contains only the cron action:
- ✅ `manageCoachingSessions` (internal action)
- ✅ Helper functions:
  - `setupSessionAccess()` - uses `fetch()`
  - `cleanupSessionAccess()` - uses `fetch()`
  - Discord API helpers

## Changes Made

### File Structure
```
convex/
├── coachingProducts.ts          ← Queries & Mutations (no Node.js)
├── coachingDiscordActions.ts    ← Discord setup/cleanup actions (Node.js)
├── coachingSessionQueries.ts    ← Session queries & mutations (no Node.js)
└── coachingSessionManager.ts    ← Cron action only (Node.js)
```

### Updated References

**In `coachingProducts.ts`:**
```typescript
// OLD:
internal.coachingProducts.setupDiscordForSession

// NEW:
internal.coachingDiscordActions.setupDiscordForSession
```

**In `coachingSessionManager.ts`:**
```typescript
// OLD:
internal.coachingSessionManager.getSessionsNeedingSetup
internal.coachingSessionManager.getSessionsNeedingCleanup
internal.coachingSessionManager.getSessionGuildInfo
internal.coachingSessionManager.markSessionSetupComplete
internal.coachingSessionManager.markSessionCleanedUp

// NEW:
internal.coachingSessionQueries.getSessionsNeedingSetup
internal.coachingSessionQueries.getSessionsNeedingCleanup
internal.coachingSessionQueries.getSessionGuildInfo
internal.coachingSessionQueries.markSessionSetupComplete
internal.coachingSessionQueries.markSessionCleanedUp
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
1. ✅ Created `convex/coachingDiscordActions.ts` - Discord setup/cleanup actions
2. ✅ Created `convex/coachingSessionQueries.ts` - Session queries & mutations
3. ✅ Updated `convex/coachingProducts.ts` - Removed "use node", removed actions
4. ✅ Updated `convex/coachingSessionManager.ts` - Removed queries/mutations, updated references

