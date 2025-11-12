# ElevenLabs Integration - Setup Guide

## ✅ What's Done

Your AI Sample Generator is fully coded and ready! It includes:

1. **Admin UI** - Beautiful form at `/admin/generate-samples`
2. **ElevenLabs SDK** - Installed (`@elevenlabs/elevenlabs-js@^2.17.0`)
3. **Convex Actions** - Full workflow to generate, store, and sell samples
4. **Database Integration** - Auto-creates audioSamples records

## 🔑 Last Step: Add Your API Key

### Option 1: Convex Dashboard (Recommended)

1. **Go to**: https://dashboard.convex.dev
2. **Select your deployment**
3. **Go to Settings** → **Environment Variables**
4. **Add**:
   - Name: `ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key

### Option 2: Local Development (`.env.local`)

1. Create/edit `.env.local` in your project root:
```bash
ELEVENLABS_API_KEY=your_key_here
```

2. Restart Convex:
```bash
npx convex dev
```

## 🎵 How to Get an ElevenLabs API Key

1. **Sign up** at https://elevenlabs.io
2. **Go to Profile** → **API Keys**
3. **Create** a new API key
4. **Copy** and paste into Convex environment variables

### Pricing Notes
- **Free tier**: Limited credits for sound generation
- **Paid tier**: Higher limits and better quality
- Each sound effect costs ~10-20 credits depending on duration

## 🚀 Testing It Out

Once the API key is added:

1. **Go to**: `http://localhost:3000/admin/generate-samples`
2. **Enter description**: "Deep cinematic boom with reverb"
3. **Set metadata**:
   - Title: "Cinematic Boom"
   - Duration: 2 seconds
   - Category: FX
   - Price: 10 credits
4. **Click "Generate Sample"**
5. **Wait 5-10 seconds** for generation
6. **Success!** Sample is saved and published

## 📊 What Happens Behind the Scenes

```
User clicks "Generate"
    ↓
Convex action: generateAISample
    ↓
Call ElevenLabs API (textToSoundEffects)
    ↓
Receive audio stream
    ↓
Save to temp file (/tmp/convex-samples/)
    ↓
Upload to Convex file storage
    ↓
Create audioSamples DB record
    ↓
Delete temp file
    ↓
Return sample details to UI
    ↓
Display success + "View in Store" link
```

## 🎯 Your Marketplace Flow

1. **Admin generates** sample → Auto-published
2. **Users browse** `/store/[storeId]/products` → See in "Samples" tab
3. **Users buy** with credits → Sample added to library
4. **Users download** → Play, use in projects

## 🔧 Troubleshooting

### "ELEVENLABS_API_KEY environment variable is required"
- **Fix**: Add the API key to Convex dashboard (see above)

### "Failed to generate sound effect"
- **Check**: ElevenLabs API quota/credits
- **Check**: Network connectivity
- **Check**: Description is in English (works best)

### Audio doesn't play
- **Check**: File format is supported (mp3)
- **Check**: Convex storage URL is accessible
- **Verify**: In Convex dashboard → File Storage

## 💡 Best Practices

### Sound Descriptions
✅ **Good**:
- "Heavy 808 kick drum with sub bass"
- "Retro 8-bit laser sound effect rising in pitch"
- "Ambient forest atmosphere with distant bird chirping"

❌ **Avoid**:
- "cool sound"
- "music" (too vague)
- Very long descriptions (>100 words)

### Pricing Strategy
- **Simple FX**: 5-10 credits
- **Complex sounds**: 15-25 credits
- **Premium/long**: 30-50 credits
- **Exclusive**: 100+ credits

### Categories
- **fx** - Sound effects, impacts, transitions
- **drums** - Kicks, snares, percussion
- **bass** - Bass shots, sub bass
- **synth** - Pads, leads, plucks
- **loops** - Repeating patterns

## 📈 Next Steps

1. ✅ Add ELEVENLABS_API_KEY to Convex
2. 🎵 Generate your first sample
3. 💰 Set pricing strategy
4. 📢 Promote your AI-generated samples
5. 💸 Earn credits from sales!

---

**Questions?** Check Convex logs or ElevenLabs API status.

