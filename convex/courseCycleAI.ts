"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// ============================================================================
// AI Email Generation for Course Cycles
// ============================================================================

interface CourseContentModule {
  title: string;
  description?: string;
  lessons: {
    title: string;
    description?: string;
    chapters: {
      title: string;
      description?: string;
    }[];
  }[];
}

interface CourseContentForAI {
  title: string;
  description: string;
  price: number;
  skillLevel?: string;
  modules: CourseContentModule[];
}

/**
 * Generate nurture emails for a course
 * Pulls from course content to create value-focused tip emails
 */
export const generateNurtureEmails = internalAction({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    emailCount: v.number(),
    cycleNumber: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Fetch course with full content
    const courseContent = await ctx.runQuery(
      internal.courseCycles.getCourseContentForAI,
      { courseId: args.courseId }
    ) as CourseContentForAI | null;

    if (!courseContent) {
      throw new Error("Course not found");
    }

    const isSecondCycle = args.cycleNumber > 1;

    const systemPrompt = `You are writing nurture emails for music production creators. These are VALUE emails — no hard sell. Every email should sound like a friend sharing a production insight, not a brand broadcasting to customers.

Your task is to generate ${args.emailCount} nurture emails that provide genuine educational value to leads who haven't purchased the course yet.

VOICE RULES:
- Write like you're texting a friend about something cool you learned
- Use filler words real people use: "honestly," "haha," "anyways," "tbh"
- Use parenthetical asides mid-thought: "(which is crazy)" "(it's not what you think)"
- Use ellipsis for dramatic pauses: "it's something deeper..."
- Use contractions always: "it's" not "it is", "I'm" not "I am"

NEVER USE THESE PATTERNS:
- "Here's the thing." / "It's not your fault."
- Short. Punchy. One-word. Sentences. For. Drama.
- Numbered lists of features or benefits
- "Hey there," as a greeting (use "Hey," or "Hey {{firstName}},")

Each email should:
- Share a specific, actionable tip or insight derived from the course content
- Be genuinely helpful — all the value is in the email body itself
- One thought per paragraph, max 2 sentences per paragraph
- Be 200-300 words max
- Subject line: all lowercase or sentence case, emoji at END only, under 50 chars, reads like a text message
- If there's a link, it's to a blog post or free resource, framed casually: "Here's the link if you want to dive in."
- End with a soft engagement ask: "Let me know what you think" / "I'd love to hear your thoughts" / "Hit me back"
- Always sign off with: Talk soon, followed by the creator's name
- No product mentions, no pricing in nurture emails

${isSecondCycle ? `IMPORTANT: This is a SECOND CYCLE for leads who have seen the first nurture sequence.
- Use different angles and examples
- Reference that they may have seen similar tips before
- Dig deeper into specific techniques
- Be more advanced/specific` : ""}

The emails should progressively reveal more value, creating curiosity about the full course.`;

    const userPrompt = `Generate ${args.emailCount} nurture emails for this course:

COURSE: ${courseContent.title}
DESCRIPTION: ${courseContent.description || "No description available"}
PRICE: $${courseContent.price || 0}
SKILL LEVEL: ${courseContent.skillLevel || "All levels"}

COURSE STRUCTURE:
${courseContent.modules.map((m, i) => `
Module ${i + 1}: ${m.title}
${m.description ? `  Description: ${m.description}` : ""}
  Lessons:
${m.lessons.map((l, j) => `    ${j + 1}. ${l.title}${l.chapters.length > 0 ? ` (${l.chapters.length} chapters)` : ""}`).join("\n")}
`).join("\n")}

Return a JSON object with this structure:
{
  "emails": [
    {
      "index": 1,
      "subject": "Subject line here",
      "htmlContent": "<html email content with inline styles>",
      "sourceLesson": "Module 1, Lesson 2" // Which part of course inspired this
    }
  ]
}

Make sure the HTML is properly formatted with inline CSS for email clients. Include proper structure with a max-width of 600px container.`;

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

    // Save each email to the database
    for (const email of result.emails) {
      await ctx.runMutation(internal.courseCycles.saveCycleEmail, {
        courseCycleConfigId: args.courseCycleConfigId,
        courseId: args.courseId,
        emailType: "nurture",
        emailIndex: email.index,
        cycleNumber: args.cycleNumber,
        subject: email.subject,
        htmlContent: email.htmlContent,
        generatedFromLesson: email.sourceLesson,
      });
    }
    return true;
  },
});

/**
 * Generate pitch emails for a course
 * Creates sales-focused emails with urgency and clear CTAs
 */
export const generatePitchEmails = internalAction({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    emailCount: v.number(),
    cycleNumber: v.number(),
    discountPercent: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Fetch course with full content
    const courseContent = await ctx.runQuery(
      internal.courseCycles.getCourseContentForAI,
      { courseId: args.courseId }
    ) as CourseContentForAI | null;

    if (!courseContent) {
      throw new Error("Course not found");
    }

    const isSecondCycle = args.cycleNumber > 1;
    const hasDiscount = args.discountPercent && args.discountPercent > 0;

    const systemPrompt = `You are writing pitch emails for music production creators. These are Reveal/Launch emails where the product link lives — but they should STILL sound like a friend sharing something they made, not a sales broadcast.

Your task is to generate ${args.emailCount} pitch emails that convert leads who have received value from nurture emails.

VOICE RULES:
- Write like you're texting a friend, not writing marketing copy
- Use filler words real people use: "honestly," "haha," "anyways," "tbh"
- Use parenthetical asides: "(which is crazy)" "(it's not what you think)"
- Use ellipsis for dramatic pauses: "it's something deeper..."
- Use contractions always. Occasional light profanity is OK but rare: "f**k it"

NEVER USE THESE PATTERNS:
- "Here's the thing." / "It's not your fault."
- Short. Punchy. One-word. Sentences. For. Drama.
- Numbered lists of features or benefits
- "Hey there," as a greeting (use "Hey," or "Hey {{firstName}},")
- "game-changer", "transform your life", "unlock your potential"

Each email should:
- Wrap the pitch in a story about why you built it or what inspired it
- One thought per paragraph, max 2 sentences per paragraph
- Be 250-400 words
- Subject line: all lowercase or sentence case, emoji at END only, under 50 chars, reads like a text message
- CTA link in the MIDDLE of the email, never at top or bottom
- CTA style: "You can take a look right here." / "Here's the link if you want to dive in." (NEVER "Grab it here" or "Click here to buy")
- Include a pressure release near every CTA: "And hey, if it's not for you, totally fine." / "No pressure at all, just wanted to share it."
- Social proof: "I've been hearing from a lot of producers about this..." / "The response has been kind of crazy honestly" (NEVER "Over 10,000 students enrolled!")
- End with a soft engagement ask: "Let me know what you think" / "Hit me back"
- Always sign off with: Talk soon, followed by the creator's name
- Use P.S. to tease the next email or add something personal

${isSecondCycle ? `IMPORTANT: This is a SECOND CYCLE pitch for leads who didn't buy the first time.
- Acknowledge they may have seen the course before
- Offer a fresh perspective or new angle
- Consider mentioning a special offer
- Be respectful of their decision to wait` : ""}

${hasDiscount ? `Include a ${args.discountPercent}% discount offer in the emails, but frame it casually: "I'm doing something I don't usually do..." not "LIMITED TIME OFFER!"` : ""}

The later emails should gently check in, not aggressively escalate urgency. Last email: "Just wanted to check in before this closes." Low pressure, warm sign off.`;

    const userPrompt = `Generate ${args.emailCount} pitch/sales emails for this course:

COURSE: ${courseContent.title}
DESCRIPTION: ${courseContent.description || "No description available"}
PRICE: $${courseContent.price || 0}${hasDiscount ? ` (offer ${args.discountPercent}% off = $${((courseContent.price || 0) * (1 - (args.discountPercent || 0) / 100)).toFixed(0)})` : ""}
SKILL LEVEL: ${courseContent.skillLevel || "All levels"}

KEY MODULES:
${courseContent.modules.slice(0, 5).map((m, i) => `${i + 1}. ${m.title}`).join("\n")}

Return a JSON object with this structure:
{
  "emails": [
    {
      "index": 1,
      "subject": "Subject line here",
      "htmlContent": "<html email content with inline styles, including CTA button>"
    }
  ]
}

Make sure the HTML includes:
- Inline CSS for email compatibility
- A prominent CTA button styled with background color
- Max-width 600px container
- The course purchase link placeholder: {{courseUrl}}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseText);

    // Save each email to the database
    for (const email of result.emails) {
      await ctx.runMutation(internal.courseCycles.saveCycleEmail, {
        courseCycleConfigId: args.courseCycleConfigId,
        courseId: args.courseId,
        emailType: "pitch",
        emailIndex: email.index,
        cycleNumber: args.cycleNumber,
        subject: email.subject,
        htmlContent: email.htmlContent,
      });
    }
    return true;
  },
});

/**
 * Generate all emails for a course cycle config
 */
export const generateAllCycleEmails = action({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    generateSecondCycle: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    coursesProcessed: v.number(),
    emailsGenerated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get the config
    const config = await ctx.runQuery(internal.courseCycles.getConfig, {
      configId: args.courseCycleConfigId,
    });

    if (!config) {
      throw new Error("Course cycle config not found");
    }

    let emailsGenerated = 0;

    // Generate emails for each course
    for (const courseId of config.courseIds) {
      // Find timing config for this course
      const timing = config.courseTimings.find(
        (t: any) => t.courseId === courseId
      ) || {
        nurtureEmailCount: 3,
        pitchEmailCount: 2,
      };

      // Generate first cycle nurture emails
      await ctx.runAction(internal.courseCycleAI.generateNurtureEmails, {
        courseCycleConfigId: args.courseCycleConfigId,
        courseId,
        emailCount: timing.nurtureEmailCount,
        cycleNumber: 1,
      });
      emailsGenerated += timing.nurtureEmailCount;

      // Generate first cycle pitch emails
      await ctx.runAction(internal.courseCycleAI.generatePitchEmails, {
        courseCycleConfigId: args.courseCycleConfigId,
        courseId,
        emailCount: timing.pitchEmailCount,
        cycleNumber: 1,
      });
      emailsGenerated += timing.pitchEmailCount;

      // Generate second cycle if requested
      if (args.generateSecondCycle && config.differentContentOnSecondCycle) {
        await ctx.runAction(internal.courseCycleAI.generateNurtureEmails, {
          courseCycleConfigId: args.courseCycleConfigId,
          courseId,
          emailCount: timing.nurtureEmailCount,
          cycleNumber: 2,
        });
        emailsGenerated += timing.nurtureEmailCount;

        await ctx.runAction(internal.courseCycleAI.generatePitchEmails, {
          courseCycleConfigId: args.courseCycleConfigId,
          courseId,
          emailCount: timing.pitchEmailCount,
          cycleNumber: 2,
        });
        emailsGenerated += timing.pitchEmailCount;
      }
    }

    return {
      success: true,
      coursesProcessed: config.courseIds.length,
      emailsGenerated,
    };
  },
});

/**
 * Regenerate emails for a single course
 */
export const regenerateCourseEmails = action({
  args: {
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    cycleNumber: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the config
    const config = await ctx.runQuery(internal.courseCycles.getConfig, {
      configId: args.courseCycleConfigId,
    });

    if (!config) {
      throw new Error("Course cycle config not found");
    }

    // Find timing config for this course
    const timing = config.courseTimings.find(
      (t: any) => t.courseId === args.courseId
    ) || {
      nurtureEmailCount: 3,
      pitchEmailCount: 2,
    };

    const cycleNumber = args.cycleNumber || 1;

    // Delete existing emails for this course/cycle
    await ctx.runMutation(internal.courseCycles.deleteEmailsForCycle, {
      courseCycleConfigId: args.courseCycleConfigId,
      courseId: args.courseId,
      cycleNumber,
    });

    // Regenerate
    await ctx.runAction(internal.courseCycleAI.generateNurtureEmails, {
      courseCycleConfigId: args.courseCycleConfigId,
      courseId: args.courseId,
      emailCount: timing.nurtureEmailCount,
      cycleNumber,
    });

    await ctx.runAction(internal.courseCycleAI.generatePitchEmails, {
      courseCycleConfigId: args.courseCycleConfigId,
      courseId: args.courseId,
      emailCount: timing.pitchEmailCount,
      cycleNumber,
    });

    return true;
  },
});
