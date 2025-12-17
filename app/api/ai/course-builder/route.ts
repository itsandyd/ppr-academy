import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import {
  DEFAULT_CHAT_SETTINGS,
  MODEL_PRESETS,
  type ChatSettings,
  type StreamEvent,
} from "@/convex/masterAI/types";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================================
// STREAMING COURSE BUILDER ENDPOINT
// Uses the full AI pipeline: Planner → Retriever → Web Research → Summarizer → 
// Idea Generator → Fact Verifier → Critic → Final Writer (Course Outline)
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
      prompt, 
      settings, 
      storeId,
      queueId,
      mode = "outline", // "outline" | "expand" | "full_auto"
      outlineId,
      // For chapter expansion
      moduleIndex,
      lessonIndex,
      chapterIndex,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate and merge settings
    const chatSettings: ChatSettings = {
      ...DEFAULT_CHAT_SETTINGS,
      ...settings,
    };
    
    console.log(`[Course Builder] Starting pipeline for store: ${storeId}`);
    console.log(`[Course Builder] Mode: ${mode}, Settings: preset=${chatSettings.preset}, web=${chatSettings.enableWebResearch}`);

    // Create a streaming response with real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const pendingTimers: NodeJS.Timeout[] = [];
        
        // Safe event sender
        const sendEvent = (event: StreamEvent | { type: string; [key: string]: any }) => {
          if (isClosed) return;
          try {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.warn("Failed to send event, controller may be closed");
          }
        };
        
        // Safe close function
        const safeClose = () => {
          if (isClosed) return;
          isClosed = true;
          pendingTimers.forEach(timer => clearTimeout(timer));
          pendingTimers.length = 0;
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        };

        // Pipeline stages with realistic timing
        const stages = [
          { stage: "planner", model: getModelForStage("planner", chatSettings), duration: 2500, description: "📋 Analyzing course topic..." },
          { stage: "retriever", model: "text-embedding-3-small", duration: 3500, description: "🔍 Searching knowledge base..." },
          ...(chatSettings.enableWebResearch ? [{ stage: "webResearch", model: "tavily", duration: 5000, description: "🌐 Researching the web..." }] : []),
          { stage: "summarizer", model: getModelForStage("summarizer", chatSettings), duration: 4000, description: "📝 Synthesizing information..." },
          ...(chatSettings.enableCreativeMode ? [{ stage: "ideaGenerator", model: getModelForStage("ideaGenerator", chatSettings), duration: 3500, description: "💡 Generating creative ideas..." }] : []),
          ...(chatSettings.enableFactVerification ? [{ stage: "factVerifier", model: "gpt-4o-mini", duration: 3000, description: "🔬 Verifying facts..." }] : []),
          ...(chatSettings.enableCritic ? [{ stage: "critic", model: getModelForStage("critic", chatSettings), duration: 3000, description: "🎯 Quality review..." }] : []),
          { stage: "courseWriter", model: getModelForStage("finalWriter", chatSettings), duration: 8000, description: "✍️ Generating course structure..." },
        ];

        let currentStageIndex = 0;
        let actionComplete = false;

        // Function to advance to next simulated stage
        const advanceStage = () => {
          if (actionComplete || isClosed || currentStageIndex >= stages.length) return;
          
          const stage = stages[currentStageIndex];
          sendEvent({ 
            type: "stage_start", 
            stage: stage.stage, 
            model: stage.model,
            description: stage.description 
          });
          
          // Intermediate events for certain stages
          if (stage.stage === "retriever") {
            const timer1 = setTimeout(() => {
              if (!actionComplete && !isClosed) {
                sendEvent({ type: "chunks_retrieved", facet: "course content", count: Math.floor(Math.random() * 20) + 10 });
              }
            }, 1200);
            const timer2 = setTimeout(() => {
              if (!actionComplete && !isClosed) {
                sendEvent({ type: "chunks_retrieved", facet: "related topics", count: Math.floor(Math.random() * 15) + 5 });
              }
            }, 2400);
            pendingTimers.push(timer1, timer2);
          }
          
          if (stage.stage === "webResearch") {
            const timer = setTimeout(() => {
              if (!actionComplete && !isClosed) {
                sendEvent({ type: "web_research_result", facet: "current practices", count: Math.floor(Math.random() * 5) + 3 });
              }
            }, 2000);
            pendingTimers.push(timer);
          }
          
          if (stage.stage === "summarizer") {
            const timer = setTimeout(() => {
              if (!actionComplete && !isClosed) {
                sendEvent({ type: "summary_generated", facet: "main concepts", summary: "Synthesizing key topics..." });
              }
            }, 2000);
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

        // Heartbeat to keep connection alive
        let elapsedSeconds = 0;
        const heartbeatTimer = setInterval(() => {
          if (isClosed || actionComplete) {
            clearInterval(heartbeatTimer);
            return;
          }
          elapsedSeconds += 5;
          sendEvent({ 
            type: "heartbeat", 
            elapsed: elapsedSeconds,
            message: `Processing... (${elapsedSeconds}s)` 
          });
        }, 5000);
        pendingTimers.push(heartbeatTimer as unknown as NodeJS.Timeout);

        try {
          // Run the full pipeline through Convex
          const result = await convex.action(
            (api as any).aiCourseBuilder.generateOutlineWithPipeline,
            {
              prompt,
              settings: chatSettings,
              userId,
              storeId: storeId || "",
              queueId: queueId || undefined,
            }
          );

          // Mark action complete
          actionComplete = true;
          clearInterval(heartbeatTimer);

          // Send pipeline metadata
          if (result.pipelineMetadata) {
            sendEvent({ 
              type: "facets_identified", 
              facets: result.pipelineMetadata.facetsUsed || [] 
            });
            sendEvent({
              type: "chunks_retrieved",
              facet: "total",
              count: result.pipelineMetadata.totalChunksProcessed || 0,
            });
            if (result.pipelineMetadata.webResearchResults !== undefined) {
              sendEvent({
                type: "web_research_complete",
                totalResults: result.pipelineMetadata.webResearchResults,
                savedToEmbeddings: chatSettings.autoSaveWebResearch || false,
              });
            }
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
          
          console.error("Course builder pipeline error:", error);
          
          let errorMessage = "Pipeline failed";
          if (error instanceof Error) {
            errorMessage = error.message || error.name || "Unknown error";
            if (error.message?.includes("timeout") || error.name === "TimeoutError") {
              errorMessage = "Request timed out. Try a simpler course topic or adjust settings.";
            }
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error && typeof error === "object") {
            errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
          }
          
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
    console.error("Course Builder API error:", error);
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

