# REMOTION SOCIAL VIDEO WORKFLOW

## Purpose

This document is the source of truth for creating short-form Remotion social videos from `SOCIAL_MEDIA_POSTS_FINAL.md` using the prompt in `REMOTION_VIDEO_PROMPT.md`.

It covers:

- The end-to-end workflow
- When to stop and switch models
- Which files get created
- How voiceover generation fits into the process
- How to avoid audio overlap and timing drift
- Common failure modes and fixes

This was written after building the Beat Lease System social video and fixing real issues in the workflow.

## Core Principle

The workflow has 2 separate phases:

1. Creative planning
2. Deterministic implementation

Do not mix them.

The approved Scene Script is the contract between those phases. Once the Scene Script is approved, the generated code should implement it exactly. If the script changes later, update the script first, then regenerate or revise code from that updated script.

## Canonical Inputs

Always start from these files:

- `REMOTION_VIDEO_PROMPT.md`
- `SOCIAL_MEDIA_POSTS_FINAL.md`
- `remotion/compositions/social/DMStrategyVideo.tsx`
- `remotion/compositions/social/dmStrategyVoiceover.ts`
- `remotion/generate-dm-strategy-voiceover.ts`
- `remotion/Root.tsx`
- `remotion/theme.ts`

Use the DM Strategy files as the canonical technical template unless there is a strong reason not to.

## Output Files Per Video

For each new social video, create exactly these files:

1. `remotion/compositions/social/[featureName]Voiceover.ts`
2. `remotion/compositions/social/[FeatureName]Video.tsx`
3. `remotion/generate-[feature-name]-voiceover.ts`

Also update:

- `remotion/Root.tsx`

Optional generated assets:

- `public/voiceover/[feature-name]-video/scene-01-hook.mp3`
- `public/voiceover/[feature-name]-video/scene-02-problem.mp3`
- `public/voiceover/[feature-name]-video/scene-03-solution.mp3`
- `public/voiceover/[feature-name]-video/scene-04-proof.mp3`
- `public/voiceover/[feature-name]-video/scene-05-cta.mp3`

## Recommended Model Workflow

### Use Gemini 3.1 when:

- You want the initial Scene Script
- You want the first draft of the full 3-file code generation
- The task is more generative than surgical
- You are translating a long prompt into a complete implementation

### Use Sonnet 4.6 when:

- You are debugging a broken composition
- You are fixing timing mismatches
- You are adjusting animation sequencing against real audio
- You need precise edits in an already-generated file
- You are troubleshooting imports, registration, or environment issues

### Recommended handoff point

If you want Gemini 3.1 to write the code, the cleanest handoff is:

1. Use the current model to explore and pick the post
2. Generate and approve the Scene Script
3. Stop
4. Switch to Gemini 3.1
5. Paste the approved Scene Script and ask for Step 3 code generation only

This avoids model drift and keeps one approved script as the source of truth.

### Do not switch models mid-implementation unless:

- The Scene Script is already approved
- You are carrying over the exact approved script
- You are not asking the new model to reinterpret the concept

If you switch models after code has already been generated, treat the existing files as the source of truth and ask only for fixes, not a full re-imagination.

## Full Workflow

## Step 1: Pick the source post

Open `SOCIAL_MEDIA_POSTS_FINAL.md` and choose a thread that has:

- A strong emotional hook
- A clear problem-solution arc
- Specific visualizable elements
- A CTA keyword that works well on screen

Good candidates usually include:

- Numbers
- Tiers
- Before/after structures
- Process flows
- Pain that can be visualized

The Beat Lease System worked well because it had:

- A painful opening
- A clear 4-tier structure
- Revenue proof
- A simple CTA keyword: `BEATS`

## Step 2: Load the template context

Before writing any code, read the files listed in `REMOTION_VIDEO_PROMPT.md`.

This matters because the prompt assumes:

- Existing theme colors in `remotion/theme.ts`
- Existing shared components
- A known composition structure
- A known timing and voiceover file format

If you skip context loading, the generated code will usually drift away from the existing Remotion architecture.

## Step 3: Create the Scene Script first

Do not generate code yet.

Produce a full Scene Script with:

- Video Brief
- 5 Scene Cards
- Purpose per scene
- Duration per scene
- Tint color per scene
- Visual layout
- Voiceover text
- Timing notes

The Scene Script should answer all creative questions before any implementation begins.

### Approval rule

Do not proceed to code until the Scene Script is explicitly approved.

This is the most important checkpoint in the workflow.

## Step 4: Generate the code from the approved script

After approval, generate:

1. Voiceover metadata file
2. Remotion composition file
3. ElevenLabs voiceover generation script
4. `Root.tsx` additions

### Implementation rules

- Keep `NoiseOverlay`, `SceneShell`, and `GlassCard` local in the composition file
- Use `TransitionSeries`
- Use `premountFor={1 * fps}` on every scene
- Use `fade` and `slide` transitions following the canonical pattern
- Keep all spring interpolations clamped on both sides
- Make the CTA scene structure consistent across videos

## Step 5: Register the composition

Add both compositions to `remotion/Root.tsx`:

- voiced version
- silent version

Recommended pattern:

- `[FeatureName]Video`
- `[FeatureName]VideoSilent`

Use the timeline helper from the corresponding voiceover file to set `durationInFrames`.

## Step 6: Generate the voiceover

Run the generator script:

```bash
npx ts-node remotion/generate-[feature-name]-voiceover.ts
```

The generator script should:

- Load `.env`
- Read `ELEVENLABS_API_KEY`
- Read preferred voice settings
- Generate one MP3 per scene
- Write them to `public/voiceover/[composition-id]/`

### Environment note

If the script says `ELEVENLABS_API_KEY is required`, it usually means the script did not load `.env`.

The fix is to ensure the generator script loads dotenv near the top:

```ts
import * as dotenv from "dotenv";

dotenv.config();
```

## Step 7: Preview the video in Remotion Studio

Run:

```bash
npm run remotion:studio
```

Check both:

- `[FeatureName]Video`
- `[FeatureName]VideoSilent`

The silent version is useful for validating visual pacing without voiceover clutter.

## Step 8: Validate audio duration against scene timing

This step is mandatory.

Do not trust estimated reading times from the prompt alone.

AI-written voiceover often runs much longer than the prompt budget suggests, especially with ElevenLabs natural pacing.

### What went wrong in the Beat Lease build

The initial scene durations were based on prompt estimates:

- Hook: `5.0s`
- Problem: `10.2s`
- Solution: `9.2s`
- Proof: `11.4s`
- CTA: `7.6s`

But the actual generated audio files were much longer:

- Hook: about `8.96s`
- Problem: about `36.13s`
- Solution: about `28.24s`
- Proof: about `30.22s`
- CTA: about `12.12s`

That caused severe overlap because the next scene's audio started before the previous scene had finished.

### How to measure real audio durations on macOS

```bash
for file in public/voiceover/[composition-id]/*.mp3; do
  echo "$file:"
  afinfo "$file" | grep "estimated duration"
done
```

### What to do after measuring

Update `remotion/compositions/social/[featureName]Voiceover.ts` so `sceneSeconds` matches or slightly exceeds the actual audio duration.

Add a small safety buffer:

- `+0.3s` to `+1.0s` for short clips
- `+0.5s` to `+1.5s` for longer clips

Example from Beat Lease:

```ts
export const beatLeaseSceneSeconds = {
  hook: 9.5,
  problem: 37.0,
  solution: 29.0,
  proof: 31.0,
  cta: 13.0,
} as const;
```

## Step 9: Re-time the animation beats

After updating scene durations, the visuals must also be re-timed.

If you only lengthen the scene durations but keep the original animation delays, the visuals will all happen too early and the scene will feel dead for the remaining audio.

### Re-timing rule

Move the visual reveals so they land on the voiceover beats, not just in the first 2 seconds.

Examples:

- Delay the second and third hook reveals if the audio is longer
- Stagger problem rows across the full spoken explanation
- Spread solution tier cards across the part where each tier is spoken
- Delay proof stats and result card to match the spoken revenue examples
- Delay CTA text and button so the keyword lands with the spoken ask

## Step 10: Re-preview and iterate

After updating durations and animation timing:

1. Refresh Remotion Studio
2. Re-watch the full voiced composition
3. Check that no scene audio overlaps
4. Check that visual reveals align with spoken beats
5. Check that transitions do not interrupt speech awkwardly

Repeat until:

- No overlap exists
- No long dead air exists visually
- Each scene feels paced to the voiceover

## Commands Checklist

### Generate voiceover

```bash
npx ts-node remotion/generate-[feature-name]-voiceover.ts
```

### Open Remotion Studio

```bash
npm run remotion:studio
```

### Inspect actual MP3 durations on macOS

```bash
for file in public/voiceover/[composition-id]/*.mp3; do
  echo "$file:"
  afinfo "$file" | grep "estimated duration"
done
```

## Naming Rules

- Component file: PascalCase
- Voiceover metadata file: camelCase prefix
- Generator script: kebab-case
- Composition id: kebab-case

Example:

- `BeatLeaseVideo.tsx`
- `beatLeaseVoiceover.ts`
- `generate-beat-lease-voiceover.ts`
- `beat-lease-video`

## Quality Checklist Before Marking Complete

### Creative checklist

- The Scene Script is approved
- Each scene has a distinct visual layout
- The CTA keyword is explicit
- Scene 4 ends with a green result/outcome card

### Technical checklist

- All required files were created
- `Root.tsx` includes voiced and silent compositions
- The generator script loads `.env`
- Voiceover files were generated successfully
- Actual MP3 durations were measured
- `sceneSeconds` matches real audio, not estimated reading time
- Animation delays were re-timed after audio generation
- No audio overlaps remain in preview

## Common Failure Modes

### 1. Audio overlap between scenes

Cause:

- Scene durations are shorter than the generated MP3 files

Fix:

- Measure real MP3 durations
- Update `sceneSeconds`
- Re-time animations

### 2. `ELEVENLABS_API_KEY is required`

Cause:

- The script is not loading `.env`

Fix:

- Import and run `dotenv.config()`

### 3. Visuals finish too early but audio keeps going

Cause:

- Scene duration was extended, but the spring delays were not

Fix:

- Re-sequence the reveal timings to follow the spoken beats

### 4. New video does not appear in Remotion Studio

Cause:

- `remotion/Root.tsx` was not updated correctly

Fix:

- Add import
- Add timeline constant
- Add voiced composition
- Add silent composition

### 5. Creative drift after switching models

Cause:

- A second model regenerated the concept instead of implementing the approved script

Fix:

- Keep the Scene Script frozen
- Ask the next model to implement or fix only
- Do not ask for a fresh concept pass unless you intentionally want to restart

## Recommended Future Improvement

The current prompt should be updated so that duration planning is based on actual generated TTS duration instead of estimated reading time.

Best future-state workflow:

1. Approve Scene Script text first
2. Generate voiceover immediately
3. Measure real MP3 durations
4. Lock `sceneSeconds`
5. Generate or adjust animation timing from those real durations

This will reduce rework and make the pipeline much more reliable.

## Beat Lease Reference Implementation

The Beat Lease social video is the working example of this workflow:

- `remotion/compositions/social/beatLeaseVoiceover.ts`
- `remotion/compositions/social/BeatLeaseVideo.tsx`
- `remotion/generate-beat-lease-voiceover.ts`

Use it as the next-best reference after DM Strategy, especially for:

- post-generation duration correction
- dotenv loading in generator scripts
- longer spoken scenes with re-timed animation beats
