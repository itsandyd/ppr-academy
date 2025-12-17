"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
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
import { 
  formatMemoriesForPrompt, 
  type MemoryForPipeline,
} from "./memoryManager";
import {
  conversationGoalValidator,
  type ConversationGoal,
} from "./goalExtractor";
import {
  AI_TOOLS,
  actionProposalValidator,
  actionsExecutedValidator,
  toolCallResultValidator,
  getToolsForAgent,
  type ActionProposal,
  type ActionsExecuted,
  type ToolCall,
} from "./tools/schema";
import { describeToolCalls } from "./planner";
import { Id } from "../_generated/dataModel";

// Re-export types for external use
export * from "./types";
export * from "./tools/schema";

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
    conversationId: v.optional(v.string()), // For caching
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
    // NEW: Conversation goal to prevent context drift in long conversations
    conversationGoal: v.optional(conversationGoalValidator),
  },
  returns: masterAIResponseValidator,
  handler: async (ctx, args): Promise<MasterAIResponse> => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    const startTime = Date.now();

    console.log(`🚀 Master AI Pipeline starting with preset: ${settings.preset}`);

    // ========================================================================
    // GOAL EXTRACTION (prevents context drift in long conversations)
    // ========================================================================
    let conversationGoal: ConversationGoal | undefined = args.conversationGoal;
    
    // If no goal provided but we have a conversationId, try to fetch existing goal
    if (!conversationGoal && args.conversationId) {
      try {
        // @ts-ignore - Type instantiation is excessively deep
        const conversation = await ctx.runQuery(
          api.aiConversations.getConversation,
          { conversationId: args.conversationId as Id<"aiConversations"> }
        );
        if (conversation?.conversationGoal) {
          conversationGoal = conversation.conversationGoal;
          console.log(`🎯 Using existing conversation goal: "${conversationGoal.originalIntent}"`);
        }
      } catch (err) {
        console.warn("Failed to fetch conversation goal:", err);
      }
    }
    
    // If still no goal and this looks like a new conversation, extract it from the first message
    if (!conversationGoal && (!args.conversationContext || args.conversationContext.length === 0)) {
      try {
        console.log("🎯 Extracting conversation goal from first message...");
        conversationGoal = await ctx.runAction(
          internal.masterAI.goalExtractor.extractGoalFromMessage,
          { 
            message: args.question,
            conversationId: args.conversationId as Id<"aiConversations"> | undefined,
          }
        );
        console.log(`   ✅ Goal: "${conversationGoal.originalIntent}"`);
      } catch (err) {
        console.warn("Failed to extract conversation goal:", err);
      }
    }

    // ========================================================================
    // FETCH USER MEMORIES (parallel with planning)
    // ========================================================================
    let userMemories: MemoryForPipeline[] = [];
    if (args.userId) {
      try {
        // @ts-ignore - Avoiding deep type instantiation
        userMemories = await ctx.runQuery(
          internal.masterAI.queries.getUserMemoriesInternal,
          { userId: args.userId, limit: 10 }
        ) as MemoryForPipeline[];
        if (userMemories.length > 0) {
          console.log(`🧠 Loaded ${userMemories.length} user memories`);
        }
      } catch (err) {
        console.warn("Failed to load user memories:", err);
      }
    }

    // Format memories for prompts
    const memoryContext = formatMemoriesForPrompt(userMemories);

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
        conversationGoal, // Pass goal to prevent context drift
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

    let webResearchCount = 0;
    if (webResearchResult) {
      webResearchCount = webResearchResult.totalResults;
      console.log(`   🌐 Web results: ${webResearchCount}`);
      webResearchResults = webResearchResult.research;

      // Optionally save to embeddings for future queries (scheduled to run after this action completes)
      if (settings.autoSaveWebResearch && webResearchResult.totalResults > 0 && args.userId) {
        console.log("   💾 Scheduling web research save to embeddings...");
        const researchToSave = webResearchResult.research.flatMap((r: any) => 
          r.results.map((result: any) => ({
            title: result.title,
            url: result.url,
            content: result.content,
            facetName: r.facetName,
          }))
        );
        
        // Schedule to run after this action completes (avoids dangling promise warning)
        await ctx.scheduler.runAfter(0, internal.masterAI.webResearch.saveResearchToEmbeddings, {
          userId: args.userId,
          research: researchToSave,
        });
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
    // QUALITY CHECK: Retry if quality is below threshold
    // ========================================================================
    const qualityThreshold = settings.qualityThreshold ?? 0.4;
    const maxRetries = settings.maxRetries ?? 1;
    
    let currentSummarizerOutput = summarizerOutput;
    let currentCriticOutput = criticOutput;
    let retryCount = 0;
    
    // Check if quality is below threshold and we have retries available
    while (
      currentCriticOutput && 
      currentCriticOutput.overallQuality < qualityThreshold && 
      retryCount < maxRetries
    ) {
      retryCount++;
      console.log(`⚠️ Quality score ${currentCriticOutput.overallQuality} below threshold ${qualityThreshold}, retry ${retryCount}/${maxRetries}...`);
      console.log(`   Issues identified: ${currentCriticOutput.issues.map(i => `${i.type}: ${i.description}`).join("; ")}`);
      
      // Re-run summarizer with critic feedback
      const enhancedQuestion = `${args.question}

IMPORTANT: Previous response had quality issues. Please address these specifically:
${currentCriticOutput.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
${currentCriticOutput.issues.map(i => `- Fix ${i.type}: ${i.description}`).join("\n")}`;
      
      currentSummarizerOutput = await ctx.runAction(
        internal.masterAI.summarizer.summarizeContent,
        {
          retrieverOutput,
          settings,
          originalQuestion: enhancedQuestion,
        }
      );
      
      // Re-run critic to check improved output
      const newCriticOutput = await ctx.runAction(
        internal.masterAI.critic.reviewContent,
        {
          summarizerOutput: currentSummarizerOutput,
          ideaGeneratorOutput,
          settings,
          originalQuestion: args.question,
        }
      );
      currentCriticOutput = newCriticOutput as CriticOutput;
      console.log(`   🔬 Retry ${retryCount} Critic: ${currentCriticOutput.approved ? "✓" : "✗"}, Quality: ${currentCriticOutput.overallQuality}`);
    }
    
    if (retryCount > 0) {
      console.log(`   ✅ After ${retryCount} retries, quality: ${currentCriticOutput?.overallQuality ?? "N/A"}`);
    }

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
        summarizerOutput: currentSummarizerOutput,
        ideaGeneratorOutput,
        criticOutput: currentCriticOutput,
        settings,
        originalQuestion: args.question,
        conversationContext: args.conversationContext,
        memoryContext, // Pass formatted user memories
        sourceChunks: allSourceChunks,
        webResearch: webResearchResults,
        factVerification: factVerificationOutput,
        conversationGoal, // Pass goal to prevent context drift
      }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Pipeline complete in ${totalTime}ms`);

    const fullResponse = {
      ...finalResponse,
      pipelineMetadata: {
        ...finalResponse.pipelineMetadata,
        processingTimeMs: totalTime,
        webResearchResults: webResearchCount,
      },
    };

    // ========================================================================
    // AUTO-SAVE RESPONSE TO DATABASE (so it persists even if client disconnects)
    // ========================================================================
    if (args.conversationId && args.userId) {
      try {
        // @ts-ignore - Avoiding deep type instantiation
        await ctx.runMutation(internal.masterAI.mutations.saveAssistantMessage, {
          conversationId: args.conversationId,
          userId: args.userId,
          content: fullResponse.answer,
          citations: fullResponse.citations?.map((c, i) => ({
            id: i + 1,
            title: c.title,
            sourceType: c.sourceType,
            sourceId: c.sourceId,
          })),
          facetsUsed: fullResponse.facetsUsed,
          pipelineMetadata: {
            processingTimeMs: totalTime,
            totalChunksProcessed: fullResponse.pipelineMetadata?.totalChunksProcessed || 0,
            plannerModel: fullResponse.pipelineMetadata?.plannerModel,
            summarizerModel: fullResponse.pipelineMetadata?.summarizerModel,
            finalWriterModel: fullResponse.pipelineMetadata?.finalWriterModel,
          },
        });
      } catch (saveError) {
        console.error("Failed to auto-save response:", saveError);
        // Don't throw - the response was still generated successfully
      }
    }

    // Schedule memory extraction to run after this action completes (if conversation is meaningful)
    if (args.userId && args.conversationContext && args.conversationContext.length >= 4 && args.conversationId) {
      await ctx.scheduler.runAfter(0, internal.masterAI.memoryManager.extractMemoriesFromConversation, {
        userId: args.userId,
        conversationId: args.conversationId as any, // Type cast needed for Convex ID
        messages: [
          ...args.conversationContext,
          { role: "user" as const, content: args.question },
          { role: "assistant" as const, content: fullResponse.answer },
        ],
      });
    }

    return fullResponse;
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
// AGENTIC AI - Tool-aware endpoint with action proposals
// ============================================================================

/**
 * Response type for the agentic AI endpoint
 */
const agenticResponseValidator = v.union(
  // Standard Q&A response
  masterAIResponseValidator,
  // Action proposal (needs user confirmation)
  actionProposalValidator,
  // Actions executed (after confirmation)
  actionsExecutedValidator
);

/**
 * Agentic AI endpoint - Can both answer questions AND take actions
 * 
 * This is the main entry point for the agentic AI system.
 * It first analyzes the user's intent, then either:
 * 1. Runs the Q&A pipeline for questions
 * 2. Returns action proposals for creation/modification requests
 */
export const askAgenticAI = action({
  args: {
    question: v.string(),
    settings: v.optional(chatSettingsValidator),
    userId: v.string(), // Required for agentic mode
    storeId: v.optional(v.string()), // Required for creating content
    userRole: v.optional(v.union(
      v.literal("creator"),
      v.literal("admin"),
      v.literal("student")
    )),
    conversationId: v.optional(v.string()),
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
    // For executing confirmed actions
    executeActions: v.optional(v.boolean()),
    confirmedActions: v.optional(v.array(v.object({
      tool: v.string(),
      parameters: v.any(),
    }))),
    // Agent-specific parameters
    agentId: v.optional(v.id("aiAgents")),
    agentEnabledTools: v.optional(v.array(v.string())), // Tools enabled for this agent
    agentSystemPrompt: v.optional(v.string()), // Custom system prompt from agent
  },
  returns: agenticResponseValidator,
  handler: async (ctx, args) => {
    const settings: ChatSettings = args.settings || DEFAULT_CHAT_SETTINGS;
    const startTime = Date.now();
    const userRole = args.userRole || "creator";

    console.log(`🤖 Agentic AI starting for user: ${args.userId}`);
    if (args.agentId) {
      console.log(`   Agent ID: ${args.agentId}`);
      console.log(`   Enabled Tools: ${args.agentEnabledTools?.join(", ") || "all"}`);
    }

    // Get available tools for this user role + agent
    const availableTools = getToolsForAgent(userRole, args.agentEnabledTools);
    console.log(`   Available tools: ${availableTools.length}`);

    // ========================================================================
    // EXECUTION MODE: Execute confirmed actions
    // ========================================================================
    if (args.executeActions && args.confirmedActions && args.confirmedActions.length > 0) {
      console.log(`⚡ Executing ${args.confirmedActions.length} confirmed actions...`);
      
      const result = await ctx.runAction(
        internal.masterAI.tools.executor.executeTools,
        {
          toolCalls: args.confirmedActions,
          userId: args.userId,
          storeId: args.storeId,
        }
      );

      // Build links from results
      const links: Array<{ label: string; url: string }> = [];
      for (const r of result.results) {
        if (r.success && r.result) {
          const res = r.result as any;
          if (res.link) {
            links.push({
              label: res.message || `View ${r.tool} result`,
              url: res.link,
            });
          }
        }
      }

      return {
        type: "actions_executed" as const,
        results: result.results,
        summary: result.summary,
        links: links.length > 0 ? links : undefined,
      };
    }

    // ========================================================================
    // STAGE 1: Enhanced Planner (with tool awareness)
    // ========================================================================
    console.log("📋 Stage 1: Analyzing intent with tool awareness...");
    
    const planResult = await ctx.runAction(
      internal.masterAI.planner.analyzeQuestionWithTools,
      {
        question: args.question,
        settings,
        userRole,
        availableTools, // Pass agent-filtered tools
        conversationContext: args.conversationContext,
      }
    );

    console.log(`   Intent Type: ${planResult.intentType}`);
    console.log(`   Is Action: ${planResult.isActionRequest}`);
    console.log(`   Tool Calls: ${planResult.toolCalls?.length || 0}`);

    // ========================================================================
    // BRANCH: Action Request -> Return proposal
    // ========================================================================
    if (planResult.isActionRequest && planResult.toolCalls && planResult.toolCalls.length > 0) {
      console.log("🔧 Detected action request, preparing proposal...");
      
      const proposedActions = planResult.toolCalls.map(tc => ({
        tool: tc.tool,
        parameters: tc.parameters,
        description: describeToolCalls([tc]),
        requiresConfirmation: AI_TOOLS[tc.tool]?.requiresConfirmation ?? true,
      }));

      // Generate a friendly summary message
      const toolNames = planResult.toolCalls.map(tc => tc.tool);
      let summaryMessage = "";
      
      if (toolNames.includes("createCourseWithModules")) {
        const tc = planResult.toolCalls.find(t => t.tool === "createCourseWithModules");
        const params = tc?.parameters as any;
        const moduleCount = params?.modules?.length || 0;
        summaryMessage = `I'll create a new course "${params?.title || "Untitled"}" with ${moduleCount} modules for you.`;
      } else if (toolNames.includes("createCourse")) {
        const tc = planResult.toolCalls.find(t => t.tool === "createCourse");
        const params = tc?.parameters as any;
        summaryMessage = `I'll create a new course "${params?.title || "Untitled"}" for you.`;
      } else if (toolNames.includes("generateCourseOutline")) {
        const tc = planResult.toolCalls.find(t => t.tool === "generateCourseOutline");
        const params = tc?.parameters as any;
        summaryMessage = `I'll generate a course outline about "${params?.topic}" with ${params?.moduleCount || 5} modules.`;
      } else if (toolNames.includes("listMyCourses")) {
        summaryMessage = "I'll fetch your courses for you.";
      } else if (toolNames.includes("generateLessonContent")) {
        const tc = planResult.toolCalls.find(t => t.tool === "generateLessonContent");
        const params = tc?.parameters as any;
        summaryMessage = `I'll generate lesson content about "${params?.topic}" for you.`;
      } else if (toolNames.includes("generateSocialScript")) {
        const tc = planResult.toolCalls.find(t => t.tool === "generateSocialScript");
        const params = tc?.parameters as any;
        summaryMessage = `I'll create a ${params?.platform} script about "${params?.topic}" for you.`;
      } else if (toolNames.includes("generateMultiPlatformContent")) {
        const tc = planResult.toolCalls.find(t => t.tool === "generateMultiPlatformContent");
        const params = tc?.parameters as any;
        summaryMessage = `I'll create optimized content for ${params?.platforms?.join(", ")} about "${params?.topic}".`;
      } else if (toolNames.includes("publishSocialPost")) {
        summaryMessage = `I'll publish this post to your connected social account.`;
      } else if (toolNames.includes("scheduleSocialPost")) {
        const tc = planResult.toolCalls.find(t => t.tool === "scheduleSocialPost");
        const params = tc?.parameters as any;
        summaryMessage = `I'll schedule this post for ${params?.scheduledTime}.`;
      } else if (toolNames.includes("createTwitterThread")) {
        const tc = planResult.toolCalls.find(t => t.tool === "createTwitterThread");
        const params = tc?.parameters as any;
        summaryMessage = `I'll create a Twitter thread with ${params?.tweets?.length || 0} tweets.`;
      } else if (toolNames.includes("listConnectedSocialAccounts")) {
        summaryMessage = "I'll fetch your connected social media accounts.";
      } else {
        summaryMessage = `I'll perform ${planResult.toolCalls.length} action(s) for you.`;
      }

      // Check if any actions need confirmation
      const needsConfirmation = proposedActions.some(a => a.requiresConfirmation);
      
      if (!needsConfirmation) {
        // Auto-execute if no confirmation needed
        console.log("⚡ Auto-executing non-confirmation actions...");
        
        const result = await ctx.runAction(
          internal.masterAI.tools.executor.executeTools,
          {
            toolCalls: planResult.toolCalls.map(tc => ({
              tool: tc.tool,
              parameters: tc.parameters,
            })),
            userId: args.userId,
            storeId: args.storeId,
          }
        );

        return {
          type: "actions_executed" as const,
          results: result.results,
          summary: result.summary,
          links: undefined,
        };
      }

      // Return proposal for confirmation
      return {
        type: "action_proposal" as const,
        proposedActions,
        message: `${summaryMessage}\n\nHere's what I'm planning to do:`,
        summary: describeToolCalls(planResult.toolCalls),
      };
    }

    // ========================================================================
    // BRANCH: Question -> Run Q&A Pipeline
    // ========================================================================
    console.log("💬 Processing as question, running Q&A pipeline...");
    
    // Convert the enhanced plan back to standard planner output
    const plannerOutput: PlannerOutput = {
      intent: planResult.intent,
      questionType: planResult.questionType,
      facets: planResult.facets,
      searchStrategies: planResult.searchStrategies,
    };

    // Fetch memories
    let userMemories: MemoryForPipeline[] = [];
    try {
      userMemories = await ctx.runQuery(
        internal.masterAI.queries.getUserMemoriesInternal,
        { userId: args.userId, limit: 10 }
      ) as MemoryForPipeline[];
    } catch (err) {
      console.warn("Failed to load user memories:", err);
    }
    const memoryContext = formatMemoriesForPrompt(userMemories);

    // Run retriever
    const retrieverOutput: RetrieverOutput = await ctx.runAction(
      internal.masterAI.retriever.retrieveContent,
      { plan: plannerOutput, settings }
    );

    if (retrieverOutput.totalChunksRetrieved === 0) {
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

    // Run summarizer
    const summarizerOutput: SummarizerOutput = await ctx.runAction(
      internal.masterAI.summarizer.summarizeContent,
      { retrieverOutput, settings, originalQuestion: args.question }
    );

    // Run optional stages
    let ideaGeneratorOutput: IdeaGeneratorOutput | undefined;
    if (settings.enableCreativeMode) {
      ideaGeneratorOutput = await ctx.runAction(
        internal.masterAI.ideaGenerator.generateIdeas,
        { summarizerOutput, settings, originalQuestion: args.question }
      );
    }

    let criticOutput: CriticOutput | undefined;
    if (settings.enableCritic) {
      criticOutput = await ctx.runAction(
        internal.masterAI.critic.reviewContent,
        { summarizerOutput, ideaGeneratorOutput, settings, originalQuestion: args.question }
      );
    }

    // Generate final response
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
        memoryContext,
        sourceChunks: allSourceChunks,
      }
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Agentic AI complete in ${totalTime}ms`);

    return {
      ...finalResponse,
      pipelineMetadata: {
        ...finalResponse.pipelineMetadata,
        processingTimeMs: totalTime,
      },
    };
  },
});

/**
 * Execute confirmed actions (called after user confirms proposal)
 */
export const executeConfirmedActions = action({
  args: {
    actions: v.array(v.object({
      tool: v.string(),
      parameters: v.any(),
    })),
    userId: v.string(),
    storeId: v.optional(v.string()),
  },
  returns: actionsExecutedValidator,
  handler: async (ctx, args) => {
    console.log(`⚡ Executing ${args.actions.length} confirmed actions...`);
    
    const result = await ctx.runAction(
      internal.masterAI.tools.executor.executeTools,
      {
        toolCalls: args.actions,
        userId: args.userId,
        storeId: args.storeId,
      }
    );

    // Build links from results
    const links: Array<{ label: string; url: string }> = [];
    for (const r of result.results) {
      if (r.success && r.result) {
        const res = r.result as any;
        if (res.link) {
          links.push({
            label: res.message || `View ${r.tool} result`,
            url: res.link,
          });
        }
      }
    }

    return {
      type: "actions_executed" as const,
      results: result.results,
      summary: result.summary,
      links: links.length > 0 ? links : undefined,
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

