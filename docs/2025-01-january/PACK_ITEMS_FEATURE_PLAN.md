# 📦 Pack Items & Individual Sales - Feature Plan

**Date**: November 11, 2025  
**Feature**: Sell individual items from packs (Splice-style marketplace)  
**Status**: 📋 Planned - Ready to Implement

---

## 🎯 The Requirement

### What You Want

**Sample Packs, Preset Packs, and MIDI Packs should allow:**
1. Selling the **full pack** as a bundle (e.g., $20 for 50 samples)
2. Selling **individual items** from the pack (e.g., $1 per sample)
3. Discounted bundle vs individual pricing

**Example: "808 Drum Kit Vol. 2"**
- Full pack: $20 (50 samples)
- Individual samples: $0.50 each
- Bundle savings: 50% off vs buying individually

---

## 🏗️ Architecture Design

### Database Schema (New Tables Needed)

#### 1. Pack Items Table (NEW)
```typescript
packItems: defineTable({
  packId: v.id("digitalProducts"), // Parent pack
  
  // Item Details
  name: v.string(),                 // "808 Kick - Deep.wav"
  description: v.optional(v.string()),
  
  // Item Type
  itemType: v.union(
    v.literal("sample"),   // Audio sample
    v.literal("preset"),   // Synth preset
    v.literal("midi"),     // MIDI file
  ),
  
  // Pricing
  individualPrice: v.number(),      // $0.50 per sample
  creditsRequired: v.optional(v.number()), // Or 1 credit
  
  // Files
  fileUrl: v.string(),              // Direct file URL
  previewUrl: v.optional(v.string()), // 30-second preview
  
  // Metadata
  duration: v.optional(v.number()), // For audio samples
  bpm: v.optional(v.number()),
  musicalKey: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  
  // Stats
  downloadCount: v.optional(v.number()),
  
  // Organization
  position: v.number(),             // Order in pack
  category: v.optional(v.string()), // "Kicks", "Snares", "Hi-Hats"
})
  .index("by_packId", ["packId"])
  .index("by_itemType", ["itemType"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["packId", "itemType"],
  });
```

#### 2. Update Digital Products Table
```typescript
digitalProducts: defineTable({
  // ... existing fields ...
  
  // Pack Configuration (NEW)
  isPackWithItems: v.optional(v.boolean()), // true for packs with individual items
  packItemCount: v.optional(v.number()),    // Total items in pack
  individualItemPrice: v.optional(v.number()), // Price per individual item
  bundleDiscount: v.optional(v.number()),   // % off when buying full pack
  allowIndividualPurchase: v.optional(v.boolean()), // Can buy items separately
})
```

#### 3. Individual Item Purchases (NEW)
```typescript
itemPurchases: defineTable({
  userId: v.string(),
  packId: v.id("digitalProducts"),
  itemId: v.id("packItems"),
  
  // Payment
  amount: v.number(),
  transactionId: v.optional(v.string()),
  paymentMethod: v.optional(v.string()), // "stripe" or "credits"
  
  // Credits (if applicable)
  creditsUsed: v.optional(v.number()),
  
  // Metadata
  purchaseDate: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_packId", ["packId"])
  .index("by_itemId", ["itemId"])
  .index("by_userId_and_itemId", ["userId", "itemId"]);
```

---

## 🎨 User Experience Flow

### Creator: Uploading a Sample Pack

```
Step 1: Choose "Sample Pack"
Step 2: Choose pricing model
        ⭕ Sell as bundle only ($20 for 50 samples)
        ⚫ Sell items individually ($0.50 each + $15 bundle)
Step 3: Product details
        Title: "808 Drum Kit Vol. 2"
        Description: "50 premium 808s"
        Cover image
Step 4: Upload pack items (NEW!)
        ┌────────────────────────────────────┐
        │  Upload Items                       │
        │  [Drag & Drop ZIP or Folder]       │
        │                                     │
        │  OR                                 │
        │                                     │
        │  [Add Item Manually] →              │
        │  - Name: 808 Kick Deep.wav         │
        │  - File: [Upload]                   │
        │  - Individual Price: $0.50          │
        │  - Category: Kicks                  │
        │  - Tags: 808, kick, deep            │
        │  [Save Item]                        │
        │                                     │
        │  Items Added (3):                   │
        │  • 808 Kick Deep.wav ($0.50)       │
        │  • 808 Snare Crisp.wav ($0.50)     │
        │  • 808 Hi-Hat Closed.wav ($0.50)   │
        │                                     │
        │  Bundle Price: $20                  │
        │  Individual Total: $25 (50 × $0.50)│
        │  Savings: 20% off                   │
        └────────────────────────────────────┘
Step 5: Review & publish
```

### User: Browsing Sample Pack

```
┌─────────────────────────────────────────────────┐
│  808 Drum Kit Vol. 2                             │
│  By Producer Name                                │
│                                                  │
│  [Bundle: $20 (50 items)]  [Browse Items →]     │
└─────────────────────────────────────────────────┘

[Clicks "Browse Items"] →

┌─────────────────────────────────────────────────┐
│  808 Drum Kit Vol. 2 - Browse Items             │
│                                                  │
│  [Filter: All ▼] [Search: _______]              │
│                                                  │
│  Kicks (12)                                      │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔊 808 Kick Deep.wav          $0.50     │    │
│  │ [Preview] [Add to Cart]                 │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔊 808 Kick Punch.wav         $0.50     │    │
│  │ [Preview] [Add to Cart]                 │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Snares (15)                                     │
│  ...                                             │
│                                                  │
│  [Cart: 3 items - $1.50] [Buy Full Pack: $20]  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Updated Product Creation Flow

### Step 4: Pack Items Configuration (NEW!)

For sample-pack, preset-pack, midi-pack only:

```typescript
interface PackItemsConfigProps {
  items: PackItem[];
  onItemsChange: (items: PackItem[]) => void;
  bundlePrice: number;
  individualPrice: number;
  onBundlePriceChange: (price: number) => void;
  onIndividualPriceChange: (price: number) => void;
}

<PackItemsConfig
  items={formData.packItems}
  bundlePrice={formData.price}
  individualPrice={formData.individualItemPrice}
  // ...
/>
```

**Features**:
- Upload ZIP → Auto-extract items
- Manual item addition
- Bulk edit pricing
- Category organization
- Preview audio files
- Reorder items
- Set bundle discount

---

## 🎯 Pricing Models Extended

### For Packs (Sample, Preset, MIDI)

**Option 1: Bundle Only**
- Sell entire pack: $20
- No individual sales
- Simple, traditional

**Option 2: Individual + Bundle**
- Individual items: $0.50 each
- Full bundle: $20 (vs $25 if bought individually)
- Savings: 20% off
- More flexible for users

**Option 3: Free Bundle with Individual Sales**
- Bundle: FREE with download gate
- Individual items: $0.50 each via credits
- Freemium model!

---

## 📊 Database Relationships

```
digitalProducts (Sample Pack)
├─ id: "pack_123"
├─ title: "808 Drum Kit Vol. 2"
├─ price: $20 (bundle price)
├─ isPackWithItems: true
├─ individualItemPrice: $0.50
├─ allowIndividualPurchase: true
└─ packItemCount: 50

        ↓ (has many)

packItems (Individual Samples)
├─ id: "item_1"
│  ├─ packId: "pack_123"
│  ├─ name: "808 Kick Deep.wav"
│  ├─ individualPrice: $0.50
│  └─ fileUrl: "..."
│
├─ id: "item_2"
│  ├─ packId: "pack_123"
│  ├─ name: "808 Snare Crisp.wav"
│  ├─ individualPrice: $0.50
│  └─ fileUrl: "..."
│
└─ ... (48 more items)

        ↓ (purchased via)

itemPurchases (User Purchases)
├─ userId: "user_123"
├─ packId: "pack_123"
├─ itemId: "item_1"
├─ amount: $0.50
└─ purchaseDate: timestamp
```

---

## 🎨 UI Components Needed

### 1. PackItemsUploader.tsx (NEW)
**File**: `components/packs/PackItemsUploader.tsx`

**Features**:
- Drag & drop ZIP upload
- Auto-extract and create items
- Manual item addition
- Bulk pricing
- Category assignment
- Preview player
- Item reordering

### 2. PackItemsManager.tsx (NEW)
**File**: `components/packs/PackItemsManager.tsx`

**Features**:
- List all items in pack
- Edit item details
- Set individual prices
- Organize by category
- Delete items
- Bulk operations

### 3. PackItemBrowser.tsx (NEW)
**File**: `app/[slug]/components/PackItemBrowser.tsx`

**Features** (Public-facing):
- Browse pack items
- Filter by category
- Search items
- Preview audio
- Add to cart (individual)
- Buy full pack button
- Show savings

### 4. ItemCart.tsx (NEW)
**File**: `components/cart/ItemCart.tsx`

**Features**:
- Show selected items
- Calculate total
- Compare with bundle price
- Suggest bundle if cheaper
- Checkout

---

## 🚀 Implementation Plan

### Phase 3A: Database Structure (Week 1)
1. [ ] Create `packItems` table
2. [ ] Create `itemPurchases` table
3. [ ] Update `digitalProducts` schema
4. [ ] Add pack item mutations
5. [ ] Add pack item queries
6. [ ] Add search indexes

### Phase 3B: Creator Upload Flow (Week 2)
1. [ ] Build ZIP upload component
2. [ ] Build item extraction logic
3. [ ] Build item manager UI
4. [ ] Add to Step 4 of creation wizard
5. [ ] Add pricing configuration
6. [ ] Add preview functionality

### Phase 3C: User Browse & Purchase (Week 3)
1. [ ] Build pack item browser
2. [ ] Add individual item cards
3. [ ] Build cart functionality
4. [ ] Add bundle comparison
5. [ ] Integrate with checkout
6. [ ] Add download delivery

### Phase 3D: Credits System (Week 4 - Optional)
1. [ ] Create credits table
2. [ ] Add credit purchases
3. [ ] Add credit balance
4. [ ] Enable credit-based item purchases
5. [ ] Add credit packages ($10 = 20 credits)

---

## 💡 Example Scenarios

### Scenario 1: Traditional Bundle Only
```
Creator uploads: 808 Drum Kit (50 samples)
Pricing: $20 for full pack
Individual sales: Disabled
Result: Simple, traditional download
```

### Scenario 2: Individual + Bundle
```
Creator uploads: 808 Drum Kit (50 samples)
Individual price: $0.50 per sample
Bundle price: $20
Individual total: $25 (50 × $0.50)
Savings: 20% off ($5 savings)
Result: Users can buy 1 sample or the whole pack
```

### Scenario 3: Free Bundle + Paid Items
```
Creator uploads: 808 Drum Kit (50 samples)
Bundle: FREE with Instagram + Spotify gate
Individual items: $0.50 each (or 1 credit)
Result: Freemium model - get pack free, buy extra items
```

### Scenario 4: Credits Marketplace (Splice Model)
```
User buys: $10 credit pack (20 credits)
Sample pack items: 1 credit each
MIDI pack items: 1 credit each
Preset pack items: 2 credits each
Result: Subscription-style marketplace
```

---

## 🎨 UI Mockup: Pack Item Browser

```
┌──────────────────────────────────────────────────────────┐
│  808 Drum Kit Vol. 2                                      │
│  50 Premium 808 Samples                                   │
│                                                           │
│  [Buy Full Pack - $20] or [Browse & Buy Individual ↓]    │
└──────────────────────────────────────────────────────────┘

[Clicks "Browse Individual"] →

┌──────────────────────────────────────────────────────────┐
│  808 Drum Kit Vol. 2 - Individual Items                  │
│                                                           │
│  [Filter: All ▼] [Search: kick_______]  [Cart: 3 - $1.50]│
│                                                           │
│  Kicks (12 items)                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔊 808 Kick Deep.wav                    $0.50  ✓  │  │
│  │ 120ms • C • Deep punch                             │  │
│  │ [▶ Preview] [In Cart]                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔊 808 Kick Punch.wav                   $0.50     │  │
│  │ 95ms • C# • Aggressive                             │  │
│  │ [▶ Preview] [Add to Cart]                          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Snares (15 items)                                        │
│  ...                                                      │
│                                                           │
│  ╔════════════════════════════════════════════════════╗  │
│  ║  💡 Save 20%!                                      ║  │
│  ║  Cart: 3 items ($1.50)                             ║  │
│  ║  Full Pack: 50 items ($20) ← Save $5!              ║  │
│  ║  [Buy Full Pack Instead →]                         ║  │
│  ╚════════════════════════════════════════════════════╝  │
│                                                           │
│  [Continue Shopping]  [Checkout Cart - $1.50]            │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Updated Product Creation Wizard

### Step 4: Pack Items (NEW - for packs only)

Shows only for: sample-pack, preset-pack, midi-pack

```tsx
<PackItemsConfiguration
  productCategory={formData.productCategory}
  allowIndividualSales={formData.allowIndividualPurchase}
  onAllowIndividualSalesChange={...}
  
  // If individual sales enabled:
  items={formData.packItems}
  onItemsChange={...}
  individualPrice={formData.individualItemPrice}
  bundlePrice={formData.price}
  onIndividualPriceChange={...}
  onBundlePriceChange={...}
/>
```

**Options**:
- ⭕ Sell bundle only (traditional)
- ⚫ Sell individual items + bundle (Splice-style)

**If individual sales enabled**:
- Upload ZIP or add items manually
- Set price per item
- Set bundle price
- Auto-calculate savings

---

## 📋 Implementation Checklist

### Phase 3A: Schema & Backend (4-6 hours)
- [ ] Create `packItems` table in schema
- [ ] Create `itemPurchases` table in schema
- [ ] Update `digitalProducts` with pack fields
- [ ] Create `convex/packItems.ts` (CRUD operations)
- [ ] Create `convex/itemPurchases.ts` (purchase tracking)
- [ ] Add pack item upload helpers
- [ ] Add pack item queries

### Phase 3B: Creator Upload UI (6-8 hours)
- [ ] Build `PackItemsUploader.tsx`
- [ ] Build `PackItemsManager.tsx`
- [ ] Add ZIP extraction logic
- [ ] Add file validation
- [ ] Add bulk pricing tools
- [ ] Add category organizer
- [ ] Integrate into Step 4 of wizard

### Phase 3C: User Browse UI (8-10 hours)
- [ ] Build `PackItemBrowser.tsx`
- [ ] Build `ItemCart.tsx`
- [ ] Add preview player
- [ ] Add search/filter
- [ ] Add bundle comparison
- [ ] Build checkout flow
- [ ] Add download delivery

### Phase 3D: Credits System (Optional, 10-12 hours)
- [ ] Create credits schema
- [ ] Add credit purchase flow
- [ ] Add credit balance display
- [ ] Enable credit-based item purchases
- [ ] Add credit packages
- [ ] Add subscription tiers

---

## 🎯 MVP Scope (What to Build First)

### Must Have (Phase 3A-B)
1. ✅ Pack items database structure
2. ✅ Manual item addition UI
3. ✅ Individual pricing
4. ✅ Bundle vs individual toggle
5. ✅ Basic item management

### Should Have (Phase 3C)
1. ✅ ZIP auto-extraction
2. ✅ Item browser (public)
3. ✅ Cart functionality
4. ✅ Bundle comparison
5. ✅ Individual checkout

### Nice to Have (Phase 3D)
1. 🔮 Credits system
2. 🔮 Subscription tiers
3. 🔮 Bulk download tools
4. 🔮 Sample preview trimming
5. 🔮 Waveform visualization

---

## 💰 Pricing Strategy Recommendations

### Sample Packs
- Individual: $0.25 - $1.00 per sample
- Bundle: 20-40% discount
- **Example**: 50 samples × $0.50 = $25 individual, $15 bundle (40% off)

### Preset Packs
- Individual: $1.00 - $3.00 per preset
- Bundle: 30-50% discount
- **Example**: 30 presets × $2 = $60 individual, $30 bundle (50% off)

### MIDI Packs
- Individual: $0.50 - $2.00 per MIDI file
- Bundle: 25-40% discount
- **Example**: 20 MIDI × $1 = $20 individual, $12 bundle (40% off)

---

## 🚨 Important Decisions Needed

### 1. Credits vs Direct Payment?
**Option A**: Direct payment per item ($0.50 per sample)
- Pros: Simple, no credits system needed
- Cons: High transaction fees for small amounts

**Option B**: Credits system (10 credits = $5)
- Pros: Lower fees, encourages bulk buying
- Cons: More complex to build

**Recommendation**: Start with Option A (direct payment), add credits later

### 2. Upload Method?
**Option A**: Manual addition (one by one)
- Pros: Full control, easy to build
- Cons: Tedious for large packs

**Option B**: ZIP auto-extraction
- Pros: Fast bulk upload
- Cons: More complex parsing

**Recommendation**: Build both - manual for MVP, ZIP for v2

### 3. Preview Audio?
**Option A**: Full file preview
- Pros: Users can fully preview
- Cons: Could be abused (download for free)

**Option B**: 30-second preview
- Pros: Secure, industry standard
- Cons: Need to generate previews

**Recommendation**: Option B - 30-second previews

---

## 🎬 Next Steps

### Immediate (Now)
- ✅ Removed "mini-pack" from product types
- ✅ Clarified pack item requirements
- ✅ Created this implementation plan

### Short Term (Next Session)
**Want me to build Phase 3A (Database & Backend)?**
- Create pack items schema
- Build upload mutations
- Build query functions
- Add to creation wizard

### Medium Term
**Then build Phase 3B (Creator UI)**
- Upload interface
- Item manager
- Pricing tools

### Long Term
**Finally build Phase 3C (User Marketplace)**
- Item browser
- Cart system
- Individual checkout

---

## 📝 Summary

### What You Clarified
- ✅ Remove "mini-pack" (not needed)
- ✅ Sample packs should allow individual item sales
- ✅ Preset packs should allow individual item sales
- ✅ MIDI packs should allow individual item sales
- ✅ Bundle + individual pricing

### What This Enables
- ✅ Splice-style marketplace
- ✅ Flexible pricing strategies
- ✅ Better value for users
- ✅ More revenue opportunities
- ✅ Freemium models possible

### Estimated Time
- Phase 3A (Backend): 4-6 hours
- Phase 3B (Creator UI): 6-8 hours
- Phase 3C (User UI): 8-10 hours
- **Total**: 18-24 hours additional work

---

**Want me to start building Phase 3A (pack items backend)?** 🚀

Or should we deploy what we have now and add this later?

