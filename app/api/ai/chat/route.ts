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
    const { question, settings, conversationContext } = body;

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

    // Create a streaming response with simulated progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: StreamEvent | { type: string; [key: string]: any }) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
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
        let stageTimer: NodeJS.Timeout | null = null;
        let actionComplete = false;

        // Function to advance to next simulated stage
        const advanceStage = () => {
          if (actionComplete || currentStageIndex >= stages.length) return;
          
          const stage = stages[currentStageIndex];
          sendEvent({ type: "stage_start", stage: stage.stage, model: stage.model });
          
          // Also send some intermediate events for certain stages
          if (stage.stage === "retriever") {
            setTimeout(() => {
              if (!actionComplete) sendEvent({ type: "chunks_retrieved", facet: "topic 1", count: 15 });
            }, 1000);
            setTimeout(() => {
              if (!actionComplete) sendEvent({ type: "chunks_retrieved", facet: "topic 2", count: 12 });
            }, 2000);
          }
          
          if (stage.stage === "webResearch") {
            setTimeout(() => {
              if (!actionComplete) sendEvent({ type: "web_research_result", facet: "topic 1", count: 3 });
            }, 1500);
          }
          
          currentStageIndex++;
          if (currentStageIndex < stages.length) {
            stageTimer = setTimeout(advanceStage, stage.duration);
          }
        };

        // Start the stage progression
        advanceStage();

        try {
          // Call Convex to run the full pipeline
          const result = await convex.action(
            (api as any).masterAI.index.askMasterAI,
            {
              question,
              settings: chatSettings,
              userId,
              conversationContext,
            }
          );

          // Mark action as complete to stop simulated progress
          actionComplete = true;
          if (stageTimer) clearTimeout(stageTimer);

          // Send the actual results
          sendEvent({ type: "facets_identified", facets: result.facetsUsed || [] });
          sendEvent({
            type: "chunks_retrieved",
            facet: "total",
            count: result.pipelineMetadata?.totalChunksProcessed || 0,
          });
          
          // Send the complete response
          sendEvent({
            type: "complete",
            response: result,
          });

          controller.close();
        } catch (error) {
          actionComplete = true;
          if (stageTimer) clearTimeout(stageTimer);
          
          console.error("Pipeline error:", error);
          sendEvent({
            type: "error",
            message: error instanceof Error ? error.message : "Pipeline failed",
          });
          controller.close();
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
    const response = await convex.action((api as any).masterAI.index.quickAsk, {
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

