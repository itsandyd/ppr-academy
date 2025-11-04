# Blotato + OpenAI Video Script Workflow

## Overview

This system generates **ONE universal script** that works for Instagram, TikTok, and YouTube Shorts, matching your proven workflow with Blotato and OpenAI.

## Your Workflow (Automated)

### Before (Manual)
1. Copy Ableton manual content → Paste into Blotato
2. Generate YouTube, TikTok, Instagram scripts
3. Copy each → Paste into OpenAI for refinement
4. Get final script → Send to ElevenLabs

### Now (Automated)
1. Click "Generate Universal Script" in Admin Panel
2. System automatically:
   - Prepares plugin content
   - Sends to Blotato API
   - Refines with OpenAI (matching your exact style)
   - Outputs ONE script for all platforms
3. Copy audio script → Use ElevenLabs MCP

---

## Script Style (Your Template)

The system is trained to match this exact style:

```
If your mix sounds uneven or muddy, it's probably your dynamics, not your EQ. Most producers rely on one compressor for the whole mix, but that's where everything goes wrong. Ableton's Multiband Dynamics gives you total control by splitting your sound into three bands, low, mid, and high, and letting you process each one differently. Each band includes four types of dynamic control: downward compression to tame peaks, upward compression to lift quiet details, downward expansion to reduce noise, and upward expansion to enhance impact. That's six processors working together in one plugin. You can de-ess vocals by compressing only the highs, tighten muddy lows with focused compression, or bring back energy in a flattened mix using upward expansion. Every parameter matters, threshold, ratio, attack, release, and crossover points. Solo each band to actually hear what you're changing. Want your vocal to breathe while the bass stays tight? Use mid-band upward compression. Want your drums to punch again? Expand the highs slightly. The sidechain input makes it even more powerful, duck your bass from the kick or shape dynamics based on another track entirely. Stop flattening your sound with a single compressor. Start sculpting your mix by frequency. Want to master Ableton? Like and Follow, then Comment "Ableton" and we'll DM you our free Ableton Live tools and resources to help you master dynamic mixing.
```

### Style Breakdown:
1. ✅ **Problem Hook** - "If your mix sounds uneven or muddy..."
2. ✅ **Common Mistake** - "Most producers rely on one compressor..."
3. ✅ **Solution** - "[Plugin] gives you total control by..."
4. ✅ **Technical Details** - "threshold, ratio, attack, release, crossover points"
5. ✅ **Use Cases** - "You can de-ess vocals, tighten lows, bring back energy"
6. ✅ **Rhetorical Questions** - "Want your vocal to breathe...?"
7. ✅ **Direct Commands** - "Stop X. Start Y."
8. ✅ **CTA** - "Want to master [topic]? Like and Follow, then Comment..."

---

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for Blotato integration)
BLOTATO_API_KEY=your_blotato_api_key
```

**Note:** If `BLOTATO_API_KEY` is not set, the system will skip Blotato and send plugin content directly to OpenAI for refinement.

### 2. Blotato API Setup

Based on the [Blotato API Reference](https://help.blotato.com/api/api-reference):

1. Sign up at Blotato
2. Get your API key
3. Add to environment variables

### 3. How It Works

#### Step 1: Content Preparation
```typescript
// System prepares plugin content like you'd copy from a manual
const pluginContent = `
# ${plugin.name}
by ${plugin.author}

## Description
${plugin.description}

## Key Features
- ${plugin.type}
- ${plugin.category}
- ${plugin.pricing}
`;
```

#### Step 2: Blotato Generation (Optional)
```typescript
// If API key exists, call Blotato
fetch("https://help.blotato.com/api/generate", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${BLOTATO_API_KEY}`,
  },
  body: JSON.stringify({
    content: pluginContent,
    format: "script",
  }),
});
```

#### Step 3: OpenAI Refinement
```typescript
// Refine with OpenAI to match YOUR exact style
openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "Match the EXACT style from the Ableton example...",
    },
    {
      role: "user",
      content: `Refine this script for ${plugin.name}: ${blotatoScript}`,
    },
  ],
});
```

---

## Usage

### In Admin Panel

1. Go to `/admin/plugins`
2. Click "Edit" on any plugin
3. Scroll to "Generate Short-Form Video Content"
4. Click "Generate Universal Script"
5. Wait for generation (Blotato → OpenAI)
6. Copy the "Audio Script" 
7. Use ElevenLabs MCP to generate audio

### Generated Output

You'll get:
- **Script** - Full formatted version
- **Audio Script** - Clean version (no markdown) for ElevenLabs
- **Platform Tags** - Instagram, TikTok, YouTube (same script for all)

---

## Using ElevenLabs MCP

Once you have the audio script:

### Option 1: Via MCP Tool (Recommended)

```typescript
mcp_ElevenLabs_text_to_speech({
  text: audioScript,
  voice_name: "Adam", // or your preferred voice
  model_id: "eleven_turbo_v2_5",
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  output_directory: "~/Desktop",
  output_format: "mp3_44100_128"
});
```

### Option 2: Direct ElevenLabs API

```bash
curl -X POST 'https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID' \
  -H 'xi-api-key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "YOUR_AUDIO_SCRIPT",
    "model_id": "eleven_turbo_v2_5",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }'
```

---

## Troubleshooting

### Blotato API Not Working

**Symptom:** Script generation works but doesn't use Blotato style

**Solution:**
- Check `BLOTATO_API_KEY` is set correctly
- Check Blotato API endpoint is accessible
- System will fallback to OpenAI-only if Blotato fails

### Script Style Doesn't Match

**Symptom:** Generated script feels generic or sales-y

**Solution:**
- The OpenAI system prompt includes your exact style template
- If output doesn't match, you can:
  1. Regenerate (different AI run)
  2. Manually edit in the admin panel
  3. Update the style template in `convex/pluginVideoGeneration.ts`

### OpenAI API Errors

**Symptom:** `Failed to generate script`

**Solution:**
- Check `OPENAI_API_KEY` is valid
- Check API quota/billing
- Try again (may be temporary rate limit)

---

## File Structure

```
convex/
  pluginVideoGeneration.ts    # Main generation logic
    ├── generateUniversalPluginScript()  # Public action
    ├── generateBlotatoScript()          # Helper: Blotato API
    └── refineScriptWithOpenAI()         # Helper: OpenAI refinement

app/admin/plugins/page.tsx    # Admin UI
  └── handleGenerateVideo()    # UI handler
```

---

## Customization

### Adjust Script Style

Edit `convex/pluginVideoGeneration.ts`:

```typescript
const systemPrompt = `Your writing style EXACTLY matches this example:

"[YOUR NEW EXAMPLE SCRIPT HERE]"

STYLE RULES:
1. [Your custom rules]
2. [Your custom format]
...
`;
```

### Adjust Script Length

Default: 60-90 seconds when spoken

To change, update in `convex/pluginVideoGeneration.ts`:

```typescript
LENGTH: 30-45 seconds when spoken (shorter version)
// or
LENGTH: 90-120 seconds when spoken (longer version)
```

---

## API Reference

### Convex Action

```typescript
generateUniversalPluginScript({
  clerkId: string,     // Admin user ID
  pluginId: Id<"plugins">,  // Plugin to generate for
})
```

**Returns:**
```typescript
{
  success: boolean,
  script?: string,        // Full formatted script
  audioScript?: string,   // Clean audio version
  error?: string,        // Error message if failed
}
```

---

## Best Practices

1. ✅ **Always review the generated script** before using
2. ✅ **Test with different plugins** to see style variations
3. ✅ **Keep plugin descriptions detailed** for better AI output
4. ✅ **Use ElevenLabs voice that matches your brand** (consistent voice = better engagement)
5. ✅ **Save successful scripts** as examples for future improvements

---

## Future Enhancements

Potential additions:
- [ ] Direct ElevenLabs integration (no manual copy/paste)
- [ ] Video generation with Remotion/FFmpeg
- [ ] A/B testing different script styles
- [ ] Analytics tracking (which scripts perform best)
- [ ] Batch generation for multiple plugins
- [ ] Custom voice cloning integration

---

## Support

Issues? Check:
1. Environment variables are set
2. Convex deployment is up to date
3. API keys are valid
4. Check Convex logs for detailed errors

**Need help?** Check the Convex dashboard logs for detailed error messages.

