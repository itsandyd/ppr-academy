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

    const systemPrompt = `You are an expert email copywriter for online course creators in the music production education space.

Your task is to generate ${args.emailCount} nurture emails that provide genuine educational value to leads who haven't purchased the course yet.

Each email should:
- Share a specific, actionable tip or insight derived from the course content
- Be genuinely helpful without giving away the full course value
- Build trust and demonstrate expertise
- Reference specific concepts from the course modules/lessons
- Be 200-300 words max
- Have a compelling subject line (40-60 chars)
- End with a soft CTA that mentions the course without being pushy
- Use a conversational, friendly tone

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

    console.log(`🤖 Generating ${args.emailCount} nurture emails for course: ${courseContent.title}`);

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

    console.log(`✅ Generated ${result.emails.length} nurture emails`);
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

    const systemPrompt = `You are an expert sales copywriter for online course creators in the music production education space.

Your task is to generate ${args.emailCount} pitch/sales emails that convert leads who have received value from nurture emails.

Each email should:
- Reference the value they've received from previous tips
- Highlight specific outcomes and transformations from the course
- Address common objections (time, money, skill level)
- Create appropriate urgency without being manipulative
- Have a compelling subject line (40-60 chars)
- Include a clear, prominent CTA button
- Be 250-400 words
- Use social proof language (even if generic)

${isSecondCycle ? `IMPORTANT: This is a SECOND CYCLE pitch for leads who didn't buy the first time.
- Acknowledge they may have seen the course before
- Offer a fresh perspective or new angle
- Consider mentioning a special offer
- Be respectful of their decision to wait` : ""}

${hasDiscount ? `Include a ${args.discountPercent}% discount offer in the emails.` : ""}

The emails should escalate in urgency across the sequence.`;

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

    console.log(`🤖 Generating ${args.emailCount} pitch emails for course: ${courseContent.title}`);

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

    console.log(`✅ Generated ${result.emails.length} pitch emails`);
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
