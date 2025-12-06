"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// ============================================================================
// TAVILY WEB SEARCH
// ============================================================================

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
  response_time: number;
}

/**
 * Search the web using Tavily API
 */
export const searchWeb = internalAction({
  args: {
    query: v.string(),
    maxResults: v.optional(v.number()),
    searchDepth: v.optional(v.union(v.literal("basic"), v.literal("advanced"))),
    includeAnswer: v.optional(v.boolean()),
    includeDomains: v.optional(v.array(v.string())),
    excludeDomains: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      title: v.string(),
      url: v.string(),
      content: v.string(),
      score: v.number(),
      publishedDate: v.optional(v.string()),
    })),
    answer: v.union(v.string(), v.null()),
    searchDuration: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      console.warn("TAVILY_API_KEY not found");
      return {
        success: false,
        results: [],
        answer: null,
        searchDuration: Date.now() - startTime,
        error: "Tavily API key not configured",
      };
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: args.query,
          max_results: args.maxResults || 5,
          search_depth: args.searchDepth || "basic",
          include_answer: args.includeAnswer || false,
          include_domains: args.includeDomains,
          exclude_domains: args.excludeDomains,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json() as TavilyResponse & { answer?: string };

      const results = data.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        publishedDate: r.published_date,
      }));

      console.log(`🔍 Tavily search: "${args.query}" - ${results.length} results in ${Date.now() - startTime}ms`);

      return {
        success: true,
        results,
        answer: data.answer || null,
        searchDuration: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Tavily search error:", error);
      return {
        success: false,
        results: [],
        answer: null,
        searchDuration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Research stage for the AI pipeline
 * Searches the web for additional context
 */
export const researchTopic = internalAction({
  args: {
    query: v.string(),
    facets: v.array(v.object({
      name: v.string(),
      queryHint: v.string(),
    })),
    maxResultsPerFacet: v.optional(v.number()),
  },
  returns: v.object({
    research: v.array(v.object({
      facetName: v.string(),
      searchQuery: v.string(),
      results: v.array(v.object({
        title: v.string(),
        url: v.string(),
        content: v.string(),
        score: v.number(),
        publishedDate: v.optional(v.string()),
      })),
    })),
    totalResults: v.number(),
    totalDuration: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const maxResults = args.maxResultsPerFacet || 3;
    const research: Array<{
      facetName: string;
      searchQuery: string;
      results: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
        publishedDate?: string;
      }>;
    }> = [];

    // Search for each facet in parallel
    const searchPromises = args.facets.map(async (facet) => {
      // Craft a search query combining the main query and facet hint
      const searchQuery = `${args.query} ${facet.queryHint}`;
      
      const result = await ctx.runAction(internal.masterAI.webResearch.searchWeb, {
        query: searchQuery,
        maxResults,
        searchDepth: "basic",
      });

      return {
        facetName: facet.name,
        searchQuery,
        results: result.results,
      };
    });

    const results = await Promise.all(searchPromises);
    
    let totalResults = 0;
    for (const r of results) {
      research.push(r);
      totalResults += r.results.length;
    }

    console.log(`🌐 Web research complete: ${totalResults} results across ${args.facets.length} facets in ${Date.now() - startTime}ms`);

    return {
      research,
      totalResults,
      totalDuration: Date.now() - startTime,
    };
  },
});

// ============================================================================
// SAVE RESEARCH TO EMBEDDINGS
// ============================================================================

/**
 * Save web research results as embeddings for future retrieval
 */
export const saveResearchToEmbeddings = internalAction({
  args: {
    userId: v.string(),
    research: v.array(v.object({
      title: v.string(),
      url: v.string(),
      content: v.string(),
      facetName: v.string(),
    })),
    sourceConversationId: v.optional(v.id("aiConversations")),
  },
  returns: v.object({
    success: v.boolean(),
    embeddingsCreated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const errors: string[] = [];
    let embeddingsCreated = 0;

    for (const item of args.research) {
      try {
        // Create content with source attribution
        const content = `${item.title}\n\n${item.content}\n\n[Source: ${item.url}]`;
        
        // Add to embeddings via the mutations file
        await ctx.runMutation(internal.masterAI.mutations.createWebEmbedding, {
          userId: args.userId,
          content,
          title: item.title,
          url: item.url,
          category: "web_research",
          facetName: item.facetName,
          sourceConversationId: args.sourceConversationId,
        });

        embeddingsCreated++;
      } catch (error) {
        errors.push(`Failed to save "${item.title}": ${error}`);
      }
    }

    console.log(`💾 Saved ${embeddingsCreated} web research results to embeddings`);

    return {
      success: errors.length === 0,
      embeddingsCreated,
      errors,
    };
  },
});


