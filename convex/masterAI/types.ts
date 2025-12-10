import { v } from "convex/values";

// ============================================================================
// MODEL CONFIGURATION - OpenAI + OpenRouter
// ============================================================================

export const ModelProvider = {
  OPENAI: "openai",
  OPENROUTER: "openrouter",
} as const;

export const modelProviderValidator = v.union(
  v.literal("openai"),
  v.literal("openrouter")
);

// Available models - Real model IDs (Updated Dec 2025)
// OpenAI models use direct API, everything else goes through OpenRouter
// See: https://openrouter.ai/rankings for current usage
export const AVAILABLE_MODELS = {
  // ============ OpenAI Direct ============
  "gpt-4o": { provider: "openai", apiId: "gpt-4o", costIn: 2.5, costOut: 10, speed: "fast", reasoning: false },
  "gpt-4o-mini": { provider: "openai", apiId: "gpt-4o-mini", costIn: 0.15, costOut: 0.6, speed: "very-fast", reasoning: false },
  "o1": { provider: "openai", apiId: "o1", costIn: 15, costOut: 60, speed: "slow", reasoning: true },
  "o1-mini": { provider: "openai", apiId: "o1-mini", costIn: 3, costOut: 12, speed: "medium", reasoning: true },
  
  // ============ OpenAI via OpenRouter (newer models) ============
  "gpt-5-mini": { provider: "openrouter", apiId: "openai/gpt-5-mini-2025-08-07", costIn: 1.5, costOut: 6, speed: "fast", reasoning: true },
  "gpt-oss-120b": { provider: "openrouter", apiId: "openai/gpt-oss-120b", costIn: 2, costOut: 8, speed: "medium", reasoning: false },
  
  // ============ Anthropic Claude 4.5 via OpenRouter ============
  // See: https://openrouter.ai/anthropic/claude-sonnet-4.5 and https://openrouter.ai/anthropic/claude-opus-4.5
  "claude-4.5-sonnet": { provider: "openrouter", apiId: "anthropic/claude-sonnet-4.5", costIn: 3, costOut: 15, speed: "fast", reasoning: true },
  "claude-4.5-opus": { provider: "openrouter", apiId: "anthropic/claude-opus-4.5", costIn: 5, costOut: 25, speed: "medium", reasoning: true },
  "claude-4-sonnet": { provider: "openrouter", apiId: "anthropic/claude-sonnet-4", costIn: 3, costOut: 15, speed: "fast", reasoning: true },
  // Legacy Claude
  "claude-3.5-sonnet": { provider: "openrouter", apiId: "anthropic/claude-3.5-sonnet", costIn: 3, costOut: 15, speed: "fast", reasoning: false },
  "claude-3.5-haiku": { provider: "openrouter", apiId: "anthropic/claude-3.5-haiku", costIn: 0.25, costOut: 1.25, speed: "very-fast", reasoning: false },
  
  // ============ Google Gemini 2.5/3.0 via OpenRouter ============
  "gemini-3-pro": { provider: "openrouter", apiId: "google/gemini-3-pro-preview-20251117", costIn: 1.25, costOut: 5, speed: "fast", reasoning: true },
  "gemini-2.5-flash": { provider: "openrouter", apiId: "google/gemini-2.5-flash", costIn: 0.15, costOut: 0.6, speed: "very-fast", reasoning: false },
  "gemini-2.5-flash-lite": { provider: "openrouter", apiId: "google/gemini-2.5-flash-lite", costIn: 0.075, costOut: 0.3, speed: "fastest", reasoning: false },
  "gemini-2.5-pro": { provider: "openrouter", apiId: "google/gemini-2.5-pro", costIn: 1.25, costOut: 5, speed: "medium", reasoning: true },
  "gemini-2.0-flash": { provider: "openrouter", apiId: "google/gemini-2.0-flash-001", costIn: 0.1, costOut: 0.4, speed: "very-fast", reasoning: false },
  
  // ============ DeepSeek via OpenRouter ============
  "deepseek-chat": { provider: "openrouter", apiId: "deepseek/deepseek-chat", costIn: 0.14, costOut: 0.28, speed: "fast", reasoning: false },
  "deepseek-r1": { provider: "openrouter", apiId: "deepseek/deepseek-r1", costIn: 0.55, costOut: 2.19, speed: "medium", reasoning: true },
  
  // ============ xAI Grok via OpenRouter ============
  "grok-code-fast": { provider: "openrouter", apiId: "x-ai/grok-code-fast-1", costIn: 0.3, costOut: 0.6, speed: "fast", reasoning: false },
  "grok-4-fast": { provider: "openrouter", apiId: "x-ai/grok-4-fast", costIn: 2, costOut: 8, speed: "fast", reasoning: true },
  
  // ============ Meta Llama via OpenRouter ============
  "llama-3.3-70b": { provider: "openrouter", apiId: "meta-llama/llama-3.3-70b-instruct", costIn: 0.3, costOut: 0.4, speed: "fast", reasoning: false },
  
  // ============ Qwen via OpenRouter ============
  "qwen-2.5-72b": { provider: "openrouter", apiId: "qwen/qwen-2.5-72b-instruct", costIn: 0.35, costOut: 0.4, speed: "fast", reasoning: false },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export const modelIdValidator = v.union(
  // OpenAI Direct
  v.literal("gpt-4o"),
  v.literal("gpt-4o-mini"),
  v.literal("o1"),
  v.literal("o1-mini"),
  // OpenAI via OpenRouter
  v.literal("gpt-5-mini"),
  v.literal("gpt-oss-120b"),
  // Anthropic Claude 4.5
  v.literal("claude-4.5-sonnet"),
  v.literal("claude-4.5-opus"),
  v.literal("claude-4-sonnet"),
  v.literal("claude-3.5-sonnet"),
  v.literal("claude-3.5-haiku"),
  // Google Gemini 2.5/3.0
  v.literal("gemini-3-pro"),
  v.literal("gemini-2.5-flash"),
  v.literal("gemini-2.5-flash-lite"),
  v.literal("gemini-2.5-pro"),
  v.literal("gemini-2.0-flash"),
  // DeepSeek
  v.literal("deepseek-chat"),
  v.literal("deepseek-r1"),
  // xAI Grok
  v.literal("grok-code-fast"),
  v.literal("grok-4-fast"),
  // Meta Llama
  v.literal("llama-3.3-70b"),
  // Qwen
  v.literal("qwen-2.5-72b")
);

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const MODEL_PRESETS = {
  budget: {
    name: "Budget",
    description: "DeepSeek + Gemini 2.5 Flash Lite (~$0.002/query)",
    icon: "🪶",
    planner: "deepseek-chat" as ModelId,
    summarizer: "gemini-2.5-flash-lite" as ModelId,
    ideaGenerator: "deepseek-chat" as ModelId,
    critic: "gemini-2.5-flash-lite" as ModelId,
    finalWriter: "deepseek-chat" as ModelId,
  },
  speed: {
    name: "Speed",
    description: "Gemini 2.5 Flash + Claude 3.5 Haiku (~$0.005/query)",
    icon: "⚡",
    planner: "gemini-2.5-flash" as ModelId,
    summarizer: "gemini-2.5-flash" as ModelId,
    ideaGenerator: "gemini-2.5-flash" as ModelId,
    critic: "gemini-2.5-flash" as ModelId,
    finalWriter: "claude-3.5-haiku" as ModelId,
  },
  balanced: {
    name: "Balanced",
    description: "Gemini 2.5 + Claude 4.5 Sonnet (~$0.03/query)",
    icon: "⚖️",
    planner: "gemini-2.5-flash" as ModelId,
    summarizer: "gemini-2.5-flash" as ModelId,
    ideaGenerator: "gpt-4o" as ModelId,
    critic: "gemini-2.5-flash" as ModelId,
    finalWriter: "claude-4.5-sonnet" as ModelId,
  },
  deepReasoning: {
    name: "Deep Reasoning",
    description: "Gemini 3 Pro + DeepSeek R1 + Claude 4.5 (~$0.15/query)",
    icon: "🧠",
    planner: "gemini-3-pro" as ModelId,
    summarizer: "gemini-2.5-flash" as ModelId,
    ideaGenerator: "deepseek-r1" as ModelId,
    critic: "gemini-3-pro" as ModelId,
    finalWriter: "claude-4.5-sonnet" as ModelId,
  },
  premium: {
    name: "Premium",
    description: "Claude 4.5 Opus + Gemini 3 Pro (~$0.50/query)",
    icon: "👑",
    planner: "gemini-3-pro" as ModelId,
    summarizer: "claude-4.5-sonnet" as ModelId,
    ideaGenerator: "gpt-5-mini" as ModelId,
    critic: "gemini-3-pro" as ModelId,
    finalWriter: "claude-4.5-opus" as ModelId,
  },
} as const;

export type PresetId = keyof typeof MODEL_PRESETS;

export const presetIdValidator = v.union(
  v.literal("budget"),
  v.literal("speed"),
  v.literal("balanced"),
  v.literal("deepReasoning"),
  v.literal("premium")
);

// ============================================================================
// CHAT SETTINGS
// ============================================================================

export const chatSettingsValidator = v.object({
  // Model selection
  preset: presetIdValidator,
  customModels: v.optional(v.object({
    planner: v.optional(modelIdValidator),
    summarizer: v.optional(modelIdValidator),
    ideaGenerator: v.optional(modelIdValidator),
    critic: v.optional(modelIdValidator),
    finalWriter: v.optional(modelIdValidator),
  })),
  
  // Pipeline settings
  maxFacets: v.number(), // 1-5
  chunksPerFacet: v.number(), // 5-50
  similarityThreshold: v.number(), // 0.5-0.9
  
  // Feature toggles
  enableCritic: v.boolean(),
  enableCreativeMode: v.boolean(),
  enableWebResearch: v.boolean(), // Enable Tavily web search
  enableFactVerification: v.boolean(), // Enable fact checking stage
  autoSaveWebResearch: v.boolean(), // Auto-save web results to embeddings
  
  // Web research settings
  webSearchMaxResults: v.optional(v.number()), // Results per facet (default 3)
  
  // Response style
  responseStyle: v.union(
    v.literal("structured"),    // Bullet points, numbered lists (default)
    v.literal("conversational"), // Flowing paragraphs, essay-style
    v.literal("concise")         // Brief, to-the-point answers
  ),
  
  // Source type filters
  sourceTypes: v.optional(v.array(v.union(
    v.literal("course"),
    v.literal("chapter"),
    v.literal("lesson"),
    v.literal("document"),
    v.literal("note"),
    v.literal("custom")
  ))),
});

export type ResponseStyle = "structured" | "conversational" | "concise";

export type ChatSettings = {
  preset: PresetId;
  customModels?: {
    planner?: ModelId;
    summarizer?: ModelId;
    ideaGenerator?: ModelId;
    critic?: ModelId;
    finalWriter?: ModelId;
  };
  maxFacets: number;
  chunksPerFacet: number;
  similarityThreshold: number;
  enableCritic: boolean;
  enableCreativeMode: boolean;
  enableWebResearch: boolean;
  enableFactVerification: boolean;
  autoSaveWebResearch: boolean;
  webSearchMaxResults?: number;
  responseStyle: ResponseStyle;
  sourceTypes?: Array<"course" | "chapter" | "lesson" | "document" | "note" | "custom">;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  preset: "balanced",
  maxFacets: 3,
  chunksPerFacet: 20,
  similarityThreshold: 0.7,
  enableCritic: true,
  enableCreativeMode: true,
  enableWebResearch: false, // Off by default (costs money)
  enableFactVerification: false, // Off by default
  autoSaveWebResearch: false, // Off by default
  webSearchMaxResults: 3,
  responseStyle: "structured",
};

// ============================================================================
// PLANNER TYPES
// ============================================================================

export const facetValidator = v.object({
  name: v.string(),
  description: v.string(),
  queryHint: v.string(),
  tags: v.array(v.string()),
  priority: v.number(), // 1-5, higher = more important
});

export type Facet = {
  name: string;
  description: string;
  queryHint: string;
  tags: string[];
  priority: number;
};

export const plannerOutputValidator = v.object({
  intent: v.string(),
  questionType: v.union(
    v.literal("technical"),
    v.literal("conceptual"),
    v.literal("workflow"),
    v.literal("creative"),
    v.literal("troubleshooting"),
    v.literal("comparison")
  ),
  facets: v.array(facetValidator),
  searchStrategies: v.array(v.object({
    facetName: v.string(),
    query: v.string(),
    filters: v.object({
      sourceTypes: v.optional(v.array(v.string())),
      categories: v.optional(v.array(v.string())),
    }),
  })),
});

export type PlannerOutput = {
  intent: string;
  questionType: "technical" | "conceptual" | "workflow" | "creative" | "troubleshooting" | "comparison";
  facets: Facet[];
  searchStrategies: Array<{
    facetName: string;
    query: string;
    filters: {
      sourceTypes?: string[];
      categories?: string[];
    };
  }>;
};

// ============================================================================
// RETRIEVER TYPES
// ============================================================================

export const chunkValidator = v.object({
  id: v.string(),
  content: v.string(),
  title: v.optional(v.string()),
  similarity: v.number(),
  sourceType: v.optional(v.string()),
  sourceId: v.optional(v.string()),
  category: v.optional(v.string()),
  metadata: v.optional(v.any()),
});

export type Chunk = {
  id: string;
  content: string;
  title?: string;
  similarity: number;
  sourceType?: string;
  sourceId?: string;
  category?: string;
  metadata?: any;
};

export const retrieverOutputValidator = v.object({
  buckets: v.array(v.object({
    facetName: v.string(),
    chunks: v.array(chunkValidator),
    totalFound: v.number(),
  })),
  totalChunksRetrieved: v.number(),
});

export type RetrieverOutput = {
  buckets: Array<{
    facetName: string;
    chunks: Chunk[];
    totalFound: number;
  }>;
  totalChunksRetrieved: number;
};

// ============================================================================
// SUMMARIZER TYPES
// ============================================================================

export const summaryValidator = v.object({
  facetName: v.string(),
  summary: v.string(),
  keyTechniques: v.array(v.string()),
  sourceChunkIds: v.array(v.string()),
  confidence: v.number(), // 0-1
});

export type Summary = {
  facetName: string;
  summary: string;
  keyTechniques: string[];
  sourceChunkIds: string[];
  confidence: number;
};

export const summarizerOutputValidator = v.object({
  summaries: v.array(summaryValidator),
});

export type SummarizerOutput = {
  summaries: Summary[];
};

// ============================================================================
// IDEA GENERATOR TYPES
// ============================================================================

export const ideaValidator = v.object({
  technique: v.string(),
  description: v.string(),
  confidence: v.union(
    v.literal("supported"),
    v.literal("extrapolated"),
    v.literal("experimental")
  ),
  risk: v.optional(v.string()),
  relatedFacets: v.array(v.string()),
});

export type Idea = {
  technique: string;
  description: string;
  confidence: "supported" | "extrapolated" | "experimental";
  risk?: string;
  relatedFacets: string[];
};

export const ideaGeneratorOutputValidator = v.object({
  ideas: v.array(ideaValidator),
  crossFacetInsights: v.array(v.string()),
});

export type IdeaGeneratorOutput = {
  ideas: Idea[];
  crossFacetInsights: string[];
};

// ============================================================================
// CRITIC TYPES
// ============================================================================

export const criticOutputValidator = v.object({
  approved: v.boolean(),
  overallQuality: v.number(), // 0-1
  issues: v.array(v.object({
    type: v.union(
      v.literal("contradiction"),
      v.literal("gap"),
      v.literal("inaccuracy"),
      v.literal("style")
    ),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    suggestion: v.optional(v.string()),
  })),
  recommendations: v.array(v.string()),
  ideasToInclude: v.array(v.string()), // technique names to include in final
  ideasToExclude: v.array(v.string()), // technique names to exclude
});

export type CriticOutput = {
  approved: boolean;
  overallQuality: number;
  issues: Array<{
    type: "contradiction" | "gap" | "inaccuracy" | "style";
    description: string;
    severity: "low" | "medium" | "high";
    suggestion?: string;
  }>;
  recommendations: string[];
  ideasToInclude: string[];
  ideasToExclude: string[];
};

// ============================================================================
// CITATION TYPES
// ============================================================================

export const citationValidator = v.object({
  id: v.number(),
  title: v.string(),
  sourceType: v.string(),
  sourceId: v.optional(v.string()),
  excerpt: v.optional(v.string()),
});

export type Citation = {
  id: number;
  title: string;
  sourceType: string;
  sourceId?: string;
  excerpt?: string;
};

// ============================================================================
// FINAL OUTPUT TYPES
// ============================================================================

export const masterAIResponseValidator = v.object({
  answer: v.string(),
  citations: v.array(citationValidator),
  facetsUsed: v.array(v.string()),
  pipelineMetadata: v.object({
    plannerModel: v.string(),
    summarizerModel: v.string(),
    ideaGeneratorModel: v.optional(v.string()),
    criticModel: v.optional(v.string()),
    finalWriterModel: v.string(),
    totalChunksProcessed: v.number(),
    totalTokensUsed: v.optional(v.number()),
    processingTimeMs: v.number(),
    webResearchResults: v.optional(v.number()),
  }),
});

export type MasterAIResponse = {
  answer: string;
  citations: Citation[];
  facetsUsed: string[];
  pipelineMetadata: {
    plannerModel: string;
    summarizerModel: string;
    ideaGeneratorModel?: string;
    criticModel?: string;
    finalWriterModel: string;
    totalChunksProcessed: number;
    totalTokensUsed?: number;
    processingTimeMs: number;
    webResearchResults?: number; // Count of web research results
  };
};

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type StreamEvent = 
  | { type: "stage_start"; stage: string; model: string }
  | { type: "stage_complete"; stage: string; durationMs: number }
  | { type: "facets_identified"; facets: string[] }
  | { type: "chunks_retrieved"; facet: string; count: number }
  | { type: "summary_generated"; facet: string }
  | { type: "ideas_generated"; count: number }
  | { type: "web_research_start"; facets: string[] }
  | { type: "web_research_result"; facet: string; count: number }
  | { type: "web_research_complete"; totalResults: number; savedToEmbeddings: boolean }
  | { type: "fact_verification_start"; claimCount: number }
  | { type: "fact_verification_complete"; verifiedCount: number; confidence: number }
  | { type: "critic_review"; approved: boolean; quality: number }
  | { type: "text_delta"; delta: string }
  | { type: "citation_added"; citation: Citation }
  | { type: "complete"; response: MasterAIResponse }
  | { type: "error"; message: string };

// ============================================================================
// CONVERSATION HISTORY
// ============================================================================

export const messageValidator = v.object({
  id: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  citations: v.optional(v.array(citationValidator)),
  timestamp: v.number(),
  settings: v.optional(chatSettingsValidator),
  pipelineMetadata: v.optional(v.object({
    plannerModel: v.string(),
    summarizerModel: v.string(),
    ideaGeneratorModel: v.optional(v.string()),
    criticModel: v.optional(v.string()),
    finalWriterModel: v.string(),
    totalChunksProcessed: v.number(),
    processingTimeMs: v.number(),
  })),
});

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: number;
  settings?: ChatSettings;
  pipelineMetadata?: {
    plannerModel: string;
    summarizerModel: string;
    ideaGeneratorModel?: string;
    criticModel?: string;
    finalWriterModel: string;
    totalChunksProcessed: number;
    processingTimeMs: number;
  };
};
