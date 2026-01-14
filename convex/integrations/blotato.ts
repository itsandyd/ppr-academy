"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "../lib/rateLimiter";

// ============================================================================
// BLOTATO API INTEGRATION
// Based on: https://help.blotato.com/api/start
// ============================================================================

const BLOTATO_API_BASE = "https://backend.blotato.com/v2";

// Platform types supported by Blotato
export type BlotatoPlatform = 
  | "twitter" 
  | "instagram" 
  | "facebook" 
  | "linkedin" 
  | "tiktok" 
  | "youtube" 
  | "threads" 
  | "bluesky" 
  | "pinterest";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function blotatoFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const apiKey = process.env.BLOTATO_API_KEY;
  
  if (!apiKey) {
    throw new Error("BLOTATO_API_KEY environment variable is not set. Get your API key from Settings > API in Blotato.");
  }

  const response = await fetch(`${BLOTATO_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "blotato-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Blotato API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// ACTIONS - AI Agent Tools
// ============================================================================

/**
 * Get connected social accounts from Blotato
 */
export const getConnectedAccounts = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    accounts: v.optional(v.array(v.object({
      id: v.string(),
      platform: v.string(),
      name: v.string(),
      username: v.optional(v.string()),
    }))),
    error: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    try {
      const result = await blotatoFetch("/accounts");
      
      return {
        success: true,
        accounts: result.accounts?.map((acc: any) => ({
          id: acc.id,
          platform: acc.platform,
          name: acc.name || acc.username,
          username: acc.username,
        })) || [],
      };
    } catch (error) {
      console.error("Error fetching Blotato accounts:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch accounts",
      };
    }
  },
});

/**
 * Publish a post immediately to Blotato
 */
export const publishPost = action({
  args: {
    accountId: v.string(),
    platform: v.string(),
    text: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    // Platform-specific options
    pageId: v.optional(v.string()), // For Facebook pages
    additionalPosts: v.optional(v.array(v.object({
      text: v.string(),
      mediaUrls: v.optional(v.array(v.string())),
    }))), // For Twitter threads
    userId: v.optional(v.string()), // For per-user rate limiting
  },
  returns: v.object({
    success: v.boolean(),
    postId: v.optional(v.string()),
    postUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Rate limit Blotato API calls
    if (args.userId) {
      await checkRateLimit(ctx, "userBlotatoPost", args.userId);
    }

    try {
      const payload: any = {
        post: {
          accountId: args.accountId,
          content: {
            text: args.text,
            mediaUrls: args.mediaUrls || [],
            platform: args.platform,
          },
          target: {
            targetType: args.platform,
          },
        },
      };

      // Add page ID for Facebook
      if (args.pageId) {
        payload.post.target.pageId = args.pageId;
      }

      // Add additional posts for Twitter threads
      if (args.additionalPosts && args.additionalPosts.length > 0) {
        payload.post.content.additionalPosts = args.additionalPosts.map(p => ({
          text: p.text,
          mediaUrls: p.mediaUrls || [],
        }));
      }

      const result = await blotatoFetch("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        postId: result.postId || result.id,
        postUrl: result.postUrl,
      };
    } catch (error) {
      console.error("Error publishing to Blotato:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish post",
      };
    }
  },
});

/**
 * Schedule a post for later
 */
export const schedulePost = action({
  args: {
    accountId: v.string(),
    platform: v.string(),
    text: v.string(),
    scheduledTime: v.string(), // ISO 8601 format: "2025-03-10T15:30:00Z"
    mediaUrls: v.optional(v.array(v.string())),
    pageId: v.optional(v.string()),
    additionalPosts: v.optional(v.array(v.object({
      text: v.string(),
      mediaUrls: v.optional(v.array(v.string())),
    }))),
  },
  returns: v.object({
    success: v.boolean(),
    postId: v.optional(v.string()),
    scheduledFor: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const payload: any = {
        post: {
          accountId: args.accountId,
          content: {
            text: args.text,
            mediaUrls: args.mediaUrls || [],
            platform: args.platform,
          },
          target: {
            targetType: args.platform,
          },
        },
        scheduledTime: args.scheduledTime,
      };

      if (args.pageId) {
        payload.post.target.pageId = args.pageId;
      }

      if (args.additionalPosts && args.additionalPosts.length > 0) {
        payload.post.content.additionalPosts = args.additionalPosts.map(p => ({
          text: p.text,
          mediaUrls: p.mediaUrls || [],
        }));
      }

      const result = await blotatoFetch("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        postId: result.postId || result.id,
        scheduledFor: args.scheduledTime,
      };
    } catch (error) {
      console.error("Error scheduling Blotato post:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to schedule post",
      };
    }
  },
});

/**
 * Generate and optionally publish a social media script
 * This combines AI script generation with Blotato publishing
 */
export const generateAndPublishScript = action({
  args: {
    // Script generation params
    topic: v.string(),
    platform: v.string(),
    style: v.optional(v.union(
      v.literal("educational"),
      v.literal("entertaining"),
      v.literal("promotional"),
      v.literal("behind-the-scenes"),
      v.literal("tutorial")
    )),
    tone: v.optional(v.union(
      v.literal("professional"),
      v.literal("casual"),
      v.literal("humorous"),
      v.literal("inspirational")
    )),
    // Publishing params (optional)
    accountId: v.optional(v.string()),
    publishImmediately: v.optional(v.boolean()),
    scheduledTime: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    script: v.optional(v.object({
      hook: v.string(),
      body: v.string(),
      cta: v.string(),
      fullScript: v.string(),
      hashtags: v.optional(v.array(v.string())),
      suggestedLength: v.optional(v.string()),
    })),
    published: v.optional(v.boolean()),
    postId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Generate script using OpenAI
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        throw new Error("OPENAI_API_KEY not set");
      }

      const platformGuides: Record<string, string> = {
        tiktok: "TikTok (15-60 seconds, vertical video, trend-aware, quick hook in first 1-3 seconds)",
        instagram: "Instagram Reels (15-90 seconds, vertical video, visually engaging, use trending audio)",
        youtube: "YouTube Shorts (up to 60 seconds, vertical, educational or entertaining)",
        twitter: "Twitter/X (280 chars max, punchy, conversational, thread-friendly)",
        linkedin: "LinkedIn (professional, value-driven, storytelling, 1300 chars ideal)",
        threads: "Threads (conversational, authentic, community-focused)",
        facebook: "Facebook (engaging, shareable, can be longer form)",
      };

      const platformGuide = platformGuides[args.platform.toLowerCase()] || args.platform;

      const prompt = `You are an expert social media content creator for musicians and producers.

Create a ${args.style || "engaging"} script for ${platformGuide}.

Topic: ${args.topic}
Tone: ${args.tone || "casual"}

Structure your response as JSON with these fields:
- hook: The attention-grabbing opening (first 1-3 seconds)
- body: The main content
- cta: The call-to-action at the end
- fullScript: The complete script ready to read/perform
- hashtags: Array of 5-10 relevant hashtags (without #)
- suggestedLength: Recommended duration/length

Make it authentic, engaging, and optimized for the platform. Focus on stopping the scroll.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const scriptData = JSON.parse(data.choices[0].message.content);

      // Optionally publish to Blotato
      let published = false;
      let postId: string | undefined;

      if (args.accountId && (args.publishImmediately || args.scheduledTime)) {
        const blotatoApiKey = process.env.BLOTATO_API_KEY;
        
        if (blotatoApiKey) {
          const postPayload: any = {
            post: {
              accountId: args.accountId,
              content: {
                text: scriptData.fullScript + (scriptData.hashtags?.length 
                  ? "\n\n" + scriptData.hashtags.map((h: string) => `#${h}`).join(" ")
                  : ""),
                mediaUrls: args.mediaUrls || [],
                platform: args.platform,
              },
              target: {
                targetType: args.platform,
              },
            },
          };

          if (args.scheduledTime) {
            postPayload.scheduledTime = args.scheduledTime;
          }

          const postResult = await blotatoFetch("/posts", {
            method: "POST",
            body: JSON.stringify(postPayload),
          });

          published = true;
          postId = postResult.postId || postResult.id;
        }
      }

      return {
        success: true,
        script: {
          hook: scriptData.hook,
          body: scriptData.body,
          cta: scriptData.cta,
          fullScript: scriptData.fullScript,
          hashtags: scriptData.hashtags,
          suggestedLength: scriptData.suggestedLength,
        },
        published,
        postId,
      };
    } catch (error) {
      console.error("Error generating script:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate script",
      };
    }
  },
});

/**
 * Create a Twitter/X thread from multiple script parts
 */
export const createTwitterThread = action({
  args: {
    accountId: v.string(),
    tweets: v.array(v.object({
      text: v.string(),
      mediaUrls: v.optional(v.array(v.string())),
    })),
    scheduledTime: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    threadId: v.optional(v.string()),
    tweetCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      if (args.tweets.length === 0) {
        throw new Error("At least one tweet is required");
      }

      const firstTweet = args.tweets[0];
      const additionalTweets = args.tweets.slice(1);

      const payload: any = {
        post: {
          accountId: args.accountId,
          content: {
            text: firstTweet.text,
            mediaUrls: firstTweet.mediaUrls || [],
            platform: "twitter",
            additionalPosts: additionalTweets.map(t => ({
              text: t.text,
              mediaUrls: t.mediaUrls || [],
            })),
          },
          target: {
            targetType: "twitter",
          },
        },
      };

      if (args.scheduledTime) {
        payload.scheduledTime = args.scheduledTime;
      }

      const result = await blotatoFetch("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        threadId: result.postId || result.id,
        tweetCount: args.tweets.length,
      };
    } catch (error) {
      console.error("Error creating Twitter thread:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create thread",
      };
    }
  },
});

/**
 * Generate platform-optimized captions/scripts for multiple platforms at once
 */
export const generateMultiPlatformContent = action({
  args: {
    topic: v.string(),
    platforms: v.array(v.string()),
    baseContent: v.optional(v.string()), // Optional existing content to adapt
    style: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.record(v.string(), v.object({
      text: v.string(),
      hashtags: v.array(v.string()),
      characterCount: v.number(),
      tips: v.optional(v.string()),
    }))),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        throw new Error("OPENAI_API_KEY not set");
      }

      const prompt = `Create optimized social media content for a musician/producer about: "${args.topic}"

${args.baseContent ? `Base content to adapt: "${args.baseContent}"` : ""}
Style: ${args.style || "engaging and authentic"}

Generate content for these platforms: ${args.platforms.join(", ")}

For each platform, consider:
- Character limits (Twitter: 280, LinkedIn: 3000, Instagram: 2200)
- Platform culture and tone
- Hashtag best practices
- Call-to-action style

Return JSON with platform names as keys, each containing:
- text: The optimized post text
- hashtags: Array of relevant hashtags (without #)
- characterCount: Number of characters
- tips: Brief posting tip for that platform`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const content = JSON.parse(data.choices[0].message.content);

      return {
        success: true,
        content,
      };
    } catch (error) {
      console.error("Error generating multi-platform content:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate content",
      };
    }
  },
});

