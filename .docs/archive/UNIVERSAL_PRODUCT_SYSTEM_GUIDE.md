# 🚀 Universal Product System - Implementation Guide

## 📊 Executive Summary

**Goal**: Create a unified product creation experience where creators can offer ANY product type with flexible monetization:
- **Free with Download Gate** (email + social follows like Spotify/Instagram)
- **Paid** (direct purchase)

### Current State Analysis

✅ **Already Implemented:**
- Follow Gate system (email + 4 social platforms)
- Playlist curator system (free/paid submissions)
- Digital products (sample packs, presets, Ableton racks, etc.)
- Courses, coaching calls

❌ **Issues:**
- Fragmented creation flows (8+ different routes)
- Follow gates only on lead magnets
- Playlists not integrated as products
- No unified "create product" page

---

## 🎯 Product Types & Monetization Matrix

| Product Type | Free + Download Gate | Paid | Notes |
|--------------|---------------------|------|-------|
| **Sample Packs** | ✅ | ✅ | Digital downloads |
| **Preset Packs** | ✅ | ✅ | Serum, Vital, etc. |
| **Ableton Racks** | ✅ | ✅ | Audio effect racks |
| **Beat Leases** | ✅ | ✅ | Exclusive/non-exclusive |
| **Project Files** | ✅ | ✅ | DAW project templates |
| **Mixing Templates** | ✅ | ✅ | Processing chains |
| **Mini Packs** | ✅ | ✅ | Small sample collections |
| **Lead Magnets** | ✅ | ❌ | Always free |
| **Courses** | ❌ | ✅ | Too complex for free gate |
| **Coaching/Workshops** | ❌ | ✅ | Service-based, doesn't make sense |
| **Masterclasses** | ❌ | ✅ | High-value content |
| **Playlist Curation** | ✅ | ✅ | **NEW** - Submission reviews |

---

## 🗄️ Database Schema Changes

### 1. Extend `digitalProducts` Table

**File**: `convex/schema.ts`

```typescript
digitalProducts: defineTable({
  // ... existing fields ...
  
  // UPDATED: Expand productType to include playlist
  productType: v.optional(v.union(
    v.literal("digital"),           // Generic digital download
    v.literal("urlMedia"),          // Embeddable media
    v.literal("coaching"),          // 1:1 sessions
    v.literal("abletonRack"),       // Ableton racks
    v.literal("abletonPreset"),     // Ableton presets
    v.literal("playlistCuration"),  // 🆕 Playlist curation service
  )),
  
  // UPDATED: Add specific product categories
  productCategory: v.optional(v.union(
    // Music Production
    v.literal("sample-pack"),
    v.literal("preset-pack"),
    v.literal("ableton-rack"),
    v.literal("beat-lease"),
    v.literal("project-files"),
    v.literal("mixing-template"),
    v.literal("mini-pack"),
    v.literal("lead-magnet"),
    
    // Services
    v.literal("coaching"),
    v.literal("mixing-service"),
    v.literal("mastering-service"),
    
    // Curation
    v.literal("playlist-curation"), // 🆕
    
    // Education
    v.literal("course"),
    v.literal("workshop"),
    v.literal("masterclass"),
  )),
  
  // 🆕 Playlist Curation Fields
  playlistCurationConfig: v.optional(v.object({
    linkedPlaylistId: v.optional(v.id("curatorPlaylists")), // Link to existing playlist
    reviewTurnaroundDays: v.optional(v.number()), // SLA (e.g., 3-7 days)
    genresAccepted: v.optional(v.array(v.string())), // Genres curator accepts
    submissionGuidelines: v.optional(v.string()), // Custom guidelines
    maxSubmissionsPerMonth: v.optional(v.number()), // Rate limiting
  })),
  
  // ✅ EXISTING: Follow Gate (already implemented)
  followGateEnabled: v.optional(v.boolean()),
  followGateRequirements: v.optional(v.object({
    requireEmail: v.optional(v.boolean()),
    requireInstagram: v.optional(v.boolean()),
    requireTiktok: v.optional(v.boolean()),
    requireYoutube: v.optional(v.boolean()),
    requireSpotify: v.optional(v.boolean()),
    minFollowsRequired: v.optional(v.number()),
  })),
  followGateSocialLinks: v.optional(v.object({
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    youtube: v.optional(v.string()),
    spotify: v.optional(v.string()),
  })),
  followGateMessage: v.optional(v.string()),
  
  // ... rest of existing fields ...
})
```

### 2. Link Playlists to Products

**File**: `convex/schema.ts`

```typescript
curatorPlaylists: defineTable({
  // ... existing fields ...
  
  // 🆕 Link to product listing (optional)
  linkedProductId: v.optional(v.id("digitalProducts")),
  
  // ... rest of existing fields ...
})
```

---

## 🏗️ Implementation Phases

### Phase 1: Backend Foundation (Week 1)

#### 1.1 Update Schema
- [x] Extend `digitalProducts.productType` to include `playlistCuration`
- [ ] Add `productCategory` field for granular filtering
- [ ] Add `playlistCurationConfig` for playlist-specific settings
- [ ] Add `linkedProductId` to `curatorPlaylists` table

#### 1.2 Create Backend Functions

**New File**: `convex/universalProducts.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Universal Product Creation
 * Handles all product types with flexible pricing
 */
export const createUniversalProduct = mutation({
  args: {
    // Core fields
    title: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    productType: v.union(
      v.literal("digital"),
      v.literal("playlistCuration"),
      v.literal("abletonRack"),
      v.literal("coaching"),
    ),
    productCategory: v.string(), // "sample-pack", "playlist-curation", etc.
    
    // Pricing Configuration
    pricingModel: v.union(
      v.literal("free_with_gate"), // Download gate (email + socials)
      v.literal("paid"),            // Direct purchase
    ),
    price: v.number(), // $0 for free_with_gate, >$0 for paid
    
    // Follow Gate Config (if pricingModel = "free_with_gate")
    followGateConfig: v.optional(v.object({
      requireEmail: v.boolean(),
      requireInstagram: v.boolean(),
      requireTiktok: v.boolean(),
      requireYoutube: v.boolean(),
      requireSpotify: v.boolean(),
      minFollowsRequired: v.number(),
      socialLinks: v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
      }),
      customMessage: v.optional(v.string()),
    })),
    
    // Playlist Curation Config (if productCategory = "playlist-curation")
    playlistConfig: v.optional(v.object({
      linkedPlaylistId: v.optional(v.id("curatorPlaylists")),
      reviewTurnaroundDays: v.number(),
      genresAccepted: v.array(v.string()),
      submissionGuidelines: v.optional(v.string()),
    })),
    
    // Media
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()), // For digital products
    
    // Metadata
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("digitalProducts"),
  handler: async (ctx, args) => {
    // Validate pricing model
    if (args.pricingModel === "free_with_gate" && args.price !== 0) {
      throw new Error("Free products with download gates must have price = $0");
    }
    
    if (args.pricingModel === "paid" && args.price <= 0) {
      throw new Error("Paid products must have price > $0");
    }
    
    // Create product
    const productId = await ctx.db.insert("digitalProducts", {
      title: args.title,
      description: args.description,
      storeId: args.storeId,
      userId: args.userId,
      productType: args.productType,
      productCategory: args.productCategory,
      price: args.price,
      imageUrl: args.imageUrl,
      downloadUrl: args.downloadUrl,
      tags: args.tags,
      isPublished: false, // Start as draft
      
      // Follow Gate Setup
      followGateEnabled: args.pricingModel === "free_with_gate",
      followGateRequirements: args.followGateConfig ? {
        requireEmail: args.followGateConfig.requireEmail,
        requireInstagram: args.followGateConfig.requireInstagram,
        requireTiktok: args.followGateConfig.requireTiktok,
        requireYoutube: args.followGateConfig.requireYoutube,
        requireSpotify: args.followGateConfig.requireSpotify,
        minFollowsRequired: args.followGateConfig.minFollowsRequired,
      } : undefined,
      followGateSocialLinks: args.followGateConfig?.socialLinks,
      followGateMessage: args.followGateConfig?.customMessage,
      
      // Playlist Curation Setup
      playlistCurationConfig: args.playlistConfig,
      
      // Defaults
      orderBumpEnabled: false,
      affiliateEnabled: false,
    });
    
    // If playlist curation, link product to playlist
    if (args.productCategory === "playlist-curation" && args.playlistConfig?.linkedPlaylistId) {
      await ctx.db.patch(args.playlistConfig.linkedPlaylistId, {
        linkedProductId: productId,
        submissionPricing: {
          isFree: args.pricingModel === "free_with_gate",
          price: args.price,
          currency: "usd",
        },
      });
    }
    
    return productId;
  },
});

/**
 * Get Product with Full Config
 */
export const getUniversalProduct = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    
    // Enrich with linked data
    if (product.productCategory === "playlist-curation" && product.playlistCurationConfig?.linkedPlaylistId) {
      const playlist = await ctx.db.get(product.playlistCurationConfig.linkedPlaylistId);
      return { ...product, linkedPlaylist: playlist };
    }
    
    return product;
  },
});
```

---

### Phase 2: Universal Product Creation UI (Week 2)

#### 2.1 Create Unified Product Flow

**New Route**: `/store/[storeId]/products/create`

**File Structure**:
```
app/(dashboard)/store/[storeId]/products/create/
├── page.tsx                    # Main orchestrator
├── steps/
│   ├── 1-type-selection.tsx    # Choose product type & category
│   ├── 2-pricing-model.tsx     # Free+Gate vs Paid
│   ├── 3-product-details.tsx   # Title, description, media
│   ├── 4-download-gate.tsx     # Follow gate config (if free)
│   ├── 5-specific-config.tsx   # Type-specific fields
│   └── 6-review-publish.tsx    # Final review
```

#### 2.2 Step 1: Type Selection

**Component**: `1-type-selection.tsx`

```tsx
const PRODUCT_CATEGORIES = [
  {
    id: "sample-pack",
    label: "Sample Pack",
    icon: Music,
    description: "Audio samples & loops",
    type: "digital",
  },
  {
    id: "preset-pack",
    label: "Preset Pack",
    icon: Sliders,
    description: "Synth presets (Serum, Vital, etc.)",
    type: "digital",
  },
  {
    id: "ableton-rack",
    label: "Ableton Rack",
    icon: Waves,
    description: "Audio effect racks",
    type: "abletonRack",
  },
  {
    id: "playlist-curation",
    label: "Playlist Curation",
    icon: ListMusic,
    description: "Review & feature tracks on your playlist",
    type: "playlistCuration",
  },
  // ... more categories
];
```

#### 2.3 Step 2: Pricing Model

```tsx
const PRICING_OPTIONS = [
  {
    id: "free_with_gate",
    label: "Free with Download Gate",
    description: "Collect emails & grow your social following",
    icon: Gift,
    features: [
      "Require email address",
      "Optional: Instagram, TikTok, YouTube, Spotify follows",
      "Flexible requirements (e.g., 'Follow 2 out of 4 platforms')",
      "Build your email list",
    ],
    disabled: (category) => ["coaching", "workshop", "masterclass"].includes(category),
  },
  {
    id: "paid",
    label: "Paid Product",
    description: "Direct purchase with instant download",
    icon: DollarSign,
    features: [
      "Set your price",
      "Instant payment via Stripe",
      "Automatic delivery",
      "Order bumps & upsells",
    ],
  },
];
```

#### 2.4 Step 4: Download Gate Configuration

**Reuse Existing**: `components/follow-gates/FollowGateSettings.tsx`

This component is already built and can be imported directly.

---

### Phase 3: Playlist-as-Product Integration (Week 3)

#### 3.1 Update Playlist Creation Flow

**File**: `app/(dashboard)/home/playlists/page.tsx`

Add option during playlist creation:

```tsx
<Checkbox
  checked={createAsProduct}
  onCheckedChange={setCreateAsProduct}
  id="create-as-product"
/>
<Label htmlFor="create-as-product">
  List this playlist as a product in your store
</Label>

{createAsProduct && (
  <Select value={pricingModel} onValueChange={setPricingModel}>
    <SelectItem value="free_with_gate">Free with Download Gate</SelectItem>
    <SelectItem value="paid">Paid Submission Reviews</SelectItem>
  </Select>
)}
```

#### 3.2 Submission Flow Updates

When user purchases/unlocks playlist curation product:

```typescript
// Check if user has access (paid OR completed follow gate)
export const canSubmitToPlaylist = query({
  args: {
    playlistId: v.id("curatorPlaylists"),
    userId: v.string(),
    email: v.optional(v.string()),
  },
  returns: v.object({
    canSubmit: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist?.linkedProductId) {
      return { canSubmit: true }; // No product gate
    }
    
    const product = await ctx.db.get(playlist.linkedProductId);
    if (!product) return { canSubmit: false, reason: "Product not found" };
    
    // Check if free with gate
    if (product.followGateEnabled) {
      const submission = await ctx.db
        .query("followGateSubmissions")
        .withIndex("by_email_product", (q) =>
          q.eq("email", args.email!).eq("productId", product._id)
        )
        .first();
      
      if (submission) return { canSubmit: true };
      return { canSubmit: false, reason: "Complete follow gate first" };
    }
    
    // Check if paid
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_buyer_product", (q) =>
        q.eq("buyerId", args.userId).eq("productId", product._id)
      )
      .first();
    
    if (purchase) return { canSubmit: true };
    return { canSubmit: false, reason: "Purchase required" };
  },
});
```

---

## 🎨 User Experience Flow

### Creator Journey

1. **Dashboard** → "Create Product"
2. **Select Type** → "Playlist Curation" (or any other type)
3. **Choose Pricing**:
   - Option A: "Free - Require followers to submit" (Download Gate)
   - Option B: "$10 per submission" (Paid)
4. **Configure Details**:
   - Link existing playlist OR create new one
   - Set review turnaround (3-7 days)
   - Choose accepted genres
   - Upload cover image
5. **Download Gate Setup** (if Option A):
   - ✅ Require email
   - ✅ Require Instagram follow
   - ✅ Optional: TikTok, YouTube, Spotify
   - Set minimum (e.g., "Follow 2 out of 4")
6. **Publish** → Product goes live in store

### User/Artist Journey (Playlist Curation Example)

#### Scenario A: Free with Download Gate
1. Artist finds playlist in marketplace
2. Clicks "Submit Your Track"
3. **Follow Gate Modal Appears**:
   - Enter email address
   - Click Instagram → Opens creator's profile
   - Click Spotify → Opens creator's artist page
   - Confirm "I followed both"
4. Modal closes → Submission form unlocked
5. Submit track → Creator reviews

#### Scenario B: Paid Submission
1. Artist finds playlist
2. Clicks "Submit Your Track - $10"
3. Stripe checkout
4. Payment confirmed
5. Submission form appears
6. Submit track → Creator reviews

---

## 📋 Migration Strategy

### Backward Compatibility

**Existing products remain unchanged**:
- Old lead magnets → Auto-map to `productCategory: "lead-magnet"`, `pricingModel: "free_with_gate"`
- Old digital products → Auto-map to `pricingModel: "paid"`
- Old Ableton racks → Auto-map to `productCategory: "ableton-rack"`, `pricingModel: "paid"`

### Data Migration Script

**File**: `convex/migrations/universalProductsMigration.ts`

```typescript
import { internalMutation } from "./_generated/server";

export const migrateToUniversalProducts = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const products = await ctx.db.query("digitalProducts").collect();
    
    for (const product of products) {
      const updates: any = {};
      
      // Infer category from existing data
      if (product.productType === "abletonRack") {
        updates.productCategory = "ableton-rack";
      } else if (product.price === 0 && product.followGateEnabled) {
        updates.productCategory = "lead-magnet";
      } else if (product.productType === "coaching") {
        updates.productCategory = "coaching";
      }
      
      // Set pricing model
      if (product.followGateEnabled) {
        updates.pricingModel = "free_with_gate";
      } else {
        updates.pricingModel = "paid";
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(product._id, updates);
      }
    }
    
    return null;
  },
});
```

---

## ✅ Implementation Checklist

### Week 1: Backend
- [ ] Update `digitalProducts` schema with new fields
- [ ] Update `curatorPlaylists` schema with `linkedProductId`
- [ ] Create `convex/universalProducts.ts` with create/update/query functions
- [ ] Create `convex/migrations/universalProductsMigration.ts`
- [ ] Test follow gate + playlist integration
- [ ] Test paid playlist submissions

### Week 2: Frontend - Universal Creation Flow
- [ ] Create `/store/[storeId]/products/create` route
- [ ] Build Step 1: Type Selection UI
- [ ] Build Step 2: Pricing Model UI
- [ ] Build Step 3: Product Details UI
- [ ] Build Step 4: Download Gate Config (reuse existing component)
- [ ] Build Step 5: Type-Specific Config
- [ ] Build Step 6: Review & Publish
- [ ] Wire up all steps to `createUniversalProduct` mutation

### Week 3: Playlist Integration
- [ ] Update playlist creation to optionally create product
- [ ] Update submission flow to check for product gates
- [ ] Add "Unlock Submissions" button on gated playlists
- [ ] Test free playlist submissions (download gate)
- [ ] Test paid playlist submissions (Stripe)
- [ ] Update marketplace to show playlist products

### Week 4: Testing & Polish
- [ ] End-to-end test: Create free sample pack with Instagram gate
- [ ] End-to-end test: Create paid Ableton rack
- [ ] End-to-end test: Create free playlist with Spotify follow gate
- [ ] End-to-end test: Create paid playlist ($5/submission)
- [ ] Migration script testing on staging
- [ ] Update analytics to track download gate conversions
- [ ] Add admin dashboard for follow gate analytics

---

## 🚨 Risk Mitigation

### Potential Issues

1. **Breaking Existing Products**
   - **Solution**: Backward-compatible schema, migration script, feature flags
   
2. **Confusing UX (Too Many Options)**
   - **Solution**: Smart defaults, progressive disclosure, templates
   
3. **Playlist Spam (Free Submissions)**
   - **Solution**: Rate limiting, one submission per email per playlist
   
4. **Follow Gate Abuse (Fake Follows)**
   - **Solution**: Honor system for now, future: verify API integrations

---

## 📊 Success Metrics

Track these KPIs post-launch:

- **Download Gate Conversions**:
  - Email capture rate
  - Social follow rate by platform
  - Download completion rate

- **Playlist Products**:
  - % of playlists monetized as products
  - Average submission price
  - Conversion rate (view → submission)

- **Universal Products**:
  - % of products using download gates
  - Revenue from gated vs. paid products

---

## 🎯 Next Steps

1. **Review this plan** and confirm it aligns with your vision
2. **Prioritize**: Which product types are most critical? (I'd suggest: Sample Packs, Ableton Racks, Playlists)
3. **Start with Phase 1** (backend) - non-breaking changes
4. **Build Phase 2** (UI) incrementally, test with real users
5. **Ship Phase 3** (playlists) as a marquee feature

Let me know what you'd like me to build first! 🚀

