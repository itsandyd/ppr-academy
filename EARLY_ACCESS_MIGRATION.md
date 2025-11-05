# Migration Guide: Existing Stores to Early Access Plan

## Overview
This guide explains how to migrate existing stores that don't have a plan set to the new `early_access` plan.

## Automatic Migration

The system is already set up to automatically migrate stores:

### 1. **New Stores**
All new stores created through `createStore` mutation will automatically get `plan: "early_access"`.

### 2. **Existing Stores Without a Plan**
The `initializeStorePlan` mutation will set any store without a plan to `early_access`:

```typescript
// Called when a store is accessed and has no plan
await ctx.runMutation(api.creatorPlans.initializeStorePlan, {
  storeId: storeId
});
```

### 3. **Existing Stores With Plans**
Stores that already have a plan (free, creator, creator_pro) will **NOT** be changed. This preserves:
- Users who are paying for Creator or Creator Pro
- Users who explicitly chose the Free plan
- Historical plan data

## Manual Migration (If Needed)

If you want to manually migrate all existing stores without a plan to `early_access`, you can run this Convex function:

### Create Migration Function

Create `convex/migrations/migrateToEarlyAccess.ts`:

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const migrateExistingStoresToEarlyAccess = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    migrated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    let migrated = 0;
    let skipped = 0;

    // Get all stores
    const allStores = await ctx.db.query("stores").collect();

    for (const store of allStores) {
      // Only migrate stores without a plan or with undefined plan
      if (!store.plan) {
        await ctx.db.patch(store._id, {
          plan: "early_access",
          planStartedAt: Date.now(),
          isPublic: false,
          isPublishedProfile: false,
          subscriptionStatus: "active",
        });
        migrated++;
      } else {
        skipped++;
      }
    }

    return {
      success: true,
      migrated,
      skipped,
    };
  },
});
```

### Run Migration

From your terminal:

```bash
# Run the migration
npx convex run migrations/migrateToEarlyAccess:migrateExistingStoresToEarlyAccess

# Output will show:
# {
#   "success": true,
#   "migrated": 5,    // Number of stores migrated to early_access
#   "skipped": 2      // Number of stores that already had a plan
# }
```

## What About Stores That Already Have a Plan?

### Free Plan Users
- **Status:** Remain on `free` plan
- **Why:** They explicitly chose or were assigned the free tier
- **Action:** They can upgrade to paid plans if they want
- **Alternative:** If you want to upgrade all free users to early_access, modify the migration to include `store.plan === "free"`

### Creator/Creator Pro Users
- **Status:** Remain on their paid plan
- **Why:** They are paying customers
- **Action:** DO NOT migrate them to early_access
- **Important:** This preserves your revenue and existing subscriptions

## Verification

After migration, verify the changes:

```bash
# Check all store plans in your database
# Go to Convex Dashboard > Data > stores
# Look at the "plan" field for each store

# Expected results:
# - New stores: "early_access"
# - Migrated stores: "early_access"
# - Existing paid users: "creator" or "creator_pro"
# - Existing free users: "free" (unless manually migrated)
```

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Identifying which stores were migrated (look for `planStartedAt` timestamp)
2. Restoring their original plan values from a backup
3. Or setting them back to `"free"` manually

## Recommendation

**DO NOT** run a manual migration unless you have a specific reason. The automatic system will handle new stores and stores without plans gracefully through the `initializeStorePlan` mutation when they're accessed.

## Future Considerations

### When You Want to Start Charging New Users

1. **Change Default Plan:**
   ```typescript
   // In convex/stores.ts, change:
   plan: "early_access",  // Current
   
   // To:
   plan: "free",  // New default for paid system
   ```

2. **Keep Early Access Users Grandfathered:**
   - Don't change existing `early_access` users
   - They remain unlimited forever
   - Good for brand loyalty and early supporter recognition

3. **Communicate Changes:**
   - Email early_access users thanking them
   - Announce new pricing for new users
   - Emphasize the "grandfathered" benefit

