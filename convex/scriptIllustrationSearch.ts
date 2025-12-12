"use node";

import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// ============================================================================
// SEMANTIC SEARCH FOR ILLUSTRATIONS
// ============================================================================

/**
 * Search illustrations by semantic similarity to a text query
 */
export const searchIllustrations = action({
  args: {
    query: v.string(),
    userId: v.optional(v.string()), // Filter by user
    scriptId: v.optional(v.string()), // Filter by script
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    )),
    limit: v.optional(v.number()), // Default: 10
    minSimilarity: v.optional(v.number()), // Default: 0.7 (0-1 scale)
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      illustrationId: v.string(),
      sentence: v.string(),
      illustrationPrompt: v.string(),
      imageUrl: v.string(),
      similarity: v.number(),
      sentenceIndex: v.number(),
      sourceType: v.string(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 Searching illustrations for query: "${args.query}"`);

    try {
      // Generate embedding for the search query
      const queryEmbedding = await generateQueryEmbedding(args.query);
      console.log(`   Generated query embedding (${queryEmbedding.length} dimensions)`);

      // Get all illustrations with embeddings
      const illustrations = await ctx.runQuery(internal.scriptIllustrationSearch.getAllIllustrationsWithEmbeddings, {
        userId: args.userId,
        scriptId: args.scriptId,
        sourceType: args.sourceType,
        limit: args.limit ?? 100, // Fetch more to filter by similarity
      });

      console.log(`   Found ${illustrations.length} illustrations with embeddings`);

      // Calculate similarity scores
      const withSimilarity = illustrations
        .map(item => ({
          ...item,
          similarity: cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .filter(item => item.similarity >= (args.minSimilarity ?? 0.7))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, args.limit ?? 10);

      console.log(`   Returning ${withSimilarity.length} results above similarity threshold`);

      const results = withSimilarity.map(item => ({
        illustrationId: item._id,
        sentence: item.sentence,
        illustrationPrompt: item.illustrationPrompt,
        imageUrl: item.imageUrl,
        similarity: item.similarity,
        sentenceIndex: item.sentenceIndex,
        sourceType: item.sourceType,
      }));

      return {
        success: true,
        results,
      };

    } catch (error: any) {
      console.error("❌ Error searching illustrations:", error);
      return {
        success: false,
        results: [],
        error: error.message,
      };
    }
  },
});

/**
 * Find similar illustrations to a given illustration
 */
export const findSimilarIllustrations = action({
  args: {
    illustrationId: v.id("scriptIllustrations"),
    limit: v.optional(v.number()), // Default: 5
    minSimilarity: v.optional(v.number()), // Default: 0.75
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      illustrationId: v.string(),
      sentence: v.string(),
      imageUrl: v.string(),
      similarity: v.number(),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 Finding similar illustrations to ${args.illustrationId}`);

    try {
      // Get the source illustration
      const sourceIllustration = await ctx.runQuery(internal.scriptIllustrationSearch.getIllustrationById, {
        illustrationId: args.illustrationId,
      });

      if (!sourceIllustration) {
        return {
          success: false,
          results: [],
          error: "Source illustration not found",
        };
      }

      if (!sourceIllustration.embedding) {
        return {
          success: false,
          results: [],
          error: "Source illustration has no embedding",
        };
      }

      // Get all other illustrations
      const allIllustrations = await ctx.runQuery(internal.scriptIllustrationSearch.getAllIllustrationsWithEmbeddings, {
        limit: 1000,
      });

      // Calculate similarity and filter
      const similar = allIllustrations
        .filter(item => item._id !== args.illustrationId)
        .map(item => ({
          ...item,
          similarity: cosineSimilarity(sourceIllustration.embedding!, item.embedding),
        }))
        .filter(item => item.similarity >= (args.minSimilarity ?? 0.75))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, args.limit ?? 5);

      const results = similar.map(item => ({
        illustrationId: item._id,
        sentence: item.sentence,
        imageUrl: item.imageUrl,
        similarity: item.similarity,
      }));

      return {
        success: true,
        results,
      };

    } catch (error: any) {
      console.error("❌ Error finding similar illustrations:", error);
      return {
        success: false,
        results: [],
        error: error.message,
      };
    }
  },
});

/**
 * Get illustration recommendations for a script/course
 */
export const getRecommendedIllustrations = action({
  args: {
    scriptText: v.string(),
    excludeScriptId: v.optional(v.string()),
    limit: v.optional(v.number()), // Default: 10
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      illustrationId: v.string(),
      sentence: v.string(),
      imageUrl: v.string(),
      relevanceScore: v.number(),
      matchedConcepts: v.array(v.string()),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`💡 Getting illustration recommendations for script`);

    try {
      // Extract key concepts from the script
      const concepts = await extractKeyConcepts(args.scriptText);
      console.log(`   Extracted ${concepts.length} key concepts:`, concepts);

      // Search for illustrations matching each concept
      const allMatches: any[] = [];

      for (const concept of concepts) {
        const searchResults = await ctx.runAction(internal.scriptIllustrationSearch.searchIllustrations, {
          query: concept,
          limit: 5,
          minSimilarity: 0.65,
        });

        if (searchResults.success) {
          searchResults.results.forEach(result => {
            allMatches.push({
              ...result,
              matchedConcept: concept,
            });
          });
        }
      }

      // Filter out duplicates and illustrations from the same script
      const uniqueMatches = new Map();
      for (const match of allMatches) {
        if (args.excludeScriptId && match.scriptId === args.excludeScriptId) {
          continue;
        }
        
        const key = match.illustrationId;
        if (!uniqueMatches.has(key)) {
          uniqueMatches.set(key, {
            illustrationId: match.illustrationId,
            sentence: match.sentence,
            imageUrl: match.imageUrl,
            relevanceScore: match.similarity,
            matchedConcepts: [match.matchedConcept],
          });
        } else {
          // Add to matched concepts if not already there
          const existing = uniqueMatches.get(key);
          if (!existing.matchedConcepts.includes(match.matchedConcept)) {
            existing.matchedConcepts.push(match.matchedConcept);
          }
          // Boost relevance score for multiple concept matches
          existing.relevanceScore = Math.max(existing.relevanceScore, match.similarity);
        }
      }

      // Sort by relevance and limit
      const results = Array.from(uniqueMatches.values())
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, args.limit ?? 10);

      console.log(`   Found ${results.length} recommended illustrations`);

      return {
        success: true,
        results,
      };

    } catch (error: any) {
      console.error("❌ Error getting recommendations:", error);
      return {
        success: false,
        results: [],
        error: error.message,
      };
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Extract key concepts from a script for recommendation matching
 */
async function extractKeyConcepts(scriptText: string): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Extract 5-10 key concepts, topics, or themes from the following text. Return them as a comma-separated list. Focus on nouns, techniques, and main ideas.",
      },
      {
        role: "user",
        content: scriptText.substring(0, 2000), // Limit to first 2000 chars
      },
    ],
    temperature: 0.3,
    max_tokens: 100,
  });

  const conceptsText = response.choices[0].message.content || "";
  return conceptsText
    .split(",")
    .map(c => c.trim())
    .filter(c => c.length > 0);
}

// ============================================================================
// INTERNAL QUERIES (called by actions)
// ============================================================================

export const getAllIllustrationsWithEmbeddings = query({
  args: {
    userId: v.optional(v.string()),
    scriptId: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("scriptIllustrations");

    // Apply filters
    if (args.userId) {
      query = query.withIndex("by_userId", q => q.eq("userId", args.userId));
    }
    if (args.scriptId) {
      query = query.withIndex("by_scriptId", q => q.eq("scriptId", args.scriptId));
    }
    if (args.sourceType) {
      query = query.withIndex("by_sourceType", q => q.eq("sourceType", args.sourceType));
    }

    const illustrations = await query
      .filter(q => q.neq(q.field("embedding"), undefined))
      .take(args.limit ?? 100);

    return illustrations;
  },
});

export const getIllustrationById = query({
  args: {
    illustrationId: v.id("scriptIllustrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.illustrationId);
  },
});

// ============================================================================
// PUBLIC QUERIES FOR UI
// ============================================================================

/**
 * Get all illustrations for a script/job
 */
export const getIllustrationsByScript = query({
  args: {
    scriptId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scriptIllustrations")
      .withIndex("by_scriptId", q => q.eq("scriptId", args.scriptId))
      .order("asc")
      .collect();
  },
});

/**
 * Get illustration job status
 */
export const getJobStatus = query({
  args: {
    jobId: v.id("scriptIllustrationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    return {
      status: job.status,
      totalSentences: job.totalSentences,
      processedSentences: job.processedSentences,
      failedSentences: job.failedSentences,
      progress: job.totalSentences > 0 
        ? Math.round((job.processedSentences / job.totalSentences) * 100)
        : 0,
      errors: job.errors || [],
    };
  },
});

/**
 * Get user's illustration jobs
 */
export const getUserJobs = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scriptIllustrationJobs")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

