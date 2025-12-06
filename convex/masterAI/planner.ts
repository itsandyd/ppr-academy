"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { 
  chatSettingsValidator, 
  plannerOutputValidator,
  MODEL_PRESETS,
  AVAILABLE_MODELS,
  type ChatSettings,
  type PlannerOutput,
  type ModelId,
} from "./types";
import { callLLM } from "./llmClient";
import { 
  AI_TOOLS, 
  getToolDescriptionsForLLM,
  intentTypeValidator,
  toolCallValidator,
  type IntentType,
  type ToolCall,
} from "./tools/schema";

/**
 * Planner Stage
 * 
 * Analyzes the user's question and decomposes it into facets for targeted retrieval.
 * This is the first stage in the Master AI pipeline.
 */
export const analyzeQuestion = internalAction({
  args: {
    question: v.string(),
    settings: chatSettingsValidator,
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  returns: plannerOutputValidator,
  handler: async (ctx, args): Promise<PlannerOutput> => {
    const { question, settings, conversationContext } = args;
    
    // Get the model for this stage
    const modelId = getModelForStage("planner", settings);
    
    const systemPrompt = `You are an expert question analyzer for a music production education platform. Your job is to decompose complex questions into searchable facets.

Given a user's question about music production, sound design, mixing, or related topics:

1. **Identify the Intent**: What is the user ultimately trying to achieve?

2. **Classify the Question Type**:
   - "technical": Specific how-to about tools, parameters, techniques
   - "conceptual": Understanding theory, principles, or "why" questions
   - "workflow": Step-by-step processes or project organization
   - "creative": Artistic choices, style emulation, sound design exploration
   - "troubleshooting": Fixing problems, debugging issues
   - "comparison": Comparing tools, techniques, or approaches

3. **Decompose into Facets** (max ${settings.maxFacets} facets):
   Each facet should represent a distinct knowledge area needed to fully answer the question.
   For each facet, provide:
   - name: Short identifier (e.g., "sound_design", "mixing", "arrangement")
   - description: What this facet covers
   - queryHint: Search-optimized text to find relevant content
   - tags: Relevant categories/topics for filtering
   - priority: 1-5 (5 = most important for answering)

4. **Generate Search Strategies**:
   For each facet, create a targeted search query that combines the original question context with the facet focus.

IMPORTANT: 
- Keep facets focused and non-overlapping
- Prioritize facets that directly address the core question
- Include practical/technique facets alongside conceptual ones
- Consider the user's likely skill level based on question complexity

Respond ONLY with valid JSON matching this structure:
{
  "intent": "string describing what user wants to achieve",
  "questionType": "technical|conceptual|workflow|creative|troubleshooting|comparison",
  "facets": [
    {
      "name": "facet_name",
      "description": "what this facet covers",
      "queryHint": "search-optimized text",
      "tags": ["tag1", "tag2"],
      "priority": 5
    }
  ],
  "searchStrategies": [
    {
      "facetName": "facet_name",
      "query": "full search query for this facet",
      "filters": {
        "sourceTypes": ["course", "chapter"],
        "categories": ["optional category filter"]
      }
    }
  ]
}`;

    // Build messages with conversation context if available
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add conversation context for follow-up questions
    if (conversationContext && conversationContext.length > 0) {
      // Add last few exchanges for context (limit to avoid token bloat)
      const recentContext = conversationContext.slice(-4);
      for (const msg of recentContext) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
      messages.push({
        role: "user",
        content: `Based on our conversation, analyze this follow-up question:\n\n"${question}"`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this question:\n\n"${question}"`,
      });
    }

    try {
      const response = await callLLM({
        model: modelId,
        messages,
        temperature: 0.3, // Lower temperature for structured output
        maxTokens: 1500,
        responseFormat: "json",
      });

      // Parse the JSON response
      const parsed = JSON.parse(response.content);
      
      // Validate and ensure we have required fields
      const output: PlannerOutput = {
        intent: parsed.intent || "General question",
        questionType: validateQuestionType(parsed.questionType),
        facets: (parsed.facets || []).slice(0, settings.maxFacets).map((f: any) => ({
          name: f.name || "general",
          description: f.description || "",
          queryHint: f.queryHint || question,
          tags: Array.isArray(f.tags) ? f.tags : [],
          priority: typeof f.priority === "number" ? Math.min(5, Math.max(1, f.priority)) : 3,
        })),
        searchStrategies: (parsed.searchStrategies || []).map((s: any) => ({
          facetName: s.facetName || "general",
          query: s.query || question,
          filters: {
            sourceTypes: Array.isArray(s.filters?.sourceTypes) ? s.filters.sourceTypes : undefined,
            categories: Array.isArray(s.filters?.categories) ? s.filters.categories : undefined,
          },
        })),
      };

      // Ensure we have at least one facet
      if (output.facets.length === 0) {
        output.facets = [{
          name: "general",
          description: "General knowledge about the topic",
          queryHint: question,
          tags: [],
          priority: 5,
        }];
        output.searchStrategies = [{
          facetName: "general",
          query: question,
          filters: {},
        }];
      }

      return output;
    } catch (error) {
      console.error("Planner error:", error);
      
      // Return a fallback single-facet plan
      return {
        intent: "Answer user question",
        questionType: "technical",
        facets: [{
          name: "general",
          description: "General knowledge about the topic",
          queryHint: question,
          tags: [],
          priority: 5,
        }],
        searchStrategies: [{
          facetName: "general",
          query: question,
          filters: {},
        }],
      };
    }
  },
});

// Helper to get the model ID for a pipeline stage
function getModelForStage(
  stage: "planner" | "summarizer" | "ideaGenerator" | "critic" | "finalWriter",
  settings: ChatSettings
): ModelId {
  // Check for custom model override
  if (settings.customModels?.[stage]) {
    return settings.customModels[stage]!;
  }
  // Use preset
  const preset = MODEL_PRESETS[settings.preset];
  return preset[stage];
}

// Validate question type
function validateQuestionType(type: string): PlannerOutput["questionType"] {
  const validTypes = ["technical", "conceptual", "workflow", "creative", "troubleshooting", "comparison"];
  if (validTypes.includes(type)) {
    return type as PlannerOutput["questionType"];
  }
  return "technical";
}

// ============================================================================
// ACTION-AWARE PLANNER
// ============================================================================

/**
 * Enhanced planner that detects both questions AND action requests
 * This is the first step in determining if the AI should take action or just answer
 */
export const analyzeQuestionWithTools = internalAction({
  args: {
    question: v.string(),
    settings: chatSettingsValidator,
    availableTools: v.optional(v.array(v.string())),
    userRole: v.optional(v.union(
      v.literal("creator"),
      v.literal("admin"),
      v.literal("student")
    )),
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  returns: v.object({
    // Standard planner output
    intent: v.string(),
    questionType: v.union(
      v.literal("technical"),
      v.literal("conceptual"),
      v.literal("workflow"),
      v.literal("creative"),
      v.literal("troubleshooting"),
      v.literal("comparison")
    ),
    facets: v.array(v.object({
      name: v.string(),
      description: v.string(),
      queryHint: v.string(),
      tags: v.array(v.string()),
      priority: v.number(),
    })),
    searchStrategies: v.array(v.object({
      facetName: v.string(),
      query: v.string(),
      filters: v.object({
        sourceTypes: v.optional(v.array(v.string())),
        categories: v.optional(v.array(v.string())),
      }),
    })),
    // NEW: Tool calling fields
    intentType: intentTypeValidator,
    toolCalls: v.optional(v.array(toolCallValidator)),
    isActionRequest: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { question, settings, userRole = "creator", conversationContext } = args;
    
    const modelId = getModelForStage("planner", settings);
    
    // Get available tools for this user role
    const availableToolNames = args.availableTools || Object.keys(AI_TOOLS).filter(
      toolName => AI_TOOLS[toolName].permissions.includes(userRole)
    );
    
    // Build tool descriptions for the LLM
    const toolDescriptions = availableToolNames.map(name => {
      const tool = AI_TOOLS[name];
      const params = Object.entries(tool.parameters)
        .map(([pName, p]) => `    - ${pName}${p.required ? " (required)" : ""}: ${p.description}`)
        .join("\n");
      return `  **${name}**: ${tool.description}\n    Category: ${tool.category}\n    Parameters:\n${params}`;
    }).join("\n\n");

    const systemPrompt = `You are an intelligent assistant for a music production education platform. Your job is to analyze user messages and determine:

1. **Is this a QUESTION or an ACTION REQUEST?**
   - QUESTION: User wants information, explanation, or help understanding something
   - ACTION REQUEST: User wants you to DO something (create, modify, delete, list)

2. **Intent Types:**
   - "question" = User wants information/explanation
   - "create" = User wants to create something (course, lesson, product)
   - "modify" = User wants to change existing content
   - "delete" = User wants to remove something
   - "query" = User wants to see/list their content
   - "generate" = User wants AI to generate content (outline, quiz, lesson content)

3. **If this is an ACTION REQUEST, identify which TOOLS to use:**

AVAILABLE TOOLS:
${toolDescriptions}

4. **For QUESTIONS, decompose into facets** for targeted knowledge retrieval (max ${settings.maxFacets} facets).

RESPOND ONLY WITH VALID JSON:
{
  "intentType": "question|create|modify|delete|query|generate",
  "isActionRequest": true/false,
  "intent": "what the user wants to achieve",
  "questionType": "technical|conceptual|workflow|creative|troubleshooting|comparison",
  
  // Only if isActionRequest is true:
  "toolCalls": [
    {
      "tool": "toolName",
      "parameters": { "param1": "value1", ... },
      "reasoning": "Why this tool is needed"
    }
  ],
  
  // Only if isActionRequest is false (it's a question):
  "facets": [
    {
      "name": "facet_name",
      "description": "what this facet covers",
      "queryHint": "search-optimized text",
      "tags": ["tag1"],
      "priority": 5
    }
  ],
  "searchStrategies": [
    {
      "facetName": "facet_name",
      "query": "search query",
      "filters": { "sourceTypes": ["course"], "categories": [] }
    }
  ]
}

EXAMPLES:

User: "How does sidechain compression work?"
→ intentType: "question", isActionRequest: false, facets: [...]

User: "Create a course on Music Theory with 5 modules"
→ intentType: "create", isActionRequest: true, toolCalls: [{tool: "createCourseWithModules", parameters: {...}}]

User: "Show me all my draft courses"
→ intentType: "query", isActionRequest: true, toolCalls: [{tool: "listMyCourses", parameters: {status: "draft"}}]

User: "Generate an outline for a course on Sound Design"
→ intentType: "generate", isActionRequest: true, toolCalls: [{tool: "generateCourseOutline", parameters: {topic: "Sound Design"}}]`;

    // Build messages
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    
    if (conversationContext && conversationContext.length > 0) {
      const recentContext = conversationContext.slice(-4);
      for (const msg of recentContext) {
        messages.push({ role: msg.role, content: msg.content });
      }
      messages.push({
        role: "user",
        content: `Analyze this message:\n\n"${question}"`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this message:\n\n"${question}"`,
      });
    }

    try {
      const response = await callLLM({
        model: modelId,
        messages,
        temperature: 0.2, // Low temperature for accurate intent detection
        maxTokens: 2000,
        responseFormat: "json",
      });

      const parsed = JSON.parse(response.content);
      
      // Validate intent type
      const validIntentTypes: IntentType[] = ["question", "create", "modify", "delete", "query", "generate"];
      const intentType: IntentType = validIntentTypes.includes(parsed.intentType) 
        ? parsed.intentType 
        : "question";
      
      const isActionRequest = parsed.isActionRequest === true && intentType !== "question";
      
      // Build the response
      const result = {
        intentType,
        isActionRequest,
        intent: parsed.intent || "Process user request",
        questionType: validateQuestionType(parsed.questionType || "technical"),
        facets: [] as PlannerOutput["facets"],
        searchStrategies: [] as PlannerOutput["searchStrategies"],
        toolCalls: undefined as ToolCall[] | undefined,
      };

      // Add tool calls if this is an action request
      if (isActionRequest && Array.isArray(parsed.toolCalls) && parsed.toolCalls.length > 0) {
        result.toolCalls = parsed.toolCalls.map((tc: any) => ({
          tool: tc.tool || "",
          parameters: tc.parameters || {},
          reasoning: tc.reasoning || "",
        })).filter((tc: ToolCall) => tc.tool && AI_TOOLS[tc.tool]); // Filter out invalid tools
      }

      // Add facets for questions
      if (!isActionRequest) {
        if (Array.isArray(parsed.facets) && parsed.facets.length > 0) {
          result.facets = parsed.facets.slice(0, settings.maxFacets).map((f: any) => ({
            name: f.name || "general",
            description: f.description || "",
            queryHint: f.queryHint || question,
            tags: Array.isArray(f.tags) ? f.tags : [],
            priority: typeof f.priority === "number" ? Math.min(5, Math.max(1, f.priority)) : 3,
          }));
        } else {
          // Default facet
          result.facets = [{
            name: "general",
            description: "General knowledge about the topic",
            queryHint: question,
            tags: [],
            priority: 5,
          }];
        }

        if (Array.isArray(parsed.searchStrategies) && parsed.searchStrategies.length > 0) {
          result.searchStrategies = parsed.searchStrategies.map((s: any) => ({
            facetName: s.facetName || "general",
            query: s.query || question,
            filters: {
              sourceTypes: Array.isArray(s.filters?.sourceTypes) ? s.filters.sourceTypes : undefined,
              categories: Array.isArray(s.filters?.categories) ? s.filters.categories : undefined,
            },
          }));
        } else {
          result.searchStrategies = [{
            facetName: "general",
            query: question,
            filters: {},
          }];
        }
      }

      console.log(`📋 Planner result: intentType=${intentType}, isAction=${isActionRequest}, tools=${result.toolCalls?.length || 0}`);
      
      return result;
    } catch (error) {
      console.error("Enhanced planner error:", error);
      
      // Fallback: treat as a question
      return {
        intentType: "question" as IntentType,
        isActionRequest: false,
        intent: "Answer user question",
        questionType: "technical" as const,
        facets: [{
          name: "general",
          description: "General knowledge about the topic",
          queryHint: question,
          tags: [],
          priority: 5,
        }],
        searchStrategies: [{
          facetName: "general",
          query: question,
          filters: {},
        }],
        toolCalls: undefined,
      };
    }
  },
});

// ============================================================================
// TOOL DESCRIPTION GENERATOR
// ============================================================================

/**
 * Generate a human-readable description of proposed actions
 */
export function describeToolCalls(toolCalls: ToolCall[]): string {
  return toolCalls.map(tc => {
    const tool = AI_TOOLS[tc.tool];
    if (!tool) return `Unknown action: ${tc.tool}`;
    
    const params = tc.parameters as Record<string, unknown>;
    
    switch (tc.tool) {
      case "createCourse":
        return `📚 Create course "${params.title}"${params.price ? ` ($${params.price})` : " (free)"}`;
      case "createCourseWithModules":
        const moduleCount = Array.isArray(params.modules) ? params.modules.length : 0;
        return `📚 Create course "${params.title}" with ${moduleCount} modules`;
      case "addModuleToCourse":
        return `📖 Add module "${params.title}" to course`;
      case "addLessonToModule":
        return `📝 Add lesson "${params.title}" to module`;
      case "addChapterToLesson":
        return `📄 Add chapter "${params.title}" to lesson`;
      case "updateCourse":
        return `✏️ Update course ${params.isPublished ? "(publish)" : ""}`;
      case "generateLessonContent":
        return `✨ Generate ${params.style || "intermediate"} content about "${params.topic}"`;
      case "generateQuizQuestions":
        return `❓ Generate ${params.questionCount || 5} quiz questions about "${params.topic}"`;
      case "generateCourseOutline":
        return `📋 Generate course outline for "${params.topic}" (${params.moduleCount || 5} modules)`;
      case "listMyCourses":
        return `📋 List ${params.status || "all"} courses`;
      case "getCourseDetails":
        return `🔍 Get details for course`;
      case "getCourseStats":
        return `📊 Get stats for course`;
      case "duplicateCourse":
        return `📋 Duplicate course${params.newTitle ? ` as "${params.newTitle}"` : ""}`;
      case "deleteCourse":
        return `🗑️ Delete course (requires confirmation)`;
      default:
        return `🔧 ${tool.description}`;
    }
  }).join("\n");
}

