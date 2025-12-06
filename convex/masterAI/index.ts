"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  chatSettingsValidator,
  masterAIResponseValidator,
  DEFAULT_CHAT_SETTINGS,
  type ChatSettings,
  type MasterAIResponse,
  type PlannerOutput,
  type RetrieverOutput,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
  type CriticOutput,
} from "./types";
import type { FactVerificationOutput } from "./factVerifier";

// Re-export types for external use
export * from "./types";

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Master AI Chat - Main Entry Point
 * 
 * Orchestrates the full pipeline:
 * 1. Planner - Decompose question into facets
 * 2. Retriever - Multi-bucket vector search
 * 3. Summarizer - Compress chunks per facet
 * 4. Idea Generator - Creative extrapolation (optional)
 * 5. Critic - Quality gate (optional)
 * 6. Final Writer - Generate response with citations
 */
export const askMasterAI = action({
  args: {
    question: v.string(),
    settings: v.optional(chatSettingsValidator),
    userId: v.optional(v.string()),
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  returns: masterAIResponseValidator,
  handler: async (ctx, args): Promise<MasterAIResponse> => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    const startTime = Date.now();

    console.log(`🚀 Master AI Pipeline starting with preset: ${settings.preset}`);

    // ========================================================================
    // STAGE 1: PLANNER
    // ========================================================================
    console.log("📋 Stage 1: Planning...");
    
    const plannerOutput: PlannerOutput = await ctx.runAction(
      internal.masterAI.planner.analyzeQuestion,
      {
        question: args.question,
        settings,
        conversationContext: args.conversationContext,
      }
    );

    console.log(`   Intent: ${plannerOutput.intent}`);
    console.log(`   Facets: ${plannerOutput.facets.map(f => f.name).join(", ")}`);

    // ========================================================================
    // STAGE 2 + 2.5: RETRIEVER + WEB RESEARCH (IN PARALLEL)
    // ========================================================================
    console.log("🔍 Stage 2: Retrieving content + Web research (parallel)...");
    
    // Run retriever and web research in parallel - they both only need planner output
    const [retrieverOutput, webResearchResult] = await Promise.all([
      // Retriever
      ctx.runAction(
        internal.masterAI.retriever.retrieveContent,
        {
          plan: plannerOutput,
          settings,
        }
      ) as Promise<RetrieverOutput>,
      
      // Web Research (only if enabled)
      settings.enableWebResearch
        ? ctx.runAction(
            internal.masterAI.webResearch.researchTopic,
            {
              query: args.question,
              facets: plannerOutput.facets.map(f => ({
                name: f.name,
                queryHint: f.queryHint,
              })),
              maxResultsPerFacet: settings.webSearchMaxResults || 3,
            }
          )
        : Promise.resolve(null),
    ]);

    console.log(`   Total chunks retrieved: ${retrieverOutput.totalChunksRetrieved}`);
    for (const bucket of retrieverOutput.buckets) {
      console.log(`   - ${bucket.facetName}: ${bucket.chunks.length} chunks`);
    }

    // Process web research results
    let webResearchResults: Array<{
      facetName: string;
      results: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
      }>;
    }> | undefined;

    if (webResearchResult) {
      console.log(`   🌐 Web results: ${webResearchResult.totalResults}`);
      webResearchResults = webResearchResult.research;

      // Optionally save to embeddings for future queries (run in background, don't await)
      if (settings.autoSaveWebResearch && webResearchResult.totalResults > 0 && args.userId) {
        console.log("   💾 Saving web research to embeddings (background)...");
        const researchToSave = webResearchResult.research.flatMap((r: any) => 
          r.results.map((result: any) => ({
            title: result.title,
            url: result.url,
            content: result.content,
            facetName: r.facetName,
          }))
        );
        
        // Don't await - let it run in background
        ctx.runAction(
          internal.masterAI.webResearch.saveResearchToEmbeddings,
          {
            userId: args.userId,
            research: researchToSave,
          }
        ).catch(err => console.error("Background save failed:", err));
      }
    }

    // Check if we have any content (from embeddings OR web)
    const hasWebResults = webResearchResults && webResearchResults.some(r => r.results.length > 0);
    if (retrieverOutput.totalChunksRetrieved === 0 && !hasWebResults) {
      return {
        answer: "I couldn't find any relevant content in the knowledge base to answer your question. This might mean the topic isn't covered in the current course materials, or you could try rephrasing your question.",
        citations: [],
        facetsUsed: [],
        pipelineMetadata: {
          plannerModel: settings.customModels?.planner || settings.preset,
          summarizerModel: settings.customModels?.summarizer || settings.preset,
          finalWriterModel: settings.customModels?.finalWriter || settings.preset,
          totalChunksProcessed: 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }

    // ========================================================================
    // STAGE 3: SUMMARIZER
    // ========================================================================
    console.log("📝 Stage 3: Summarizing...");
    
    const summarizerOutput: SummarizerOutput = await ctx.runAction(
      internal.masterAI.summarizer.summarizeContent,
      {
        retrieverOutput,
        settings,
        originalQuestion: args.question,
      }
    );

    console.log(`   Summaries generated: ${summarizerOutput.summaries.length}`);

    // ========================================================================
    // STAGES 4-6: IDEA GEN + FACT VERIFY + CRITIC (IN PARALLEL)
    // ========================================================================
    console.log("⚡ Stages 4-6: Running Idea Gen, Fact Verify, Critic in parallel...");
    
    // Prepare claims for verification
    const claimsToVerify = summarizerOutput.summaries.flatMap(s => s.keyTechniques).slice(0, 10);
    
    // Run all optional stages in parallel - they all only need summarizerOutput
    const [ideaGeneratorOutput, factVerificationOutput, criticOutput] = await Promise.all([
      // STAGE 4: Idea Generator
      settings.enableCreativeMode
        ? ctx.runAction(
            internal.masterAI.ideaGenerator.generateIdeas,
            {
              summarizerOutput,
              settings,
              originalQuestion: args.question,
            }
          ).then((result: any) => {
            console.log(`   💡 Ideas: ${result.ideas.length}, Cross-facet: ${result.crossFacetInsights.length}`);
            return result as IdeaGeneratorOutput;
          })
        : Promise.resolve(undefined),
      
      // STAGE 5: Fact Verification
      settings.enableFactVerification && claimsToVerify.length > 0
        ? ctx.runAction(
            internal.masterAI.factVerifier.verifyFacts,
            {
              claims: claimsToVerify,
              summaries: summarizerOutput.summaries.map(s => ({
                facetName: s.facetName,
                summary: s.summary,
                keyPoints: s.keyTechniques,
                sourceChunkIds: s.sourceChunkIds,
              })),
              webResearch: webResearchResults?.map(wr => ({
                facetName: wr.facetName,
                results: wr.results.map(r => ({
                  title: r.title,
                  url: r.url,
                  content: r.content,
                  score: r.score,
                })),
              })),
            }
          ).then((result: any) => {
            console.log(`   🔍 Verified: ${result.verifiedClaims.length}, Confidence: ${(result.overallConfidence * 100).toFixed(0)}%`);
            return result as FactVerificationOutput;
          })
        : Promise.resolve(undefined),
      
      // STAGE 6: Critic
      settings.enableCritic
        ? ctx.runAction(
            internal.masterAI.critic.reviewContent,
            {
              summarizerOutput,
              ideaGeneratorOutput: undefined, // Can't wait for idea generator in parallel
              settings,
              originalQuestion: args.question,
            }
          ).then((result: any) => {
            console.log(`   🔬 Critic: ${result.approved ? "✓" : "✗"}, Quality: ${result.overallQuality}`);
            return result as CriticOutput;
          })
        : Promise.resolve(undefined),
    ]);

    // ========================================================================
    // STAGE 7: FINAL WRITER
    // ========================================================================
    console.log("✍️ Stage 7: Writing final response...");

    // Collect all source chunks for citation building
    const allSourceChunks = retrieverOutput.buckets.flatMap(bucket => 
      bucket.chunks.map(chunk => ({
        id: chunk.id,
        title: chunk.title,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
      }))
    );

    const finalResponse: MasterAIResponse = await ctx.runAction(
      internal.masterAI.finalWriter.generateFinalResponse,
      {
        summarizerOutput,
        ideaGeneratorOutput,
        criticOutput,
        settings,
        originalQuestion: args.question,
        conversationContext: args.conversationContext,
        sourceChunks: allSourceChunks,
        webResearch: webResearchResults,
        factVerification: factVerificationOutput,
      }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Pipeline complete in ${totalTime}ms`);

    return {
      ...finalResponse,
      pipelineMetadata: {
        ...finalResponse.pipelineMetadata,
        processingTimeMs: totalTime,
      },
    };
  },
});

// ============================================================================
// SIMPLIFIED ENDPOINT (for quick queries)
// ============================================================================

/**
 * Quick AI query with default settings
 * For simpler use cases that don't need the full pipeline configuration
 */
export const quickAsk = action({
  args: {
    question: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.object({
    answer: v.string(),
    sources: v.array(v.object({
      title: v.string(),
      sourceType: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    // Use speed preset for quick queries
    const settings: ChatSettings = {
      ...DEFAULT_CHAT_SETTINGS,
      preset: "speed",
      maxFacets: 2,
      chunksPerFacet: 10,
      enableCritic: false,
      enableCreativeMode: false,
    };

    // Run the full pipeline inline (simplified version)
    const plannerOutput = await ctx.runAction(
      internal.masterAI.planner.analyzeQuestion,
      { question: args.question, settings }
    );

    const retrieverOutput = await ctx.runAction(
      internal.masterAI.retriever.retrieveContent,
      { plan: plannerOutput, settings }
    );

    if (retrieverOutput.totalChunksRetrieved === 0) {
      return {
        answer: "I couldn't find relevant content to answer your question.",
        sources: [],
      };
    }

    const summarizerOutput = await ctx.runAction(
      internal.masterAI.summarizer.summarizeContent,
      { retrieverOutput, settings, originalQuestion: args.question }
    );

    const sourceChunks = retrieverOutput.buckets.flatMap((bucket: any) => 
      bucket.chunks.map((chunk: any) => ({
        id: chunk.id,
        title: chunk.title,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
      }))
    );

    // @ts-expect-error - Deep type instantiation in Convex
    const response = await ctx.runAction(
      internal.masterAI.finalWriter.generateFinalResponse,
      {
        summarizerOutput,
        settings,
        originalQuestion: args.question,
        sourceChunks,
      }
    );

    return {
      answer: response.answer,
      sources: response.citations.map((c: any) => ({
        title: c.title,
        sourceType: c.sourceType,
      })),
    };
  },
});

// ============================================================================
// INTERNAL ORCHESTRATOR (for streaming endpoint)
// ============================================================================

/**
 * Internal version that returns structured data for streaming
 */
export const runPipeline = internalAction({
  args: {
    question: v.string(),
    settings: chatSettingsValidator,
    userId: v.optional(v.string()),
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  returns: v.object({
    plannerOutput: v.any(),
    retrieverOutput: v.any(),
    summarizerOutput: v.any(),
    ideaGeneratorOutput: v.optional(v.any()),
    criticOutput: v.optional(v.any()),
    sourceChunks: v.array(v.object({
      id: v.string(),
      title: v.optional(v.string()),
      sourceType: v.optional(v.string()),
      sourceId: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const { question, settings, userId, conversationContext } = args;

    // Run stages 1-5, return data for streaming stage 6
    const plannerOutput = await ctx.runAction(
      internal.masterAI.planner.analyzeQuestion,
      { question, settings, conversationContext }
    );

    const retrieverOutput = await ctx.runAction(
      internal.masterAI.retriever.retrieveContent,
      { plan: plannerOutput, settings }
    );

    const summarizerOutput = await ctx.runAction(
      internal.masterAI.summarizer.summarizeContent,
      { retrieverOutput, settings, originalQuestion: question }
    );

    let ideaGeneratorOutput;
    if (settings.enableCreativeMode) {
      ideaGeneratorOutput = await ctx.runAction(
        internal.masterAI.ideaGenerator.generateIdeas,
        { summarizerOutput, settings, originalQuestion: question }
      );
    }

    let criticOutput;
    if (settings.enableCritic) {
      criticOutput = await ctx.runAction(
        internal.masterAI.critic.reviewContent,
        { summarizerOutput, ideaGeneratorOutput, settings, originalQuestion: question }
      );
    }

    const sourceChunks = retrieverOutput.buckets.flatMap((bucket: any) => 
      bucket.chunks.map((chunk: any) => ({
        id: chunk.id,
        title: chunk.title,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
      }))
    );

    return {
      plannerOutput,
      retrieverOutput,
      summarizerOutput,
      ideaGeneratorOutput,
      criticOutput,
      sourceChunks,
    };
  },
});

