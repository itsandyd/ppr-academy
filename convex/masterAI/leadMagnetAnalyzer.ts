"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { callLLM, safeParseJson } from "./llmClient";
import { type ModelId } from "./types";
import { createFalClient } from "@fal-ai/client";

// Workaround for TypeScript deep instantiation issue with internal references
// eslint-disable-next-line @typescript-eslint/no-var-requires
const internalRef = require("../_generated/api").internal;

// ============================================================================
// TYPES & VALIDATORS
// ============================================================================

/**
 * A visual idea represents a potential illustration for a chapter section
 */
const visualIdeaValidator = v.object({
  sentenceOrConcept: v.string(),        // The text that would benefit from a visual
  visualDescription: v.string(),        // What the image should show
  illustrationPrompt: v.string(),       // Ready-to-use prompt for FAL AI
  importance: v.union(                  // How important is this visual
    v.literal("critical"),              // Essential for understanding
    v.literal("helpful"),               // Adds value but not essential
    v.literal("optional")               // Nice to have
  ),
  category: v.union(                    // Type of visual
    v.literal("concept_diagram"),       // Explains a concept
    v.literal("process_flow"),          // Shows a workflow/process
    v.literal("comparison"),            // Before/after, A vs B
    v.literal("equipment_setup"),       // Shows gear/software setup
    v.literal("waveform_visual"),       // Audio/signal visualization
    v.literal("ui_screenshot"),         // Software interface
    v.literal("metaphor"),              // Abstract concept visualization
    v.literal("example")                // Concrete example illustration
  ),
  leadMagnetPotential: v.number(),      // 1-10 score for standalone PDF value
  estimatedPosition: v.number(),        // Approximate position in the chapter (0-1)
  // Embedding for semantic search (generated from prompt + description)
  embedding: v.optional(v.array(v.number())),
  embeddingText: v.optional(v.string()), // The text used to generate the embedding
});

export type VisualIdea = {
  sentenceOrConcept: string;
  visualDescription: string;
  illustrationPrompt: string;
  importance: "critical" | "helpful" | "optional";
  category: "concept_diagram" | "process_flow" | "comparison" | "equipment_setup" | "waveform_visual" | "ui_screenshot" | "metaphor" | "example";
  leadMagnetPotential: number;
  estimatedPosition: number;
  embedding?: number[];
  embeddingText?: string;
};

/**
 * Analysis result for a single chapter
 */
const chapterAnalysisValidator = v.object({
  chapterId: v.string(),
  chapterTitle: v.string(),
  lessonId: v.optional(v.string()),
  lessonTitle: v.optional(v.string()),
  moduleTitle: v.optional(v.string()),
  wordCount: v.number(),
  visualIdeas: v.array(visualIdeaValidator),
  overallLeadMagnetScore: v.number(),   // 1-10 overall suitability for PDF
  leadMagnetSuggestions: v.array(v.string()), // Ideas for how to package as lead magnet
  keyTopics: v.array(v.string()),       // Main topics covered
});

export type ChapterAnalysis = {
  chapterId: string;
  chapterTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  wordCount: number;
  visualIdeas: VisualIdea[];
  overallLeadMagnetScore: number;
  leadMagnetSuggestions: string[];
  keyTopics: string[];
};

/**
 * Full course analysis result
 */
const courseLeadMagnetAnalysisValidator = v.object({
  courseId: v.string(),
  courseTitle: v.string(),
  totalChapters: v.number(),
  analyzedChapters: v.number(),
  totalVisualIdeas: v.number(),
  chapters: v.array(chapterAnalysisValidator),
  topLeadMagnetCandidates: v.array(v.object({
    chapterId: v.string(),
    chapterTitle: v.string(),
    score: v.number(),
    reason: v.string(),
  })),
  bundleIdeas: v.array(v.object({
    name: v.string(),
    description: v.string(),
    chapterIds: v.array(v.string()),
    estimatedVisuals: v.number(),
  })),
  analysisTimestamp: v.number(),
});

export type CourseLeadMagnetAnalysis = {
  courseId: string;
  courseTitle: string;
  totalChapters: number;
  analyzedChapters: number;
  totalVisualIdeas: number;
  chapters: ChapterAnalysis[];
  topLeadMagnetCandidates: Array<{
    chapterId: string;
    chapterTitle: string;
    score: number;
    reason: string;
  }>;
  bundleIdeas: Array<{
    name: string;
    description: string;
    chapterIds: string[];
    estimatedVisuals: number;
  }>;
  analysisTimestamp: number;
};

// ============================================================================
// INTERNAL ACTIONS
// ============================================================================

/**
 * Analyze a single chapter's content for visual opportunities
 */
export const analyzeChapterContent = internalAction({
  args: {
    chapterId: v.string(),
    chapterTitle: v.string(),
    chapterContent: v.string(), // HTML content from description
    lessonId: v.optional(v.string()),
    lessonTitle: v.optional(v.string()),
    moduleTitle: v.optional(v.string()),
    generateEmbeddings: v.optional(v.boolean()), // Generate embeddings for semantic search
  },
  returns: chapterAnalysisValidator,
  handler: async (ctx, args): Promise<ChapterAnalysis> => {
    const { chapterId, chapterTitle, chapterContent, lessonId, lessonTitle, moduleTitle, generateEmbeddings } = args;

    // Clean HTML to plain text for analysis
    const plainText = stripHtmlTags(chapterContent);
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

    // Skip very short chapters
    if (wordCount < 100) {
      return {
        chapterId,
        chapterTitle,
        lessonId,
        lessonTitle,
        moduleTitle,
        wordCount,
        visualIdeas: [],
        overallLeadMagnetScore: 1,
        leadMagnetSuggestions: ["Chapter too short for meaningful visuals"],
        keyTopics: [],
      };
    }

    // Use Gemini 2.5 Flash for analysis - fastest and excellent at structured JSON
    // Same cost as GPT-4o-mini but faster with 65K output limit
    // Switch to "gemini-2.5-flash-lite" for half the cost if needed
    const modelId: ModelId = "gemini-2.5-flash";

    const systemPrompt = `You are an expert at analyzing educational content and identifying opportunities for visual illustrations that enhance learning and can be repurposed as lead magnet materials (PDF guides, cheat sheets, infographics).

Your task is to analyze a chapter from a music production course and identify:
1. Key sentences or concepts that would benefit from visual illustrations
2. What type of visual would work best for each
3. How suitable the content is for packaging as a standalone PDF lead magnet

For each visual opportunity, provide:
- The specific text or concept to illustrate
- A description of what the visual should show
- A ready-to-use image generation prompt (for AI image generation)
- How important the visual is (critical/helpful/optional)
- The category of visual (concept_diagram, process_flow, comparison, equipment_setup, waveform_visual, ui_screenshot, metaphor, example)
- A 1-10 score for how valuable this visual would be as part of a lead magnet
- Approximate position in the chapter (0 = beginning, 1 = end)

Focus on:
- Complex concepts that are hard to understand without visuals
- Step-by-step processes that could be shown as diagrams
- Comparisons (before/after, good/bad examples)
- Technical setups (signal flow, equipment connections)
- Abstract concepts that benefit from metaphorical visualization

Respond ONLY with valid JSON matching this structure:
{
  "visualIdeas": [
    {
      "sentenceOrConcept": "The exact text or concept to illustrate",
      "visualDescription": "What the image should show",
      "illustrationPrompt": "Professional music production education illustration: [detailed prompt for image generation, professional style, clean educational aesthetic]",
      "importance": "critical|helpful|optional",
      "category": "concept_diagram|process_flow|comparison|equipment_setup|waveform_visual|ui_screenshot|metaphor|example",
      "leadMagnetPotential": 8,
      "estimatedPosition": 0.3
    }
  ],
  "overallLeadMagnetScore": 7,
  "leadMagnetSuggestions": [
    "Could be packaged as: 'Quick Reference Guide to X'",
    "Visual comparison chart would work well as standalone PDF"
  ],
  "keyTopics": ["topic1", "topic2"]
}`;

    const userPrompt = `Analyze this chapter for visual illustration opportunities:

CHAPTER: "${chapterTitle}"
${moduleTitle ? `MODULE: "${moduleTitle}"` : ""}
${lessonTitle ? `LESSON: "${lessonTitle}"` : ""}

CONTENT:
${plainText.substring(0, 12000)} ${plainText.length > 12000 ? "... [truncated]" : ""}

Identify 3-10 key visual opportunities. Focus on quality over quantity - prioritize visuals that would genuinely enhance understanding or make great lead magnet materials.`;

    try {
      const response = await callLLM({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 4000,
        responseFormat: "json",
      });

      const parsed = safeParseJson(response.content) as any;

      // Parse visual ideas
      const rawIdeas = (parsed.visualIdeas || []).map((idea: any) => ({
        sentenceOrConcept: idea.sentenceOrConcept || "",
        visualDescription: idea.visualDescription || "",
        illustrationPrompt: idea.illustrationPrompt || "",
        importance: validateImportance(idea.importance),
        category: validateCategory(idea.category),
        leadMagnetPotential: Math.min(10, Math.max(1, idea.leadMagnetPotential || 5)),
        estimatedPosition: Math.min(1, Math.max(0, idea.estimatedPosition || 0.5)),
      }));

      // Generate embeddings if requested
      let visualIdeas: VisualIdea[];
      if (generateEmbeddings) {
        console.log(`   🧮 Generating embeddings for ${rawIdeas.length} visual ideas...`);
        visualIdeas = await Promise.all(
          rawIdeas.map(async (idea: any) => {
            try {
              const { embedding, embeddingText } = await generateVisualEmbedding(idea);
              return { ...idea, embedding, embeddingText };
            } catch (err) {
              console.error(`   ⚠️ Failed to generate embedding: ${err}`);
              return idea;
            }
          })
        );
        console.log(`   ✅ Embeddings generated`);
      } else {
        visualIdeas = rawIdeas;
      }

      return {
        chapterId,
        chapterTitle,
        lessonId,
        lessonTitle,
        moduleTitle,
        wordCount,
        visualIdeas,
        overallLeadMagnetScore: Math.min(10, Math.max(1, parsed.overallLeadMagnetScore || 5)),
        leadMagnetSuggestions: Array.isArray(parsed.leadMagnetSuggestions) 
          ? parsed.leadMagnetSuggestions 
          : [],
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      };
    } catch (error) {
      console.error(`Error analyzing chapter ${chapterId}:`, error);
      return {
        chapterId,
        chapterTitle,
        lessonId,
        lessonTitle,
        moduleTitle,
        wordCount,
        visualIdeas: [],
        overallLeadMagnetScore: 0,
        leadMagnetSuggestions: [`Analysis failed: ${error}`],
        keyTopics: [],
      };
    }
  },
});

// ============================================================================
// PUBLIC ACTIONS
// ============================================================================

/**
 * Analyze a course for lead magnet opportunities
 * Returns visual ideas for all chapters without generating any images
 * 
 * OPTIMIZED: Uses parallel batch processing for faster analysis of large courses
 */
export const analyzeLeadMagnetOpportunities = action({
  args: {
    courseId: v.id("courses"),
    maxChapters: v.optional(v.number()), // Limit chapters to analyze (for testing)
    generateEmbeddings: v.optional(v.boolean()), // Generate embeddings for semantic search
  },
  returns: courseLeadMagnetAnalysisValidator,
  handler: async (ctx, args): Promise<CourseLeadMagnetAnalysis> => {
    const { courseId, maxChapters, generateEmbeddings } = args;
    const startTime = Date.now();

    console.log(`🎯 Starting lead magnet analysis for course: ${courseId}`);
    if (generateEmbeddings) {
      console.log(`   🧮 Embedding generation enabled`);
    }

    // Get course info using internal query from courses.ts
    const courseInfo = await ctx.runQuery(
      internalRef.courses.getCourseForLeadMagnet,
      { courseId }
    ) as { _id: Id<"courses">; title: string } | null;

    if (!courseInfo) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Get all chapters with enriched info using internal query from courses.ts
    const chapters = await ctx.runQuery(
      internalRef.courses.getChaptersForLeadMagnet,
      { courseId }
    ) as Array<{
      _id: Id<"courseChapters">;
      title: string;
      description?: string;
      position: number;
      lessonId?: string;
      lessonTitle?: string;
      moduleTitle?: string;
    }>;

    console.log(`📚 Found ${chapters.length} chapters to analyze`);

    // Pre-filter chapters with content (skip empty ones early)
    const chaptersWithContent = chapters.filter(ch => {
      if (!ch.description) {
        console.log(`   ⏭️ Pre-filter: Skipping "${ch.title}" - no content`);
        return false;
      }
      // Also skip very short content (< 100 chars after stripping HTML)
      const plainText = ch.description
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (plainText.length < 200) {
        console.log(`   ⏭️ Pre-filter: Skipping "${ch.title}" - too short (${plainText.length} chars)`);
        return false;
      }
      return true;
    });

    console.log(`📋 ${chaptersWithContent.length} chapters have analyzable content`);

    // Optionally limit chapters for testing
    const chaptersToAnalyze = maxChapters 
      ? chaptersWithContent.slice(0, maxChapters) 
      : chaptersWithContent;

    // OPTIMIZATION: Process ALL chapters in parallel at once
    // OpenAI rate limits are generous enough for this with GPT-4o-mini
    console.log(`\n🚀 Launching ${chaptersToAnalyze.length} parallel chapter analyses...`);
    
    const allPromises = chaptersToAnalyze.map(async (chapter, index) => {
      try {
        const analysis = await ctx.runAction(
          internalRef.masterAI.leadMagnetAnalyzer.analyzeChapterContent,
          {
            chapterId: chapter._id,
            chapterTitle: chapter.title,
            chapterContent: chapter.description!,
            lessonId: chapter.lessonId,
            lessonTitle: chapter.lessonTitle,
            moduleTitle: chapter.moduleTitle,
            generateEmbeddings,
          }
        ) as ChapterAnalysis;
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   ✅ [${index + 1}/${chaptersToAnalyze.length}] "${chapter.title.substring(0, 30)}..." - ${analysis.visualIdeas.length} visuals (${elapsed}s)`);
        return analysis;
      } catch (error) {
        console.error(`   ❌ [${index + 1}] Error analyzing "${chapter.title}":`, error);
        return null;
      }
    });
    
    // Wait for ALL to complete
    const allResults = await Promise.all(allPromises);
    
    // Filter out nulls (failed analyses)
    const chapterAnalyses = allResults.filter((r): r is ChapterAnalysis => r !== null);
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️ All chapters analyzed in ${elapsed}s. Success: ${chapterAnalyses.length}/${chaptersToAnalyze.length}`);

    // Calculate totals
    const totalVisualIdeas = chapterAnalyses.reduce(
      (sum, ch) => sum + ch.visualIdeas.length,
      0
    );

    // Identify top lead magnet candidates
    const topCandidates = chapterAnalyses
      .filter(ch => ch.overallLeadMagnetScore >= 6)
      .sort((a, b) => b.overallLeadMagnetScore - a.overallLeadMagnetScore)
      .slice(0, 10)
      .map(ch => ({
        chapterId: ch.chapterId,
        chapterTitle: ch.chapterTitle,
        score: ch.overallLeadMagnetScore,
        reason: ch.leadMagnetSuggestions[0] || "High visual potential",
      }));

    // Generate bundle ideas (group related chapters)
    const bundleIdeas = generateBundleIdeas(chapterAnalyses);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Analysis complete in ${totalTime}ms - ${totalVisualIdeas} total visual ideas`);

    return {
      courseId,
      courseTitle: courseInfo.title,
      totalChapters: chapters.length,
      analyzedChapters: chapterAnalyses.length,
      totalVisualIdeas,
      chapters: chapterAnalyses,
      topLeadMagnetCandidates: topCandidates,
      bundleIdeas,
      analysisTimestamp: Date.now(),
    };
  },
});

/**
 * Quick analysis of a single chapter (for preview/testing)
 */
export const analyzeChapterForLeadMagnet = action({
  args: {
    chapterId: v.id("courseChapters"),
    generateEmbeddings: v.optional(v.boolean()),
  },
  returns: chapterAnalysisValidator,
  handler: async (ctx, args): Promise<ChapterAnalysis> => {
    // Get chapter details using existing internal query
    const chapter = await ctx.runQuery(
      internalRef.courses.getChapterByIdInternal,
      { chapterId: args.chapterId }
    ) as { _id: Id<"courseChapters">; title: string; description?: string; position: number } | null;

    if (!chapter) {
      throw new Error(`Chapter not found: ${args.chapterId}`);
    }

    if (!chapter.description) {
      return {
        chapterId: args.chapterId,
        chapterTitle: chapter.title,
        wordCount: 0,
        visualIdeas: [],
        overallLeadMagnetScore: 0,
        leadMagnetSuggestions: ["No content in chapter"],
        keyTopics: [],
      };
    }

    return ctx.runAction(
      internalRef.masterAI.leadMagnetAnalyzer.analyzeChapterContent,
      {
        chapterId: args.chapterId,
        chapterTitle: chapter.title,
        chapterContent: chapter.description,
        generateEmbeddings: args.generateEmbeddings,
      }
    ) as Promise<ChapterAnalysis>;
  },
});

/**
 * Find similar visual ideas across a course analysis using semantic search
 * Takes a query and returns the most similar visual ideas with their scores
 */
export const findSimilarVisualIdeas = action({
  args: {
    query: v.string(), // Natural language query like "diagram showing signal flow"
    analysisResults: courseLeadMagnetAnalysisValidator, // Pass in the analysis results
    topK: v.optional(v.number()), // Number of results to return (default 10)
    minScore: v.optional(v.number()), // Minimum similarity score (default 0.5)
  },
  returns: v.array(v.object({
    visualIdea: visualIdeaValidator,
    chapterId: v.string(),
    chapterTitle: v.string(),
    similarityScore: v.number(),
  })),
  handler: async (ctx, args) => {
    const { query, analysisResults, topK = 10, minScore = 0.5 } = args;

    // Generate embedding for the query
    console.log(`🔍 Searching for visual ideas similar to: "${query}"`);
    
    const queryEmbedding = await generateQueryEmbedding(query);
    
    // Collect all visual ideas with embeddings
    const results: Array<{
      visualIdea: VisualIdea;
      chapterId: string;
      chapterTitle: string;
      similarityScore: number;
    }> = [];

    for (const chapter of analysisResults.chapters) {
      for (const idea of chapter.visualIdeas) {
        if (!idea.embedding || idea.embedding.length === 0) {
          continue; // Skip ideas without embeddings
        }

        const score = cosineSimilarity(queryEmbedding, idea.embedding);
        if (score >= minScore) {
          results.push({
            visualIdea: idea,
            chapterId: chapter.chapterId,
            chapterTitle: chapter.chapterTitle,
            similarityScore: score,
          });
        }
      }
    }

    // Sort by similarity score and return top K
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    
    console.log(`   ✅ Found ${results.length} matching visual ideas`);
    
    return results.slice(0, topK);
  },
});

/**
 * Helper action to generate query embedding (exported for use in other modules)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OpenAI API key not found, using placeholder embedding");
      return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data?.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags from content
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validate importance level
 */
function validateImportance(imp: string): VisualIdea["importance"] {
  const valid = ["critical", "helpful", "optional"];
  if (valid.includes(imp)) {
    return imp as VisualIdea["importance"];
  }
  return "helpful";
}

/**
 * Validate category
 */
function validateCategory(cat: string): VisualIdea["category"] {
  const valid = [
    "concept_diagram",
    "process_flow",
    "comparison",
    "equipment_setup",
    "waveform_visual",
    "ui_screenshot",
    "metaphor",
    "example",
  ];
  if (valid.includes(cat)) {
    return cat as VisualIdea["category"];
  }
  return "concept_diagram";
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a visual idea from its prompt and description
 * This creates a rich semantic representation for search/similarity
 */
async function generateVisualEmbedding(idea: {
  sentenceOrConcept: string;
  visualDescription: string;
  illustrationPrompt: string;
  category: string;
}): Promise<{ embedding: number[]; embeddingText: string }> {
  // Combine all relevant text for a rich embedding
  const embeddingText = [
    `Concept: ${idea.sentenceOrConcept}`,
    `Visual: ${idea.visualDescription}`,
    `Category: ${idea.category}`,
    `Prompt: ${idea.illustrationPrompt}`,
  ].join("\n");

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OpenAI API key not found, using placeholder embedding");
      return {
        embedding: new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5),
        embeddingText,
      };
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: embeddingText,
        model: 'text-embedding-3-small'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const embedding = data?.data?.[0]?.embedding || [];

    return { embedding, embeddingText };
  } catch (error) {
    console.error('Error generating visual embedding:', error);
    // Return placeholder on error
    return {
      embedding: new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5),
      embeddingText,
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate ideas for bundling chapters into lead magnet packages
 */
function generateBundleIdeas(chapters: ChapterAnalysis[]): Array<{
  name: string;
  description: string;
  chapterIds: string[];
  estimatedVisuals: number;
}> {
  const bundles: Array<{
    name: string;
    description: string;
    chapterIds: string[];
    estimatedVisuals: number;
  }> = [];

  // Group by module if available
  const byModule = new Map<string, ChapterAnalysis[]>();
  for (const ch of chapters) {
    const moduleKey = ch.moduleTitle || "General";
    if (!byModule.has(moduleKey)) {
      byModule.set(moduleKey, []);
    }
    byModule.get(moduleKey)!.push(ch);
  }

  // Create module-based bundles
  for (const [moduleName, moduleChapters] of byModule) {
    if (moduleChapters.length >= 2) {
      const highQualityChapters = moduleChapters.filter(
        ch => ch.overallLeadMagnetScore >= 5
      );
      
      if (highQualityChapters.length >= 2) {
        bundles.push({
          name: `${moduleName} Visual Guide`,
          description: `Complete visual reference for ${moduleName} concepts`,
          chapterIds: highQualityChapters.map(ch => ch.chapterId),
          estimatedVisuals: highQualityChapters.reduce(
            (sum, ch) => sum + ch.visualIdeas.length,
            0
          ),
        });
      }
    }
  }

  // Create a "best of" bundle with top chapters
  const topChapters = chapters
    .filter(ch => ch.overallLeadMagnetScore >= 7)
    .sort((a, b) => b.overallLeadMagnetScore - a.overallLeadMagnetScore)
    .slice(0, 5);

  if (topChapters.length >= 3) {
    bundles.push({
      name: "Essential Concepts Visual Guide",
      description: "The most impactful visual explanations from the course",
      chapterIds: topChapters.map(ch => ch.chapterId),
      estimatedVisuals: topChapters.reduce(
        (sum, ch) => sum + ch.visualIdeas.length,
        0
      ),
    });
  }

  // Create category-based bundles
  const categoryGroups = new Map<string, VisualIdea[]>();
  for (const ch of chapters) {
    for (const idea of ch.visualIdeas) {
      if (!categoryGroups.has(idea.category)) {
        categoryGroups.set(idea.category, []);
      }
      categoryGroups.get(idea.category)!.push(idea);
    }
  }

  // Add process flow bundle if enough
  const processFlows = categoryGroups.get("process_flow") || [];
  if (processFlows.length >= 5) {
    bundles.push({
      name: "Workflow & Process Cheat Sheet",
      description: "Step-by-step visual guides for all major processes",
      chapterIds: [...new Set(
        chapters
          .filter(ch => ch.visualIdeas.some(i => i.category === "process_flow"))
          .map(ch => ch.chapterId)
      )],
      estimatedVisuals: processFlows.length,
    });
  }

  return bundles;
}

// ============================================================================
// IMAGE GENERATION (Gemini 3 Pro via OpenRouter)
// ============================================================================

/**
 * Core Excalidraw-style aesthetic that applies to all visuals
 */
const EXCALIDRAW_CORE_STYLE = `
## MANDATORY VISUAL STYLE: Excalidraw Hand-Drawn Aesthetic

This is the most important instruction. ALL images MUST follow this style:

**Core Style Requirements:**
- Simple hand-drawn sketch appearance
- Excalidraw-style illustration (like the popular whiteboard tool)
- Slightly wobbly, imperfect outlines (not perfectly straight lines)
- Hand-sketched look with organic, natural line quality
- Flat colors from our brand palette (see below)
- Minimal to no shading - keep it flat and simple
- Pure white or very light off-white background
- 16:9 aspect ratio
- Clean, uncluttered composition with breathing room

**PPR Academy Brand Color Palette (USE THESE COLORS):**

Primary Colors (use for main elements, key concepts):
- Indigo Blue (#818CF8) - Primary brand color, use for main shapes and focal points
- Rich Purple (#7C6CEF) - Use for secondary elements and accents
- Deep Purple (#6366F1) - Use for contrast and emphasis

Accent Colors (use for highlights, callouts, important details):
- Sky Cyan (#7DD3FC) - Use for highlights and interactive elements
- Vibrant Pink (#EC4899) - Use sparingly for attention-grabbing accents
- Bright Purple (#A855F7) - Use for creative/artistic elements
- Warm Orange (#F97316) - Use for energy, action, warnings

Supporting Colors (use for backgrounds, fills, subtle elements):
- Light Lavender (#F5E6F5) - Soft background fills
- Muted Gray (#E5E5E5) - Neutral elements, outlines
- Soft Indigo (#C7D2FE) - Light fills, subtle accents

**Color Usage Guidelines:**
- Use Indigo Blue (#818CF8) as the dominant color (40-50% of colored elements)
- Use Purple tones for variety and depth
- Add Cyan or Pink accents sparingly for visual interest
- Keep backgrounds white or very light lavender
- Maintain good contrast between elements

**Line Quality:**
- Hand-drawn wobbly lines, not perfectly geometric
- Varying line thickness for organic feel
- Rounded corners on shapes
- Sketchy, not clinical or sterile
- Use dark gray (#374151) or deep indigo (#3730A3) for outlines

**What to AVOID:**
- Photorealistic rendering
- Heavy gradients or complex shading
- Dark or high-contrast backgrounds
- Perfectly straight geometric lines
- Overly complex or busy compositions
- 3D effects or heavy shadows
- Colors outside the brand palette
`;

/**
 * Category-specific guidance for Excalidraw-style visuals
 * These complement the core style, not override it
 */
const categoryStyleGuides: Record<string, string> = {
  concept_diagram: `
CONTENT FOCUS: Technical diagram showing relationships and hierarchy
- Use simple shapes: rounded rectangles, circles, cloud shapes
- Connect elements with hand-drawn arrows or lines
- Keep icons simple and iconic (stick-figure style for complex items)
- Use different pastel colors to distinguish concept groups
- Minimal text labels are okay if they help clarity`,

  process_flow: `
CONTENT FOCUS: Step-by-step workflow or sequence
- Show clear left-to-right or top-to-bottom progression
- Use simple numbered circles or boxes for steps
- Hand-drawn arrows connecting each step
- Small iconic representations for each action
- Visual emphasis on the flow/direction`,

  comparison: `
CONTENT FOCUS: Side-by-side or before/after visualization
- Split composition into two clear halves
- Use matching layouts for easy comparison
- Hand-drawn checkmarks (✓) or X marks to show differences
- Simple icons representing each state
- Subtle visual divider between sections`,

  equipment_setup: `
CONTENT FOCUS: Hardware or software setup illustration
- Simple iconic representations of equipment
- Cute, simplified sketches (not realistic)
- Hand-drawn connection lines between devices
- Isometric-ish perspective but still sketchy
- Focus on relationships between components`,

  waveform_visual: `
CONTENT FOCUS: Audio signals and waveforms
- Simple hand-drawn waveform shapes
- Use different pastel colors for different signals
- Grid lines should also be hand-drawn style
- Simplified frequency/amplitude representations
- Keep the technical info readable but sketchy`,

  ui_screenshot: `
CONTENT FOCUS: Software interface concept
- Simplified, sketch-style UI elements
- Hand-drawn buttons, sliders, knobs
- Don't try to be pixel-perfect
- Focus on the key interface elements
- Use callout bubbles if highlighting specific parts`,

  metaphor: `
CONTENT FOCUS: Abstract concept made visual
- Use simple symbolic imagery
- Cute, friendly representations
- Visual metaphors over literal depictions
- Playful interpretation of the concept
- Focus on the "aha" moment`,

  example: `
CONTENT FOCUS: Concrete scenario illustration
- Simple scene with recognizable context
- Cartoon-ish, friendly style
- Focus on the key elements of the example
- Minimal background detail
- Clear focal point`,
};

/**
 * Build a rich, detailed prompt for image generation
 * Uses Excalidraw hand-drawn aesthetic with 65K token context
 */
function buildRichImagePrompt(args: {
  prompt: string;
  visualDescription?: string;
  sentenceOrConcept?: string;
  category?: string;
  chapterTitle?: string;
  courseTitle?: string;
  importance?: string;
}): string {
  const categoryGuide = args.category 
    ? categoryStyleGuides[args.category] || categoryStyleGuides.concept_diagram
    : categoryStyleGuides.concept_diagram;

  const importanceContext = args.importance === "critical" 
    ? "Make this especially clear and memorable - it's essential for understanding."
    : args.importance === "helpful"
    ? "This adds significant value - make it informative and engaging."
    : "Keep this clean and supportive of the main content.";

  return `# Excalidraw-Style Educational Illustration

${EXCALIDRAW_CORE_STYLE}

---

## What to Illustrate

${args.courseTitle ? `**Course Context:** ${args.courseTitle}` : ""}
${args.chapterTitle ? `**From Chapter:** ${args.chapterTitle}` : ""}
${args.category ? `**Visual Type:** ${args.category.replace(/_/g, " ")}` : ""}
${args.importance ? `**Priority:** ${importanceContext}` : ""}

### The Concept
${args.sentenceOrConcept ? `"${args.sentenceOrConcept}"` : ""}

### Visual Description
${args.visualDescription || ""}

### Specific Request
${args.prompt}

---

## Category-Specific Guidance
${categoryGuide}

---

## Final Reminders

1. **STYLE IS PARAMOUNT**: Hand-drawn, Excalidraw aesthetic with wobbly lines
2. **KEEP IT SIMPLE**: Don't overcomplicate - clarity over detail
3. **BRAND COLORS**: Use PPR Academy colors - Indigo (#818CF8) as primary, Purple tones, Cyan/Pink accents
4. **WHITE BACKGROUND**: Pure white or very light lavender background
5. **16:9 RATIO**: Landscape orientation
6. **FLAT DESIGN**: No complex shading or 3D effects
7. **FRIENDLY & APPROACHABLE**: Should feel hand-drawn and human

Generate one cohesive illustration that captures the concept in a simple, hand-drawn Excalidraw style using the PPR Academy brand colors. The image should feel like a quick whiteboard sketch - clear, friendly, and instantly understandable.`;
}

/**
 * Generate an image from an illustration prompt using FAL AI
 * Uses Nano Banana Pro (Gemini 3 Pro Image) for high-quality image generation
 * with Excalidraw-style aesthetic (hand-drawn, pastel, white background)
 */
export const generateVisualImage = action({
  args: {
    prompt: v.string(),
    chapterId: v.optional(v.string()),
    visualIndex: v.optional(v.number()),
    // Enhanced context for richer prompts
    visualDescription: v.optional(v.string()),
    sentenceOrConcept: v.optional(v.string()),
    category: v.optional(v.string()),
    chapterTitle: v.optional(v.string()),
    courseTitle: v.optional(v.string()),
    importance: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    imageData: v.optional(v.string()), // URL to generated image
    storageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🎨 Generating visual image for prompt: ${args.prompt.substring(0, 100)}...`);
    
    // Check FAL API key
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      return {
        success: false,
        error: "FAL_KEY not configured in environment",
      };
    }

    // Build a rich prompt with Excalidraw style and full context
    // Nano Banana Pro has large context - we can provide detailed instructions
    const richPrompt = buildRichImagePrompt(args);

    try {
      // Create FAL client - it reads FAL_KEY from environment automatically
      const falClient = createFalClient();
      
      console.log(`   🎨 Calling FAL API with Nano Banana Pro (Gemini 3 Pro Image) + Web Search...`);
      
      // Use fal.subscribe for better handling of long-running requests
      const result = await falClient.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt: richPrompt,
          num_images: 1,
          aspect_ratio: "16:9", // Good for course materials / lead magnets
          output_format: "png",
          resolution: "1K", // Good quality without being too large
          enable_web_search: true, // Let model search for reference images/context
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            update.logs.map((log) => log.message).forEach((msg) => console.log(`   📝 ${msg}`));
          }
        },
      });

      const imageData = result.data as {
        images?: Array<{ url: string; width?: number; height?: number }>;
        description?: string;
      };
      
      if (!imageData?.images?.[0]?.url) {
        console.error("❌ No image URL in FAL response:", JSON.stringify(result, null, 2).substring(0, 500));
        return {
          success: false,
          error: "No image URL in FAL response",
        };
      }

      const imageUrl = imageData.images[0].url;
      console.log(`   ✅ Image generated: ${imageUrl.substring(0, 80)}...`);
      if (imageData.description) {
        console.log(`   📝 Model description: ${imageData.description.substring(0, 100)}...`);
      }

      // Upload to Convex storage for persistence
      try {
        const storageId = await uploadImageUrlToStorage(ctx, imageUrl);
        const convexUrl = await ctx.storage.getUrl(storageId);
        
        return {
          success: true,
          imageData: convexUrl || imageUrl, // Prefer Convex URL for persistence
          storageId,
          imageUrl: convexUrl || imageUrl,
        };
      } catch (uploadError) {
        console.warn("Failed to upload to Convex storage, returning FAL URL:", uploadError);
        return {
          success: true,
          imageData: imageUrl,
          imageUrl,
        };
      }

    } catch (error) {
      console.error("❌ FAL API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown FAL error",
      };
    }
  },
});

/**
 * Helper to upload image from URL to Convex storage
 */
async function uploadImageUrlToStorage(ctx: any, imageUrl: string): Promise<Id<"_storage">> {
  console.log(`   📥 Downloading image from: ${imageUrl.substring(0, 60)}...`);
  
  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  // Get upload URL using the internal mutation
  const uploadUrl = await ctx.runMutation(internalRef.scriptIllustrationMutations.generateUploadUrl, {});

  // Upload to Convex
  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": imageBlob.type || "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = await uploadResult.json() as { storageId: Id<"_storage"> };
  console.log(`   ✅ Uploaded to Convex storage: ${storageId}`);
  return storageId;
}

/**
 * Helper to upload base64 image data to Convex storage
 */
async function uploadBase64ToStorage(ctx: any, base64Data: string): Promise<Id<"_storage">> {
  // Extract the base64 content without the data URL prefix
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
  
  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Determine content type
  const contentTypeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/png";
  
  // Get upload URL and upload
  const uploadUrl = await ctx.storage.generateUploadUrl();
  
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: bytes.buffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = await uploadResponse.json() as { storageId: Id<"_storage"> };
  return storageId;
}

// ============================================================================
// SAVE ACCEPTED IMAGE WITH EMBEDDINGS
// ============================================================================

/**
 * Save an accepted lead magnet image to the database with embeddings
 * Called after user reviews and approves a generated image
 */
export const saveAcceptedImage = action({
  args: {
    userId: v.string(),
    chapterId: v.string(),
    courseId: v.string(),
    // Visual idea metadata
    sentenceOrConcept: v.string(),
    visualDescription: v.string(),
    illustrationPrompt: v.string(),
    category: v.string(),
    // Image data - either base64 or URL
    imageData: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.object({
    success: v.boolean(),
    illustrationId: v.optional(v.id("scriptIllustrations")),
    imageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`💾 Saving accepted image for chapter ${args.chapterId}`);

    try {
      let storageId = args.storageId;
      let imageUrl: string;

      // If we have base64 data but no storage ID, upload to storage
      if (!storageId && args.imageData.startsWith("data:image")) {
        console.log("   📤 Uploading image to storage...");
        storageId = await uploadBase64ToStorage(ctx, args.imageData);
      }

      // Get the image URL
      if (storageId) {
        const url = await ctx.storage.getUrl(storageId);
        if (!url) {
          throw new Error("Failed to get storage URL");
        }
        imageUrl = url;
      } else if (args.imageData.startsWith("http")) {
        imageUrl = args.imageData;
      } else {
        throw new Error("No valid image data provided");
      }

      console.log("   🎨 Image URL:", imageUrl.substring(0, 50) + "...");

      // Generate embedding from the image using vision + text embedding
      console.log("   🧮 Generating image embedding...");
      const embedding = await generateImageEmbeddingFromUrl(imageUrl, args.visualDescription);

      // Save to scriptIllustrations table
      console.log("   💾 Saving to database...");
      const illustrationId = await ctx.runMutation(
        internalRef.scriptIllustrationMutations.createCompleteIllustration,
        {
          userId: args.userId,
          scriptId: args.courseId,
          sourceType: "course" as const,
          sentence: args.sentenceOrConcept,
          sentenceIndex: 0, // Lead magnet images don't have a specific index
          illustrationPrompt: args.illustrationPrompt,
          imageUrl,
          imageStorageId: storageId,
          embedding,
          embeddingModel: "text-embedding-3-small",
          generationModel: "google/gemini-3-pro-image-preview",
          generationStatus: "completed" as const,
        }
      ) as Id<"scriptIllustrations">;

      console.log(`   ✅ Saved illustration: ${illustrationId}`);

      return {
        success: true,
        illustrationId,
        imageUrl,
      };

    } catch (error) {
      console.error("❌ Error saving accepted image:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Generate embedding for an image by first describing it with vision, then embedding the description
 */
async function generateImageEmbeddingFromUrl(imageUrl: string, additionalContext?: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn("⚠️ No OpenAI key, returning placeholder embedding");
    return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
  }

  try {
    // Step 1: Use GPT-4o-mini vision to describe the image
    console.log("      📝 Describing image with GPT-4o-mini vision...");
    const descriptionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Describe this educational illustration in detail for semantic search purposes. 
Focus on: visual elements, concepts depicted, style, colors, composition, and educational value.
${additionalContext ? `Context: ${additionalContext}` : ""}
Be concise but thorough (2-3 sentences).`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!descriptionResponse.ok) {
      throw new Error(`Vision API error: ${descriptionResponse.status}`);
    }

    const descriptionData = await descriptionResponse.json() as any;
    const imageDescription = descriptionData.choices?.[0]?.message?.content || additionalContext || "";

    console.log("      📝 Image description:", imageDescription.substring(0, 100) + "...");

    // Step 2: Generate text embedding from the description
    console.log("      🔢 Generating embedding from description...");
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: imageDescription,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json() as any;
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || embedding.length === 0) {
      throw new Error("No embedding returned");
    }

    console.log(`      ✅ Generated ${embedding.length}-dim embedding`);
    return embedding;

  } catch (error) {
    console.error("Error generating image embedding:", error);
    // Return placeholder on error
    return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
  }
}
