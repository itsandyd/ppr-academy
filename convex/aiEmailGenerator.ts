"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

/**
 * Generate email content for workflow emails using course/store context
 */
export const generateWorkflowEmail = action({
  args: {
    storeId: v.string(),
    emailType: v.union(
      v.literal("welcome"),
      v.literal("nurture"),
      v.literal("pitch"),
      v.literal("follow_up"),
      v.literal("thank_you"),
      v.literal("reminder"),
      v.literal("custom")
    ),
    contextType: v.union(
      v.literal("course"),
      v.literal("store"),
      v.literal("product"),
      v.literal("custom")
    ),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    customPrompt: v.optional(v.string()),
    tone: v.optional(v.union(
      v.literal("professional"),
      v.literal("friendly"),
      v.literal("casual"),
      v.literal("urgent"),
      v.literal("educational")
    )),
  },
  returns: v.object({
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Gather context based on contextType
    let contextInfo = "";

    if (args.contextType === "course" && args.courseId) {
      // Fetch course details with instructor info
      const courseData = await ctx.runQuery(api.courses.getCourseWithInstructor, { courseId: args.courseId });
      if (courseData?.course) {
        const course = courseData.course;
        contextInfo = `
COURSE INFORMATION:
- Title: ${course.title}
- Description: ${course.description || "No description"}
- Category: ${course.category || "General"}
- Price: ${course.price ? `$${course.price}` : "Free"}
- What students will learn: ${course.outcomes || "Various skills and knowledge"}
`;
        if (courseData.instructor) {
          contextInfo += `
INSTRUCTOR:
- Name: ${courseData.instructor.name}
- Bio: ${courseData.instructor.bio || "Experienced instructor"}
`;
        }
      }
    } else if (args.contextType === "product" && args.productId) {
      // Fetch digital product details
      const product = await ctx.runQuery(api.digitalProducts.getProductById, { productId: args.productId });
      if (product) {
        contextInfo = `
PRODUCT INFORMATION:
- Name: ${product.title}
- Description: ${product.description || "No description"}
- Type: ${product.productCategory || product.productType || "Digital Product"}
- Price: ${product.price ? `$${product.price}` : "Free"}
`;
      }
    } else if (args.contextType === "store") {
      // Fetch store details
      const store = await ctx.runQuery(api.stores.getUserStore, { userId: args.storeId });
      if (store) {
        contextInfo = `
STORE/BRAND INFORMATION:
- Store Name: ${store.name || "Creator Store"}
- Description: ${store.description || "No description"}
- Bio: ${store.bio || ""}
`;
      }
    }

    // Add custom prompt if provided
    if (args.customPrompt) {
      contextInfo += `\nADDITIONAL CONTEXT:\n${args.customPrompt}`;
    }

    const tone = args.tone || "friendly";
    const toneDescriptions: Record<string, string> = {
      professional: "professional, polished, and business-appropriate",
      friendly: "warm, personable, and conversational",
      casual: "relaxed, informal, and approachable",
      urgent: "time-sensitive with clear calls to action",
      educational: "informative, helpful, and teaching-oriented",
    };

    const emailTypePrompts: Record<string, string> = {
      welcome: "Write a welcome email that introduces the subscriber to the brand/course and sets expectations for what they'll receive.",
      nurture: "Write a nurture email that provides value, shares a tip or insight, and builds trust without being salesy.",
      pitch: "Write a sales email that highlights benefits, addresses objections, and includes a clear call to action to purchase.",
      follow_up: "Write a follow-up email checking in on progress, offering help, and keeping engagement high.",
      thank_you: "Write a thank you email expressing gratitude for a purchase/action and providing next steps.",
      reminder: "Write a reminder email that creates urgency and encourages action.",
      custom: args.customPrompt || "Write a compelling email based on the provided context.",
    };

    const systemPrompt = `You are an expert email copywriter who creates high-converting emails for creators and businesses.

Your emails should be:
- ${toneDescriptions[tone]}
- Scannable with short paragraphs
- Include personalization placeholders: {{firstName}}, {{senderName}}
- Have a clear single call-to-action
- Be authentic and not overly salesy

Format the body as clean HTML with:
- <p> tags for paragraphs
- <strong> for emphasis
- <ul>/<li> for lists
- <a href="[link]"> for links (use [link] as placeholder)
- <blockquote> for testimonials/quotes

DO NOT include full HTML document structure - just the body content.

Return JSON with exactly these fields:
{
  "subject": "Email subject line (50 chars max, compelling)",
  "previewText": "Preview text shown in inbox (80 chars max)",
  "body": "HTML email body content"
}`;

    const userPrompt = `${emailTypePrompts[args.emailType]}

${contextInfo}

Generate an email that feels personal and authentic to the creator's brand.`;

    console.log("🤖 Generating workflow email with AI...");

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

    const result = JSON.parse(responseText);

    return {
      subject: result.subject || "Hello!",
      previewText: result.previewText || "",
      body: result.body || "<p>Email content here</p>",
    };
  },
});

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

