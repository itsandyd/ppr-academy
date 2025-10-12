# Setting Up Convex Environment Variables

## Quick Setup for Clerk Sync

To use the **Quick Sync** feature (one-click syncing without entering your key), you need to add your Clerk Secret Key to Convex's environment variables.

### Option 1: Via Convex Dashboard (Recommended)

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Click **Settings** in the sidebar
4. Click **Environment Variables**
5. Click **Add Environment Variable**
6. Enter:
   - **Name**: `CLERK_SECRET_KEY`
   - **Value**: Your Clerk secret key (from Clerk Dashboard → API Keys)
   - Starts with `sk_test_` or `sk_live_`
7. Click **Save**

### Option 2: Via Convex CLI

```bash
# Set environment variable
npx convex env set CLERK_SECRET_KEY sk_test_your_key_here

# Or for production deployment
npx convex env set CLERK_SECRET_KEY sk_live_your_key_here --prod
```

### Verify It's Set

```bash
# List all environment variables
npx convex env list

# Should show:
# CLERK_SECRET_KEY: sk_test_****...
```

---

## After Setting the Variable

1. **Restart your Convex dev server** if running locally:
   ```bash
   # Stop current dev server (Ctrl+C)
   # Then restart
   npx convex dev
   ```

2. **Navigate to the sync page**: `/admin/sync`

3. **Click "Quick Sync Users"** - No need to paste your key!

---

## Security Notes

✅ **Safe to store in Convex**
- Environment variables in Convex are encrypted at rest
- Only accessible to your backend functions
- Not exposed to the frontend or browser

✅ **Separate Keys for Dev/Prod**
- Use `sk_test_` keys for development
- Use `sk_live_` keys for production
- Set them separately with `--prod` flag

---

## Troubleshooting

### "CLERK_SECRET_KEY not found in environment variables"

**Solution:**
1. Make sure you added it to Convex Dashboard → Settings → Environment Variables
2. Restart your Convex dev server
3. Wait 30 seconds for the change to propagate

### "Clerk API error: 401"

**Solution:**
1. Your key might be incorrect
2. Get a fresh key from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
3. Update the environment variable
4. Restart Convex dev server

---

## Quick Reference

| Environment | Key Name | Where to Set |
|-------------|----------|--------------|
| Development | `CLERK_SECRET_KEY` | Convex Dashboard or CLI |
| Production | `CLERK_SECRET_KEY` | Convex Dashboard or CLI with `--prod` |

---

## Related

- **Manual Sync**: If you don't want to set up the env variable, use the "Manual Sync" option instead
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Convex Dashboard**: https://dashboard.convex.dev
- **Sync Guide**: See `CLERK_USER_SYNC_GUIDE.md`

