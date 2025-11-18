# Sample Pack Creator - Complete Flow

**Date**: 2025-11-17  
**Location**: `/dashboard/create/pack`  
**Purpose**: Shows how individual samples work in the pack flow

---

## 🎯 The Complete Sample Pack Flow

### Step 1: Basics
```
┌─────────────────────────────────────────────┐
│ Pack Basics                                 │
├─────────────────────────────────────────────┤
│                                              │
│ What type of pack?                          │
│ ○ Sample Pack 🎵  (selected)                │
│ ○ Preset Pack 🎛️                            │
│ ○ MIDI Pack 🎹                               │
│                                              │
│ Pack Title: [Trap Drum Kit Vol 1_________] │
│ Description: [Premium trap samples...____] │
│ Thumbnail: [Upload image________________]   │
│ Tags: [Trap] [808] [Drums]                 │
│                                              │
│              [Back] [Continue →]            │
└─────────────────────────────────────────────┘
```

### Step 2: Pricing
```
┌─────────────────────────────────────────────┐
│ Pricing Model                               │
├─────────────────────────────────────────────┤
│                                              │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ 🎁 Free      │ │ 💰 Paid      │          │
│ │ with Gate    │ │ (SELECTED)   │          │
│ └──────────────┘ └──────────────┘          │
│                                              │
│ Set Pack Price: [$___29___]                │
│                                              │
│              [Back] [Continue →]            │
└─────────────────────────────────────────────┘
```

### Step 3: Upload Individual Samples ⭐ THIS IS WHERE IT HAPPENS

```
┌─────────────────────────────────────────────────────────────┐
│ Pack Files                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Upload individual samples:                                   │
│                                                               │
│ ┌─────────────────────────────────────────────┐             │
│ │     [Select Files] (Upload to Convex)       │             │
│ └─────────────────────────────────────────────┘             │
│                                                               │
│ Uploaded Files (8):                                          │
│                                                               │
│ ┌─────────────────────────────────────────┐                 │
│ │ ✓ Kick_808_Hard.wav      2.3 MB  [×]   │  ← Individual   │
│ └─────────────────────────────────────────┘                 │
│ ┌─────────────────────────────────────────┐                 │
│ │ ✓ Snare_Trap_01.wav      1.8 MB  [×]   │  ← Individual   │
│ └─────────────────────────────────────────┘                 │
│ ┌─────────────────────────────────────────┐                 │
│ │ ✓ HiHat_Closed.wav       0.9 MB  [×]   │  ← Individual   │
│ └─────────────────────────────────────────┘                 │
│ ┌─────────────────────────────────────────┐                 │
│ │ ✓ Clap_Tight.wav         1.1 MB  [×]   │  ← Individual   │
│ └─────────────────────────────────────────┘                 │
│ ... 4 more samples ...                                       │
│                                                               │
│ OR provide download URL:                                     │
│ [https://dropbox.com/..._______________]                     │
│                                                               │
│                    [Back] [Publish Pack →]                   │
└─────────────────────────────────────────────────────────────┘
```

**This is handled by `PackFilesForm.tsx`** - it already exists and works!

---

## 💾 What Gets Saved to Database

When you publish the pack:

```typescript
{
  _id: "pack_abc123",
  title: "Trap Drum Kit Vol 1",
  productCategory: "sample-pack",  ← Still specific!
  productType: "digital",
  price: 29,
  
  // Individual samples stored as JSON
  packFiles: JSON.stringify([
    {
      id: "storage_xyz1",
      name: "Kick_808_Hard.wav",
      storageId: "storage_xyz1",
      size: 2400000,
      type: "audio/wav"
    },
    {
      id: "storage_xyz2", 
      name: "Snare_Trap_01.wav",
      storageId: "storage_xyz2",
      size: 1800000,
      type: "audio/wav"
    },
    // ... rest of samples
  ]),
  
  // Other pack metadata
  storeId: "store_123",
  userId: "user_456",
  isPublished: true
}
```

---

## 🛒 How Users Access Individual Samples

### In Your Library Page (Already Built)

You already have code that extracts individual samples:

```typescript
// app/library/page.tsx (lines 98-125)

const purchasedPacks = userPurchases?.filter((purchase: any) => 
  purchase.product?.productCategory === "sample-pack" ||
  purchase.product?.productCategory === "midi-pack" ||
  purchase.product?.productCategory === "preset-pack"
) || [];

// Extract samples from purchased packs
const purchasedSamples = purchasedPacks.flatMap((purchase: any) => {
  const pack = purchase.product;
  if (!pack?.packFiles) return [];
  
  try {
    const files = JSON.parse(pack.packFiles); // ← Parse the JSON
    return files.map((file: any) => ({
      _id: file.storageId,
      title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ''),
      fileName: file.name,
      fileSize: file.size,
      fileUrl: file.url || file.storageId,
      packTitle: pack.title,
      packId: pack._id,
      // Individual sample metadata
    }));
  } catch (e) {
    return [];
  }
});
```

Then displays each sample with a download button!

---

## 🎵 Individual Sample Features (Future Enhancement)

If you want to sell **individual samples** separately from packs, you'd add:

### Option A: During Pack Creation

Add a step after "Files":

```
Step 4: Individual Pricing (Optional)
┌─────────────────────────────────────────┐
│ Allow individual sample sales?          │
│ ☑ Yes, let users buy samples separately │
│                                           │
│ Individual sample price: [$__2__]       │
│                                           │
│ Pack includes 8 samples                  │
│ Pack price: $29                          │
│ Individual total: $16 (if sold separate)│
│ Savings: $13 (45% off)                  │
└─────────────────────────────────────────┘
```

### Option B: Marketplace Logic

When displaying in marketplace:

```typescript
// Show both pack and individual samples
- "Trap Drum Kit Vol 1" - $29 (buy entire pack)
- "Kick_808_Hard.wav" - $2 (individual sample)
- "Snare_Trap_01.wav" - $2 (individual sample)
```

---

## ✅ What Currently Works

**In the Pack creator** (`/dashboard/create/pack`):

1. ✅ **Step 1: Basics** - Choose pack type (Sample/Preset/MIDI), title, description
2. ✅ **Step 2: Pricing** - Free vs Paid for the **entire pack**
3. ✅ **Step 3: Follow Gate** - If free (optional)
4. ✅ **Step 4: Files** - Upload individual samples/presets/MIDI files
   - Upload multiple files
   - Each file stored in Convex storage
   - All files saved as JSON array in `packFiles`
   - Can download to preview
   - Can remove files

**After purchase**:
- ✅ Users can see the pack
- ✅ Users can see all individual samples from the pack
- ✅ Users can download each sample individually

---

## 🚀 What You Can Add (Future)

If you want **individual sample sales**:

1. Add pricing per sample in the Files step
2. Save individual prices in the `packFiles` JSON
3. Display individual samples in marketplace
4. Allow purchase of single samples vs entire pack

**But that's Phase 2!** The current flow works perfectly for pack creation.

---

## Summary

**Your question**: "Where do we add individual samples?"

**Answer**: **Step 4: Files** (`PackFilesForm.tsx`)
- Upload button → Select multiple files
- Each file uploads to Convex storage
- All files stored in `packFiles` JSON array
- Each sample has name, storageId, size, type

**The flow already works!** Just need to test:

```bash
npm run dev
```

Navigate to `/dashboard/create/pack?type=sample-pack` and go through all 4 steps. The Files step is where you upload individual samples! 🎵
