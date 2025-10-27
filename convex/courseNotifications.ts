"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
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
  returns: v.object({
    sent: v.number(),
    skipped: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    sent: number;
    skipped: number;
    failed: number;
  }> => {
    const resendApiKey = process.env.RESEND_API_KEY;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    console.log(`📧 Processing course update emails for ${args.studentIds.length} students`);

    for (const studentId of args.studentIds) {
      try {
        // Check if user has email notifications enabled for course updates
        const shouldSend: boolean = await ctx.runQuery(
          internal.notificationPreferences.shouldSendEmailInternal,
          {
            userId: studentId,
            category: "courseUpdates",
          }
        );

        if (!shouldSend) {
          console.log(`⏭️ Skipping email for ${studentId} - course update emails disabled`);
          skipped++;
          continue;
        }

        // Get user email
        const user: any = await ctx.runQuery(
          api.users.getUserFromClerk,
          { clerkId: studentId }
        );

        if (!user?.email) {
          console.log(`⚠️ No email found for user ${studentId}`);
          skipped++;
          continue;
        }

        // If Resend is configured, send email
        if (resendApiKey) {
          const fromEmail = process.env.RESEND_FROM_EMAIL || "updates@pauseplayrepeat.com";

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: user.email,
              subject: args.emailSubject,
              html: generateCourseUpdateEmailHTML(
                args.emailSubject,
                args.emailBody,
                args.courseSlug
              ),
            }),
          });

          if (response.ok) {
            console.log(`✅ Email sent to ${user.email}`);
            sent++;
          } else {
            const error = await response.text();
            console.error(`❌ Failed to send email to ${user.email}:`, error);
            failed++;
          }
        } else {
          console.log(`📧 Would send to ${user.email}: ${args.emailSubject}`);
          sent++;
        }
      } catch (error) {
        console.error(`Error processing email for ${studentId}:`, error);
        failed++;
      }
    }

    console.log(`📊 Email summary: ${sent} sent, ${skipped} skipped (preferences), ${failed} failed`);

    return { sent, skipped, failed };
  },
});

// Helper to generate course update email HTML
function generateCourseUpdateEmailHTML(
  subject: string,
  message: string,
  courseSlug: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academy.pauseplayrepeat.com";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">
      ${subject}
    </h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; white-space: pre-wrap;">
      ${message}
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/courses/${courseSlug}" 
         style="display: inline-block; background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Course
      </a>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
      <p style="margin: 0 0 10px 0;">You received this because you're enrolled in this course.</p>
      <p style="margin: 0;">
        <a href="${appUrl}/settings/notifications" 
           style="color: #667eea; text-decoration: none;">
          Manage your notification preferences
        </a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
