"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { callLLM, safeParseJson } from "./masterAI/llmClient";

// AI-powered notification content generation using Claude 4.5 Sonnet
export const generateNotificationContent = action({
  args: {
    clerkId: v.string(),
    entryIds: v.array(v.id("changelogEntries")),
  },
  returns: v.object({
    title: v.string(),
    message: v.string(),
    success: v.boolean(),
  }),
  handler: async (ctx, { clerkId, entryIds }) => {
    // Verify admin by running a query
    const user = await ctx.runQuery(internal.changelog.verifyAdmin, { clerkId });
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Fetch the entries
    const validEntries = await ctx.runQuery(internal.changelog.getEntriesByIds, {
      entryIds,
    });

    if (validEntries.length === 0) {
      throw new Error("No valid entries found");
    }

    // Build the prompt
    const entriesSummary = validEntries
      .map(
        (e: { category: string; title: string; commitMessage: string }) =>
          `- [${e.category.toUpperCase()}] ${e.title}: ${e.commitMessage.split("\n")[0]}`
      )
      .join("\n");

    const systemPrompt = `You are a friendly product communicator for PPR Academy, a music production education platform. 
Your job is to turn technical commit messages into exciting, user-friendly update notifications.

Guidelines:
- Be enthusiastic but professional
- Focus on user benefits, not technical details
- Use simple language that non-technical users understand
- Keep the tone warm and appreciative of users
- Don't use emojis in the title
- You can use 1-2 emojis in the message body sparingly
- Group related changes together logically
- Highlight the most impactful changes first

Return a JSON object with:
{
  "title": "A short, catchy title (max 60 chars)",
  "message": "A friendly message explaining what's new (150-300 chars)"
}`;

    const userPrompt = `Generate a notification for these recent updates to PPR Academy:

${entriesSummary}

The notification should make users excited about these improvements and encourage them to explore the platform.`;

    try {
      const response = await callLLM({
        model: "claude-4.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        responseFormat: "json",
        temperature: 0.7,
        maxTokens: 500,
      });

      const result = safeParseJson<{ title?: string; message?: string }>(response.content, {});

      return {
        title: result.title || "New Updates Available",
        message: result.message || "We've made some improvements to enhance your experience.",
        success: true,
      };
    } catch (error: unknown) {
      console.error("AI generation error:", error);

      // Fallback to simple generation
      type Entry = { category: string; title: string; commitMessage: string };
      const features = validEntries.filter((e: Entry) => e.category === "feature");
      const fixes = validEntries.filter((e: Entry) => e.category === "fix");
      const improvements = validEntries.filter((e: Entry) => e.category === "improvement");

      let title = "New Updates Available";
      if (features.length > 0 && fixes.length === 0) {
        title = "New Features Just Dropped";
      } else if (fixes.length > 0 && features.length === 0) {
        title = "Bug Fixes & Improvements";
      }

      let message = "We've been working hard to improve your experience. ";
      if (features.length > 0) {
        message += `${features.length} new feature${features.length > 1 ? "s" : ""}. `;
      }
      if (improvements.length > 0) {
        message += `${improvements.length} improvement${improvements.length > 1 ? "s" : ""}. `;
      }
      if (fixes.length > 0) {
        message += `${fixes.length} bug fix${fixes.length > 1 ? "es" : ""}. `;
      }
      message += "Check it out!";

      return {
        title,
        message,
        success: true,
      };
    }
  },
});
