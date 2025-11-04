# 🎙️ ElevenLabs Direct API Integration

## ✅ What Changed

**Before:** Manual copy/paste to ElevenLabs MCP tool  
**Now:** ✨ **Fully automated** audio generation with ElevenLabs API

---

## Setup

### 1. Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in
3. Navigate to Profile → API Keys
4. Copy your API key

### 2. Add to Environment Variables

Add to your `.env.local`:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for Blotato)
BLOTATO_API_KEY=your_blotato_key

# For automatic audio generation
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Restart Convex

```bash
npx convex dev
```

---

## How It Works

### Complete Workflow (Fully Automated)

```
Plugin Description
       ↓
   Blotato API (optional)
       ↓
   OpenAI GPT-4o (refinement)
       ↓
   ElevenLabs API (audio generation)
       ↓
   Convex Storage (audio hosting)
       ↓
Output: Script + Audio URL
```

### What Happens Automatically

1. **Script Generation** - Blotato → OpenAI creates your script
2. **Audio Generation** - ElevenLabs converts script to speech
3. **Storage** - Audio stored in Convex (no external hosting needed)
4. **Playback** - Audio player embedded in admin panel
5. **Download** - One-click download as MP3

---

## Usage

### In Admin Panel

1. Go to `/admin/plugins`
2. Edit any plugin
3. Scroll to "Generate Short-Form Video Content"
4. **Check** "Auto-generate audio with ElevenLabs" ✅
5. Click "Generate Script + Audio"
6. Wait ~30-60 seconds
7. ✅ Script + Audio ready!

### Features

#### ✅ Auto-Generate Audio (Checkbox Enabled)
- Generates script
- Generates audio automatically
- Stores in Convex
- Shows audio player
- Download button

#### Script Only (Checkbox Disabled)
- Generates script only
- Shows audio script for manual use
- Faster generation (~30s vs ~60s)

---

## Audio Settings

### Default Voice
- **Voice ID:** `pNInz6obpgDQGcFmaJgB` (Adam - professional male voice)
- **Model:** `eleven_turbo_v2_5` (fast, high-quality)
- **Language:** English

### Voice Settings
```typescript
{
  stability: 0.5,           // Balanced consistency
  similarity_boost: 0.75,   // High voice matching
  style: 0,                 // Neutral style
  use_speaker_boost: true   // Enhanced clarity
}
```

### To Change Voice

Edit `convex/pluginVideoGeneration.ts`:

```typescript
args.voiceId || "pNInz6obpgDQGcFmaJgB" // Change this voice ID
```

**Popular Voices:**
- **Adam** (pNInz6obpgDQGcFmaJgB) - Professional male
- **Rachel** (21m00Tcm4TlvDq8ikWAM) - Professional female
- **Bella** (EXAVITQu4vr4xnSDxMaL) - Soft female
- **Antoni** (ErXwobaYiN019PkySvjV) - Well-rounded male

Find more: [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

---

## API Details

### ElevenLabs API Call

**Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Request:**
```typescript
{
  method: "POST",
  headers: {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json"
  },
  body: {
    text: audioScript,
    model_id: "eleven_turbo_v2_5",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true
    }
  }
}
```

**Response:** Audio stream (MP3)

### Convex Storage

Audio files are automatically:
- Stored in Convex Storage
- Given unique IDs
- Publicly accessible via URL
- Automatically managed (no cleanup needed)

---

## Cost Considerations

### ElevenLabs Pricing

**Free Tier:**
- 10,000 characters/month
- ~3-5 scripts/month (60-90 seconds each)

**Starter Plan ($5/month):**
- 30,000 characters/month
- ~10-15 scripts/month

**Creator Plan ($11/month):**
- 100,000 characters/month
- ~35-50 scripts/month

**Pro Plan ($99/month):**
- 500,000 characters/month
- ~175-250 scripts/month

### Character Count Estimate

Your style script (60-90 seconds):
- **~600-900 characters per script**

### Tips to Save Costs

1. ✅ **Uncheck audio generation** when testing scripts
2. ✅ **Review script first** before generating audio
3. ✅ **Reuse audio** for multiple platforms (same script)
4. ✅ **Monitor usage** in ElevenLabs dashboard

---

## Troubleshooting

### "ELEVENLABS_API_KEY not configured"

**Solution:**
- Add `ELEVENLABS_API_KEY` to `.env.local`
- Restart Convex: `npx convex dev`
- Checkbox will still work, but audio won't generate

### "ElevenLabs API error: 401"

**Solution:**
- Invalid API key
- Check key in ElevenLabs dashboard
- Ensure no extra spaces in `.env.local`

### "ElevenLabs API error: 429"

**Solution:**
- Rate limit exceeded
- Wait a few seconds and try again
- Upgrade ElevenLabs plan if frequent

### "ElevenLabs API error: 402"

**Solution:**
- Exceeded character quota
- Check usage in ElevenLabs dashboard
- Upgrade plan or wait for monthly reset

### Audio not playing

**Solution:**
- Check browser console for errors
- Try downloading the MP3 instead
- Audio URL might be expired (regenerate)

---

## Advanced: Custom Voice

### Use Your Own Voice (Voice Cloning)

1. **Create Voice Clone** in ElevenLabs
2. **Get Voice ID** from ElevenLabs dashboard
3. **Update Code** in `convex/pluginVideoGeneration.ts`:

```typescript
// Change default voice
args.voiceId || "YOUR_CUSTOM_VOICE_ID"
```

### Professional Voice Design

1. Use **Voice Design** in ElevenLabs
2. Generate custom voice from text prompt
3. Copy Voice ID
4. Update code as above

---

## Benefits

### Before (Manual MCP)
- ❌ Copy audio script
- ❌ Open MCP tool
- ❌ Paste script
- ❌ Configure settings
- ❌ Wait for generation
- ❌ Download from Desktop
- ⏱️ **~5 minutes**

### Now (Automated API)
- ✅ Click checkbox
- ✅ Click "Generate"
- ✅ Wait 30-60 seconds
- ✅ Play or download
- ⏱️ **~1 minute**

**Time saved: 80%**

---

## Output

### What You Get

1. **Script** - Formatted, ready to review
2. **Audio Script** - Clean version (no markdown)
3. **Audio File** - MP3, stored in Convex
4. **Audio URL** - Public URL for sharing
5. **Audio Player** - Embedded preview in admin
6. **Download Button** - One-click MP3 download

### Example Output

```json
{
  "success": true,
  "script": "If your mix sounds uneven or muddy...",
  "audioScript": "If your mix sounds uneven or muddy...",
  "audioUrl": "https://your-convex-deployment.convex.cloud/api/storage/...",
  "storageId": "kg2..."
}
```

---

## Next Steps

1. ✅ Add `ELEVENLABS_API_KEY` to environment
2. ✅ Test with one plugin
3. ✅ Review script + audio quality
4. ✅ Adjust voice if needed
5. ✅ Use in your video production workflow

---

**Status:** ✅ Fully automated - no manual steps required!
**Last Updated:** November 4, 2025

