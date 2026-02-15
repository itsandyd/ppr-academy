"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Note: Queries have been moved to scriptIllustrationQueries.ts to allow this file to use "use node";
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
    sourceType: v.optional(
      v.union(v.literal("course"), v.literal("lesson"), v.literal("script"), v.literal("custom"))
    ),
    limit: v.optional(v.number()), // Default: 10
    minSimilarity: v.optional(v.number()), // Default: 0.7 (0-1 scale)
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(
      v.object({
        illustrationId: v.string(),
        sentence: v.string(),
        illustrationPrompt: v.string(),
        imageUrl: v.string(),
        similarity: v.number(),
        sentenceIndex: v.number(),
        sourceType: v.string(),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await generateQueryEmbedding(args.query);

      // Get all illustrations with embeddings
      // Type annotation to avoid TypeScript type instantiation depth issues
      type IllustrationWithEmbedding = {
        _id: string;
        sentence: string;
        illustrationPrompt: string;
        imageUrl: string;
        embedding: number[];
        sentenceIndex: number;
        sourceType: string;
      };
      const rawIllustrations = await ctx.runQuery(
        internal.scriptIllustrationQueries.getAllIllustrationsWithEmbeddings,
        {
          userId: args.userId,
          scriptId: args.scriptId,
          sourceType: args.sourceType,
          limit: args.limit ?? 100, // Fetch more to filter by similarity
        }
      );
      // Filter out any that might not have embedding and cast
      const illustrations: IllustrationWithEmbedding[] = rawIllustrations
        .filter((item: any): item is typeof item & { embedding: number[] } =>
          !!item.embedding && item.embedding.length > 0
        );

      // Calculate similarity scores
      const withSimilarity = illustrations
        .map((item) => ({
          ...item,
          similarity: cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .filter((item) => item.similarity >= (args.minSimilarity ?? 0.7))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, args.limit ?? 10);

      const results = withSimilarity.map((item) => ({
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
    results: v.array(
      v.object({
        illustrationId: v.string(),
        sentence: v.string(),
        imageUrl: v.string(),
        similarity: v.number(),
      })
    ),
    error: v.optional(v.string()),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, args): Promise<any> => {
    try {
      // Get the source illustration
      // Type annotation to avoid TypeScript type instantiation depth issues
      type SourceIllustration = {
        _id: string;
        embedding?: number[];
      } | null;
      const sourceIllustration: SourceIllustration = await ctx.runQuery(
        internal.scriptIllustrationQueries.getIllustrationById,
        { illustrationId: args.illustrationId }
      );

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
      type IllustrationWithEmbeddingInner = {
        _id: string;
        sentence: string;
        illustrationPrompt: string;
        imageUrl: string;
        embedding: number[];
        sentenceIndex: number;
        sourceType: string;
      };
      const rawAllIllustrations = await ctx.runQuery(
        internal.scriptIllustrationQueries.getAllIllustrationsWithEmbeddings,
        { limit: 1000 }
      );
      // Filter out any that might not have embedding and cast
      const allIllustrations: IllustrationWithEmbeddingInner[] = rawAllIllustrations
        .filter((item: any): item is typeof item & { embedding: number[] } =>
          !!item.embedding && item.embedding.length > 0
        );

      // Calculate similarity and filter
      const similar = allIllustrations
        .filter((item) => item._id !== args.illustrationId)
        .map((item) => ({
          ...item,
          similarity: cosineSimilarity(sourceIllustration.embedding!, item.embedding),
        }))
        .filter((item) => item.similarity >= (args.minSimilarity ?? 0.75))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, args.limit ?? 5);

      const results = similar.map((item: any) => ({
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
    results: v.array(
      v.object({
        illustrationId: v.string(),
        sentence: v.string(),
        imageUrl: v.string(),
        relevanceScore: v.number(),
        matchedConcepts: v.array(v.string()),
      })
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Extract key concepts from the script
      const concepts = await extractKeyConcepts(args.scriptText);

      // Search for illustrations matching each concept
      const allMatches: any[] = [];

      for (const concept of concepts) {
        const searchResults = await ctx.runAction(
          // @ts-ignore - type instantiation too deep
          api.scriptIllustrationSearch.searchIllustrations,
          {
            query: concept,
            limit: 5,
            minSimilarity: 0.65,
          }
        );

        if (searchResults.success) {
          searchResults.results.forEach((result: any) => {
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
        content:
          "Extract 5-10 key concepts, topics, or themes from the following text. Return them as a comma-separated list. Focus on nouns, techniques, and main ideas.",
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
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

// Note: All queries have been moved to scriptIllustrationQueries.ts
// to allow this file to use "use node";
