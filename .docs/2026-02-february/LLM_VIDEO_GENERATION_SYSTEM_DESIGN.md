# LLM-Powered Video Generation System for Pause Play Repeat

**Document Type:** Technical Design Specification
**Date:** February 13, 2026
**Status:** Proposal — Approach B (Full LLM Code Generation)
**Author:** Architecture Session with Claude 4.6 Opus

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What This System Does](#2-what-this-system-does)
3. [How It Was Prototyped](#3-how-it-was-prototyped)
4. [System Architecture](#4-system-architecture)
5. [The LLM Pipeline — Step by Step](#5-the-llm-pipeline--step-by-step)
6. [Data Flow](#6-data-flow)
7. [The Video Agent — LLM Prompt Engineering](#7-the-video-agent--llm-prompt-engineering)
8. [Remotion Integration](#8-remotion-integration)
9. [Rendering Infrastructure](#9-rendering-infrastructure)
10. [Asset Generation Pipeline](#10-asset-generation-pipeline)
11. [Voice Narration Pipeline](#11-voice-narration-pipeline)
12. [Security & Sandboxing](#12-security--sandboxing)
13. [User Experience Flow](#13-user-experience-flow)
14. [Database Schema Changes](#14-database-schema-changes)
15. [API Design](#15-api-design)
16. [Cost Analysis](#16-cost-analysis)
17. [Performance Targets](#17-performance-targets)
18. [Template Library as Training Data](#18-template-library-as-training-data)
19. [Existing Infrastructure Leverage](#19-existing-infrastructure-leverage)
20. [Implementation Phases](#20-implementation-phases)
21. [Risk Assessment](#21-risk-assessment)
22. [Competitive Advantage](#22-competitive-advantage)

---

## 1. Executive Summary

### The Vision

Every creator on Pause Play Repeat can type a natural language prompt — "Make a 60-second promo video for my saturation course" — and receive a fully rendered, professionally animated, voiceover-narrated marketing video in under 2 minutes. The video is custom-generated, not template-filled. An LLM writes the actual React/Remotion composition code, a separate LLM writes the script copy, AI generates the visuals, and ElevenLabs voices the narration. The creator can iterate ("make the hook more aggressive", "add a price reveal at the end", "use warmer colors") and re-render.

### Why Approach B (Full LLM Code Generation)

Template systems (Approach A) let you fill in blanks. Every "Course Promo" looks like every other "Course Promo" with different text. Approach B means:

- **Every video is structurally unique** — the LLM decides how many scenes, what animations to use, how to pace the content, what visual metaphors to employ
- **Creators can direct the AI** — "start with a before/after comparison, then show the module list, end with urgency pricing" becomes a real video
- **The system learns** — top-performing video structures can be fed back as examples
- **No ceiling** — templates have a finite set of layouts; LLM generation is boundless

### What Already Exists

From the prototyping session (February 13, 2026), we built 6 working Remotion compositions:

1. **PausePlayRepeat** — Brand launch announcement (30s)
2. **EmailAutomation** — Email marketing for music producers (78s)
3. **BeatLease** — Beat licensing system explainer (68s)
4. **FollowGates** — Follow gate feature promo (68s)
5. **SaturationCourse** — Course promo with animated waveforms (60s)
6. **SaturationCourseV2** — Course promo with AI-generated images (48s)

These compositions prove the concept. Each was written by an LLM (Claude 4.6 Opus) in response to natural language prompts, rendered via Remotion CLI, and produced production-quality 9:16 MP4 videos. The compositions use spring physics animations, gradient text, glassmorphism cards, SVG waveform visualizations, staggered reveals, Ken Burns image effects, and cinematic scene transitions.

---

## 2. What This System Does

### Input

A creator provides any combination of:

- **Natural language prompt:** "Make a promo video for my new course on compression types"
- **Data source:** A course ID, product ID, or store ID from the Convex database
- **Style direction:** "fast-paced", "cinematic", "educational", "hype", "minimalist"
- **Duration target:** 15s, 30s, 60s, 90s, up to 3 minutes
- **Aspect ratio:** 9:16 (Reels/TikTok), 16:9 (YouTube), 1:1 (Feed)
- **Voice preference:** A specific ElevenLabs voice ID, or "no voiceover"
- **Iteration feedback:** "Make the hook shorter", "Add the price", "More orange"

### Output

- **MP4 video file** — rendered at target resolution and aspect ratio
- **Voiceover audio** — synced narration (optional)
- **Thumbnail** — auto-extracted still frame for social media
- **Caption text** — auto-generated social media caption with hashtags
- **SRT subtitles** — for accessibility and silent autoplay

### What the LLM Generates

The LLM writes a complete React component (Remotion composition) that includes:

- Scene structure (how many scenes, what each contains)
- Animation logic (spring physics, interpolation, easing)
- Typography choices (font sizes, weights, gradient text)
- Color palette (derived from course topic or creator's brand)
- Layout decisions (card arrangements, text positioning, visual hierarchy)
- Timing (how long each scene lasts, stagger delays)
- Image integration (where to place AI-generated or user-provided images)
- Audio sync points (where voiceover lines align with visual reveals)

---

## 3. How It Was Prototyped

### The Prototyping Session

On February 13, 2026, we conducted a live prototyping session where Claude 4.6 Opus:

1. **Analyzed the entire PPR Academy codebase** — understood the app's features, data model, branding, and target audience
2. **Read the social media scripts document** (90+ content pieces) — used real marketing copy as source material
3. **Queried the Convex database** — pulled real course data (title, description, price) for the Saturation course
4. **Generated AI images** — created 6 cinematic images (tube amp, waveforms, mixing console, tape reel, producer, harmonics) using the GenerateImage tool
5. **Wrote 6 complete Remotion compositions** — each with unique scene structures, animations, color palettes, and copy
6. **Rendered all videos** — via `npx remotion render` to MP4, all in 9:16 portrait format
7. **Iterated based on feedback** — fixed centering, rewrote copy for music producer focus, corrected waveform accuracy, extended durations

### Key Learnings from Prototyping

| Learning | Implication |
|----------|------------|
| LLM reliably generates valid Remotion/React code | Approach B is technically viable |
| Each video took ~60s to render on local machine | Lambda would be 10-30s |
| Copy quality was high when given real data + context | masterAI can handle script writing |
| Waveform accuracy matters — producers notice | Domain-specific visual components need expert training |
| 9:16 centering requires flexbox discipline | Include layout rules in system prompt |
| Generated images dramatically increase production value | Fal.ai pipeline is essential |
| Iteration ("fix the centering", "change the copy") works naturally | Conversational refinement is a feature |

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CREATOR DASHBOARD                           │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │ Video Studio  │  │ Preview Player│  │ Iteration Chat      │  │
│  │ (prompt input)│  │ (@remotion/   │  │ "Make hook shorter" │  │
│  │              │  │  player)      │  │ "Add price reveal"  │  │
│  └──────┬───────┘  └───────▲───────┘  └──────────┬──────────┘  │
│         │                  │                     │              │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  │                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONVEX BACKEND                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 VIDEO ORCHESTRATOR                       │    │
│  │              (Convex Workflow Action)                     │    │
│  │                                                         │    │
│  │  Step 1: Gather Context                                 │    │
│  │    ├── Query course/product data from DB                │    │
│  │    ├── Query creator's brand (colors, logo, name)       │    │
│  │    └── Query store analytics (sales, enrollments)       │    │
│  │                                                         │    │
│  │  Step 2: Generate Script                                │    │
│  │    ├── masterAI ScriptAgent writes voiceover copy       │    │
│  │    ├── masterAI CopyAgent writes on-screen text         │    │
│  │    └── Output: structured scene-by-scene script         │    │
│  │                                                         │    │
│  │  Step 3: Generate Assets                                │    │
│  │    ├── Fal.ai generates scene background images         │    │
│  │    ├── Store images in Convex file storage               │    │
│  │    └── Output: array of image URLs                      │    │
│  │                                                         │    │
│  │  Step 4: Generate Voice                                 │    │
│  │    ├── ElevenLabs TTS from voiceover script             │    │
│  │    ├── Store audio in Convex file storage                │    │
│  │    └── Output: audio URL + duration + word timestamps   │    │
│  │                                                         │    │
│  │  Step 5: Generate Video Code                            │    │
│  │    ├── LLM (Claude Opus 4.6 via OpenRouter) writes comp │    │
│  │    ├── Input: script + image URLs + audio timestamps    │    │
│  │    ├── Output: complete React/TSX component code        │    │
│  │    └── Validation: syntax check + type check            │    │
│  │                                                         │    │
│  │  Step 6: Render Video                                   │    │
│  │    ├── Send code + assets to Remotion Lambda            │    │
│  │    ├── Lambda renders MP4 at target resolution          │    │
│  │    └── Output: MP4 file uploaded to storage             │    │
│  │                                                         │    │
│  │  Step 7: Post-Processing                                │    │
│  │    ├── Extract thumbnail frame                          │    │
│  │    ├── Generate SRT subtitles from script               │    │
│  │    ├── Generate social media caption                    │    │
│  │    └── Store all artifacts in DB                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Video Jobs   │  │ Video Assets │  │ Video History│          │
│  │ (queue/status)│  │ (images,audio)│ │ (versions)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Claude Opus │  │  Fal.ai      │  │  ElevenLabs          │  │
│  │  4.6 via     │  │  (Flux img)  │  │  (TTS + voice clone) │  │
│  │  OpenRouter   │  │              │  │                      │  │
│  │              │  │              │  │                      │  │
│  │  Writes:     │  │  Generates:  │  │  Generates:          │  │
│  │  - Script    │  │  - Scene BGs │  │  - Voiceover MP3     │  │
│  │  - React code│  │  - Textures  │  │  - Word timestamps   │  │
│  │  - Captions  │  │  - Icons     │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Remotion Lambda (AWS)                    │   │
│  │                                                          │   │
│  │  Receives: bundled Remotion project + dynamic component  │   │
│  │  Renders:  MP4 at 1080x1920 (or other target)           │   │
│  │  Returns:  MP4 file to Convex storage                    │   │
│  │                                                          │   │
│  │  Parallelization: splits frames across Lambda functions  │   │
│  │  Typical render: 10-30 seconds for 60s video             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. The LLM Pipeline — Step by Step

### Step 1: Context Gathering (0.5s)

The system queries Convex for all relevant data:

```typescript
// What the orchestrator gathers
const context = {
  // From the course/product
  title: "Saturation and Distortion - From First Principles to Advanced Sound Design",
  description: "This course takes you from understanding why distortion sounds musical...",
  price: 9,
  currency: "USD",
  moduleCount: 8,
  modules: ["The Science of Harmonics", "Tube Saturation", "Tape Saturation", ...],
  lessonCount: 42,
  totalDuration: "6h 30m",
  enrollmentCount: 247,
  averageRating: 4.8,
  reviewCount: 34,
  
  // From the creator's store
  storeName: "PPR Academy",
  storeSlug: "ppr-academy",
  creatorName: "Ady Sart",
  brandColors: { primary: "#6366f1", secondary: "#7c3aed" },
  logoUrl: "https://...",
  
  // From the prompt
  userPrompt: "Make a 60-second promo video for my saturation course",
  style: "educational",
  targetDuration: 60,
  aspectRatio: "9:16",
  voiceId: "voice_abc123",
  
  // From analytics (social proof)
  totalSales: 1247,
  completionRate: 34,
  topReview: "This completely changed how I think about mixing...",
};
```

### Step 2: Script Generation (3-5s)

masterAI's ScriptAgent receives the context and generates a structured script:

```typescript
// ScriptAgent output
const script = {
  totalDuration: 60,
  voiceoverScript: "Every hit record uses saturation. But most producers...",
  scenes: [
    {
      id: "hook",
      duration: 5,
      voiceover: "Every hit record uses saturation. But most producers treat it like magic — not science.",
      onScreenText: {
        headline: "Every hit record uses it.",
        subhead: "Most producers don't understand it.",
        emphasis: ["Saturation", "Distortion"],
      },
      visualDirection: "Dark, moody. Animated waveform showing clean signal. Build tension.",
      mood: "intrigue",
    },
    {
      id: "problem",
      duration: 8,
      voiceover: "You add saturation because a tutorial said to. You don't know why it sounds good. You can't tell tube from tape from transistor.",
      onScreenText: {
        headline: "Using distortion without understanding it.",
        bulletPoints: [
          "You add it because someone said to",
          "You don't know why it sounds good",
          "You can't choose between types",
        ],
      },
      visualDirection: "Pain points appearing one by one. Red/orange accents.",
      mood: "frustration",
    },
    // ... more scenes
  ],
  imagePrompts: [
    "Glowing vacuum tube amplifier, dark background, warm orange light, cinematic",
    "Audio waveform clean sine transforming to saturated clipped wave, blue to orange",
    // ...
  ],
  colorPalette: {
    primary: "#f97316",  // orange — warm, saturated
    secondary: "#ef4444", // red — distortion, heat
    accent: "#eab308",    // gold — premium, mastery
    background: "#0a0a0a",
  },
  suggestedThumbnailScene: "hook",
};
```

### Step 3: Asset Generation (5-15s, parallel)

Multiple Fal.ai requests fire in parallel:

```typescript
// Parallel image generation
const imagePromises = script.imagePrompts.map(prompt =>
  fal.run("fal-ai/flux/dev", {
    input: {
      prompt,
      image_size: { width: 1080, height: 1920 },
      num_inference_steps: 28,
    },
  })
);

const images = await Promise.all(imagePromises);
// Upload each to Convex storage, get URLs
```

### Step 4: Voice Generation (5-10s)

ElevenLabs generates the voiceover with word-level timestamps:

```typescript
const voiceover = await elevenlabs.textToSpeech({
  voice_id: context.voiceId,
  text: script.voiceoverScript,
  model_id: "eleven_multilingual_v2",
  output_format: "mp3_44100_128",
});

// Also request word-level timestamps for sync
const alignment = await elevenlabs.textToSpeechWithTimestamps({
  voice_id: context.voiceId,
  text: script.voiceoverScript,
});

// Output:
// { audioUrl: "https://...", duration: 58.3, words: [
//   { word: "Every", start: 0.0, end: 0.32 },
//   { word: "hit", start: 0.35, end: 0.52 },
//   ...
// ]}
```

### Step 5: Code Generation — THE CORE (5-10s)

This is where Approach B diverges from everything else. The LLM receives:

- The structured script (scenes, copy, timing)
- Image URLs (for `<Img>` components)
- Audio URL + timestamps (for `<Audio>` sync)
- Color palette
- The component library (available animations, helpers, patterns)

And outputs a **complete React/Remotion component** — raw TSX code.

```typescript
const codeGenPrompt = `
You are a Remotion video composition generator for Pause Play Repeat, 
a music production education platform.

## Your Task
Write a complete React component that is a Remotion video composition.
The composition must be a valid TypeScript/React file that exports a 
single React component.

## Available Imports
- remotion: AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, 
  spring, interpolate, Img, Audio, staticFile
- React

## Design System
${JSON.stringify(DESIGN_SYSTEM_RULES)}

## Component Library
You have access to these pre-built helper components:
${JSON.stringify(COMPONENT_LIBRARY)}

## Script
${JSON.stringify(script)}

## Assets
Images: ${JSON.stringify(imageUrls)}
Audio: ${JSON.stringify(audioData)}
Color Palette: ${JSON.stringify(script.colorPalette)}

## Rules
1. All content MUST be centered (use flexbox justify-content/align-items center)
2. Use spring() for entrances, interpolate() for exits
3. Text must have textShadow when over images
4. Every scene needs an exit transition (opacity fade + translateY)
5. Scene durations must match the script timing exactly
6. Audio sync: use <Sequence from={frameForWord}> to align text reveals with voiceover
7. The composition dimensions are 1080x1920 (9:16 portrait)
8. Use the provided color palette, not arbitrary colors
9. For waveform visualizations, use accurate math (tanh soft-clipping for saturation)
10. Generate production-quality code — this renders directly to video

## Output
Return ONLY the TypeScript/React code. No markdown, no explanation.
The code must export a single component as the default export.
`;

// OpenRouter provides a unified API compatible with OpenAI's SDK
// but routes to Claude Opus 4.6 — the best model for React/TSX code generation
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://academy.pauseplayrepeat.com",
    "X-Title": "Pause Play Repeat Video Generator",
  },
  body: JSON.stringify({
    model: "anthropic/claude-opus-4.6",
    messages: [
      { role: "system", content: codeGenPrompt },
      { role: "user", content: "Generate the video composition." },
    ],
    temperature: 0.3, // Lower temp for more reliable code
    max_tokens: 8000,
  }),
});

const data = await response.json();
const generatedCode = data.choices[0].message.content;
```

### Step 6: Validation & Rendering (10-30s)

Before rendering, the generated code is validated:

```typescript
// 1. Syntax check — parse the TSX
const ast = typescript.createSourceFile("video.tsx", generatedCode, ...);
if (ast.parseDiagnostics.length > 0) {
  // Re-prompt the LLM with the errors
  return retry(errors);
}

// 2. Security check — scan for dangerous patterns
const forbidden = ["fetch(", "eval(", "require(", "process.", "fs.", "child_process"];
if (forbidden.some(p => generatedCode.includes(p))) {
  throw new SecurityError("Generated code contains forbidden patterns");
}

// 3. Bundle and render via Remotion Lambda
const { renderId } = await renderMediaOnLambda({
  composition: "DynamicVideo",
  serveUrl: bundleUrl,
  codec: "h264",
  inputProps: {
    code: generatedCode,
    images: imageUrls,
    audio: audioUrl,
  },
});

// 4. Poll for completion
const result = await waitForRender(renderId);
// result.outputFile → MP4 URL
```

### Step 7: Post-Processing (2-5s)

```typescript
// Extract thumbnail
const thumbnail = await renderStill({
  composition: "DynamicVideo",
  frame: script.scenes[0].duration * 30 * 0.5, // Mid-hook frame
});

// Generate SRT subtitles from word timestamps
const srt = generateSRT(audioData.words);

// Generate social caption
const caption = await masterAI.generateCaption({
  videoScript: script,
  platform: "instagram",
  hashtagCount: 15,
});

// Store everything
await ctx.runMutation(internal.videos.store, {
  videoUrl: result.outputFile,
  thumbnailUrl: thumbnail,
  srtUrl: srt,
  caption,
  script,
  generatedCode, // Store for iteration
  courseId: context.courseId,
  creatorId: context.creatorId,
});
```

---

## 6. Data Flow

```
Creator Prompt
    │
    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Convex DB   │────▶│ Context      │────▶│ ScriptAgent │
│ (course,    │     │ Aggregator   │     │ (masterAI)  │
│  store,     │     │              │     │             │
│  analytics) │     └──────────────┘     └──────┬──────┘
└─────────────┘                                 │
                                                ▼
                                    ┌───────────────────┐
                                    │  Structured Script │
                                    │  (scenes, copy,   │
                                    │   visual direction)│
                                    └─────────┬─────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
                          ▼                   ▼                   ▼
                  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                  │  Fal.ai      │   │  ElevenLabs  │   │  LLM Code    │
                  │  (images)    │   │  (voice)     │   │  Generator   │
                  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                         │                  │                   │
                         ▼                  ▼                   ▼
                  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                  │  Image URLs  │   │  Audio URL + │   │  React/TSX   │
                  │              │   │  Timestamps  │   │  Component   │
                  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                         │                  │                   │
                         └──────────────────┼───────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  Remotion Lambda  │
                                   │  (render MP4)     │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  Convex Storage   │
                                   │  MP4 + Thumbnail  │
                                   │  + SRT + Caption  │
                                   └──────────────────┘
```

---

## 7. The Video Agent — LLM Prompt Engineering

### System Prompt Structure

The Video Agent's system prompt is critical. It needs to contain:

#### A. Design System Rules (constant)
```
- All scenes use AbsoluteFill with flexbox centering
- Text hierarchy: headline (44-56px, 900 weight), subhead (24-28px, 500), body (16-18px, 400)
- Color usage: gradients for emphasis, gray (#94a3b8) for secondary text
- Animations: spring() for entrances (damping: 50-70, stiffness: 150-200)
- Exits: interpolate opacity 1→0 + translateY 0→-30 over 20-25 frames
- Cards: dark glass (rgba darkGray + border with color at 20% opacity)
- Scene transitions: ~20 frame overlap between exit of one and entrance of next
```

#### B. Component Library (constant)
```
Pre-built components the LLM can use:
- CinematicBG: Ken Burns image background with overlay
- FadeUp: spring-animated fade+translate entrance
- GlowOrb: floating ambient background orb
- GridPattern: subtle grid background
- ScanLine: animated horizontal scan line
- StatCounter: animated number reveal with gradient
- FeatureCard: icon + title + description card
- StepCard: numbered step with connector line
- WaveformVisual: accurate SVG sine wave with optional saturation
```

#### C. Example Compositions (few-shot learning)
```
3-5 complete composition examples showing:
- Simple course promo (3 scenes)
- Feature explainer (6 scenes with data cards)
- Before/after comparison (split-screen concept)
- Stats-heavy credibility builder
- Emotional story hook → solution → CTA
```

#### D. Dynamic Context (per generation)
```
- Script content (scenes, copy, timing)
- Asset URLs (images, audio)
- Color palette
- Creator brand info
- Target duration and aspect ratio
```

### Why Claude Opus 4.6 via OpenRouter

| Factor | Detail |
|--------|--------|
| **Code quality** | Claude Opus 4.6 is the same model that wrote all 6 prototype compositions in this session — proven React/TSX output |
| **Why OpenRouter** | Single API key routes to any model. No direct Anthropic API contract needed. Easy to A/B test models later (e.g., Sonnet for cheaper scripts, Opus for code gen) |
| **Fallback** | OpenRouter supports automatic fallbacks — if Opus is rate-limited, it can fall back to Sonnet or another provider |
| **Cost visibility** | OpenRouter provides per-request cost tracking in the response headers |
| **API compatibility** | OpenRouter uses the OpenAI-compatible API format — drop-in replacement, no custom SDK needed |

### Environment Variable

```bash
OPENROUTER_API_KEY=sk-or-v1-... # Add to .env
```

### Temperature & Reliability

- **Code generation:** temperature 0.2-0.3 (reliable, consistent)
- **Script writing:** temperature 0.6-0.7 (creative, varied)
- **Caption generation:** temperature 0.7-0.8 (engaging, natural)

### Error Recovery

If the generated code fails to render:

1. Capture the error message
2. Send it back to the LLM with the code: "This code produced error X. Fix it."
3. The LLM corrects and resubmits
4. Max 3 retry attempts before falling back to a template

---

## 8. Remotion Integration

### Project Structure

```
ppr-academy/
├── remotion/
│   ├── index.ts                  # registerRoot entry point
│   ├── Root.tsx                  # All compositions registered
│   ├── DynamicVideo.tsx          # The shell that executes LLM-generated code
│   ├── components/               # Shared component library
│   │   ├── CinematicBG.tsx
│   │   ├── FadeUp.tsx
│   │   ├── GlowOrb.tsx
│   │   ├── GridPattern.tsx
│   │   ├── ScanLine.tsx
│   │   ├── StatCounter.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── StepCard.tsx
│   │   ├── WaveformVisual.tsx
│   │   └── index.ts              # Barrel export
│   ├── templates/                # Pre-built templates (Phase 1 fallback)
│   │   ├── CoursePromo.tsx
│   │   ├── FeatureExplainer.tsx
│   │   ├── ProductLaunch.tsx
│   │   └── BeatLeasePromo.tsx
│   └── assets/                   # Static assets
│       └── (generated images go here)
├── public/assets/                # Remotion static file serving
└── lib/
    └── video/
        ├── orchestrator.ts       # Main pipeline orchestrator
        ├── script-agent.ts       # Script generation
        ├── code-generator.ts     # LLM code generation
        ├── asset-generator.ts    # Fal.ai image generation
        ├── voice-generator.ts    # ElevenLabs TTS
        ├── renderer.ts           # Remotion Lambda interface
        └── validator.ts          # Code validation & security
```

### The Dynamic Video Shell

The key architectural piece is a Remotion composition that can execute dynamically generated code:

```tsx
// remotion/DynamicVideo.tsx
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";
import * as ComponentLib from "./components";

// This component receives generated code as a prop and executes it
export const DynamicVideo: React.FC<{
  generatedCode: string;
  images: string[];
  audioUrl?: string;
}> = ({ generatedCode, images, audioUrl }) => {
  
  const VideoComponent = useMemo(() => {
    // Create a function from the generated code
    // The component library is passed as available imports
    const factory = new Function(
      "React",
      "Remotion",
      "Components",
      "images",
      "audioUrl",
      generatedCode
    );
    
    return factory(React, RemotionLib, ComponentLib, images, audioUrl);
  }, [generatedCode, images, audioUrl]);

  if (!VideoComponent) {
    return <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }} />;
  }

  return <VideoComponent />;
};
```

### Remotion Lambda Setup

```typescript
// lib/video/renderer.ts
import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda/client";

export async function renderVideo(params: {
  code: string;
  images: string[];
  audioUrl?: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
}) {
  const { renderId } = await renderMediaOnLambda({
    region: "us-east-1",
    functionName: "remotion-render-ppr",
    composition: "DynamicVideo",
    serveUrl: REMOTION_BUNDLE_URL,
    codec: "h264",
    inputProps: {
      generatedCode: params.code,
      images: params.images,
      audioUrl: params.audioUrl,
    },
    framesPerLambda: 20,
    timeoutInMilliseconds: 120000,
    outName: `video-${Date.now()}.mp4`,
  });

  // Poll for completion
  let progress = 0;
  while (progress < 1) {
    const status = await getRenderProgress({
      renderId,
      region: "us-east-1",
      functionName: "remotion-render-ppr",
    });
    progress = status.overallProgress;
    
    if (status.fatalErrorEncountered) {
      throw new Error(status.errors[0].message);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  return { outputUrl: status.outputFile };
}
```

---

## 9. Rendering Infrastructure

### Option A: Remotion Lambda (Recommended for Production)

| Aspect | Detail |
|--------|--------|
| **How it works** | Remotion splits the video into chunks, renders each on a separate AWS Lambda function in parallel, then concatenates |
| **Speed** | 10-30 seconds for a 60s video (vs 60-90s on a single machine) |
| **Cost** | ~$0.01-0.05 per render (Lambda is pay-per-invocation) |
| **Concurrency** | Handles 100+ simultaneous renders |
| **Setup** | Deploy Lambda function via `npx remotion lambda deploy` |
| **Region** | us-east-1 recommended (best Lambda cold start times) |
| **Memory** | 2048MB per Lambda function |
| **Timeout** | 120s per chunk (more than enough) |

### Option B: Self-Hosted (Cheaper for Low Volume)

Run `@remotion/renderer` on a dedicated server (e.g., Railway, Fly.io):

```typescript
import { renderMedia } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";

const bundled = await bundle({ entryPoint: "./remotion/index.ts" });

await renderMedia({
  composition: "DynamicVideo",
  serveUrl: bundled,
  codec: "h264",
  outputLocation: `/tmp/video-${id}.mp4`,
  inputProps: { generatedCode, images, audioUrl },
});
```

| Aspect | Detail |
|--------|--------|
| **Speed** | 60-120 seconds for a 60s video |
| **Cost** | ~$20-50/month for a dedicated server |
| **Concurrency** | 1-2 simultaneous renders per server |
| **Setup** | Deploy Node.js app with Chrome headless |

### Recommendation

Start with **Remotion Lambda** — it's faster, scales automatically, and the per-render cost is negligible. Switch to self-hosted only if render volume is extremely high (1000+ renders/day) and cost optimization is needed.

---

## 10. Asset Generation Pipeline

### Image Generation via Fal.ai

```typescript
// lib/video/asset-generator.ts
import { fal } from "@fal-ai/client";

export async function generateSceneImages(
  imagePrompts: string[],
  aspectRatio: "9:16" | "16:9" | "1:1"
): Promise<string[]> {
  const sizes = {
    "9:16": { width: 1080, height: 1920 },
    "16:9": { width: 1920, height: 1080 },
    "1:1": { width: 1080, height: 1080 },
  };

  const results = await Promise.all(
    imagePrompts.map(prompt =>
      fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: `${prompt}, high quality, cinematic lighting, dark moody atmosphere, professional photography, 8k`,
          image_size: sizes[aspectRatio],
          num_inference_steps: 28,
          guidance_scale: 7.5,
        },
      })
    )
  );

  // Upload to Convex storage and return URLs
  const urls = await Promise.all(
    results.map(r => uploadToConvexStorage(r.images[0].url))
  );

  return urls;
}
```

### Image Types the System Generates

| Scene Type | Image Prompt Pattern |
|------------|---------------------|
| Course promo hook | Topic-specific cinematic image (e.g., tube amp for saturation) |
| Feature explainer | Abstract tech/UI visualization |
| Stats/credibility | Professional studio or workspace |
| Before/after | Split visual showing contrast |
| CTA | Producer in studio, creating music |
| Product showcase | Close-up of the product type (samples, presets, etc.) |

---

## 11. Voice Narration Pipeline

### ElevenLabs Integration

```typescript
// lib/video/voice-generator.ts
import { ElevenLabs } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabs({ apiKey: process.env.ELEVEN_LABS_API_KEY });

export async function generateVoiceover(params: {
  text: string;
  voiceId: string;
  model?: string;
}): Promise<{
  audioUrl: string;
  duration: number;
  words: Array<{ word: string; start: number; end: number }>;
}> {
  // Generate audio
  const audio = await elevenlabs.textToSpeech.convert(params.voiceId, {
    text: params.text,
    model_id: params.model || "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    },
  });

  // Generate with timestamps for sync
  const withTimestamps = await elevenlabs.textToSpeech.convertWithTimestamps(
    params.voiceId,
    {
      text: params.text,
      model_id: params.model || "eleven_multilingual_v2",
    }
  );

  // Upload audio to Convex storage
  const audioUrl = await uploadToConvexStorage(audio);

  return {
    audioUrl,
    duration: withTimestamps.duration,
    words: withTimestamps.alignment.words,
  };
}
```

### Voice Options for Creators

1. **Platform voices:** Pre-selected professional voices (male/female, various tones)
2. **Creator's own voice:** ElevenLabs voice cloning from uploaded audio samples
3. **No voiceover:** Text-only videos (current prototypes)

### Audio Sync in Remotion

The word timestamps from ElevenLabs enable precise text-to-speech sync:

```tsx
// In the generated Remotion component
const voiceoverWords = props.audioData.words;

// Find the frame where "Saturation" is spoken
const saturationWord = voiceoverWords.find(w => w.word === "Saturation");
const saturationFrame = Math.floor(saturationWord.start * fps);

// Reveal the text at that exact frame
<Sequence from={saturationFrame}>
  <FadeUp delay={0}>
    <GradientText>Saturation</GradientText>
  </FadeUp>
</Sequence>
```

---

## 12. Security & Sandboxing

### The Risk

LLM-generated code executing on your servers is a security concern. The code could potentially:
- Make network requests
- Access the filesystem
- Execute system commands
- Access environment variables

### Mitigations

#### 1. Code Scanning (Pre-Render)

```typescript
const FORBIDDEN_PATTERNS = [
  /\bfetch\s*\(/,
  /\bxmlhttprequest/i,
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\brequire\s*\(/,
  /\bimport\s*\(/,  // dynamic import
  /\bprocess\./,
  /\b__dirname/,
  /\b__filename/,
  /\bfs\./,
  /\bchild_process/,
  /\bexec\s*\(/,
  /\bspawn\s*\(/,
  /\bBuffer\./,
  /\bglobalThis\./,
  /\bwindow\.location/,
  /\bdocument\.cookie/,
];

function validateGeneratedCode(code: string): { safe: boolean; violations: string[] } {
  const violations = FORBIDDEN_PATTERNS
    .filter(pattern => pattern.test(code))
    .map(pattern => pattern.source);
  
  return { safe: violations.length === 0, violations };
}
```

#### 2. Remotion Lambda Sandboxing (Runtime)

Remotion Lambda functions are inherently sandboxed:
- They run in ephemeral AWS Lambda containers
- No persistent filesystem access
- Network access can be restricted via VPC/security groups
- Each render gets a fresh container
- Lambda execution role has minimal permissions

#### 3. Allowlist-Only Imports

The generated code can only access:
- `React` and `ReactDOM`
- `remotion` package exports (AbsoluteFill, Sequence, spring, interpolate, etc.)
- Pre-approved component library
- Image/audio URLs passed as props

No access to Node.js builtins, filesystem, network, or environment.

#### 4. Code Review Logging

Every generated composition is stored in the database with:
- The full source code
- The prompt that generated it
- The LLM model and parameters used
- A hash for deduplication
- Render status and any errors

This creates an audit trail and enables training data collection.

---

## 13. User Experience Flow

### Creator Dashboard — "Video Studio"

```
┌─────────────────────────────────────────────────────┐
│  VIDEO STUDIO                        [My Videos ▾]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  What video do you want to create?            │  │
│  │                                               │  │
│  │  [Make a 60-second promo for my saturation  ] │  │
│  │  [course — educational style, warm colors    ] │  │
│  │                                               │  │
│  │  [Generate Video ▶]                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ─── OR START FROM ──────────────────────────────── │
│                                                     │
│  [📚 My Courses ▾]  [📦 My Products ▾]              │
│  [📝 Script Library ▾]  [🎨 Templates ▾]            │
│                                                     │
│  ─── QUICK ACTIONS ──────────────────────────────── │
│                                                     │
│  [Course Promo]  [Product Launch]  [Feature Demo]   │
│  [Testimonial]   [Sale Announcement]  [Tutorial]    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  RECENT VIDEOS                                      │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │ 🎬  │ │ 🎬  │ │ 🎬  │ │ 🎬  │                   │
│  │thumb│ │thumb│ │thumb│ │thumb│                   │
│  │     │ │     │ │     │ │     │                   │
│  └─────┘ └─────┘ └─────┘ └─────┘                   │
│  Satura.. BeatLe.. Email.. Follow..                 │
│  60s      68s      78s     68s                      │
└─────────────────────────────────────────────────────┘
```

### Generation Progress UI

```
┌─────────────────────────────────────────────────────┐
│  GENERATING VIDEO                                   │
│                                                     │
│  ✅ Gathering course data                    0.5s   │
│  ✅ Writing script (7 scenes)                3.2s   │
│  ✅ Generating images (4 images)             8.1s   │
│  ✅ Generating voiceover                     6.4s   │
│  ✅ Writing video composition                5.8s   │
│  🔄 Rendering video...                      ████░░  │
│     Frame 892/1800 (49%)                            │
│                                                     │
│  Estimated time remaining: 12 seconds               │
└─────────────────────────────────────────────────────┘
```

### Iteration UI

After the video is generated, the creator sees:

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────┐              │
│  │                                   │  SCRIPT      │
│  │       VIDEO PREVIEW               │              │
│  │       (@remotion/player)          │  Scene 1:    │
│  │                                   │  "Every hit  │
│  │          [▶ PLAY]                 │   record..." │
│  │                                   │              │
│  │                                   │  Scene 2:    │
│  │                                   │  "Using it   │
│  │                                   │   without.." │
│  └───────────────────────────────────┘              │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Refine: "Make the hook more aggressive and   │  │
│  │  add the enrollment count"                     │  │
│  │                                    [Regenerate]│  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Download MP4]  [Download with Subtitles]          │
│  [Copy Caption]  [Share to Instagram]               │
│  [Post to TikTok]  [Schedule Post]                  │
└─────────────────────────────────────────────────────┘
```

---

## 14. Database Schema Changes

### New Convex Tables

```typescript
// convex/schema.ts additions

// Video generation jobs
videoJobs: defineTable({
  creatorId: v.id("users"),
  storeId: v.optional(v.id("stores")),
  courseId: v.optional(v.id("courses")),
  productId: v.optional(v.id("digitalProducts")),
  
  // Input
  prompt: v.string(),
  style: v.optional(v.string()),
  targetDuration: v.number(), // seconds
  aspectRatio: v.string(), // "9:16", "16:9", "1:1"
  voiceId: v.optional(v.string()),
  
  // Pipeline status
  status: v.union(
    v.literal("queued"),
    v.literal("gathering_context"),
    v.literal("generating_script"),
    v.literal("generating_assets"),
    v.literal("generating_voice"),
    v.literal("generating_code"),
    v.literal("rendering"),
    v.literal("post_processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  progress: v.number(), // 0-100
  
  // Generated artifacts
  scriptId: v.optional(v.id("videoScripts")),
  generatedCode: v.optional(v.string()),
  imageIds: v.optional(v.array(v.id("_storage"))),
  audioId: v.optional(v.id("_storage")),
  videoId: v.optional(v.id("_storage")),
  thumbnailId: v.optional(v.id("_storage")),
  srtContent: v.optional(v.string()),
  caption: v.optional(v.string()),
  
  // Metadata
  renderDuration: v.optional(v.number()), // seconds to render
  videoDuration: v.optional(v.number()), // duration of output video
  fileSize: v.optional(v.number()), // bytes
  
  // Iteration
  parentJobId: v.optional(v.id("videoJobs")), // previous version
  iterationPrompt: v.optional(v.string()),
  version: v.number(),
  
  // Error handling
  error: v.optional(v.string()),
  retryCount: v.number(),
})
  .index("by_creator", ["creatorId"])
  .index("by_store", ["storeId"])
  .index("by_status", ["status"])
  .index("by_course", ["courseId"]),

// Structured scripts
videoScripts: defineTable({
  jobId: v.id("videoJobs"),
  totalDuration: v.number(),
  voiceoverScript: v.string(),
  scenes: v.array(v.object({
    id: v.string(),
    duration: v.number(),
    voiceover: v.optional(v.string()),
    onScreenText: v.object({
      headline: v.optional(v.string()),
      subhead: v.optional(v.string()),
      bulletPoints: v.optional(v.array(v.string())),
      emphasis: v.optional(v.array(v.string())),
    }),
    visualDirection: v.string(),
    mood: v.string(),
  })),
  colorPalette: v.object({
    primary: v.string(),
    secondary: v.string(),
    accent: v.string(),
    background: v.string(),
  }),
  imagePrompts: v.array(v.string()),
})
  .index("by_job", ["jobId"]),

// Creator video library
videoLibrary: defineTable({
  creatorId: v.id("users"),
  storeId: v.optional(v.id("stores")),
  jobId: v.id("videoJobs"),
  
  title: v.string(),
  description: v.optional(v.string()),
  videoUrl: v.string(),
  thumbnailUrl: v.string(),
  duration: v.number(),
  aspectRatio: v.string(),
  
  // Social media
  caption: v.optional(v.string()),
  hashtags: v.optional(v.array(v.string())),
  srtUrl: v.optional(v.string()),
  
  // Publishing
  publishedTo: v.optional(v.array(v.string())), // ["instagram", "tiktok", ...]
  scheduledAt: v.optional(v.number()),
  
  // Analytics
  views: v.optional(v.number()),
  shares: v.optional(v.number()),
})
  .index("by_creator", ["creatorId"])
  .index("by_store", ["storeId"]),
```

---

## 15. API Design

### Convex Functions

```typescript
// convex/videos.ts

// Start a new video generation
export const generate = mutation({
  args: {
    prompt: v.string(),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    style: v.optional(v.string()),
    targetDuration: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
    voiceId: v.optional(v.string()),
  },
  returns: v.id("videoJobs"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    
    const jobId = await ctx.db.insert("videoJobs", {
      creatorId: user._id,
      prompt: args.prompt,
      courseId: args.courseId,
      productId: args.productId,
      style: args.style || "modern",
      targetDuration: args.targetDuration || 60,
      aspectRatio: args.aspectRatio || "9:16",
      voiceId: args.voiceId,
      status: "queued",
      progress: 0,
      version: 1,
      retryCount: 0,
    });

    // Kick off the pipeline
    await ctx.scheduler.runAfter(0, internal.videos.runPipeline, { jobId });

    return jobId;
  },
});

// Iterate on an existing video
export const iterate = mutation({
  args: {
    jobId: v.id("videoJobs"),
    feedback: v.string(),
  },
  returns: v.id("videoJobs"),
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.jobId);
    
    const newJobId = await ctx.db.insert("videoJobs", {
      ...original,
      parentJobId: args.jobId,
      iterationPrompt: args.feedback,
      version: original.version + 1,
      status: "queued",
      progress: 0,
      retryCount: 0,
    });

    await ctx.scheduler.runAfter(0, internal.videos.runPipeline, { 
      jobId: newJobId,
      previousCode: original.generatedCode,
      previousScript: original.scriptId,
    });

    return newJobId;
  },
});

// Get real-time generation progress
export const getProgress = query({
  args: { jobId: v.id("videoJobs") },
  returns: v.object({
    status: v.string(),
    progress: v.number(),
    videoUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    return {
      status: job.status,
      progress: job.progress,
      videoUrl: job.videoId ? await ctx.storage.getUrl(job.videoId) : undefined,
      error: job.error,
    };
  },
});
```

---

## 16. Cost Analysis

### Per-Video Generation Cost

| Component | Cost | Notes |
|-----------|------|-------|
| LLM: Script generation (Claude Opus 4.6 via OpenRouter) | $0.03-0.08 | ~2K input + 1K output tokens |
| LLM: Code generation (Claude Opus 4.6 via OpenRouter) | $0.05-0.12 | ~3K input + 4K output tokens |
| Fal.ai: Image generation (4 images) | $0.04-0.08 | ~$0.01-0.02 per image (Flux Dev) |
| ElevenLabs: Voiceover (60s) | $0.05-0.15 | Depends on plan tier |
| Remotion Lambda: Render | $0.01-0.05 | Lambda invocation cost |
| Convex storage: Assets | $0.001 | Negligible |
| **Total per video** | **$0.18-0.47** | |

### At Scale

| Monthly renders | Cost/month | Revenue potential |
|-----------------|------------|-------------------|
| 100 | $18-47 | Feature of Creator plan ($29/mo) |
| 1,000 | $180-470 | Feature of Pro plan ($79/mo) |
| 10,000 | $1,800-4,700 | Usage-based add-on |

### Pricing Strategy

- **Free plan:** 2 videos/month (template-only, no voiceover, no AI images)
- **Starter ($12/mo):** 5 videos/month (templates + basic LLM generation)
- **Creator ($29/mo):** 20 videos/month (full LLM + images + voiceover)
- **Creator Pro ($79/mo):** 100 videos/month (full pipeline + priority rendering)
- **Business ($149/mo):** Unlimited (full pipeline + custom branding + API access)

---

## 17. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Context gathering | < 1s | Convex query |
| Script generation | < 5s | Claude Opus 4.6 via OpenRouter |
| Image generation | < 15s | 4 images in parallel via Fal.ai |
| Voice generation | < 10s | ElevenLabs TTS |
| Code generation | < 10s | Claude Opus 4.6 via OpenRouter |
| Code validation | < 1s | AST parsing + pattern matching |
| Video rendering | < 30s | Remotion Lambda parallel |
| Post-processing | < 5s | Thumbnail + SRT + caption |
| **Total end-to-end** | **< 90s** | From prompt to downloadable MP4 |

With caching and optimizations:
- Repeated renders (iteration): ~30-45s (skip asset generation)
- Template-based renders: ~15-20s (skip LLM code generation)

---

## 18. Template Library as Training Data

The 6 compositions we built during prototyping serve dual purpose:

### 1. Fallback Templates (Approach A)
If the LLM-generated code fails after 3 retries, fall back to a template that accepts dynamic props.

### 2. Few-Shot Examples for the LLM
Include these as examples in the code generation prompt so the LLM understands:
- The project's design language (dark backgrounds, gradient text, glassmorphism)
- Animation patterns (spring entrances, fade exits)
- Scene structure (hook → problem → solution → proof → CTA)
- Component usage (how to use FadeUp, FeatureCard, etc.)

### 3. Training Data for Fine-Tuning
As we accumulate more compositions (from creator iterations), we can fine-tune a smaller model specifically for Remotion code generation — faster and cheaper than Claude Opus 4.6.

---

## 19. Existing Infrastructure Leverage

### What PPR Already Has

| Infrastructure | How It's Used |
|----------------|---------------|
| **Convex backend** | Video job queue, progress tracking, file storage, real-time updates |
| **@convex-dev/workflow** | Multi-step pipeline orchestration with retry logic |
| **masterAI multi-agent system** | Script generation via existing Coordinator → Planner → ContentAgent flow |
| **@fal-ai/client (installed)** | Image generation — just needs Fal API key |
| **@elevenlabs/elevenlabs-js (installed)** | Voice generation — just needs API key |
| **OpenRouter integration** | LLM code generation (Claude Opus 4.6) |
| **Convex file storage** | Store generated images, audio, video |
| **Mux integration** | Video hosting and streaming (optional for delivery) |
| **Stripe Connect** | Monetize video generation as a paid feature |
| **Real-time Convex queries** | Live progress updates in the UI |
| **Resend email** | Notify creators when video is ready |
| **React + Next.js** | @remotion/player embeds directly in the dashboard |

### What Needs to Be Added

| New Dependency | Purpose | Effort |
|----------------|---------|--------|
| `@remotion/renderer` | Server-side rendering | npm install |
| `@remotion/lambda` | AWS Lambda rendering (production) | npm install + AWS setup |
| `@remotion/player` | Browser-based preview | npm install |
| Remotion Lambda function | AWS deployment | `npx remotion lambda deploy` |
| S3 bucket | Lambda render output | AWS console |
| `OPENROUTER_API_KEY` | Claude Opus 4.6 access for code + script generation | OpenRouter account + env var |

---

## 20. Implementation Phases

### Phase 1: Template System MVP (2-3 weeks)

**Goal:** Creators can generate videos from pre-built templates with dynamic data.

- Extract the 6 prototyped compositions into reusable template components
- Build template selection UI in creator dashboard
- Connect templates to Convex data (course title, price, etc.)
- Add `@remotion/renderer` for server-side rendering
- Store rendered videos in Convex storage
- Basic download and share functionality

**No LLM code generation yet** — just data-driven templates.

### Phase 2: AI Script + Assets (2-3 weeks)

**Goal:** AI writes the script and generates images, but uses templates for rendering.

- Add ScriptAgent to masterAI for video script generation
- Integrate Fal.ai for scene image generation
- Integrate ElevenLabs for voiceover
- Build the generation progress UI
- Add the audio sync system

**LLM writes the content, templates handle the visuals.**

### Phase 3: Full LLM Code Generation (3-4 weeks)

**Goal:** LLM generates custom Remotion compositions from prompts.

- Build the code generation prompt system
- Implement the DynamicVideo shell component
- Add code validation and security scanning
- Deploy Remotion Lambda for production rendering
- Build the iteration/refinement UI
- Add error recovery and fallback logic

**This is the full Approach B.**

### Phase 4: Polish & Scale (2-3 weeks)

**Goal:** Production-ready, scalable, delightful.

- Fine-tune LLM prompts based on usage data
- Add `@remotion/player` for in-browser preview
- Build video analytics (which videos get shared most)
- Social media direct posting (Instagram, TikTok APIs)
- Scheduled posting
- A/B test video variants
- Usage-based billing integration

---

## 21. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM generates broken code | Medium | Low | Retry loop + template fallback |
| LLM generates insecure code | Low | High | Allowlist scanning + Lambda sandboxing |
| Rendering takes too long | Low | Medium | Lambda parallelization + timeout handling |
| Generated videos look bad | Medium | Medium | Design system constraints in prompt + component library |
| Fal.ai image quality inconsistent | Medium | Low | Multiple generations + selection |
| ElevenLabs voice sounds robotic | Low | Medium | Use v2 multilingual model + parameter tuning |
| High costs at scale | Medium | Medium | Caching, fine-tuned smaller models, usage limits |
| Copyright concerns on generated images | Low | Medium | Use Fal's commercially licensed models (Flux) |
| AWS Lambda cold starts | Medium | Low | Keep-alive pings + provisioned concurrency |

---

## 22. Competitive Advantage

### Why This Is a Moat

1. **No other music creator platform has this.** Not Splice, not Distrokid, not Landr, not BeatStars, not Teachable, not Gumroad. Zero.

2. **The LLM understands music production.** Because it has access to course data, module structures, product types (beat leases, sample packs, presets), and music-specific terminology, the generated videos are contextually accurate in a way generic video tools can't match.

3. **Data-driven personalization.** Videos pull real enrollment counts, ratings, sales figures, and reviews from the database. This isn't stock footage with text — it's dynamic content generated from actual business data.

4. **Creator voice.** ElevenLabs voice cloning means the video sounds like the creator, not a generic AI voice.

5. **Iteration loop.** "Make the hook more aggressive" → re-render in 30 seconds. Traditional video editing takes hours for the same change.

6. **Compound value.** Every video generated trains the system. Top-performing video structures become examples for future generations. The product gets better with every use.

7. **Distribution built in.** The videos are generated inside the same platform where the products are sold. One click to attach a promo video to a course listing. One click to schedule across social platforms.

### The Pitch

> "Every course on Pause Play Repeat comes with a professional marketing video. You don't hire a video editor. You don't learn After Effects. You type what you want, and the AI creates it — with your voice, your brand, your data, your style. In 90 seconds."

---

## Appendix A: File Inventory from Prototyping Session

```
remotion/
├── index.ts                        # Remotion entry point
├── Root.tsx                        # 6 compositions registered
├── PausePlayRepeatVideo.tsx        # Brand launch video (30s)
├── EmailAutomationVideo.tsx        # Email marketing explainer (78s)
├── BeatLeaseVideo.tsx              # Beat licensing promo (68s)
├── FollowGatesVideo.tsx            # Follow gates feature (68s)
├── SaturationCourseVideo.tsx       # Course promo - text only (60s)
├── SaturationCourseV2.tsx          # Course promo - with images (48s)
└── assets/
    ├── saturation-tube-amp.png
    ├── saturation-waveform.png
    ├── saturation-console.png
    ├── saturation-tape.png
    ├── saturation-producer.png
    └── saturation-harmonics.png

out/
├── PausePlayRepeat-9x16.mp4       # 3.8 MB
├── EmailAutomation-9x16.mp4       # 7.4 MB
├── BeatLease-9x16.mp4             # 6.4 MB
├── FollowGates-9x16.mp4           # 5.7 MB
├── SaturationCourse-9x16.mp4      # 6.1 MB
└── SaturationCourseV2-9x16.mp4    # 35 MB
```

---

## Appendix B: Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering engine | Remotion | React-based (matches stack), Lambda support, proven at scale |
| LLM for code gen | Claude Opus 4.6 via OpenRouter | Best-in-class at TypeScript/React code generation — same model that prototyped all 6 videos |
| LLM for scripts | Claude Opus 4.6 via OpenRouter | Understands music production context, writes compelling copy, proven in prototyping session |
| Image generation | Fal.ai Flux | Already installed, commercially licensed, fast |
| Voice generation | ElevenLabs | Already installed, voice cloning, word timestamps |
| Video storage | Convex file storage | Already the backend, real-time access |
| Job queue | Convex workflows | Already installed (@convex-dev/workflow), retry logic built in |
| Production render | Remotion Lambda | 10-30s renders, auto-scaling, pay-per-use |
| Aspect ratios | 9:16 primary | Reels/TikTok/Shorts are the primary distribution channels |

---

*Document generated during architecture session, February 13, 2026.*
*Based on working prototypes built and rendered during the session.*
