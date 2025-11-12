# 🔄 Clerk User Sync Guide

## Problem Solved

If your Clerk account has more users than what's showing in Convex, this tool will sync all missing users.

**Common Causes:**
- Webhooks weren't set up from day one
- Some webhook events failed to process
- Users were imported directly to Clerk
- Database was reset but Clerk wasn't

---

## How to Use the Sync Tool

### Step 1: Access the Sync Page

1. Make sure you're logged in as an admin
2. Navigate to `/admin/sync`
3. Or go to Admin Dashboard → Sync Users (in sidebar)

### Step 2: Get Your Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your project
3. Click **API Keys** in the sidebar
4. Under **Secret keys**, copy your secret key (starts with `sk_test_` or `sk_live_`)

⚠️ **Important:** Never commit this key to your codebase!

### Step 3: Run the Sync

1. Paste your Clerk Secret Key into the form
2. Click **"Start Sync"**
3. Wait for the sync to complete (may take 30-60 seconds for large user bases)
4. Review the results

### Step 4: Verify

Check the results:
- **Clerk Users**: Total users in your Clerk account
- **Convex Users**: Total users now in your database
- **Added**: New users that were synced
- **Updated**: Existing users that were updated

---

## What Gets Synced

For each Clerk user, the following data is synced:

- ✅ Clerk ID (`clerkId`)
- ✅ Email address (`email`)
- ✅ First name (`firstName`)
- ✅ Last name (`lastName`)
- ✅ Profile image (`imageUrl`)
- ✅ Full name (`name` - auto-generated)

**Default Values:**
- `role`: "SUBACCOUNT_USER"
- `admin`: false

---

## Security

### ✅ Secure by Design

- Admin-only access (requires `admin: true` in database)
- Secret key is **never stored** anywhere
- Key is cleared from memory immediately after sync
- All sync operations are logged
- Backend validation ensures only admins can trigger sync

### 🔒 Best Practices

1. **Never share your Clerk Secret Key**
2. **Don't store it in your code**
3. **Use environment variables** for automated syncs
4. **Clear your browser history** after using the sync tool
5. **Rotate your keys** regularly in production

---

## How It Works

```
┌─────────────────────────────────────┐
│  1. Admin triggers sync             │
│     • Provides Clerk Secret Key     │
│     • Backend verifies admin status │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. Fetch users from Clerk API      │
│     • Paginated requests (100/page) │
│     • Fetches ALL users             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. Compare with Convex users       │
│     • Match by clerkId              │
│     • Identify new vs existing      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. Sync to Convex                  │
│     • Create new users              │
│     • Update existing users         │
│     • Track errors                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. Return results                  │
│     • Total synced                  │
│     • Added/updated counts          │
│     • Any errors encountered        │
└─────────────────────────────────────┘
```

---

## Sync Statistics

The sync tool tracks:

- **Total Clerk Users**: Users in your Clerk account
- **Total Convex Users**: Users in your database
- **Users Added**: New users created during sync
- **Users Updated**: Existing users updated
- **Last Sync Time**: When the last sync was run
- **Sync Status**: completed/failed/never_synced

This data is stored in the `syncMetadata` table and displayed on the sync page.

---

## Troubleshooting

### "Unauthorized: Admin access required"

**Solution:** Make sure your user has `admin: true` in the Convex users table.

```typescript
// Check your admin status
const user = await ctx.db
  .query("users")
  .withIndex("by_clerkId", (q) => q.eq("clerkId", YOUR_CLERK_ID))
  .unique();

console.log(user.admin); // Should be true
```

### "Clerk API error: 401"

**Solution:** Your Clerk Secret Key is invalid or expired.
1. Get a fresh key from Clerk Dashboard
2. Make sure you copied the entire key
3. Ensure it starts with `sk_test_` or `sk_live_`

### "Clerk API error: 429"

**Solution:** Rate limit exceeded. Wait a few minutes and try again.

### Some users still missing after sync

**Possible causes:**
1. Check the error list in sync results
2. Some users may have been deleted in Clerk
3. API permissions may be restricted

**Solution:**
- Review error messages
- Check Clerk Dashboard for user status
- Verify API key has correct permissions

### Sync is very slow

**Normal behavior:**
- Clerk API limits: 100 users per request
- For 1000 users: ~10 requests = ~30-60 seconds
- Progress is logged to console

---

## Automated Sync (Optional)

For production, you can automate syncing via Convex crons:

### Setup Cron Job

1. Store Clerk Secret Key as environment variable in Convex
2. Create a scheduled function:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync users every 24 hours
crons.interval(
  "sync clerk users",
  { hours: 24 },
  internal.clerkSync.scheduledSync
);

export default crons;
```

3. Create scheduled sync function:

```typescript
// Add to convex/clerkSync.ts
export const scheduledSync = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY not set");
      return null;
    }

    // Get first admin user to run sync as
    const admins = await ctx.runQuery(internal.clerkSync.getFirstAdmin);
    if (!admins) {
      console.error("No admin user found");
      return null;
    }

    await ctx.runAction(api.clerkSync.syncClerkUsers, {
      clerkId: admins.clerkId,
      clerkSecretKey,
    });

    return null;
  },
});
```

---

## Files Created

### Backend (Convex)
- **`convex/clerkSync.ts`** - Sync logic and API integration
  - `getSyncStats` - Get current sync status
  - `syncClerkUsers` - Main sync function
  - Internal mutations for creating/updating users

### Frontend (Admin UI)
- **`app/admin/sync/page.tsx`** - Admin sync interface
  - Displays current stats
  - Sync form with Clerk key input
  - Real-time sync progress
  - Results display

### Database
- **`syncMetadata` table** - Tracks sync operations
  - Last sync time
  - User counts
  - Sync status

---

## Best Practices

### When to Use Manual Sync
✅ Initial setup (first time running the app)  
✅ After importing users to Clerk  
✅ If you notice missing users  
✅ After webhook downtime  
✅ Testing in development  

### When to Use Automated Sync
✅ Production environments  
✅ High user registration rate  
✅ Want daily/weekly consistency checks  
✅ Multiple team members managing users  

---

## FAQ

**Q: Will this overwrite existing user data?**  
A: No, it only updates fields from Clerk. Custom fields you've added (like `admin`, `bio`, etc.) are preserved.

**Q: What happens to users in Convex that aren't in Clerk?**  
A: They're left unchanged. The sync only adds/updates, never deletes.

**Q: Can I sync only specific users?**  
A: Currently no, but you could modify the code to filter by email domain or other criteria.

**Q: Is my Clerk Secret Key stored anywhere?**  
A: No! It's used only for the sync operation and immediately cleared from memory.

**Q: Can other admins see sync history?**  
A: Yes, the sync metadata is visible to all admins on the sync page.

**Q: What if sync fails mid-way?**  
A: Users synced before the failure are saved. You can re-run the sync to catch remaining users.

---

## Related Documentation

- `ADMIN_ACCESS_GUIDE.md` - How to grant admin access
- `ADMIN_SECURITY_AUDIT_COMPLETE.md` - Admin security details
- `CLERK_SETUP_INSTRUCTIONS.md` - Initial Clerk setup

---

## Support

If you encounter issues:
1. Check the error messages in sync results
2. Verify your Clerk Secret Key is correct
3. Ensure you have admin access
4. Check Convex logs for detailed error info
5. Verify Clerk API is operational

---

**Last Updated**: October 12, 2025  
**Status**: ✅ Production Ready

