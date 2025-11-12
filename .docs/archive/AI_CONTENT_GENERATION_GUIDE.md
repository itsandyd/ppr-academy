# 🤖 AI Content Generation System

## Overview

This system allows you to leverage **all your course content** from multiple creators to generate:
- 📹 **Viral video scripts** (TikTok, YouTube, Instagram)
- 📚 **New course outlines** based on existing content
- 🎯 Content that matches your creators' teaching styles

## How It Works

### Architecture

```
┌─────────────────┐
│  Course Content │
│  (Multiple      │
│   Creators)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Embeddings    │◄── Already built! (admin/embeddings)
│   (Vector DB)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RAG System     │◄── Retrieves relevant content
│  (Semantic      │
│   Search)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   GPT-4 + RAG   │◄── Generates new content
│   (Content      │    with creator style
│   Generation)   │
└─────────────────┘
```

### What's Different from Standard GPT?

**Standard GPT:**
- ❌ No knowledge of your specific courses
- ❌ Generic, doesn't match your style
- ❌ Can't reference your actual content

**This System (RAG + GPT):**
- ✅ Knows ALL your course content
- ✅ Matches your creators' teaching styles
- ✅ References real lessons and examples
- ✅ Updates automatically as you add courses

## Features

### 1. Viral Video Script Generation

Creates platform-optimized video scripts that:
- **Hook viewers** in first 3 seconds
- **Match your teaching style** from course content
- **Include your terminology** and examples
- **Follow platform best practices**

**Platforms Supported:**
- TikTok (15-60 seconds)
- YouTube Shorts (30-60 seconds)
- Instagram Reels (15-90 seconds)
- YouTube Long-form (8-15 minutes)

**Example Output:**
```
HOOK [0-3s]:
"Stop using presets for your 808s—here's why they're killing your mix"

MAIN CONTENT [3-45s]:
- Point 1: Frequency masking (referenced from Course Module 2)
- Point 2: Phase cancellation (from Advanced Mixing course)
- Point 3: Quick fix technique (original content)

CTA [45-50s]:
"Link in bio for the full mixing masterclass"
```

### 2. Course Outline Generation

Creates structured course outlines that:
- **Learn from existing courses** (structure, pacing, style)
- **Build progressively** (beginner → advanced)
- **Include practical exercises**
- **Match skill level** (Beginner/Intermediate/Advanced)

**Example Output:**
```
Module 1: Introduction to 808 Bass Design
├── Lesson 1: Understanding Sub Bass Frequencies
│   ├── What makes 808s special
│   ├── Frequency ranges explained
│   └── Common mixing mistakes
├── Lesson 2: Choosing the Right 808 Sample
    ├── Sample quality factors
    ├── Tonal vs atonal 808s
    └── Processing basics
...
```

## Quick Start

### 1. Generate Embeddings First

Before using content generation, you **must** generate embeddings:

```
Visit: /admin/embeddings
Click: "Generate New Embeddings"
Wait: ~2-5 minutes (depending on content volume)
```

This creates vector representations of all your course content for semantic search.

### 2. Access Content Generation

```
Navigate to: /admin/content-generation
```

### 3. Generate Video Scripts

```typescript
// Fill in:
- Topic: "808 bass mixing techniques"
- Platform: TikTok / YouTube / Instagram
- Tone: Educational / Entertaining / Motivational

// Click: "Generate Video Script"

// Get:
- Full script with timing
- Hook (first 3 seconds)
- Main points
- Call to action
- Visual notes
```

### 4. Generate Course Outlines

```typescript
// Fill in:
- Title: "Advanced Vocal Mixing"
- Description: "Learn professional vocal mixing..."
- Category: "Mixing"
- Skill Level: Intermediate

// Click: "Generate Course Outline"

// Get:
- 5 modules
- 3-5 lessons per module
- Key learning points
- Progressive structure
```

## Advanced: Fine-Tuning (Optional)

If you want even better results, you can **fine-tune** a custom model:

### When to Fine-Tune?

Fine-tune if you:
- ✅ Have 50+ courses with consistent style
- ✅ Want to deeply capture writing voice
- ✅ Generate content at high volume
- ✅ Have budget ($5-20 per training)

### Fine-Tuning Process

```bash
# 1. Export all course content as training data
npm run export-training-data

# 2. Format for OpenAI fine-tuning
# Creates: fine-tune-data.jsonl

# 3. Upload and train via OpenAI
openai api fine_tuning.jobs.create \
  -t fine-tune-data.jsonl \
  -m gpt-4o-2024-08-06

# 4. Use fine-tuned model in contentGeneration.ts
model: "ft:gpt-4o-2024-08-06:your-org::XXXXXX"
```

### Training Data Format

```jsonl
{"messages": [{"role": "system", "content": "You are an expert music production educator..."}, {"role": "user", "content": "Create a lesson about compression"}, {"role": "assistant", "content": "Module: Understanding Compression\n\nIn this lesson, we'll break down..."}]}
{"messages": [{"role": "system", "content": "You are an expert music production educator..."}, {"role": "user", "content": "Create a lesson about EQ"}, {"role": "assistant", "content": "Module: Mastering EQ\n\nLet's dive into..."}]}
```

## API Usage

### Programmatic Access

```typescript
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

// In your component
const generateVideo = useAction(api.contentGeneration.generateViralVideoScript);

// Call it
const result = await generateVideo({
  userId: user.id,
  topic: "Advanced drum programming",
  platform: "tiktok",
  tone: "educational",
  targetAudience: "Hip-hop producers",
});

console.log(result.script); // Full script
console.log(result.hook);   // Just the hook
console.log(result.mainPoints); // Key points array
```

### Batch Generation

```typescript
// Generate 10 video scripts at once
const topics = [
  "808 bass mixing",
  "Vocal tuning tips",
  "Reverb techniques",
  // ... 7 more
];

const scripts = await Promise.all(
  topics.map(topic => 
    generateVideo({
      userId: user.id,
      topic,
      platform: "tiktok",
      tone: "educational",
    })
  )
);
```

## Cost Estimation

### RAG System (Current)
- **Embeddings**: ~$0.0001 per 1000 tokens
- **Generation**: ~$0.03 per video script
- **Total Monthly** (100 scripts): ~$3-5

### Fine-Tuning (Optional)
- **Training**: $5-20 per job
- **Inference**: Same as GPT-4 ($0.03 per script)
- **Total Monthly** (100 scripts + 1 retrain): ~$8-25

## Best Practices

### 1. Keep Embeddings Updated

```typescript
// Update embeddings when:
- Adding new courses
- Editing major course content
- Monthly refresh (recommended)

// Auto-update strategy:
// Add webhook in course creation mutation
await ctx.scheduler.runAfter(0, internal.embeddings.generateForCourse, {
  courseId: newCourse._id
});
```

### 2. Optimize Prompts

```typescript
// Good: Specific, actionable
"Create a TikTok script about removing vocal sibilance using de-essers"

// Bad: Vague
"Make a video about vocals"
```

### 3. Review and Edit

AI-generated content is a **starting point**, not final output:
- ✅ Review for accuracy
- ✅ Add personal touches
- ✅ Verify technical details
- ✅ Adjust tone/style

## Troubleshooting

### "No relevant content found"
**Solution:** Generate embeddings first at `/admin/embeddings`

### Scripts don't match my style
**Solution:** 
1. Add more course content
2. Be more specific in prompts
3. Consider fine-tuning

### Generation is slow
**Solution:**
- Use GPT-4o (faster than GPT-4)
- Reduce `max_tokens` in generation
- Use caching for repeated queries

## Next Steps

### Phase 1: Current (RAG) ✅
- ✅ Embeddings system
- ✅ Video script generation
- ✅ Course outline generation

### Phase 2: Enhancement 🔄
- 🔄 Batch generation UI
- 🔄 A/B testing for hooks
- 🔄 Multi-language support
- 🔄 Export to video editing tools

### Phase 3: Advanced 📋
- 📋 Fine-tuning pipeline
- 📋 Voice cloning integration
- 📋 Auto-video generation
- 📋 Analytics on generated content

## Files

```
convex/
├── contentGeneration.ts       # Main generation logic
├── embeddings.ts              # Vector search
├── embeddingActions.ts        # Embedding creation
└── rag.ts                     # RAG query system

app/
└── admin/
    ├── embeddings/page.tsx           # Generate embeddings
    └── content-generation/page.tsx   # Main UI
```

## Support

For questions or issues:
1. Check embeddings are generated
2. Review console logs
3. Verify OpenAI API key is set
4. Test with simple prompts first

---

**Built with:**
- OpenAI GPT-4
- Convex Vector Search
- RAG (Retrieval Augmented Generation)

