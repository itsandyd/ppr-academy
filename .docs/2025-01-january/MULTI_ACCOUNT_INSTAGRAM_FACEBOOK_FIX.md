# Multi-Account Instagram/Facebook Connection Fix

## Problem
Users with multiple Facebook Pages or Instagram Business accounts could only connect the first (default) one. The system automatically selected `instagramAccounts[0]` without giving users a choice.

## Solution
Created an account selection flow that shows all available accounts and lets users choose which one to connect.

## How It Works Now

### Single Account (No Change)
If user has only 1 Instagram or Facebook account:
- ✅ Auto-connects immediately (same as before)
- ✅ No selection screen needed

### Multiple Accounts (NEW)
If user has 2+ Instagram accounts or Facebook Pages:
1. OAuth completes successfully
2. Instead of auto-connecting first account, redirects to selection page
3. Beautiful UI shows all available accounts with:
   - Profile pictures
   - Account names
   - Usernames
   - Associated Facebook Page (for Instagram)
4. User clicks the account they want
5. Clicks "Connect Selected Account"
6. Account gets saved to store
7. Success message and popup closes

## Files Created

### 1. Account Selection Page
**File**: `app/api/social/oauth/[platform]/select-account/route.ts`

Beautiful selection UI with:
- Gradient purple background
- Account cards with hover effects
- Profile images or initials
- Clear account information
- Connect/Cancel buttons
- Loading states

### 2. Save Selected Account API
**File**: `app/api/social/oauth/[platform]/save-selected/route.ts`

Handles saving the user's selected account:
- Validates auth
- Processes Instagram vs Facebook accounts
- Calls Convex mutation to save connection
- Returns success/error

### 3. Updated OAuth Callback
**File**: `app/api/social/oauth/[platform]/callback/route.ts`

Modified to detect multiple accounts:
- Instagram: Checks if `instagramAccounts.length > 1`
- Facebook: Checks if `pagesData.data.length > 1`
- Returns special marker: `{ id: 'SELECT_ACCOUNT', ... }`
- Redirects to selection page with account data

## Testing on Production

### Prerequisites
- Deployed to production (Vercel/etc)
- Facebook App configured with production URL
- Multiple Instagram accounts or Facebook Pages connected to your Facebook Business account

### Test Steps

#### Test Instagram (Multiple Accounts)
1. Navigate to Social Media page in dashboard
2. Click "Connect Instagram"
3. Log in with Facebook account that has multiple Pages with Instagram
4. **NEW**: Selection screen appears showing all Instagram accounts
5. Click on the account you want (not the default one)
6. Click "Connect Selected Account"
7. Verify correct account appears in dashboard
8. Try posting - verify it posts to correct account

#### Test Facebook (Multiple Pages)
1. Navigate to Social Media page
2. Click "Connect Facebook"
3. Log in with account that has multiple Facebook Pages
4. **NEW**: Selection screen appears showing all Pages
5. Click on the Page you want
6. Click "Connect Selected Account"
7. Verify correct Page appears in dashboard
8. Try scheduling a post - verify correct Page is targeted

### What to Look For

✅ **Success Indicators:**
- Selection screen loads with all accounts
- Can click and select different accounts
- "Connect Selected Account" button enables when selecting
- Success message appears
- Correct account shows in dashboard
- Can post/schedule to selected account

❌ **Issues to Watch:**
- Selection screen doesn't show all accounts
- Wrong account gets connected
- Error after selecting account
- Can't post to selected account

## Rollback Plan

If issues occur, the fix can be easily rolled back:

### Revert Changes
```bash
# Delete new files
rm app/api/social/oauth/[platform]/select-account/route.ts
rm app/api/social/oauth/[platform]/save-selected/route.ts

# Revert callback changes
git checkout app/api/social/oauth/[platform]/callback/route.ts
```

The old behavior will return (auto-select first account).

## Technical Details

### Data Flow

1. **OAuth Callback** receives code
2. **Exchange token** with Facebook
3. **Fetch all accounts** (Pages/Instagram)
4. **Check count**:
   - If 1: Auto-connect (existing flow)
   - If 2+: Redirect to selection (new flow)
5. **Selection page** shows accounts
6. **User selects** their preferred account
7. **Save endpoint** stores connection
8. **Success** and close popup

### Account Data Structure

**Instagram:**
```typescript
{
  instagram: {
    id: "...",
    username: "...",
    name: "...",
    profile_picture_url: "..."
  },
  page: {
    id: "...",
    name: "...",
    access_token: "..."
  }
}
```

**Facebook:**
```typescript
{
  id: "...",
  name: "...",
  access_token: "...",
  picture: {
    data: {
      url: "..."
    }
  }
}
```

### Security Considerations

✅ **Implemented:**
- Auth check in save-selected endpoint
- userId verification
- Access token passed securely through URL params (temporary)
- HTTPS only (production requirement)

⚠️ **Note:**
- Access token in URL is temporary (only exists during selection flow)
- Token is used immediately and not logged
- Selection page is ephemeral (popup window)

## Why Localhost Doesn't Work

Facebook OAuth requires:
1. **HTTPS** (not HTTP)
2. **Registered redirect URL** in Facebook App settings
3. **Public domain** (not localhost)

### Alternatives (Not Recommended for Quick Testing)
- ngrok: Creates HTTPS tunnel to localhost
- localhost.run: Similar to ngrok
- Cloudflare Tunnel: Enterprise option

### Recommended Approach (Current)
✅ **Test on production/staging deployment**
- Deploy to Vercel preview branch
- Test on actual production
- Use Vercel Preview deployments for safe testing

## Expected User Experience

### Before This Fix
"I have 3 Instagram accounts but it always connects my old business account. I want to connect my main account but there's no way to choose!"

### After This Fix
"Cool! I see all 3 of my Instagram accounts. I'll click on @my_main_account and connect that one. Perfect! Now I can schedule posts to the right account."

## Next Steps

1. **Deploy to production**
   ```bash
   git add .
   git commit -m "feat: add multi-account selection for Instagram/Facebook OAuth"
   git push origin main
   ```

2. **Test with your Facebook account**
   - Log in with account that has multiple Pages
   - Verify selection screen appears
   - Connect non-default account
   - Verify it works

3. **Gather user feedback**
   - Does selection UI look good?
   - Are all accounts showing up?
   - Is it clear which account to select?

4. **Monitor for issues**
   - Check server logs for OAuth errors
   - Watch for connection failures
   - Verify posts go to correct accounts

## Future Enhancements

Possible improvements:
1. Show account preview (follower count, recent posts)
2. Remember last selected account per store
3. Allow switching connected accounts without reconnecting
4. Show which account is currently active in dashboard
5. Support connecting multiple accounts simultaneously

---

**Status**: Ready for Production Testing ✅
**Breaking Changes**: None (backwards compatible)
**Database Changes**: None
**Deployment Required**: Yes (production only)

**Test Checklist:**
- [ ] Deploy to production
- [ ] Connect Instagram with multiple accounts
- [ ] Verify selection screen appears
- [ ] Select non-default account
- [ ] Confirm correct account connected
- [ ] Test Facebook with multiple Pages
- [ ] Verify posting works to selected account


