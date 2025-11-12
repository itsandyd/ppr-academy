# Product Bundle & Credit Marketplace Implementation Plan

## 🎯 Overview

This document outlines the implementation plan for extending the current product system to support:
- **Product Bundles** (e.g., "Ableton Complete Bundle")
- **Sample Packs** with individual sample access
- **Credit-Based Marketplace** (similar to Splice)
- **Hierarchical Product Structure**

## 📊 Current Product Types Analysis

### ✅ Existing Products
- **Courses** (with modules/lessons/chapters)
- **Digital Products** (PDFs, guides, templates)
- **Coaching Calls** (1:1 sessions)
- **Lead Magnets** (email collection)

### ❌ Missing for Bundle/Marketplace Vision
- **Bundles** (groups of related products)
- **Sample Packs** (collections of audio samples)
- **Individual Samples** (credit-based purchases)
- **Credit System** (marketplace currency)

## 🗄️ Proposed Database Schema Extensions

### 1. Bundles Table
```typescript
bundles: defineTable({
  title: v.string(),                    // "Ableton Complete Bundle"
  description: v.optional(v.string()),  // Bundle overview
  imageUrl: v.optional(v.string()),     // Bundle thumbnail
  price: v.number(),                    // Bundle price ($299)
  discountPercentage: v.optional(v.number()), // vs buying individually (20-30%)
  storeId: v.string(),
  userId: v.string(),
  isPublished: v.optional(v.boolean()),
  category: v.optional(v.string()),     // "Ableton", "Mixing", "Beat Making"
  slug: v.optional(v.string()),         // URL-friendly identifier
  tags: v.optional(v.array(v.string())), // ["electronic", "production", "daw"]
}).index("by_storeId", ["storeId"])
  .index("by_category", ["category"])
  .index("by_slug", ["slug"]);
```

### 2. Bundle Items Table (Many-to-Many)
```typescript
bundleItems: defineTable({
  bundleId: v.id("bundles"),
  productId: v.string(),               // References courses, digitalProducts, or samplePacks
  productType: v.union(
    v.literal("course"), 
    v.literal("digitalProduct"), 
    v.literal("samplePack")
  ),
  orderIndex: v.number(),              // Display order in bundle
  isRequired: v.optional(v.boolean()), // Core vs bonus items
}).index("by_bundleId", ["bundleId"])
  .index("by_productId", ["productId"]);
```

### 3. Sample Packs Table
```typescript
samplePacks: defineTable({
  title: v.string(),                   // "Ableton Drum Essentials"
  description: v.optional(v.string()), // Pack description
  imageUrl: v.optional(v.string()),    // Pack artwork
  packPrice: v.number(),               // Full pack price ($19.99)
  sampleCount: v.number(),             // Number of samples (20)
  totalCredits: v.number(),            // Credit cost for full pack (20)
  genre: v.optional(v.string()),       // "Hip Hop", "House", "Techno"
  bpm: v.optional(v.number()),         // Average BPM
  key: v.optional(v.string()),         // Musical key
  storeId: v.string(),
  userId: v.string(),
  isPublished: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())), // ["drums", "808", "trap"]
}).index("by_storeId", ["storeId"])
  .index("by_genre", ["genre"])
  .index("by_tags", ["tags"]);
```

### 4. Individual Samples Table
```typescript
samples: defineTable({
  title: v.string(),                   // "808 Kick 01"
  description: v.optional(v.string()), // Sample description
  audioUrl: v.string(),                // Preview URL (30s, lower quality)
  downloadUrl: v.string(),             // Full quality download URL
  samplePackId: v.id("samplePacks"),   // Parent pack
  creditCost: v.number(),              // Usually 1 credit
  duration: v.optional(v.number()),    // Duration in seconds
  bpm: v.optional(v.number()),         // BPM if applicable
  key: v.optional(v.string()),         // Musical key
  tags: v.optional(v.array(v.string())), // ["kick", "808", "deep"]
  orderIndex: v.number(),              // Order in pack
  fileSize: v.optional(v.number()),    // File size in bytes
  format: v.optional(v.string()),      // "WAV", "MP3", "AIFF"
}).index("by_samplePackId", ["samplePackId"])
  .index("by_tags", ["tags"])
  .index("by_bpm", ["bpm"]);
```

### 5. Credit System Tables

#### User Credits
```typescript
userCredits: defineTable({
  userId: v.string(),
  storeId: v.string(),                 // Credits are store-specific
  balance: v.number(),                 // Current credit balance
  totalPurchased: v.number(),          // Lifetime credits purchased
  totalSpent: v.number(),              // Lifetime credits spent
  lastPurchaseAt: v.optional(v.number()),
  lastSpentAt: v.optional(v.number()),
}).index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"])
  .index("by_userId_and_storeId", ["userId", "storeId"]);
```

#### Credit Transactions
```typescript
creditTransactions: defineTable({
  userId: v.string(),
  storeId: v.string(),
  type: v.union(
    v.literal("purchase"),             // Bought credit pack
    v.literal("spend"),                // Used credit for sample
    v.literal("refund"),               // Credit refund
    v.literal("bonus")                 // Free credits/promotions
  ),
  amount: v.number(),                  // Credits gained/spent
  description: v.string(),             // "Purchased 50 credit pack" / "Downloaded 808 Kick 01"
  relatedProductId: v.optional(v.string()), // Sample ID if spending
  relatedProductType: v.optional(v.string()),
  paymentId: v.optional(v.string()),   // Stripe payment ID for purchases
}).index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"])
  .index("by_type", ["type"]);
```

### 6. Bundle Purchases & Access
```typescript
bundlePurchases: defineTable({
  userId: v.string(),
  bundleId: v.id("bundles"),
  storeId: v.string(),
  purchaseDate: v.number(),
  amountPaid: v.number(),
  paymentId: v.optional(v.string()),
  status: v.union(v.literal("active"), v.literal("refunded")),
}).index("by_userId", ["userId"])
  .index("by_bundleId", ["bundleId"]);
```

## 🏗️ Product Hierarchy Structure

### **Level 1: Bundles**
- **Ableton Complete Bundle** ($299)
  - 5 courses + 3 sample packs + 2 digital products
  - 40% discount vs individual purchases
- **Mixing Mastery Bundle** ($199)
- **Beat Making Essentials** ($149)

### **Level 2: Bundle Contents**
- **Courses**: Ableton Instruments, Ableton Effects, Ableton Devices
- **Sample Packs**: Ableton Drums (20 samples), Ableton Synths (15 samples)
- **Digital Products**: Ableton Cheat Sheet, Project Templates

### **Level 3: Individual Items**
- **Course Lessons**: Accessible with course/bundle purchase
- **Individual Samples**: 1 credit each OR included in pack/bundle

## 💰 Pricing & Access Models

### **Bundle Pricing Strategy**
```
Individual Prices:
- Ableton Instruments Course: $89
- Ableton Effects Course: $79
- Ableton Devices Course: $69
- Ableton Drum Pack: $19.99 (or 20 credits)
- Ableton Synth Pack: $15.99 (or 16 credits)
Total Individual: $272.98

Bundle Price: $199 (27% savings)
```

### **Credit System Economics**
```
Credit Packs:
- 10 credits: $9.99 ($0.999/credit)
- 50 credits: $39.99 ($0.80/credit) - 20% discount
- 100 credits: $69.99 ($0.70/credit) - 30% discount
- 250 credits: $149.99 ($0.60/credit) - 40% discount

Sample Pricing:
- Individual sample: 1 credit
- Sample pack (20 samples): 16 credits (20% bulk discount) OR $19.99
```

### **Access Management Logic**
```
User Access Calculation:
1. Bundle Purchase → Access to ALL items in bundle
2. Individual Course Purchase → Access to that course only  
3. Sample Pack Purchase → Access to all samples in pack
4. Credit Purchase → Ability to buy individual samples
5. Individual Sample Purchase → Access to that specific sample
```

## 🚀 Implementation Phases

### **Phase 1: Bundle System (Priority 1)**
**Goal**: Enable "Ableton Bundle" style product grouping

**Tasks:**
1. **Database Schema**
   - Create `bundles` and `bundleItems` tables
   - Add bundle-related Convex functions

2. **Bundle Creation Flow**
   - Bundle creation wizard (similar to course creation)
   - Product selection interface
   - Pricing and discount configuration

3. **Bundle Management**
   - Add bundles to ProductsList
   - Bundle edit/delete functionality
   - Bundle analytics

4. **Storefront Integration**
   - Bundle display in mobile storefront
   - Bundle purchase flow
   - Access verification system

**Estimated Timeline**: 2-3 weeks

### **Phase 2: Sample Pack Foundation (Priority 2)**
**Goal**: Basic sample pack creation and management

**Tasks:**
1. **Database Schema**
   - Create `samplePacks` and `samples` tables
   - Audio file storage integration

2. **Sample Pack Creation**
   - Audio upload interface
   - Metadata entry (BPM, key, tags)
   - Pack organization tools

3. **Sample Management**
   - Audio preview generation
   - Sample categorization
   - Pack publishing workflow

**Estimated Timeline**: 3-4 weeks

### **Phase 3: Credit Marketplace (Priority 3)**
**Goal**: Splice-style individual sample purchasing

**Tasks:**
1. **Credit System**
   - Credit purchase flow
   - Balance management
   - Transaction tracking

2. **Sample Marketplace**
   - Individual sample browsing
   - Audio preview player
   - Credit-based purchasing

3. **User Experience**
   - Credit balance display
   - Purchase history
   - Download management

**Estimated Timeline**: 4-5 weeks

### **Phase 4: Advanced Features (Priority 4)**
**Goal**: Enhanced marketplace features

**Tasks:**
1. **Advanced Bundling**
   - Dynamic bundle creation
   - Time-limited bundles
   - Conditional access rules

2. **Marketplace Features**
   - Sample recommendations
   - Genre-based filtering
   - Advanced search

3. **Analytics & Insights**
   - Bundle performance metrics
   - Sample popularity tracking
   - Revenue optimization

**Estimated Timeline**: 3-4 weeks

## 🎨 User Interface Mockups

### **Bundle Creation Flow**
```
Step 1: Bundle Info (title, description, image, category)
Step 2: Add Products (search existing products, drag to add)
Step 3: Pricing (set bundle price, show discount calculation)
Step 4: Options (access rules, promotional settings)
```

### **Sample Pack Creation Flow**
```
Step 1: Pack Info (title, genre, BPM, artwork)
Step 2: Upload Samples (drag & drop, metadata entry)
Step 3: Organization (reorder, tag, preview)
Step 4: Pricing (pack price vs credit cost)
```

### **Credit Marketplace Interface**
```
Header: Credit balance, "Buy Credits" button
Sidebar: Genre filters, BPM range, key filters
Main: Sample grid with play buttons, credit costs
Player: Preview player with waveform
```

## 🔧 Technical Considerations

### **File Storage**
- **Audio Storage**: Convex file storage for samples
- **Preview Generation**: Server-side audio processing for 30s previews
- **Download Protection**: Signed URLs with access verification

### **Performance**
- **Lazy Loading**: Sample previews load on demand
- **Caching**: Audio preview caching strategy
- **CDN**: Audio file delivery optimization

### **Payment Integration**
- **Stripe Integration**: Credit pack purchases
- **Bundle Payments**: One-time bundle purchases
- **Subscription Support**: Future recurring access models

## 📈 Business Model Implications

### **Revenue Streams**
1. **Bundle Sales**: Higher value, lower frequency
2. **Individual Courses**: Medium value, medium frequency  
3. **Credit Sales**: Lower value, higher frequency
4. **Sample Pack Sales**: Medium value, medium frequency

### **Customer Acquisition**
- **Bundles**: Attract serious learners with comprehensive packages
- **Credits**: Lower barrier to entry, encourage exploration
- **Free Samples**: Lead magnets to showcase quality

### **Retention Strategy**
- **Bundle Access**: Long-term value perception
- **Credit System**: Regular engagement and purchases
- **New Content**: Continuous value addition to bundles

## 🎵 Music Production Specific Features

### **Sample Pack Categories**
- **Drums**: Kicks, snares, hi-hats, percussion
- **Melodic**: Synths, leads, pads, arps
- **Bass**: 808s, sub bass, bass lines
- **Vocals**: Vocal chops, ad-libs, hooks
- **FX**: Risers, impacts, sweeps, atmospheres

### **Metadata Standards**
- **BPM**: Exact tempo for DJ/producer workflow
- **Key**: Musical key for harmonic mixing
- **Genre**: Primary and secondary genre tags
- **Mood**: Energy level, vibe descriptors
- **Instruments**: Source instruments used

### **Bundle Examples**
```
Ableton Complete Bundle ($299):
├── Ableton Instruments Course ($89)
├── Ableton Audio Effects Course ($79)  
├── Ableton Devices Course ($69)
├── Ableton MIDI Effects Course ($59)
├── Ableton Drum Essentials Pack (20 samples)
├── Ableton Synth Fundamentals Pack (15 samples)
└── Ableton Project Templates (10 templates)

Total Individual Value: $395
Bundle Savings: $96 (24% discount)
```

## 🚦 Implementation Roadmap

### **Immediate Next Steps (Week 1-2)**
1. **Create bundle schema** and Convex functions
2. **Design bundle creation UI** (similar to course creation flow)
3. **Implement bundle display** in ProductsList
4. **Add bundle option** to product type selection

### **Short Term (Month 1)**
- Complete Phase 1: Bundle System
- Basic bundle creation, management, and storefront display
- Bundle purchase flow integration

### **Medium Term (Month 2-3)**
- Phase 2: Sample Pack Foundation
- Audio upload and management system
- Basic sample pack creation tools

### **Long Term (Month 4-6)**
- Phase 3: Credit Marketplace
- Full Splice-style individual sample purchasing
- Advanced marketplace features

## 🎯 Success Metrics

### **Bundle System**
- **Bundle Creation Rate**: Bundles created per creator
- **Bundle Conversion**: Bundle vs individual product sales
- **Average Bundle Value**: Revenue per bundle sale

### **Credit Marketplace**
- **Credit Purchase Rate**: Credits bought per user
- **Sample Download Rate**: Individual samples downloaded
- **Credit Utilization**: Percentage of purchased credits used

### **Overall Marketplace**
- **Product Diversity**: Variety of product types per store
- **Customer Lifetime Value**: Total spend across all product types
- **Creator Revenue**: Average revenue per creator across all formats

---

## 📝 Notes for Future Reference

### **Key Design Decisions**
- **Store-Specific Credits**: Credits are tied to individual stores (not platform-wide)
- **Flexible Bundle Contents**: Bundles can contain any combination of product types
- **Progressive Access**: Bundle purchasers get access to new items added later
- **Credit Bulk Discounts**: Encourage larger credit purchases with tiered pricing

### **Technical Debt Considerations**
- **Migration Strategy**: How to handle existing products when adding bundles
- **Access Control**: Unified system for checking user access across all product types
- **Analytics Integration**: Tracking across bundle, individual, and credit purchases

### **Future Expansion Opportunities**
- **Subscription Bundles**: Monthly access to rotating content
- **Creator Collaboration**: Multi-creator bundles with revenue sharing
- **Marketplace Features**: User-generated sample packs, remix contests
- **AI Integration**: Automatic sample tagging, genre detection, similar sample recommendations

---

*Last Updated: January 2025*
*Status: Planning Phase - Ready for Implementation*
