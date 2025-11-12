# Social Links Clarification ✅

## Two Types of Social Accounts

### 1. **Display Social Links** (Public Profile)
**Storage:** `users` table fields
- `instagram` - Public Instagram username/URL to display
- `tiktok` - Public TikTok username/URL to display
- `twitter` - Public Twitter/X username/URL to display
- `youtube` - Public YouTube channel/URL to display
- `website` - Public website URL to display

**Purpose:**
- Shown on public storefront profile
- Displayed in creator cards
- One link per platform for visitors to follow

**Edited in:** `/store/profile` (Profile Settings page)

**Shown in:** 
- Phone Preview
- Actual storefront (`/[slug]`)
- Creator spotlight cards

---

### 2. **Connected Social Accounts** (Automation)
**Storage:** `socialAccounts` table
- Multiple Instagram accounts
- Multiple TikTok accounts
- Multiple Twitter accounts
- Multiple Facebook accounts
- Multiple LinkedIn accounts

**Purpose:**
- Used for post scheduling
- Used for DM automation
- Used for analytics tracking
- OAuth tokens stored for API access
- Each account has `accountLabel` (e.g., "Personal", "Business")

**Connected in:** `/store/[storeId]/social` (Social Media tab)

**Used for:**
- Scheduling posts
- Instagram DM automation
- Cross-posting to multiple accounts
- Social media management

---

## Why Two Systems?

### Display Links (Simple):
- **User-friendly:** Just paste a username or URL
- **No OAuth:** No need to connect via OAuth
- **Public-facing:** What visitors see
- **One per platform:** Keeps profile clean

### Connected Accounts (Powerful):
- **Automation-ready:** Full OAuth access
- **Multiple accounts:** Manage multiple profiles
- **Private:** Tokens not shown publicly
- **Platform-specific:** Each platform has unique requirements

---

## Example Use Case

**Sarah, a music producer:**

1. **Display Links** (Profile Page):
   - Instagram: `@sarahbeats` (her main personal account)
   - TikTok: `@sarahproducer`
   - YouTube: `@SarahBeatsTV`
   - Website: `www.sarahbeats.com`

2. **Connected Accounts** (Social Tab):
   - Instagram #1: `@sarahbeats` (Personal) - for posting music updates
   - Instagram #2: `@sarahbeats_studio` (Business) - for studio content
   - Instagram #3: `@sarahbeats_shop` (Shop) - for product promos
   - TikTok #1: `@sarahproducer` (Main)
   - TikTok #2: `@sarahbehindthescenes` (BTS)

Sarah schedules posts to all 5 accounts from one dashboard, but visitors to her profile only see her main accounts.

---

## Current Implementation ✅

### PhonePreview Component:
**Correctly shows** display links from `users` table:
```typescript
const socialLinks = [
  { icon: Instagram, url: convexUser?.instagram },
  { icon: Video, url: convexUser?.tiktok },
  { icon: Twitter, url: convexUser?.twitter },
  { icon: Youtube, url: convexUser?.youtube },
  { icon: Globe, url: convexUser?.website },
].filter(link => link.url);
```

This is **correct** because:
- It shows what visitors will see
- It's what they're editing on the Profile Settings page
- It keeps the preview simple and accurate

---

## If You Want Multiple Public Links

If you want users to display multiple accounts publicly (e.g., show all 3 Instagram accounts on their profile), you would need to:

1. **Update Profile Form** - Allow multiple URLs per platform
2. **Update `users` schema** - Change from `instagram: string` to `instagram: string[]`
3. **Update PhonePreview** - Show multiple icons per platform
4. **Update Storefront** - Display multiple links per platform

**However**, this is typically **not recommended** because:
- Clutters the profile
- Confuses visitors (which account to follow?)
- Most creators want one "main" public profile per platform
- Multiple accounts are better managed privately via automation

---

## Recommendation ✅

**Keep current implementation:**
- Display links = One per platform (simple, clean)
- Connected accounts = Multiple per platform (powerful, private)

This is the **industry standard** approach used by:
- Linktree (one link per platform)
- Later (scheduling to multiple, showing one)
- Buffer (scheduling to multiple, showing one)

The current PhonePreview is **accurate and correct**! ✅

