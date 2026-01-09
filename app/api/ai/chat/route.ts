import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import {
  DEFAULT_CHAT_SETTINGS,
  MODEL_PRESETS,
  AVAILABLE_MODELS,
  type ChatSettings,
  type StreamEvent,
  type ModelId,
} from "@/convex/masterAI/types";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================================
// STREAMING AI CHAT ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      question, 
      settings, 
      conversationContext, 
      conversationId,
      // Agent-specific parameters
      agentId,
      agentEnabledTools,
      agentSystemPrompt,
    } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Validate and merge settings
    const chatSettings: ChatSettings = {
      ...DEFAULT_CHAT_SETTINGS,
      ...settings,
    };
    
    // Check if we're in agent mode (has specific tools)
    const isAgentMode = !!agentId || (agentEnabledTools && agentEnabledTools.length > 0);
    
    console.log(`[AI Chat] Starting pipeline for conversation: ${conversationId || "new"}`);
    console.log(`[AI Chat] Settings: preset=${chatSettings.preset}, web=${chatSettings.enableWebResearch}, fact=${chatSettings.enableFactVerification}`);
    if (isAgentMode) {
      console.log(`[AI Chat] Agent mode: ${agentId}, tools: ${agentEnabledTools?.join(", ") || "all"}`);
    }

    // Create a streaming response with simulated progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const pendingTimers: NodeJS.Timeout[] = [];
        
        // Safe event sender that checks if controller is still open
        const sendEvent = (event: StreamEvent | { type: string; [key: string]: any }) => {
          if (isClosed) return; // Don't send if already closed
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            // Controller may be closed, ignore
            console.warn("Failed to send event, controller may be closed");
          }
        };
        
        // Safe close function
        const safeClose = () => {
          if (isClosed) return;
          isClosed = true;
          // Clear all pending timers
          pendingTimers.forEach(timer => clearTimeout(timer));
          pendingTimers.length = 0;
          try {
            controller.close();
          } catch (e) {
            // Already closed, ignore
          }
        };

        // Simulated pipeline stages with realistic timing
        const stages = [
          { stage: "planner", model: getModelForStage("planner", chatSettings), duration: 2000 },
          { stage: "retriever", model: "text-embedding-3-small", duration: 3000 },
          ...(chatSettings.enableWebResearch ? [{ stage: "webResearch", model: "tavily", duration: 4000 }] : []),
          { stage: "summarizer", model: getModelForStage("summarizer", chatSettings), duration: 5000 },
          ...(chatSettings.enableCreativeMode ? [{ stage: "ideaGenerator", model: getModelForStage("ideaGenerator", chatSettings), duration: 4000 }] : []),
          ...(chatSettings.enableFactVerification ? [{ stage: "factVerifier", model: "gpt-4o-mini", duration: 3000 }] : []),
          ...(chatSettings.enableCritic ? [{ stage: "critic", model: getModelForStage("critic", chatSettings), duration: 3000 }] : []),
          { stage: "finalWriter", model: getModelForStage("finalWriter", chatSettings), duration: 8000 },
        ];

        let currentStageIndex = 0;
        let actionComplete = false;

        // Function to advance to next simulated stage
        const advanceStage = () => {
          if (actionComplete || isClosed || currentStageIndex >= stages.length) return;
          
          const stage = stages[currentStageIndex];
          sendEvent({ type: "stage_start", stage: stage.stage, model: stage.model });
          
          // Also send some intermediate events for certain stages
          if (stage.stage === "retriever") {
            const timer1 = setTimeout(() => {
              if (!actionComplete && !isClosed) sendEvent({ type: "chunks_retrieved", facet: "topic 1", count: 15 });
            }, 1000);
            const timer2 = setTimeout(() => {
              if (!actionComplete && !isClosed) sendEvent({ type: "chunks_retrieved", facet: "topic 2", count: 12 });
            }, 2000);
            pendingTimers.push(timer1, timer2);
          }
          
          if (stage.stage === "webResearch") {
            const timer = setTimeout(() => {
              if (!actionComplete && !isClosed) sendEvent({ type: "web_research_result", facet: "topic 1", count: 3 });
            }, 1500);
            pendingTimers.push(timer);
          }
          
          currentStageIndex++;
          if (currentStageIndex < stages.length) {
            const stageTimer = setTimeout(advanceStage, stage.duration);
            pendingTimers.push(stageTimer);
          }
        };

        // Start the stage progression
        advanceStage();

        // Add a heartbeat that keeps the connection alive and shows progress
        let elapsedSeconds = 0;
        const heartbeatTimer = setInterval(() => {
          if (isClosed || actionComplete) {
            clearInterval(heartbeatTimer);
            return;
          }
          elapsedSeconds += 5;
          sendEvent({ 
            type: "stage_start", 
            stage: "processing", 
            model: `Still working... (${elapsedSeconds}s)` 
          });
        }, 5000); // Every 5 seconds
        pendingTimers.push(heartbeatTimer as unknown as NodeJS.Timeout);

        try {
          // Call Convex to run the full pipeline
          // Use agentic endpoint if agent is selected or agent has specific tools
          let result: any;
          
          if (isAgentMode) {
            // Use agentic AI for agents with tools
            result = await convex.action(
              (api as any).masterAI.index.askAgenticAI,
              {
                question,
                settings: chatSettings,
                userId,
                storeId: "", // TODO: Get user's store ID from profile
                userRole: "creator",
                conversationContext,
                agentId: agentId || undefined,
                agentEnabledTools: agentEnabledTools || undefined,
                agentSystemPrompt: agentSystemPrompt || undefined,
              }
            );
            
            // Handle different response types from agentic AI
            if (result.type === "action_proposal" || result.type === "actions_executed") {
              // These are special response types for tool calls
              actionComplete = true;
              clearInterval(heartbeatTimer);
              sendEvent({
                type: "complete",
                response: result,
              });
              safeClose();
              return;
            }
          } else {
            // Standard Q&A mode
            result = await convex.action(
              (api as any).masterAI.index.askMasterAI,
              {
                question,
                settings: chatSettings,
                userId,
                conversationId: conversationId || undefined,
                conversationContext,
              }
            );
          }

          // Mark action as complete to stop simulated progress
          actionComplete = true;
          clearInterval(heartbeatTimer);

          // Send the actual results
          sendEvent({ type: "facets_identified", facets: result.facetsUsed || [] });
          sendEvent({
            type: "chunks_retrieved",
            facet: "total",
            count: result.pipelineMetadata?.totalChunksProcessed || 0,
          });
          
          // Send web research count if available
          if (result.pipelineMetadata?.webResearchResults !== undefined) {
            sendEvent({
              type: "web_research_complete",
              totalResults: result.pipelineMetadata.webResearchResults,
              savedToEmbeddings: chatSettings.autoSaveWebResearch || false,
            });
          }
          
          // Send the complete response
          sendEvent({
            type: "complete",
            response: result,
          });

          safeClose();
        } catch (error) {
          actionComplete = true;
          clearInterval(heartbeatTimer);
          
          console.error("Pipeline error:", error);
          
          // Extract error message, handling various error types
          let errorMessage = "Pipeline failed";
          if (error instanceof Error) {
            errorMessage = error.message || error.name || "Unknown error";
            // Check for timeout indicators
            if (error.message?.includes("timeout") || error.name === "TimeoutError") {
              errorMessage = "Request timed out. Try a shorter question or simpler settings.";
            }
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object") {
            errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
          }
          
          // Handle empty error messages
          if (!errorMessage || errorMessage === "Error" || errorMessage.trim() === "") {
            errorMessage = "An unexpected error occurred. Please try again.";
          }
          
          sendEvent({
            type: "error",
            message: errorMessage,
          });
          safeClose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// NON-STREAMING ENDPOINT (for simpler use cases)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const question = searchParams.get("q");

    if (!question) {
      return NextResponse.json(
        { error: "Question (q) parameter is required" },
        { status: 400 }
      );
    }

    // Use quick ask for GET requests
    // @ts-expect-error - masterAI has deep type inference issues
    const quickAskRef = api.masterAI?.index?.quickAsk;
    const response = await convex.action(quickAskRef, {
      question,
      userId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getModelForStage(
  stage: "planner" | "summarizer" | "ideaGenerator" | "critic" | "finalWriter",
  settings: ChatSettings
): string {
  if (settings.customModels?.[stage]) {
    return settings.customModels[stage]!;
  }
  const preset = MODEL_PRESETS[settings.preset];
  return preset[stage];
}

