"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { callLLM, safeParseJson } from "./llmClient";
import { type ModelId } from "./types";
import { createFalClient } from "@fal-ai/client";

const ANDREW_1_VOICE_ID = "IXQAN2tgDlb8raWmXvzP";
const DEFAULT_MODEL: ModelId = "gemini-2.5-flash";

const TIKTOK_PROMPT = `# CONTEXT

Infer the topic from the sources provided.

# WRITING STYLE

Here's how you always write:

<writing_style>

- Your writing style is spartan and informative.
- Use clear, simple language.
- Employ short, impactful sentences.
- Incorporate bullet points for easy readability.
- Use frequent line breaks to separate ideas.
- Use active voice; avoid passive voice.
- Focus on practical, actionable insights.
- Use specific examples and personal experiences to illustrate points.
- Incorporate data or statistics to support claims when possible.
- Ask thought-provoking questions to encourage reader reflection.
- Use "you" and "your" to directly address the reader.
- Avoid metaphors and clichés.
- Avoid generalizations.
- Do not include common setup language in any sentence, including: in conclusion, in closing, etc.
- Do not output warnings or notes—just the output requested.
- Do not use hashtags.
- Do not use semicolons.
- Do not use emojis.
- Do not use asterisks.
- Do not use adjectives and adverbs.
- Do NOT use these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, you're not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, enrich, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it. remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, bustling, opened up, powerful, inquiries, ever-evolving"

</writing_style>

# PLANNING

Your goal is to write a viral social media post based on the provided sources.

1. Analyze the provided sources thoroughly.
2. Study the <example1> and <example2> posts below carefully. You will be asked to replicate their:
    - Overall structure.
    - Tone and voice.
    - Formatting (including line breaks and spacing).
    - Length (aim for a similarly detailed post).
    - Absence of emojis.
    - Use of special characters (if any).
    - Emotional resonance.

<example1>
We all know healthcare in the US is super broken. 

This is a fascinating application of AI where this woman is using AI to help you fight health insurance denials. 

I didn't know this, but health insurers reject about one in seven claims for treatment. 

And even though you can file an appeal, doctors often just don't have time. 

They're swamped with other stuff. 

And you, as a consumer, you don't know how to do it. 

It's a lot of paperwork, it's complicated. 

Fight health insurance is an open source platform that takes advantage of AI to help you generate health insurance appeals

And she has done this herself, and so she has experience and she knows how it worked, how to navigate it. 

Slogan is make your health insurance company cry too. 

And the whole premise is that many health insurance denials can be successfully appealed. 

You just need to know what to write, how to do it, who to send it to.
</example1>

<example2>
Here are 8 youtube channels that will teach you more skills than a four year college degree. 

If you're not using YouTube for learning, you are literally falling behind millions of other people that are using it to learn to code, learn about AI, learn about chatGPT, learn about how to build a side hustle, learn about entrepreneurship.

Save this video so you can go back and check out all these channels.

The first channel is called MIT Open Courseware. It's run by MIT the Massachusetts Institute Technology. They're one of the best colleges in the entire world and all their content is free.

The second YouTube channel is called Free Code Camp and that's where you can learn to code for free and they have a ton of different courses.

The third YouTube channel is called Big Think and they bring on lots of different experts that give educational content across all kinds of topics.

The fourth YouTube channel is YCombinator. It gives you everything you need to know about building a successful tech startup.

Fifth channel is smarter every day and it explores the world using science. Every single day, you'll learn something new about science.

Sixth channel is TED from the TED conference. Best leaders, thinkers, and doers around the world share information and insights for free.

7th Channel is called Crash Course for short and entertaining educational courses on a variety of different subjects channel.

8th Channel is Thomas Frank he teaches you productivity growth mindset and how to learn more effectively to reach your potential.

Save this video for the future so you can check out all these YouTube channels and learn really important stuff for free.

Get better every day, get smarter every day.

Hit follow if you want more content like this.
</example2>

# OUTPUT
Follow the GUIDELINES below to write the post. Use your analysis from step 1 and step 2. Use the provided sources as the foundation for your post, expanding on it significantly while maintaining the style and structure of the examples provided from step 2. You MUST use information from the provided sources. Make sure you adhere to your <writing_style>.

Here are the guidelines:
<guidelines>
Use 8th grade reading level. The first sentence should be bold, controversial, and scroll-stopping.
</guidelines>
Take a deep breath and take it step-by-step!

# INPUT
Use the following information sources:
`;

const YOUTUBE_PROMPT = `# CONTEXT

Infer the topic from the sources provided.

# WRITING STYLE

Here's how you always write:

<writing_style>

- Your writing style is conversational like a Youtube video.
- Use clear, simple language.
- Use active voice; avoid passive voice.
- Focus on practical, actionable insights.
- Use specific examples to illustrate points.
- Avoid metaphors and clichés.
- Avoid generalizations.
- Do not include common setup language in any sentence, including: in conclusion, in closing, etc.
- Do not output warnings or notes—just the output requested.
- Do not use hashtags.
- Do not use semicolons.
- Do not use emojis.
- Do not use asterisks.
- Do NOT use these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, you're not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, enrich, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it. remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, bustling, opened up, powerful, inquiries, ever-evolving, revolutionary, alike"

</writing_style>

# PLANNING

Your goal is to write a Youtube video script based on the provided sources.

1. Analyze the provided sources thoroughly.
2. Study <example1> and <example2> carefully. You will be asked to replicate their:
    - Overall structure.
    - Tone and voice.
    - Formatting (including line breaks and spacing).
    - Length (aim for a similarly detailed post).
    - Absence of emojis.
    - Use of special characters (if any).
    - Emotional resonance.

<example1>
Most people fail at social media because they focus on the wrong metrics. It's frustrating when you spend hours on content, only to get zero views. If you're constantly creating and still not getting views, you're probably screwing up something major.

When you get this right, you'll see consistent growth in followers who actually care about you.

But if you don't fix it, you'll keep wasting time on content nobody sees, while slowly burning out.
</example1>

<example2>
Starting with zero followers feels impossible, but it's not. Every big creator you see started at the same point.

The biggest mistake people make when starting is trying to do too much at once—posting on every platform, copying trends, and hoping for the best. But social media isn't about doing everything; it's about doing one thing well. Start by picking one platform and one niche you're genuinely passionate about. If you love fitness, start with short workout tips on TikTok. Or if you're into tech, review your favorite tech toys on YouTube. Focus on providing value to your audience—entertaining, educating, or inspiring them. Track what works and double down on it. Yes, it takes time, but consistency will set you apart. Remember, even 100 loyal followers are more valuable than 10,000 people who don't care about you.

Start small: choose one platform, one niche, and show up every day. Track your progress, adjust your strategy, and watch your audience grow.

When you apply this approach, you'll start to see results—and once you do, scaling becomes the next exciting challenge.
</example2>

# OUTPUT
Follow the GUIDELINES below to write the post. You MUST use information from the provided sources. Make sure you adhere to your <writing_style>.

Here are the guidelines:
<guidelines>
# TASK 1

Write a Youtube video introduction about the provided sources following this structure, and use <example1> as an example:

1. Write 3 sentences clearly explaining the specific problem the audience is struggling with and why it's hard.

2. Write 1 sentence to illustrate a specific benefit or result they achieve by solving the problem. Be clear, specific, and actionable.

3: Write 1 sentence to highlight bad things that will continue or happen if the problem isn't solved. Be bold and specific statement in order to motivate viewers to act now.

# TASK 2

Analyze THREE key points from the provided sources. You must select exactly THREE.

FOR EACH key point, follow the 4-step framework below and use <example2> as an example:

1. State what the audience will learn. Write 3 sentences to set the background and why it's important.
2. Write 5-10 sentences that build anticipation by presenting a big problem, then state your position, provide reasons for it, address counterarguments, and support everything with concrete examples or counterexamples.
3.  Write 2 sentences emphasizing the key insight or actionable advice that clearly resolve the problem.
4. Write 1 sentence to transition smoothly to the next point.

Finally, conclude with a 1 sentence summary of the main takeaway.

Your last sentence should be a 1-sentence CTA to get the viewer to subscribe.
</guidelines>
Take a deep breath and take it step-by-step!

# INPUT
Use the following information sources:
`;

const INSTAGRAM_PROMPT = `# CONTEXT

Infer the topic from the sources provided.

# WRITING STYLE

Here's how you always write:

<writing_style>

- Your writing style is spartan and informative.
- Use clear, simple language.
- Employ short, impactful sentences.
- Incorporate bullet points for easy readability.
- Use frequent line breaks to separate ideas.
- Use active voice; avoid passive voice.
- Focus on practical, actionable insights.
- Use specific examples and personal experiences to illustrate points.
- Incorporate data or statistics to support claims when possible.
- Ask thought-provoking questions to encourage reader reflection.
- Use "you" and "your" to directly address the reader.
- Avoid metaphors and clichés.
- Avoid generalizations.
- Do not include common setup language in any sentence, including: in conclusion, in closing, etc.
- Do not output warnings or notes—just the output requested.
- Do not use hashtags.
- Do not use semicolons.
- Do not use emojis.
- Do not use asterisks.
- Do not use adjectives and adverbs.
- Do NOT use these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, you're not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, enrich, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it. remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, bustling, opened up, powerful, inquiries, ever-evolving"

</writing_style>

# PLANNING

Your goal is to write a viral social media post based on the provided sources.

1. Analyze the provided sources thoroughly.
2. Study the <example1> and <example2> posts below carefully. You will be asked to replicate their:
    - Overall structure.
    - Tone and voice.
    - Formatting (including line breaks and spacing).
    - Length (aim for a similarly detailed post).
    - Absence of emojis.
    - Use of special characters (if any).
    - Emotional resonance.

<example1>
Dreaming can only take you so far. There comes a point where you have to stop planning and start DOING.

Good things come to those who stop waiting for the "right time" or the "perfect time".

Get rid of the notion that things need to be perfect from the get-go. Mastery comes with practice and WORK.

Happy #mondaymotivation! Time to get out there and make it happen!! #entrepreuneur #internetmarketing #marketingdigital #ecommerce
</example1>

<example2>
"If you'd give all your money up to be 20 again, then why did you sacrifice your 20s for money?"

Because it wasn't a sacrifice.
We learned to play the game.
And once you beat a level of the game, you'd happily give back your coins to play it again.
</example2>

# OUTPUT
Follow the GUIDELINES below to write the post. Use your analysis from step 1 and step 2. Use the provided sources as the foundation for your post, expanding on it significantly while maintaining the style and structure of the examples provided from step 2. You MUST use information from the provided sources. Make sure you adhere to your <writing_style>.

Here are the guidelines:
<guidelines>
You are an expert Instagram marketer writing a viral Instagram caption. Research relevant hashtags and add them to the end.

Start by challenging a popular belief, sharing a surprising fact, asking a direct question, or giving a bold opinion on the topic (without giving away the answer). Use clear imagery, specific numbers, or timeframes. Keep it short: 5-8 words.
</guidelines>
Take a deep breath and take it step-by-step!

# INPUT
Use the following information sources:
`;

const COMBINE_SCRIPTS_PROMPT = `You are an expert social media content strategist. Your task is to combine three platform-specific scripts (TikTok, YouTube, Instagram) into one cohesive, unified script that works well for video content and voiceover.

# GUIDELINES

1. Take the BEST elements from each script
2. Create a natural flow that works for spoken delivery
3. The final script should be:
   - 60-90 seconds when read aloud (approximately 150-200 words)
   - Conversational and engaging
   - Easy to read/speak naturally
   - Include natural pauses (use line breaks)
4. DO NOT include hashtags in the main script
5. DO NOT include emojis
6. Focus on VALUE and ACTIONABLE insights
7. End with a natural transition to the CTA (but don't include the CTA itself - that will be added separately)

# TEXT-TO-SPEECH OPTIMIZATION (CRITICAL)

The script will be read aloud by AI text-to-speech. You MUST:
- Write out all abbreviations in full (e.g., "W" becomes "whole step", "H" becomes "half step")
- Avoid mathematical notation or formulas (e.g., "C + W = D" should be "start on C, move up a whole step to D")
- Write numbers as words when under 100 (e.g., "five" not "5")
- Avoid parentheses - rephrase to flow naturally
- Avoid symbols like +, =, /, @ in the middle of sentences
- Write musical notes conversationally (e.g., "the note C" not just "C")
- Spell out any acronyms the first time (e.g., "DAW, which stands for Digital Audio Workstation")
- Avoid bullet points or lists - use flowing sentences instead

# OUTPUT FORMAT
Return ONLY the combined script text, nothing else. No explanations, no headers, just the script.
`;

const IMAGE_PROMPT_GENERATOR = `You are an expert at creating image prompts for educational content illustrations. Given a social media script about music production, identify 3-5 key concepts or sentences that would benefit from visual illustration.

For each concept, create an image generation prompt following these rules:

# MANDATORY VISUAL STYLE: Excalidraw Hand-Drawn Aesthetic

- Simple hand-drawn sketch appearance
- Excalidraw-style illustration (like the popular whiteboard tool)
- Slightly wobbly, imperfect outlines (not perfectly straight lines)
- Hand-sketched look with organic, natural line quality
- Flat colors from PPR Academy brand palette:
  - Primary: Indigo Blue (#818CF8), Rich Purple (#7C6CEF), Deep Purple (#6366F1)
  - Accents: Sky Cyan (#7DD3FC), Vibrant Pink (#EC4899), Warm Orange (#F97316)
- Pure white or very light off-white background
- Clean, uncluttered composition

# OUTPUT FORMAT (JSON)
{
  "imagePrompts": [
    {
      "sentence": "The exact sentence or concept from the script",
      "prompt": "Excalidraw-style hand-drawn illustration showing [detailed description]. White background, flat indigo and purple colors, wobbly sketch lines, simple icons and shapes. Educational diagram style.",
      "aspectRatio": "16:9" or "9:16"
    }
  ]
}

Alternate between 16:9 (landscape for YouTube thumbnails) and 9:16 (vertical for TikTok/Reels).
`;

export const generatePlatformScripts = action({
  args: {
    sourceContent: v.string(),
    courseTitle: v.optional(v.string()),
    chapterTitle: v.optional(v.string()),
  },
  returns: v.object({
    tiktokScript: v.string(),
    youtubeScript: v.string(),
    instagramScript: v.string(),
  }),
  handler: async (ctx, args) => {
    const { sourceContent, courseTitle, chapterTitle } = args;

    const contextHeader = [
      courseTitle && `Course: ${courseTitle}`,
      chapterTitle && `Chapter: ${chapterTitle}`,
    ]
      .filter(Boolean)
      .join("\n");

    const fullSource = contextHeader ? `${contextHeader}\n\n${sourceContent}` : sourceContent;

    console.log(`🎬 Generating platform scripts for content (${sourceContent.length} chars)`);

    const [tiktokResponse, youtubeResponse, instagramResponse] = await Promise.all([
      callLLM({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: `${TIKTOK_PROMPT}\n${fullSource}` }],
        temperature: 0.7,
        maxTokens: 2000,
      }),
      callLLM({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: `${YOUTUBE_PROMPT}\n${fullSource}` }],
        temperature: 0.7,
        maxTokens: 3000,
      }),
      callLLM({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: `${INSTAGRAM_PROMPT}\n${fullSource}` }],
        temperature: 0.7,
        maxTokens: 1500,
      }),
    ]);

    console.log(`   ✅ All 3 platform scripts generated`);

    return {
      tiktokScript: tiktokResponse.content,
      youtubeScript: youtubeResponse.content,
      instagramScript: instagramResponse.content,
    };
  },
});

export const combineScripts = action({
  args: {
    tiktokScript: v.string(),
    youtubeScript: v.string(),
    instagramScript: v.string(),
    ctaText: v.optional(v.string()),
  },
  returns: v.object({
    combinedScript: v.string(),
    scriptWithCta: v.string(),
  }),
  handler: async (ctx, args) => {
    const { tiktokScript, youtubeScript, instagramScript, ctaText } = args;

    console.log(`🔗 Combining scripts into unified script`);

    const combinePrompt = `${COMBINE_SCRIPTS_PROMPT}

# TIKTOK SCRIPT:
${tiktokScript}

# YOUTUBE SCRIPT:
${youtubeScript}

# INSTAGRAM SCRIPT:
${instagramScript}

Create a unified script that takes the best from each:`;

    const response = await callLLM({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: combinePrompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    const combinedScript = response.content.trim();
    const scriptWithCta = ctaText ? `${combinedScript}\n\n${ctaText}` : combinedScript;

    console.log(`   ✅ Scripts combined (${combinedScript.length} chars)`);

    return {
      combinedScript,
      scriptWithCta,
    };
  },
});

export const generateImagePrompts = action({
  args: {
    script: v.string(),
    numImages: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      sentence: v.string(),
      prompt: v.string(),
      aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
    })
  ),
  handler: async (ctx, args) => {
    const { script, numImages = 5 } = args;

    console.log(`🖼️ Generating ${numImages} image prompts from script`);

    const response = await callLLM({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: `${IMAGE_PROMPT_GENERATOR}\n\nGenerate exactly ${numImages} image prompts for this script:\n\n${script}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: "json",
    });

    const parsed = safeParseJson<{
      imagePrompts: Array<{
        sentence: string;
        prompt: string;
        aspectRatio: "16:9" | "9:16";
      }>;
    }>(response.content, { imagePrompts: [] });

    console.log(`   ✅ Generated ${parsed.imagePrompts.length} image prompts`);

    return parsed.imagePrompts;
  },
});

export const generateSocialImage = action({
  args: {
    prompt: v.string(),
    aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
    sentence: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    storageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { prompt, aspectRatio, sentence } = args;

    console.log(`🎨 Generating social image (${aspectRatio})`);

    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      return {
        success: false,
        error: "FAL_KEY not configured in environment",
      };
    }

    try {
      const falClient = createFalClient();

      const result = await falClient.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt,
          num_images: 1,
          aspect_ratio: aspectRatio,
          output_format: "png",
          resolution: "1K",
          enable_web_search: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            update.logs.map((log) => log.message).forEach((msg) => console.log(`   📝 ${msg}`));
          }
        },
      });

      const imageData = result.data as {
        images?: Array<{ url: string; width?: number; height?: number }>;
      };

      if (!imageData?.images?.[0]?.url) {
        console.error("❌ No image URL in FAL response");
        return {
          success: false,
          error: "No image URL in FAL response",
        };
      }

      const imageUrl = imageData.images[0].url;
      console.log(`   ✅ Image generated: ${imageUrl.substring(0, 60)}...`);

      const storageId = await uploadImageToStorage(ctx, imageUrl);
      const convexUrl = await ctx.storage.getUrl(storageId);

      return {
        success: true,
        storageId,
        imageUrl: convexUrl || imageUrl,
      };
    } catch (error) {
      console.error("❌ FAL API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown FAL error",
      };
    }
  },
});

async function uploadImageToStorage(ctx: any, imageUrl: string): Promise<Id<"_storage">> {
  console.log(`   📥 Downloading image from: ${imageUrl.substring(0, 50)}...`);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  const uploadUrl = await ctx.storage.generateUploadUrl();

  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": imageBlob.type || "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = (await uploadResult.json()) as {
    storageId: Id<"_storage">;
  };
  console.log(`   ✅ Uploaded to Convex storage: ${storageId}`);
  return storageId;
}

export const generateSocialAudio = action({
  args: {
    script: v.string(),
    voiceId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    storageId: v.optional(v.id("_storage")),
    audioUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { script, voiceId = ANDREW_1_VOICE_ID } = args;

    console.log(`🎙️ Generating audio with voice ${voiceId}`);

    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      return {
        success: false,
        error: "ELEVEN_LABS_API_KEY not configured",
      };
    }

    try {
      const cleanedScript = script
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#\w+/g, "")
        .trim();

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedScript,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const audioArrayBuffer = await response.arrayBuffer();

      console.log(`   ✅ Audio generated (${Math.round(audioArrayBuffer.byteLength / 1024)}KB)`);

      const uploadUrl = await ctx.storage.generateUploadUrl();

      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/mpeg" },
        body: audioArrayBuffer,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload audio to Convex storage");
      }

      const { storageId } = (await uploadResult.json()) as {
        storageId: Id<"_storage">;
      };

      const audioUrl = await ctx.storage.getUrl(storageId);

      const estimatedDuration = Math.round(cleanedScript.split(/\s+/).length / 2.5);

      console.log(`   ✅ Audio uploaded: ${storageId}`);

      return {
        success: true,
        storageId,
        audioUrl: audioUrl || undefined,
        duration: estimatedDuration,
      };
    } catch (error) {
      console.error("❌ Audio generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown audio error",
      };
    }
  },
});

export const generateImageEmbedding = action({
  args: {
    imageUrl: v.string(),
    description: v.string(),
  },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    const { imageUrl, description } = args;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn("⚠️ No OpenAI key, returning empty embedding");
      return [];
    }

    try {
      const descriptionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Describe this educational illustration for semantic search. Context: ${description}. Be concise (2-3 sentences).`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 200,
        }),
      });

      if (!descriptionResponse.ok) {
        throw new Error(`Vision API error: ${descriptionResponse.status}`);
      }

      const descData = (await descriptionResponse.json()) as any;
      const imageDescription = descData.choices?.[0]?.message?.content || description;

      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: imageDescription,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }

      const embData = (await embeddingResponse.json()) as any;
      return embData.data?.[0]?.embedding || [];
    } catch (error) {
      console.error("Error generating image embedding:", error);
      return [];
    }
  },
});

export const extractHeadingsFromHtml = action({
  args: {
    html: v.string(),
  },
  returns: v.array(
    v.object({
      level: v.number(),
      text: v.string(),
      startIndex: v.number(),
      endIndex: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { html } = args;

    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    const headings: Array<{
      level: number;
      text: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    let match;
    let lastEndIndex = 0;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1], 10);
      const text = match[2].replace(/<[^>]*>/g, "").trim();

      if (headings.length > 0) {
        headings[headings.length - 1].endIndex = match.index;
      }

      headings.push({
        level,
        text,
        startIndex: match.index,
        endIndex: html.length,
      });
    }

    return headings;
  },
});

export const extractSectionContent = action({
  args: {
    html: v.string(),
    startIndex: v.number(),
    endIndex: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { html, startIndex, endIndex } = args;

    const sectionHtml = html.substring(startIndex, endIndex);

    const plainText = sectionHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return plainText;
  },
});

export const generatePostImageEmbeddings = action({
  args: {
    postId: v.id("socialMediaPosts"),
  },
  returns: v.object({
    success: v.boolean(),
    processedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const { postId } = args;

    const post = await ctx.runQuery(api.socialMediaPosts.getSocialMediaPostById, {
      postId,
    });

    if (!post) {
      return { success: false, processedCount: 0, errors: ["Post not found"] };
    }

    if (!post.images || post.images.length === 0) {
      return { success: false, processedCount: 0, errors: ["No images in post"] };
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return { success: false, processedCount: 0, errors: ["OpenAI API key not configured"] };
    }

    const errors: string[] = [];
    let processedCount = 0;
    const updatedImages = [...post.images];

    for (let i = 0; i < updatedImages.length; i++) {
      const image = updatedImages[i];

      if (image.embedding && image.embedding.length > 0) {
        processedCount++;
        continue;
      }

      if (!image.url) {
        continue;
      }

      try {
        console.log(`🧮 Generating embedding for image ${i + 1}/${updatedImages.length}`);

        const descriptionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Describe this educational illustration for semantic search. Context: ${image.sentence || image.prompt}. Be concise (2-3 sentences).`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: image.url },
                  },
                ],
              },
            ],
            max_tokens: 200,
          }),
        });

        if (!descriptionResponse.ok) {
          throw new Error(`Vision API error: ${descriptionResponse.status}`);
        }

        const descData = (await descriptionResponse.json()) as any;
        const imageDescription =
          descData.choices?.[0]?.message?.content || image.sentence || image.prompt;

        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: imageDescription,
          }),
        });

        if (!embeddingResponse.ok) {
          throw new Error(`Embedding API error: ${embeddingResponse.status}`);
        }

        const embData = (await embeddingResponse.json()) as any;
        const embedding = embData.data?.[0]?.embedding || [];

        if (embedding.length > 0) {
          updatedImages[i] = { ...image, embedding };
          processedCount++;
          console.log(`   ✅ Generated ${embedding.length}-dim embedding for image ${i + 1}`);
        }
      } catch (error) {
        const errorMsg = `Image ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    if (processedCount > 0) {
      await ctx.runMutation(api.socialMediaPosts.updateSocialMediaPostImages, {
        postId,
        images: updatedImages,
      });
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors,
    };
  },
});
export const searchPostImages = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      postId: v.id("socialMediaPosts"),
      imageIndex: v.number(),
      imageUrl: v.string(),
      prompt: v.string(),
      sentence: v.optional(v.string()),
      similarity: v.number(),
      postTitle: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const { userId, query, limit = 20 } = args;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn("⚠️ No OpenAI key, cannot search");
      return [];
    }

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      console.error("Failed to generate query embedding");
      return [];
    }

    const embData = (await embeddingResponse.json()) as any;
    const queryEmbedding = embData.data?.[0]?.embedding;

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    const posts = await ctx.runQuery(api.socialMediaPosts.getSocialMediaPostsByUser, {
      userId,
      limit: 100,
    });

    const results: Array<{
      postId: any;
      imageIndex: number;
      imageUrl: string;
      prompt: string;
      sentence: string | undefined;
      similarity: number;
      postTitle: string | undefined;
    }> = [];

    for (const post of posts) {
      if (!post.images) continue;

      for (let i = 0; i < post.images.length; i++) {
        const image = post.images[i];
        if (!image.embedding || image.embedding.length === 0 || !image.url) continue;

        const similarity = cosineSimilarity(queryEmbedding, image.embedding);

        results.push({
          postId: post._id,
          imageIndex: i,
          imageUrl: image.url,
          prompt: image.prompt,
          sentence: image.sentence,
          similarity,
          postTitle: post.title,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  },
});

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
