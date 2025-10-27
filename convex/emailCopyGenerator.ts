"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
2. Keep the structure and flow of the template
3. Tone: ${tone}
4. Use music producer slang where appropriate
5. Be authentic and direct - no corporate speak
6. Keep it concise and scannable
7. Include emojis where the template has them
8. Creator name is: ${args.creatorName}

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
            content: "You are an expert email copywriter for music creators. You write authentic, engaging emails that convert. Always return valid JSON.",
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


