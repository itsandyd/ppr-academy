# Plugin Video Generation - Implementation Guide

## Overview
The plugin admin dialog has been significantly enhanced with:
1. **Image Preview** - Live preview of plugin images
2. **AI Video Script Generator** - GPT-4o generates platform-optimized scripts
3. **Multi-Platform Support** - TikTok, YouTube Shorts, Instagram Reels
4. **Aspect Ratio Options** - 16:9 (Horizontal), 9:16 (Vertical), 1:1 (Square)
5. **ElevenLabs Integration** - Audio script generation ready for MCP

## Features Implemented

### 1. Image Preview
- **Location**: Plugin edit dialog under "Image URL" field
- **Functionality**: 
  - Automatically displays image preview when URL is entered
  - Graceful error handling with fallback placeholder
  - 200px height responsive container

### 2. Video Generation UI
- **Location**: Plugin edit dialog (only visible in edit mode with description & image)
- **Access**: Click "Generate Short-Form Video Content" button
- **Expandable Section**: Hides/shows video generator to keep UI clean

### 3. Video Settings
**Platform Options:**
- TikTok (15-60 seconds)
- YouTube Shorts (30-60 seconds)
- Instagram Reels (15-30 seconds)

**Aspect Ratios:**
- 9:16 (Vertical - Mobile optimized)
- 16:9 (Horizontal - Desktop/TV)
- 1:1 (Square - Universal)

**Durations:**
- 15 seconds
- 30 seconds
- 60 seconds

### 4. Generated Content

**Video Script:**
- Complete script with hook, main content, and CTA
- Platform-optimized formatting
- Visual cues included [VISUAL: description]

**Audio Script:**
- Clean narration text (visual cues removed)
- Optimized for text-to-speech
- **Copy button** for easy clipboard access

**Visual Notes:**
- Bulleted list of visual elements to include
- Helps with video production
- Scene-by-scene breakdown

## Technical Implementation

### Files Created/Modified

#### New Files:
1. `/convex/pluginVideoGeneration.ts` - Video generation Convex actions
   - `generatePluginVideoScript` - GPT-4o script generation
   - `generatePluginVideoAudio` - ElevenLabs integration placeholder
   - `generateCompletePluginVideo` - Complete workflow

#### Modified Files:
1. `/app/admin/plugins/page.tsx` - Admin dialog with video UI
   - Added image preview
   - Added video generation section
   - Added state management for video settings

### Convex Actions

```typescript
// Generate video script
await generateVideoContent({
  clerkId: user.id,
  pluginId: selectedPlugin._id,
  platform: "tiktok" | "youtube-short" | "instagram-reel",
  aspectRatio: "16:9" | "9:16" | "1:1",
  duration: 15 | 30 | 60,
});
```

### Script Generation Process

1. **Context Gathering**:
   - Plugin name, author, description
   - Pricing type and price
   - Platform-specific guidelines

2. **GPT-4o Prompt Engineering**:
   - System prompt defines style and requirements
   - User prompt includes plugin details
   - Platform-specific formatting applied

3. **Output Parsing**:
   - Extracts hook, main content, CTA
   - Separates audio script from visual notes
   - Formats for display

## How to Use

### For Admins:

1. **Edit a Plugin**:
   - Click pencil icon on any plugin in `/admin/plugins`
   - Ensure plugin has description and image URL

2. **Generate Video Content**:
   - Click "Generate Short-Form Video Content" button
   - Select platform, aspect ratio, and duration
   - Click "Generate Video Script & Audio"
   - Wait 5-10 seconds for AI generation

3. **Review Generated Content**:
   - Full script with visual cues
   - Clean audio script for narration
   - Visual notes for production guidance

4. **Create Audio with ElevenLabs MCP**:
   - Click "Copy" button next to Audio Script
   - Use ElevenLabs MCP tool in cursor:
   
   ```typescript
   await mcp_ElevenLabs_text_to_speech({
     text: "[paste copied audio script]",
     voice_name: "Adam", // or your preferred voice
     model_id: "eleven_turbo_v2_5",
     stability: 0.5,
     similarity_boost: 0.75,
     output_directory: process.env.HOME + "/Desktop"
   });
   ```

5. **Video Production**:
   - Use visual notes as shot list
   - Record or edit footage matching descriptions
   - Add generated audio as voiceover
   - Export in selected aspect ratio

## Platform Best Practices

### TikTok (9:16, 15-30s)
- Hook in first 3 seconds
- Fast-paced cuts
- On-screen text/captions
- Trending audio optional
- Clear CTA at end

### YouTube Shorts (9:16 or 1:1, 30-60s)
- Educational focus
- Subscribe CTA
- Longer hook acceptable
- Clear value proposition
- YouTube branding

### Instagram Reels (9:16, 15-30s)
- Aesthetic visuals
- Story-driven
- Smooth transitions
- Instagram-specific CTAs
- Music/audio important

## ElevenLabs Integration

### Current Setup:
- Audio script generated and cleaned
- Ready for ElevenLabs MCP
- Manual copy/paste workflow

### ElevenLabs MCP Tools Available:
1. `mcp_ElevenLabs_text_to_speech` - Convert text to speech
2. `mcp_ElevenLabs_search_voices` - Find voice options
3. `mcp_ElevenLabs_voice_clone` - Clone custom voice
4. `mcp_ElevenLabs_list_models` - View available models

### Recommended Settings:
```typescript
{
  model_id: "eleven_turbo_v2_5", // Fast & high quality
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  output_format: "mp3_44100_128"
}
```

## Future Enhancements

### Planned Features:
1. **Direct ElevenLabs MCP Integration** - Auto-generate audio in-app
2. **Video Assembly** - Combine image, audio, and effects
3. **Batch Generation** - Generate videos for multiple plugins
4. **Template Library** - Pre-made visual templates
5. **A/B Testing** - Generate multiple script variations
6. **Analytics Integration** - Track video performance

### Video Assembly Options:
- **Remotion** - Programmatic video creation
- **FFmpeg** - Command-line video processing
- **CloudFlare Stream** - Cloud video hosting
- **AWS MediaConvert** - Professional video processing

## Troubleshooting

### Common Issues:

**"Image Failed to Load"**
- Check image URL is accessible
- Verify URL uses HTTPS
- Try different image format (JPG, PNG, WebP)

**"Script Generation Failed"**
- Ensure OpenAI API key is configured
- Check plugin has valid description
- Verify admin access permissions

**"No Audio Script Generated"**
- Full script may not have been parsed correctly
- Try regenerating with different settings
- Check Convex logs for errors

**Video Generation Taking Too Long**
- Normal generation: 5-10 seconds
- Check Convex dashboard for action status
- Verify OpenAI API quota

## API Reference

### Types:

```typescript
type Platform = "tiktok" | "youtube-short" | "instagram-reel";
type AspectRatio = "16:9" | "9:16" | "1:1";
type Duration = 15 | 30 | 60;

interface VideoGenerationResult {
  success: boolean;
  script?: string;
  audioScript?: string;
  visualNotes?: string[];
  error?: string;
}
```

### Convex Actions:

```typescript
// Generate script only
api.pluginVideoGeneration.generatePluginVideoScript

// Generate audio only (placeholder)
api.pluginVideoGeneration.generatePluginVideoAudio

// Complete workflow
api.pluginVideoGeneration.generateCompletePluginVideo
```

## Security & Access Control

- **Admin Only**: Video generation restricted to admins
- **Plugin Ownership**: Checks admin status before generation
- **Rate Limiting**: Consider OpenAI API limits
- **Cost Management**: GPT-4o usage tracked per generation

## Performance Considerations

- Script generation: ~5-10 seconds
- Audio generation (future): ~10-20 seconds
- Video assembly (future): ~30-60 seconds
- Batch operations: Plan for API rate limits

## Cost Estimates

### Per Video Generation:
- Script (GPT-4o): ~$0.03-0.05
- Audio (ElevenLabs): ~$0.15-0.30
- **Total**: ~$0.20-0.35 per video

### Optimization Tips:
- Cache commonly used scripts
- Reuse audio for similar plugins
- Batch process during off-peak hours
- Use lower-cost models for testing

## Support

For issues or questions:
1. Check Convex dashboard logs
2. Verify API keys are configured
3. Test with a simple plugin first
4. Review error messages in toast notifications

## Changelog

### v1.0.0 (Current)
- ✅ Image preview in dialog
- ✅ Video script generation (GPT-4o)
- ✅ Platform-specific optimization
- ✅ Aspect ratio selection
- ✅ Audio script extraction
- ✅ Visual notes breakdown
- ✅ Copy-to-clipboard functionality
- ✅ ElevenLabs MCP instructions

### Upcoming (v1.1.0)
- 🔄 Direct ElevenLabs MCP integration
- 🔄 Automatic audio generation
- 🔄 Video preview functionality
- 🔄 Batch processing

