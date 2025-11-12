# Cleanup: Removed Duplicate Social Links Section ✅

## What Was Fixed

Removed the old single-link social fields from `HeaderForm.tsx` to avoid confusion now that we have the new `MultipleSocialAccounts` component.

---

## Before (Confusing):

```
┌────────────────────────────────────┐
│  Profile Edit Form                 │
│  - Display Name                    │
│  - Bio                             │
│  - Social Links (URL) ← OLD        │
│    • Instagram                     │
│    • TikTok                        │
│    • More socials (accordion)      │
│      - Twitter                     │
│      - YouTube                     │
│      - Website                     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Social Media Accounts ← NEW       │
│  (Full management system)          │
│  - Multiple accounts per platform  │
│  - Custom labels                   │
│  - Add/Remove accounts             │
└────────────────────────────────────┘
```

**Problem:** Users saw TWO places to add social links! 😵

---

## After (Clean):

```
┌────────────────────────────────────┐
│  Profile Edit Form                 │
│  - Display Name                    │
│  - Bio                             │
│  [Save Changes]                    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Social Media Accounts             │
│  (Full management system)          │
│  - Multiple accounts per platform  │
│  - Custom labels                   │
│  - Add/Remove accounts             │
└────────────────────────────────────┘
```

**Solution:** One clear place for social accounts! ✅

---

## Changes Made

### 1. Removed Old Social Fields
**File:** `app/(dashboard)/store/profile/components/HeaderForm.tsx`

**Removed:**
- `socials` fieldset (lines 289-334)
- Instagram input field
- TikTok input field
- "More socials" accordion
  - Twitter input
  - YouTube input
  - Website input

### 2. Cleaned Up Imports
**Removed unused imports:**
- `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger`
- `Instagram`, `Music`, `Twitter`, `Youtube`, `Globe`, `Video` icons
- `SocialField` component

### 3. Updated Schema
**Before:**
```typescript
const headerSchema = z.object({
  name: z.string().max(50),
  bio: z.string().max(80),
  socials: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    website: z.string().optional(),
  }),
});
```

**After:**
```typescript
const headerSchema = z.object({
  name: z.string().max(50),
  bio: z.string().max(80),
});
```

### 4. Updated Form Default Values
**Before:**
```typescript
defaultValues: {
  name: "",
  bio: "",
  socials: {
    instagram: "",
    tiktok: "",
    twitter: "",
    youtube: "",
    website: "",
  },
}
```

**After:**
```typescript
defaultValues: {
  name: "",
  bio: "",
}
```

### 5. Updated Form Reset
**Before:**
```typescript
reset({
  name: displayName,
  bio: convexUser.bio || "",
  socials: {
    instagram: convexUser.instagram || "",
    tiktok: convexUser.tiktok || "",
    twitter: convexUser.twitter || "",
    youtube: convexUser.youtube || "",
    website: convexUser.website || "",
  },
});
```

**After:**
```typescript
reset({
  name: displayName,
  bio: convexUser.bio || "",
});
```

### 6. Updated Submit Handler
**Before:**
```typescript
await updateUser({
  clerkId: clerkUser.id,
  name: data.name,
  bio: data.bio,
  instagram: data.socials.instagram,
  tiktok: data.socials.tiktok,
  twitter: data.socials.twitter,
  youtube: data.socials.youtube,
  website: data.socials.website,
});
```

**After:**
```typescript
await updateUser({
  clerkId: clerkUser.id,
  name: data.name,
  bio: data.bio,
});
```

---

## User Flow Now

### Profile Settings Page (`/store/profile`)

**Section 1: Basic Info**
```
┌─────────────────────────────────────┐
│  Profile Visibility                 │
│  [Toggle Public/Private]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Profile Edit Form                  │
│  • Avatar Upload                    │
│  • Display Name                     │
│  • Bio (80 chars)                   │
│  [Save Changes]                     │
└─────────────────────────────────────┘
```

**Section 2: Social Accounts**
```
┌─────────────────────────────────────┐
│  Social Media Accounts              │
│  Add multiple accounts per platform │
│                                     │
│  [📷] Instagram       2 accounts    │
│  [🐦] Twitter         1 account     │
│  [🎵] TikTok          1 account     │
│                                     │
│  [+ Add Social Account]             │
└─────────────────────────────────────┘
```

---

## Benefits of This Change

✅ **No Confusion** - One clear place for social accounts  
✅ **More Powerful** - Multiple accounts per platform  
✅ **Cleaner UI** - Simpler basic info form  
✅ **Better UX** - Dedicated section for social management  
✅ **Flexible** - Add unlimited accounts with labels  

---

## Migration Note

**Important:** The old single social links (`users.instagram`, `users.twitter`, etc.) are still in the database but are no longer edited via the profile form. Users should migrate to the new `MultipleSocialAccounts` system.

**Old data won't be lost**, it's just not edited here anymore. If you want to preserve old links, you could:
1. Automatically import them as accounts in `MultipleSocialAccounts`
2. Or show a migration banner

---

## Files Modified

1. `app/(dashboard)/store/profile/components/HeaderForm.tsx`
   - Removed old social fields section
   - Cleaned up imports
   - Updated schema, form, and submit handler

---

## Testing

- [x] Profile page loads without errors
- [x] Basic info form (name, bio) still works
- [x] Social accounts section shows below
- [x] No duplicate social fields
- [x] Save changes only updates name/bio
- [x] Social accounts managed separately

---

## Result

Clean, focused UI with dedicated sections:
- **Basic Info** = Name, Bio, Avatar
- **Social Accounts** = Full management system

No more confusion! 🎉

