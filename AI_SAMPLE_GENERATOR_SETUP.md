# AI Sample Generator - Admin Feature

## 🎵 Overview

This feature allows admins to generate professional sound effects using **ElevenLabs AI** and automatically sell them in the sample marketplace.

## ✨ Features

- **AI-Powered Sound Generation**: Use natural language to describe sounds
- **Automatic Storage**: Generated audio is stored in Convex file storage
- **Instant Publishing**: Samples are automatically published to your marketplace
- **Full Metadata Support**: Set genre, category, tags, price, and license type
- **Admin-Only Access**: Secured to admin users only

## 📍 Access

Navigate to: **`/admin/generate-samples`**

## 🚀 How to Use

### 1. **Describe Your Sound**
Enter a detailed description of the sound effect you want:
```
Examples:
- "Deep cinematic boom with heavy reverb"
- "Retro 8-bit laser sound effect"
- "Ambient forest atmosphere with bird chirping"
- "Heavy kick drum with sub bass"
```

### 2. **Set Metadata**
- **Title**: Name of the sample
- **Duration**: 0.5 to 5 seconds
- **Category**: drums, bass, synth, vocals, fx, melody, loops, one-shots
- **Genre**: electronic, hip-hop, cinematic, etc.
- **Tags**: Comma-separated keywords
- **Price**: Credits required to purchase
- **License**: royalty-free, commercial, or exclusive

### 3. **Generate & Sell**
Click "Generate Sample" and the AI will:
1. Generate the sound effect
2. Store it in Convex
3. Create a marketplace listing
4. Publish it automatically

## 🔧 Setup Requirements

### ElevenLabs MCP Integration

⚠️ **Currently shows a placeholder error**. To enable actual generation:

1. **Install ElevenLabs MCP Server** in your Convex deployment
2. **Add ElevenLabs API Key** to your environment variables
3. **Update the integration** in `convex/audioGeneration.ts`

#### Production Integration Code

Replace the `callElevenLabsSFX` function with actual MCP call:

```typescript
export const callElevenLabsSFX = internalAction({
  args: {
    description: v.string(),
    duration: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    filePath: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Call ElevenLabs MCP tool
      const result = await ctx.runAction(
        "mcp_ElevenLabs_text_to_sound_effects",
        {
          text: args.description,
          duration_seconds: args.duration,
          output_directory: "/tmp/convex-samples", // Temp storage
        }
      );
      
      return {
        success: true,
        filePath: result.output_file_path, // Path from MCP response
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
```

## 📦 Files Created

### Admin UI
- **`app/admin/generate-samples/page.tsx`**
  - Beautiful UI for sample generation
  - Form validation
  - Preview of generated samples
  - Integration with sample marketplace

### Convex Backend
- **`convex/audioGeneration.ts`** (extended)
  - `generateAISample` - Main action to generate and store samples
  - `callElevenLabsSFX` - Internal action to call ElevenLabs
  - `createSampleRecord` - Internal mutation to create DB record
  - `getSampleById` - Internal query to fetch sample

## 🎯 User Flow

```
Admin Dashboard
    ↓
/admin/generate-samples
    ↓
Fill Form (description, title, metadata)
    ↓
Click "Generate Sample"
    ↓
[Convex Action: generateAISample]
    ↓
Generate audio via ElevenLabs
    ↓
Store in Convex file storage
    ↓
Create audioSamples record
    ↓
Auto-publish to marketplace
    ↓
Return sample details
    ↓
Display success message
    ↓
View in /store/[storeId]/products
```

## 💰 Marketplace Integration

Generated samples automatically appear in:
- **`/store/[storeId]/products`** - Samples tab
- **Sample marketplace** - Available for purchase with credits
- **Creator dashboard** - Listed as published samples

## 🔐 Security

- **Admin-only access**: Checks `user.admin` flag
- **User authentication**: Requires Clerk login
- **Store validation**: Ensures user has a store
- **Auto-publish**: Samples are published immediately (admin trust)

## 🎨 UI Components Used

- Card, CardContent, CardHeader
- Button, Input, Textarea
- Select, Label, Badge
- Loader2, Sparkles icons
- Toast notifications

## 📊 Database Schema

Samples are stored in the `audioSamples` table with:

```typescript
{
  userId: string,          // Admin who created it
  storeId: string,         // Admin's store
  title: string,           // Sample name
  description: string,     // AI generation prompt
  storageId: Id,          // Convex storage reference
  fileUrl: string,        // Public streaming URL
  fileName: string,       // Original filename
  fileSize: number,       // Bytes
  duration: number,       // Seconds
  format: string,         // mp3, wav, etc.
  genre: string,          // Music genre
  category: "fx"|...,     // Sample type
  tags: string[],         // Keywords
  creditPrice: number,    // Cost to buy
  licenseType: string,    // License terms
  isPublished: true,      // Auto-published
  downloads: 0,           // Initial stats
  plays: 0,
  favorites: 0,
}
```

## 🚀 Next Steps

1. **Configure ElevenLabs MCP** with your API key
2. **Test the integration** with a simple sound effect
3. **Generate sample packs** by creating multiple related samples
4. **Monitor credit sales** via the admin dashboard
5. **Create promotional campaigns** for your AI-generated samples

## 💡 Tips for Best Results

### Sound Descriptions
- **Be specific**: "Heavy 808 kick drum" vs "drum sound"
- **Include characteristics**: pitch, mood, texture, effects
- **Mention duration feel**: "short impact" vs "long evolving pad"

### Pricing Strategy
- **One-shots**: 5-15 credits
- **Loops**: 15-30 credits
- **Full sound effects**: 10-25 credits
- **Premium/exclusive**: 50+ credits

### Categories
- **FX**: Impacts, risers, transitions
- **Drums**: Kicks, snares, hi-hats
- **Bass**: Sub bass, bass shots
- **Synth**: Pads, leads, arps
- **Vocals**: Chops, ad-libs

## 🐛 Troubleshooting

### "ElevenLabs MCP integration required"
- This is expected until you configure the MCP server
- Follow setup instructions above
- Test with ElevenLabs API key

### "Store not found"
- Make sure you have a store created
- Admin users need at least one store

### "Not authenticated"
- Ensure you're logged in with an admin account
- Check that `admin: true` is set in your user record

---

**Created**: October 2025  
**Status**: Ready for ElevenLabs MCP integration  
**Location**: `/admin/generate-samples`

