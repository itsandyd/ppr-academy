# Integrating Samples into Store Dashboard 🎵

## Overview
Add the Splice-clone sample marketplace as a core product type within the existing `/store` dashboard infrastructure, alongside courses and digital products.

---

## 🗺️ Current Store Structure

```
/store
└── page.tsx (CreatorDashboardEnhanced)
    ├── Overview Tab
    ├── Products Tab (My Music)
    ├── Analytics Tab
    └── Coaching Tab

/store/[storeId]/
├── products/page.tsx
│   ├── Manage Tab (existing products)
│   └── Create Tab (product creation)
├── course/create
└── (other routes)
```

---

## 🎯 Integration Strategy

### Phase 1: Add Samples as Product Type ✅

The dashboard **already supports** sample packs and presets:
```typescript
// Line 82 in creator-dashboard-enhanced.tsx
type ProductType = "course" | "digitalProduct" | "coaching" | "samplePack" | "preset";

// Quick actions already include:
- Upload Sample Pack
- Create Preset
```

**What's needed:**
1. ✅ Product types defined
2. ❌ Actual sample upload/management pages
3. ❌ Credit system integration
4. ❌ Sample-specific routes

---

## 📁 New File Structure

```
app/(dashboard)/store/[storeId]/
├── products/
│   ├── page.tsx (existing - add "Samples" tab)
│   └── samples/
│       ├── page.tsx (sample library/browse)
│       ├── upload/
│       │   └── page.tsx (upload individual samples)
│       ├── packs/
│       │   ├── page.tsx (pack management)
│       │   └── create/
│       │       └── page.tsx (create pack from samples)
│       └── [sampleId]/
│           └── edit/
│               └── page.tsx (edit sample metadata)
│
├── credits/
│   ├── page.tsx (credit dashboard & purchase)
│   └── history/
│       └── page.tsx (transaction history)
│
└── marketplace/ (public marketplace routes under store)
    ├── browse/
    │   └── page.tsx (browse all samples marketplace)
    └── pack/[packId]/
        └── page.tsx (pack details)
```

---

## 🔧 Integration Points

### 1. **Update Products Page** (`/store/[storeId]/products/page.tsx`)

Add a new "Samples" tab to the existing Manage/Create tabs:

```typescript
<Tabs defaultValue="manage">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="manage">My Products</TabsTrigger>
    <TabsTrigger value="create">Create New</TabsTrigger>
    <TabsTrigger value="samples">🎵 Samples</TabsTrigger> {/* NEW */}
  </TabsList>

  {/* Existing tabs... */}

  {/* NEW Samples Tab */}
  <TabsContent value="samples">
    <SamplesManager storeId={storeId} userId={convexUser?._id} />
  </TabsContent>
</Tabs>
```

### 2. **Update Creator Dashboard** (Add Credit Balance)

Add credit balance to the stats overview:

```typescript
// In creator-dashboard-enhanced.tsx, add credit query
const userCredits = useQuery(
  api.credits.getUserCredits,
  user?.id ? { userId: user.id } : "skip"
);

// Add credit card to stats grid
<Card className="border-slate-200 dark:border-slate-700">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Credit Balance
    </CardTitle>
    <Coins className="h-4 w-4 text-yellow-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {userCredits?.balance || 0} credits
    </div>
    <p className="text-xs text-slate-500">
      <Link href={`/store/${storeId}/credits`}>Buy more</Link>
    </p>
  </CardContent>
</Card>
```

### 3. **Update Quick Actions** (Already in place!)

The dashboard already has:
```typescript
{
  id: 'upload-sample-pack',
  title: 'Upload Sample Pack',
  icon: Music,
  action: () => router.push(`/store/${storeId}/products/samples/upload`)
}
```

Just need to update the route!

### 4. **Update Music Options** (`music-options.tsx`)

Modify the route mapping to point to new sample routes:

```typescript
const routeMap: Record<string, string> = {
  'sample-pack': `/store/${storeId}/products/samples/packs/create`,
  'preset-pack': `/store/${storeId}/products/samples/upload?type=preset`,
  // ... existing routes
};
```

---

## 🎨 New Components Needed

### 1. **SamplesManager Component**
```typescript
// components/samples/samples-manager.tsx
export function SamplesManager({ storeId, userId }) {
  // Sub-tabs for:
  // - My Samples (uploaded)
  // - My Packs
  // - Downloads (purchased)
  // - Marketplace (browse all)
}
```

### 2. **CreditBalance Widget**
```typescript
// components/samples/credit-balance.tsx
export function CreditBalance({ userId }) {
  // Shows current balance
  // "Buy Credits" button
  // Quick link to history
}
```

### 3. **SampleUploadForm**
```typescript
// components/samples/sample-upload-form.tsx
export function SampleUploadForm({ storeId, userId }) {
  // File upload
  // Metadata form (BPM, key, genre, tags)
  // Waveform preview
  // Credit price selector
}
```

### 4. **SampleCard**
```typescript
// components/samples/sample-card.tsx
export function SampleCard({ sample, variant }) {
  // Waveform visualization
  // Play/pause button
  // Metadata display
  // Download (if owned) / Purchase (if not)
}
```

---

## 🔀 Route Structure

### Creator Routes (Behind Auth)
```
/store/[storeId]/products/samples          → My samples library
/store/[storeId]/products/samples/upload   → Upload new sample
/store/[storeId]/products/samples/packs    → My sample packs
/store/[storeId]/products/samples/packs/create → Create pack
/store/[storeId]/credits                   → Credit dashboard
/store/[storeId]/credits/purchase          → Buy credits (modal/page)
```

### Public Marketplace Routes
```
/marketplace/samples                       → Browse all samples
/marketplace/samples/[sampleId]            → Sample details
/marketplace/packs                         → Browse packs
/marketplace/packs/[packId]                → Pack details
/marketplace/creator/[creatorId]           → Creator's samples
```

---

## 📊 Database Integration

All the schema is already defined in `SPLICE_CLONE_IMPLEMENTATION_PLAN.md`.

Key tables:
- `userCredits` - User credit balances
- `creditTransactions` - Credit history
- `audioSamples` - Individual samples
- `samplePacks` - Sample bundles
- `sampleDownloads` - Purchase tracking

---

## 💳 Credit System Integration

### Credit Display in Navbar/Header

Add credit balance next to notifications:

```typescript
// In dashboard header
<div className="flex items-center gap-4">
  {/* Existing notifications */}
  <Button variant="ghost" size="sm">
    <Bell className="w-4 h-4" />
  </Button>
  
  {/* NEW: Credits */}
  <Link href={`/store/${storeId}/credits`}>
    <Button variant="outline" size="sm" className="gap-2">
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="font-semibold">{credits?.balance || 0}</span>
      <span className="text-xs text-muted-foreground">credits</span>
    </Button>
  </Link>
</div>
```

### Credit Purchase Flow

1. User clicks "Buy Credits"
2. Modal/page shows credit packages
3. Stripe checkout
4. Webhook updates credit balance
5. User can spend credits on samples

---

## 🎯 Product Types Hierarchy

```
Store Dashboard
├── Courses (existing)
│   └── /store/[storeId]/course/create
├── Digital Products (existing)
│   └── /store/[storeId]/products/digital-download/create
├── Coaching (existing)
│   └── /store/[storeId]/products/coaching-call/create
└── 🆕 Samples (NEW)
    ├── Individual Samples
    │   └── /store/[storeId]/products/samples/upload
    └── Sample Packs
        └── /store/[storeId]/products/samples/packs/create
```

---

## 🚀 Implementation Steps

### Step 1: Database Schema (Week 1)
- [ ] Add credit tables to `convex/schema.ts`
- [ ] Create `convex/credits.ts` with credit functions
- [ ] Create `convex/samples.ts` with sample functions
- [ ] Create `convex/samplePacks.ts` with pack functions

### Step 2: Credit System UI (Week 1-2)
- [ ] Create credit balance component
- [ ] Create credit purchase modal
- [ ] Create credit history page
- [ ] Integrate Stripe for credit purchases
- [ ] Add credit balance to dashboard

### Step 3: Sample Upload (Week 2-3)
- [ ] Create sample upload page
- [ ] Implement file upload to Convex storage
- [ ] Create metadata form
- [ ] Generate waveform previews
- [ ] Add sample card component

### Step 4: Sample Management (Week 3-4)
- [ ] Create samples manager component
- [ ] Add samples tab to products page
- [ ] Implement sample editing
- [ ] Add sample deletion
- [ ] Track sample analytics

### Step 5: Sample Packs (Week 4-5)
- [ ] Create pack creation page
- [ ] Implement pack builder UI
- [ ] Add pack management
- [ ] Bundle pricing logic

### Step 6: Marketplace (Week 5-6)
- [ ] Create public marketplace pages
- [ ] Implement browse & filter
- [ ] Add sample preview player
- [ ] Credit-based purchasing
- [ ] Download management

### Step 7: User Library (Week 6-7)
- [ ] Create user's purchased samples page
- [ ] Implement re-download
- [ ] License management
- [ ] Export functionality

---

## 🎨 UI Integration Examples

### Products Page Header with Credits

```typescript
<div className="flex items-center justify-between mb-8">
  <h1 className="text-4xl font-bold">My Products</h1>
  
  <div className="flex items-center gap-4">
    {/* Credit Balance */}
    <Card className="px-4 py-2">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-500" />
        <div>
          <p className="text-sm text-muted-foreground">Credits</p>
          <p className="text-xl font-bold">{credits?.balance || 0}</p>
        </div>
        <Button size="sm" variant="outline">
          Buy More
        </Button>
      </div>
    </Card>
    
    {/* Existing actions */}
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      New Product
    </Button>
  </div>
</div>
```

### Sample Product Card in Grid

```typescript
<Card className="group hover:shadow-xl transition-all">
  {/* Waveform Preview */}
  <div className="h-32 bg-slate-900 relative">
    <WaveformVisualizer data={sample.waveformData} />
    <Button 
      className="absolute inset-0 m-auto w-12 h-12 rounded-full"
      onClick={() => playPreview(sample.fileUrl)}
    >
      <Play className="w-6 h-6" />
    </Button>
  </div>
  
  {/* Sample Info */}
  <CardContent className="p-4">
    <h3 className="font-bold mb-2">{sample.title}</h3>
    
    <div className="flex items-center gap-2 mb-2">
      <Badge>{sample.bpm} BPM</Badge>
      <Badge>{sample.key}</Badge>
      <Badge>{sample.genre}</Badge>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Coins className="w-4 h-4 text-yellow-500" />
        <span className="font-bold">{sample.creditPrice} credits</span>
      </div>
      
      {owned ? (
        <Button size="sm">
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      ) : (
        <Button size="sm" variant="default">
          Buy Now
        </Button>
      )}
    </div>
  </CardContent>
</Card>
```

---

## 🔐 Access Control

Samples follow the same store ownership model:

```typescript
// Only store owners can:
- Upload samples to their store
- Create packs from their samples
- Set pricing and edit metadata
- View analytics for their samples

// All users can:
- Browse marketplace
- Purchase samples with credits
- Download owned samples
- Create playlists/collections
```

---

## 💰 Revenue Flow

```
User Buys Credits ($10)
↓
Credits added to balance (10 credits)
↓
User spends 5 credits on sample
↓
Creator earns $4 (80%)
Platform earns $1 (20%)
↓
Payout to creator via Stripe Connect
```

---

## 📱 Mobile Considerations

The dashboard is already mobile-first! Sample features will follow the same pattern:

- Collapsible sections
- Touch-friendly buttons
- Responsive grids (1 col mobile, 3 cols desktop)
- Mobile-optimized audio player
- Swipe gestures for sample cards

---

## 🎯 Success Metrics

Dashboard will show:
- Total samples uploaded
- Total credits earned
- Sample downloads count
- Top performing samples
- Revenue from samples

---

## 🔄 Migration Strategy

Since sample packs and presets are already product types:

1. **No Breaking Changes**: Existing dashboard continues to work
2. **Gradual Rollout**: Enable samples tab by tab
3. **Feature Flag**: Use `features.enableSamples` to control visibility
4. **Backward Compatible**: Existing products unaffected

---

## ✅ Checklist Before Launch

### Backend
- [ ] Credit system database schema
- [ ] Sample/pack CRUD functions
- [ ] File upload to Convex storage
- [ ] Stripe integration for credits
- [ ] Webhook handlers

### Frontend
- [ ] Credit balance display
- [ ] Sample upload form
- [ ] Pack creation tool
- [ ] Marketplace browser
- [ ] User library page

### Integration
- [ ] Samples tab in products page
- [ ] Credit purchase modal
- [ ] Sample cards in dashboard
- [ ] Analytics integration
- [ ] Mobile testing

### Polish
- [ ] Waveform generation
- [ ] Audio preview player
- [ ] License generation
- [ ] Email notifications
- [ ] Documentation

---

## 🚀 Launch Plan

### Phase 1: Beta (Closed)
- Enable for select creators
- Test credit purchases
- Validate upload flow
- Gather feedback

### Phase 2: Open Beta
- All creators can upload
- Public marketplace enabled
- Monitor performance
- Iterate on UX

### Phase 3: Full Launch
- Marketing push
- Creator onboarding
- Success stories
- Scale infrastructure

---

## 📝 Next Steps

**Ready to start building?**

1. **Start with Phase 1**: Set up the credit system database schema
2. **Create base components**: Credit balance widget, sample card
3. **Add samples tab**: Integrate into products page
4. **Build upload flow**: Sample upload form and metadata
5. **Test end-to-end**: Upload → Purchase → Download

Want me to start implementing any specific part? I can:
1. Update the schema with credit/sample tables
2. Create the credit balance component
3. Build the samples tab for the products page
4. Set up the sample upload flow

Let me know where you'd like to begin! 🎵

