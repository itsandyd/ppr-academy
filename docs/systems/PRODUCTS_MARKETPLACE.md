# Digital Products & Marketplace System

> **Last Updated:** 2026-02-19
> **Pass:** 2 — System Deep Dive
> **Key Files:** `convex/digitalProducts.ts` (2048 lines), `convex/bundles.ts`, `convex/beatLeases.ts`, `convex/followGateSubmissions.ts`, `convex/coupons.ts`, `convex/affiliates.ts`, `convex/marketplace.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Product Categories](#2-product-categories)
- [3. Product Schema](#3-product-schema)
- [4. Product Lifecycle](#4-product-lifecycle)
- [5. Beat Licensing System](#5-beat-licensing-system)
- [6. Bundle System](#6-bundle-system)
- [7. Follow Gate (Lead Magnet)](#7-follow-gate-lead-magnet)
- [8. Coupon System](#8-coupon-system)
- [9. Affiliate Program](#9-affiliate-program)
- [10. Marketplace Discovery](#10-marketplace-discovery)
- [11. Download & Delivery](#11-download--delivery)
- [12. Creator Storefronts](#12-creator-storefronts)
- [13. Purchase Tracking](#13-purchase-tracking)
- [14. Technical Debt](#14-technical-debt)
- [15. Security Patterns](#15-security-patterns)

---

## 1. System Overview

The marketplace is a unified digital commerce platform supporting 26+ product categories with specialized features per type (beat licensing tiers, sample pack browsers, preset compatibility, coaching sessions). Products are stored in a single `digitalProducts` mega-table with type-specific optional fields, enabling a unified query and CRUD layer.

**Key architectural decisions:**
- Single `digitalProducts` table with union types (vs. per-type tables)
- Unified `purchases` table for all transaction types
- Follow gates convert free products into lead magnets
- Beat licensing uses snapshot-based contracts (terms frozen at purchase time)

---

## 2. Product Categories

### Complete Category Enum

```
sample-pack       preset-pack       midi-pack         bundle
effect-chain      ableton-rack      beat-lease        project-files
mixing-template   coaching          mixing-service    mastering-service
playlist-curation course            workshop          masterclass
pdf               pdf-guide         cheat-sheet       template
blog-post         community         tip-jar           donation
release           lead-magnet
```

### Product Type Classification

| productType | Usage |
|-------------|-------|
| `digital` | Default downloadable products |
| `urlMedia` | YouTube/Spotify/website embeds |
| `coaching` | Session booking products |
| `effectChain` | Audio effect chains |
| `abletonRack` | Ableton-specific racks |
| `abletonPreset` | Ableton preset files |
| `playlistCuration` | Curator playlist submissions |

---

## 3. Product Schema

### Core Fields (All Products)

```typescript
{
  title: string
  description?: string
  price: number                    // In dollars
  imageUrl?: string
  slug?: string
  storeId: string                  // Parent store
  userId: string                   // Creator Clerk ID
  isPublished?: boolean
  productCategory?: string         // 26+ values
  productType?: string             // 7 values
  isPinned?: boolean
  pinnedAt?: number
}
```

### Beat-Specific Fields

```typescript
{
  beatLeaseConfig?: {
    tiers: [{
      type: "basic" | "premium" | "exclusive" | "unlimited"
      enabled: boolean
      price: number
      name: string
      distributionLimit?: number
      streamingLimit?: number
      commercialUse: boolean
      musicVideoUse: boolean
      radioBroadcasting: boolean
      stemsIncluded: boolean
      creditRequired: boolean
    }]
    bpm?: number
    key?: string
    genre?: string
  }
  wavUrl?: string
  stemsUrl?: string
  trackoutsUrl?: string
  exclusiveSoldAt?: number         // Timestamp when exclusively sold
  exclusiveSoldTo?: string         // User ID of exclusive buyer
}
```

### DAW/Plugin-Specific Fields

```typescript
{
  dawType?: "ableton" | "fl-studio" | "logic" | "bitwig" | "studio-one" | "reason" | "cubase" | "multi-daw"
  dawVersion?: string
  targetPlugin?: string            // "serum", "vital", "massive", etc.
  targetPluginVersion?: string
  genre?: string[]
  tags?: string[]
}
```

### Ableton Rack Fields

```typescript
{
  abletonVersion?: string
  rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack"
  effectType?: string[]
  macroCount?: number
  cpuLoad?: "low" | "medium" | "high"
  complexity?: "beginner" | "intermediate" | "advanced"
  fileFormat?: "adg" | "adv" | "alp"
  fileSize?: number
}
```

### Follow Gate Fields

```typescript
{
  followGateEnabled?: boolean
  followGateRequirements?: {
    requireEmail?: boolean
    requireInstagram?: boolean
    requireTiktok?: boolean
    requireYoutube?: boolean
    requireSpotify?: boolean
    minFollowsRequired?: number
  }
  followGateSocialLinks?: { instagram?, tiktok?, youtube?, spotify? }
  followGateMessage?: string
}
```

### Order Bump & Affiliate Fields

```typescript
{
  orderBumpEnabled?: boolean
  orderBumpProductName?: string
  orderBumpPrice?: number
  affiliateEnabled?: boolean
  affiliateCommissionRate?: number   // 0-50%
  affiliateCookieDuration?: number   // Days
}
```

---

## 4. Product Lifecycle

```
CREATE → CONFIGURE → PUBLISH → SELL → DELIVER
  │         │           │        │       │
  │    Set pricing    Toggle   Stripe  Download URL
  │    Add files      publish  checkout or packFiles
  │    Follow gate              session
  │    Beat tiers
  │    Affiliate
```

### Key Mutations

| Function | Purpose |
|----------|---------|
| `createProduct(title, price, storeId, userId, ...)` | Create any product type |
| `updateProduct(id, ...)` | Update metadata, pricing, files |
| `publishProduct(productId)` | Make visible in marketplace |
| `deleteProduct(id, userId)` | Delete with ownership check |

### Duplicate Creation Paths (Technical Debt)

There are three product creation paths that should be consolidated:
1. `createProduct` — Simple creation
2. `createUniversalProduct` — Comprehensive with all fields
3. `createUrlMediaProduct` — Media-only products

---

## 5. Beat Licensing System

### Tier Structure

| Tier | Typical Price | Files | Commercial | Stems | Exclusive |
|------|-------------|-------|------------|-------|-----------|
| Basic | $29 | MP3, WAV | No | No | No |
| Premium | $79 | MP3, WAV, Stems | Yes | Yes | No |
| Exclusive | $249 | All + Trackouts | Yes | Yes | Yes (removes from market) |
| Unlimited | $399 | All + Trackouts | Yes | Yes | No |

### Purchase Flow

```
1. validateBeatTier → Check tier exists and is enabled
2. Stripe checkout with tier-specific price
3. Webhook → createBeatLicensePurchase (internal mutation)
4. Create purchase record (productType: "beatLease")
5. Create beatLicense record (snapshot of tier terms)
6. If exclusive: markBeatAsExclusivelySold → isPublished=false
7. Trigger email workflow with license agreement
```

### Contract Snapshot

Beat license terms are **frozen at purchase time** in the `beatLicenses` table. If the creator later changes tier pricing or terms, existing licenses remain unchanged. This is critical for legal compliance.

```typescript
beatLicenses: {
  purchaseId: Id<"purchases">
  beatId: Id<"digitalProducts">
  tierType: "basic" | "premium" | "exclusive" | "unlimited"
  price: number
  distributionLimit?: number
  streamingLimit?: number
  commercialUse: boolean
  stemsIncluded: boolean
  buyerEmail: string
  beatTitle: string
  producerName: string
}
```

### Exclusive Beat Handling

**Race condition concern:** Multiple users could purchase exclusive tier simultaneously. No transaction/atomic check-and-set exists for `exclusiveSoldAt`. The system relies on Stripe checkout session uniqueness but this is not bulletproof.

---

## 6. Bundle System

### Bundle Structure (`convex/bundles.ts`)

```typescript
bundles: {
  bundleType: "course_bundle" | "mixed" | "product_bundle"
  courseIds: Id<"courses">[]
  productIds: Id<"digitalProducts">[]
  originalPrice: number          // Sum of component prices
  bundlePrice: number            // Discounted price
  discountPercentage: number     // Auto-calculated
  savings: number                // Dollar amount saved
  availableFrom?: number         // Optional availability window
  availableUntil?: number
  maxPurchases?: number          // Purchase cap
  followGateEnabled?: boolean    // Free bundles with gate
  totalPurchases: number
  totalRevenue: number
}
```

### Auto-Pricing

Bundle discount is auto-calculated from component prices:
```
originalPrice = sum(course prices) + sum(product prices)
savings = originalPrice - bundlePrice
discountPercentage = (savings / originalPrice) * 100
```

### Bundle Access

Purchasing a bundle grants access to all included courses and products. Access is checked via `courseAccess.checkBundleAccess()` for courses and purchase records for products.

---

## 7. Follow Gate (Lead Magnet)

### Complete Flow

```
Creator configures: price=0, followGateEnabled=true
  ↓
User visits product page → Shows gate form
  ↓
submitFollowGate({ productId, email, followedPlatforms })
  ↓
Rate limit: max 5 submissions/email/hour
  ↓
Create followGateSubmission record
  ↓
Schedule emailContactSync (add to email list)
  ↓
User can download → trackFollowGateDownload(submissionId)
  ↓
Creator sees analytics: conversion rate, platform breakdown
```

### Analytics Query

```typescript
getFollowGateAnalytics(productId | creatorId | storeId)
→ {
    totalSubmissions,
    totalDownloads,
    platformBreakdown: { instagram, tiktok, youtube, spotify },
    conversionRate,
    recentSubmissions
  }
```

---

## 8. Coupon System

### Coupon Validation (`convex/coupons.ts`)

Validates 7 conditions in order:
1. Code exists and is active
2. Within valid date range
3. Max uses not exceeded
4. Per-user max uses not exceeded
5. `firstTimeOnly` → user has no prior purchases
6. Minimum purchase amount met
7. Applicable to item type/specific items

### Discount Calculation

```typescript
if (discountType === "percentage") {
  discountAmount = Math.round((purchaseAmount * discountValue) / 100);
} else {
  discountAmount = discountValue;  // fixed_amount in cents
}
discountAmount = Math.min(discountAmount, purchaseAmount); // Cap at purchase amount
```

### Bulk Operations

```typescript
bulkCreateCoupons({ storeId, prefix, count, discountType, validFrom, ... })
// Creates up to 100 coupons with random suffixes
// All bulk coupons auto-set maxUsesPerUser=1
```

---

## 9. Affiliate Program

### Commission Structure

```typescript
affiliates: {
  commissionRate: number           // 0-50%, default 20%
  commissionType: "percentage"     // Only type supported
  cookieDuration: number           // Days, default 30
  totalClicks, totalSales, totalRevenue, totalCommissionEarned, totalCommissionPaid
}
```

### Affiliate Lifecycle

```
applyForAffiliate → status: "pending"
     ↓
approveAffiliate → status: "active", set commission rate
     ↓
Affiliate shares link: /product?aff=CODE
     ↓
trackAffiliateClick → cookie set for 30 days
     ↓
User purchases → recordAffiliateSale → commissionStatus: "pending"
     ↓
Creator approves → commissionStatus: "approved"
     ↓
Payout → commissionStatus: "paid"
```

### Fraud Concerns

No velocity checks, no minimum payout thresholds enforced, no fraud detection on click patterns. Recommended for future improvement.

---

## 10. Marketplace Discovery

### Unified Search (`convex/marketplace.ts`)

```typescript
searchMarketplace({
  contentType?: "all" | "courses" | "products" | "coaching" | "sample-packs" | "plugins" | "ableton-racks" | "bundles"
  category?: string
  priceRange?: "free" | "under-50" | "50-100" | "over-100"
  sortBy?: "newest" | "popular" | "price-low" | "price-high"
})
```

### Discovery Queries

| Query | Purpose |
|-------|---------|
| `getFeaturedContent` | Random mix for homepage |
| `getPlatformStats` | Total creators, courses, products, students |
| `getCreatorSpotlight` | Top creator by product count |
| `getAllCreators` | Browse creators with stats |
| `getMarketplaceCategories` | Unique categories from published content |

### Marketplace Sections (15 routes)

`/marketplace/products`, `/marketplace/beats`, `/marketplace/courses`, `/marketplace/bundles`, `/marketplace/guides`, `/marketplace/memberships`, `/marketplace/mixing-services`, `/marketplace/mixing-templates`, `/marketplace/plugins`, `/marketplace/preset-packs`, `/marketplace/project-files`, `/marketplace/samples`, `/marketplace/ableton-racks`, `/marketplace/coaching`, `/marketplace/creators`

---

## 11. Download & Delivery

### Two Delivery Strategies

**1. Direct `downloadUrl`:**
- Can be Convex storage ID → resolved to signed URL
- Or external URL (AWS S3, etc.)

**2. `packFiles` (sample/preset packs):**
- JSON stringified array: `[{ id, name, url, storageId, size, type }]`
- Storage IDs converted to signed URLs on query

### Access Verification

```typescript
// Paid products: check purchase exists
if (!purchase || purchase.status !== "completed") throw new Error("Access denied");

// Follow-gated products: check submission exists
const submission = await checkFollowGateSubmission(productId, email);
if (!submission) throw new Error("Must complete follow gate");

// Beat licenses: deliver tier-appropriate files
// basic: mp3, wav | premium: + stems | exclusive/unlimited: + trackouts
```

---

## 12. Creator Storefronts

### Store Routes (`app/[slug]/`)

| Route | Content |
|-------|---------|
| `/[slug]` | Store home with all products |
| `/[slug]/courses` | Store courses |
| `/[slug]/products` | Store digital products |
| `/[slug]/beats` | Store beats with player |
| `/[slug]/memberships` | Creator subscription tiers |
| `/[slug]/coaching` | Coaching products |
| `/[slug]/bundles` | Product bundles |
| `/[slug]/tips` | Tip jar |
| `/[slug]/p/[pageSlug]` | Landing pages |

### Custom Domain Support

Middleware intercepts non-primary domains, queries for matching `store.customDomain`, and rewrites to `[slug]` route.

---

## 13. Purchase Tracking

### Purchases Table

```typescript
purchases: {
  userId: string                  // Buyer
  productId?: Id<"digitalProducts">
  courseId?: Id<"courses">
  bundleId?: Id<"bundles">
  storeId: string                 // Seller's store
  amount: number                  // In cents
  status: "pending" | "completed" | "refunded"
  productType: "digitalProduct" | "course" | "coaching" | "bundle" | "beatLease"
  accessGranted?: boolean
  downloadCount?: number
  affiliateId?: Id<"affiliates">
  affiliateCommission?: number
}
```

### Analytics

```typescript
getCreatorDashboardAnalytics(storeId)
→ { totalRevenue, monthRevenue, totalSales, totalEnrollments, recentSales[] }

getStorePurchaseStats(storeId, timeRange)
→ { totalPurchases, completedPurchases, totalRevenue, averageOrderValue }
```

---

## 14. Technical Debt

### High Priority

| Issue | Impact |
|-------|--------|
| Duplicate product creation paths (3 functions) | Unclear canonical path |
| No exclusive beat race condition protection | Two users could buy exclusive simultaneously |
| File cleanup on product delete | Orphaned Convex storage files accumulate |
| Order bumps: fields exist, no checkout logic | Feature incomplete |

### Medium Priority

| Issue | Impact |
|-------|--------|
| Marketplace N+1 queries | Fetches store, user, purchases per product |
| Sample pack dual system | Dedicated `samplePacks` table AND `digitalProducts` with category |
| Ableton rack → effect-chain migration | Legacy category still in use |
| No product analytics queries | downloadCount tracked but no dashboard |

### Low Priority

| Issue | Impact |
|-------|--------|
| Playlist curation incomplete | Schema exists, no implementation |
| Follow gate email sync | No unsubscribe handling for gated contacts |
| Affiliate fraud detection | No velocity checks |

---

## 15. Security Patterns

### Authentication

```typescript
// Owner-only mutations
await requireStoreOwner(ctx, args.storeId);

// User verification
if (product.userId !== identity.subject) throw new Error("Unauthorized");
```

### Rate Limiting

```typescript
// Follow gate: max 5 submissions/email/hour
const recentSubmissions = await ctx.db.query("followGateSubmissions")
  .withIndex("by_email", q => q.eq("email", email))
  .filter(q => q.gte(q.field("submittedAt"), oneHourAgo))
  .take(5000);
if (recentSubmissions.length >= 5) throw new Error("Too many requests");
```

### Soft Deletes

```typescript
// Bundles with purchases: deactivate only
if (bundle.totalPurchases > 0) {
  await ctx.db.patch(bundleId, { isActive: false, isPublished: false });
} else {
  await ctx.db.delete(bundleId); // Hard delete if no purchases
}
```

---

*NEEDS EXPANSION IN PASS 3: Product review system details, category-specific marketplace pages deep dive, order bump implementation plan, download analytics, product recommendation engine, SEO optimization per product type.*
