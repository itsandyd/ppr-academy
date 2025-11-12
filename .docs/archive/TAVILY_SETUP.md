# Tavily API Integration Setup Guide

This guide will help you set up Tavily API for enhanced course image searching in your PPR Academy app.

## 🔑 Getting Your Tavily API Key

1. **Visit Tavily Website**: Go to [https://tavily.com](https://tavily.com)
2. **Sign Up**: Create a free account 
3. **Get API Key**: Navigate to your dashboard and copy your API key
4. **Free Tier**: Tavily offers 1,000 free searches per month

## 🔧 Configuration

### Step 1: Add API Key to Environment Variables

Add your Tavily API key to your `.env` file:

```env
# Tavily API Key for web search and image search
TAVILY_API_KEY=your_tavily_api_key_here
```

### Step 2: Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## 🖼️ Image Search Features

### Enhanced Image Search
- **Multi-strategy search**: Combines multiple search approaches for better results
- **YouTube thumbnails**: Extracts high-quality thumbnails from educational videos
- **Professional content**: Includes industry-standard music production images
- **Customizable results**: Adjust search parameters and result count

### Course Image Management
- **One-click updates**: Search and set course thumbnails instantly
- **Topic-specific search**: Automatically searches based on course titles
- **Quality filtering**: Only shows images from trusted educational domains

### Search Sources
The enhanced search includes images from:
- Unsplash (high-quality stock photos)
- YouTube video thumbnails
- Music production websites (Ableton, Native Instruments, etc.)
- Educational platforms
- Professional music production content

## 🎯 Usage in Admin Dashboard

### Basic Image Search
1. Go to **Admin Dashboard** → **Search Tools** tab
2. Enter a topic (e.g., "FL Studio mixing")
3. Click **"Find Images"**

### Enhanced Image Search
1. Use the **"Enhanced Image Search"** panel
2. Configure options:
   - ✅ Include YouTube thumbnails
   - ✅ Include professional content
   - 🎚️ Adjust max results (6-24)
3. Click **"Enhanced Search"**

### Course Image Management
1. In the **"Course Image Management"** section
2. Click **"Find Images"** on any course
3. Click on any found image to set it as the course thumbnail
4. Changes are applied instantly

## 🔍 Search Strategies

The enhanced search uses multiple strategies:

1. **Direct Image Search**: `"topic music production tutorial interface"`
2. **Educational Content**: `"topic beginner music production guide"`
3. **DAW-Specific**: `"topic DAW plugin interface tutorial"`
4. **YouTube Extraction**: Finds educational videos and extracts thumbnails
5. **Professional Equipment**: `"topic studio setup music production"`

## 🛡️ Image Validation

All images are validated for:
- **Trusted domains**: Only from educational and professional sources
- **Valid formats**: JPG, PNG, WebP, GIF
- **Error handling**: Broken images are automatically filtered out

## ⚡ Performance Features

- **Rate limiting**: Automatic delays to prevent API overuse
- **Duplicate removal**: Ensures unique results
- **Fallback system**: Uses curated images if API is unavailable
- **Caching**: Results are temporarily cached for better performance

## 🎨 Example Search Results

For a search like "Ableton Live Arpeggiator":
- Screenshots of Ableton's arpeggiator interface
- YouTube thumbnails from arpeggiator tutorials
- Professional studio setups featuring Ableton
- Educational content about MIDI arpeggiation
- High-quality music production imagery

## 🚀 Next Steps

With Tavily integration, you can:
- Automatically find relevant images for any course topic
- Update course thumbnails with one click
- Ensure all course images are high-quality and relevant
- Save time searching for appropriate course imagery

## 💡 Tips

- **Be specific**: Use detailed search terms like "Ableton Live arpeggiator tutorial"
- **Use skill levels**: Include "beginner", "intermediate", or "advanced" in searches
- **Include DAW names**: Specify software like "FL Studio", "Ableton Live", etc.
- **Educational keywords**: Add "tutorial", "guide", or "course" for better results

## 🔧 Troubleshooting

### No Images Found
- Check your Tavily API key is correct
- Verify your internet connection
- Try broader search terms
- Check the console for any API errors

### API Key Issues
```bash
# Check if API key is loaded
console.log(process.env.TAVILY_API_KEY) // Should not be undefined
```

### Rate Limiting
- Tavily has generous rate limits (1,000 searches/month free)
- The app includes automatic delays to prevent overuse
- If you hit limits, wait or upgrade your Tavily plan

---

🎉 **You're all set!** Your course image search is now powered by Tavily's comprehensive web search capabilities. 