# Admin Access Control Guide

## Overview

The admin dashboard (`/admin`) is now protected and only accessible to users with the `admin` flag set to `true` in the database.

## Security Implementation

### What Was Added

1. **Admin Check Query** (`convex/users.ts`)
   - New query `checkIsAdmin` that verifies if a user has admin privileges
   - Returns `{ isAdmin: boolean, user: object | null }`

2. **Protected Admin Page** (`app/admin/page.tsx`)
   - Checks authentication status via Clerk
   - Verifies admin status via Convex query
   - Automatic redirects:
     - **Not signed in** → `/sign-in?redirect_url=/admin`
     - **Signed in but not admin** → `/` (homepage)
   - Loading state while verifying access
   - "Access Denied" UI for non-admin users

### Access Flow

```
User visits /admin
↓
Check Clerk authentication
↓
├─ Not signed in → Redirect to sign-in
└─ Signed in → Check admin status in database
   ↓
   ├─ admin: true → Show admin dashboard ✅
   └─ admin: false → Redirect to homepage ❌
```

## How to Grant Admin Access

### Option 1: Using Convex Dashboard (Recommended)

1. Open your Convex dashboard at https://dashboard.convex.dev
2. Select your project
3. Go to **Data** tab
4. Select the `users` table
5. Find the user you want to make admin
6. Click on the user row to edit
7. Set `admin` field to `true`
8. Save changes

### Option 2: Using the makeUserAdmin Mutation

The app includes a built-in mutation for granting admin access:

```typescript
// From Convex dashboard "Functions" tab or via API
await ctx.runMutation(api.adminSetup.makeUserAdmin, {
  clerkId: "user_xxxxxxxxxxxxx" // User's Clerk ID
});
```

**Steps:**
1. Get the user's Clerk ID from Clerk dashboard or database
2. Go to Convex Dashboard → **Functions**
3. Find `adminSetup.makeUserAdmin`
4. Run with the user's `clerkId`

### Option 3: Direct Database Update (For Development)

You can manually update the database during development:

1. Open Convex dashboard
2. Go to **Data** → `users` table
3. Click on any user
4. Edit the `admin` field to `true`
5. Save

## Checking Admin Status

Users can check their own admin status by visiting:
- The admin page (will show access denied if not admin)
- Or use the `checkAdminStatus` query:

```typescript
const status = await ctx.runQuery(api.adminSetup.checkAdminStatus, {
  clerkId: user.id
});
console.log(status.isAdmin); // true or false
```

## First Admin Setup

For a brand new installation, you'll need to manually grant admin access to at least one user:

1. Create a user account by signing up
2. Find the user in Convex dashboard → Data → users table
3. Set their `admin` field to `true`
4. That user can now access `/admin` and manage the platform

## Revoking Admin Access

To remove admin privileges:

1. Go to Convex dashboard → Data → users
2. Find the user
3. Set `admin` field to `false` or delete it
4. The user will immediately lose access to admin routes

## Security Notes

- ✅ Admin status is verified on every page load
- ✅ Real-time check via Convex query (not just client-side)
- ✅ Protected by Clerk authentication layer
- ✅ Automatic redirects prevent unauthorized access
- ✅ No way to bypass admin check from client-side

## Troubleshooting

### "Access Denied" for legitimate admin
1. Check the `users` table in Convex dashboard
2. Verify `admin` field is set to `true` (boolean, not string)
3. Verify the `clerkId` matches the logged-in user
4. Try signing out and back in

### Admin page redirects immediately
- Check browser console for errors
- Verify Convex connection is working
- Check that user exists in database with correct `clerkId`

### User not found in database
- Ensure Clerk webhook is properly configured
- User should be created automatically on first sign-in
- Check webhook logs in Clerk dashboard

## Related Files

- `/app/admin/page.tsx` - Protected admin dashboard
- `/convex/users.ts` - User queries including `checkIsAdmin`
- `/convex/adminSetup.ts` - Admin management functions
- `/convex/schema.ts` - User schema with `admin` field (line 34)

## Future Enhancements

Consider implementing:
- Role-based permissions (beyond just admin/non-admin)
- Admin activity logging
- Multiple admin levels (super admin, moderator, etc.)
- Admin invitation system
- 2FA for admin accounts

