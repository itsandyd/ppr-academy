"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { callLLM, safeParseJson } from "./llmClient";

// ============================================================================
// QUERY EXTRACTION - Convert user input into focused search queries
// ============================================================================

/**
 * Extract focused search queries from user input using LLM
 * Turns verbose instructions into concise, effective search terms
 */
export const extractSearchQueries = internalAction({
  args: {
    userInput: v.string(),
    facets: v.array(v.object({
      name: v.string(),
      queryHint: v.string(),
    })),
    maxQueriesPerFacet: v.optional(v.number()),
  },
  returns: v.array(v.object({
    facetName: v.string(),
    queries: v.array(v.string()),
  })),
  handler: async (ctx, args) => {
    const maxQueries = args.maxQueriesPerFacet || 2;
    
    const systemPrompt = `You are a search query optimizer. Given a user's request, extract 1-${maxQueries} focused search queries per topic.

Rules:
- Generate SHORT search queries (5-10 words max)
- Remove filler words, instructions, and formatting
- Focus on the core concepts that would yield useful web results
- Make queries specific and searchable
- Remove internal references like [[Web 3]] or [[Source 1]]
- For creative/writing tasks, extract the TOPIC not the task itself

Example:
User Input: "Write text for Lesson 56: Breaking the Rules Intentionally. Theory provides guidelines, not laws."
Facets: [{ name: "theory", queryHint: "music theory" }]
Output: { "queries": [{ "facetName": "theory", "queries": ["intentional dissonance music theory", "breaking music rules creative composition"] }] }

Return JSON: { "queries": [{ "facetName": "string", "queries": ["query1", "query2"] }] }`;

    const userPrompt = `User Input: "${args.userInput}"

Facets to search:
${args.facets.map(f => `- ${f.name}: ${f.queryHint}`).join('\n')}

Extract ${maxQueries} focused search queries for each facet.`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini", // Fast and cheap for extraction
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 500,
        responseFormat: "json",
      });

      const parsed = safeParseJson(response.content) as any;
      
      if (parsed.queries && Array.isArray(parsed.queries)) {
        return parsed.queries.map((q: any) => ({
          facetName: q.facetName || "general",
          queries: Array.isArray(q.queries) ? q.queries.slice(0, maxQueries) : [],
        }));
      }
      
      // Fallback: use basic extraction
      return args.facets.map(f => ({
        facetName: f.name,
        queries: [extractBasicQuery(args.userInput, f.queryHint)],
      }));
    } catch (error) {
      console.warn("Query extraction failed, using basic extraction:", error);
      return args.facets.map(f => ({
        facetName: f.name,
        queries: [extractBasicQuery(args.userInput, f.queryHint)],
      }));
    }
  },
});

/**
 * Basic query extraction fallback (no LLM)
 */
function extractBasicQuery(input: string, hint: string): string {
  // Remove common instruction words and formatting
  const cleaned = input
    .replace(/write\s+(text\s+)?(for|about)/gi, '')
    .replace(/lesson\s+\d+:/gi, '')
    .replace(/\[\[.*?\]\]/g, '') // Remove [[references]]
    .replace(/[^\w\s\-.,!?']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Take first 50 chars and add hint
  const shortened = cleaned.substring(0, 50).trim();
  return `${shortened} ${hint}`.substring(0, 100);
}

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
      // Sanitize and limit query length (Tavily has a 400 char limit)
      const sanitizedQuery = args.query
        .replace(/[^\w\s\-.,!?'"/]/g, ' ') // Remove special chars
        .replace(/\s+/g, ' ')              // Collapse whitespace
        .trim()
        .substring(0, 400);                // Limit length

      if (!sanitizedQuery || sanitizedQuery.length < 3) {
        return {
          success: false,
          results: [],
          answer: null,
          searchDuration: Date.now() - startTime,
          error: "Query too short or empty after sanitization",
        };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: sanitizedQuery,
          max_results: args.maxResults || 5,
          search_depth: args.searchDepth || "basic",
          include_answer: args.includeAnswer || false,
          include_domains: args.includeDomains,
          exclude_domains: args.excludeDomains,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Tavily API error ${response.status}:`, errorBody);
        
        // Return gracefully instead of throwing - web search is optional
        return {
          success: false,
          results: [],
          answer: null,
          searchDuration: Date.now() - startTime,
          error: `Tavily API error: ${response.status} - ${errorBody.substring(0, 200)}`,
        };
      }

      const data = await response.json() as TavilyResponse & { answer?: string };

      const results = data.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        publishedDate: r.published_date,
      }));

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
 * Searches the web for additional context using smart query extraction
 */
export const researchTopic = internalAction({
  args: {
    query: v.string(),
    facets: v.array(v.object({
      name: v.string(),
      queryHint: v.string(),
    })),
    maxResultsPerFacet: v.optional(v.number()),
    useSmartExtraction: v.optional(v.boolean()), // Use LLM to extract better queries
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
    const useSmartExtraction = args.useSmartExtraction !== false; // Default to true
    
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

    // Step 1: Extract optimized search queries
    let facetQueries: Array<{ facetName: string; queries: string[] }>;
    
    if (useSmartExtraction) {
      try {
        facetQueries = await ctx.runAction(
          internal.masterAI.webResearch.extractSearchQueries,
          {
            userInput: args.query,
            facets: args.facets,
            maxQueriesPerFacet: 2,
          }
        );
      } catch (error) {
        console.warn("Smart extraction failed, using basic queries:", error);
        // Fallback to basic extraction
        facetQueries = args.facets.map(f => ({
          facetName: f.name,
          queries: [extractBasicQuery(args.query, f.queryHint)],
        }));
      }
    } else {
      // Use basic extraction
      facetQueries = args.facets.map(f => ({
        facetName: f.name,
        queries: [extractBasicQuery(args.query, f.queryHint)],
      }));
    }

    // Step 2: Search for each extracted query
    const searchPromises: Promise<{
      facetName: string;
      searchQuery: string;
      results: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
        publishedDate?: string;
      }>;
    }>[] = [];

    for (const facet of facetQueries) {
      for (const query of facet.queries) {
        searchPromises.push(
          ctx.runAction(internal.masterAI.webResearch.searchWeb, {
            query,
            maxResults,
            searchDepth: "basic",
          }).then(result => ({
            facetName: facet.facetName,
            searchQuery: query,
            results: result.results,
          }))
        );
      }
    }

    const results = await Promise.all(searchPromises);
    
    // Deduplicate results by URL within each facet
    const seenUrls = new Set<string>();
    let totalResults = 0;
    
    for (const r of results) {
      const uniqueResults = r.results.filter(result => {
        if (seenUrls.has(result.url)) return false;
        seenUrls.add(result.url);
        return true;
      });
      
      if (uniqueResults.length > 0) {
        research.push({
          ...r,
          results: uniqueResults,
        });
        totalResults += uniqueResults.length;
      }
    }

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

    return {
      success: errors.length === 0,
      embeddingsCreated,
      errors,
    };
  },
});


