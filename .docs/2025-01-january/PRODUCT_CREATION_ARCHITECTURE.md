# Product Creation Architecture

## Overview
Products are organized under `/store/[storeId]/products/` with dedicated creation flows for each product type, while courses remain separate under `/course/create/`.

## Route Structure

### Education (Separate from Products)
```
/store/[storeId]/course/create/
├── context.tsx           - Course state management
├── layout.tsx            - Shared course creation UI
├── page.tsx              - Step router
└── steps/
    ├── CourseContentForm.tsx
    ├── PricingModelForm.tsx
    ├── CheckoutForm.tsx
    ├── FollowGateForm.tsx
    └── OptionsForm.tsx
```

### Products (All Under /products/)

#### Universal Product Selector
```
/store/[storeId]/products/create/
└── page.tsx - Product type selector (routes to dedicated pages)
```

#### Pack Creation (Sample/MIDI/Preset)
```
/store/[storeId]/products/pack/create/
├── context.tsx           - Pack state management
├── layout.tsx            - Pack creation UI with progress
├── page.tsx              - Step router
└── steps/
    ├── PackBasicsForm.tsx       ✅ Created
    ├── PackPricingForm.tsx      ⏳ To create
    ├── PackFollowGateForm.tsx   ⏳ To create
    └── PackFilesForm.tsx        ⏳ To create
```

#### Coaching/Services (Already Exists)
```
/store/[storeId]/products/coaching-call/create/
├── CoachingPreviewContext.tsx
├── layout.tsx
├── page.tsx
└── steps/
    ├── thumbnail/
    ├── checkout/
    ├── availability/
    └── options/
```

#### Bundles (Already Exists)
```
/store/[storeId]/products/bundle/create/
├── layout.tsx
├── page.tsx
├── BundleForm.tsx
└── BundlePhonePreview.tsx
```

#### Other Product Types (Already Exist)
- `/products/digital-download/create/` - Generic digital downloads
- `/products/ableton-rack/create/` - Ableton racks
- `/products/url-media/create/` - URL-based content
- `/products/lead-magnet/create/` - Lead magnets

## Routing Logic

### Product Type Selector (`/products/create/page.tsx`)

Double-click on product type routes to dedicated pages:

```typescript
onDoubleClick={(category) => {
  // Packs → Dedicated pack creator
  if (category === "sample-pack" || "midi-pack" || "preset-pack") {
    router.push(`/store/${storeId}/products/pack/create?type=${category}`);
  }
  
  // Course → Course creator (separate from products)
  else if (category === "course") {
    router.push(`/store/${storeId}/course/create`);
  }
  
  // Coaching/Services → Coaching creator
  else if (category === "coaching" || "mixing-service" || "mastering-service") {
    router.push(`/store/${storeId}/products/coaching-call/create?type=${category}`);
  }
  
  // Bundle → Bundle creator
  else if (category === "bundle") {
    router.push(`/store/${storeId}/products/bundle/create`);
  }
  
  // Others → Universal wizard (fallback)
  else {
    nextStep(); // Continue with universal wizard
  }
}}
```

## Shared Patterns

### Context Pattern (All Product Types)
```typescript
interface ProductCreationContext {
  state: {
    data: ProductData;
    stepCompletion: StepCompletion;
    isLoading: boolean;
    isSaving: boolean;
    productId?: Id<"table">;
    lastSaved?: Date;
  };
  updateData: (step: string, data: Partial<ProductData>) => void;
  saveProduct: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createProduct: () => Promise<Result>;
}
```

### Layout Pattern (Consistent UI)
- Top nav bar with product type icon
- Progress indicator
- Auto-save status
- Save Draft + Publish buttons
- Step navigation circles
- Animated transitions

### Step Pattern (Clean Forms)
- One concern per step
- Validation before proceeding
- Auto-save on changes
- Next/Back navigation

## Benefits

✅ **Separation of Concerns** - Each product type has focused, maintainable code
✅ **Easier Development** - Build/test one product type at a time
✅ **Better UX** - Optimized flow for each product's needs
✅ **Visual Consistency** - Shared layout components
✅ **Scalability** - Easy to add new product types

## Migration Status

| Product Type | Status | Route | Notes |
|--------------|--------|-------|-------|
| Course | ✅ Complete | `/course/create/` | Fully functional with modules/lessons |
| Coaching | ✅ Exists | `/products/coaching-call/create/` | Already implemented |
| Bundle | ✅ Exists | `/products/bundle/create/` | Already implemented |
| Digital Download | ✅ Exists | `/products/digital-download/create/` | Generic digital products |
| Sample/MIDI/Preset Pack | 🚧 In Progress | `/products/pack/create/` | Context + Layout + Basics form done |
| Ableton Rack | ✅ Exists | `/products/ableton-rack/create/` | Already implemented |
| URL Media | ✅ Exists | `/products/url-media/create/` | Already implemented |
| Lead Magnet | ✅ Exists | `/products/lead-magnet/create/` | Already implemented |
| Playlist Curation | ⏳ To Build | `/products/playlist-curation/create/` | Need to create |

## Next Steps

1. ✅ Complete pack creation steps (Pricing, Follow Gate, Files)
2. ⏳ Create playlist curation dedicated page
3. ⏳ Review and consolidate existing product pages
4. ⏳ Add shared UI components library
5. ⏳ Unified "Edit Product" pages for post-creation management

## File Organization

### Keep
- Individual product type directories under `/products/`
- Shared components in `/products/create/components/` (for selector)
- Course separate under `/course/` (education vs products)

### Consider Consolidating
- Shared form components → `/products/_shared/components/`
- Common types → `/products/_shared/types/`
- Utilities → `/products/_shared/utils/`

