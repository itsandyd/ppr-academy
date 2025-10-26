"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate viral video script from course content
export const generateViralVideoScript = action({
  args: {
    userId: v.string(),
    topic: v.string(),
    platform: v.union(
      v.literal("tiktok"),
      v.literal("youtube-short"),
      v.literal("instagram-reel"),
      v.literal("youtube-long")
    ),
    tone: v.optional(v.union(
      v.literal("educational"),
      v.literal("entertaining"),
      v.literal("motivational"),
      v.literal("storytelling")
    )),
    targetAudience: v.optional(v.string()),
    courseIds: v.optional(v.array(v.id("courses"))), // Optional: specific courses to base on
  },
  returns: v.object({
    success: v.boolean(),
    script: v.optional(v.string()),
    hook: v.optional(v.string()),
    mainPoints: v.optional(v.array(v.string())),
    cta: v.optional(v.string()),
    estimatedDuration: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    script?: string;
    hook?: string;
    mainPoints?: string[];
    cta?: string;
    estimatedDuration?: string;
    error?: string;
  }> => {
    try {
      // Step 1: Retrieve relevant course content using RAG
      const relevantContent: any = await ctx.runAction(api.ragActions.searchSimilar, {
        query: args.topic,
        userId: args.userId,
        limit: 5,
        threshold: 0.6,
      });

      if (!relevantContent || relevantContent.length === 0) {
        return {
          success: false,
          error: "No relevant course content found. Please create some courses first.",
        };
      }

      // Step 2: Get course creator styles (if specific courses provided)
      let creatorStyles = "";
      if (args.courseIds && args.courseIds.length > 0) {
        const courses = await Promise.all(
          args.courseIds.map(async (courseId) => {
            return await ctx.runQuery(internal.embeddings.getAllCourses, {});
          })
        );
        
        // Extract writing style characteristics
        creatorStyles = "\n\nCourse Creator Writing Styles to Match:\n" +
          relevantContent.slice(0, 2).map((content: any) => content.content).join("\n\n");
      }

      // Step 3: Build context from retrieved content
      const contextContent: string = relevantContent
        .map((content: any, index: number) => {
          return `[Course ${index + 1}: ${content.title}]\n${content.content}`;
        })
        .join("\n\n---\n\n");

      // Step 4: Platform-specific formatting guidelines
      const platformGuidelines = {
        "tiktok": {
          duration: "15-60 seconds",
          structure: "Hook (3s) → Value (40s) → CTA (7s)",
          style: "Fast-paced, energetic, trend-aware",
        },
        "youtube-short": {
          duration: "30-60 seconds",
          structure: "Hook (5s) → Teaching (45s) → CTA (10s)",
          style: "Educational but entertaining",
        },
        "instagram-reel": {
          duration: "15-90 seconds",
          structure: "Visual Hook (3s) → Story/Teaching (70s) → CTA (7s)",
          style: "Aesthetic, relatable, authentic",
        },
        "youtube-long": {
          duration: "8-15 minutes",
          structure: "Intro (30s) → Main Content (7-13min) → Recap & CTA (1min)",
          style: "Deep-dive, comprehensive, educational",
        },
      };

      const guidelines = platformGuidelines[args.platform];

      // Step 5: Generate script using GPT-4
      const systemPrompt = `You are a viral content creator and expert educator specializing in ${args.platform} content. 

Your task is to create engaging, viral-worthy video scripts that:
1. Hook viewers in the first 3 seconds
2. Deliver immense value quickly
3. Match the writing style and teaching approach from the provided course content
4. Are optimized for ${args.platform}

Platform Guidelines:
- Duration: ${guidelines.duration}
- Structure: ${guidelines.structure}
- Style: ${guidelines.style}

Target Audience: ${args.targetAudience || "Music producers, beatmakers, and audio creators"}
Tone: ${args.tone || "educational"}

${creatorStyles}`;

      const userPrompt: string = `Based on the following course content, create a viral ${args.platform} video script about: "${args.topic}"

COURSE CONTENT FOR REFERENCE:
${contextContent}

REQUIREMENTS:
1. Start with a powerful hook that stops scrolling
2. Use the teaching style and terminology from the course content above
3. Include 3-5 key takeaways/lessons
4. Add a compelling call-to-action
5. Format as a complete script with [VISUAL NOTES] for what to show on screen
6. Keep it within ${guidelines.duration}

Generate the script now:`;

      const completion: OpenAI.Chat.Completions.ChatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const script: string = completion.choices[0].message.content || "";

      // Step 6: Extract structured elements
      const hookMatch = script.match(/HOOK[:\s]+(.*?)(?:\n\n|MAIN|BODY)/is);
      const ctaMatch = script.match(/(?:CTA|CALL TO ACTION|OUTRO)[:\s]+(.*?)(?:\n\n|$)/is);
      
      return {
        success: true,
        script: script,
        hook: hookMatch?.[1]?.trim(),
        mainPoints: extractMainPoints(script),
        cta: ctaMatch?.[1]?.trim(),
        estimatedDuration: guidelines.duration,
      };

    } catch (error) {
      console.error("Error generating viral video script:", error);
      return {
        success: false,
        error: `Failed to generate script: ${error}`,
      };
    }
  },
});

// Generate new course outline based on existing content
export const generateCourseFromContent = action({
  args: {
    userId: v.string(),
    courseTitle: v.string(),
    courseDescription: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    skillLevel: v.union(
      v.literal("Beginner"),
      v.literal("Intermediate"),
      v.literal("Advanced")
    ),
    numberOfModules: v.optional(v.number()),
    similarCourseIds: v.optional(v.array(v.id("courses"))), // Learn from these courses
  },
  returns: v.object({
    success: v.boolean(),
    outline: v.optional(v.object({
      modules: v.array(v.object({
        title: v.string(),
        description: v.string(),
        lessons: v.array(v.object({
          title: v.string(),
          description: v.string(),
          keyPoints: v.array(v.string()),
        })),
      })),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    outline?: {
      modules: Array<{
        title: string;
        description: string;
        lessons: Array<{
          title: string;
          description: string;
          keyPoints: string[];
        }>;
      }>;
    };
    error?: string;
  }> => {
    try {
      // Step 1: Get relevant existing course content
      const relevantContent: any = await ctx.runAction(api.ragActions.searchSimilar, {
        query: `${args.courseTitle} ${args.courseDescription}`,
        userId: args.userId,
        limit: 10,
        threshold: 0.6,
      });

      // Step 2: Analyze similar courses to learn structure
      let courseStructureExamples: string = "";
      if (args.similarCourseIds && args.similarCourseIds.length > 0) {
        const similarCourses: any = await Promise.all(
          args.similarCourseIds.map((courseId) =>
            ctx.runQuery(api.courses.getCourseForEdit, {
              courseId,
              userId: args.userId,
            })
          )
        );

        courseStructureExamples = similarCourses
          .filter(Boolean)
          .map((course: any) => {
            const modules = course.modules || [];
            return `
Course: ${course.title}
Structure: ${modules.length} modules
Example Module: ${modules[0]?.title || "N/A"}
- Lessons: ${modules[0]?.lessons?.length || 0}
Teaching Style: ${course.skillLevel}`;
          })
          .join("\n\n");
      }

      // Step 3: Build context
      const contextContent: string = relevantContent
        .map((content: any) => content.content)
        .join("\n\n");

      // Step 4: Generate course outline
      const systemPrompt: string = `You are an expert course designer and educator. Create comprehensive, well-structured course outlines that:
1. Follow proven educational frameworks
2. Build knowledge progressively
3. Include practical exercises and examples
4. Match the teaching style of existing courses

Skill Level: ${args.skillLevel}
Category: ${args.category}${args.subcategory ? ` > ${args.subcategory}` : ""}`;

      const userPrompt: string = `Create a detailed course outline for:

TITLE: ${args.courseTitle}
DESCRIPTION: ${args.courseDescription}
MODULES: ${args.numberOfModules || "4-6 modules"}

REFERENCE CONTENT (use this to inform your outline):
${contextContent}

${courseStructureExamples ? `\nSIMILAR COURSE STRUCTURES:\n${courseStructureExamples}` : ""}

Create a course outline with:
- ${args.numberOfModules || 5} modules
- 3-5 lessons per module
- 3-5 key learning points per lesson
- Progressive difficulty
- Practical applications

Format as JSON with this structure:
{
  "modules": [
    {
      "title": "Module Title",
      "description": "What students will learn",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson overview",
          "keyPoints": ["Point 1", "Point 2", "Point 3"]
        }
      ]
    }
  ]
}`;

      const completion: OpenAI.Chat.Completions.ChatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });

      const outline: any = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        success: true,
        outline,
      };

    } catch (error) {
      console.error("Error generating course outline:", error);
      return {
        success: false,
        error: `Failed to generate course outline: ${error}`,
      };
    }
  },
});

// Generate landing page copy from course structure
export const generateLandingPageCopy = action({
  args: {
    courseId: v.id("courses"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    copy: v.optional(v.object({
      headline: v.string(),
      subheadline: v.string(),
      keyBenefits: v.array(v.string()),
      whoIsThisFor: v.array(v.string()),
      whatYouWillLearn: v.array(v.string()),
      transformationStatement: v.string(),
      urgencyStatement: v.string(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    copy?: {
      headline: string;
      subheadline: string;
      keyBenefits: string[];
      whoIsThisFor: string[];
      whatYouWillLearn: string[];
      transformationStatement: string;
      urgencyStatement: string;
    };
    error?: string;
  }> => {
    try {
      // Get the full course with all modules, lessons, and chapters
      const course: any = await ctx.runQuery(api.courses.getCourseForEdit, {
        courseId: args.courseId,
        userId: args.userId,
      });

      if (!course) {
        return {
          success: false,
          error: "Course not found or you don't have permission to access it.",
        };
      }

      // Build comprehensive content summary
      const modules = course.modules || [];
      const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
      const totalChapters = modules.reduce((acc: number, m: any) => 
        acc + m.lessons?.reduce((lessAcc: number, l: any) => lessAcc + (l.chapters?.length || 0), 0) || 0, 0);

      // Extract all chapter titles and content for context
      const chapterSummary: string = modules
        .map((module: any, mIdx: number) => {
          const lessonsText = module.lessons?.map((lesson: any, lIdx: number) => {
            const chaptersText = lesson.chapters?.map((chapter: any) => 
              `      - ${chapter.title}`
            ).join('\n') || '';
            return `    ${lesson.title}\n${chaptersText}`;
          }).join('\n') || '';
          return `  Module ${mIdx + 1}: ${module.title}\n${lessonsText}`;
        })
        .join('\n\n');

      // Build the prompt
      const systemPrompt: string = `You are an expert copywriter specializing in online course marketing. Your goal is to create compelling, benefit-driven landing page copy that converts visitors into students.

Write in a way that:
1. Focuses on transformation and outcomes, not just features
2. Speaks directly to the target audience's pain points
3. Creates urgency without being pushy
4. Is specific and tangible, avoiding generic claims
5. Matches the teaching style and tone of the course content`;

      const userPrompt: string = `Create compelling landing page copy for this course:

COURSE DETAILS:
- Title: ${course.title}
- Description: ${course.description || "No description provided"}
- Category: ${course.category}${course.subcategory ? ` > ${course.subcategory}` : ""}
- Skill Level: ${course.skillLevel}
- Price: $${course.price || 0}
- Total Content: ${modules.length} modules, ${totalLessons} lessons, ${totalChapters} chapters

COURSE STRUCTURE:
${chapterSummary}

Generate landing page copy with these elements:

1. HEADLINE (10-15 words): Powerful, benefit-driven headline that stops scrolling
2. SUBHEADLINE (20-30 words): Expands on headline, addresses pain point and desired outcome
3. KEY BENEFITS (4-6 points): Specific transformations students will experience
4. WHO IS THIS FOR (4-5 points): Specific descriptions of ideal students
5. WHAT YOU WILL LEARN (6-8 points): Concrete skills/knowledge from the course content
6. TRANSFORMATION STATEMENT (30-50 words): Paint the "after" picture - where they'll be after completing
7. URGENCY STATEMENT (20-30 words): Gentle urgency without being pushy

Format as JSON:
{
  "headline": "...",
  "subheadline": "...",
  "keyBenefits": ["...", "..."],
  "whoIsThisFor": ["...", "..."],
  "whatYouWillLearn": ["...", "..."],
  "transformationStatement": "...",
  "urgencyStatement": "..."
}`;

      const completion: OpenAI.Chat.Completions.ChatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const copy: any = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        success: true,
        copy,
      };

    } catch (error) {
      console.error("Error generating landing page copy:", error);
      return {
        success: false,
        error: `Failed to generate landing page copy: ${error}`,
      };
    }
  },
});

// Helper function to extract main points
function extractMainPoints(script: string): string[] {
  const points: string[] = [];
  
  // Look for numbered points
  const numberedMatches = script.matchAll(/(?:^|\n)\s*\d+[\.)]\s*([^\n]+)/g);
  for (const match of numberedMatches) {
    points.push(match[1].trim());
  }
  
  // Look for bullet points
  if (points.length === 0) {
    const bulletMatches = script.matchAll(/(?:^|\n)\s*[-•]\s*([^\n]+)/g);
    for (const match of bulletMatches) {
      points.push(match[1].trim());
    }
  }
  
  return points.slice(0, 5);
}

