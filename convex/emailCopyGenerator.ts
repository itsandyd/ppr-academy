"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
});

/**
 * Generate email copy using product information and template
 */
export const generateEmailCopy = action({
  args: {
    templateBody: v.string(),
    templateSubject: v.string(),
    productInfo: v.object({
      name: v.string(),
      type: v.string(), // course, sample-pack, digital-product, coaching
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      creditPrice: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      sampleCount: v.optional(v.number()),
      genres: v.optional(v.array(v.string())),
      duration: v.optional(v.number()),
      moduleCount: v.optional(v.number()),
    }),
    creatorName: v.string(),
    tone: v.optional(v.string()), // casual, professional, enthusiastic
  },
  returns: v.object({
    subject: v.string(),
    body: v.string(),
    previewText: v.string(),
  }),
  handler: async (ctx, args) => {
    const tone = args.tone || "casual and authentic like a music producer talking to another producer";

    const prompt = `You are writing an email for a music producer/creator selling their products.

PRODUCT INFORMATION:
- Name: ${args.productInfo.name}
- Type: ${args.productInfo.type}
- Description: ${args.productInfo.description || "Not provided"}
- Price: ${args.productInfo.creditPrice || args.productInfo.price || "TBD"} credits
${args.productInfo.sampleCount ? `- Sample Count: ${args.productInfo.sampleCount}` : ""}
${args.productInfo.genres ? `- Genres: ${args.productInfo.genres.join(", ")}` : ""}
${args.productInfo.moduleCount ? `- Modules: ${args.productInfo.moduleCount}` : ""}
${args.productInfo.duration ? `- Duration: ${args.productInfo.duration} minutes` : ""}
${args.productInfo.features ? `- Features: ${args.productInfo.features.join(", ")}` : ""}

TEMPLATE TO CUSTOMIZE:
Subject: ${args.templateSubject}
Body: ${args.templateBody}

INSTRUCTIONS:
1. Replace ALL {{variables}} with actual product information
2. Keep the structure and flow of the template but make it sound like a friend texting
3. Tone: ${tone}
4. Use music producer slang where appropriate
5. Write like you're texting a friend — use "honestly," "tbh," "haha," parenthetical asides, ellipsis
6. One thought per paragraph, max 2 sentences. No bullet point lists.
7. CTA in the middle, soft language: "You can check it out here if you're curious." Include pressure release: "No pressure at all."
8. Subject line: all lowercase or sentence case, emoji at END only, reads like a text message
9. Creator name is: ${args.creatorName} — sign off with "Talk soon," followed by their name

OUTPUT FORMAT:
Return ONLY a JSON object with these exact keys:
{
  "subject": "the customized subject line",
  "body": "the complete email body with all variables replaced",
  "previewText": "a 50-80 character preview text for the email"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are writing emails for music production creators. Every email should sound like a friend texting about something cool they made — never like a brand broadcasting to customers.

VOICE RULES:
- Write like you're texting a friend. Use "honestly," "haha," "anyways," "tbh," "lol"
- Use parenthetical asides: "(which is crazy)" "(it's not what you think)"
- Use ellipsis for dramatic pauses. Use contractions always.
- One thought per paragraph, max 2 sentences per paragraph
- CTA in the MIDDLE, soft language: "You can take a look right here." NEVER "Grab it here" or "Click here to buy"
- Include pressure release near CTA: "No pressure, just wanted to share it."
- Subject lines: all lowercase or sentence case, emoji at END only, reads like a text message, under 50 chars
- Sign off with "Talk soon," followed by the creator's name
- NEVER use: numbered lists, "Here's the thing," "Hey there," Title Case subjects

Always return valid JSON.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        subject: result.subject || args.templateSubject,
        body: result.body || args.templateBody,
        previewText: result.previewText || "",
      };
    } catch (error) {
      console.error("Failed to generate email copy:", error);
      throw new Error("Failed to generate email copy. Please try again.");
    }
  },
});


