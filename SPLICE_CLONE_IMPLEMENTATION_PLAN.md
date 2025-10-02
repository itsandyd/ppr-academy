# Splice Clone - Sample Marketplace Implementation Plan 🎵

## Overview
Build a credit-based sample marketplace where producers can upload individual samples, create packs, and sell them for credits (like Splice Sounds).

---

## 🎯 Core Features

### 1. **Credit System**
- Users purchase credits (1 credit = $1 or bulk discounts)
- Samples cost 1-10 credits each
- Packs cost 5-100 credits
- Credit balance tracking
- Credit transaction history

### 2. **Sample Management**
- Upload individual audio samples (.wav, .mp3, .aiff)
- Rich metadata (BPM, key, genre, tags, category)
- Waveform preview
- Audio player
- Download tracking

### 3. **Sample Packs**
- Bundle multiple samples together
- Pack artwork/cover image
- Pack description and metadata
- Flexible pricing

### 4. **Marketplace**
- Browse samples by category/genre/tag
- Search and filter
- Audio preview before purchase
- Creator profiles
- License information

---

## 📊 Database Schema (Convex)

### New Tables to Add:

```typescript
// User Credits
userCredits: defineTable({
  userId: v.string(), // Clerk user ID
  balance: v.number(), // Current credit balance
  lifetimeEarned: v.number(), // Total credits earned (for creators)
  lifetimeSpent: v.number(), // Total credits spent
  lastUpdated: v.number(),
})
  .index("by_userId", ["userId"]),

// Credit Transactions
creditTransactions: defineTable({
  userId: v.string(),
  type: v.union(
    v.literal("purchase"), // Bought credits with money
    v.literal("spend"), // Spent credits on samples
    v.literal("earn"), // Earned from selling samples
    v.literal("bonus"), // Promotional credits
    v.literal("refund") // Refunded transaction
  ),
  amount: v.number(), // Positive for earn/purchase, negative for spend
  balance: v.number(), // Balance after transaction
  description: v.string(),
  relatedResourceId: v.optional(v.string()), // Sample/pack ID if applicable
  relatedResourceType: v.optional(v.union(
    v.literal("sample"),
    v.literal("pack"),
    v.literal("credit_package")
  )),
  metadata: v.optional(v.object({
    stripePaymentId: v.optional(v.string()),
    dollarAmount: v.optional(v.number()),
    packageName: v.optional(v.string()),
  })),
})
  .index("by_userId", ["userId"])
  .index("by_type", ["type"])
  .index("by_user_type", ["userId", "type"]),

// Audio Samples
audioSamples: defineTable({
  userId: v.string(), // Creator
  storeId: v.string(),
  
  // Basic Info
  title: v.string(),
  description: v.optional(v.string()),
  
  // Audio File
  storageId: v.id("_storage"), // Convex storage ID
  fileUrl: v.string(), // Public URL for streaming
  fileName: v.string(),
  fileSize: v.number(), // in bytes
  duration: v.number(), // in seconds
  format: v.string(), // "wav", "mp3", "aiff"
  
  // Metadata
  bpm: v.optional(v.number()),
  key: v.optional(v.string()), // "C", "Am", "D#", etc.
  genre: v.string(),
  subGenre: v.optional(v.string()),
  tags: v.array(v.string()),
  category: v.union(
    v.literal("drums"),
    v.literal("bass"),
    v.literal("synth"),
    v.literal("vocals"),
    v.literal("fx"),
    v.literal("melody"),
    v.literal("loops"),
    v.literal("one-shots")
  ),
  
  // Waveform data
  waveformData: v.optional(v.array(v.number())), // Peaks for visualization
  peakAmplitude: v.optional(v.number()),
  
  // Pricing & Status
  creditPrice: v.number(), // Cost in credits
  isPublished: v.boolean(),
  isFree: v.optional(v.boolean()),
  
  // Stats
  downloads: v.number(),
  plays: v.number(),
  favorites: v.number(),
  
  // License
  licenseType: v.union(
    v.literal("royalty-free"),
    v.literal("exclusive"),
    v.literal("commercial")
  ),
  licenseTerms: v.optional(v.string()),
})
  .index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"])
  .index("by_genre", ["genre"])
  .index("by_category", ["category"])
  .index("by_published", ["isPublished"])
  .index("by_user_published", ["userId", "isPublished"])
  .index("by_genre_published", ["genre", "isPublished"])
  .index("by_category_published", ["category", "isPublished"]),

// Sample Packs
samplePacks: defineTable({
  userId: v.string(), // Creator
  storeId: v.string(),
  
  // Basic Info
  name: v.string(),
  description: v.string(),
  coverImageUrl: v.optional(v.string()),
  coverImageStorageId: v.optional(v.id("_storage")),
  
  // Pack Contents
  sampleIds: v.array(v.id("audioSamples")),
  totalSamples: v.number(),
  totalSize: v.number(), // in bytes
  totalDuration: v.number(), // in seconds
  
  // Metadata (aggregated from samples)
  genres: v.array(v.string()),
  categories: v.array(v.string()),
  tags: v.array(v.string()),
  bpmRange: v.optional(v.object({
    min: v.number(),
    max: v.number(),
  })),
  
  // Pricing & Status
  creditPrice: v.number(),
  isPublished: v.boolean(),
  
  // Stats
  downloads: v.number(),
  favorites: v.number(),
  
  // License
  licenseType: v.union(
    v.literal("royalty-free"),
    v.literal("exclusive"),
    v.literal("commercial")
  ),
  licenseTerms: v.optional(v.string()),
})
  .index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"])
  .index("by_published", ["isPublished"])
  .index("by_user_published", ["userId", "isPublished"]),

// Sample Downloads (Track who downloaded what)
sampleDownloads: defineTable({
  userId: v.string(), // Downloader
  sampleId: v.optional(v.id("audioSamples")),
  packId: v.optional(v.id("samplePacks")),
  creatorId: v.string(), // Creator who uploaded
  
  // Transaction Info
  creditAmount: v.number(),
  transactionId: v.id("creditTransactions"),
  
  // Download Tracking
  downloadCount: v.number(), // Allow re-downloads
  lastDownloadAt: v.optional(v.number()),
  
  // License Info
  licenseType: v.string(),
  licenseKey: v.optional(v.string()), // Unique license identifier
})
  .index("by_userId", ["userId"])
  .index("by_sampleId", ["sampleId"])
  .index("by_packId", ["packId"])
  .index("by_creatorId", ["creatorId"])
  .index("by_user_sample", ["userId", "sampleId"])
  .index("by_user_pack", ["userId", "packId"]),

// Sample Favorites
sampleFavorites: defineTable({
  userId: v.string(),
  sampleId: v.optional(v.id("audioSamples")),
  packId: v.optional(v.id("samplePacks")),
})
  .index("by_userId", ["userId"])
  .index("by_sampleId", ["sampleId"])
  .index("by_packId", ["packId"])
  .index("by_user_sample", ["userId", "sampleId"])
  .index("by_user_pack", ["userId", "packId"]),

// Credit Packages (Different tiers for buying credits)
creditPackages: defineTable({
  name: v.string(), // "Starter", "Pro", "Ultimate"
  credits: v.number(), // Number of credits
  priceUsd: v.number(), // Price in dollars
  bonusCredits: v.optional(v.number()), // Extra credits for bulk
  description: v.string(),
  isActive: v.boolean(),
  stripePriceId: v.string(),
  displayOrder: v.number(),
  
  // Badge/label
  badge: v.optional(v.string()), // "Most Popular", "Best Value"
  
  // Stats
  purchaseCount: v.number(),
})
  .index("by_active", ["isActive"])
  .index("by_displayOrder", ["displayOrder"]),
```

---

## 🔧 Convex Functions

### Credit System Functions

#### `convex/credits.ts`
```typescript
// Get user credit balance
export const getUserCredits = query({
  args: { userId: v.string() },
  returns: v.object({
    balance: v.number(),
    lifetimeEarned: v.number(),
    lifetimeSpent: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get or create user credits record
    // Return credit info
  },
});

// Purchase credits with Stripe
export const purchaseCredits = mutation({
  args: {
    userId: v.string(),
    packageId: v.id("creditPackages"),
    stripePaymentId: v.string(),
  },
  returns: v.id("creditTransactions"),
  handler: async (ctx, args) => {
    // 1. Get credit package
    // 2. Calculate total credits (base + bonus)
    // 3. Update user balance
    // 4. Create transaction record
  },
});

// Spend credits on sample/pack
export const spendCredits = mutation({
  args: {
    userId: v.string(),
    resourceId: v.string(),
    resourceType: v.union(v.literal("sample"), v.literal("pack")),
    amount: v.number(),
  },
  returns: v.id("creditTransactions"),
  handler: async (ctx, args) => {
    // 1. Check if user has enough credits
    // 2. Deduct credits
    // 3. Create transaction
    // 4. Grant access to sample/pack
  },
});

// Get credit transaction history
export const getCreditHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(/* transaction object */),
  handler: async (ctx, args) => {
    // Return paginated transaction history
  },
});
```

### Sample Management Functions

#### `convex/samples.ts`
```typescript
// Upload sample (after file is uploaded to Convex storage)
export const createSample = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    storageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    bpm: v.optional(v.number()),
    key: v.optional(v.string()),
    genre: v.string(),
    tags: v.array(v.string()),
    category: v.string(),
    creditPrice: v.number(),
    duration: v.number(),
    // ... other fields
  },
  returns: v.id("audioSamples"),
  handler: async (ctx, args) => {
    // 1. Get file URL from storage
    // 2. Create sample record
    // 3. Return sample ID
  },
});

// Browse samples with filters
export const browseSamples = query({
  args: {
    genre: v.optional(v.string()),
    category: v.optional(v.string()),
    bpmMin: v.optional(v.number()),
    bpmMax: v.optional(v.number()),
    key: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.array(/* sample object */),
  handler: async (ctx, args) => {
    // Complex filtering logic
    // Return samples matching criteria
  },
});

// Get sample details
export const getSampleById = query({
  args: { sampleId: v.id("audioSamples") },
  returns: /* sample object with creator info */,
  handler: async (ctx, args) => {
    // Return full sample details
    // Include creator information
    // Include download status if user owns it
  },
});

// Download sample (after purchase)
export const downloadSample = mutation({
  args: {
    userId: v.string(),
    sampleId: v.id("audioSamples"),
  },
  returns: v.object({
    downloadUrl: v.string(),
    licenseKey: v.string(),
  }),
  handler: async (ctx, args) => {
    // 1. Verify user owns the sample
    // 2. Generate download URL
    // 3. Track download
    // 4. Return URL + license
  },
});

// Track sample play
export const trackSamplePlay = mutation({
  args: {
    sampleId: v.id("audioSamples"),
    userId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Increment play count
  },
});
```

### Pack Management Functions

#### `convex/samplePacks.ts`
```typescript
// Create sample pack
export const createPack = mutation({
  args: {
    userId: v.string(),
    storeId: v.string(),
    name: v.string(),
    description: v.string(),
    sampleIds: v.array(v.id("audioSamples")),
    creditPrice: v.number(),
    coverImageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("samplePacks"),
  handler: async (ctx, args) => {
    // 1. Validate all samples belong to user
    // 2. Calculate aggregated metadata
    // 3. Create pack record
  },
});

// Get pack details with samples
export const getPackById = query({
  args: { packId: v.id("samplePacks") },
  returns: /* pack with samples array */,
  handler: async (ctx, args) => {
    // Return pack with all sample details
  },
});

// Download entire pack
export const downloadPack = mutation({
  args: {
    userId: v.string(),
    packId: v.id("samplePacks"),
  },
  returns: v.object({
    samples: v.array(/* sample with download URL */),
    licenseKey: v.string(),
  }),
  handler: async (ctx, args) => {
    // 1. Verify ownership
    // 2. Get all sample download URLs
    // 3. Track download
    // 4. Return URLs + license
  },
});
```

---

## 🎨 UI Components

### 1. **Credit Display Component**
```typescript
// components/samples/credit-balance.tsx
// Show user's credit balance in navbar
// Link to credit purchase page
```

### 2. **Credit Purchase Modal**
```typescript
// components/samples/credit-purchase-modal.tsx
// Display credit packages with pricing
// Stripe checkout integration
// Bonus credit badges
```

### 3. **Sample Card**
```typescript
// components/samples/sample-card.tsx
// Waveform visualization
// Play button with audio player
// Metadata (BPM, key, genre)
// Credit price badge
// Download button (if owned)
// Add to cart button
```

### 4. **Sample Browser**
```typescript
// app/samples/browse/page.tsx
// Advanced filters (genre, BPM, key, tags)
// Grid/list view toggle
// Sort options (newest, popular, price)
// Infinite scroll
// Audio preview player
```

### 5. **Upload Sample Form**
```typescript
// app/store/[storeId]/samples/upload/page.tsx
// File upload with progress
// Metadata form (BPM, key, tags, etc.)
// Waveform generation
// Preview player
// Pricing in credits
```

### 6. **Pack Creator**
```typescript
// app/store/[storeId]/packs/create/page.tsx
// Select samples from user's library
// Drag & drop reordering
// Pack artwork upload
// Bundle pricing
// Pack preview
```

### 7. **Sample Library (User's Downloads)**
```typescript
// app/library/samples/page.tsx
// Show all purchased samples
// Re-download functionality
// Filter/search owned samples
// License information
// Export/download all
```

---

## 💳 Payment Integration

### Credit Packages (Stripe)
```typescript
// Suggested packages:
// - Starter: 10 credits - $10 (1:1 ratio)
// - Popular: 50 credits - $45 (10% bonus)
// - Pro: 100 credits - $85 (15% bonus)
// - Ultimate: 500 credits - $400 (20% bonus)
```

### Stripe Product Setup:
1. Create products in Stripe for each credit package
2. Store Stripe price IDs in `creditPackages` table
3. Use Stripe Checkout for purchases
4. Webhook to confirm payment and add credits

---

## 🚀 Implementation Phases

### Phase 1: Credit System (Week 1-2)
- [ ] Database schema for credits
- [ ] Credit balance tracking
- [ ] Credit purchase with Stripe
- [ ] Transaction history
- [ ] Credit display in UI

### Phase 2: Sample Upload & Management (Week 3-4)
- [ ] File upload to Convex storage
- [ ] Sample metadata form
- [ ] Waveform generation
- [ ] Sample CRUD operations
- [ ] Creator sample library

### Phase 3: Marketplace & Browse (Week 5-6)
- [ ] Sample browser with filters
- [ ] Search functionality
- [ ] Audio preview player
- [ ] Sample detail pages
- [ ] Credit-based purchasing

### Phase 4: Sample Packs (Week 7-8)
- [ ] Pack creation UI
- [ ] Pack management
- [ ] Pack browsing
- [ ] Bulk download

### Phase 5: User Library & Downloads (Week 9)
- [ ] User's purchased samples library
- [ ] Re-download functionality
- [ ] License management
- [ ] Download tracking

### Phase 6: Polish & Features (Week 10+)
- [ ] Favorites system
- [ ] Sample collections
- [ ] Creator profiles for sample sellers
- [ ] Advanced analytics
- [ ] Bulk operations
- [ ] Social features (comments, ratings)

---

## 📱 User Flows

### Flow 1: Purchase Credits
1. User clicks "Buy Credits" in navbar
2. Modal shows credit packages
3. User selects package
4. Stripe checkout
5. Credits added to balance
6. Confirmation email

### Flow 2: Upload Sample
1. Creator goes to "Upload Sample"
2. Uploads audio file
3. Fills metadata (BPM, key, genre, tags)
4. Sets credit price
5. Previews waveform
6. Publishes sample

### Flow 3: Browse & Purchase Sample
1. User browses samples
2. Filters by genre, BPM, key
3. Previews samples with audio player
4. Clicks "Download for X credits"
5. Credits deducted
6. Immediate download access
7. Sample added to library

### Flow 4: Create Sample Pack
1. Creator selects "Create Pack"
2. Chooses samples from their library
3. Arranges order
4. Uploads pack artwork
5. Sets pack price (discounted from individual)
6. Publishes pack

---

## 🔐 License Management

### License Types:
1. **Royalty-Free**: Use in commercial projects, no attribution
2. **Commercial**: Use in commercial projects with attribution
3. **Exclusive**: One-time purchase, creator removes from marketplace

### License Key Generation:
- Unique key per download
- Format: `SAMPLE-{userId}-{sampleId}-{timestamp}-{hash}`
- Stored in downloads table
- Included in download email

---

## 📊 Analytics & Stats

### Creator Dashboard:
- Total samples uploaded
- Total packs created
- Credits earned
- Total downloads
- Most popular samples
- Revenue over time

### Sample Analytics:
- Plays count
- Downloads count
- Favorites count
- Conversion rate (plays → downloads)

---

## 🎯 Monetization

### Revenue Split:
- Platform fee: 20% of credit transactions
- Creator keeps: 80%
- For $10 worth of credits (10 credits):
  - Creator earns $8
  - Platform earns $2

### Payout System:
- Minimum payout: $50
- Payout method: Stripe Connect
- Monthly payout schedule

---

## 🔄 Future Enhancements

1. **Subscriptions**: Unlimited downloads for monthly fee
2. **Sample Requests**: Users request specific types of samples
3. **Collaborations**: Co-create packs with multiple creators
4. **Stems**: Multi-track samples (kick, snare, hi-hat separate)
5. **AI Tagging**: Auto-detect BPM, key, genre
6. **Sample Preview Cuts**: 30-second previews before purchase
7. **Collections**: Curated sample collections by genre/mood
8. **Social**: Follow creators, get notifications of new uploads

---

## 🎨 Design Inspiration

### UI Reference:
- **Splice Sounds**: Clean grid, waveform previews
- **Loopmasters**: Advanced filtering
- **Beatport**: Genre navigation
- **SoundCloud**: Audio player integration

### Color Scheme:
- Primary: Purple gradient (matches app theme)
- Accent: Pink for credits/premium
- Success: Green for owned samples
- Warning: Orange for low credits

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Convex (queries, mutations, file storage)
- **Payments**: Stripe (Checkout, Connect)
- **Audio**: Web Audio API, Wavesurfer.js
- **UI**: Tailwind, shadcn/ui, Framer Motion
- **File Upload**: Convex file storage
- **Waveform**: Wavesurfer.js or custom canvas

---

## ✅ Success Metrics

- **User Engagement**: 
  - Avg samples downloaded per user
  - Credit purchase conversion rate
  - Return user rate

- **Creator Success**:
  - Avg earnings per creator
  - Samples per creator
  - Download rate per sample

- **Platform Growth**:
  - Total samples uploaded
  - Total credits purchased
  - Monthly active users

---

Ready to start implementing? I recommend starting with **Phase 1: Credit System** to get the foundation in place! 🚀

