"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  validateAll,
  extractCode,
  validateSecurity,
  validateSceneCode,
  cleanSceneCode,
  autoFixDelimiters,
  isNonCodeOutput,
} from "./codeValidator";

/**
 * Step 5: Generate Remotion composition code scene-by-scene via OpenRouter.
 *
 * Each scene is generated, validated, and retried independently (30-60 lines each).
 * Then a deterministic template wraps all scenes into the final composition.
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

    // ── Iteration mode: use the old single-prompt flow ──────────────
    // When iterating on existing code, we send the full previous code + feedback
    // as one prompt since the AI needs to see the entire composition to make targeted edits.
    if (args.previousCode && args.iterationFeedback) {
      return await generateFullComposition(
        ctx,
        apiKey,
        args.jobId,
        script,
        args.imageUrls,
        args.audioData ?? null,
        totalFrames,
        fps,
        dimensions,
        args.previousCode,
        args.iterationFeedback
      );
    }

    // ── Scene-by-scene generation ───────────────────────────────────
    const scenes = script.scenes || [];
    if (scenes.length === 0) {
      throw new Error("Script has no scenes");
    }

    // Calculate frame offsets
    let frameOffset = 0;
    const sceneData = scenes.map((s: any, i: number) => {
      const frames = s.duration * fps;
      const from = frameOffset;
      frameOffset += frames;
      return { ...s, frames, from, index: i };
    });

    const systemPrompt = buildSceneSystemPrompt(dimensions, fps);
    const generatedScenes: string[] = [];
    let anyFailed = false;

    // Generate each scene independently
    for (let i = 0; i < sceneData.length; i++) {
      const scene = sceneData[i];
      const isLast = i === sceneData.length - 1;
      const imageIndex = i < args.imageUrls.length ? i : null;

      const scenePrompt = buildSceneUserPrompt(
        scene,
        i,
        isLast,
        script.colorPalette,
        imageIndex,
        args.imageUrls,
        dimensions,
        fps
      );

      const sceneCode = await generateSingleScene(
        apiKey,
        systemPrompt,
        scenePrompt,
        i,
        scene.id
      );

      if (sceneCode === null) {
        anyFailed = true;
        // Use a fallback for this scene
        generatedScenes.push(
          buildFallbackScene(scene, i, isLast, script.colorPalette, imageIndex, args.imageUrls, fps)
        );
      } else {
        generatedScenes.push(sceneCode);
      }
    }

    // ── Compose final video ─────────────────────────────────────────
    const composedCode = composeVideo(
      generatedScenes,
      sceneData,
      args.audioData ?? null,
      totalFrames,
      script.colorPalette
    );

    // Strip any TypeScript syntax the AI may have included
    const strippedCode = stripTypeScript(composedCode);

    // Auto-fix delimiter mismatches in the full composed output
    const finalCode = autoFixDelimiters(strippedCode);

    // Final validation on the complete file
    const validation = validateAll(finalCode);
    if (validation.valid) {
      await ctx.runMutation(
        internal.videosPipeline.jobMutations.updateJobCode,
        { jobId: args.jobId, generatedCode: finalCode }
      );
      return { code: finalCode, usedFallback: anyFailed };
    }

    // If final validation fails, try the full-composition fallback
    console.warn("⚠️ Scene-by-scene composition failed final validation:", validation.errors);
    console.warn("Falling back to full fallback template.");

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

// ─── AI Call Helper ─────────────────────────────────────────────────────────

const GATEWAY_ERROR_CODES = [502, 503, 504];
const MAX_GATEWAY_RETRIES = 3;
const GATEWAY_RETRY_DELAY_MS = 5000;

function isGatewayErrorBody(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4000
): Promise<string> {
  const requestBody = JSON.stringify({
    model: "google/gemini-3.1-pro-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
  });

  let lastError: Error | null = null;

  for (let gatewayAttempt = 0; gatewayAttempt <= MAX_GATEWAY_RETRIES; gatewayAttempt++) {
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
        body: requestBody,
      }
    );

    // Check for gateway errors by status code
    if (GATEWAY_ERROR_CODES.includes(response.status)) {
      if (gatewayAttempt < MAX_GATEWAY_RETRIES) {
        console.warn(`OpenRouter returned ${response.status}, retrying in 5s (attempt ${gatewayAttempt + 1}/${MAX_GATEWAY_RETRIES})`);
        await new Promise((r) => setTimeout(r, GATEWAY_RETRY_DELAY_MS));
        continue;
      }
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}) after ${MAX_GATEWAY_RETRIES} gateway retries: ${errorText.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    // Read the body and check for HTML responses that sneak through with 200 status
    const responseText = await response.text();
    if (isGatewayErrorBody(responseText)) {
      if (gatewayAttempt < MAX_GATEWAY_RETRIES) {
        console.warn(`OpenRouter returned HTML instead of JSON, retrying in 5s (attempt ${gatewayAttempt + 1}/${MAX_GATEWAY_RETRIES})`);
        await new Promise((r) => setTimeout(r, GATEWAY_RETRY_DELAY_MS));
        continue;
      }
      throw new Error(`OpenRouter returned HTML instead of JSON after ${MAX_GATEWAY_RETRIES} gateway retries: ${responseText.substring(0, 200)}`);
    }

    const data: any = JSON.parse(responseText);
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No content in OpenRouter response");
    }

    return extractCode(rawContent);
  }

  // Should never reach here, but satisfy TypeScript
  throw lastError || new Error("OpenRouter call failed after gateway retries");
}

// ─── Scene-Level Generation ─────────────────────────────────────────────────

/**
 * Generate a single scene component with retries.
 * Returns the scene code string or null if all attempts fail.
 */
async function generateSingleScene(
  apiKey: string,
  systemPrompt: string,
  scenePrompt: string,
  sceneIndex: number,
  sceneId: string
): Promise<string | null> {
  const MAX_SCENE_ATTEMPTS = 3;
  const MAX_NON_CODE_REPROMPTS = 2;
  let lastErrors: string[] = [];
  let lastCode: string | null = null;
  let nonCodeReprompt = false;
  let nonCodeRepromptCount = 0;

  for (let attempt = 0; attempt < MAX_SCENE_ATTEMPTS; attempt++) {
    try {
      let prompt = scenePrompt;

      if (nonCodeReprompt) {
        // AI returned planning notes — don't count as a retry, re-prompt with specific instruction
        prompt += `\n\n## CRITICAL: YOU RETURNED PLANNING NOTES INSTEAD OF CODE\nYou returned planning notes instead of code. Return ONLY the JavaScript component function. Start with "const Scene${sceneIndex} = () => {". No explanations, no frame breakdowns, no markdown, no SVG paths.`;
        nonCodeReprompt = false;
      } else if (attempt > 0 && lastErrors.length > 0) {
        let syntaxWarning = "";
        if (lastCode) {
          syntaxWarning = buildDelimiterWarning(lastCode);
        }
        prompt += `\n\n## FIX THESE ERRORS (attempt ${attempt + 1})\n`;
        prompt += lastErrors.map((e) => `- ${e}`).join("\n");
        prompt += syntaxWarning;
        prompt += `\n\nOutput the corrected scene function ONLY. No markdown, no imports, no exports, no explanation text.`;
      }

      const rawCode = await callOpenRouter(apiKey, systemPrompt, prompt, 4000);

      // Clean the scene code FIRST, then log the cleaned output
      const cleaned = cleanSceneCode(rawCode);

      // Diagnostic: log CLEANED output so we see actual processed code
      console.log(`Scene ${sceneId} cleaned (first 500):`, cleaned.substring(0, 500));

      // Detect non-code output (planning notes, frame breakdowns, etc.)
      if (isNonCodeOutput(cleaned)) {
        nonCodeRepromptCount++;
        if (nonCodeRepromptCount <= MAX_NON_CODE_REPROMPTS) {
          console.warn(`⚠️ Scene ${sceneId} returned non-code output (reprompt ${nonCodeRepromptCount}/${MAX_NON_CODE_REPROMPTS}), re-prompting...`);
          nonCodeReprompt = true;
          // Don't count this as a real attempt — decrement so we get a fresh try
          attempt--;
          continue;
        }
        console.error(`❌ Scene ${sceneId} returned non-code output ${nonCodeRepromptCount} times, giving up`);
        return null;
      }

      const code = autoFixDelimiters(cleaned);
      lastCode = code;

      // Validate with scene-specific (relaxed) validator
      const sceneValidation = validateSceneCode(code);

      if (sceneValidation.valid) {
        return code;
      }

      console.warn(`⚠️ Scene ${sceneId} validation failed (attempt ${attempt + 1}):`, sceneValidation.errors);
      lastErrors = sceneValidation.errors;

      // Security check — bail early on security violations
      const securityCheck = validateSecurity(code);
      if (!securityCheck.safe) {
        console.error(`🚫 Security violations in scene ${sceneId}, skipping retries`);
        return null;
      }
    } catch (err: any) {
      console.error(`❌ Scene ${sceneId} attempt ${attempt + 1} failed:`, err.message);
      lastErrors = [err.message];
    }
  }

  return null;
}

/**
 * Build delimiter mismatch warning for retry prompts.
 */
function buildDelimiterWarning(code: string): string {
  let openParens = 0, closeParens = 0;
  let openBraces = 0, closeBraces = 0;
  let openBrackets = 0, closeBrackets = 0;
  for (const ch of code) {
    if (ch === "(") openParens++;
    if (ch === ")") closeParens++;
    if (ch === "{") openBraces++;
    if (ch === "}") closeBraces++;
    if (ch === "[") openBrackets++;
    if (ch === "]") closeBrackets++;
  }
  const parts: string[] = [];
  if (openParens !== closeParens) {
    parts.push(`PARENTHESES: ${openParens} "(" vs ${closeParens} ")" — off by ${Math.abs(openParens - closeParens)}`);
  }
  if (openBraces !== closeBraces) {
    parts.push(`BRACES: ${openBraces} "{" vs ${closeBraces} "}" — off by ${Math.abs(openBraces - closeBraces)}`);
  }
  if (openBrackets !== closeBrackets) {
    parts.push(`BRACKETS: ${openBrackets} "[" vs ${closeBrackets} "]" — off by ${Math.abs(openBrackets - closeBrackets)}`);
  }
  if (parts.length === 0) return "";
  return `\n\n⚠️ DELIMITER MISMATCH:\n${parts.join("\n")}`;
}

// ─── TypeScript Stripping ────────────────────────────────────────────────────

/**
 * Strip TypeScript-specific syntax from generated code so Sucrase/new Function()
 * can handle it as plain JavaScript + JSX. Handles:
 * - `as SomeType` cast expressions
 * - Type annotations (`: number`, `: string`, `: React.FC<Props>`, etc.)
 * - `interface` and `type` declarations
 * - Generic type params like `<Props>`
 */
function stripTypeScript(code: string): string {
  let result = code;

  // Remove `as SomeType` casts (e.g., `value as number`, `foo as React.FC`)
  result = result.replace(/\s+as\s+[A-Z][A-Za-z0-9.<>,\s|&\[\]]*(?=[;,)\]\s}])/g, "");

  // Remove interface declarations (entire block)
  result = result.replace(/^\s*interface\s+\w+[^{]*\{[^}]*\}\s*;?\s*$/gm, "");

  // Remove type alias declarations
  result = result.replace(/^\s*type\s+\w+\s*=\s*[^;]+;\s*$/gm, "");

  // Remove type annotations on const/let/var declarations: `const x: number = ...` → `const x = ...`
  result = result.replace(/((?:const|let|var)\s+\w+)\s*:\s*[A-Za-z][A-Za-z0-9.<>,\s|&\[\]]*(?=\s*=)/g, "$1");

  // Remove type annotations on arrow function params: `(x: number)` → `(x)`
  result = result.replace(/(\w+)\s*:\s*(?:number|string|boolean|any|void|null|undefined|React\.\w+(?:<[^>]*>)?)\s*(?=[,)])/g, "$1");

  // Remove generic type params on function calls: `useState<number>()` → `useState()`
  // Only matches word<Type>( — won't match JSX tags since those don't have `(` after `>`
  result = result.replace(/(\w+)<[A-Z][A-Za-z0-9<>,\s|&]*>(\s*\()/g, "$1$2");

  return result;
}

// ─── Composition Assembly ───────────────────────────────────────────────────

/**
 * Deterministically compose the final video from validated scene components.
 * This is a template — no AI call needed.
 */
function composeVideo(
  sceneComponents: string[],
  sceneData: Array<{ frames: number; from: number; id: string; index: number }>,
  audioData: { audioUrl: string; duration: number; words?: Array<{ word: string; start: number; end: number }> } | null,
  totalFrames: number,
  colorPalette: any
): string {
  // Header: destructure from parameters
  let code = `const { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Audio } = Remotion;
const { CenterScene, Content, FadeUp, useExit, BG, CinematicBG, GlowOrb, GridPattern, ScanLine,
        FeatureCard, StepRow, ReasonCard, TierCard, StatCounter, StatBlock, StatBig,
        WaveformVisual, GradientText, SectionLabel, CTAButton, LogoIcon, ConnectorLine } = Components;
const { C, F } = Theme;

`;

  // Scene components
  for (const sceneCode of sceneComponents) {
    code += sceneCode + "\n\n";
  }

  // Audio element
  const audioJsx = audioData
    ? `\n      <Sequence from={0} durationInFrames={${totalFrames}}><Audio src={audioUrl} /></Sequence>`
    : "";

  // Sequence elements
  const sequences = sceneData.map((scene, i) => {
    return `      <Sequence from={${scene.from}} durationInFrames={${scene.frames}}><Scene${i} /></Sequence>`;
  });

  code += `const MyVideo = () => (
  <AbsoluteFill style={{ backgroundColor: "${colorPalette.background || "#0a0a0a"}" }}>${audioJsx}
${sequences.join("\n")}
  </AbsoluteFill>
);

return MyVideo;`;

  return code;
}

// ─── Scene System Prompt ────────────────────────────────────────────────────

function buildSceneSystemPrompt(
  dimensions: { width: number; height: number },
  fps: number
): string {
  return `You are a Remotion scene component generator for Pause Play Repeat, a music production education platform.

## YOUR OUTPUT FORMAT — CRITICAL

You must output ONLY a single JavaScript scene component function.
- NO markdown fences (\`\`\`), NO imports, NO exports, NO explanation text
- Start with \`const SceneN = () => {\` and end with \`};\`
- Do NOT wrap the code in anything — output raw JavaScript only
- Generate plain JavaScript with JSX only. Do NOT use TypeScript syntax — no type annotations, no \`as\` casts, no interfaces, no generics.

The scene will be placed inside a larger composition that already has these destructured:
\`\`\`
const { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Img, Audio } = Remotion;
const { CenterScene, Content, FadeUp, useExit, BG, CinematicBG, GlowOrb, GridPattern, ScanLine,
        FeatureCard, StepRow, ReasonCard, TierCard, StatCounter, StatBlock, StatBig,
        WaveformVisual, GradientText, SectionLabel, CTAButton, LogoIcon, ConnectorLine } = Components;
const { C, F } = Theme;
\`\`\`

Your output must be a single const arrow function, for example:
\`\`\`
const Scene0 = () => {
  const { op, y } = useExit(130, 150);
  return (
    <CenterScene opacity={op} translateY={y}>
      <FadeUp delay={8} style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white }}>
        Your headline here
      </FadeUp>
    </CenterScene>
  );
};
\`\`\`

## REMOTION BEST PRACTICES

### Animation Rules
- ALL animations MUST be driven by \`useCurrentFrame()\` — CSS transitions/animations are FORBIDDEN
- ALWAYS use \`extrapolateLeft: "clamp"\` and \`extrapolateRight: "clamp"\` on every \`interpolate()\` call
- Spring configs: smooth = \`{ damping: 200 }\`, snappy = \`{ damping: 20, stiffness: 200 }\`, bouncy = \`{ damping: 8 }\`
- Use \`spring({ fps, frame: frame - delay, config: { damping: 50-70 } })\` for custom entrances

### Component Structure
- Each scene is a self-contained function component with its own hooks
- NEVER define components inside other components
- Use \`useExit(exitStart, exitEnd)\` for exit transitions — returns { op, y }
- Exit should start ~20-25 frames before the scene's durationInFrames ends

### Syntax Rules — CRITICAL
- Every opening parenthesis \`(\` MUST have a matching closing \`)\`
- Every opening brace \`{\` MUST have a matching closing \`}\`
- Every JSX opening tag MUST have a matching closing tag or be self-closing
- Double-check all JSX before finishing — count your delimiters
- Keep code simple: prefer \`<FadeUp>\` and \`<CenterScene>\` over deeply nested raw divs

## THEME CONSTANTS

\`\`\`
C = { bg: "#0a0a0a", primary: "#6366f1", purple: "#7c3aed", deepPurple: "#5b21b6",
      pink: "#ec4899", cyan: "#22d3ee", green: "#22c55e", orange: "#f97316",
      red: "#ef4444", gold: "#eab308", warmOrange: "#fb923c", white: "#ffffff",
      gray: "#94a3b8", darkGray: "#1e293b" }
F = "system-ui, -apple-system, sans-serif"
\`\`\`

## DESIGN SYSTEM

1. **Layout**: All scenes use AbsoluteFill with flexbox centering
2. **Text hierarchy**:
   - Headline: 44-56px, fontWeight 900, fontFamily F
   - Subhead: 24-28px, fontWeight 500-600, fontFamily F
   - Body: 16-18px, fontWeight 400-500, fontFamily F
   - Label: 14-15px, fontWeight 700, letterSpacing 3-4, uppercase, fontFamily F
3. **Gradient text**: \`background: "linear-gradient(135deg, " + color1 + ", " + color2 + ")"\` + WebkitBackgroundClip: "text" + WebkitTextFillColor: "transparent"
4. **Cards**: background \`\${C.darkGray}cc\`, border \`1px solid \${color}20\`, borderRadius 16-20
5. **Dimensions**: ${dimensions.width}x${dimensions.height} at ${fps}fps

## COMPONENT LIBRARY

### Layout
- **CenterScene**: Main scene wrapper. Props: \`{ children, opacity?, translateY?, seed?, tint?, orbColors?, padding? }\`. Includes BG with grid, orbs, scanline.
- **Content**: Overlay wrapper for image-backed scenes (use with CinematicBG). Props: \`{ children, opacity?, translateY? }\`

### Background
- **CinematicBG**: Ken Burns zoom/pan on an image. Props: \`{ src, startScale?, endScale?, startX?, endX?, startY?, endY?, overlayOpacity? }\`
- **GlowOrb**: Floating ambient orb. Props: \`{ x, y, size, color, delay }\`

### Animation
- **FadeUp**: Spring-animated fade + translateY entrance. Props: \`{ children, delay, style? }\` — delay is in frames from the Sequence start.
- **useExit(exitStart, exitEnd, exitY?)**: Hook returning { op, y } for opacity/translateY exit animation.

### Cards
- **FeatureCard**: Props: \`{ icon, title, desc, delay }\`
- **StepRow**: Props: \`{ step: { time, icon, text, color }, delay }\`
- **ReasonCard**: Props: \`{ item: { icon, title, desc }, delay }\`
- **TierCard**: Props: \`{ tier: { name, price, color, features: string[] }, delay }\`

### Stats
- **StatCounter**: Props: \`{ value, label, delay }\`
- **StatBlock**: Props: \`{ value, label, color, delay }\`
- **StatBig**: Props: \`{ value, label, color, delay }\`

### Typography
- **GradientText**: Props: \`{ children, from, to, style? }\`
- **SectionLabel**: Uppercase colored label. Props: \`{ children, color, style? }\`

### CTA
- **CTAButton**: Pulsing gradient button. Props: \`{ children, delay, gradientFrom?, gradientTo?, glowColor? }\`
- **LogoIcon**: ▶ play icon. Props: \`{ delay, size?, gradientFrom?, gradientTo?, gradientVia?, glowColor? }\`

### Other
- **ConnectorLine**: Animated vertical connector. Props: \`{ delay, color }\`
- **WaveformVisual**: SVG sine wave. Props: \`{ delay, distorted? }\`

## ANTI-PATTERNS — NEVER DO THESE
- Do NOT use fetch, eval, require, import, or any dynamic code loading
- Do NOT use window, document, or any browser APIs
- Do NOT define components inside other components
- Do NOT use CSS animations or Tailwind animation classes

## STRICT RULES
1. Output ONLY the const function — no destructuring, no imports, no return MyVideo
2. Use images array by index: \`images[0]\`, \`images[1]\`, etc.
3. Scene durations MUST match the specified frame count
4. Use the provided color palette, not arbitrary colors
5. Keep the scene focused — typically 30-60 lines of code`;
}

// ─── Scene User Prompt ──────────────────────────────────────────────────────

function buildSceneUserPrompt(
  scene: any,
  index: number,
  isLast: boolean,
  colorPalette: any,
  imageIndex: number | null,
  imageUrls: string[],
  dimensions: { width: number; height: number },
  fps: number
): string {
  const frames = scene.frames || scene.duration * fps;

  let prompt = `Generate Scene${index} — a Remotion scene component function.\n\n`;

  prompt += `## SCENE DETAILS\n`;
  prompt += `- Function name: Scene${index}\n`;
  prompt += `- Scene ID: "${scene.id}"\n`;
  prompt += `- Duration: ${frames} frames (${frames / fps}s at ${fps}fps)\n`;
  prompt += `- Mood: ${scene.mood}\n`;
  prompt += `- Visual direction: ${scene.visualDirection}\n`;

  if (!isLast) {
    const exitStart = frames - 25;
    const exitEnd = frames;
    prompt += `- Exit animation: useExit(${exitStart}, ${exitEnd}) — apply opacity and translateY\n`;
  } else {
    prompt += `- This is the LAST scene — NO exit animation needed\n`;
  }

  prompt += `\n## ON-SCREEN TEXT\n`;
  if (scene.onScreenText?.headline) prompt += `- Headline: "${scene.onScreenText.headline}"\n`;
  if (scene.onScreenText?.subhead) prompt += `- Subhead: "${scene.onScreenText.subhead}"\n`;
  if (scene.onScreenText?.bulletPoints?.length) {
    prompt += `- Bullets:\n`;
    for (const bp of scene.onScreenText.bulletPoints) {
      prompt += `  - "${bp}"\n`;
    }
  }
  if (scene.onScreenText?.emphasis?.length) {
    prompt += `- Emphasis words (use gradient text): ${scene.onScreenText.emphasis.join(", ")}\n`;
  }
  if (scene.voiceover) prompt += `\n## VOICEOVER\n"${scene.voiceover}"\n`;

  prompt += `\n## COLOR PALETTE\n`;
  prompt += `- Primary: ${colorPalette.primary}\n`;
  prompt += `- Secondary: ${colorPalette.secondary}\n`;
  prompt += `- Accent: ${colorPalette.accent}\n`;

  if (imageIndex !== null) {
    prompt += `\n## IMAGE\n`;
    prompt += `This scene has an image available at \`images[${imageIndex}]\`.\n`;
    prompt += `Use CinematicBG for a cinematic image background, or Img for inline display.\n`;
  } else {
    prompt += `\n## NO IMAGE — use CenterScene for this text-focused scene.\n`;
  }

  // Scene-type specific guidance
  if (scene.id === "hook") {
    prompt += `\n## SCENE TYPE: HOOK\nMake it attention-grabbing. Bold headline, dramatic entrance. Use gradient text on emphasis words.\n`;
  } else if (scene.id === "cta") {
    prompt += `\n## SCENE TYPE: CTA (Call to Action)\nUse LogoIcon, CTAButton, and a URL reveal. Keep it clean and impactful.\n`;
  } else if (scene.id === "stats" || scene.id === "proof") {
    prompt += `\n## SCENE TYPE: STATS/PROOF\nUse StatBlock or StatCounter for numbers. Make data visually impactful.\n`;
  }

  prompt += `\n## EXAMPLE OUTPUT\n`;
  if (imageIndex !== null) {
    prompt += `\`\`\`
const Scene${index} = () => {
  ${isLast ? "" : "const { op, y } = useExit(" + (frames - 25) + ", " + frames + ");"}
  return (
    <AbsoluteFill style={{ ${isLast ? "" : "opacity: op, transform: \"translateY(\" + y + \"px)\", "}background: "#0a0a0a" }}>
      <CinematicBG src={images[${imageIndex}]} overlayOpacity={0.6} />
      <Content>
        <FadeUp delay={8}>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            Headline Here
          </div>
        </FadeUp>
      </Content>
    </AbsoluteFill>
  );
};
\`\`\``;
  } else {
    prompt += `\`\`\`
const Scene${index} = () => {
  ${isLast ? "" : "const { op, y } = useExit(" + (frames - 25) + ", " + frames + ");"}
  return (
    <CenterScene ${isLast ? "" : "opacity={op} translateY={y} "}seed={${index}} tint={C.primary}>
      <FadeUp delay={8} style={{ fontSize: 48, fontWeight: 900, fontFamily: F, color: C.white }}>
        Headline Here
      </FadeUp>
      <FadeUp delay={25} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 500, marginTop: 16 }}>
        Subhead here
      </FadeUp>
    </CenterScene>
  );
};
\`\`\``;
  }

  prompt += `\n\nGenerate Scene${index} now. Return ONLY the scene component function. Plain JavaScript with JSX — no TypeScript, no type annotations, no \`as\` casts. No imports, no exports, no markdown fences, no explanation text. Start with "const Scene${index} = () => {" and end with "};".`;

  return prompt;
}

// ─── Iteration Mode (Full Composition) ──────────────────────────────────────

async function generateFullComposition(
  ctx: any,
  apiKey: string,
  jobId: any,
  script: any,
  imageUrls: string[],
  audioData: { audioUrl: string; duration: number; words?: Array<{ word: string; start: number; end: number }> } | null,
  totalFrames: number,
  fps: number,
  dimensions: { width: number; height: number },
  previousCode: string,
  iterationFeedback: string
): Promise<{ code: string; usedFallback: boolean }> {
  const systemPrompt = buildFullSystemPrompt(dimensions, fps);
  let userPrompt = buildFullUserPrompt(
    script,
    imageUrls,
    audioData,
    totalFrames,
    fps,
    dimensions
  );

  userPrompt += `\n\n## ITERATION — MODIFY PREVIOUS VERSION\n`;
  userPrompt += `The creator wants these changes: "${iterationFeedback}"\n\n`;
  userPrompt += `Here is the previous version of the video code. Modify it to apply the requested changes. Keep everything else the same.\n\n`;
  userPrompt += `\`\`\`\n${previousCode}\n\`\`\`\n`;
  userPrompt += `\nOutput the FULL modified code (not a diff). Apply ONLY the requested changes.`;

  const MAX_ATTEMPTS = 4;
  let lastErrors: string[] = [];
  let lastCode: string | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      let prompt: string;
      if (attempt === 0) {
        prompt = userPrompt;
      } else {
        let syntaxWarning = "";
        if (lastCode) {
          syntaxWarning = buildDelimiterWarning(lastCode);
        }
        prompt = `${userPrompt}\n\n## FIX THESE ERRORS (attempt ${attempt + 1})\n${lastErrors.map((e) => `- ${e}`).join("\n")}${syntaxWarning}\n\nFix ALL issues and output corrected code.`;
      }

      const rawCode = await callOpenRouter(apiKey, systemPrompt, prompt, 12000);
      console.log(`Iteration raw (first 500):`, rawCode.substring(0, 500));
      const code = autoFixDelimiters(stripTypeScript(rawCode));
      lastCode = code;

      const validation = validateAll(code);
      if (validation.valid) {
        await ctx.runMutation(
          internal.videosPipeline.jobMutations.updateJobCode,
          { jobId, generatedCode: code }
        );
        return { code, usedFallback: false };
      }

      console.warn(`⚠️ Iteration validation failed (attempt ${attempt + 1}):`, validation.errors);
      lastErrors = validation.errors;

      const securityCheck = validateSecurity(code);
      if (!securityCheck.safe) {
        console.error("🚫 Security violations detected, skipping retries");
        break;
      }
    } catch (err: any) {
      console.error(`❌ Iteration attempt ${attempt + 1} failed:`, err.message);
      lastErrors = [err.message];
    }
  }

  // Iteration failed — return previous code unchanged
  await ctx.runMutation(
    internal.videosPipeline.jobMutations.updateJobCode,
    { jobId, generatedCode: previousCode }
  );
  return { code: previousCode, usedFallback: true };
}

// ─── Full System Prompt (for iterations) ────────────────────────────────────

function buildFullSystemPrompt(
  dimensions: { width: number; height: number },
  fps: number
): string {
  return `You are a Remotion video composition code generator for Pause Play Repeat, a music production education platform.

## YOUR OUTPUT FORMAT

You must output ONLY a JavaScript function body (no markdown, no explanation, no \`\`\`).
Generate plain JavaScript with JSX only. Do NOT use TypeScript syntax — no type annotations, no \`as\` casts, no interfaces, no generics.

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

## REMOTION BEST PRACTICES

### Animation Rules
- ALL animations MUST be driven by \`useCurrentFrame()\` — CSS transitions/animations are FORBIDDEN
- ALWAYS use \`extrapolateLeft: "clamp"\` and \`extrapolateRight: "clamp"\` on every \`interpolate()\` call
- Spring configs: smooth = \`{ damping: 200 }\`, snappy = \`{ damping: 20, stiffness: 200 }\`, bouncy = \`{ damping: 8 }\`

### Syntax Rules — CRITICAL
- Every opening parenthesis \`(\` MUST have a matching closing \`)\`
- Every opening brace \`{\` MUST have a matching closing \`}\`
- Every JSX opening tag MUST have a matching closing tag or be self-closing
- NEVER define components inside other components

## THEME CONSTANTS

C = { bg: "#0a0a0a", primary: "#6366f1", purple: "#7c3aed", deepPurple: "#5b21b6",
      pink: "#ec4899", cyan: "#22d3ee", green: "#22c55e", orange: "#f97316",
      red: "#ef4444", gold: "#eab308", warmOrange: "#fb923c", white: "#ffffff",
      gray: "#94a3b8", darkGray: "#1e293b" }
F = "system-ui, -apple-system, sans-serif"

## DESIGN SYSTEM RULES

1. **Layout**: All scenes use AbsoluteFill with flexbox centering
2. **Text hierarchy**:
   - Headline: 44-56px, fontWeight 900, fontFamily F
   - Subhead: 24-28px, fontWeight 500-600, fontFamily F
   - Body: 16-18px, fontWeight 400-500, fontFamily F
   - Label: 14-15px, fontWeight 700, letterSpacing 3-4, uppercase, fontFamily F
3. **Colors**: Use the provided palette. C object has: bg, primary, purple, deepPurple, pink, cyan, green, orange, red, gold, warmOrange, white, gray, darkGray
4. **Gradient text**: \`background: "linear-gradient(135deg, " + color1 + ", " + color2 + ")"\` + WebkitBackgroundClip: "text" + WebkitTextFillColor: "transparent"
5. **Animations**:
   - Entrances: Use \`<FadeUp delay={frameNumber}>\` for spring-animated fade+translate
   - Exits: Use \`useExit(exitStartFrame, exitEndFrame)\` which returns { op, y } for opacity and translateY
6. **Cards**: background \`\${C.darkGray}cc\`, border \`1px solid \${color}20\`, borderRadius 16-20
7. **Scene transitions**: Each scene's useExit should start ~20-25 frames before the Sequence ends
8. **Dimensions**: ${dimensions.width}x${dimensions.height} at ${fps}fps

## COMPONENT LIBRARY

### Layout
- **CenterScene**: Main scene wrapper. Props: \`{ children, opacity?, translateY?, seed?, tint?, orbColors?, padding? }\`
- **Content**: Overlay wrapper for image-backed scenes. Props: \`{ children, opacity?, translateY? }\`

### Background
- **CinematicBG**: Ken Burns zoom/pan. Props: \`{ src, startScale?, endScale?, startX?, endX?, startY?, endY?, overlayOpacity? }\`

### Animation
- **FadeUp**: Props: \`{ children, delay, style? }\`
- **useExit(exitStart, exitEnd, exitY?)**: Returns { op, y }

### Cards/Stats/Typography/CTA
- **FeatureCard, StepRow, ReasonCard, TierCard, StatCounter, StatBlock, StatBig**
- **GradientText, SectionLabel, CTAButton, LogoIcon, ConnectorLine, WaveformVisual**

## ANTI-PATTERNS — NEVER DO THESE
- Do NOT use fetch, eval, require, import, or any dynamic code loading
- Do NOT use window, document, or any browser APIs
- Do NOT define components inside other components

## STRICT RULES

1. Output ONLY the function body — no markdown fences, no explanation text
2. The code must RETURN a React component (the last line is \`return MyVideo;\`)
3. Destructure from Remotion, Components, and Theme parameters
4. Use images array by index: \`images[0]\`, \`images[1]\`, etc.
5. If audioUrl is provided, add \`<Audio src={audioUrl} />\` in the first Sequence
6. Scene durations MUST match the script timing exactly (scene.duration * ${fps} = frames)
7. Use the provided color palette, not arbitrary colors
8. Every scene except the last MUST have an exit transition via useExit
9. No fetch(), eval(), require(), import(), process., fs., child_process
10. Total frames across all Sequences must equal the total specified`;
}

// ─── Full User Prompt (for iterations) ──────────────────────────────────────

function buildFullUserPrompt(
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
  prompt += `- Every scene except the last needs an exit animation (useExit)\n`;
  prompt += `- Use the component library (CenterScene, FadeUp, etc.) instead of raw divs\n`;
  prompt += `- Make the animations feel cinematic and professional\n`;
  prompt += `\nGenerate the code now.`;

  return prompt;
}

// ─── Scene-Level Fallback ───────────────────────────────────────────────────

function buildFallbackScene(
  scene: any,
  index: number,
  isLast: boolean,
  colorPalette: any,
  imageIndex: number | null,
  imageUrls: string[],
  fps: number
): string {
  const frames = scene.frames || scene.duration * fps;
  const exitStart = frames - 25;
  const exitEnd = frames;
  const headline = scene.onScreenText?.headline || "";
  const subhead = scene.onScreenText?.subhead || "";
  const bullets = scene.onScreenText?.bulletPoints || [];

  const exitLine = isLast ? "" : `  const { op, y } = useExit(${exitStart}, ${exitEnd});`;

  if (imageIndex !== null) {
    const bulletJsx = bullets.map((b: string, bi: number) =>
      `      <FadeUp delay={${30 + bi * 15}} style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500, marginTop: 8 }}>{"→ " + ${JSON.stringify(b)}}</FadeUp>`
    ).join("\n");

    return `const Scene${index} = () => {
${exitLine}
  return (
    <AbsoluteFill style={{ ${isLast ? "" : 'opacity: op, transform: "translateY(" + y + "px)", '}background: C.bg }}>
      <CinematicBG src={images[${imageIndex}]} overlayOpacity={0.6} />
      <Content>
        <FadeUp delay={8}>
          <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            {${JSON.stringify(headline)}}
          </div>
        </FadeUp>
${subhead ? `        <FadeUp delay={25} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 500, marginTop: 16 }}>{${JSON.stringify(subhead)}}</FadeUp>` : ""}
${bulletJsx}
      </Content>
    </AbsoluteFill>
  );
};`;
  } else {
    const bulletJsx = bullets.map((b: string, bi: number) =>
      `      <FadeUp delay={${30 + bi * 15}} style={{ fontSize: 18, color: C.white, fontFamily: F, fontWeight: 500, marginTop: 8 }}>{"→ " + ${JSON.stringify(b)}}</FadeUp>`
    ).join("\n");

    return `const Scene${index} = () => {
${exitLine}
  return (
    <CenterScene ${isLast ? "" : "opacity={op} translateY={y} "}seed={${index}} tint={${JSON.stringify(colorPalette.primary)}}>
      <FadeUp delay={8}>
        <div style={{ fontSize: 44, fontWeight: 900, fontFamily: F, lineHeight: 1.15, color: C.white }}>
          {${JSON.stringify(headline)}}
        </div>
      </FadeUp>
${subhead ? `      <FadeUp delay={25} style={{ fontSize: 22, color: C.gray, fontFamily: F, fontWeight: 500, marginTop: 16 }}>{${JSON.stringify(subhead)}}</FadeUp>` : ""}
${bulletJsx}
    </CenterScene>
  );
};`;
  }
}

// ─── Full Fallback Template (React.createElement, no JSX) ───────────────────

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
