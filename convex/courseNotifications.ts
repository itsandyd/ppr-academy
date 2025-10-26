"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate notification copy using AI (Node.js action)
export const generateNotificationCopy = action({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
    changes: v.object({
      newModules: v.number(),
      newLessons: v.number(),
      newChapters: v.number(),
      newModulesList: v.array(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    copy: v.optional(v.object({
      title: v.string(),
      message: v.string(),
      emailSubject: v.string(),
      emailPreview: v.string(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    copy?: {
      title: string;
      message: string;
      emailSubject: string;
      emailPreview: string;
    };
    error?: string;
  }> => {
    try {
      // Get course details
      const course: any = await ctx.runQuery(api.courses.getCourseForEdit, {
        courseId: args.courseId,
        userId: args.userId,
      });

      if (!course) {
        return {
          success: false,
          error: "Course not found",
        };
      }

      // Build change summary
      const changeSummary: string[] = [];
      if (args.changes.newModules > 0) {
        changeSummary.push(`${args.changes.newModules} new module${args.changes.newModules > 1 ? 's' : ''}`);
      }
      if (args.changes.newLessons > 0) {
        changeSummary.push(`${args.changes.newLessons} new lesson${args.changes.newLessons > 1 ? 's' : ''}`);
      }
      if (args.changes.newChapters > 0) {
        changeSummary.push(`${args.changes.newChapters} new chapter${args.changes.newChapters > 1 ? 's' : ''}`);
      }

      const modules = course.modules || [];
      const newModulesDetails: string = args.changes.newModulesList
        .map((title: string, idx: number) => {
          const module = modules.find((m: any) => m.title === title);
          return `${idx + 1}. ${title}${module?.description ? ` - ${module.description}` : ''}`;
        })
        .join('\n');

      const systemPrompt: string = `You are a passionate course creator talking directly to your students. Write like you're texting a friend—casual, genuine, excited.

CRITICAL RULES:
- Write like a real human, not a marketing bot
- Use natural, conversational language (like you're talking out loud)
- NO corporate buzzwords or marketing jargon
- NO excessive emojis (max 1, or none)
- NO fake urgency or hype
- BE SPECIFIC about what's inside, not vague promises
- Sound like someone who genuinely cares about teaching

Think: "Hey! Just finished adding some killer new stuff to the course" NOT "Unlock transformative learning opportunities"`;

      const userPrompt: string = `You just added new content to your ${course.category} course. Write a super casual, human notification to your students.

COURSE: ${course.title}
WHAT YOU ADDED: ${changeSummary.join(', ')}
NEW MODULES: ${newModulesDetails || "Various updates"}

Write as if you're:
- Texting your students personally
- Excited to share what you just made
- Talking like a real teacher, not a salesperson
- Being specific about what's inside

Examples of GOOD human writing:
- "Just wrapped up 2 new modules on vocal mixing—some of my best work yet. Check them out!"
- "Added the compression module you guys have been asking for. It's live now."
- "Heads up: just dropped 3 new lessons on delay techniques. Pretty stoked with how they turned out."

Examples of BAD AI writing:
- "Unlock transformative learning opportunities with our newly released content!"
- "Your journey to excellence just got even better!"
- "Don't miss out on this game-changing update!"

Create the notification:

1. TITLE (5-8 words): Natural, conversational title
   - Like you're announcing it casually
   - Specific about what's new
   - No excessive excitement

2. MESSAGE (40-80 words): Casual message that:
   - Mentions what's new naturally
   - Sounds like you're talking, not writing marketing copy
   - Includes why it's useful (if relevant)
   - Feels personal and genuine
   - NO emojis or max 1 if it feels natural

3. EMAIL SUBJECT (5-8 words): How you'd actually title an email
   - Casual and direct
   - No emoji spam
   - Natural language

4. EMAIL PREVIEW (10-20 words): First line of a real email
   - Conversational opening
   - Specific about what's new

Format as JSON:
{
  "title": "...",
  "message": "...",
  "emailSubject": "...",
  "emailPreview": "..."
}`;

      const completion: OpenAI.Chat.Completions.ChatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9, // Higher for more natural, varied language
        max_tokens: 800,  // Shorter = more concise and human
        response_format: { type: "json_object" },
      });

      const copy: any = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        success: true,
        copy,
      };

    } catch (error) {
      console.error("Error generating notification copy:", error);
      return {
        success: false,
        error: `Failed to generate notification: ${error}`,
      };
    }
  },
});

// Internal: Send emails to students (scheduled action)
export const sendCourseUpdateEmails = internalAction({
  args: {
    courseId: v.id("courses"),
    studentIds: v.array(v.string()),
    emailSubject: v.string(),
    emailPreview: v.string(),
    emailBody: v.string(),
    courseSlug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    // TODO: Integrate with your email system (Resend/ActiveCampaign)
    console.log(`📧 Sending course update emails to ${args.studentIds.length} students`);
    console.log(`Subject: ${args.emailSubject}`);
    console.log(`Preview: ${args.emailPreview}`);
    
    // For now, just log - you can implement actual email sending later
    return null;
  },
});
