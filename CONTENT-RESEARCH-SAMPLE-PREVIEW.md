# Content Research: Sample/Sound Preview System

**Research date:** 2026-02-24
**Purpose:** Inform content about why most sample packs don't sell and how PausePlayRepeat solves the "blind zip file" problem.

---

## 1. Sample Pack Product Type: Schema & Storage

### Two Parallel Systems

The platform runs two sample pack systems side by side:

**System A — `audioSamples` table (individual sounds)**
Each sound is its own database record with a streamable URL. Schema fields (`convex/schema.ts:3009-3068`):

| Field | Type | Purpose |
|---|---|---|
| `storageId` | `Id<"_storage">` | Convex storage reference |
| `fileUrl` | `string` | **Public streaming URL** — this is what the player hits |
| `fileName` | `string` | Original filename |
| `fileSize` | `number` | Bytes |
| `duration` | `number` | Seconds |
| `format` | `string` | `"wav"`, `"mp3"`, `"aiff"` |
| `bpm` | `number?` | Detected or manual BPM |
| `key` | `string?` | Musical key (`"C"`, `"Am"`, `"D#"`, etc.) |
| `genre` | `string` | Genre classification |
| `category` | `union` | `drums`, `bass`, `synth`, `vocals`, `fx`, `melody`, `loops`, `one-shots` |
| `waveformData` | `number[]?` | Amplitude peaks for visual waveform |
| `creditPrice` | `number` | Cost in credits |
| `isIndividuallySellable` | `boolean?` | Can be purchased alone (default true) |
| `packIds` | `Id<"digitalProducts">[]?` | Which packs this sample belongs to |
| `plays` | `number` | Play count tracker |
| `downloads` | `number` | Purchase count |
| `licenseType` | `union` | `royalty-free`, `exclusive`, `commercial` |

**System B — `digitalProducts` table with `productCategory: "sample-pack"`**
Unified product system storing packs alongside all other product types. Pack files stored as JSON-stringified `packFiles` field containing `{name, storageId, size, type}` objects. Can also link to `audioSamples` via optional `sampleIds` array.

**System C — Legacy `samplePacks` table** (`schema.ts:3079-3126`)
Older dedicated table with `sampleIds` array pointing to `audioSamples` records. Still functional, being superseded by the digitalProducts system.

### How Audio Files Are Stored

- Files stored in **Convex Storage** (not S3 or external CDN)
- Upload via `ctx.storage.generateUploadUrl()` → client-side upload → `storageId` saved
- Public streaming URL generated via `ctx.storage.getUrl(storageId)` and saved as `fileUrl`
- Supported formats: WAV, MP3, AIFF, FLAC, OGG
- Max upload size: 50MB per file

---

## 2. Individual Sample Preview: YES, Fully Implemented

**This is the key differentiator you can talk about in content.**

### How It Works

The samples marketplace (`app/marketplace/samples/page.tsx`) implements individual sound preview:

1. **Every sample has a play button.** The `handlePlayPause()` function (line 167) sets `audioRef.current.src = sample.fileUrl` and calls `.play()`.
2. **One sound at a time.** Clicking a different sample stops the current one and starts the new one.
3. **Both individual samples AND samples extracted from packs are browsable.** The page combines two queries:
   - `api.samples.getPublishedSamplesWithPackInfo` — legacy individual samples
   - `api.packSamples.getSamplesFromPacks` — extracts individual files from pack metadata and presents them as browsable sounds
4. **HTML5 `<audio>` element** — no third-party audio library, just native browser audio.

### What Buyers Can Do Before Purchasing

- Browse by genre (14 genres: Hip Hop, Trap, R&B, Pop, Electronic, House, Techno, Drum & Bass, Dubstep, Lo-Fi, Ambient, Indie, Rock, Jazz)
- Filter by category (8 categories: drums, bass, synth, vocals, fx, melody, loops, one-shots)
- Search by text
- **Click play on any individual sound and hear it instantly**
- See BPM, key, duration, format metadata per sound
- Toggle between grid and list views
- Switch between "Samples" tab (individual sounds) and "Packs" tab (bundles)

### Contentable Claim

> "Buyers can preview every individual sound in a pack before purchasing — not just a mixed-down demo loop."

This is accurate. The `getSamplesFromPacks` query (`convex/packSamples.ts`) extracts individual files from pack metadata and returns them with composite IDs (`packId_fileIndex`), each with its own playable URL.

### Audio Player Components

| Component | Location | Used For |
|---|---|---|
| `AudioPlayer` | `components/ui/audio-player.tsx` | General audio playback (3 variants: default, compact, minimal) |
| `AudioWaveform` | `components/ui/audio-waveform.tsx` | Canvas-based waveform with Web Audio API decoding |
| Course `AudioPlayer` | `app/dashboard/courses/[slug]/components/AudioPlayer.tsx` | AI narration playback |
| Desktop `AudioPlayer` | `desktop/src/renderer/components/AudioPlayer.tsx` | Electron desktop app |

### Audio Analysis (`lib/audio-analyzer.ts`)

- BPM detection via onset detection + autocorrelation (range: 60-200 BPM)
- Key detection via zero-crossing rate + frequency estimation
- All 12 notes mapped with major/minor classification
- Progress reporting: loading → decoding → analyzing → complete

### Technology

- **No third-party audio libraries** (no howler.js, wavesurfer.js, tone.js)
- Native HTML5 `<audio>` element + Web Audio API for waveform generation
- Canvas rendering for waveform visualization
- React state management for playback

---

## 3. Individual vs. Whole Pack Purchase

### Both Options Exist

**Individual sample purchase:** YES
- `api.samples.purchaseSample` mutation — buys a single sound with credits
- `isIndividuallySellable` field (default: true) — creators can disable this per sound
- `individualPrice` field — optional different price when sold separately vs. in pack
- Credit system: buyer pays credits → 10% platform fee → 90% to creator

**Pack purchase:** YES
- `api.samplePacks.purchaseDigitalPack` mutation — buys the entire pack
- Handles both free packs (with follow gate) and paid packs
- Prevents duplicate purchases (returns `alreadyOwned: true` message)

**Ownership check:** `checkFullSampleOwnership` query checks if user owns a sample either:
- Individually (direct purchase)
- Via pack ownership (bought a pack containing the sample)

### Contentable Claim

> "Buy individual sounds or the whole pack — your choice."

This is accurate per the schema and mutations.

---

## 4. Beat Preview System

### Audio Preview: YES

Beats have full audio preview before purchase. Implementation in `app/marketplace/beats/[slug]/BeatDetailClient.tsx`:

- `demoAudioUrl` field on `digitalProducts` table stores the preview audio
- Fallback chain: `beat.previewUrl || beat.audioUrl || beat.downloadUrl`
- Full player with: play/pause, timeline seeking, volume control, mute, skip-back
- Overlay play button on beat image (appears on hover with pulsing animation)
- Marketplace listing page also has inline preview players

### Licensing Tier System

Four tiers defined in `convex/beatLeases.ts` (lines 8-13) with defaults in `app/dashboard/create/beat-lease/types.ts`:

| Tier | Default Price | Files | Distribution | Commercial | Stems | Credit Required |
|---|---|---|---|---|---|---|
| **Basic** | $25 | MP3 + WAV | 5,000 copies | Yes | No | Yes |
| **Premium** | $75 | MP3 + WAV + Stems | 50,000 copies | Yes | Yes | Yes |
| **Exclusive** | $500 | MP3 + WAV + Stems + Trackouts | Unlimited | Yes | Yes | No (optional) |
| **Unlimited** | — | All files | Unlimited | Yes | Yes | — |

Schema storage: `beatLeaseConfig.tiers[]` on `digitalProducts` table, each tier with: `type`, `enabled`, `price`, `name`, `distributionLimit`, `streamingLimit`, `commercialUse`, `musicVideoUse`, `radioBroadcasting`, `stemsIncluded`, `creditRequired`.

UI component: `components/beats/LicenseTierPicker.tsx` — comparison cards for each tier.

### Free Download / Lead Gen Flow

**Current state: Partially implemented.**

What exists:
- Free tier type defined (`beat-lease/types.ts`): $0, MP3 only (tagged), 1,000 copies max, no commercial use, credit required
- Free lease contract template (`contracts.ts`): full legal agreement for free downloads
- UI toggle in `LicensingForm.tsx`: "Free License - Lead Magnet" switch
- Follow gate infrastructure in schema (see section below)

What's **not** wired up:
- Free tier is **filtered out** when building `beatLeaseConfig` (context.tsx line 13: `filter(opt => opt.enabled && opt.type !== "free")`)
- Checkout route (`/api/beats/create-checkout-session/route.ts`) only handles paid tiers
- No email gate or follow gate integration for free beat downloads specifically

**Follow Gate System** (exists for other products, defined in `schema.ts:218-259`):

```
followGateEnabled: boolean
followGateRequirements: { requireEmail, requireInstagram, requireTiktok, requireYoutube, requireSpotify, minFollowsRequired }
followGateSteps: [{ platform, url, mandatory, order }]
followGateSocialLinks: { instagram, tiktok, youtube, spotify, soundcloud, appleMusic, deezer, twitch, mixcloud, facebook, twitter, bandcamp }
followGateMessage: string
followGateSubmissions: separate table tracking completions
```

Supported platforms: email, Instagram, TikTok, YouTube, Spotify, SoundCloud, Apple Music, Deezer, Twitch, Mixcloud, Facebook, Twitter, Bandcamp.

### Contentable Claim

> "Every beat has a full audio preview. Pick your license tier and hear exactly what you're buying."

Accurate. The demo audio plays directly from the marketplace.

> "Free downloads require social follows — turning every freebie into a follower."

Partially accurate — the infrastructure exists and works for courses and digital products, but is **not yet connected** for beat leases specifically.

---

## 5. Exclusive Beat Auto-Removal

### Fully Implemented and Automatic

When an exclusive license is purchased, the beat is **immediately and automatically** removed from the marketplace.

**Technical flow** (`convex/beatLeases.ts:238-258`):

1. Stripe payment succeeds → webhook fires
2. `createBeatLicensePurchase` mutation validates:
   - Beat exists
   - `beat.exclusiveSoldAt` is null (not already sold exclusively)
   - Tier exists and is enabled
   - Buyer doesn't already own any license for this beat
3. Creates purchase record + beatLicense record
4. Calls `markBeatAsExclusivelySold` which patches the beat:
   ```
   exclusiveSoldAt: Date.now()
   exclusiveSoldTo: userId
   exclusivePurchaseId: purchaseId
   isPublished: false          ← THIS HIDES IT FROM MARKETPLACE
   ```
5. Marketplace queries filter `isPublished === true` → beat disappears instantly
6. `isBeatAvailable` query returns `{ available: false, reason: "This beat has been sold exclusively" }`

**UI feedback** (`BeatDetailClient.tsx`):
- Checks `isExclusivelySold = product?.exclusiveSoldAt != null`
- Shows "Exclusively Sold" badge with Crown icon
- Disables all licensing tier picker
- Message: "This beat has been purchased exclusively and is no longer available"
- All purchase buttons hidden

**Race condition protection:** If two buyers try to purchase exclusively at the same time, the second one gets: "This beat has already been sold exclusively" error.

### Contentable Claim

> "When a beat sells exclusively, it's automatically removed from the marketplace. No manual delisting. The buyer gets true exclusivity, enforced by the system."

Accurate. This is handled by `isPublished: false` in `markBeatAsExclusivelySold` at `convex/beatLeases.ts:255`.

---

## 6. Other Product Types: Preview Capabilities

### Preview Matrix

| Product Type | Audio Preview | Visual Preview | How |
|---|---|---|---|
| **Sample Packs** | **Individual sound playback** | Pack cover image | Each sample has `fileUrl`, play button per sound |
| **Beats** | **Full demo audio** | Beat artwork | `demoAudioUrl` with full player controls |
| **Preset Packs** | **Audio demo** | Product image + play overlay | `demoAudioUrl` in `PresetPackDetailClient.tsx` |
| **Ableton Racks** | **Audio demo** | Chain screenshot + macro screenshots gallery | `demoAudioUrl`, `chainImageUrl`, `macroScreenshotUrls[]` |
| **Project Files** | No audio preview | Product thumbnail only | Image + text description of what's included |
| **Mixing Templates** | No audio preview | Product thumbnail only | Image + genre tags + installation instructions |
| **MIDI Packs** | No audio preview | Product image only | Image + metadata only |
| **Courses** | N/A | Course thumbnail + lesson structure | Lesson list visible, AI narration for enrolled users |

### Preset Pack Detail (`app/marketplace/preset-packs/[slug]/PresetPackDetailClient.tsx`)

- `demoAudioUrl` field stores a 30-second audio showing how the presets sound
- Play/pause overlay button centered on product image
- Plugin target badge (Serum, Vital, Wavetable, etc.)
- Preset count badge visible

### Ableton Rack Detail (`app/marketplace/ableton-racks/[slug]/page.tsx`)

- `demoAudioUrl` — Audio demo with native browser `<audio controls>`
- `chainImageUrl` — Screenshot of the full device chain
- `macroScreenshotUrls[]` — Gallery of macro control screenshots (2-column grid)
- "Listen to Demo" button scrolls to audio section
- Metadata: rack type, Ableton version, CPU load, macro count, file format, file size, included effects, third-party plugin requirements

### Contentable Claims

> "Preview samples, beats, presets, and racks — all with audio demos before you buy."

Accurate for sample packs, beats, preset packs, and Ableton racks. Not accurate for project files, mixing templates, or MIDI packs.

> "For Ableton racks, see the device chain layout AND hear the effect before purchasing."

Accurate. Both `chainImageUrl` and `demoAudioUrl` are implemented.

---

## 7. Key File Reference

### Schema & Backend

| File | What It Defines |
|---|---|
| `convex/schema.ts:3009-3068` | `audioSamples` table — individual sound records |
| `convex/schema.ts:3079-3126` | `samplePacks` table — legacy pack collections |
| `convex/schema.ts:1089-1250` | `digitalProducts` table — unified product system (all types) |
| `convex/schema.ts:1848-1885` | `beatLicenses` table — license records |
| `convex/schema.ts:3129-3152` | `sampleDownloads` table — purchase tracking |
| `convex/schema.ts:218-259` | Follow gate configuration fields |
| `convex/samples.ts` | Sample CRUD, purchase, play count, favorites |
| `convex/samplePacks.ts` | Pack CRUD, purchase (both legacy and digital) |
| `convex/packSamples.ts` | Extract individual files from pack metadata |
| `convex/beatLeases.ts` | License creation, exclusive delist, tier retrieval |
| `convex/files.ts` | Upload URL generation, file URL retrieval, deletion |

### Frontend Components

| File | What It Does |
|---|---|
| `app/marketplace/samples/page.tsx` | **Samples marketplace** — browse, filter, preview, purchase |
| `app/marketplace/beats/[slug]/BeatDetailClient.tsx` | Beat detail page with full audio player |
| `app/marketplace/preset-packs/[slug]/PresetPackDetailClient.tsx` | Preset pack detail with audio demo |
| `app/marketplace/ableton-racks/[slug]/page.tsx` | Ableton rack detail with audio + visual previews |
| `components/ui/audio-player.tsx` | Reusable audio player (3 variants) |
| `components/ui/audio-waveform.tsx` | Canvas waveform with Web Audio API |
| `components/beats/LicenseTierPicker.tsx` | License tier comparison cards |
| `lib/audio-analyzer.ts` | BPM + key detection |
| `app/dashboard/create/beat-lease/types.ts` | Tier type definitions and defaults |
| `app/dashboard/create/beat-lease/contracts.ts` | Legal contract templates (including free tier) |

---

## 8. Content-Ready Facts

These are specific, verifiable claims you can make:

1. **"Buyers can preview every individual sound before purchasing"** — True. Each `audioSample` has a `fileUrl` and play button. Pack samples are also extracted and individually playable.

2. **"8 sample categories to browse: drums, bass, synth, vocals, fx, melody, loops, one-shots"** — True. Defined in schema as a union type.

3. **"14 genre filters including Hip Hop, Trap, R&B, Electronic, House, Lo-Fi"** — True. Defined in the marketplace page constants.

4. **"Buy a single sound or the whole pack"** — True. `purchaseSample` (individual) and `purchaseDigitalPack` (whole pack) are separate mutations.

5. **"Every beat has audio preview with full playback controls"** — True. Demo audio, timeline, volume, skip.

6. **"4 licensing tiers: Basic ($25), Premium ($75), Exclusive ($500), and Unlimited"** — True, though prices are configurable per beat. Those are defaults.

7. **"Exclusive beats auto-delist from the marketplace the instant they sell"** — True. `isPublished: false` set in `markBeatAsExclusivelySold`.

8. **"Race-condition protected: if two people try to buy exclusive at the same time, only one succeeds"** — True. The mutation checks `exclusiveSoldAt` before processing.

9. **"Preset packs and Ableton racks both have audio demos"** — True. Both use `demoAudioUrl`.

10. **"Ableton racks show device chain layout and macro control screenshots alongside audio"** — True. `chainImageUrl` + `macroScreenshotUrls[]` + `demoAudioUrl`.

11. **"BPM and key are auto-detected from uploaded audio"** — True. `lib/audio-analyzer.ts` uses Web Audio API for onset detection and frequency analysis.

12. **"Waveform visualization generated from actual audio data, not generic"** — True. `AudioWaveform` component decodes audio via `AudioContext.decodeAudioData()` and renders 100 amplitude bars on canvas.

13. **"Creators keep 90% of every sale"** — True. 10% platform fee, 90% creator payout via credit system.

---

## 9. Gaps / Opportunities to Mention in Content

These are features that are **not** yet implemented but could be mentioned as coming soon or as differentiators to build:

1. **Free beat download with follow gate** — Infrastructure exists (schema, UI toggle, contract template) but not connected to checkout for beats specifically. Works for other product types.

2. **Project file audio preview** — No `demoAudioUrl` support. Buyers can only see a thumbnail and description.

3. **Mixing template audio preview** — Same gap. No before/after audio comparison.

4. **MIDI pack preview** — No audio rendering of MIDI files. Only image thumbnails.

5. **Video previews** — No video preview field exists for any product type. Could show setup walkthroughs, usage tutorials.
