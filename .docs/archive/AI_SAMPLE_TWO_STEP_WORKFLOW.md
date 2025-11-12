# AI Sample Generator - Two-Step Workflow

## Overview
The AI Sample Generator now uses a simplified two-step workflow that allows admins to preview generated audio before adding metadata and pricing.

## Workflow Steps

### Step 1: Generate Audio 🎵
**Location**: `/admin/generate-samples`

**User Input:**
- **Sound Description** (required) - Detailed description of the sound effect
- **Duration** (0.5 - 5 seconds) - Length of the audio sample

**Process:**
1. User enters a description (e.g., "Deep cinematic boom with reverb")
2. Clicks "Generate Audio"
3. ElevenLabs AI generates the sound effect
4. Audio file is temporarily saved
5. User proceeds to Step 2

**Backend:**
- `audioGeneration.generateAudioOnly` action
- Calls `audioGenerationNode.callElevenLabsSFX` (Node.js action)
- Returns file path and audio URL

### Step 2: Add Metadata & Publish 📝
**UI Shows:**
- 🎵 **Audio Player** - Full preview of the generated sound
- Original description used for generation
- Visual loading state while audio is being prepared

**User Input:**
- **Title** (required) - Auto-suggested from description, editable
- **Category** (required) - fx, drums, bass, synth, vocals, melody, loops, one-shots
- **Genre** (optional) - e.g., electronic, cinematic
- **Tags** (optional) - Comma-separated keywords
- **Credit Price** (required) - How many credits to charge
- **License Type** (required) - royalty-free, commercial, exclusive

**Actions:**
- **← Back** - Return to Step 1 (discards current audio)
- **Publish to Marketplace** - Save sample with metadata

**Backend:**
- `audioGeneration.saveSampleToMarketplace` action
- Uploads audio to Convex storage
- Creates `audioSamples` record
- Cleans up temporary file
- Returns saved sample data

## Benefits of Two-Step Workflow

### ✅ User Experience
- **Preview First**: Full audio playback before deciding on price/metadata
- **Simplified Generation**: Focus on the creative description
- **Quality Control**: Don't publish bad samples
- **Iterative**: Easy to regenerate if not satisfied
- **Instant Playback**: Audio uploaded to Convex storage for immediate preview

### ✅ Development
- **Separation of Concerns**: Audio generation vs. business logic
- **Reusable**: Generation can be used for other features
- **Cost Efficient**: Don't create DB records for rejected samples

## Technical Details

### Convex Functions

#### `generateAudioOnly` (Action)
```typescript
{
  description: string;
  duration: number;
}
→ { 
  success: boolean; 
  filePath?: string;      // Temp file path on Convex server
  audioUrl?: string;      // Convex storage URL for preview (1hr expiry)
  error?: string;
}
```
**Process:**
1. Calls ElevenLabs API to generate audio
2. Saves to temp file
3. Uploads to Convex storage
4. Returns preview URL for immediate playback

#### `saveSampleToMarketplace` (Action)
```typescript
{
  userId: string;
  storeId: string;
  filePath: string;
  title: string;
  description: string;
  duration: number;
  genre: string;
  category: "fx" | "drums" | ...;
  tags: string[];
  creditPrice: number;
  licenseType: "royalty-free" | "commercial" | "exclusive";
}
→ AudioSample
```

### Frontend State Management
```typescript
const [step, setStep] = useState<"generate" | "metadata">("generate");
const [generatedAudio, setGeneratedAudio] = useState<{
  filePath: string;
  audioUrl?: string;
  description: string;
} | null>(null);
```

## Future Enhancements
- [ ] Audio waveform visualization
- [ ] Batch generation (multiple variations)
- [ ] A/B comparison of variations
- [ ] Save drafts without publishing
- [ ] Share preview link before publishing

