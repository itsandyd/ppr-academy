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
    matchExistingStyle: v.optional(v.boolean()), // NEW: Match user's existing course style
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
      
      // Get user's existing courses for style analysis (if requested)
      let existingCoursesAnalysis = "";
      if (args.matchExistingStyle) {
        console.log("🎨 Analyzing existing courses to match style...");
        const existingCourses = await ctx.runQuery(api.courses.getCoursesByStore, {
          storeId: args.storeId,
        });
        
        if (existingCourses && existingCourses.length > 0) {
          // Analyze the structure and style of existing courses
          existingCoursesAnalysis = await analyzeExistingCoursesStyle(ctx, existingCourses, args.userId);
          console.log(`✅ Analyzed ${existingCourses.length} existing courses`);
        }
      }
      
      // Get related content using RAG for additional context
      let ragContext: any[] = [];
      try {
        const ragResults = await ctx.runAction(api.ragActions.searchSimilar, {
          query: `${args.courseTitle} ${notes.map(n => n.title).join(" ")}`,
          userId: args.userId,
          sourceType: "note",
          limit: 5,
          threshold: 0.6,
        });
        ragContext = ragResults || [];
        console.log(`🔍 Found ${ragContext.length} related notes via RAG`);
      } catch (error) {
        console.log("⚠️ RAG search failed, continuing without additional context:", error);
        ragContext = [];
      }
      
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
        existingCoursesStyle: existingCoursesAnalysis, // NEW: Pass style analysis
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

/**
 * Analyze user's existing courses to understand their teaching style
 */
async function analyzeExistingCoursesStyle(ctx: any, courses: any[], userId: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
  });

  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ OpenAI API key not configured, skipping style analysis");
    return "";
  }

  // Get sample content from existing courses - LIMIT TO 3 COURSES AND REDUCE DATA
  const courseAnalysis: string[] = [];
  for (const course of courses.slice(0, 3)) { // Reduced from 5 to 3 courses
    try {
      // Get course modules directly from the database
      const modules = await ctx.runQuery(internal.notes.getModulesForStyleAnalysis, {
        courseId: course._id,
      });
      
      if (modules && modules.length > 0) {
        // Only include first 3 module titles to save tokens
        const sampleModules = modules.slice(0, 3).map((m: any) => m.title);
        
        courseAnalysis.push(`
Course: ${course.title}
Description: ${(course.description || 'N/A').substring(0, 150)}...
Category: ${course.category || 'N/A'}
Skill Level: ${course.skillLevel || 'N/A'}
Module Count: ${modules.length}
Sample Modules: ${sampleModules.join(", ")}
`);
      }
    } catch (error) {
      console.log(`⚠️ Could not analyze course ${course._id}`);
    }
  }

  if (courseAnalysis.length === 0) {
    return "";
  }

  const analysisPrompt = `Analyze these courses and identify the creator's teaching style in 2 CONCISE paragraphs:

${courseAnalysis.join('\n---\n')}

Focus on: 1) Structural patterns 2) Teaching tone
Keep your response under 200 words.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a concise educational content analyst. Be brief.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      max_completion_tokens: 500, // Reduced from 1000
    });

    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("❌ Error analyzing existing courses:", error);
    return ""; // Fail gracefully
  }
}

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
  existingCoursesStyle, // NEW: Style analysis from existing courses
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
  existingCoursesStyle?: string; // NEW
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

  // Add style matching instruction if we have existing course analysis
  const styleInstruction = existingCoursesStyle ? `

=== IMPORTANT: MATCH CREATOR'S EXISTING STYLE ===
This creator has an established teaching style and course structure. Here's the analysis of their existing courses:

${existingCoursesStyle}

CRITICAL: The course you generate MUST match this creator's style in:
- Module and lesson structure patterns
- Writing tone and approach
- Content depth and detail level
- Target audience communication style
- Overall course organization

Generate a course that feels like it was created by this same educator, maintaining consistency with their other courses.
` : '';

  const systemPrompt = `You are an expert instructional designer and course creator. Your task is to analyze the provided notes and create a comprehensive, well-structured online course.

Key Requirements:
- Create exactly ${preferredModuleCount} modules (or justify a different number)
- Each module should have 3-5 lessons
- **CRITICAL: Each lesson MUST contain 2-4 chapters with detailed content**
- Include learning objectives for each module and lesson
- Structure content logically from basic to advanced concepts
- ${includeQuizzes ? 'Include quiz questions for each module' : 'Do not include quizzes'}
- Ensure content flows naturally and builds upon previous lessons
- Target audience: ${targetAudience || 'General learners'}
- Skill level: ${skillLevel}
${styleInstruction}

**CHAPTERS ARE MANDATORY**: Every lesson must have a "chapters" array with 2-4 chapter objects. Do not skip this!

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
      "orderIndex": 0,
      "learningObjectives": ["List of objectives"],
      "lessons": [
        {
          "title": "Lesson title",
          "description": "Lesson description",
          "orderIndex": 0,
          "chapters": [
            {
              "title": "Chapter title",
              "content": "Detailed chapter content with at least 3-5 paragraphs of teaching material",
              "description": "Brief chapter summary",
              "orderIndex": 0
            },
            {
              "title": "Second chapter title",
              "content": "More detailed teaching content",
              "description": "Brief chapter summary",
              "orderIndex": 1
            }
          ]
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
}

CRITICAL INSTRUCTION: The "chapters" array inside each lesson is MANDATORY. Every lesson must have at least 2 chapters. The chapter "content" field should contain the actual teaching material (multiple paragraphs). Do NOT omit chapters!`;

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

  // STEP 1: Generate course outline (modules + lessons only, no chapters yet)
  const outlineCompletion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 16000,
  });

  console.log("📊 OpenAI Response:", {
    hasChoices: !!outlineCompletion.choices,
    choicesLength: outlineCompletion.choices?.length,
    hasMessage: !!outlineCompletion.choices?.[0]?.message,
    hasContent: !!outlineCompletion.choices?.[0]?.message?.content,
    finishReason: outlineCompletion.choices?.[0]?.finish_reason,
  });

  const responseText = outlineCompletion.choices[0].message.content;
  if (!responseText) {
    console.error("❌ No content in OpenAI response. Full completion:", JSON.stringify(outlineCompletion, null, 2));
    throw new Error("No response from OpenAI");
  }

  let courseStructure;
  try {
    courseStructure = JSON.parse(responseText);
    console.log("✅ Course outline parsed successfully");
  } catch (error) {
    console.error("❌ Failed to parse OpenAI response:", error);
    throw new Error("Failed to parse AI response");
  }

  // STEP 2: Generate chapters for each lesson separately (to avoid token limits)
  console.log("📚 Generating chapters for all lessons in parallel...");
  
  if (courseStructure.modules && Array.isArray(courseStructure.modules)) {
    // Collect all chapter generation promises to run in parallel
    const chapterPromises: Promise<void>[] = [];
    
    for (let moduleIndex = 0; moduleIndex < courseStructure.modules.length; moduleIndex++) {
      const module = courseStructure.modules[moduleIndex];
      
      if (module.lessons && Array.isArray(module.lessons)) {
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
          const lesson = module.lessons[lessonIndex];
          
          // Create a promise for this lesson's chapter generation
          const chapterPromise = (async () => {
            console.log(`  🔄 Generating chapters for: Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1}: "${lesson.title}"`);
            
            const chapterPrompt = `Generate 2-4 chapters for this lesson based on the notes content:

Lesson Title: ${lesson.title}
Lesson Description: ${lesson.description || 'N/A'}
Module Context: ${module.title}

Notes Content:
${notesContent.substring(0, 3000)}

Create 2-4 chapters that break down this lesson into digestible learning units. Each chapter should have:
- title: Clear, descriptive chapter title
- content: 3-5 paragraphs of detailed teaching material
- description: 1-sentence summary

Return ONLY a JSON array of chapters:
[
  {
    "title": "Chapter 1 title",
    "content": "Detailed teaching content here...",
    "description": "Brief summary",
    "orderIndex": 0
  }
]`;

            try {
              const chapterCompletion = await openai.chat.completions.create({
                model: "gpt-5",
                messages: [
                  { role: "system", content: "You are an expert instructional designer. Generate detailed chapter content." },
                  { role: "user", content: chapterPrompt },
                ],
                response_format: { type: "json_object" },
                max_completion_tokens: 2000,
              });

              const chapterResponse = chapterCompletion.choices[0].message.content;
              if (chapterResponse) {
                const chaptersData = JSON.parse(chapterResponse);
                // Handle both array and object with chapters property
                lesson.chapters = Array.isArray(chaptersData) ? chaptersData : (chaptersData.chapters || []);
                console.log(`    ✅ Generated ${lesson.chapters.length} chapters for "${lesson.title}"`);
              }
            } catch (error) {
              console.error(`    ❌ Failed to generate chapters for lesson "${lesson.title}":`, error);
              // Create a default chapter so lesson isn't empty
              lesson.chapters = [{
                title: lesson.title,
                content: lesson.description || "Content to be added",
                description: lesson.description || "",
                orderIndex: 0,
              }];
            }
          })();
          
          chapterPromises.push(chapterPromise);
        }
      }
    }
    
    // Wait for all chapter generation to complete
    console.log(`⏳ Waiting for ${chapterPromises.length} chapter generations to complete...`);
    await Promise.all(chapterPromises);
  }

  console.log("✅ All chapters generated successfully");
  return courseStructure;
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
    model: "gpt-5",
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
    model: "gpt-5",
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
