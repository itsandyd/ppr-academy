"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  validateAll,
  extractCode,
  validateSecurity,
} from "./codeValidator";

/**
 * Step 5: Generate Remotion composition code using Claude Opus 4.6 via OpenRouter.
 *
 * This is THE CORE of Approach B — the LLM writes actual React/Remotion code
 * that gets executed at render time.
 *
 * Input: script + image URLs + audio data + color palette
 * Output: validated TypeScript/React code string
 */
export const generateCode = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    scriptId: v.id("videoScripts"),
    imageUrls: v.array(v.string()),
    audioData: v.optional(
      v.object({
        audioUrl: v.string(),
        duration: v.number(),
        words: v.optional(
          v.array(
            v.object({
              word: v.string(),
              start: v.number(),
              end: v.number(),
            })
          )
        ),
      })
    ),
    aspectRatio: v.string(),
    targetDuration: v.number(),
    // Iteration support
    previousCode: v.optional(v.string()),
    iterationFeedback: v.optional(v.string()),
  },
  returns: v.object({
    code: v.string(),
    usedFallback: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY not configured. Add it to your Convex deployment settings."
      );
    }

    // Fetch the script
    const script = await ctx.runQuery(
      internal.videos.getScriptInternal,
      { scriptId: args.scriptId }
    );
    if (!script) {
      throw new Error(`Script ${args.scriptId} not found`);
    }

    const fps = 30;
    const totalFrames = args.targetDuration * fps;
    const dimensions = ASPECT_RATIO_DIMS[args.aspectRatio] || ASPECT_RATIO_DIMS["9:16"];

    const systemPrompt = buildSystemPrompt(dimensions, fps);
    let userPrompt = buildUserPrompt(
      script,
      args.imageUrls,
      args.audioData ?? null,
      totalFrames,
      fps,
      dimensions
    );

    // For iterations, include the previous code and feedback
    if (args.previousCode && args.iterationFeedback) {
      userPrompt += `\n\n## ITERATION — MODIFY PREVIOUS VERSION\n`;
      userPrompt += `The creator wants these changes: "${args.iterationFeedback}"\n\n`;
      userPrompt += `Here is the previous version of the video code. Modify it to apply the requested changes. Keep everything else the same.\n\n`;
      userPrompt += `\`\`\`\n${args.previousCode}\n\`\`\`\n`;
      userPrompt += `\nOutput the FULL modified code (not a diff). Apply ONLY the requested changes.`;
    }

    // Attempt code generation with retries
    const MAX_ATTEMPTS = 3;
    let lastErrors: string[] = [];

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const prompt =
          attempt === 0
            ? userPrompt
            : `${userPrompt}\n\n## IMPORTANT: Fix These Issues From Previous Attempt\nYour previous code had these validation errors:\n${lastErrors.map((e) => `- ${e}`).join("\n")}\n\nPlease fix ALL of these issues and output corrected code.`;

        console.log(
          `🧠 Code generation attempt ${attempt + 1}/${MAX_ATTEMPTS}`
        );

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://academy.pauseplayrepeat.com",
              "X-Title": "Pause Play Repeat Video Generator",
            },
            body: JSON.stringify({
              model: "anthropic/claude-opus-4.6",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              temperature: 0.3,
              max_tokens: 12000,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `OpenRouter API error (${response.status}): ${errorText}`
          );
        }

        const data: any = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error("No content in OpenRouter response");
        }

        // Extract code from potential markdown fences
        const code = extractCode(rawContent);

        // Validate
        const validation = validateAll(code);

        if (validation.valid) {
          console.log(
            `✅ Code generated and validated (${code.length} chars, attempt ${attempt + 1})`
          );

          // Store code on the job
          await ctx.runMutation(
            internal.videosPipeline.jobMutations.updateJobCode,
            { jobId: args.jobId, generatedCode: code }
          );

          return { code, usedFallback: false };
        }

        console.warn(
          `⚠️ Validation failed (attempt ${attempt + 1}):`,
          validation.errors
        );
        lastErrors = validation.errors;

        // If security violations, don't retry — it's suspicious
        const securityCheck = validateSecurity(code);
        if (!securityCheck.safe) {
          console.error("🚫 Security violations detected, skipping retries");
          break;
        }
      } catch (err: any) {
        console.error(
          `❌ Code generation attempt ${attempt + 1} failed:`,
          err.message
        );
        lastErrors = [err.message];
      }
    }

    // All attempts failed — use fallback template
    console.log("🔄 Falling back to template code");
    const fallbackCode = buildFallbackCode(
      script,
      args.imageUrls,
      args.audioData ?? null,
      totalFrames,
      fps,
      dimensions
    );

    await ctx.runMutation(
      internal.videosPipeline.jobMutations.updateJobCode,
      { jobId: args.jobId, generatedCode: fallbackCode }
    );

    return { code: fallbackCode, usedFallback: true };
  },
});

// ─── Constants ──────────────────────────────────────────────────────────────

const ASPECT_RATIO_DIMS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
};

// ─── System Prompt Builder ──────────────────────────────────────────────────

function buildSystemPrompt(
  dimensions: { width: number; height: number },
  fps: number
): string {
  return `You are a Remotion video composition code generator for Pause Play Repeat, a music production education platform.

## YOUR OUTPUT FORMAT

You must output ONLY a JavaScript function body (no markdown, no explanation, no \`\`\`).

The code will be executed as:
\`\`\`
new Function("React", "Remotion", "Components", "Theme", "images", "audioUrl", code)
\`\`\`

So your code receives these parameters and must RETURN a React component:

\`\`\`
const { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Audio } = Remotion;
const { CenterScene, Content, FadeUp, useExit, BG, CinematicBG, GlowOrb, GridPattern, ScanLine,
        FeatureCard, StepRow, ReasonCard, TierCard, StatCounter, StatBlock, StatBig,
        WaveformVisual, GradientText, SectionLabel, CTAButton, LogoIcon, ConnectorLine } = Components;
const { C, F } = Theme;

// ... define scene components ...

const MyVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={180}>...</Sequence>
      ...
    </AbsoluteFill>
  );
};

return MyVideo;
\`\`\`

## DESIGN SYSTEM RULES

1. **Layout**: All scenes use AbsoluteFill with flexbox centering
2. **Text hierarchy**:
   - Headline: 44-56px, fontWeight 900, fontFamily F
   - Subhead: 24-28px, fontWeight 500-600, fontFamily F
   - Body: 16-18px, fontWeight 400-500, fontFamily F
   - Label: 14-15px, fontWeight 700, letterSpacing 3-4, uppercase, fontFamily F
3. **Colors**: Use the provided palette. C object has: bg, primary, purple, deepPurple, pink, cyan, green, orange, red, gold, warmOrange, white, gray, darkGray
4. **Gradient text**: \`background: linear-gradient(135deg, color1, color2)\` + WebkitBackgroundClip: "text" + WebkitTextFillColor: "transparent"
5. **Animations**:
   - Entrances: Use \`<FadeUp delay={frameNumber}>\` for spring-animated fade+translate
   - Exits: Use \`useExit(exitStartFrame, exitEndFrame)\` which returns { op, y } for opacity and translateY
   - Custom springs: \`spring({ fps, frame: frame - delay, config: { damping: 50-70, stiffness: 150-200 } })\`
6. **Cards**: background \`\${C.darkGray}cc\`, border \`1px solid \${color}20\`, borderRadius 16-20
7. **Scene transitions**: Each scene's useExit should start ~20-25 frames before the Sequence ends
8. **Dimensions**: ${dimensions.width}x${dimensions.height} at ${fps}fps

## COMPONENT LIBRARY

### Layout
- **CenterScene**: Main scene wrapper. Props: \`{ children, opacity?, translateY?, seed?, tint?, orbColors?, padding? }\`. Includes BG with grid, orbs, scanline. Use for most scenes.
- **Content**: Overlay wrapper for image-backed scenes (use with CinematicBG). Props: \`{ children, opacity?, translateY? }\`

### Background
- **BG**: Grid + orbs + scanline background. Props: \`{ seed?, tint?, orbColors? }\` — auto-included in CenterScene.
- **CinematicBG**: Ken Burns zoom/pan on an image. Props: \`{ src, startScale?, endScale?, startX?, endX?, startY?, endY?, overlayOpacity? }\`
- **GlowOrb**: Floating ambient orb. Props: \`{ x, y, size, color, delay }\`
- **GridPattern**: Subtle grid lines. Props: \`{ opacity?, color? }\`
- **ScanLine**: Animated horizontal line. Props: \`{ color?, speed? }\`

### Animation
- **FadeUp**: Spring-animated fade + translateY entrance. Props: \`{ children, delay, style? }\` — delay is in frames from the Sequence start.
- **useExit(exitStart, exitEnd, exitY?)**: Hook returning { op, y } for opacity/translateY exit animation.

### Cards
- **FeatureCard**: Icon + title + description horizontal card. Props: \`{ icon, title, desc, delay }\`
- **StepRow**: Timeline step row (time, icon, text, color). Props: \`{ step: { time, icon, text, color }, delay }\`
- **ReasonCard**: Icon + title + description vertical card. Props: \`{ item: { icon, title, desc }, delay }\`
- **TierCard**: Pricing tier card. Props: \`{ tier: { name, price, color, features: string[] }, delay }\`

### Stats
- **StatCounter**: Animated stat with gradient. Props: \`{ value, label, delay }\`
- **StatBlock**: Stat with custom color gradient. Props: \`{ value, label, color, delay }\`
- **StatBig**: Large hero stat. Props: \`{ value, label, color, delay }\`

### Typography
- **GradientText**: Inline gradient text. Props: \`{ children, from, to, style? }\`
- **SectionLabel**: Uppercase colored label. Props: \`{ children, color, style? }\`

### CTA
- **CTAButton**: Pulsing gradient button. Props: \`{ children, delay, gradientFrom?, gradientTo?, glowColor? }\`
- **LogoIcon**: ▶ play icon in gradient box. Props: \`{ delay, size?, gradientFrom?, gradientTo?, gradientVia?, glowColor? }\`

### Other
- **ConnectorLine**: Animated vertical connector. Props: \`{ delay, color }\`
- **WaveformVisual**: SVG sine wave with optional saturation. Props: \`{ delay, distorted? }\`

## EXAMPLE 1: Feature Explainer (EmailAutomationVideo pattern)

\`\`\`
const { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } = Remotion;
const { CenterScene, FadeUp, useExit, StepRow, ReasonCard, StatBlock, ConnectorLine, LogoIcon, CTAButton } = Components;
const { C, F } = Theme;

// Scene: Hook
const HookScene = () => {
  const { op, y } = useExit(130, 150);
  return (
    <CenterScene opacity={op} translateY={y}>
      <FadeUp delay={8} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>
        50,000 Instagram followers.
      </FadeUp>
      <FadeUp delay={25} style={{ fontSize: 26, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 36 }}>
        $200 a month in sales.
      </FadeUp>
      <FadeUp delay={50}>
        <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Meanwhile, a producer with{" "}
          <span style={{ background: "linear-gradient(135deg, " + C.green + ", " + C.cyan + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>5,000 emails</span>
          {" "}makes{" "}
          <span style={{ background: "linear-gradient(135deg, " + C.primary + ", " + C.pink + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$5K/month.</span>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// Scene: Stats
const StatsScene = () => {
  const { op, y } = useExit(280, 300);
  return (
    <CenterScene opacity={op} translateY={y} seed={5}>
      <FadeUp delay={5} style={{ fontSize: 14, color: C.green, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", fontFamily: F, marginBottom: 10 }}>THE RESULTS</FadeUp>
      <FadeUp delay={10} style={{ fontSize: 36, fontWeight: 800, color: C.white, fontFamily: F, lineHeight: 1.15, marginBottom: 50 }}>Numbers don't lie.</FadeUp>
      <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
        <StatBlock value="3x" label="more sales" color={C.green} delay={25} />
        <StatBlock value="40%" label="open rate" color={C.primary} delay={45} />
      </div>
    </CenterScene>
  );
};

// Scene: CTA
const CTAScene = () => {
  const frame = useCurrentFrame();
  const urlOp = interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <CenterScene>
      <LogoIcon delay={10} />
      <FadeUp delay={22}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          Start building<br />
          <span style={{ background: "linear-gradient(135deg, " + C.primary + ", " + C.pink + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>workflows today.</span>
        </div>
      </FadeUp>
      <div style={{ marginTop: 44 }}>
        <CTAButton delay={55}>Get Started →</CTAButton>
      </div>
      <div style={{ opacity: urlOp, marginTop: 24, fontSize: 18, color: C.gray, fontFamily: "monospace", letterSpacing: 2 }}>academy.pauseplayrepeat.com</div>
    </CenterScene>
  );
};

const MyVideo = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={150}><HookScene /></Sequence>
    <Sequence from={150} durationInFrames={300}><StatsScene /></Sequence>
    <Sequence from={450} durationInFrames={300}><CTAScene /></Sequence>
  </AbsoluteFill>
);

return MyVideo;
\`\`\`

## EXAMPLE 2: Course Promo (SaturationCourseVideo pattern)

\`\`\`
const { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } = Remotion;
const { CenterScene, FadeUp, useExit, WaveformVisual, CTAButton } = Components;
const { C, F } = Theme;

const SAT_ORBS = [C.red, C.warmOrange];

const HookScene = () => {
  const { op, y } = useExit(155, 180);
  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange} orbColors={SAT_ORBS}>
      <FadeUp delay={8} style={{ fontSize: 24, color: C.gray, fontFamily: F, fontWeight: 500, marginBottom: 20 }}>Every hit record uses it.</FadeUp>
      <FadeUp delay={48}>
        <div style={{ fontSize: 50, fontWeight: 900, fontFamily: F, lineHeight: 1.1 }}>
          <span style={{ background: "linear-gradient(135deg, " + C.orange + ", " + C.red + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Saturation</span>
          <br />
          <span style={{ color: C.white }}>& </span>
          <span style={{ background: "linear-gradient(135deg, " + C.red + ", " + C.pink + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Distortion</span>
        </div>
      </FadeUp>
      <FadeUp delay={78} style={{ width: "100%" }}>
        <WaveformVisual delay={78} distorted />
      </FadeUp>
    </CenterScene>
  );
};

const MyVideo = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><HookScene /></Sequence>
  </AbsoluteFill>
);

return MyVideo;
\`\`\`

## EXAMPLE 3: Product Promo with Images (BeatLeaseVideo + CinematicBG pattern)

\`\`\`
const { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Img } = Remotion;
const { CenterScene, Content, CinematicBG, FadeUp, useExit, TierCard, LogoIcon, CTAButton } = Components;
const { C, F } = Theme;

const ImageScene = () => {
  const { op, y } = useExit(155, 180);
  return (
    <AbsoluteFill style={{ opacity: op, transform: "translateY(" + y + "px)" }}>
      <CinematicBG src={images[0]} overlayOpacity={0.6} />
      <Content>
        <FadeUp delay={8}>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            Bold Title Here
          </div>
        </FadeUp>
      </Content>
    </AbsoluteFill>
  );
};

const MyVideo = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Sequence from={0} durationInFrames={180}><ImageScene /></Sequence>
  </AbsoluteFill>
);

return MyVideo;
\`\`\`

## STRICT RULES

1. Output ONLY the function body — no markdown fences, no explanation text
2. The code must RETURN a React component (the last line is \`return MyVideo;\`)
3. Destructure from Remotion, Components, and Theme parameters
4. Use images array by index: \`images[0]\`, \`images[1]\`, etc.
5. If audioUrl is provided, add \`<Audio src={audioUrl} />\` in the first Sequence
6. Scene durations MUST match the script timing exactly (scene.duration * ${fps} = frames)
7. Use the provided color palette, not arbitrary colors
8. Every scene MUST have an exit transition via useExit
9. All text must be centered (the CenterScene component handles this)
10. No fetch(), eval(), require(), import(), process., fs., child_process
11. Total frames across all Sequences must equal the total specified`;
}

// ─── User Prompt Builder ────────────────────────────────────────────────────

function buildUserPrompt(
  script: any,
  imageUrls: string[],
  audioData: { audioUrl: string; duration: number; words?: Array<{ word: string; start: number; end: number }> } | null,
  totalFrames: number,
  fps: number,
  dimensions: { width: number; height: number }
): string {
  let prompt = `Generate a Remotion video composition for the following script.\n\n`;

  prompt += `## VIDEO SPECS\n`;
  prompt += `- Total duration: ${totalFrames} frames (${totalFrames / fps}s at ${fps}fps)\n`;
  prompt += `- Dimensions: ${dimensions.width}x${dimensions.height}\n\n`;

  prompt += `## COLOR PALETTE\n`;
  prompt += `- Primary: ${script.colorPalette.primary}\n`;
  prompt += `- Secondary: ${script.colorPalette.secondary}\n`;
  prompt += `- Accent: ${script.colorPalette.accent}\n`;
  prompt += `- Background: ${script.colorPalette.background}\n`;
  prompt += `Use the C (theme colors) object but also use these specific colors from the palette where they match the mood.\n\n`;

  prompt += `## SCENES\n`;
  let frameOffset = 0;
  for (const scene of script.scenes) {
    const frames = scene.duration * fps;
    prompt += `### Scene "${scene.id}" (${frames} frames, from=${frameOffset}, mood: ${scene.mood})\n`;
    if (scene.onScreenText.headline) prompt += `  Headline: "${scene.onScreenText.headline}"\n`;
    if (scene.onScreenText.subhead) prompt += `  Subhead: "${scene.onScreenText.subhead}"\n`;
    if (scene.onScreenText.bulletPoints?.length) {
      prompt += `  Bullets:\n`;
      for (const bp of scene.onScreenText.bulletPoints) {
        prompt += `    - "${bp}"\n`;
      }
    }
    if (scene.onScreenText.emphasis?.length) {
      prompt += `  Emphasis words: ${scene.onScreenText.emphasis.join(", ")}\n`;
    }
    prompt += `  Visual direction: ${scene.visualDirection}\n`;
    if (scene.voiceover) prompt += `  Voiceover: "${scene.voiceover}"\n`;
    prompt += `\n`;
    frameOffset += frames;
  }

  prompt += `## AVAILABLE IMAGES (${imageUrls.length} total)\n`;
  imageUrls.forEach((url, i) => {
    prompt += `  images[${i}]: ${url.substring(0, 80)}...\n`;
  });
  prompt += `Use CinematicBG with images for visually rich scenes, or CenterScene for text-focused scenes.\n\n`;

  if (audioData) {
    prompt += `## AUDIO\n`;
    prompt += `audioUrl is available — add <Audio src={audioUrl} /> in the first Sequence.\n`;
    prompt += `Audio duration: ${audioData.duration.toFixed(1)}s\n`;
    if (audioData.words && audioData.words.length > 0) {
      prompt += `Word timestamps available for sync (${audioData.words.length} words).\n`;
      prompt += `First few words: ${audioData.words.slice(0, 10).map((w) => `"${w.word}" @${w.start.toFixed(2)}s`).join(", ")}\n`;
    }
    prompt += `\n`;
  } else {
    prompt += `## AUDIO\nNo audio — this is a text-only video.\n\n`;
  }

  prompt += `## REQUIREMENTS\n`;
  prompt += `- Total frames: ${totalFrames} (Sequences must add up to this)\n`;
  prompt += `- Every scene needs an exit animation (useExit)\n`;
  prompt += `- Use the component library (CenterScene, FadeUp, etc.) instead of raw divs where possible\n`;
  prompt += `- Make the animations feel cinematic and professional\n`;
  prompt += `- The last scene should NOT have an exit transition (it's the final frame)\n`;
  prompt += `\nGenerate the code now.`;

  return prompt;
}

// ─── Fallback Template ──────────────────────────────────────────────────────

function buildFallbackCode(
  script: any,
  imageUrls: string[],
  audioData: { audioUrl: string; duration: number; words?: Array<{ word: string; start: number; end: number }> } | null,
  totalFrames: number,
  fps: number,
  dimensions: { width: number; height: number }
): string {
  const palette = script.colorPalette;
  const scenes = script.scenes || [];

  // Calculate frame offsets for each scene
  let frameOffset = 0;
  const sceneFrames = scenes.map((s: any) => {
    const frames = s.duration * fps;
    const from = frameOffset;
    frameOffset += frames;
    return { ...s, frames, from };
  });

  // Build scene components
  const sceneComponents = sceneFrames.map((scene: any, i: number) => {
    const isLast = i === sceneFrames.length - 1;
    const exitStart = scene.frames - 25;
    const exitEnd = scene.frames;
    const headline = scene.onScreenText?.headline || "";
    const subhead = scene.onScreenText?.subhead || "";
    const bullets = scene.onScreenText?.bulletPoints || [];
    const hasImage = i < imageUrls.length;

    let exitCode = "";
    if (!isLast) {
      exitCode = `  const { op, y } = useExit(${exitStart}, ${exitEnd});`;
    }

    let sceneBody: string;
    if (hasImage) {
      sceneBody = `
  var Scene${i} = function() {
    var frame = useCurrentFrame();
    ${exitCode}
    return React.createElement(AbsoluteFill, { style: { opacity: ${isLast ? 1 : "op"}, transform: "translateY(" + ${isLast ? 0 : "y"} + "px)" } },
      React.createElement(CinematicBG, { src: images[${i}], overlayOpacity: 0.6 }),
      React.createElement(Content, null,
        React.createElement(FadeUp, { delay: 8 },
          React.createElement("div", { style: { fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: "#ffffff", textShadow: "0 2px 20px rgba(0,0,0,0.8)" } }, ${JSON.stringify(headline)})
        ),
        ${subhead ? `React.createElement(FadeUp, { delay: 25, style: { fontSize: 22, color: "#94a3b8", fontFamily: F, fontWeight: 500, marginTop: 16 } }, ${JSON.stringify(subhead)}),` : ""}
        ${bullets.map((b: string, bi: number) => `React.createElement(FadeUp, { delay: ${30 + bi * 15}, style: { fontSize: 18, color: "#ffffff", fontFamily: F, fontWeight: 500, marginTop: 8 } }, ${JSON.stringify("→ " + b)})`).join(",\n        ")}
      )
    );
  };`;
    } else {
      sceneBody = `
  var Scene${i} = function() {
    var frame = useCurrentFrame();
    ${exitCode}
    return React.createElement(CenterScene, { opacity: ${isLast ? 1 : "op"}, translateY: ${isLast ? 0 : "y"}, seed: ${i}, tint: ${JSON.stringify(palette.primary)} },
      React.createElement(FadeUp, { delay: 8 },
        React.createElement("div", { style: { fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: "#ffffff" } }, ${JSON.stringify(headline)})
      ),
      ${subhead ? `React.createElement(FadeUp, { delay: 25, style: { fontSize: 22, color: "#94a3b8", fontFamily: F, fontWeight: 500, marginTop: 16 } }, ${JSON.stringify(subhead)}),` : ""}
      ${bullets.map((b: string, bi: number) => `React.createElement(FadeUp, { delay: ${30 + bi * 15}, style: { fontSize: 18, color: "#ffffff", fontFamily: F, fontWeight: 500, marginTop: 8 } }, ${JSON.stringify("→ " + b)})`).join(",\n      ")}
    );
  };`;
    }

    return sceneBody;
  });

  // Build the main composition
  const sequenceElements = sceneFrames.map(
    (scene: any, i: number) =>
      `    React.createElement(Sequence, { from: ${scene.from}, durationInFrames: ${scene.frames} }, React.createElement(Scene${i}, null))`
  );

  const audioElement = audioData
    ? `    React.createElement(Sequence, { from: 0, durationInFrames: ${totalFrames} }, React.createElement(Audio, { src: audioUrl })),\n`
    : "";

  return `var AbsoluteFill = Remotion.AbsoluteFill;
var Sequence = Remotion.Sequence;
var useCurrentFrame = Remotion.useCurrentFrame;
var useVideoConfig = Remotion.useVideoConfig;
var spring = Remotion.spring;
var interpolate = Remotion.interpolate;
var Img = Remotion.Img;
var Audio = Remotion.Audio;
var CenterScene = Components.CenterScene;
var Content = Components.Content;
var CinematicBG = Components.CinematicBG;
var FadeUp = Components.FadeUp;
var useExit = Components.useExit;
var CTAButton = Components.CTAButton;
var LogoIcon = Components.LogoIcon;
var C = Theme.C;
var F = Theme.F;

${sceneComponents.join("\n")}

var MyVideo = function() {
  return React.createElement(AbsoluteFill, { style: { backgroundColor: "${palette.background || "#0a0a0a"}" } },
${audioElement}${sequenceElements.join(",\n")}
  );
};

return MyVideo;`;
}
