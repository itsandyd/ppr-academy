# Multiple Social Accounts UI - Profile Page Implementation ✅

## Overview

Users can now **add, manage, and remove multiple social accounts per platform** directly from the Profile Settings page (`/store/profile`), without needing OAuth!

---

## What Was Added

### New Component: `MultipleSocialAccounts.tsx`

A comprehensive UI for managing multiple social media accounts with the following features:

#### **Features:**
✅ Add multiple accounts per platform (Instagram, Twitter, TikTok, etc.)  
✅ Manual entry (no OAuth required)  
✅ Custom labels ("Personal", "Business", "Shop")  
✅ Visual platform indicators with brand colors  
✅ View all accounts grouped by platform  
✅ Remove accounts individually  
✅ Open profile links directly  
✅ Real-time updates in preview  

---

## User Interface

### 1. **Account Overview**
Shows all platforms with account counts:

```
┌─────────────────────────────────────────┐
│  [📷] Instagram            2 accounts    │
│  ├─ @producer_main (Personal)           │
│  └─ @producer_shop (Business)           │
│                                          │
│  [🐦] Twitter / X          1 account     │
│  └─ @beats_by_me                        │
│                                          │
│  [🎵] TikTok               0 accounts    │
│  └─ No accounts added yet                │
└─────────────────────────────────────────┘
```

### 2. **Add New Account Form**
Click "Add Social Account" to reveal:

```
┌─────────────────────────────────────────┐
│  Platform Selection:                     │
│  [📷 Insta] [🐦 Twit] [📘 Face]        │
│  [🎵 TikTo] [▶️ YouTu] [💼 Linke]      │
│                                          │
│  Username or URL:                        │
│  [@username or full URL]                 │
│                                          │
│  Label (optional):                       │
│  [Personal, Business, Shop, etc.]        │
│                                          │
│  [+ Add Account] [Cancel]                │
└─────────────────────────────────────────┘
```

---

## Platform Support

| Platform  | Username Format          | Label Examples           |
|-----------|--------------------------|--------------------------|
| Instagram | `@username` or URL       | Personal, Business, Shop |
| Twitter   | `@username` or URL       | Main, Music, Personal    |
| Facebook  | `username` or URL        | Page, Profile, Business  |
| TikTok    | `@username` or URL       | Main, BTS, Dance         |
| YouTube   | `@handle` or channel URL | Main, Gaming, Vlogs      |
| LinkedIn  | Profile URL              | Professional, Company    |

---

## How It Works

### Data Flow:
1. **User adds account** → Enters username + optional label
2. **Form validates** → Ensures username is provided
3. **Mutation called** → `api.socialMedia.connectSocialAccount`
4. **Account saved** → Stored in `socialAccounts` table
5. **UI updates** → Account appears in list immediately
6. **Preview updates** → PhonePreview shows new account

### Database Entry:
```typescript
{
  storeId: "...",
  userId: "...",
  platform: "instagram",
  platformUserId: "producer_main",
  platformUsername: "@producer_main",
  platformDisplayName: "Producer Main",
  accountLabel: "Personal",
  accessToken: "manual", // Not OAuth
  grantedScopes: ["display"], // Display only
  isActive: true,
  isConnected: true,
}
```

---

## Key Features

### 1. **Manual Entry (No OAuth)**
- Users don't need to connect via OAuth
- Simply paste username or profile URL
- Great for display-only purposes
- OAuth accounts (from Social tab) also appear here

### 2. **Custom Labels**
```typescript
Examples:
- "Personal" (main account)
- "Business" (business page)
- "Shop" (e-commerce account)
- "BTS" (behind the scenes)
- "Gaming" (gaming content)
```

Labels help distinguish between multiple accounts and appear as badges on both the profile preview and public storefront.

### 3. **Grouped Display**
Accounts are grouped by platform for easy management:
- Instagram (3 accounts)
- Twitter (1 account)
- TikTok (2 accounts)

### 4. **Quick Actions**
Each account has:
- **External Link** - Opens profile in new tab
- **Delete** - Removes from list
- **Badge** - Shows custom label

---

## User Experience Flow

### Adding First Account:
1. Visit `/store/profile`
2. Scroll to "Social Media Accounts" section
3. Click "Add Social Account"
4. Select platform (e.g., Instagram)
5. Enter `@username` or full URL
6. Optionally add label ("Personal")
7. Click "Add Account"
8. ✅ Account appears immediately
9. ✅ Preview updates automatically
10. ✅ Shows on public storefront

### Adding Second Account (Same Platform):
1. Click "Add Social Account" again
2. Select Instagram again
3. Enter different `@username`
4. Add label ("Business")
5. Click "Add Account"
6. ✅ Now have 2 Instagram accounts
7. ✅ Both show on storefront

### Removing Account:
1. Click trash icon next to account
2. Confirm removal
3. ✅ Account removed from list
4. ✅ Removed from storefront
5. ✅ Preview updates

---

## Visual Design

### Platform Icons with Gradients:
```typescript
Instagram: Purple → Pink gradient
Twitter:   Blue → Blue gradient
Facebook:  Blue → Dark Blue gradient
TikTok:    Black → Gray (Dark: White → Gray)
YouTube:   Red → Dark Red gradient
LinkedIn:  Blue → Navy gradient
```

### Account Cards:
```
┌──────────────────────────────────────┐
│  @producer_main                      │
│  [Personal] badge                    │
│                        [🔗] [🗑️]    │
└──────────────────────────────────────┘
```

### States:
- **Default** - Gray border, muted background
- **Hover** - Border color intensifies
- **Loading** - Spinner replaces icon
- **Error** - Red border + toast notification

---

## Integration with Existing Systems

### 1. **Profile Preview**
The `PhonePreview` component automatically shows all accounts:
```typescript
// Fetches all accounts
const socialAccounts = useQuery(
  api.socialMedia?.getSocialAccounts,
  store ? { storeId: store._id } : "skip"
);

// Displays in "Connect" section
{socialAccountsWithIcons.map(account => (
  <Badge>{account.accountLabel || account.platform}</Badge>
))}
```

### 2. **Public Storefront**
The `DesktopStorefront` component displays all in "Connect With Me" section:
- Shows all active & connected accounts
- Platform-specific colors & icons
- Clickable links to profiles
- Account labels as badges

### 3. **OAuth Accounts**
Accounts connected via OAuth (from `/store/[storeId]/social`) automatically appear here too:
- OAuth accounts have full access tokens
- Manual accounts have `accessToken: "manual"`
- Both types display identically
- Both appear on public storefront

---

## Validation & Error Handling

### Client-Side Validation:
```typescript
✅ Username required
✅ Platform selected
✅ No duplicate platform+username combo
⚠️ Shows toast if validation fails
```

### Server-Side Validation:
```typescript
✅ Checks if account already exists
✅ Updates if exists, creates if new
✅ Sanitizes username (removes @)
✅ Validates store ownership
```

### Error Messages:
- "Missing information" - Username empty
- "Failed to add account" - Server error
- "Failed to remove account" - Deletion error

---

## Code Structure

### Components:
```
app/(dashboard)/store/profile/
├── page.tsx                          (Profile page layout)
├── components/
    ├── HeaderForm.tsx                (Name, bio, avatar)
    ├── MultipleSocialAccounts.tsx    (NEW - Manage accounts)
    └── PhonePreview.tsx              (Live preview)
```

### Mutations Used:
```typescript
api.socialMedia.connectSocialAccount()  // Add account
api.socialMedia.disconnectSocialAccount() // Remove account
api.socialMedia.updateAccountLabel()    // Update label
api.socialMedia.getSocialAccounts()     // Fetch all
```

---

## Benefits

✅ **No OAuth Required** - Simple manual entry  
✅ **Unlimited Accounts** - Add as many as needed  
✅ **Clear Labels** - Distinguish between accounts  
✅ **Real-Time Preview** - See changes immediately  
✅ **Public Display** - All accounts on storefront  
✅ **Easy Management** - Add/remove in seconds  
✅ **Professional Look** - Platform-specific styling  
✅ **Flexible** - Works with OAuth or manual entry  

---

## Testing Checklist

- [ ] Add single Instagram account
- [ ] Add second Instagram account with label
- [ ] Add accounts for all platforms
- [ ] Remove account
- [ ] Verify preview updates
- [ ] Check public storefront display
- [ ] Test username formats (@username, URLs)
- [ ] Test empty label
- [ ] Test long labels
- [ ] Test mobile responsiveness

---

## Future Enhancements (Optional)

- [ ] Drag & drop to reorder accounts
- [ ] Toggle visibility per account
- [ ] Import from OAuth in one click
- [ ] Show follower counts (if OAuth)
- [ ] Bulk import from CSV
- [ ] Account verification badges
- [ ] Analytics per account

---

## Files Modified

1. **Created:**
   - `app/(dashboard)/store/profile/components/MultipleSocialAccounts.tsx`

2. **Updated:**
   - `app/(dashboard)/store/profile/page.tsx`

---

## Related Documentation

- `MULTIPLE_SOCIAL_ACCOUNTS_IMPLEMENTATION.md` - How accounts display on storefront
- `SOCIAL_LINKS_CLARIFICATION.md` - Display links vs connected accounts
- `convex/socialMedia.ts` - Social account API

