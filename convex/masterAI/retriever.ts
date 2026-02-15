"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  chatSettingsValidator,
  plannerOutputValidator,
  retrieverOutputValidator,
  type ChatSettings,
  type PlannerOutput,
  type RetrieverOutput,
  type Chunk,
} from "./types";

// ============================================================================
// RETRIEVER STAGE
// ============================================================================

/**
 * Multi-bucket retriever that searches for content across multiple facets in parallel
 */
export const retrieveContent = internalAction({
  args: {
    plan: plannerOutputValidator,
    settings: chatSettingsValidator,
  },
  returns: retrieverOutputValidator,
  handler: async (ctx, args): Promise<RetrieverOutput> => {
    const { plan, settings } = args;
    
    const buckets: RetrieverOutput["buckets"] = [];
    let totalChunksRetrieved = 0;

    // Process each facet's search strategy in parallel
    const searchPromises = plan.searchStrategies.map(async (strategy) => {
      const facet = plan.facets.find(f => f.name === strategy.facetName);
      if (!facet) return null;

      try {
        // Generate embedding for the search query
        const queryEmbedding = await generateQueryEmbedding(strategy.query);

        // Get ALL embeddings from Convex (increased limit for better coverage)
        const embeddings = await ctx.runQuery(internal.masterAI.queries.getFilteredEmbeddings, {
          // No filters - search ALL content
          limit: 500, // Fetch up to 500 embeddings
        });

        // Calculate similarities and rank
        const withSimilarity = embeddings.map((item: any) => {
          const sim = cosineSimilarity(queryEmbedding, item.embedding);
          return {
            id: item._id,
            content: item.content,
            title: item.title,
            similarity: sim,
            sourceType: item.sourceType,
            sourceId: item.sourceId,
            category: item.category,
            metadata: item.metadata,
          };
        });

        const sorted = [...withSimilarity].sort((a, b) => b.similarity - a.similarity);

        // Use a lower threshold (0.3) to capture more results, then rank by similarity
        const threshold = Math.min(settings.similarityThreshold, 0.3);
        const results = sorted
          .filter((item: any) => item.similarity >= threshold)
          .slice(0, settings.chunksPerFacet);

        return {
          facetName: strategy.facetName,
          chunks: results as Chunk[],
          totalFound: results.length,
        };
      } catch (error) {
        console.error(`Error retrieving content for facet ${strategy.facetName}:`, error);
        return {
          facetName: strategy.facetName,
          chunks: [],
          totalFound: 0,
        };
      }
    });

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);

    // Filter out nulls and aggregate
    for (const result of results) {
      if (result) {
        buckets.push(result);
        totalChunksRetrieved += result.chunks.length;
      }
    }

    // Deduplicate chunks across buckets (same content might appear in multiple facets)
    const seenIds = new Set<string>();
    for (const bucket of buckets) {
      bucket.chunks = bucket.chunks.filter(chunk => {
        if (seenIds.has(chunk.id)) {
          return false;
        }
        seenIds.add(chunk.id);
        return true;
      });
    }

    // Recalculate total after deduplication
    totalChunksRetrieved = buckets.reduce((sum, b) => sum + b.chunks.length, 0);

    return {
      buckets,
      totalChunksRetrieved,
    };
  },
});

// ============================================================================
// EMBEDDING UTILITIES
// ============================================================================

/**
 * Generate embedding for a query using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API key not found, using random embedding");
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small", // Must match the model used to generate stored embeddings
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embedding API error: ${response.status}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error);
    // Return random embedding as fallback
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.warn("Vector length mismatch in cosine similarity");
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

