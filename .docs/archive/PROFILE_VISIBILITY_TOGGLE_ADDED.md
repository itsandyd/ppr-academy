# Profile Visibility Toggle - Added to Profile Page ✅

## What Was Added

A **Profile Visibility Card** at the top of the Profile Settings page (`/store/profile`) that allows users to toggle their profile between public and private.

## Location

**File:** `app/(dashboard)/store/profile/components/HeaderForm.tsx`

**Page:** `/store/profile` (accessible via sidebar: **Profile** under "Manage & Monetize")

## Features

### 1. **Visual Status Indicator**
- 👁️ **Green Eye Icon** - When profile is public
- 👁️‍🗨️ **Gray Eye-Off Icon** - When profile is private

### 2. **Toggle Switch**
- Clean switch UI to toggle visibility
- Shows current state with descriptive text:
  - Public: "Your profile is visible to everyone on the marketplace"
  - Private: "Your profile is private and only accessible via direct link"

### 3. **Plan Enforcement**
- **Free Plan Users:** Switch is disabled with upgrade message
  - Shows amber warning: "🔒 Public profile visibility requires Creator or Creator Pro plan"
- **Paid Plan Users:** Full access to toggle
- **Admin Users:** Can toggle regardless of plan (shows admin badge)

### 4. **Real-time Updates**
- Uses Convex mutations to update database
- Shows success/error toasts
- Automatically syncs with Convex reactivity

## User Experience

### For Regular Users (Free Plan):
1. Visit `/store/profile`
2. See "Profile Visibility" card at top
3. Switch is disabled with upgrade message
4. Must upgrade to Creator or Creator Pro to enable

### For Paid Users:
1. Visit `/store/profile`
2. Toggle switch to make profile public/private
3. See success message
4. Profile visibility updates immediately

### For Admin Users:
1. Visit `/store/profile`
2. See "Admin" badge on visibility card
3. Toggle works regardless of plan
4. See admin access message confirming override

## Technical Implementation

### Data Flow:
```typescript
// Fetch store data
const stores = useQuery(api.stores.getStoresByUser, { userId: clerkUser.id });
const storeData = useQuery(api.stores.getStoreById, { storeId: userStore._id });

// Get current visibility state
const isPublicFromDb = storeData?.isPublic ?? false;

// Toggle visibility
const handleVisibilityToggle = async (checked: boolean) => {
  await updateVisibility({
    storeId: userStore._id,
    isPublic: checked,
    isPublishedProfile: checked,
    clerkId: clerkUser?.id,
  });
};
```

### Admin Check:
```typescript
const adminStatus = useQuery(api.users.checkIsAdmin, { clerkId: clerkUser.id });
const isAdmin = adminStatus?.isAdmin === true;
```

### Switch Disabled Logic:
```typescript
<Switch
  checked={isPublicFromDb}
  onCheckedChange={handleVisibilityToggle}
  disabled={!isAdmin && storePlan === "free"}
/>
```

## UI Components Used

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Switch` - Toggle control
- `Label` - Form labels
- `Badge` - Admin badge
- `Eye`, `EyeOff`, `Shield` - Icons from lucide-react

## Benefits

1. **Centralized Control:** Profile visibility toggle in the same place where users edit their profile
2. **Clear Feedback:** Visual indicators and messages make status obvious
3. **Upgrade Path:** Free users see clear path to unlock feature
4. **Admin Flexibility:** Admins can manage any profile regardless of plan
5. **Consistent Design:** Matches the styling of Plan & Billing page

## Navigation Flow

1. **Sidebar** → Click "Profile" (under "Manage & Monetize")
2. **Profile Page** → See "Profile Visibility" card at top
3. **Toggle** → Turn profile public/private
4. **Edit** → Scroll down to edit name, bio, avatar, social links

## Related Files

- `app/(dashboard)/components/app-sidebar-enhanced.tsx` - Added "Profile" link
- `app/(dashboard)/components/sidebar-wrapper.tsx` - Added "Profile Settings" title
- `components/creator/plan-settings.tsx` - Original visibility toggle (in Plan & Billing)
- `convex/creatorPlans.ts` - Backend visibility mutation with admin bypass
- `convex/stores.ts` - Store queries with visibility fields

## Status: ✅ Complete

Users can now control their profile visibility directly from the Profile Settings page!

