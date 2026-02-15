"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

/**
 * Generate ONE universal script + audio using Blotato API + OpenAI + ElevenLabs
 * Same script works for Instagram, TikTok, AND YouTube
 */
export const generateUniversalPluginScript = action({
  args: {
    clerkId: v.string(),
    pluginId: v.id("plugins"),
    generateAudio: v.optional(v.boolean()), // Optional: generate audio automatically
    voiceId: v.optional(v.string()), // Optional: specific ElevenLabs voice
  },
  returns: v.object({
    success: v.boolean(),
    script: v.optional(v.string()),
    audioScript: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    script?: string;
    audioScript?: string;
    audioUrl?: string;
    storageId?: string;
    error?: string;
  }> => {
    try {
      // Verify admin access
      const user: any = await ctx.runQuery(api.users.getUserFromClerk, {
        clerkId: args.clerkId,
      });

      if (!user?.admin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get plugin details
      const plugin: any = await ctx.runQuery(api.plugins.getPluginById, {
        pluginId: args.pluginId,
      });

      if (!plugin) {
        throw new Error("Plugin not found");
      }

      // Step 1: Prepare plugin content (like copying manual content)
      const pluginContent = `
# ${plugin.name}
${plugin.author ? `by ${plugin.author}` : ""}

## Description
${plugin.description || "Professional music production plugin"}

## Key Features
- ${plugin.typeName || "Audio Processing"}
- ${plugin.categoryName || "Music Production"}
- ${plugin.pricingType} ${plugin.price ? `($${plugin.price})` : ""}

## Technical Details
This plugin is designed for music producers and audio engineers looking to enhance their production workflow with professional-grade audio processing tools.
      `.trim();

      // Step 2: Call Blotato API (optional)
      let blotatoScript = pluginContent;
      if (BLOTATO_API_KEY) {
        blotatoScript = await generateBlotatoScript(pluginContent, BLOTATO_API_KEY);
      }

      // Step 3: Refine with OpenAI to match your EXACT style
      const refinedScript = await refineScriptWithOpenAI(blotatoScript, plugin);

      // Step 4: Prepare clean audio script
      const audioScript = refinedScript
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .trim();

      // Step 5: Generate audio with ElevenLabs (if requested)
      let audioUrl: string | undefined;
      let storageId: string | undefined;

      if (args.generateAudio) {
        const audioResult = await generateAudioWithElevenLabs(
          audioScript,
          args.voiceId || "pNInz6obpgDQGcFmaJgB", // Default: Adam voice
          ctx,
          plugin.name
        );

        if (audioResult.success) {
          audioUrl = audioResult.audioUrl;
          storageId = audioResult.storageId;
        } else {
          console.warn("⚠️ Audio generation failed:", audioResult.error);
        }
      }

      return {
        success: true,
        script: refinedScript,
        audioScript,
        audioUrl,
        storageId,
      };
    } catch (error: any) {
      console.error("❌ Script generation failed:", error);
      return {
        success: false,
        error: error.message || "Failed to generate video script",
      };
    }
  },
});

/**
 * Helper: Generate script using Blotato API
 */
async function generateBlotatoScript(
  content: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch("https://help.blotato.com/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        content,
        format: "script",
      }),
    });

    if (!response.ok) {
      throw new Error(`Blotato API error: ${response.status}`);
    }

    const data = await response.json();
    return (data as any)?.script || (data as any)?.content || content;
  } catch (error: any) {
    console.error(`❌ Blotato generation failed:`, error.message);
    return content; // Fallback to original content
  }
}

/**
 * Helper: Refine Blotato script with OpenAI to match user's EXACT style
 */
async function refineScriptWithOpenAI(
  blotatoScript: string,
  plugin: any
): Promise<string> {
  const systemPrompt = `You are a professional script writer for music production content on social media (Instagram, TikTok, YouTube Shorts).

Your writing style EXACTLY matches this example:

"If your mix sounds uneven or muddy, it's probably your dynamics, not your EQ. Most producers rely on one compressor for the whole mix, but that's where everything goes wrong. Ableton's Multiband Dynamics gives you total control by splitting your sound into three bands, low, mid, and high, and letting you process each one differently. Each band includes four types of dynamic control: downward compression to tame peaks, upward compression to lift quiet details, downward expansion to reduce noise, and upward expansion to enhance impact. That's six processors working together in one plugin. You can de-ess vocals by compressing only the highs, tighten muddy lows with focused compression, or bring back energy in a flattened mix using upward expansion. Every parameter matters, threshold, ratio, attack, release, and crossover points. Solo each band to actually hear what you're changing. Want your vocal to breathe while the bass stays tight? Use mid-band upward compression. Want your drums to punch again? Expand the highs slightly. The sidechain input makes it even more powerful, duck your bass from the kick or shape dynamics based on another track entirely. Stop flattening your sound with a single compressor. Start sculpting your mix by frequency. Want to master Ableton? Like and Follow, then Comment "Ableton" and we'll DM you our free Ableton Live tools and resources to help you master dynamic mixing."

STYLE RULES:
1. Start with a PROBLEM (what's wrong with their mix/production)
2. Identify the COMMON MISTAKE most producers make
3. Introduce the plugin as the SOLUTION with specific technical details
4. List ALL key features and parameters (threshold, ratio, attack, release, etc.)
5. Give 2-3 SPECIFIC use cases ("You can X, Y, or Z")
6. Ask rhetorical questions ("Want your vocal to breathe while the bass stays tight?")
7. Give direct instructions ("Stop X. Start Y.")
8. End with EXACT CTA format: "Want to master [topic]? Like and Follow, then Comment '[keyword]' and we'll DM you our free [topic] tools and resources to help you master [specific skill]."

LENGTH: 60-90 seconds when spoken (same script for all platforms)
TONE: Direct, conversational, technical but accessible
FORMAT: One continuous paragraph, natural flow`;

  const userPrompt = `Refine this Blotato script for the plugin "${plugin.name}" to match the EXACT style above:

BLOTATO GENERATED SCRIPT:
${blotatoScript}

PLUGIN INFO:
- Name: ${plugin.name}
- Type: ${plugin.typeName || "Audio Plugin"}
- Category: ${plugin.categoryName || "Music Production"}
- Author: ${plugin.author || "Professional Audio"}
- Price: ${plugin.pricingType} ${plugin.price ? `($${plugin.price})` : ""}

REQUIREMENTS:
1. Match the EXACT style from the example above
2. Start with a problem producers face
3. Call out the common mistake
4. Position ${plugin.name} as the solution
5. List specific parameters and controls
6. Give 2-3 real use cases
7. Use rhetorical questions
8. End with: "Want to master [production topic]? Like and Follow, then Comment '${plugin.name}' and we'll DM you our free ${plugin.name} tools and resources to help you master [specific skill]."
9. ONE continuous paragraph (no line breaks except for readability)
10. Technical but conversational
11. 60-90 seconds when spoken

Generate the refined script now:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    return completion.choices[0].message.content || blotatoScript;
  } catch (error: any) {
    console.error(`❌ OpenAI refinement failed:`, error.message);
    return blotatoScript; // Return Blotato version as fallback
  }
}

/**
 * Helper: Generate audio using ElevenLabs API
 */
async function generateAudioWithElevenLabs(
  text: string,
  voiceId: string,
  ctx: any,
  pluginName: string
): Promise<{
  success: boolean;
  audioUrl?: string;
  storageId?: string;
  error?: string;
}> {
  if (!ELEVENLABS_API_KEY) {
    return {
      success: false,
      error: "ELEVENLABS_API_KEY not configured",
    };
  }

  try {
    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5", // Fast, high-quality model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Store in Convex storage
    const storageId = await ctx.storage.store(
      new Blob([audioBuffer], { type: "audio/mpeg" })
    );

    // Get URL
    const audioUrl = await ctx.storage.getUrl(storageId);

    return {
      success: true,
      audioUrl: audioUrl || undefined,
      storageId,
    };
  } catch (error: any) {
    console.error("❌ ElevenLabs audio generation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate audio",
    };
  }
}

