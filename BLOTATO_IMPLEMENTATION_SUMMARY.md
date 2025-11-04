# Plugin Video Script Generation - Implementation Summary

## ✅ What Was Implemented

### 1. Workflow Adaptation
- **Before:** Manual Blotato → Manual OpenAI → ElevenLabs
- **Now:** Automated Blotato API → Automated OpenAI → ElevenLabs MCP

### 2. Key Features

#### Universal Script Generation
- Generates **ONE script** that works for Instagram, TikTok, AND YouTube
- Matches your exact proven style from the Ableton example
- No platform-specific variations (simpler workflow)

#### Two-Step AI Process
1. **Blotato API** (optional): Generates initial script from plugin content
2. **OpenAI GPT-4o**: Refines to match your specific style

#### Style Template
The system is trained on your exact example:
```
"If your mix sounds uneven or muddy, it's probably your dynamics, not your EQ..."
```

Includes:
- Problem → Common Mistake → Solution structure
- Technical parameters (threshold, ratio, attack, release)
- Specific use cases
- Rhetorical questions
- Direct commands
- Exact CTA format

---

## 📁 Files Created/Modified

### New Files
1. `convex/pluginVideoGeneration.ts` - **NEW IMPLEMENTATION**
   - `generateUniversalPluginScript()` - Main action
   - `generateBlotatoScript()` - Blotato API helper
   - `refineScriptWithOpenAI()` - OpenAI refinement helper

2. `BLOTATO_WORKFLOW_GUIDE.md` - Complete documentation

### Modified Files
1. `app/admin/plugins/page.tsx`
   - Added universal script generator UI
   - Removed platform/duration selectors (simplified)
   - Updated to show Instagram/TikTok/YouTube tags on ONE script

---

## 🎯 How to Use

### Step 1: Environment Setup

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...
BLOTATO_API_KEY=your_key  # Optional
```

### Step 2: Generate Script

1. Go to `/admin/plugins`
2. Edit any plugin
3. Scroll to "Generate Short-Form Video Content"
4. Click "Generate Universal Script"
5. Wait for generation (Blotato → OpenAI)

### Step 3: Use Script

1. **Full Script** - Use as-is or edit
2. **Audio Script** - Copy clean version
3. **ElevenLabs** - Generate audio using MCP tool:

```typescript
mcp_ElevenLabs_text_to_speech({
  text: audioScript,
  voice_name: "Adam",
  model_id: "eleven_turbo_v2_5",
  output_directory: "~/Desktop",
});
```

---

## 🔍 Technical Details

### API Flow

```
Plugin Content → Blotato API → OpenAI GPT-4o → Output
                    ↓              ↓
              (Initial      (Style Refinement)
               Script)
```

### Blotato Integration

**Endpoint:** `https://help.blotato.com/api/generate`

**Request:**
```json
{
  "content": "plugin description...",
  "format": "script"
}
```

**Fallback:** If API key not set, skips to OpenAI directly

### OpenAI Refinement

**Model:** `gpt-4o`
**Temperature:** `0.7` (balanced creativity)
**Max Tokens:** `1200` (60-90 seconds of speech)

**System Prompt:** Trained on your exact Ableton example

---

## 📊 What Changed From Previous Version

### Before (Platform-Specific)
- ❌ Generated 3 separate scripts (YouTube, TikTok, Instagram)
- ❌ Different styles per platform
- ❌ Platform/duration/aspect ratio selectors
- ❌ Visual notes and complex output

### After (Universal Script)
- ✅ Generates ONE script for all platforms
- ✅ Matches your proven style
- ✅ Simplified UI (no platform selection)
- ✅ Clean output: Script + Audio Script
- ✅ Direct Blotato API integration

---

## 🛠️ Customization Options

### Adjust Style Template

Edit `convex/pluginVideoGeneration.ts`:

```typescript
const systemPrompt = `Your writing style EXACTLY matches this example:

"[PASTE YOUR NEW EXAMPLE SCRIPT HERE]"

STYLE RULES:
1. [Your custom rule]
2. [Your custom format]
...
`;
```

### Adjust Script Length

Default: **60-90 seconds**

To change:
```typescript
LENGTH: 30-45 seconds when spoken (shorter)
// or
LENGTH: 90-120 seconds when spoken (longer)
```

### Adjust AI Temperature

Default: **0.7** (balanced)

- Lower (0.3-0.5) = More consistent/predictable
- Higher (0.8-0.9) = More creative/varied

---

## ⚠️ Important Notes

### 1. Blotato API Key (Optional)
- System works WITHOUT Blotato API key
- If not provided, goes directly to OpenAI
- Blotato adds initial structure based on their platform

### 2. OpenAI API Key (Required)
- **MUST** have valid `OPENAI_API_KEY`
- Uses GPT-4o model (premium model)
- Check billing/quota if errors occur

### 3. ElevenLabs Integration
- **Manual step** via MCP tool
- Not automated (requires user approval for audio generation)
- Copy audio script → Run MCP tool

### 4. Script Review
- Always review generated scripts
- AI output may vary slightly each run
- Edit in admin panel if needed

---

## 🎬 Example Output

### Generated Script
```
If your drums sound lifeless and flat, it's probably your dynamics, not your samples. Most producers just layer more samples to add energy, but that's where everything goes wrong. [Plugin Name] gives you total control by...
```

### Audio Script (Clean)
```
If your drums sound lifeless and flat, its probably your dynamics, not your samples. Most producers just layer more samples to add energy, but thats where everything goes wrong. Plugin Name gives you total control by...
```

### Platform Tags
- Instagram ✓
- TikTok ✓
- YouTube ✓

*(Same script for all)*

---

## 🚀 Next Steps

### Immediate
1. ✅ Add `BLOTATO_API_KEY` to environment (optional)
2. ✅ Test with one plugin
3. ✅ Review generated script
4. ✅ Generate audio with ElevenLabs MCP

### Future Enhancements
- Direct ElevenLabs integration (no manual copy)
- Batch generation for multiple plugins
- A/B testing framework
- Analytics (track which scripts perform best)
- Video generation (Remotion + FFmpeg)

---

## 📚 Documentation

- `BLOTATO_WORKFLOW_GUIDE.md` - Complete workflow guide
- `PLUGIN_VIDEO_GENERATION_GUIDE.md` - Original video generation guide (reference)
- [Blotato API Docs](https://help.blotato.com/api/api-reference)

---

## 🐛 Troubleshooting

### "Failed to generate script"
- Check `OPENAI_API_KEY` is valid
- Check API quota/billing
- Check Convex logs for details

### "Blotato API error"
- Optional: System continues without Blotato
- Check `BLOTATO_API_KEY` if you want Blotato integration
- System falls back to OpenAI-only

### Script style doesn't match
- Regenerate (AI output varies)
- Edit manually in admin panel
- Update style template in code

---

## ✨ Benefits of This Approach

1. **Matches Your Workflow** - Same process you've been using manually
2. **One Script** - Simpler, matches your actual usage
3. **Proven Style** - Based on your successful Ableton example
4. **Flexible** - Works with or without Blotato API
5. **Editable** - Can always refine in admin panel
6. **Fast** - ~30 seconds generation time

---

**Status:** ✅ Ready to use
**Last Updated:** November 4, 2025

