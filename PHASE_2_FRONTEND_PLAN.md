# 🎨 Phase 2: Universal Product Creation UI - Implementation Plan

**Status**: Starting Now 🚀  
**Goal**: Build a unified product creation wizard that replaces 8+ fragmented flows

---

## 🎯 What We're Building

### The Vision
**One unified creation flow** instead of 8+ different routes:

```
BEFORE (Fragmented):
/store/[storeId]/products/digital-download/create
/store/[storeId]/products/ableton-rack/create
/store/[storeId]/products/coaching-call/create
/store/[storeId]/products/lead-magnet
/store/[storeId]/products/bundle/create
/store/[storeId]/products/url-media/create
... and more

AFTER (Unified):
/store/[storeId]/products/create → 6-step wizard for ALL types
```

---

## 📐 Architecture

### Route Structure
```
app/(dashboard)/store/[storeId]/products/create/
├── page.tsx                     # Main orchestrator
├── layout.tsx                   # Shared layout with progress indicator
├── components/
│   ├── ProductTypeSelector.tsx  # Step 1: Choose type
│   ├── PricingModelSelector.tsx # Step 2: Free+Gate vs Paid
│   ├── ProductDetailsForm.tsx   # Step 3: Title, description, media
│   ├── FollowGateConfig.tsx     # Step 4: Social requirements
│   ├── TypeSpecificConfig.tsx   # Step 5: Type-specific fields
│   └── ReviewAndPublish.tsx     # Step 6: Final review
├── hooks/
│   └── useProductForm.ts        # Shared form state management
└── types.ts                     # TypeScript types
```

---

## 🎨 UI/UX Design

### Step Flow
```
┌─────────────────────────────────────────────────────────────┐
│  1. Choose Product Type                                      │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  [🎵 Sample Pack]  [🎛️ Preset Pack]  [🔊 Ableton Rack]      │
│  [🎹 Beat Lease]   [📁 Project Files] [🎼 Playlist Curation]│
│  [📧 Lead Magnet]  [💬 Coaching]      [🎓 Course]            │
│                                                               │
│  [Continue →]                                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. Choose Pricing Model                                     │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  ⭕ Free with Download Gate                                  │
│     Grow your audience - require follows to download         │
│     ✓ Email collection                                       │
│     ✓ Instagram, TikTok, YouTube, Spotify follows            │
│     ✓ Flexible requirements (e.g., "2 out of 4")             │
│                                                               │
│  ⚫ Paid Product                                              │
│     Direct purchase with instant payment                      │
│     ✓ Set your price                                         │
│     ✓ Stripe checkout                                        │
│     ✓ Order bumps & upsells                                  │
│                                                               │
│  [← Back]  [Continue →]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  3. Product Details                                          │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Title: [___________________________]                         │
│  Description: [________________________]                      │
│  Cover Image: [Upload or URL]                                │
│  Download File: [Upload or URL]                              │
│  Tags: [tag1] [tag2] [tag3]                                  │
│                                                               │
│  [← Back]  [Continue →]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  4. Download Gate Setup (if Free selected)                   │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  ☑️ Email Required                                            │
│  ☑️ Instagram Follow → @yourhandle                           │
│  ☐ TikTok Follow                                              │
│  ☑️ YouTube Subscribe                                         │
│  ☑️ Spotify Follow                                            │
│                                                               │
│  Require: [2] out of [4] platforms ▼                         │
│                                                               │
│  Custom Message: [Follow me on 2 platforms...]               │
│                                                               │
│  [← Back]  [Continue →]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  5. Type-Specific Configuration                              │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  (Dynamic based on product type selected in Step 1)          │
│                                                               │
│  Example for Ableton Rack:                                   │
│  - Ableton Version: [Live 11 ▼]                              │
│  - Rack Type: [Audio Effect ▼]                               │
│  - Genre: [Trap] [Hip-Hop]                                   │
│                                                               │
│  Example for Playlist Curation:                              │
│  - Link Playlist: [Select ▼]                                 │
│  - Review Turnaround: [5] days                               │
│  - Genres Accepted: [Lo-Fi] [Chillhop]                       │
│                                                               │
│  [← Back]  [Continue →]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  6. Review & Publish                                         │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Product Preview:                                            │
│  ┌─────────────────────────────┐                             │
│  │ [Cover Image]               │                             │
│  │ 808 Drum Kit Vol. 2         │                             │
│  │ FREE - Follow to unlock     │                             │
│  └─────────────────────────────┘                             │
│                                                               │
│  Summary:                                                     │
│  • Type: Sample Pack                                         │
│  • Pricing: Free with Follow Gate                            │
│  • Requirements: Instagram + Spotify (2 out of 2)            │
│                                                               │
│  [← Back]  [Save as Draft]  [Publish Product →]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Specifications

### 1. ProductTypeSelector.tsx

**Purpose**: Let user choose product type/category

**UI Elements**:
- Grid of product type cards
- Each card has icon, name, description
- Visual categorization (Music Production, Services, Education)
- Search/filter bar for quick access

**Data**:
```typescript
const PRODUCT_TYPES = [
  {
    id: "sample-pack",
    label: "Sample Pack",
    icon: Music,
    description: "Audio samples & loops",
    category: "Music Production",
    productType: "digital",
  },
  {
    id: "playlist-curation",
    label: "Playlist Curation",
    icon: ListMusic,
    description: "Review & feature tracks",
    category: "Services",
    productType: "playlistCuration",
  },
  // ... more
];
```

### 2. PricingModelSelector.tsx

**Purpose**: Choose free+gate vs paid

**UI Elements**:
- Two large radio cards
- Feature comparison list
- Dynamic messaging based on product type
- Warning if coaching/course selected (no free option)

**Logic**:
```typescript
const canBeFree = !["coaching", "course", "workshop"].includes(productType);
```

### 3. ProductDetailsForm.tsx

**Purpose**: Collect basic product info

**Fields**:
- Title (required)
- Description (optional, rich text)
- Cover image (upload or URL)
- Download file (upload or URL, if digital)
- Tags (multi-select)
- Category (if applicable)

**Reuses**: Existing file upload components

### 4. FollowGateConfig.tsx

**Purpose**: Configure download gate requirements

**Reuses**: `components/follow-gates/FollowGateSettings.tsx`

**Integration**:
```tsx
import { FollowGateSettings } from "@/components/follow-gates/FollowGateSettings";

<FollowGateSettings
  enabled={true} // Always enabled in this step
  requirements={requirements}
  onRequirementsChange={setRequirements}
  socialLinks={socialLinks}
  onSocialLinksChange={setSocialLinks}
  customMessage={message}
  onCustomMessageChange={setMessage}
/>
```

### 5. TypeSpecificConfig.tsx

**Purpose**: Collect type-specific fields

**Dynamic Rendering**:
```tsx
switch (productCategory) {
  case "ableton-rack":
    return <AbletonRackConfig {...props} />;
  case "playlist-curation":
    return <PlaylistCurationConfig {...props} />;
  case "coaching":
    return <CoachingConfig {...props} />;
  default:
    return <GenericConfig {...props} />;
}
```

### 6. ReviewAndPublish.tsx

**Purpose**: Final review and publish

**UI Elements**:
- Product preview card
- Summary list
- Edit buttons (jump back to specific step)
- Save as draft button
- Publish button (primary CTA)

---

## 🎣 State Management

### useProductForm Hook

**File**: `hooks/useProductForm.ts`

```typescript
interface ProductFormState {
  // Step 1
  productType: ProductType;
  productCategory: ProductCategory;
  
  // Step 2
  pricingModel: "free_with_gate" | "paid";
  price: number;
  
  // Step 3
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  tags: string[];
  
  // Step 4 (if free)
  followGateConfig?: {
    requireEmail: boolean;
    requireInstagram: boolean;
    requireTiktok: boolean;
    requireYoutube: boolean;
    requireSpotify: boolean;
    minFollowsRequired: number;
    socialLinks: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      spotify?: string;
    };
    customMessage?: string;
  };
  
  // Step 5 (dynamic)
  typeSpecificData: any;
  
  // Meta
  currentStep: number;
  isValid: boolean;
}

export function useProductForm() {
  const [state, setState] = useState<ProductFormState>(initialState);
  
  const goToStep = (step: number) => { /* ... */ };
  const nextStep = () => { /* ... */ };
  const prevStep = () => { /* ... */ };
  const updateField = (field: string, value: any) => { /* ... */ };
  const saveDraft = async () => { /* ... */ };
  const publish = async () => { /* ... */ };
  
  return {
    state,
    goToStep,
    nextStep,
    prevStep,
    updateField,
    saveDraft,
    publish,
  };
}
```

---

## 🔄 Integration with Backend

### Create Product Flow

```typescript
// In ReviewAndPublish.tsx
const handlePublish = async () => {
  const createUniversalProduct = useMutation(
    api.universalProducts.createUniversalProduct
  );
  
  const productId = await createUniversalProduct({
    title: state.title,
    description: state.description,
    storeId,
    userId,
    productType: state.productType,
    productCategory: state.productCategory,
    pricingModel: state.pricingModel,
    price: state.price,
    followGateConfig: state.followGateConfig,
    playlistConfig: state.typeSpecificData.playlistConfig,
    imageUrl: state.imageUrl,
    downloadUrl: state.downloadUrl,
    tags: state.tags,
    // ... other fields
  });
  
  toast.success("Product created!");
  router.push(`/store/${storeId}/products`);
};
```

---

## 🎨 Design System

### Colors
- **Primary**: Blue (Continue, Publish buttons)
- **Secondary**: Gray (Back, Cancel buttons)
- **Success**: Green (Draft saved)
- **Info**: Purple (Free with gate option)

### Components (Reuse Existing)
- `Button` from shadcn/ui
- `Card` from shadcn/ui
- `Input` from shadcn/ui
- `Select` from shadcn/ui
- `Checkbox` from shadcn/ui
- `RadioGroup` from shadcn/ui
- `Badge` from shadcn/ui
- `FollowGateSettings` (already built!)

---

## 📋 Implementation Checklist

### Week 1: Core Structure
- [ ] Create route structure
- [ ] Build layout with progress indicator
- [ ] Create useProductForm hook
- [ ] Build ProductTypeSelector
- [ ] Build PricingModelSelector
- [ ] Wire up navigation between steps

### Week 2: Form Steps
- [ ] Build ProductDetailsForm
- [ ] Integrate FollowGateConfig (reuse existing)
- [ ] Build TypeSpecificConfig (dynamic)
- [ ] Build ReviewAndPublish
- [ ] Add form validation
- [ ] Add file upload handling

### Week 3: Backend Integration
- [ ] Wire up to createUniversalProduct mutation
- [ ] Add draft saving functionality
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all product types

### Week 4: Polish & Testing
- [ ] Add animations/transitions
- [ ] Responsive design
- [ ] Accessibility (a11y)
- [ ] E2E testing
- [ ] Documentation

---

## 🚀 Launch Strategy

### Phase 2A: Soft Launch (Beta)
- Deploy alongside existing flows
- Add "Try New Creator" banner on old pages
- Collect user feedback
- Monitor analytics

### Phase 2B: Gradual Migration
- Default new users to unified flow
- Keep old flows for 30 days
- Track adoption metrics
- Fix issues based on feedback

### Phase 2C: Full Launch
- Redirect all old routes to new flow
- Remove deprecated code
- Celebrate! 🎉

---

## 📊 Success Metrics

- ✅ Product creation time reduced by 50%
- ✅ 80%+ of creators use unified flow
- ✅ Follow gate adoption increases 3x
- ✅ Playlist products in marketplace
- ✅ User satisfaction scores improve

---

## 🎯 MVP Scope (What We Build First)

**Must Have** (Phase 2 MVP):
1. ✅ Product type selection (all types)
2. ✅ Pricing model selection (free+gate vs paid)
3. ✅ Basic product details (title, description, media)
4. ✅ Follow gate configuration (reuse existing)
5. ✅ Playlist-specific config
6. ✅ Review & publish
7. ✅ Backend integration

**Nice to Have** (Future):
- Draft auto-save
- Product templates
- Bulk creation
- A/B testing setup
- Advanced analytics

---

**Ready to start building?** Let's begin with the core structure! 🚀

