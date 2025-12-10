"use node";

/**
 * Blotato API Integration
 * 
 * Blotato is a social media management platform that provides APIs for:
 * - Scheduling posts to multiple platforms
 * - Publishing content immediately
 * - Managing connected social accounts
 * - Creating Twitter threads
 * 
 * API Documentation: https://blotato.com/developers
 * 
 * Environment Variables Required:
 * - BLOTATO_API_KEY: Your Blotato API key
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BlotatoAccount {
  id: string;
  platform: string;
  name: string;
  username?: string;
  profileImageUrl?: string;
  isConnected: boolean;
}

export interface BlotatoPost {
  id: string;
  accountId: string;
  text: string;
  mediaUrls?: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledTime?: string;
  publishedAt?: string;
  error?: string;
}

export interface BlotatoThread {
  id: string;
  accountId: string;
  tweets: Array<{
    text: string;
    mediaUrls?: string[];
  }>;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledTime?: string;
  publishedAt?: string;
}

export interface BlotatoResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

const BLOTATO_API_BASE = "https://api.blotato.com/v1";

async function blotatoFetch<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<BlotatoResponse<T>> {
  const apiKey = process.env.BLOTATO_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "Blotato API key not configured. Please add BLOTATO_API_KEY to your environment variables.",
    };
  }

  try {
    const response = await fetch(`${BLOTATO_API_BASE}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Blotato API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calling Blotato API",
    };
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * List all connected social media accounts
 */
export async function listAccounts(): Promise<BlotatoResponse<BlotatoAccount[]>> {
  return blotatoFetch<BlotatoAccount[]>("/accounts");
}

/**
 * Publish a post immediately to a connected account
 */
export async function publishPost(params: {
  accountId: string;
  text: string;
  mediaUrls?: string[];
}): Promise<BlotatoResponse<BlotatoPost>> {
  return blotatoFetch<BlotatoPost>("/posts", {
    method: "POST",
    body: {
      account_id: params.accountId,
      text: params.text,
      media_urls: params.mediaUrls,
      publish_immediately: true,
    },
  });
}

/**
 * Schedule a post for a future time
 */
export async function schedulePost(params: {
  accountId: string;
  text: string;
  scheduledTime: string;
  mediaUrls?: string[];
}): Promise<BlotatoResponse<BlotatoPost>> {
  return blotatoFetch<BlotatoPost>("/posts", {
    method: "POST",
    body: {
      account_id: params.accountId,
      text: params.text,
      media_urls: params.mediaUrls,
      scheduled_time: params.scheduledTime,
    },
  });
}

/**
 * Create a Twitter thread (multiple tweets)
 */
export async function createThread(params: {
  accountId: string;
  tweets: Array<{
    text: string;
    mediaUrls?: string[];
  }>;
  scheduledTime?: string;
}): Promise<BlotatoResponse<BlotatoThread>> {
  return blotatoFetch<BlotatoThread>("/threads", {
    method: "POST",
    body: {
      account_id: params.accountId,
      tweets: params.tweets.map(t => ({
        text: t.text,
        media_urls: t.mediaUrls,
      })),
      scheduled_time: params.scheduledTime,
    },
  });
}

/**
 * Get a specific post by ID
 */
export async function getPost(postId: string): Promise<BlotatoResponse<BlotatoPost>> {
  return blotatoFetch<BlotatoPost>(`/posts/${postId}`);
}

/**
 * Get all scheduled posts
 */
export async function getScheduledPosts(): Promise<BlotatoResponse<BlotatoPost[]>> {
  return blotatoFetch<BlotatoPost[]>("/posts?status=scheduled");
}

// ============================================================================
// SCRIPT GENERATION (Local, doesn't require API)
// Uses professional prompts inspired by industry best practices
// ============================================================================

interface ScriptGenerationParams {
  topic: string;
  platform: string;
  style?: string;
  tone?: string;
}

/**
 * Core writing style rules (shared across platforms)
 */
const WRITING_STYLE_RULES = `
- Your writing style is spartan and informative.
- Use clear, simple language.
- Employ short, impactful sentences.
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
- Do not use semicolons.
- Do not use asterisks.
- Do not use adjectives and adverbs excessively.
- Do NOT use these words: can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, you're not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, enrich, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, bustling, opened up, powerful, inquiries, ever-evolving
`;

/**
 * Generate platform-specific character limits and best practices
 */
export function getPlatformConstraints(platform: string): {
  maxLength: number;
  hashtagLimit: number;
  bestPractices: string[];
  format: string;
} {
  const constraints: Record<string, ReturnType<typeof getPlatformConstraints>> = {
    tiktok: {
      maxLength: 2200,
      hashtagLimit: 0, // No hashtags per Blotato style
      bestPractices: [
        "Use 8th grade reading level",
        "First sentence should be bold, controversial, and scroll-stopping",
        "Short, punchy sentences",
        "Conversational like talking to a friend",
      ],
      format: "Bold opener → Problem → Solution/Story → CTA",
    },
    instagram: {
      maxLength: 2200,
      hashtagLimit: 5,
      bestPractices: [
        "Start by challenging a popular belief, sharing a surprising fact, asking a direct question, or giving a bold opinion",
        "Use clear imagery, specific numbers, or timeframes",
        "Keep hook short: 5-8 words",
        "No emojis in the main content",
      ],
      format: "Provocative hook (5-8 words) → Value/Story → Hashtags at end",
    },
    youtube: {
      maxLength: 5000,
      hashtagLimit: 0,
      bestPractices: [
        "Conversational like a YouTube video",
        "Problem → Benefit → Consequence structure for intro",
        "3 key points with the 4-step framework",
        "End with subscribe CTA",
      ],
      format: "Hook → 3 Key Points (Problem/Position/Insight/Transition) → CTA",
    },
    twitter: {
      maxLength: 280,
      hashtagLimit: 0,
      bestPractices: [
        "Lead with the most important point",
        "One clear idea per tweet",
        "Use numbers and lists when possible",
        "Punchy and direct",
      ],
      format: "Key insight or value in one punchy statement",
    },
    linkedin: {
      maxLength: 3000,
      hashtagLimit: 3,
      bestPractices: [
        "Start with a personal story or insight",
        "Use short paragraphs (1-2 lines)",
        "Include line breaks for readability",
        "Professional but authentic tone",
      ],
      format: "Hook → Personal story → Lesson learned → Question for engagement",
    },
    threads: {
      maxLength: 500,
      hashtagLimit: 0,
      bestPractices: [
        "Conversational tone",
        "Strong opening line",
        "Keep it concise",
        "More personal than Instagram",
      ],
      format: "Direct, conversational statement with personality",
    },
    facebook: {
      maxLength: 63206,
      hashtagLimit: 0,
      bestPractices: [
        "Longer form content performs well",
        "Ask questions to encourage comments",
        "Share personal experiences",
        "Story-driven format",
      ],
      format: "Story format with engagement question at the end",
    },
  };

  return constraints[platform.toLowerCase()] || constraints.twitter;
}

/**
 * Generate a system prompt for script generation
 * Uses professional prompts inspired by Blotato's approach
 */
export function getScriptGenerationPrompt(params: ScriptGenerationParams): string {
  const platform = params.platform.toLowerCase();
  
  // Platform-specific prompts
  if (platform === "instagram") {
    return getInstagramPrompt(params.topic);
  } else if (platform === "tiktok") {
    return getTikTokPrompt(params.topic);
  } else if (platform === "youtube") {
    return getYouTubePrompt(params.topic);
  } else {
    return getGenericPrompt(params);
  }
}

function getInstagramPrompt(topic: string): string {
  return `# CONTEXT
You are writing about: ${topic}

# WRITING STYLE
${WRITING_STYLE_RULES}
- Do not use emojis.
- Research relevant hashtags and add them to the end.

# PLANNING
Your goal is to write a viral Instagram caption.

1. Analyze the topic thoroughly.
2. Study these example posts carefully. Replicate their structure, tone, formatting, length, and emotional resonance:

<example1>
Dreaming can only take you so far. There comes a point where you have to stop planning and start DOING.

Good things come to those who stop waiting for the "right time" or the "perfect time".

Get rid of the notion that things need to be perfect from the get-go. Mastery comes with practice and WORK.

Happy #mondaymotivation! Time to get out there and make it happen!! #entrepreneur #musicproduction #producer
</example1>

<example2>
"If you'd give all your money up to be 20 again, then why did you sacrifice your 20s for money?"

Because it wasn't a sacrifice.

We learned to play the game.

And once you beat a level of the game, you'd happily give back your coins to play it again.
</example2>

# OUTPUT GUIDELINES
- Start by challenging a popular belief, sharing a surprising fact, asking a direct question, or giving a bold opinion on the topic (without giving away the answer)
- Use clear imagery, specific numbers, or timeframes
- Keep hook short: 5-8 words
- Add relevant hashtags at the end

Take a deep breath and write step-by-step!

# INPUT
Topic: ${topic}`;
}

function getTikTokPrompt(topic: string): string {
  return `# CONTEXT
You are writing about: ${topic}

# WRITING STYLE
${WRITING_STYLE_RULES}
- Do not use emojis.
- Do not use hashtags.

# PLANNING
Your goal is to write a viral TikTok script.

1. Analyze the topic thoroughly.
2. Study these example scripts carefully. Replicate their structure, tone, formatting, length, and emotional resonance:

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

If you're not using YouTube for learning, you are falling behind millions of other people using it to learn to code, learn about AI, learn about chatGPT, learn about how to build a side hustle, learn about entrepreneurship.

Save this video so you can go back and check out all these channels.

The first channel is called MIT Open Courseware. It's run by MIT the Massachusetts Institute Technology. They're one of the best colleges in the entire world and all their content is free.

The second YouTube channel is called Free Code Camp and that's where you learn to code for free and they have a ton of different courses.

Save this video for the future so you can check out all these YouTube channels and learn important stuff for free.

Get better every day, get smarter every day.

Hit follow if you want more content like this.
</example2>

# OUTPUT GUIDELINES
- Use 8th grade reading level
- The first sentence should be bold, controversial, and scroll-stopping
- Short sentences, frequent line breaks
- Conversational like talking to a friend
- End with a CTA (follow, save, comment)

Take a deep breath and write step-by-step!

# INPUT
Topic: ${topic}`;
}

function getYouTubePrompt(topic: string): string {
  return `# CONTEXT
You are writing about: ${topic}

# WRITING STYLE
- Your writing style is conversational like a YouTube video.
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
- Do NOT use these words: can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, you're not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, enrich, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, bustling, opened up, powerful, inquiries, ever-evolving, revolutionary, alike

# PLANNING
Your goal is to write a YouTube video script.

Study these examples carefully:

<example1>
Most people fail at social media because they focus on the wrong metrics. It's frustrating when you spend hours on content, only to get zero views. If you're constantly creating and still not getting views, you're probably screwing up something major.

When you get this right, you'll see consistent growth in followers who care about you.

But if you don't fix it, you'll keep wasting time on content nobody sees, while slowly burning out.
</example1>

<example2>
Starting with zero followers feels impossible, but it's not. Every big creator you see started at the same point.

The biggest mistake people make when starting is trying to do too much at once—posting on every platform, copying trends, and hoping for the best. But social media isn't about doing everything; it's about doing one thing well. Start by picking one platform and one niche you're genuinely passionate about. If you love fitness, start with short workout tips on TikTok. Or if you're into tech, review your favorite tech toys on YouTube. Focus on providing value to your audience—entertaining, educating, or inspiring them. Track what works and double down on it. Yes, it takes time, but consistency will set you apart. Remember, even 100 loyal followers are more valuable than 10,000 people who don't care about you.

Start small: choose one platform, one niche, and show up every day. Track your progress, adjust your strategy, and watch your audience grow.

When you apply this approach, you'll start to see results—and once you do, scaling becomes the next exciting challenge.
</example2>

# OUTPUT STRUCTURE

## TASK 1: INTRODUCTION
Write a YouTube video introduction following this structure:
1. Write 3 sentences clearly explaining the specific problem the audience is struggling with and why it's hard.
2. Write 1 sentence to illustrate a specific benefit or result they achieve by solving the problem. Be clear, specific, and actionable.
3. Write 1 sentence to highlight bad things that will continue or happen if the problem isn't solved. Be bold and specific to motivate viewers to act now.

## TASK 2: KEY POINTS
Analyze THREE key points from the topic.

FOR EACH key point, follow this 4-step framework:
1. State what the audience will learn. Write 3 sentences to set the background and why it's important.
2. Write 5-10 sentences that build anticipation by presenting a big problem, then state your position, provide reasons for it, address counterarguments, and support everything with concrete examples.
3. Write 2 sentences emphasizing the key insight or actionable advice that resolves the problem.
4. Write 1 sentence to transition smoothly to the next point.

## TASK 3: CONCLUSION
- 1 sentence summary of the main takeaway
- 1 sentence CTA to get the viewer to subscribe

Take a deep breath and write step-by-step!

# INPUT
Topic: ${topic}`;
}

function getGenericPrompt(params: ScriptGenerationParams): string {
  const constraints = getPlatformConstraints(params.platform);
  
  return `# CONTEXT
You are writing about: ${params.topic}

# WRITING STYLE
${WRITING_STYLE_RULES}

# PLATFORM: ${params.platform.toUpperCase()}
- Max Length: ${constraints.maxLength} characters
- Format: ${constraints.format}

Best Practices:
${constraints.bestPractices.map(p => `- ${p}`).join("\n")}

# OUTPUT
Write a viral ${params.platform} post about the topic.

YOUR RESPONSE MUST INCLUDE:
1. SCRIPT: The actual content/script to post
2. HOOK: The opening line/hook
3. CTA: Call-to-action

Take a deep breath and write step-by-step!

# INPUT
Topic: ${params.topic}`;
}

/**
 * Generate a multi-platform adaptation prompt
 */
export function getMultiPlatformPrompt(
  topic: string,
  platforms: string[],
  baseContent?: string
): string {
  const platformSpecs = platforms.map(p => {
    const constraints = getPlatformConstraints(p);
    return `${p.toUpperCase()}: Max ${constraints.maxLength} chars, Format: ${constraints.format}`;
  }).join("\n");

  return `# CONTEXT
You are adapting content for multiple platforms.

# WRITING STYLE
${WRITING_STYLE_RULES}

# TOPIC
${topic}

${baseContent ? `# BASE CONTENT TO ADAPT\n${baseContent}` : ""}

# PLATFORMS TO CREATE FOR
${platformSpecs}

# OUTPUT
For EACH platform, provide:
1. Platform name
2. Optimized post/script following platform conventions
3. Notes for that platform

Ensure each version:
- Fits the platform's character limits and culture
- Uses platform-native language and conventions
- Maintains the core message while adapting the presentation
- Includes appropriate CTAs for each platform

Take a deep breath and adapt step-by-step!`;
}

