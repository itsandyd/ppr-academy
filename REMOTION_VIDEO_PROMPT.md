# Remotion Social Media Video Generator Prompt

> **How to use:**
> 1. Paste the target post from `SOCIAL_MEDIA_POSTS_FINAL.md` at the bottom under **TARGET POST**
> 2. The AI will first produce a **Scene Script** — a complete written description of all 5 scenes
> 3. You review and approve the Scene Script before any code is written
> 4. The AI then generates all 3 code files + Root.tsx additions from the approved script

---

## STEP 1: CONTEXT LOADING

Before doing anything, read these files in order:

1. `remotion/theme.ts` — color palette (`C`) and font constant (`F`)
2. `remotion/components/index.ts` — all shared component exports
3. `remotion/components/Background.tsx` — `BG`, `GlowOrb`, `GridPattern`, `ScanLine`
4. `remotion/components/Cards.tsx` — `FeatureCard`, `StepRow`, `ReasonCard`, `TierCard`
5. `remotion/components/Stats.tsx` — `StatCounter`, `StatBlock`, `StatBig`
6. `remotion/components/Animations.tsx` — `FadeUp`, `useExit`
7. `remotion/components/Typography.tsx` — `GradientText`, `SectionLabel`
8. `remotion/components/CTA.tsx` — `CTAButton`, `LogoIcon`
9. `remotion/components/Connectors.tsx` — `ConnectorLine`
10. `remotion/compositions/social/DMStrategyVideo.tsx` — **canonical composition template**
11. `remotion/compositions/social/dmStrategyVoiceover.ts` — **canonical voiceover/timing template**
12. `remotion/generate-dm-strategy-voiceover.ts` — **canonical ElevenLabs generation script**
13. `remotion/Root.tsx` — composition registration pattern

---

## STEP 2: PRODUCE THE SCENE SCRIPT (DO THIS FIRST — NO CODE YET)

Before writing a single line of code, output a complete **Scene Script** document using the template below. This script is the creative blueprint. The code in Step 3 must match it exactly.

The Scene Script has two parts:

### Part A: Video Brief

```
VIDEO TITLE: [FeatureName] — Social Media Video
COMPOSITION ID: [feature-name-video]
OVERARCHING THEME: [1–2 sentence description of the video's emotional arc and visual style]
  Example: "A dark, high-energy product demo. Opens with a provocative claim about lost money,
  moves through the chaos of manual work, then reveals automation as the clean fix.
  Ends with a confident, minimal CTA. Tint palette runs orange → red → indigo → purple → orange."
TOTAL RUNTIME: ~[X]s ([sum of scene seconds minus 4 transitions × 0.4s])
CTA KEYWORD: [the trigger word from the CTA tweet, e.g. "PPR", "LINK", "BEATS"]
```

### Part B: Scene Cards (one per scene)

Write all 5 using this exact format:

---

```
SCENE [N]: [SCENE NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE:
  [One sentence: what this scene must make the viewer think or feel]

DURATION: [X.X]s
TINT COLOR: C.[color]
TRANSITION IN: [fade / slide from-bottom / slide from-right / none (first scene)]

─── VISUAL LAYOUT ────────────────────────────────

BACKGROUND:
  [Describe the SceneShell: which tint color is passed, noise overlay seed name]

ON SCREEN ELEMENTS (top to bottom):
  1. [Element name]: [What it shows] — [Component used or "custom inline"]
     Animation: [Describe the entrance: spring config, delay, motion direction]

  2. [Element name]: [What it shows] — [Component: GlassCard / StatBlock / StepRow / etc.]
     Animation: [spring config + delay]

  3. [Element name]: [What it shows]
     Animation: [...]

  [Continue for all visible elements in the scene]

KEY MOTION MOMENT:
  [Describe the most visually interesting animation beat in this scene.
   E.g.: "At 4.5s, the animated path draws from the trigger card down to the DM card,
   with a glowing cyan arrow tip following the path."]

─── VOICEOVER ────────────────────────────────────

VOICEOVER TEXT:
  "[Full voiceover script for this scene. Written for the ear — natural spoken language,
   contractions, no bullet points or tweet formatting. Should fit within the scene duration.]"

WORD COUNT: ~[N] words
READING TIME: ~[X.X]s at natural speaking pace (~120 wpm)

─── TIMING NOTES ─────────────────────────────────

  [Describe which visual element should appear at roughly what point in the scene,
   so the animation sequence matches the voiceover beats]
  - 0.0s: [First element appears]
  - [X.X]s: [Second element appears]
  - [X.X]s: [Key motion moment / climax element]
  - [X.X]s: Scene ends / transition begins
```

---

## SCENE CONTENT GUIDE

Use this to decide what goes in each scene:

### Scene 1 — Hook (tint: `C.orange`)
**Source:** Hook tweet + first line of Feature Description
**Goal:** Grab attention in under 2 seconds. One bold claim. Minimal words.
**Visual approach:** Giant headline (80–96px, fontWeight 900) + `<GradientText>` on the key phrase + one `<GlassCard>` with a punchy sub-statement
**Voiceover:** Strip to its emotional core. ~50–60 words. Opens mid-sentence if possible.

### Scene 2 — Problem (tint: `C.red`)
**Source:** Problem tweets (tweet 2–3 in the thread)
**Goal:** Make the viewer feel the pain physically. Show the *old broken way*.
**Visual approach — pick ONE based on content:**
- **Time wasted:** Animated clock + counter ticking from "1h" to "24h later"
- **Money lost / missed sale:** Comment bubbles popping up then greying out + fading
- **Chaos / scattered tools:** Multiple GlassCards appearing then becoming grayscale
- **Manual repetition:** Stacked step list showing the exhausting manual process
**Voiceover:** Name the exact pain. Use "you" language. ~100–120 words.

### Scene 3 — Solution (tint: `C.primary` indigo)
**Source:** Solution tweets (tweets 3–4)
**Goal:** Reveal the PPR feature as the clean fix. Show the *mechanism*, not just the name.
**Visual approach — pick ONE based on content:**
- **Automation flow:** 3-card left-to-right or top-to-bottom flow with `<FlowArrow>` SVGs
- **Feature steps:** Staggered `<StepRow>` list showing the sequence
- **Pricing tiers:** Column of `<TierCard>` components
- **Before/after:** Split GlassCards (old way vs. new way)
**Voiceover:** Explain the mechanism clearly. Use "here's how it works" language. ~90–110 words.

### Scene 4 — Proof (tint: `C.purple`)
**Source:** Proof/results tweets (tweet 4–5)
**Goal:** Show the concrete outcome. Numbers, stats, or the workflow in motion.
**Visual approach — pick ONE based on content:**
- **Stats:** 2–4 `<StatBlock>` or `<StatBig>` components with animated gradient numbers
- **Live workflow:** SVG path animation connecting steps with `evolvePath` + moving arrow tip
- **Results list:** Staggered GlassCards building to a green "OUTCOME" card
**Always end with:** A green (`C.green`) result card (e.g., "34% completion rate", "Sale: $50")
**Voiceover:** Lead with the number. Make it feel earned. ~110–130 words.

### Scene 5 — CTA (tint: `C.orange`)
**Source:** CTA tweet — extract the trigger keyword
**Goal:** One action, one keyword, one URL. Confidence, not desperation.
**Visual layout (always this structure):**
1. Three brand icons (PauseIcon, PlayIcon, RepeatIcon) staggered at 0.12s / 0.35s / 0.58s
2. Giant headline: "Comment **[KEYWORD]**" — keyword in `<GradientText from={C.orange} to={C.red}>`
3. Sub-text: "I'll DM you the link to check it out."
4. `<CTAButton gradientFrom={C.orange} gradientTo={C.red}>pauseplayrepeat.com</CTAButton>`
**Voiceover:** Direct, warm, confident. Repeat the keyword twice. ~60–80 words.

---

## VOICEOVER WRITING RULES

All voiceover text must be **natural spoken language**. Never copy tweet text directly.

| Rule | Bad (tweet) | Good (voiceover) |
|------|------------|-----------------|
| No list formatting | "- 5K streams\n- WAV files\n- Stems" | "You get five thousand streams, WAV files, and stems included." |
| No tweet numbering | "2/ The problem is..." | "Here's the thing about the problem..." |
| Use contractions | "You are losing money" | "You're losing money every week." |
| Connect ideas | "No distribution limits. No streaming caps." | "No distribution limits, no streaming caps — nothing protecting your work." |
| Name the viewer | Generic | "If you're selling beats right now..." |
| Repeat the keyword in CTA | "Comment PPR" once | "Comment PPR below — just the letters P, P, R — and I'll DM you the link." |

**Word count budget per scene (at ~120 wpm natural pace):**
- Hook: 5s → 50–60 words
- Problem: 10s → 100–120 words
- Solution: 9s → 90–110 words
- Proof: 11s → 110–130 words
- CTA: 7.5s → 75–90 words

---

## STEP 3: GENERATE CODE (ONLY AFTER SCENE SCRIPT IS APPROVED)

Once the Scene Script is confirmed, generate exactly **3 files** + Root.tsx additions.

### File 1: `remotion/compositions/social/[featureName]Voiceover.ts`

Model exactly on `dmStrategyVoiceover.ts`. The voiceover text must match the approved Scene Script word-for-word.

```typescript
export const [FEATURE]_VOICEOVER_COMPOSITION_ID = "[feature-name]-video";
export const [FEATURE]_TRANSITION_SECONDS = 0.4;

export const [feature]SceneSeconds = {
  hook: [X.X],     // from Scene Script scene durations
  problem: [X.X],
  solution: [X.X],
  proof: [X.X],
  cta: [X.X],
} as const;

export const [feature]VoiceoverScenes = [
  { id: "scene-01-hook", text: "[exact voiceover from Scene Script]" },
  { id: "scene-02-problem", text: "[exact voiceover from Scene Script]" },
  { id: "scene-03-solution", text: "[exact voiceover from Scene Script]" },
  { id: "scene-04-proof", text: "[exact voiceover from Scene Script]" },
  { id: "scene-05-cta", text: "[exact voiceover from Scene Script]" },
] as const;

export const get[Feature]VoiceoverFiles = () =>
  [feature]VoiceoverScenes.map((scene) => {
    return `voiceover/${[FEATURE]_VOICEOVER_COMPOSITION_ID}/${scene.id}.mp3`;
  });

export const get[Feature]Timeline = (fps: number) => {
  const hook = Math.round([feature]SceneSeconds.hook * fps);
  const problem = Math.round([feature]SceneSeconds.problem * fps);
  const solution = Math.round([feature]SceneSeconds.solution * fps);
  const proof = Math.round([feature]SceneSeconds.proof * fps);
  const cta = Math.round([feature]SceneSeconds.cta * fps);
  const transition = Math.round([FEATURE]_TRANSITION_SECONDS * fps);
  return {
    hook, problem, solution, proof, cta, transition,
    total: hook + problem + solution + proof + cta - transition * 4,
  };
};
```

### File 2: `remotion/compositions/social/[FeatureName]Video.tsx`

Model exactly on `DMStrategyVideo.tsx`. The scenes must implement exactly what was described in the Scene Script.

**Required structure:**

```typescript
import React from "react";
import {
  AbsoluteFill, Audio, interpolate, Sequence,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { noise3D } from "@remotion/noise";            // for NoiseOverlay
// import { evolvePath, ... } from "@remotion/paths"; // only if Scene 4 uses path animation
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { C, F } from "../../theme";
import { CTAButton, GradientText, SectionLabel } from "../../components";
// Add any additional component imports actually used by the scenes:
// import { StatBlock, StatBig, StepRow, TierCard, FeatureCard, ConnectorLine, FadeUp } from "../../components";
```

**Always define these locally** (copy verbatim from `DMStrategyVideo.tsx` — they are NOT in the shared library):
- `NoiseOverlay` component
- `SceneShell` component
- `GlassCard` component

**TransitionSeries (mandatory pattern):**
```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={hookDuration} premountFor={1 * fps}>
    <Scene1_Hook />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionDuration })} />

  <TransitionSeries.Sequence durationInFrames={problemDuration} premountFor={1 * fps}>
    <Scene2_Problem />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: transitionDuration })} />

  <TransitionSeries.Sequence durationInFrames={solutionDuration} premountFor={1 * fps}>
    <Scene3_Solution />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: transitionDuration })} />

  <TransitionSeries.Sequence durationInFrames={proofDuration} premountFor={1 * fps}>
    <Scene4_Proof />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: transitionDuration })} />

  <TransitionSeries.Sequence durationInFrames={ctaDuration} premountFor={1 * fps}>
    <Scene5_CTA />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

**Animation conventions (all springs must use these patterns):**

Scale entry:
```typescript
const mySpring = spring({ fps, frame: frame - s(delay), config: { damping: 16, stiffness: 200 } });
// transform: `scale(${interpolate(mySpring, [0,1], [0.75,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp" })})`
// opacity: interpolate(mySpring, [0,1], [0,1], { extrapolateLeft:"clamp", extrapolateRight:"clamp" })
```

Title reveal (scale + Y):
```typescript
// transform: `scale(${interp(spring,[0,1],[1.18,1])}) translateY(${interp(spring,[0,1],[50,0])}px)`
```

Staggered list (0.3–0.5s between items):
```typescript
const item1 = spring({ fps, frame: frame - s(0.2), config: { damping: 18, stiffness: 190 } });
const item2 = spring({ fps, frame: frame - s(0.7), config: { damping: 18, stiffness: 190 } });
const item3 = spring({ fps, frame: frame - s(1.2), config: { damping: 18, stiffness: 190 } });
```

Animated counter (for stats):
```typescript
const count = interpolate(frame, [s(0.5), s(3.5)], [0, targetValue], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
// Display: Math.floor(count) + unit
```

SVG path draw (for workflow connections):
```typescript
import { evolvePath, getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
const pathProgress = interpolate(frame, [s(startSec), s(endSec)], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const { strokeDasharray, strokeDashoffset } = evolvePath(pathProgress, svgPath);
```

### File 3: `remotion/generate-[feature-name]-voiceover.ts`

Direct copy of `generate-dm-strategy-voiceover.ts` with only these two changes:
1. Import path: `from "./compositions/social/[featureName]Voiceover"`
2. Destructured names: `[FEATURE]_VOICEOVER_COMPOSITION_ID` and `[feature]VoiceoverScenes`

### Root.tsx additions

```typescript
// Imports (add with other social imports):
import { [FeatureName]Video } from "./compositions/social/[FeatureName]Video";
import { get[Feature]Timeline } from "./compositions/social/[featureName]Voiceover";

// Timeline constant (add with other timeline constants near top of RemotionRoot):
const [featureName]60Timeline = get[Feature]Timeline(60);

// Compositions (add in the social/content section):
<Composition
  id="[FeatureName]Video"
  component={[FeatureName]Video}
  durationInFrames={[featureName]60Timeline.total}
  fps={60}
  width={1080}
  height={1920}
  defaultProps={{ enableVoiceover: true }}
/>
<Composition
  id="[FeatureName]VideoSilent"
  component={[FeatureName]Video}
  durationInFrames={[featureName]60Timeline.total}
  fps={60}
  width={1080}
  height={1920}
  defaultProps={{ enableVoiceover: false }}
/>
```

---

## NAMING CONVENTIONS

| Feature name | Files | Component | Composition ID |
|-------------|-------|-----------|----------------|
| "Beat Lease System" | `BeatLeaseVideo.tsx` / `beatLeaseVoiceover.ts` / `generate-beat-lease-voiceover.ts` | `BeatLeaseVideo` | `"beat-lease-video"` |
| "Follow Gates" | `FollowGatesVideo.tsx` / `followGatesVoiceover.ts` / `generate-follow-gates-voiceover.ts` | `FollowGatesVideo` | `"follow-gates-video"` |
| "Email Workflow Builder" | `EmailWorkflowVideo.tsx` / `emailWorkflowVoiceover.ts` / `generate-email-workflow-voiceover.ts` | `EmailWorkflowVideo` | `"email-workflow-video"` |
| "AI Course Generator" | `AICourseVideo.tsx` / `aiCourseVoiceover.ts` / `generate-ai-course-voiceover.ts` | `AICourseVideo` | `"ai-course-video"` |
| "Subscription Tiers" | `SubscriptionTiersVideo.tsx` / `subscriptionTiersVoiceover.ts` / `generate-subscription-tiers-voiceover.ts` | `SubscriptionTiersVideo` | `"subscription-tiers-video"` |

Pattern: **PascalCase** for file/component, **camelCase** for voiceover file prefix, **kebab-case** for composition ID.

---

## FINAL QUALITY CHECKLIST

Before delivering the Scene Script (Step 2), verify:
- [ ] Video Brief includes overarching theme and emotional arc
- [ ] Each scene card has: purpose, duration, tint color, visual layout, voiceover text, timing notes
- [ ] No two scenes use the same visual layout (variety is mandatory)
- [ ] Voiceover word counts fit within scene durations
- [ ] CTA keyword appears explicitly in Scene 5 voiceover (ideally twice)
- [ ] Scene 4 always ends with a green result/outcome element

Before delivering the code (Step 3), verify:
- [ ] All 3 files generated + Root.tsx additions
- [ ] Scene implementations match the approved Scene Script exactly
- [ ] `SceneShell`, `GlassCard`, `NoiseOverlay` defined locally (not imported)
- [ ] All springs use `extrapolateLeft: "clamp"` + `extrapolateRight: "clamp"`
- [ ] `premountFor={1 * fps}` on every `TransitionSeries.Sequence`
- [ ] CTA scene ends with `<CTAButton>pauseplayrepeat.com</CTAButton>`
- [ ] Voiceover text in the `.ts` file matches the Scene Script word-for-word

---

## TARGET POST

> Paste the full post content from `SOCIAL_MEDIA_POSTS_FINAL.md` below. Include the **Feature Description**, all tweet copy (Hook through CTA), and the Visual suggestion line.

```
[PASTE POST HERE]
```

**Optional overrides:**
- CTA keyword: ___
- Specific visual elements to include: ___
- Specific visual elements to avoid: ___
- Scene duration adjustments: ___
