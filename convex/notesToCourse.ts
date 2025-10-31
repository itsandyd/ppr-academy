"use node";

import { action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

// ==================== NOTES TO COURSE GENERATION ====================

/**
 * Generate a course structure from selected notes using AI
 */
export const generateCourseFromNotes: any = action({
  args: {
    noteIds: v.array(v.id("notes")),
    userId: v.string(),
    storeId: v.string(),
    courseTitle: v.string(),
    courseDescription: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    courseCategory: v.optional(v.string()),
    skillLevel: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    preferredModuleCount: v.optional(v.number()),
    includeQuizzes: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    courseId: v.optional(v.id("courses")),
    courseStructure: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log("🎯 Starting notes-to-course generation...");
      
      // Validate user has access to notes
      const notes = await ctx.runQuery(internal.notes.validateNotesAccess, {
        noteIds: args.noteIds,
        userId: args.userId,
      });
      
      if (notes.length === 0) {
        return {
          success: false,
          error: "No valid notes found or access denied",
        };
      }
      
      console.log(`📚 Processing ${notes.length} notes for course generation`);
      
      // Get related content using RAG for additional context
      // TODO: Fix RAG integration after basic functions are deployed
      const ragContext: any[] = [];
      
      console.log(`🔍 Found ${ragContext.length} related notes via RAG`);
      
      // Generate course structure using AI
      const courseStructure = await generateCourseStructureFromNotes({
        notes,
        ragContext,
        courseTitle: args.courseTitle,
        courseDescription: args.courseDescription,
        targetAudience: args.targetAudience,
        courseCategory: args.courseCategory,
        skillLevel: args.skillLevel || "intermediate",
        preferredModuleCount: args.preferredModuleCount || 4,
        includeQuizzes: args.includeQuizzes || true,
      });
      
      console.log("🧠 AI course structure generated, creating in database...");
      
      // Create the course in the database
      const courseResult: any = await ctx.runMutation(api.courses.createCourseWithData, {
        userId: args.userId,
        storeId: args.storeId,
        data: {
          title: courseStructure.title,
          description: courseStructure.description,
          price: "0", // Default to free, user can change later
          category: args.courseCategory,
          skillLevel: args.skillLevel,
          thumbnail: courseStructure.thumbnail,
          checkoutHeadline: `Learn ${courseStructure.title}`,
          modules: courseStructure.modules,
        },
      });
      
      if (!courseResult.success || !courseResult.courseId) {
        return {
          success: false,
          error: "Failed to create course in database",
        };
      }
      
      // Link notes to the generated course
      await ctx.runMutation(internal.notes.linkNotesToCourse, {
        noteIds: args.noteIds,
        courseId: courseResult.courseId,
      });
      
      console.log(`✅ Course created successfully: ${courseResult.courseId}`);
      
      return {
        success: true,
        courseId: courseResult.courseId,
        courseStructure,
      };
      
    } catch (error) {
      console.error("❌ Error generating course from notes:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Get AI suggestions for improving notes before course generation
 */
export const getNotesImprovementSuggestions: any = action({
  args: {
    noteIds: v.array(v.id("notes")),
    userId: v.string(),
    courseGoal: v.string(),
  },
  returns: v.object({
    suggestions: v.array(v.object({
      noteId: v.id("notes"),
      noteTitle: v.string(),
      suggestions: v.array(v.string()),
      missingTopics: v.array(v.string()),
      qualityScore: v.number(), // 1-10
    })),
    overallRecommendations: v.array(v.string()),
    estimatedCourseLength: v.string(),
    recommendedStructure: v.any(),
  }),
  handler: async (ctx, args): Promise<any> => {
    const notes: any = await ctx.runQuery(internal.notes.validateNotesAccess, {
      noteIds: args.noteIds,
      userId: args.userId,
    });
    
    if (notes.length === 0) {
      return {
        suggestions: [],
        overallRecommendations: ["No notes found or access denied"],
        estimatedCourseLength: "Unknown",
        recommendedStructure: null,
      };
    }
    
    return await analyzeNotesForCourseCreation({
      notes,
      courseGoal: args.courseGoal,
    });
  },
});

/**
 * Generate AI summary for a collection of notes
 */
export const generateNotesSummary: any = action({
  args: {
    noteIds: v.array(v.id("notes")),
    userId: v.string(),
    summaryType: v.optional(v.union(
      v.literal("brief"),
      v.literal("detailed"),
      v.literal("outline"),
      v.literal("key_points")
    )),
  },
  returns: v.object({
    summary: v.string(),
    keyTopics: v.array(v.string()),
    suggestedTags: v.array(v.string()),
    wordCount: v.number(),
    estimatedReadTime: v.number(),
  }),
  handler: async (ctx, args): Promise<any> => {
    const notes: any = await ctx.runQuery(internal.notes.validateNotesAccess, {
      noteIds: args.noteIds,
      userId: args.userId,
    });
    
    if (notes.length === 0) {
      return {
        summary: "No notes found or access denied",
        keyTopics: [],
        suggestedTags: [],
        wordCount: 0,
        estimatedReadTime: 0,
      };
    }
    
    return await generateAISummary({
      notes,
      summaryType: args.summaryType || "detailed",
    });
  },
});

// ==================== INTERNAL FUNCTIONS ====================

// validateNotesAccess moved to notes.ts since queries can't be in Node.js files

// linkNotesToCourse moved to notes.ts since mutations can't be in Node.js files

// ==================== AI HELPER FUNCTIONS ====================

async function generateCourseStructureFromNotes({
  notes,
  ragContext,
  courseTitle,
  courseDescription,
  targetAudience,
  courseCategory,
  skillLevel,
  preferredModuleCount,
  includeQuizzes,
}: {
  notes: any[];
  ragContext: any[];
  courseTitle: string;
  courseDescription?: string;
  targetAudience?: string;
  courseCategory?: string;
  skillLevel: string;
  preferredModuleCount: number;
  includeQuizzes: boolean;
}) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  // Prepare notes content for AI
  const notesContent = notes.map((note, index) => 
    `=== NOTE ${index + 1}: ${note.title} ===\n${note.plainTextContent || note.content}\nTags: ${note.tags.join(', ')}\n`
  ).join('\n\n');

  // Prepare RAG context
  const ragContent = ragContext.length > 0 ? 
    ragContext.map((item, index) => 
      `=== RELATED CONTENT ${index + 1} ===\n${item.content}\n`
    ).join('\n\n') : '';

  const systemPrompt = `You are an expert instructional designer and course creator. Your task is to analyze the provided notes and create a comprehensive, well-structured online course.

Key Requirements:
- Create exactly ${preferredModuleCount} modules (or justify a different number)
- Each module should have 3-5 lessons
- Include learning objectives for each module and lesson
- Structure content logically from basic to advanced concepts
- ${includeQuizzes ? 'Include quiz questions for each module' : 'Do not include quizzes'}
- Ensure content flows naturally and builds upon previous lessons
- Target audience: ${targetAudience || 'General learners'}
- Skill level: ${skillLevel}

Return a JSON object with this exact structure:
{
  "title": "${courseTitle}",
  "description": "Detailed course description based on notes content",
  "thumbnail": "Suggestion for course thumbnail/image",
  "estimatedHours": "Estimated completion time",
  "learningOutcomes": ["List of key learning outcomes"],
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "learningObjectives": ["List of objectives"],
      "lessons": [
        {
          "title": "Lesson title",
          "description": "Lesson description",
          "content": "Detailed lesson content derived from notes",
          "duration": "Estimated duration in minutes",
          "type": "video|text|interactive",
          "keyPoints": ["List of key points"],
          "resources": ["Additional resources if relevant"]
        }
      ],
      ${includeQuizzes ? '"quiz": { "questions": [{"question": "Question text", "type": "multiple_choice|true_false", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Why this is correct"}] },' : ''}
      "estimatedDuration": "Module duration"
    }
  ],
  "prerequisites": ["List any prerequisites"],
  "targetAudience": "${targetAudience || 'Description of ideal student'}",
  "difficulty": "${skillLevel}",
  "tags": ["Relevant course tags"],
  "aiGenerated": true,
  "sourceNotes": ${notes.length},
  "generatedAt": "${new Date().toISOString()}"
}`;

  const userPrompt = `Course Title: ${courseTitle}
Course Description: ${courseDescription || 'Generate based on notes content'}
Course Category: ${courseCategory || 'General'}

=== NOTES TO CONVERT (${notes.length} notes) ===
${notesContent}

${ragContent ? `=== ADDITIONAL RELATED CONTENT ===\n${ragContent}` : ''}

Please analyze these notes and create a comprehensive course structure. Focus on:
1. Extracting key concepts and organizing them logically
2. Creating engaging lesson titles and descriptions
3. Ensuring proper learning progression
4. Including practical examples and exercises where possible
5. Making the content accessible for ${skillLevel} level learners`;

  console.log("🤖 Calling OpenAI to generate course structure...");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from OpenAI");
  }

  try {
    const courseStructure = JSON.parse(responseText);
    console.log("✅ Course structure parsed successfully");
    return courseStructure;
  } catch (error) {
    console.error("❌ Failed to parse OpenAI response:", error);
    throw new Error("Failed to parse AI response");
  }
}

async function analyzeNotesForCourseCreation({
  notes,
  courseGoal,
}: {
  notes: any[];
  courseGoal: string;
}) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const notesContent = notes.map((note, index) => 
    `=== NOTE ${index + 1}: ${note.title} ===\nWord Count: ${note.wordCount || 0}\nContent: ${note.plainTextContent || note.content}\n`
  ).join('\n\n');

  const systemPrompt = `You are an expert course development consultant. Analyze the provided notes and give detailed feedback on how to improve them for course creation.

Evaluate each note on:
1. Content clarity and completeness
2. Educational value
3. Structure and organization
4. Missing information or gaps
5. Potential for engagement

Provide a quality score (1-10) for each note and specific suggestions for improvement.

Return a JSON object with this structure:
{
  "suggestions": [
    {
      "noteId": "note_id",
      "noteTitle": "title",
      "suggestions": ["List of specific improvements"],
      "missingTopics": ["Topics that should be added"],
      "qualityScore": 7
    }
  ],
  "overallRecommendations": ["General recommendations for the note collection"],
  "estimatedCourseLength": "X hours/modules",
  "recommendedStructure": {
    "modules": 4,
    "lessonsPerModule": 3,
    "totalLessons": 12,
    "reasoning": "Why this structure makes sense"
  }
}`;

  const userPrompt = `Course Goal: ${courseGoal}

Notes to analyze (${notes.length} notes):
${notesContent}

Please provide detailed analysis and improvement suggestions for creating a high-quality course.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(responseText);
}

async function generateAISummary({
  notes,
  summaryType,
}: {
  notes: any[];
  summaryType: string;
}) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const notesContent = notes.map((note, index) => 
    `=== NOTE ${index + 1}: ${note.title} ===\n${note.plainTextContent || note.content}\n`
  ).join('\n\n');

  const totalWordCount = notes.reduce((sum, note) => sum + (note.wordCount || 0), 0);
  const totalReadTime = Math.ceil(totalWordCount / 200);

  const summaryPrompts = {
    brief: "Create a concise 2-3 paragraph summary highlighting the main points.",
    detailed: "Create a comprehensive summary that covers all major topics and subtopics with key details.",
    outline: "Create a structured outline with main topics, subtopics, and bullet points.",
    key_points: "Extract and list the most important key points, insights, and takeaways."
  };

  const systemPrompt = `You are an expert at analyzing and summarizing educational content. 
${summaryPrompts[summaryType as keyof typeof summaryPrompts]}

Also extract:
- Key topics covered
- Suggested tags for categorization
- Main themes and concepts

Return a JSON object with:
{
  "summary": "The generated summary",
  "keyTopics": ["List of main topics"],
  "suggestedTags": ["Relevant tags"],
  "wordCount": ${totalWordCount},
  "estimatedReadTime": ${totalReadTime}
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please summarize these ${notes.length} notes:\n\n${notesContent}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(responseText);
}
