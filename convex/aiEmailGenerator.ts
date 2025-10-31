"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

/**
 * Generate email template content using OpenAI
 */
export const generateEmailTemplate = action({
  args: {
    prompt: v.string(),
    templateType: v.optional(v.string()),
  },
  returns: v.object({
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.string(),
  }),
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured in environment variables");
    }

    const systemPrompt = `You are an expert email copywriter and HTML email designer. 
Generate professional, engaging email templates with proper HTML structure.
The emails should be responsive, visually appealing, and follow email best practices.

Always include:
- Proper HTML structure with inline CSS
- Mobile-responsive design
- Clear call-to-action
- Professional tone
- Unsubscribe link in footer
- Max width of 600px for compatibility

Return your response as a JSON object with these exact fields:
{
  "name": "Template name (short, descriptive)",
  "subject": "Email subject line (compelling and clear)",
  "htmlContent": "Full HTML email content with inline styles",
  "textContent": "Plain text version of the email"
}`;

    const userPrompt = args.templateType 
      ? `Create a ${args.templateType} email template. ${args.prompt}`
      : args.prompt;

    console.log("🤖 Generating email template with OpenAI...");
    console.log("Prompt:", userPrompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    console.log("✅ Template generated successfully");

    const result = JSON.parse(responseText);
    
    return {
      name: result.name || "AI Generated Template",
      subject: result.subject || "Welcome!",
      htmlContent: result.htmlContent || "<p>Email content</p>",
      textContent: result.textContent || "Email content",
    };
  },
});

