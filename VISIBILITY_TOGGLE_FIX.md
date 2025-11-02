# Profile Visibility Toggle - Fix Summary

## Problem
When toggling the "Make Profile Public" switch in the Plan & Billing section, the change appeared successful (no errors), but upon page refresh, the toggle would revert to "off".

## Root Cause
The component was using local React state (`isPublic`) that was initialized incorrectly and wasn't properly synced with the database. The initial state was based on `planData?.isActive && planData.plan !== "free"` instead of reading the actual `isPublic` field from the store.

## Solution

### 1. Fetch Store Data Directly
Added a query to fetch the actual store data:
```typescript
const storeData = useQuery(api.stores.getStoreById, { storeId });
```

### 2. Read from Database
Changed from local state to reading directly from the database:
```typescript
// OLD: Local state initialized incorrectly
const [isPublic, setIsPublic] = useState(planData?.isActive && planData.plan !== "free");

// NEW: Read directly from database
const isPublicFromDb = storeData?.isPublic ?? false;
```

### 3. Removed Local State Management
The toggle now reads directly from Convex reactivity - when the mutation updates the database, the query automatically refreshes and the UI updates.

### 4. Simplified Toggle Handler
```typescript
const handleVisibilityToggle = async (checked: boolean) => {
  try {
    const result = await updateVisibility({
      storeId,
      isPublic: checked,
      isPublishedProfile: checked,
      clerkId: user?.id,
    });
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    toast.success(result.message);
  } catch (error: any) {
    toast.error(error.message || "Failed to update visibility");
  }
};
```

No manual state management needed - Convex handles the reactivity.

### 5. Updated Switch Component
```typescript
<Switch
  id="public-profile"
  checked={isPublicFromDb}  // Read from database
  onCheckedChange={handleVisibilityToggle}
  disabled={!isAdmin && planData.plan === "free"}
/>
```

## Files Modified
1. `components/creator/plan-settings.tsx`
   - Added `storeData` query
   - Removed local `isPublic` state
   - Updated all references to use `isPublicFromDb`
   - Added console logging for debugging

2. `convex/stores.ts` (already fixed)
   - Added `isPublic`, `isPublishedProfile`, and plan fields to `storeValidator`

3. `convex/creatorPlans.ts` (already working)
   - `updateStoreVisibility` mutation properly updates database
   - Admin bypass logic working correctly

## How It Works Now
1. User toggles switch
2. `handleVisibilityToggle` calls `updateVisibility` mutation
3. Mutation updates database with `isPublic` and `isPublishedProfile`
4. Convex automatically invalidates and refetches `getStoreById` query
5. UI updates with new value from database
6. Page refresh shows correct state

## Testing
Open browser console and check logs:
- `Store data:` - Shows current state from database
- `Updating visibility to:` - Shows what value is being set
- `Update result:` - Shows mutation response

Try:
1. Toggle to public → Should stay public after refresh
2. Toggle to private → Should stay private after refresh
3. With admin account → Should work regardless of plan
4. With free plan (non-admin) → Should show upgrade message

## Admin Bypass
Admin accounts can toggle visibility regardless of plan:
- Admin status is checked via `api.users.checkIsAdmin`
- Toggle is enabled for admins even on free plan
- Success message shows "(admin override)" for admins

