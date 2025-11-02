# Multiple Social Accounts Display - Implementation Complete ✅

## What Changed

Users can now connect **multiple social media accounts per platform** (e.g., 3 Instagram accounts, 2 TikTok accounts) and all connected accounts will be displayed on:
1. **Public Storefront** (`/[slug]` page)
2. **Profile Preview** (`/store/profile` page)

---

## Key Updates

### 1. Storefront Page (`app/[slug]/page.tsx`)
**Added:**
- Query to fetch `socialAccounts` from Convex
- Passed `socialAccounts` array to `DesktopStorefront` component

```typescript
// Fetch connected social accounts for this store
const socialAccounts = useQuery(
  api.socialMedia?.getSocialAccounts as any,
  store ? { storeId: store._id } : "skip"
);

<DesktopStorefront 
  // ... other props
  socialAccounts={socialAccounts || []}
/>
```

---

### 2. Desktop Storefront Component (`app/[slug]/components/DesktopStorefront.tsx`)
**Added:**
- `socialAccounts` prop to interface
- Imported `Instagram`, `Twitter`, `Facebook` icons
- New "Connect With Me" section displaying all active social accounts

**Features:**
- Shows platform icon with gradient background
- Displays platform name and username
- Shows optional account label (e.g., "Personal", "Business")
- Links to respective social media profiles
- Hover effects with smooth animations
- Responsive grid layout (2 cols mobile → 4 cols desktop)

**Visual:**
```
┌─────────────────────────────────────┐
│   Connect With Me                   │
├─────────┬─────────┬─────────┬───────┤
│ [📷]    │ [🐦]    │ [💿]    │ [🎵]  │
│Instagram│Twitter  │TikTok   │TikTok │
│@producer│@beats   │@main    │@studio│
│Personal │         │         │BTS    │
└─────────┴─────────┴─────────┴───────┘
```

---

### 3. Phone Preview Component (`app/(dashboard)/store/profile/components/PhonePreview.tsx`)
**Updated:**
- Query to fetch `socialAccounts` from Convex
- Replaced single display links with dynamic multi-account display
- Imported `Facebook`, `Music2` icons
- Filter for active & connected accounts only

**Display Format:**
- Pill-shaped badges with icon, platform name, and username
- Platform-specific colors (Instagram pink, Twitter blue, etc.)
- Account labels shown if set (e.g., "Business", "Shop")
- Truncated usernames for space (max 8 chars)

---

## Platform Support

| Platform  | Icon      | Color               | URL Format                        |
|-----------|-----------|---------------------|-----------------------------------|
| Instagram | 📷        | Purple → Pink       | `instagram.com/{username}`        |
| Twitter   | 🐦        | Blue                | `twitter.com/{username}`          |
| Facebook  | 📘        | Blue                | `facebook.com/{username}`         |
| TikTok    | 🎵        | Black/White         | `tiktok.com/@{username}`          |
| YouTube   | ▶️        | Red                 | `youtube.com/...`                 |
| LinkedIn  | 💼        | Blue                | `linkedin.com/in/{username}`      |

---

## Account Labels

Users can distinguish multiple accounts of the same platform by adding labels:

**Example:**
```typescript
{
  platform: "instagram",
  platformUsername: "@sarahbeats",
  accountLabel: "Personal"  // ← Displays instead of "Instagram"
}

{
  platform: "instagram",
  platformUsername: "@sarahstudio",
  accountLabel: "Business"  // ← Shows "Business" badge
}
```

---

## How It Works

### Data Flow:
1. **User connects accounts** → OAuth flow → Stored in `socialAccounts` table
2. **Storefront queries** → `api.socialMedia.getSocialAccounts({ storeId })`
3. **Filter active accounts** → Only show `isActive && isConnected`
4. **Render with icons** → Platform-specific styling & links

### Database Schema (`convex/schema.ts`):
```typescript
socialAccounts: defineTable({
  storeId: v.string(),
  userId: v.string(),
  platform: v.union("instagram", "twitter", "facebook", "tiktok", "linkedin"),
  platformUserId: v.string(),          // Unique platform ID
  platformUsername: v.optional(v.string()),
  platformDisplayName: v.optional(v.string()),
  accountLabel: v.optional(v.string()), // "Personal", "Business", etc.
  isActive: v.boolean(),
  isConnected: v.boolean(),
  // ... OAuth tokens, etc.
})
```

---

## User Experience

### Before:
- Only ONE social link per platform shown
- Limited to display links from `users` table
- Couldn't showcase multiple accounts

### After:
- **ALL connected accounts** displayed
- Clear labels to distinguish accounts
- Visitors can follow ALL accounts
- Promotes cross-platform engagement

---

## Example Use Case

**Sarah the Producer:**
- Connects 3 Instagram accounts (Personal, Studio, Shop)
- Connects 2 TikTok accounts (Main, Behind-the-scenes)
- Her storefront shows:
  ```
  ┌────────────────────────────────────────────┐
  │          Connect With Me                    │
  ├──────────┬──────────┬──────────┬───────────┤
  │ [📷]     │ [📷]     │ [📷]     │ [🎵]      │
  │Instagram │Instagram │Instagram │TikTok     │
  │@sarahbeat│@sarah... │@sarah... │@sarahprod │
  │Personal  │Studio    │Shop      │           │
  └──────────┴──────────┴──────────┴───────────┘
  ```

- Visitors can follow **all** her accounts in one place
- Each account links directly to the platform

---

## Technical Details

### Filtering Active Accounts:
```typescript
socialAccounts
  .filter(account => account.isActive && account.isConnected)
  .map(account => { ... })
```

### URL Generation:
```typescript
const getPlatformUrl = () => {
  const username = account.platformUsername?.replace('@', '') || '';
  switch (account.platform) {
    case "instagram":
      return `https://instagram.com/${username}`;
    case "twitter":
      return `https://twitter.com/${username}`;
    // ... etc
  }
};
```

### Visual Styling:
- Gradient backgrounds per platform
- Hover effects (scale, shadow, translate)
- External link icon on hover
- Responsive grid layout
- Dark mode support

---

## Benefits

✅ **Showcase all accounts** - No longer limited to one per platform  
✅ **Clear labeling** - "Personal", "Business", "Shop" badges  
✅ **Professional look** - Platform-specific colors & icons  
✅ **Better engagement** - Visitors can follow multiple accounts  
✅ **Accurate preview** - What you see is what visitors get  
✅ **Flexible** - Add/remove accounts anytime  

---

## Files Modified

1. `app/[slug]/page.tsx` - Added socialAccounts query & prop
2. `app/[slug]/components/DesktopStorefront.tsx` - Added "Connect With Me" section
3. `app/(dashboard)/store/profile/components/PhonePreview.tsx` - Updated preview to show all accounts

---

## Testing

Visit your storefront and check:
1. ✅ All connected accounts appear in "Connect With Me" section
2. ✅ Icons and colors match the platform
3. ✅ Account labels display correctly
4. ✅ Links open to correct social profiles
5. ✅ Profile preview shows same accounts
6. ✅ Responsive on mobile/tablet/desktop

---

## Next Steps (Optional)

- [ ] Add social account statistics (followers, posts)
- [ ] Show account verification badges
- [ ] Reorder accounts via drag & drop
- [ ] Hide/show specific accounts from storefront
- [ ] Custom link text per account

---

## Related Documentation

- `SOCIAL_LINKS_CLARIFICATION.md` - Explains display links vs connected accounts
- `convex/socialMedia.ts` - Social account management API
- `convex/schema.ts` - Database schema for socialAccounts table

