# Multiple Social Media Accounts Support

## ✅ Feature Overview

The social media scheduler now fully supports connecting **multiple accounts per platform**. Users can connect:
- Multiple Instagram accounts (Personal, Business, Brand, etc.)
- Multiple Twitter/X accounts
- Multiple Facebook Pages
- Multiple LinkedIn profiles
- Multiple TikTok accounts

## 🔧 Technical Implementation

### Database Schema Changes

**New Index:** `by_store_platform_user`
```typescript
.index("by_store_platform_user", ["storeId", "platform", "platformUserId"])
```

This unique index allows:
- Multiple accounts per platform per store
- Identification by the platform's user ID (not just platform type)
- Updates to existing accounts when re-authorizing

**New Field:** `accountLabel`
```typescript
accountLabel: v.optional(v.string())
```

Allows users to label their accounts (e.g., "Personal", "Business", "Brand Account") to distinguish between them.

### Logic Changes

**Before:** Only one account per platform
- Checked by: `storeId + platform`
- Result: Connecting a second Instagram account would overwrite the first

**After:** Multiple accounts per platform
- Checked by: `storeId + platform + platformUserId`
- Result: Each unique social media account is stored separately

## 🎨 UI Updates

### Connected Accounts Display

**Single Account:**
```
┌─────────────────────┐
│ 🟣 Instagram        │
│ @username           │
│ ✅ Connected        │
│ [Manage]            │
└─────────────────────┘
```

**Multiple Accounts:**
```
┌─────────────────────────────┐
│ 🟣 Instagram                │
│ 2 accounts connected        │
│ ✅ Connected                │
│                             │
│ ┌─────────────────────────┐ │
│ │ @personal_account       │ │
│ │ John's Personal         │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ @business_account       │ │
│ │ My Business             │ │
│ └─────────────────────────┘ │
│                             │
│ [Add Another] [Manage]      │
└─────────────────────────────┘
```

### Account Connection Flow

1. **First Account:** Click "Connect Instagram"
2. **OAuth Authorization:** User authorizes account
3. **Account Saved:** Account appears in list
4. **Second Account:** Click "Add Another"
5. **OAuth Again:** User authorizes different account
6. **Both Saved:** Both accounts now available

## 📝 New Mutations

### `updateAccountLabel`

Allows users to add custom labels to distinguish accounts:

```typescript
await updateAccountLabel({
  accountId: "account_123",
  userId: "user_456",
  label: "Personal Account"
});
```

**Use Cases:**
- "Personal" vs "Business"
- "Main Brand" vs "Product Line"
- "US Market" vs "EU Market"
- "English" vs "Spanish"

## 🔄 Account Management Workflow

### Connecting Multiple Accounts

1. **Navigate to Social Media tab**
2. **Connect first account** for a platform
3. **Click "Add Another"** to connect additional accounts
4. **Authorize new account** via OAuth
5. **Repeat** for as many accounts as needed

### Scheduling Posts to Specific Accounts

When creating a scheduled post:
1. Select the platform (e.g., Instagram)
2. **Choose which account** to post to (dropdown with all connected accounts)
3. Add content and schedule
4. Post will be published to the selected account only

### Re-authorizing Accounts

If a user re-authorizes the same account (same platformUserId):
- The existing account is updated (not duplicated)
- Tokens are refreshed
- Connection status is restored
- No duplicate accounts are created

## 🎯 Use Cases

### Multiple Account Scenarios

**Content Creator:**
- Personal Instagram (@johndoe)
- Brand Instagram (@johndoe_official)
- Podcast Instagram (@johndoe_podcast)

**Agency:**
- Client A Instagram
- Client B Instagram
- Client C Instagram
- Agency's own Instagram

**Musician:**
- Main artist account
- Band account
- Record label account
- Side project account

**Business:**
- Main brand account
- Regional accounts (US, EU, APAC)
- Product line accounts
- Corporate account

## 🔐 Security Considerations

### Token Storage

- Each account has its own OAuth tokens
- Tokens are stored securely in Convex (encrypted at rest)
- Each account can be disconnected independently
- Token refresh is handled per-account

### Account Isolation

- Scheduled posts are tied to specific account IDs
- One account's token expiry doesn't affect others
- Failed posts on one account don't affect others
- Analytics are tracked per-account

## 📊 Benefits

### For Users

✅ **Manage multiple brands** from one dashboard
✅ **Post to different audiences** without switching apps
✅ **Compare performance** across accounts
✅ **Save time** with centralized management
✅ **Separate personal and professional** presence

### For Platform

✅ **Higher user engagement** (more accounts = more usage)
✅ **Professional use case** (agencies, brands)
✅ **Competitive advantage** over single-account tools
✅ **Scalable architecture** for any number of accounts

## 🚀 Future Enhancements

### Account Management Features (Coming Soon)

- [ ] **Bulk posting** to multiple accounts at once
- [ ] **Account groups** (e.g., "All Personal", "All Business")
- [ ] **Cross-posting** with account-specific customization
- [ ] **Role-based access** (team members for specific accounts)
- [ ] **Account analytics** dashboard
- [ ] **Account switching** in post composer
- [ ] **Default account** settings per platform
- [ ] **Account nicknames** for easier identification
- [ ] **Account archiving** (keep history but hide from list)

### Advanced Scheduling

- [ ] **Account rotation** (post to different accounts in sequence)
- [ ] **Account-specific content calendars**
- [ ] **Duplicate post across accounts** with one click
- [ ] **Account performance comparison**

## 📚 API Reference

### Key Functions

**`connectSocialAccount`**
- Connects or updates a social media account
- Checks by `platformUserId` to prevent duplicates
- Supports unlimited accounts per platform

**`getSocialAccounts`**
- Returns ALL accounts for a store
- Grouped by platform in UI
- Shows connection status per account

**`disconnectSocialAccount`**
- Disconnects specific account
- Other accounts on same platform remain active

**`updateAccountLabel`**
- Add custom label to account
- Helps users distinguish between multiple accounts

## 🎓 Best Practices

### For Users

1. **Label your accounts** immediately after connecting
2. **Test posts** on each account to verify connection
3. **Monitor token expiry** to avoid failed posts
4. **Use account groups** for bulk operations
5. **Review analytics** per-account regularly

### For Developers

1. **Always use `platformUserId`** for unique identification
2. **Handle token refresh** per-account independently
3. **Show account labels** prominently in UI
4. **Allow account selection** in post composer
5. **Track metrics** per-account for analytics

## 🔍 Troubleshooting

### "Account already connected" Error

**Cause:** Re-authorizing the same account
**Solution:** This is expected behavior - the account tokens are updated, not duplicated

### "Cannot connect another account" Error

**Cause:** Platform API limitations (rare)
**Solution:** Check platform documentation for account limits

### "Which account did I post to?"

**Solution:** Check the scheduled post's `socialAccountId` field to see which account was used

### "How do I remove an account?"

**Solution:** Click "Manage" → Select account → "Disconnect"

## ✅ Testing Checklist

- [ ] Connect first account for a platform
- [ ] Connect second account for same platform
- [ ] Both accounts appear in list
- [ ] Can schedule post to specific account
- [ ] Can disconnect one account without affecting other
- [ ] Can re-authorize same account (updates, not duplicates)
- [ ] Account labels work correctly
- [ ] Post scheduling shows account selection dropdown

## 📖 Summary

The social media scheduler now provides **enterprise-grade multi-account support**, allowing users to manage unlimited social media accounts across all platforms from a single dashboard. This makes the platform suitable for:

- Individual creators with multiple brands
- Agencies managing client accounts
- Businesses with multiple product lines
- Teams collaborating on social media

**Key Achievement:** Users can now connect as many accounts as they need per platform, with proper isolation, security, and management capabilities! 🎉
