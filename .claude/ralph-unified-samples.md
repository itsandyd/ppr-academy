# Ralph Wiggum Loop: Unified Samples & Packs System

## Objective

Build a unified sample management system where creators can:
1. Upload individual samples that are sellable separately
2. Bundle those same samples into packs (discounted bundles)
3. Customers can choose: buy individual sample OR buy the pack for all

This creates a flexible marketplace where samples can exist both independently AND within packs.

---

## Current Architecture (Reference)

```
CURRENT STATE:
┌─────────────────────────────────────────────────────────────┐
│  audioSamples table          │  digitalProducts table       │
│  (Individual samples)        │  (Packs with embedded files) │
├─────────────────────────────────────────────────────────────┤
│  - Separate entries          │  - packFiles: JSON string    │
│  - Sold with credits         │  - Sold as bundle            │
│  - No link to packs          │  - No link to audioSamples   │
└─────────────────────────────────────────────────────────────┘
                    ↓ NOT CONNECTED ↓

TARGET STATE:
┌─────────────────────────────────────────────────────────────┐
│  audioSamples table (enhanced)                              │
├─────────────────────────────────────────────────────────────┤
│  - packIds: array of pack IDs this sample belongs to        │
│  - individualPrice: price when sold separately              │
│  - Can exist in multiple packs                              │
│  - Linked to digitalProducts via packIds                    │
└─────────────────────────────────────────────────────────────┘
                    ↓ LINKED ↓
┌─────────────────────────────────────────────────────────────┐
│  digitalProducts table (packs)                              │
├─────────────────────────────────────────────────────────────┤
│  - sampleIds: array of audioSamples IDs in this pack        │
│  - packPrice: discounted bundle price                       │
│  - Can contain samples also sold individually               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Schema & Database Updates

### Requirements

1. **Update Convex schema** (`/convex/schema.ts`):
   - Add `packIds` field to `audioSamples` table: `v.optional(v.array(v.id("digitalProducts")))`
   - Add `individualPrice` field to `audioSamples` table: `v.optional(v.number())`
   - Add `sampleIds` field to `digitalProducts` table: `v.optional(v.array(v.id("audioSamples")))`
   - Add index `by_packId` on `audioSamples` for efficient pack lookups

2. **Create migration script** or update existing samples:
   - Existing `audioSamples` get `packIds: []` (empty array)
   - Existing packs keep `packFiles` for backwards compatibility
   - New packs will use `sampleIds` array instead

3. **Update Convex queries** (`/convex/samples.ts`):
   - Add `getSamplesByPackId` query
   - Add `addSampleToPack` mutation
   - Add `removeSampleFromPack` mutation
   - Update `getPublishedSamples` to include pack membership info

### Success Criteria - Phase 1

- [ ] Schema updated with new fields (packIds, individualPrice, sampleIds)
- [ ] Index `by_packId` created on audioSamples
- [ ] `getSamplesByPackId` query returns samples for a given pack
- [ ] `addSampleToPack` mutation links sample to pack bidirectionally
- [ ] `removeSampleFromPack` mutation unlinks sample from pack
- [ ] `npx convex codegen` runs without errors
- [ ] `npm run typecheck` passes

---

## Phase 2: Individual Sample Upload Flow

### Requirements

1. **Create sample upload page** (`/app/dashboard/create/sample/page.tsx`):
   - Upload audio file to Convex storage
   - Set title, description, genre, category, BPM, key
   - Set individual price (in credits)
   - Option to add to existing packs during upload
   - Audio preview player

2. **Create sample upload context** (`/app/dashboard/create/sample/context.tsx`):
   - SampleData interface with all fields
   - createSample mutation wrapper
   - updateSample mutation wrapper

3. **Create SampleBasicsForm component**:
   - Audio file upload with waveform preview
   - Auto-detect BPM/key if possible (use existing audio analysis)
   - Title, description, genre, category fields
   - Tags input

4. **Create SamplePricingForm component**:
   - Individual price input (credits)
   - "Add to Pack" multi-select dropdown
   - Shows packs this sample will be included in

5. **Update DashboardSidebar** (`/app/dashboard/components/DashboardSidebar.tsx`):
   - Add "Upload Sample" link in create mode under a new "Samples" section

### Success Criteria - Phase 2

- [ ] `/dashboard/create/sample` route exists and renders
- [ ] Audio file upload works and stores in Convex
- [ ] Sample metadata (title, genre, BPM, etc.) saves correctly
- [ ] Individual price can be set
- [ ] Sample can be added to existing packs during creation
- [ ] Sidebar shows "Upload Sample" link in create mode
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## Phase 3: Pack Creation with Sample Selection

### Requirements

1. **Update PackFilesForm** (`/app/dashboard/create/pack/steps/PackFilesForm.tsx`):
   - Add "Add Existing Samples" section
   - Show list of creator's existing samples
   - Checkbox selection to add samples to pack
   - Show selected samples with ability to remove
   - Keep existing file upload for new files

2. **Create SampleSelector component** (`/app/dashboard/create/pack/components/SampleSelector.tsx`):
   - Fetch creator's samples via `getStoreSamples`
   - Search/filter samples by name, genre, category
   - Multi-select with visual feedback
   - Show sample preview (play button)
   - Display individual price for reference

3. **Update pack context** (`/app/dashboard/create/pack/context.tsx`):
   - Add `selectedSampleIds` to PackData interface
   - Update `mapToCreateParams` to include sampleIds
   - Update `mapToUpdateParams` to sync sampleIds

4. **Update pack creation mutation** to:
   - Store `sampleIds` array in digitalProducts
   - Update each selected sample's `packIds` array
   - Calculate suggested pack price based on individual prices

### Success Criteria - Phase 3

- [ ] PackFilesForm shows "Add Existing Samples" section
- [ ] Creator can search and select from their existing samples
- [ ] Selected samples show in the pack with remove option
- [ ] Pack saves with `sampleIds` array populated
- [ ] Selected samples have their `packIds` updated to include this pack
- [ ] Pack price suggestion works (sum of individual prices with discount)
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## Phase 4: Marketplace Display & Purchase Logic

### Requirements

1. **Update marketplace samples page** (`/app/marketplace/samples/page.tsx`):
   - Show "Also in Pack" badge for samples that belong to packs
   - Click badge to see pack options with savings
   - "Buy Individual" vs "Buy Pack & Save X%" options

2. **Create SamplePurchaseModal component**:
   - Shows sample details
   - Option 1: Buy individual sample (X credits)
   - Option 2: Buy pack containing this sample (Y credits, save Z%)
   - List other samples included in pack
   - Highlight if user already owns some samples from pack

3. **Update purchase logic** (`/convex/samples.ts` & `/convex/library.ts`):
   - `purchaseIndividualSample` mutation
   - Check if user already owns sample (individually OR via pack)
   - `getOwnedSamples` query that checks both individual purchases AND pack ownership

4. **Smart ownership detection**:
   - If user owns pack → owns all samples in pack
   - If user owns individual sample → don't charge again in pack (pro-rate)
   - Show "Already Owned" badge appropriately

### Success Criteria - Phase 4

- [ ] Samples in packs show "Also in Pack" badge
- [ ] Clicking badge shows pack purchase option
- [ ] Purchase modal shows both individual and pack options
- [ ] Individual sample purchase works and grants access
- [ ] Ownership correctly detected (individual OR via pack)
- [ ] "Already Owned" badge shows for owned samples
- [ ] Price calculation accounts for already-owned samples
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## Phase 5: Dashboard & Library Updates

### Requirements

1. **Update My Samples page** (`/app/dashboard/samples/page.tsx`):
   - Show samples owned individually vs via pack
   - Group by "Individual Purchases" and "From Packs"
   - Show which packs each sample came from

2. **Create Sample Management page** (`/app/dashboard/samples/manage/page.tsx`) for creators:
   - List all creator's uploaded samples
   - Show which packs each sample is in
   - Edit sample details
   - Add/remove from packs
   - View sales analytics per sample

3. **Update Downloads page** if needed:
   - Ensure individually purchased samples appear
   - Ensure pack samples appear
   - No duplicates if owned both ways

### Success Criteria - Phase 5

- [ ] My Samples page shows ownership source (individual vs pack)
- [ ] Creator can manage their uploaded samples
- [ ] Creator can see which packs contain each sample
- [ ] Creator can add/remove samples from packs
- [ ] Downloads page shows all owned samples without duplicates
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## Technical Specifications

### Database Schema Changes

```typescript
// convex/schema.ts additions

audioSamples: defineTable({
  // ... existing fields ...
  packIds: v.optional(v.array(v.id("digitalProducts"))), // Packs this sample belongs to
  individualPrice: v.optional(v.number()),               // Price when sold separately
  isIndividuallySellable: v.optional(v.boolean()),       // Can be purchased alone
})
  .index("by_storeId", ["storeId"])
  .index("by_published", ["isPublished"])
  .index("by_packId", ["packIds"]) // New index for pack lookups

digitalProducts: defineTable({
  // ... existing fields ...
  sampleIds: v.optional(v.array(v.id("audioSamples"))),  // Linked samples
  // packFiles remains for backwards compatibility with uploaded-only packs
})
```

### Key Mutations Needed

```typescript
// convex/samples.ts

// Link sample to pack (bidirectional)
addSampleToPack: mutation({
  args: {
    sampleId: v.id("audioSamples"),
    packId: v.id("digitalProducts")
  },
  handler: async (ctx, args) => {
    // 1. Add packId to sample's packIds array
    // 2. Add sampleId to pack's sampleIds array
  }
});

// Unlink sample from pack
removeSampleFromPack: mutation({
  args: {
    sampleId: v.id("audioSamples"),
    packId: v.id("digitalProducts")
  },
  handler: async (ctx, args) => {
    // 1. Remove packId from sample's packIds array
    // 2. Remove sampleId from pack's sampleIds array
  }
});

// Check ownership (individual OR via pack)
checkSampleOwnership: query({
  args: {
    userId: v.string(),
    sampleId: v.id("audioSamples")
  },
  handler: async (ctx, args) => {
    // 1. Check if user has individual purchase
    // 2. Check if user owns any pack containing this sample
    // Return: { owned: boolean, source: "individual" | "pack" | null, packId?: Id }
  }
});
```

### File Structure

```
/app/dashboard/
├── create/
│   ├── sample/                      # NEW - Individual sample upload
│   │   ├── page.tsx
│   │   ├── context.tsx
│   │   └── steps/
│   │       ├── SampleBasicsForm.tsx
│   │       └── SamplePricingForm.tsx
│   └── pack/
│       ├── components/
│       │   └── SampleSelector.tsx   # NEW - Select existing samples
│       └── steps/
│           └── PackFilesForm.tsx    # UPDATE - Add sample selection
├── samples/
│   ├── page.tsx                     # UPDATE - Show ownership source
│   └── manage/
│       └── page.tsx                 # NEW - Creator sample management

/convex/
├── schema.ts                        # UPDATE - New fields & indexes
├── samples.ts                       # UPDATE - New mutations & queries
└── library.ts                       # UPDATE - Ownership detection
```

---

## Implementation Order

1. **Phase 1** (Schema) - Foundation, must be first
2. **Phase 3** (Pack Selection) - Enables adding existing samples to packs
3. **Phase 2** (Sample Upload) - Enables creating individual samples
4. **Phase 4** (Marketplace) - Connects purchase flow
5. **Phase 5** (Dashboard) - Polish and management

Note: Phase 3 before Phase 2 because it's less work to add sample selection to existing pack flow than to build entire new sample upload flow first.

---

## Completion Promise

When ALL phases are complete and ALL success criteria are met:

<promise>UNIFIED_SAMPLES_SYSTEM_COMPLETE</promise>

---

## Safety & Testing

Before marking any phase complete:

1. Run `npx convex codegen` - must pass
2. Run `npm run typecheck` - must pass with 0 errors
3. Run `npm run lint` - must pass
4. Run `npm run build` - must complete successfully
5. Manual test:
   - Create individual sample
   - Add sample to pack during pack creation
   - Purchase individual sample
   - Purchase pack
   - Verify ownership detection works both ways
   - Verify no duplicate downloads

---

## Notes

- Maintain backwards compatibility with existing `packFiles` JSON approach
- New packs can use either `packFiles` OR `sampleIds` (or both)
- Individual samples without `packIds` continue to work as before
- Credits system remains unchanged - just new purchase paths
- Consider adding "You save X%" messaging when buying pack vs individual
