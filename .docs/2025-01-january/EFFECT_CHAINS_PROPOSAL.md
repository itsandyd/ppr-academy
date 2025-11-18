# Effect Chains Category - Proposal

**Date**: 2025-11-17  
**Decision**: Rename "Ableton Rack" → "Effect Chain"  
**Goal**: Support multiple DAWs while allowing DAW-specific filtering

---

## The Change

### Before
- Product Category: `ableton-rack`
- Label: "Ableton Rack"
- Only supports Ableton Live

### After
- Product Category: `effect-chain`
- Label: "Effect Chain"
- Supports: Ableton, FL Studio, Logic, Bitwig, Studio One, etc.

---

## How It Works

### Creation Flow

When creating an effect chain:

```
Step 1: Basics
  ├── Title: "Fat Bass Chain"
  ├── Description: "Compression + saturation..."
  └── DAW Type: [Dropdown]
      ○ Ableton Live
      ○ FL Studio
      ○ Logic Pro
      ○ Bitwig Studio
      ○ Studio One
      ○ Other/Multi-DAW

Step 2: Files
  └── Upload .adg, .fnp, .cst, etc.

Step 3: Pricing

Step 4: Publish
```

### Database Structure

```typescript
{
  _id: "chain_123",
  productCategory: "effect-chain",  // Main category
  productType: "effectChain",        // Technical type
  
  // DAW-specific metadata
  dawType: "ableton",  // or "fl-studio", "logic", "bitwig"
  dawVersion: "11.3",  // Optional
  
  // Files
  files: [{
    name: "Fat_Bass_Chain.adg",
    storageId: "...",
    dawType: "ableton"
  }],
  
  // Standard fields
  title: "Fat Bass Chain",
  description: "...",
  price: 9.99,
}
```

### Filtering/Sorting

Users can still filter by DAW:

```typescript
// All effect chains
effectChains.filter(p => p.productCategory === "effect-chain")

// Only Ableton racks
effectChains.filter(p => 
  p.productCategory === "effect-chain" && 
  p.dawType === "ableton"
)

// Only FL Studio chains
effectChains.filter(p => 
  p.productCategory === "effect-chain" && 
  p.dawType === "fl-studio"
)
```

### Display

**In Products Page**:

```
Tabs:
- All Products
- Courses
- Packs
- Effect Chains (12) ← NEW

Filter within Effect Chains:
[All DAWs] [Ableton (8)] [FL Studio (3)] [Logic (1)]
```

---

## Migration Plan

### Phase 1: Add New Category (Non-Breaking)

1. Add `effect-chain` to product categories
2. Add `dawType` field to schema
3. Keep `ableton-rack` working (backward compatibility)

### Phase 2: Migrate Existing Data

1. Update existing `ableton-rack` products:
   - Set `productCategory = "effect-chain"`
   - Set `dawType = "ableton"`
2. Keep old category as alias

### Phase 3: Update UI

1. Change labels from "Ableton Rack" to "Effect Chain"
2. Add DAW selector in creation flow
3. Add DAW filter in products page

---

## File Extensions by DAW

```typescript
const DAW_FILE_TYPES = {
  ableton: {
    label: "Ableton Live",
    extensions: [".adg", ".adv", ".alp"],
    icon: "🔊"
  },
  "fl-studio": {
    label: "FL Studio",
    extensions: [".fnp", ".flp", ".fst"],
    icon: "🎚️"
  },
  logic: {
    label: "Logic Pro",
    extensions: [".cst", ".logicx"],
    icon: "🎹"
  },
  bitwig: {
    label: "Bitwig Studio",
    extensions: [".bwpreset"],
    icon: "⚡"
  },
  "studio-one": {
    label: "Studio One",
    extensions: [".fxchain", ".multipreset"],
    icon: "🎼"
  },
  "multi-daw": {
    label: "Multi-DAW",
    extensions: [".wav", ".mp3"], // Frozen audio
    icon: "🔗"
  }
};
```

---

## Updated Product Category

```typescript
{
  id: "effect-chain",
  label: "Effect Chain",
  description: "Audio effect chains for Ableton, FL Studio, Logic, and more",
  category: "Music Production",
  icon: "🔊",
  flow: "chain", // New dedicated flow
}
```

---

## Benefits

✅ **Future-proof**: Support any DAW  
✅ **Still filterable**: Users can filter by specific DAW  
✅ **Broader appeal**: Not limited to Ableton users  
✅ **Professional**: "Effect Chain" is industry-standard terminology  
✅ **Flexible**: Can add new DAWs easily

---

## Implementation

**Want me to**:

1. **Just update the label** (quick, non-breaking)
   - Change "Ableton Rack" → "Effect Chain" in UI
   - Keep `ableton-rack` in database for now

2. **Full migration** (proper, takes time)
   - Add `dawType` field
   - Create migration script
   - Update schema
   - Add DAW selector to creation flow

3. **Hybrid approach** (recommended)
   - Add `effect-chain` as new category
   - Keep `ableton-rack` as legacy
   - New products use `effect-chain` + `dawType`
   - Old products still work

**Which approach do you prefer?** 🎯


