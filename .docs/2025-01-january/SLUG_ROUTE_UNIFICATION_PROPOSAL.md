# Slug Route Unification Proposal

## 🎯 The Problem

Currently you have **TWO different slug routes** serving different purposes:

1. **`/[slug]`** → Store storefront (products, courses, selling)
2. **`/artist/[slug]`** → Artist profile (music showcase, social links, no selling)

**But some users want:**
- Just an artist profile (like Linktree) - showcase music, social links
- No selling, no products
- Same `/slug` route should work for both

---

## 💡 The Solution: Unified `/slug` Route

Make `/[slug]` smart enough to detect what type of page it should be:

### Detection Logic:

```
User visits: /[slug]
  ↓
Check: Does this slug have a store?
  ├─ YES → Show store storefront (products, courses)
  └─ NO → Check: Does this slug have an artist profile?
      ├─ YES → Show artist profile (music, social links)
      └─ NO → 404
```

---

## 🎨 Two Modes in One Route

### Mode 1: Store Storefront (Current `/slug`)
**When:** User has a store with products/courses

**Shows:**
- Store name, bio, avatar
- Products grid (courses, digital products)
- Social links
- Lead magnets
- "Get Started" CTA for creators

**Use Case:** Creators selling products

---

### Mode 2: Artist Profile (Current `/artist/[slug]`)
**When:** User has artist profile but NO store (or store with no products)

**Shows:**
- Artist name, bio, avatar
- Music tracks (from URLs)
- Social links (Instagram, Spotify, etc.)
- Clean, minimal design
- No products section

**Use Case:** Artists showcasing music, Linktree-style

---

## 🔄 Implementation Strategy

### Option A: Smart Detection (Recommended)

**File:** `app/[slug]/page.tsx`

```typescript
export default function UnifiedSlugPage({ params }) {
  const { slug } = use(params);
  
  // Check both store and artist profile
  const store = useQuery(api.stores.getStoreBySlug, { slug });
  const artistProfile = useQuery(api.musicShowcase.getArtistProfileBySlug, { slug });
  
  // Determine page type
  const hasStore = !!store;
  const hasProducts = store && (products?.length > 0 || courses?.length > 0);
  const hasArtistProfile = !!artistProfile;
  
  // Decision logic
  if (hasStore && hasProducts) {
    // Show store storefront
    return <StoreStorefront store={store} products={products} />;
  } else if (hasArtistProfile) {
    // Show artist profile
    return <ArtistProfile profile={artistProfile} />;
  } else {
    // 404
    return notFound();
  }
}
```

---

### Option B: Separate Routes (Current)

Keep them separate but make it easier:
- `/[slug]` → Store storefront
- `/artist/[slug]` → Artist profile

**Problem:** Users need to know which one to use

---

## 🎯 Recommended Approach: Unified `/slug`

### Benefits:
1. ✅ One URL for everything (`/yourname`)
2. ✅ Automatically shows the right content
3. ✅ Users don't need to choose
4. ✅ Can upgrade from artist profile → store later

### How It Works:

**Artist (No Store):**
```
/[slug] → Shows artist profile
- Music tracks
- Social links
- Clean showcase
```

**Creator (Has Store):**
```
/[slug] → Shows store storefront
- Products
- Courses
- Social links
- Selling focus
```

**Hybrid (Both):**
```
/[slug] → Shows store storefront (selling takes priority)
- Can add link to artist profile
```

---

## 📋 Migration Plan

### Step 1: Update `/[slug]` Route
- Add artist profile detection
- Show appropriate component based on what exists
- Keep backward compatibility

### Step 2: Redirect `/artist/[slug]` → `/[slug]`
- Add redirect for old artist profile URLs
- Maintain SEO

### Step 3: Update Artist Profile Creation
- When creating artist profile, check if store exists
- If no store, use `/slug` route
- If store exists, link to it

---

## 🎨 UI Differences

### Artist Profile Mode:
```
┌─────────────────────────┐
│   Artist Name          │
│   Bio                   │
│   [Social Links]        │
├─────────────────────────┤
│   Music Tracks          │
│   [Play buttons]        │
└─────────────────────────┘
```

### Store Storefront Mode:
```
┌─────────────────────────┐
│   Store Name            │
│   Bio                   │
│   [Social Links]        │
├─────────────────────────┤
│   Products              │
│   [Product cards]       │
│   Courses               │
│   [Course cards]        │
└─────────────────────────┘
```

---

## ✅ Final Recommendation

**Unify `/slug` route** to handle both:
- Automatically detects what to show
- Artist profiles work without a store
- Store storefronts work with products
- One URL for everything (like Linktree)

This way:
- Artists can showcase music without selling
- Creators can sell products
- Both use the same `/slug` route
- Users don't need to choose



