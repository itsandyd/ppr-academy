"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import type { VideoContext } from "./gatherContext";

/**
 * Step 2: Generate a structured video script using Claude Opus 4.6 via OpenRouter.
 *
 * The LLM writes scene-by-scene copy, visual direction, image prompts,
 * and selects a color palette based on the topic/mood.
 */
export const generateScript = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    context: v.any(), // VideoContext — typed as any because Convex can't validate complex types at runtime
  },
  returns: v.object({
    scriptId: v.id("videoScripts"),
    imagePrompts: v.array(v.string()),
    voiceoverScript: v.string(),
  }),
  handler: async (ctx, args) => {
    const context = args.context as VideoContext;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);

    let scriptData: ScriptOutput | null = null;

    // Attempt LLM call — retry once with simpler prompt on failure
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const prompt = attempt === 0 ? userPrompt : buildSimplifiedUserPrompt(context);
        scriptData = await callOpenRouter(systemPrompt, prompt);
        break;
      } catch (err: any) {
        console.error(`Script generation attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 1) {
          // Both attempts failed — use fallback
          console.log("Falling back to default script structure");
          scriptData = buildFallbackScript(context);
        }
      }
    }

    if (!scriptData) {
      throw new Error("Script generation failed after retries and fallback");
    }

    // Store the script in the videoScripts table
    const scriptId: Id<"videoScripts"> = await ctx.runMutation(
      internal.videosPipeline.scriptMutations.storeScript,
      {
        jobId: args.jobId,
        totalDuration: scriptData.totalDuration,
        voiceoverScript: scriptData.voiceoverScript,
        scenes: scriptData.scenes,
        colorPalette: scriptData.colorPalette,
        imagePrompts: scriptData.imagePrompts,
      }
    );

    // Update job with scriptId
    await ctx.runMutation(internal.videosPipeline.scriptMutations.linkScriptToJob, {
      jobId: args.jobId,
      scriptId,
    });

    return {
      scriptId,
      imagePrompts: scriptData.imagePrompts,
      voiceoverScript: scriptData.voiceoverScript,
    };
  },
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScriptScene {
  id: string;
  duration: number;
  voiceover?: string;
  onScreenText: {
    headline?: string;
    subhead?: string;
    bulletPoints?: string[];
    emphasis?: string[];
  };
  visualDirection: string;
  mood: string;
}

interface ScriptOutput {
  totalDuration: number;
  voiceoverScript: string;
  scenes: ScriptScene[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  imagePrompts: string[];
}

// ─── OpenRouter API Call ────────────────────────────────────────────────────

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<ScriptOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY not configured. Add it to your Convex deployment settings."
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  // Parse JSON from response
  const parsed = JSON.parse(content) as ScriptOutput;

  // Basic validation
  if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Invalid script: no scenes found");
  }
  if (!parsed.colorPalette || !parsed.voiceoverScript) {
    throw new Error("Invalid script: missing colorPalette or voiceoverScript");
  }

  return parsed;
}

// ─── Prompt Builders ────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a video script writer for Pause Play Repeat, a music production education and creator platform. You write structured video scripts that will be turned into animated Remotion videos.

## Output Format
Return a valid JSON object with this exact structure:
{
  "totalDuration": <number in seconds>,
  "voiceoverScript": "<full narration text, all scenes combined>",
  "scenes": [
    {
      "id": "<unique scene id like 'hook', 'problem', 'solution', 'proof', 'cta'>",
      "duration": <seconds>,
      "voiceover": "<narration for this scene>",
      "onScreenText": {
        "headline": "<main text on screen>",
        "subhead": "<secondary text>",
        "bulletPoints": ["<optional bullet points>"],
        "emphasis": ["<words to emphasize/animate>"]
      },
      "visualDirection": "<description of what the scene should look like visually>",
      "mood": "<one of: intrigue, frustration, excitement, authority, urgency, celebration, educational>"
    }
  ],
  "colorPalette": {
    "primary": "<hex color>",
    "secondary": "<hex color>",
    "accent": "<hex color>",
    "background": "<hex color, usually dark like #0a0a0a>"
  },
  "imagePrompts": [
    "<Fal.ai image generation prompt for each scene that needs an image>"
  ]
}

## Scene Types & Pacing
- Hook (3-5s): Grab attention immediately. Bold claim or provocative question.
- Problem (5-10s): Paint the pain. Make the viewer feel understood.
- Solution (8-15s): Introduce the course/product as the answer.
- Proof (5-10s): Social proof — enrollments, ratings, reviews, sales numbers.
- Features (8-15s): Key modules/features with brief descriptions.
- CTA (5-8s): Clear call-to-action. Urgency or value reinforcement.

## Color Palette Selection
- Mixing/mastering topics: warm oranges #f97316, reds #ef4444, golds #eab308
- Synthesis/sound design: cyans #22d3ee, purples #7c3aed, pinks #ec4899
- Business/marketing: indigo #6366f1, emerald #22c55e
- General/default: indigo #6366f1 + purple #7c3aed

## Image Prompt Guidelines
Write prompts for cinematic, moody images. Always include:
- "high quality, cinematic lighting, dark moody atmosphere, professional, 8k"
- Be specific to the music production context
- 1 image per scene maximum, skip scenes that are text-only

## Writing Style
- Write for music producers (ages 18-35)
- Be direct, confident, slightly provocative
- Avoid generic marketing language
- Use music production terminology naturally
- Short punchy sentences for hooks, longer for educational content`;
}

function buildUserPrompt(context: VideoContext): string {
  let prompt = `Write a video script based on the following:\n\n`;
  prompt += `**Creator's prompt:** "${context.prompt}"\n`;
  prompt += `**Target duration:** ${context.targetDuration} seconds\n`;
  prompt += `**Aspect ratio:** ${context.aspectRatio}\n`;
  if (context.style) prompt += `**Style:** ${context.style}\n`;
  prompt += `\n`;

  if (context.course) {
    const c = context.course;
    prompt += `## Course Data\n`;
    prompt += `- Title: ${c.title}\n`;
    if (c.description) prompt += `- Description: ${c.description}\n`;
    if (c.price) prompt += `- Price: $${c.price}\n`;
    if (c.category) prompt += `- Category: ${c.category}\n`;
    if (c.skillLevel) prompt += `- Skill Level: ${c.skillLevel}\n`;
    prompt += `- Modules: ${c.moduleCount} (${c.modules.map((m) => m.title).join(", ")})\n`;
    prompt += `- Total Lessons: ${c.lessonCount}\n`;
    prompt += `- Enrollments: ${c.enrollmentCount}\n`;
    if (c.averageRating) prompt += `- Average Rating: ${c.averageRating.toFixed(1)}/5\n`;
    if (c.reviewCount) prompt += `- Reviews: ${c.reviewCount}\n`;
    if (c.topReview) prompt += `- Top Review: "${c.topReview}"\n`;
    prompt += `\n`;
  }

  if (context.product) {
    const p = context.product;
    prompt += `## Product Data\n`;
    prompt += `- Title: ${p.title}\n`;
    if (p.description) prompt += `- Description: ${p.description}\n`;
    prompt += `- Price: $${p.price}\n`;
    if (p.productType) prompt += `- Type: ${p.productType}\n`;
    if (p.productCategory) prompt += `- Category: ${p.productCategory}\n`;
    prompt += `\n`;
  }

  if (context.store) {
    const s = context.store;
    prompt += `## Creator Store\n`;
    prompt += `- Store Name: ${s.name}\n`;
    prompt += `- Store URL: academy.pauseplayrepeat.com/${s.slug}\n`;
    prompt += `\n`;
  }

  if (context.analytics.totalSales > 0 || context.analytics.totalReviews > 0) {
    prompt += `## Social Proof\n`;
    if (context.analytics.totalSales > 0)
      prompt += `- Total Sales: ${context.analytics.totalSales}\n`;
    if (context.analytics.totalReviews > 0)
      prompt += `- Total Reviews: ${context.analytics.totalReviews}\n`;
    if (context.analytics.averageRating)
      prompt += `- Average Rating: ${context.analytics.averageRating.toFixed(1)}/5\n`;
    prompt += `\n`;
  }

  prompt += `Generate the video script now. Ensure total scene durations add up to approximately ${context.targetDuration} seconds.`;
  return prompt;
}

function buildSimplifiedUserPrompt(context: VideoContext): string {
  const title = context.course?.title || context.product?.title || "product";
  return `Write a simple ${context.targetDuration}-second promo video script for "${title}". Use 4-5 scenes: hook, problem, solution, proof, CTA. Keep it concise. Return valid JSON matching the required format.`;
}

// ─── Fallback Script ────────────────────────────────────────────────────────

function buildFallbackScript(context: VideoContext): ScriptOutput {
  const title = context.course?.title || context.product?.title || "our latest course";
  const price = context.course?.price || context.product?.price || 0;
  const duration = context.targetDuration;

  const hookDur = Math.round(duration * 0.08);
  const problemDur = Math.round(duration * 0.17);
  const solutionDur = Math.round(duration * 0.33);
  const proofDur = Math.round(duration * 0.25);
  const ctaDur = duration - hookDur - problemDur - solutionDur - proofDur;

  return {
    totalDuration: duration,
    voiceoverScript: `Ready to level up your production? ${title} gives you everything you need to take your sound to the next level. Enroll now.`,
    scenes: [
      {
        id: "hook",
        duration: hookDur,
        voiceover: "Ready to level up your production?",
        onScreenText: {
          headline: "Level Up Your Production",
          emphasis: ["Level Up"],
        },
        visualDirection: "Dark background with subtle glow, bold text entrance",
        mood: "intrigue",
      },
      {
        id: "problem",
        duration: problemDur,
        voiceover: "Most producers struggle without the right guidance.",
        onScreenText: {
          headline: "Stop Guessing.",
          subhead: "Start Knowing.",
        },
        visualDirection: "Moody, dark tones with text revealing pain points",
        mood: "frustration",
      },
      {
        id: "solution",
        duration: solutionDur,
        voiceover: `${title} gives you everything you need.`,
        onScreenText: {
          headline: title,
          subhead: "Your complete guide",
        },
        visualDirection: "Bright accent colors revealing course content",
        mood: "excitement",
      },
      {
        id: "proof",
        duration: proofDur,
        voiceover: "Join thousands of producers already learning.",
        onScreenText: {
          headline: "Trusted by Producers",
        },
        visualDirection: "Stats and social proof with animated counters",
        mood: "authority",
      },
      {
        id: "cta",
        duration: ctaDur,
        voiceover: "Enroll now.",
        onScreenText: {
          headline: "Start Today",
          subhead: price > 0 ? `Only $${price}` : "Free",
        },
        visualDirection: "Strong CTA with brand colors, urgency",
        mood: "urgency",
      },
    ],
    colorPalette: {
      primary: "#6366f1",
      secondary: "#7c3aed",
      accent: "#22d3ee",
      background: "#0a0a0a",
    },
    imagePrompts: [
      `Music producer in dark studio with dramatic lighting, cinematic, professional, 8k`,
      `Abstract audio waveform visualization, glowing neon lines on dark background, cinematic lighting, 8k`,
      `Professional mixing console in dim studio, warm lighting, high quality, cinematic, 8k`,
    ],
  };
}
