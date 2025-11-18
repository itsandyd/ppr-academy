# PPR Academy - Complete Product Taxonomy

**Date**: 2025-11-17  
**Source**: `app/(dashboard)/store/[storeId]/products/create/types.ts`

---

## Product Type Hierarchy

You have **2 classification systems**:

1. **Product Type** (Technical/Backend) - 6 types
2. **Product Category** (User-Facing/UI) - 23 categories

---

## Product Types (Technical - 6 types)

These determine **how the product functions** on the backend:

| Type | Purpose | Examples |
|------|---------|----------|
| `digital` | Downloadable files | Samples, PDFs, Presets, Courses |
| `coaching` | Bookable sessions | 1:1 Coaching, Mixing Service, Workshops |
| `playlistCuration` | Playlist submission | Spotify playlist curation |
| `abletonRack` | Ableton device chains | Audio effect racks |
| `abletonPreset` | Ableton presets | Instrument presets |
| `urlMedia` | URL-based content | Blog posts, external links |

---

## Product Categories (User-Facing - 23 categories)

These determine **what users see** and **which creation flow** they use:

### 🎵 Music Production (8 categories)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `sample-pack` | digital | 🎵 | Pack creator |
| `preset-pack` | digital | 🎛️ | Pack creator |
| `midi-pack` | digital | 🎹 | Pack creator |
| `ableton-rack` | abletonRack | 🔊 | Rack creator |
| `beat-lease` | digital | 🎹 | Digital download |
| `project-files` | digital | 📁 | Digital download |
| `mixing-template` | digital | 🎚️ | Digital download |
| `bundle` | digital | 📦 | Bundle creator |

**Common trait**: File-based, downloadable, music-focused

---

### 🎓 Education (4 categories)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `course` | digital | 🎓 | Course creator (with lessons) |
| `workshop` | coaching | 👥 | Coaching creator (group) |
| `masterclass` | digital | ⭐ | Digital download |
| `pdf-guide` | digital | 📄 | Digital download |

**Common trait**: Educational, teaching-focused

---

### 💼 Services (4 categories)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `coaching` | coaching | 💬 | Coaching creator (1:1) |
| `mixing-service` | coaching | 🎚️ | Coaching creator (mixing) |
| `mastering-service` | coaching | 💿 | Coaching creator (mastering) |
| `playlist-curation` | playlistCuration | 🎼 | Playlist creator |

**Common trait**: Service-based, time-based, bookable

---

### 📄 Digital Content (3 categories)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `cheat-sheet` | digital | 📋 | Digital download |
| `template` | digital | 🎨 | Digital download |
| `blog-post` | urlMedia | 📝 | URL media creator |

**Common trait**: Content-focused, informational

---

### 👥 Community (1 category)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `community` | digital | 👥 | Digital download |

**Common trait**: Access-based, community-focused

---

### 💝 Support & Donations (2 categories)

| Category | Type | Icon | Flow |
|----------|------|------|------|
| `tip-jar` | digital | ☕ | Digital download |
| `donation` | digital | 💝 | Digital download |

**Common trait**: Support-focused, pay-what-you-want

---

## Grouping by Creation Flow

Based on your current implementation:

### Flow 1: Course Creator (1 category)
- `course` - Needs lesson builder

### Flow 2: Pack Creator (3 categories)
- `sample-pack` - Audio files
- `preset-pack` - Preset files
- `midi-pack` - MIDI files

### Flow 3: Coaching Creator (4 categories)
- `coaching` - 1:1 sessions
- `mixing-service` - Mixing sessions
- `mastering-service` - Mastering sessions
- `workshop` - Group sessions

### Flow 4: Rack Creator (1 category)
- `ableton-rack` - Device chains

### Flow 5: Bundle Creator (1 category)
- `bundle` - Multiple products

### Flow 6: Digital Download Creator (11 categories)
- `beat-lease`
- `project-files`
- `mixing-template`
- `pdf-guide`
- `cheat-sheet`
- `template`
- `masterclass`
- `community`
- `tip-jar`
- `donation`
- All other simple digital products

### Flow 7: URL Media Creator (1 category)
- `blog-post`

### Flow 8: Playlist Creator (1 category)
- `playlist-curation`

---

## Recommended Consolidation

You can unify into **4 core creation flows**:

### 1. Universal Digital Product Creator
**Handles**: All simple digital downloads (14 categories)
- Sample packs, MIDI, Presets (with file uploader)
- PDFs, guides, templates (with file uploader)
- Beat leases, project files
- Tips, donations
- Community access

**Steps**: Basics → Files (if needed) → Pricing → Publish

---

### 2. Course Creator
**Handles**: Courses only (1 category)
- Structured courses with modules/lessons

**Steps**: Basics → Lessons → Pricing → Publish

---

### 3. Service/Booking Creator
**Handles**: All bookable services (5 categories)
- Coaching, mixing, mastering
- Workshops
- Playlist curation

**Steps**: Basics → Pricing → Availability → Publish

---

### 4. Bundle Creator
**Handles**: Product bundles (1 category)

**Steps**: Basics → Select Products → Pricing → Publish

---

## Simplification Opportunity

**Current**: 11 separate creation pages  
**Proposed**: 4 unified flows (or even fewer!)

### Option A: Keep 4 Flows (Recommended)
- Universal Digital (most products)
- Course (unique lesson builder)
- Service/Booking (scheduling)
- Bundle (product selection)

### Option B: Ultra-Unified (3 Flows)
- Universal Creator (handles digital + files)
- Course Creator (lesson builder)
- Service/Booking Creator (scheduling + bundles)

### Option C: Maximum Consolidation (1 Flow!)
- ONE universal creator
- Detects product type
- Shows/hides steps based on category
- Everything in one place

---

## My Recommendation

**Go with Option A: 4 Flows**

**Why**:
- Balances simplicity with power
- Each flow has a clear purpose
- Not too consolidated (confusing) or too fragmented
- Easier to maintain

**Flows**:
1. `/store/[storeId]/create/digital` - Universal digital products
2. `/store/[storeId]/create/course` - Courses with lessons
3. `/store/[storeId]/create/service` - All bookable services
4. `/store/[storeId]/create/bundle` - Product bundles

---

## Summary

**You have**:
- 6 product types (technical)
- 23 product categories (user-facing)
- Currently 11 separate creation flows

**You can consolidate to**:
- 4 unified creation flows
- Shared core steps (Basics, Pricing, Publish)
- Product-specific steps injected where needed

**Benefits**:
- Simpler codebase
- Consistent UX
- Easier to add new product types
- Less maintenance

**Want me to build this?** 🚀


