# Claude Code Prompts — LLM Video Generation System Build

**Reference:** `LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md`
**Model:** Claude Opus 4.6
**Project:** Pause Play Repeat (`/Users/adysart/Documents/GitHub/ppr-academy`)

These prompts are designed to be run sequentially in Claude Code (or Cursor with Claude). Each prompt builds on the previous one. Copy and paste them one at a time.

---

## How to Use This Document

1. Run each prompt in order (Phase 1 → Phase 2 → Phase 3 → Phase 4)
2. Wait for each prompt to complete before moving to the next
3. Test after each phase — each one produces a working milestone
4. Prompts reference the design doc at `.docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md` — make sure it exists
5. Some prompts have [DECISION POINTS] — read them and adjust before running

---

# PHASE 1: REMOTION COMPONENT LIBRARY + TEMPLATE SYSTEM

## Prompt 1.1 — Extract Shared Component Library

```
Read the following Remotion composition files in my project:

- remotion/PausePlayRepeatVideo.tsx
- remotion/EmailAutomationVideo.tsx
- remotion/BeatLeaseVideo.tsx
- remotion/FollowGatesVideo.tsx
- remotion/SaturationCourseVideo.tsx
- remotion/SaturationCourseV2.tsx

These were prototyped during a video generation session. Each file has duplicated helper components (background orbs, grid patterns, scan lines, fade-up animations, feature cards, stat counters, centered wrappers, etc).

Your task:

1. Identify every reusable component pattern across all 6 files
2. Extract them into a shared component library at `remotion/components/`
3. Create these files:
   - `remotion/components/Background.tsx` — GlowOrb, GridPattern, ScanLine, CinematicBG (Ken Burns image background)
   - `remotion/components/Layout.tsx` — CenterScene (centered flexbox wrapper with background)
   - `remotion/components/Animations.tsx` — FadeUp, useExit hook
   - `remotion/components/Cards.tsx` — FeatureCard, StepCard/StepRow, ReasonCard, TierCard
   - `remotion/components/Stats.tsx` — StatCounter, StatBlock, StatBig
   - `remotion/components/Waveform.tsx` — WaveformVisual (the accurate SVG sine wave with tanh soft-clip saturation)
   - `remotion/components/Typography.tsx` — GradientText, SectionLabel (the uppercase colored label)
   - `remotion/components/CTA.tsx` — CTAButton (pulsing gradient button), LogoIcon (the ▶ play icon in gradient box)
   - `remotion/components/Connectors.tsx` — ConnectorLine between steps
   - `remotion/components/index.ts` — barrel export of everything
4. Create a shared `remotion/theme.ts` with the color constants (C object) and font family constant (F)
5. Refactor ALL 6 composition files to import from the shared library instead of using inline duplicates
6. Verify the Root.tsx still registers all 6 compositions correctly
7. Test by running: npx remotion compositions remotion/index.ts — all 6 should list without errors

Do NOT change any visual output — the videos should render identically to before. This is purely a refactor for reuse.
```

## Prompt 1.2 — Build the Template Props System

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, specifically Section 18 (Template Library as Training Data) and the architecture overview.

Now look at the 6 existing Remotion compositions in remotion/ and the shared component library you extracted.

Your task: Create a template system where compositions accept dynamic props instead of having hardcoded content.

1. Create `remotion/types.ts` with TypeScript types for video input data:

```typescript
export interface VideoScene {
  id: string;
  duration: number; // seconds
  headline?: string;
  subhead?: string;
  bulletPoints?: string[];
  emphasis?: string[]; // words to highlight with gradient
  mood: "intrigue" | "frustration" | "solution" | "proof" | "urgency" | "excitement";
}

export interface VideoScript {
  totalDuration: number;
  scenes: VideoScene[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export interface CoursePromoProps {
  title: string;
  description: string;
  price: number;
  currency: string;
  moduleCount?: number;
  modules?: string[];
  lessonCount?: number;
  enrollmentCount?: number;
  averageRating?: number;
  creatorName: string;
  storeName: string;
  domain: string; // e.g. "academy.pauseplayrepeat.com"
  script: VideoScript;
  imageUrls?: string[];
  audioUrl?: string;
}

export interface FeaturePromoProps {
  featureName: string;
  tagline: string;
  painPoints: string[];
  solution: { icon: string; title: string; description: string }[];
  stats: { value: string; label: string }[];
  steps?: { time: string; icon: string; text: string }[];
  domain: string;
  script: VideoScript;
}

export interface ProductPromoProps {
  productName: string;
  productType: string; // "sample_pack" | "preset" | "beat" | etc
  price: number;
  description: string;
  features: string[];
  domain: string;
  script: VideoScript;
  imageUrls?: string[];
}
```

2. Create `remotion/templates/CoursePromoTemplate.tsx` — a generalized version of SaturationCourseVideo that accepts CoursePromoProps and dynamically renders scenes from the script data. Use the shared component library.

3. Create `remotion/templates/FeatureExplainerTemplate.tsx` — a generalized version of EmailAutomationVideo / FollowGatesVideo / BeatLeaseVideo that accepts FeaturePromoProps.

4. Create `remotion/templates/ProductLaunchTemplate.tsx` — for sample packs, presets, beat launches.

5. Register all 3 templates in Root.tsx as additional compositions that accept inputProps.

6. Test by rendering CoursePromoTemplate with example props:
   npx remotion render remotion/index.ts CoursePromoTemplate out/test-template.mp4 --props='{"title":"Test Course","description":"A test","price":29,"currency":"USD","creatorName":"Test","storeName":"Test Store","domain":"academy.pauseplayrepeat.com","script":{"totalDuration":30,"scenes":[{"id":"hook","duration":5,"headline":"Test Hook","mood":"intrigue"}],"colorPalette":{"primary":"#6366f1","secondary":"#7c3aed","accent":"#ec4899","background":"#0a0a0a"}}}'

The templates should be flexible enough to handle varying numbers of scenes, modules, stats, and features.
```

## Prompt 1.3 — Build the Convex Video Schema

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, specifically Section 14 (Database Schema Changes).

Your task: Add the video generation tables to the Convex schema.

1. Read the existing convex/schema.ts to understand the current table structure and conventions
2. Add these 3 new tables to the schema (following the existing patterns for validators, indexes, etc):
   - videoJobs — tracks video generation pipeline jobs
   - videoScripts — stores structured scripts
   - videoLibrary — the creator's finished video library
3. Use the exact schema defined in Section 14 of the design doc
4. Make sure all ID references point to existing tables (users, stores, courses, digitalProducts, _storage)
5. Run `npx convex dev` to validate the schema compiles

Do NOT modify any existing tables. Only add the 3 new ones.

IMPORTANT: Follow the existing schema conventions:
- Use v.optional() for nullable fields
- Name indexes with "by_" prefix and include all indexed fields
- Use v.union() with v.literal() for status enums
- Use v.id("tableName") for foreign keys
```

## Prompt 1.4 — Build Basic Video Generation Mutations/Queries

```
Read convex/schema.ts to see the new video tables (videoJobs, videoScripts, videoLibrary).
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 15 (API Design).

Your task: Create the Convex functions for the video system.

Create `convex/videos.ts` with:

1. **Mutations:**
   - `generate` — creates a new videoJob (status: "queued"), validates the user is authenticated, schedules the pipeline
   - `iterate` — creates a new videoJob linked to a parent, for iterating on an existing video
   - `updateJobStatus` (internal) — updates job status and progress
   - `storeVideoResult` (internal) — stores the final video artifacts
   - `deleteVideo` — removes a video from the library

2. **Queries:**
   - `getProgress` — returns real-time job status + progress (for the progress UI)
   - `getVideoLibrary` — returns all videos for a creator, sorted by newest first
   - `getVideoById` — returns a single video with all details
   - `getRecentJobs` — returns recent jobs for a creator (includes failed ones)

3. **Internal functions:**
   - `internal.videos.runPipeline` (internalAction) — the main orchestrator that will call each pipeline step. For now, just create a STUB that:
     - Sets status to "gathering_context"
     - Waits 1 second
     - Sets status to "completed"
     - This stub will be replaced in Phase 2 with the real pipeline

Follow existing Convex conventions in the codebase:
- All functions must have args and returns validators
- Use ctx.runQuery/ctx.runMutation from actions (not ctx.db)
- Use internal.videos.* for internal function references
- Auth check: use the same pattern other files use (check for existing user patterns in convex/)
```

---

# PHASE 2: AI SCRIPT GENERATION + ASSET PIPELINE

## Prompt 2.1 — Build the Context Gatherer

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 5 Step 1 (Context Gathering).

Your task: Build the context gathering step that collects all data needed for video generation.

Create `convex/videosPipeline/gatherContext.ts`:

1. This is an internalQuery that accepts a videoJob ID
2. It reads the job to get courseId/productId/storeId
3. It queries all relevant data:
   - If courseId: get course title, description, price, modules (with lesson counts), enrollment count
   - If productId: get product name, type, description, price, features
   - Get the creator's store: name, slug, brand colors, logo, social links
   - Get basic analytics: total sales, reviews, average rating
4. Return a structured context object (define a TypeScript type for it)
5. Handle cases where courseId or productId is missing (user might just have a free-form prompt)

Read the existing Convex query patterns in the codebase to understand how courses, modules, lessons, stores, and digital products are queried. Use .withIndex() instead of .filter() per project conventions.

The context object should match what's described in Section 5 Step 1 of the design doc.
```

## Prompt 2.2 — Build the Script Generator

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 5 Step 2 (Script Generation) and Section 7 (Video Agent Prompt Engineering).

Your task: Build the script generation step that uses Claude Opus 4.6 via OpenRouter to write a structured video script.

Create `convex/videosPipeline/generateScript.ts`:

1. This is an internalAction (needs "use node" since it calls external API)
2. It receives the gathered context object from the previous step
3. It calls OpenRouter's API with model "anthropic/claude-opus-4.6"
4. The system prompt should:
   - Explain that it's writing a video script for a music production platform
   - Describe the available scene types and moods
   - Include the color palette selection logic (warm colors for mixing/mastering topics, blue/purple for tech features, etc)
   - Specify the output format (JSON matching the VideoScript type from remotion/types.ts)
   - Include image prompt generation (what images Fal.ai should create for each scene)
5. Parse the LLM response into a structured VideoScript
6. Store the script in the videoScripts table
7. Update the job status to "generating_script" → "generating_assets"

Environment: Use process.env.OPENROUTER_API_KEY

The API call format:
```
POST https://openrouter.ai/api/v1/chat/completions
Headers:
  Authorization: Bearer $OPENROUTER_API_KEY
  Content-Type: application/json
  HTTP-Referer: https://academy.pauseplayrepeat.com
  X-Title: Pause Play Repeat Video Generator
Body:
  model: "anthropic/claude-opus-4.6"
  messages: [system, user]
  temperature: 0.6
  max_tokens: 4000
  response_format: { type: "json_object" }
```

Include error handling: if the LLM response isn't valid JSON, retry once with a simpler prompt. If still fails, fall back to a default script structure.
```

## Prompt 2.3 — Build the Image Generation Pipeline

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 10 (Asset Generation Pipeline).

Your task: Build the Fal.ai image generation step.

Create `convex/videosPipeline/generateImages.ts`:

1. This is an internalAction with "use node"
2. It receives:
   - imagePrompts: string[] (from the script generation step)
   - aspectRatio: "9:16" | "16:9" | "1:1"
3. It calls Fal.ai's Flux model for each image prompt IN PARALLEL
4. Each prompt gets enhanced with: "high quality, cinematic lighting, dark moody atmosphere, professional, 8k"
5. Downloads each generated image
6. Uploads each to Convex file storage (ctx.storage.store)
7. Returns an array of storage IDs
8. Updates job status + progress

Use @fal-ai/client which is already installed in the project.

The Fal.ai call:
```typescript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/flux/dev", {
  input: {
    prompt: enhancedPrompt,
    image_size: { width, height },
    num_inference_steps: 28,
  },
});
// result.data.images[0].url contains the image URL
```

Handle errors gracefully: if one image fails, continue with the others and use null for the failed one. The video should still render even if some images are missing.

Add FAL_KEY to the environment variables documentation.
```

## Prompt 2.4 — Build the Voice Generation Pipeline

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 11 (Voice Narration Pipeline).

Your task: Build the ElevenLabs voice generation step.

Create `convex/videosPipeline/generateVoice.ts`:

1. This is an internalAction with "use node"
2. It receives:
   - voiceoverScript: string (the full narration text from the script)
   - voiceId: string (ElevenLabs voice ID)
3. It calls ElevenLabs to:
   - Generate the audio (MP3)
   - Get word-level timestamps for sync
4. Uploads the audio file to Convex file storage
5. Returns: { audioStorageId, duration, words: Array<{word, start, end}> }
6. Updates job status

Use @elevenlabs/elevenlabs-js which is already installed.

If voiceId is not provided, skip this step entirely (some videos will be text-only with no voiceover).

Handle the case where ElevenLabs API key isn't set — skip voice generation gracefully and continue the pipeline.

Add ELEVEN_LABS_API_KEY to the environment variables documentation (this may already exist in the project).
```

## Prompt 2.5 — Wire Up the Pipeline Orchestrator

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 5 (The LLM Pipeline) for the full flow.

Your task: Replace the stub pipeline in convex/videos.ts with the real orchestrator that calls each step in sequence.

Update `internal.videos.runPipeline` (the internalAction) to:

1. Set status "gathering_context" → call gatherContext
2. Set status "generating_script" → call generateScript  
3. Set status "generating_assets" → call generateImages (parallel with step 4)
4. Set status "generating_voice" → call generateVoice (parallel with step 3)
5. Wait for both 3 and 4 to complete
6. Set status "generating_code" → (STUB for now — just log "code generation will go here")
7. Set status "rendering" → (STUB for now — just log "rendering will go here")
8. Set status "completed"

Use the @convex-dev/workflow package that's already installed for orchestration. Check how existing workflows are set up in the convex/ directory.

For steps 3+4 running in parallel: use Promise.all or the workflow's parallel step feature.

Wrap the entire pipeline in try/catch. On error:
- Set job status to "failed"
- Store the error message in the job
- Increment retryCount
- If retryCount < 3, schedule a retry after 5 seconds

Progress should update at each step:
- gathering_context: 10%
- generating_script: 25%
- generating_assets: 40% (parallel)
- generating_voice: 55% (parallel)
- generating_code: 70%
- rendering: 85%
- completed: 100%
```

---

# PHASE 3: LLM CODE GENERATION + RENDERING

## Prompt 3.1 — Build the Code Generator

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, specifically:
- Section 5 Step 5 (Code Generation — THE CORE)
- Section 7 (The Video Agent — LLM Prompt Engineering)
- Section 12 (Security & Sandboxing)

Also read ALL the files in remotion/components/ to understand the full component library.

Your task: Build the LLM code generation step — this is the core of Approach B.

Create `convex/videosPipeline/generateCode.ts`:

1. This is an internalAction with "use node"
2. It receives:
   - script: the structured VideoScript
   - imageUrls: string[] (Convex storage URLs for generated images)
   - audioData: { audioUrl, duration, words } | null
   - colorPalette: the script's color palette
3. It builds a comprehensive system prompt that includes:

   a. DESIGN SYSTEM RULES — extracted from our actual component library:
      - All scenes use AbsoluteFill with flexbox centering
      - Text sizes, weights, gradient patterns
      - Animation patterns (spring for entrance, interpolate for exit)
      - Card styling (dark glass, border with color at 20% opacity)
      - Scene transition timing

   b. COMPONENT LIBRARY REFERENCE — the actual exports from remotion/components/:
      - List every component with its props interface
      - Show usage examples for each
      - Explain when to use each one

   c. 3 COMPLETE EXAMPLES — include the FULL source code of:
      - EmailAutomationVideo.tsx (feature explainer pattern)
      - SaturationCourseVideo.tsx (course promo pattern)
      - BeatLeaseVideo.tsx (product promo pattern)
      These serve as few-shot examples so the LLM understands the expected output format.

   d. THE SCRIPT — the structured VideoScript with scenes, copy, timing

   e. THE ASSETS — image URLs and audio data with timestamps

   f. STRICT RULES:
      - Output ONLY valid TypeScript/React code
      - Export a single React.FC component as default export
      - Import only from "remotion" and "../components"
      - All content must be centered using the CenterScene/Content wrapper
      - Scene durations must match the script timing exactly
      - Use the provided color palette, not arbitrary colors
      - No fetch(), eval(), require(), import(), process., fs., child_process
      - Every scene needs an exit transition

4. Call OpenRouter with model "anthropic/claude-opus-4.6", temperature 0.3

5. VALIDATE the generated code:
   - Check it's valid TypeScript (try parsing with typescript compiler API)
   - Scan for forbidden patterns (the security list from Section 12)
   - Check it contains a default export
   - Check it imports from "remotion"

6. If validation fails:
   - Send the errors back to the LLM: "Your code had these issues: [errors]. Fix them."
   - Retry up to 2 more times
   - If all retries fail, fall back to a template (CoursePromoTemplate or FeatureExplainerTemplate)

7. Return the validated code string
8. Store the code in the videoJob record

Create `convex/videosPipeline/codeValidator.ts` as a separate utility with:
- validateSyntax(code: string): { valid: boolean; errors: string[] }
- validateSecurity(code: string): { safe: boolean; violations: string[] }
- validateStructure(code: string): { valid: boolean; errors: string[] }
```

## Prompt 3.2 — Build the Dynamic Video Shell

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 8 (Remotion Integration), specifically the DynamicVideo shell component.

Your task: Build the Remotion composition that can execute LLM-generated code at render time.

Create `remotion/DynamicVideo.tsx`:

1. This component receives inputProps:
   - generatedCode: string (the React/TSX code from the LLM)
   - images: string[] (image URLs)
   - audioUrl: string | null
   - duration: number (total frames)
   - width: number
   - height: number

2. It dynamically creates a React component from the generated code string:
   - The generated code can access: React, all Remotion exports, all component library exports
   - Images and audioUrl are passed as props to the generated component
   - Use new Function() to create the component (this runs in Lambda sandbox)

3. Register it in Root.tsx as a composition that accepts inputProps with calculateMetadata for dynamic duration

4. Handle errors gracefully — if the generated code crashes at render time, show a fallback error frame (black screen with "Render Error" text) instead of crashing the entire render

IMPORTANT: The generated code from the LLM will be structured as:
```
(React, Remotion, Components, images, audioUrl) => {
  const { AbsoluteFill, Sequence, useCurrentFrame, ... } = Remotion;
  const { FadeUp, CenterScene, ... } = Components;
  
  const MyVideo = () => { ... };
  return MyVideo;
}
```

The DynamicVideo shell calls this function and renders the returned component.

Test this by creating a simple hardcoded test:
```typescript
const testCode = `
  // ... simple test composition code
`;
```
And rendering: npx remotion render remotion/index.ts DynamicVideo out/test-dynamic.mp4 --props='{"generatedCode":"...","images":[],"audioUrl":null,"duration":150,"width":1080,"height":1920}'
```

## Prompt 3.3 — Build the Renderer

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 9 (Rendering Infrastructure).

Your task: Build the rendering step that takes generated code and produces an MP4.

We'll start with server-side rendering using @remotion/renderer (Option B from the design doc) since it doesn't require AWS setup. We can migrate to Lambda later.

1. Install @remotion/renderer:
   npm i --save-exact @remotion/renderer@4.0.332

2. Create `convex/videosPipeline/renderVideo.ts`:
   - This is an internalAction with "use node"
   - It receives: generatedCode, imageUrls, audioUrl, duration, aspectRatio
   - It calls @remotion/renderer to:
     a. Bundle the Remotion project
     b. Render the DynamicVideo composition with inputProps
     c. Save the MP4 to a temp file
     d. Upload the MP4 to Convex file storage
     e. Return the storage ID
   - Update job progress during rendering (use the onProgress callback)

3. Handle the rendering environment:
   - @remotion/renderer needs Chrome/Chromium
   - For local dev: it auto-downloads Chrome headless (we already have it from the prototyping session)
   - For production: we'll add Lambda later

4. Create `convex/videosPipeline/postProcess.ts`:
   - Extract a thumbnail (render a still at ~30% through the video)
   - Generate SRT subtitles from the word timestamps
   - Generate a social media caption using the script content
   - Store all artifacts

5. Wire both into the pipeline orchestrator — replace the stubs from Prompt 2.5 with real calls to generateCode → renderVideo → postProcess

After this prompt, the full pipeline should work end-to-end:
   Prompt → Context → Script → Images → Voice → Code → Render → MP4

Test by creating a video job via the Convex dashboard or a test script.
```

---

# PHASE 4: DASHBOARD UI + POLISH

## Prompt 4.1 — Build the Video Studio Page

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 13 (User Experience Flow).

Your task: Build the "Video Studio" page in the creator dashboard.

Look at the existing creator dashboard structure:
- app/(dashboard)/ for the route group
- The sidebar navigation component
- Existing page patterns (how other dashboard pages are structured)

Create the Video Studio page:

1. Add a route at `app/(dashboard)/store/[storeId]/videos/page.tsx`

2. The page should have:
   a. A prompt input area at the top:
      - Large textarea: "Describe the video you want to create..."
      - Quick select: dropdown to choose a course or product from their store
      - Style selector: "Educational" | "Hype" | "Cinematic" | "Minimalist"
      - Duration selector: 15s | 30s | 60s | 90s
      - Aspect ratio: 9:16 | 16:9 | 1:1
      - Voice toggle: on/off (with voice selector if on)
      - "Generate Video" button

   b. Recent videos grid below:
      - Thumbnail, title, duration, date, status
      - Click to view/download/iterate

3. Use existing UI components from components/ui/ (shadcn):
   - Card, Button, Input, Textarea, Select, Badge, Progress
   - Follow the dark mode patterns: bg-white dark:bg-black for cards/dropdowns

4. Use Convex queries for data:
   - useQuery(api.videos.getVideoLibrary) for the grid
   - useMutation(api.videos.generate) for the submit button

5. Add a link to Video Studio in the creator sidebar navigation

Follow the existing dashboard page patterns exactly — look at how other pages handle loading states, empty states, and the layout wrapper.
```

## Prompt 4.2 — Build the Generation Progress UI

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 13 (Generation Progress UI mockup).

Your task: Build the real-time progress UI that shows while a video is generating.

Create `app/(dashboard)/store/[storeId]/videos/[jobId]/page.tsx`:

1. This page shows when a video is being generated (user is redirected here after clicking Generate)

2. Use Convex's real-time query to poll job progress:
   ```
   const job = useQuery(api.videos.getProgress, { jobId });
   ```

3. Show a step-by-step progress indicator:
   - ✅ Gathering course data (with time taken)
   - ✅ Writing script (with scene count)
   - ✅ Generating images (with count)
   - ✅ Generating voiceover
   - ✅ Writing video composition
   - 🔄 Rendering video... (with progress bar and frame count)
   - Estimated time remaining

4. When status === "completed":
   - Show the video player (use a basic HTML5 <video> tag with the Convex storage URL)
   - Show the script below the video (collapsible)
   - Show action buttons: Download MP4, Download with Subtitles, Copy Caption
   - Show an iteration input: "Refine: [text input] [Regenerate button]"

5. When status === "failed":
   - Show the error message
   - Show a "Retry" button
   - Show a "Try with Template" fallback button

6. Use framer-motion for smooth transitions between steps (already installed in the project)

7. The progress should update in real-time without page refresh (Convex real-time queries handle this)
```

## Prompt 4.3 — Add @remotion/player for In-Browser Preview

```
Install @remotion/player if not already installed:
npm i --save-exact @remotion/player@4.0.332

Your task: Add an in-browser video preview to the Video Studio.

1. Create `components/video/VideoPreview.tsx`:
   - Uses @remotion/player's <Player> component
   - Accepts the same inputProps as the DynamicVideo composition
   - Shows a playable preview of the generated video IN THE BROWSER (no render needed)
   - Include play/pause controls, timeline scrubber, fullscreen

2. Update the video job detail page to show the Player preview IMMEDIATELY after code generation completes (before the full MP4 render finishes):
   - After step "generating_code" completes, the generatedCode is available
   - Show the <Player> with the generated code as a live preview
   - The MP4 render continues in the background
   - When the MP4 is ready, swap to the <video> tag with download option

3. This means creators see their video INSTANTLY after code generation (~25s) instead of waiting for the full render (~60s total)

Note: The @remotion/player runs the composition in the browser using React — no server rendering needed for preview. The full MP4 render is only needed for download/sharing.

IMPORTANT: The Player component must be in a "use client" component since it uses browser APIs.
```

## Prompt 4.4 — Iteration and Refinement

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, the iteration sections.

Your task: Build the video iteration system so creators can refine their videos.

1. Update the video detail page to include an iteration chat:
   - Text input: "Make the hook more aggressive" / "Add the enrollment count" / "Change colors to blue"
   - When submitted, calls api.videos.iterate with the feedback
   - Creates a new job linked to the parent (parentJobId)
   - Shows the new generation progress

2. Update `convex/videosPipeline/generateCode.ts` to handle iterations:
   - When parentJobId exists, include the PREVIOUS generated code in the prompt
   - Tell the LLM: "Here is the previous version of the video. The creator wants these changes: [feedback]. Modify the composition accordingly. Keep everything else the same."
   - This is much faster than generating from scratch since the LLM just diffs

3. Update the video detail page to show version history:
   - "Version 1 (original)" / "Version 2 (made hook shorter)" / "Version 3 (added price)"
   - Click any version to preview/download it
   - Each version links to its parent

4. The iteration flow should feel like a chat:
   - Generate → Preview → "Make it faster" → Re-generate → Preview → "Perfect, download"
   - Each iteration should take ~30-45s (skips image/voice generation, only regenerates code)
```

## Prompt 4.5 — Social Media Integration

```
Your task: Add the ability to download videos with captions and schedule posts.

1. Create `components/video/VideoExport.tsx` with export options:
   - Download MP4 (raw video)
   - Download MP4 + burned-in subtitles (use Remotion's subtitle overlay during render)
   - Copy caption to clipboard (pre-formatted for Instagram/TikTok)
   - Copy hashtags to clipboard

2. Add caption generation to the post-processing step:
   - Use Claude Opus 4.6 via OpenRouter to generate platform-specific captions
   - Instagram: longer caption with 15-20 hashtags, line breaks, call-to-action
   - TikTok: shorter, more casual, trending hashtag focus
   - Twitter/X: under 280 chars, punchy, link at end
   - Store all 3 variants in the videoLibrary record

3. Add a "Schedule Post" feature (UI only for now — actual posting can be Phase 5):
   - Date/time picker
   - Platform multi-select (Instagram, TikTok, YouTube Shorts, Twitter)
   - Preview of how the post will look on each platform
   - Store the scheduled post in a new `scheduledPosts` table

This connects to PPR's existing social media management features (the content calendar and post composer already exist in the codebase — check app/(dashboard)/store/[storeId]/social/).
```

---

# PHASE 5: PRODUCTION HARDENING (Optional Advanced Prompts)

## Prompt 5.1 — Migrate to Remotion Lambda

```
Read the design document at .docs/2026-02-february/LLM_VIDEO_GENERATION_SYSTEM_DESIGN.md, Section 9 (Rendering Infrastructure, Option A).

Your task: Migrate from @remotion/renderer (local) to @remotion/lambda (AWS) for production rendering.

1. Install: npm i --save-exact @remotion/lambda@4.0.332
2. Create `remotion/lambda/deploy.ts` — script to deploy the Lambda function
3. Create `remotion/lambda/render.ts` — script to trigger a render on Lambda
4. Update `convex/videosPipeline/renderVideo.ts` to use renderMediaOnLambda instead of renderMedia
5. Add AWS credentials to env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REMOTION_S3_BUCKET
6. Add a render mode toggle: local (dev) vs lambda (production) based on environment

This should make renders 3-5x faster (10-30s vs 60-90s).
```

## Prompt 5.2 — Usage Tracking + Rate Limiting

```
Your task: Add usage tracking and rate limiting for the video generation feature.

1. Track video renders per creator per month in a new `videoUsage` table
2. Enforce limits based on the creator's plan tier:
   - Free: 2 videos/month
   - Starter: 5 videos/month
   - Creator: 20 videos/month
   - Creator Pro: 100 videos/month
   - Business: Unlimited
3. Show remaining quota in the Video Studio UI
4. Use @convex-dev/rate-limiter (already installed) for burst protection

Check the existing plan/subscription system in the codebase to understand how tiers are stored and checked.
```

## Prompt 5.3 — Analytics + Feedback Loop

```
Your task: Build analytics for generated videos and a feedback loop for improving generation quality.

1. Track in videoLibrary:
   - Views (when video is played in preview)
   - Downloads (when MP4 is downloaded)
   - Shares (when caption is copied or scheduled)
   - Iterations (how many refinements before creator was satisfied)

2. Create an admin dashboard section showing:
   - Total videos generated (daily/weekly/monthly)
   - Average generation time per step
   - Most common failure points
   - Most iterated scenes (what do creators change most?)
   - Top-performing video structures (which scripts/layouts get most downloads)

3. Build the feedback loop:
   - When a creator downloads a video (signals satisfaction), store the generatedCode + script as a "good example"
   - When a creator iterates 3+ times, flag the original script for review
   - Periodically update the few-shot examples in the code generation prompt with top-performing compositions
```

---

# APPENDIX: QUICK REFERENCE

## Environment Variables Needed

```bash
# Add to .env.local
OPENROUTER_API_KEY=sk-or-v1-...          # Claude Opus 4.6 access
FAL_KEY=...                               # Fal.ai image generation
ELEVEN_LABS_API_KEY=...                   # ElevenLabs TTS (may already exist)

# For Phase 5 (Lambda)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
REMOTION_S3_BUCKET=ppr-video-renders
```

## Test Commands

```bash
# List all compositions
npx remotion compositions remotion/index.ts

# Preview in browser
npx remotion studio remotion/index.ts

# Render a specific composition
npx remotion render remotion/index.ts CompositionId out/test.mp4

# Render with props
npx remotion render remotion/index.ts DynamicVideo out/test.mp4 --props='{"generatedCode":"...","images":[]}'

# Run Convex dev
npx convex dev

# Deploy Convex
npx convex deploy
```

## Estimated Build Timeline

| Phase | Prompts | Duration | Milestone |
|-------|---------|----------|-----------|
| Phase 1 | 1.1–1.4 | 2-3 days | Component library + templates + schema + basic API |
| Phase 2 | 2.1–2.5 | 3-4 days | AI script + images + voice pipeline working |
| Phase 3 | 3.1–3.3 | 3-4 days | Full LLM code generation + rendering |
| Phase 4 | 4.1–4.5 | 3-5 days | Dashboard UI + preview + iteration + export |
| Phase 5 | 5.1–5.3 | 2-3 days | Lambda + rate limiting + analytics |
| **Total** | **18 prompts** | **~2-3 weeks** | **Production-ready video generation** |

---

*Each prompt is self-contained and builds on the previous ones. Run them in order. Test after each one.*
