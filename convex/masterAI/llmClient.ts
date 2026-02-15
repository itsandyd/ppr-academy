"use node";

import { AVAILABLE_MODELS, type ModelId } from "./types";

// ============================================================================
// LLM CLIENT - OpenAI Direct + OpenRouter for everything else
// ============================================================================

/**
 * Clean JSON response from LLM - strips markdown code blocks and fixes common issues
 */
export function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    // Find the end of the first line (which might have "json" or other language hint)
    const firstLineEnd = cleaned.indexOf("\n");
    if (firstLineEnd !== -1) {
      cleaned = cleaned.substring(firstLineEnd + 1);
    }
    // Remove trailing ```
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }
  
  // Handle case where response starts with ```json on same line as content
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }
  
  return cleaned;
}

/**
 * Safely parse JSON from LLM response with cleaning and error handling
 */
export function safeParseJson<T = unknown>(content: string, fallback?: T): T {
  try {
    const cleaned = cleanJsonResponse(content);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}\nContent: ${content.substring(0, 200)}...`);
  }
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model: ModelId;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  finishReason?: string;
}

/**
 * Unified LLM client that routes to the appropriate provider
 * - OpenAI models go direct to OpenAI
 * - Everything else goes through OpenRouter
 */
export async function callLLM(options: LLMOptions): Promise<LLMResponse> {
  const modelConfig = AVAILABLE_MODELS[options.model];
  const provider = modelConfig.provider === "openai" ? "OpenAI" : "OpenRouter";
  const apiModel = modelConfig.apiId;
  
  let response: LLMResponse;
  if (modelConfig.provider === "openai") {
    response = await callOpenAI(options);
  } else {
    response = await callOpenRouter(options);
  }
  return response;
}

// ============================================================================
// OPENAI PROVIDER (Direct)
// ============================================================================

async function callOpenAI(options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const modelConfig = AVAILABLE_MODELS[options.model];
  const apiModelId = modelConfig.apiId;

  // Check if this is a reasoning model (o1 series)
  const isReasoningModel = options.model.startsWith("o1");

  // Build the request body
  const body: Record<string, unknown> = {
    model: apiModelId,
    messages: options.messages,
    max_tokens: options.maxTokens ?? 2000,
  };

  // Reasoning models (o1) don't support temperature or response_format
  if (!isReasoningModel) {
    body.temperature = options.temperature ?? 0.7;
    if (options.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message?: { content?: string }; finish_reason?: string }>;
    model: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
  
  return {
    content: data.choices[0]?.message?.content || "",
    model: data.model,
    tokensUsed: data.usage ? {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    } : undefined,
    finishReason: data.choices[0]?.finish_reason,
  };
}

// ============================================================================
// OPENROUTER PROVIDER (Claude, DeepSeek, Gemini, Llama, etc.)
// ============================================================================

async function callOpenRouter(options: LLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Fallback to OpenAI if no OpenRouter key
    console.warn("OPENROUTER_API_KEY not configured, falling back to OpenAI");
    return callOpenAIFallback(options);
  }

  const modelConfig = AVAILABLE_MODELS[options.model];
  const apiModelId = modelConfig.apiId;

  // Check if this is a reasoning model (deepseek-r1, o1, etc.)
  const isReasoningModel = modelConfig.reasoning;

  // Build the request body (OpenAI-compatible format)
  const body: Record<string, unknown> = {
    model: apiModelId,
    messages: options.messages,
    max_tokens: options.maxTokens ?? 2000,
  };

  // Most models support temperature, but some reasoning models may not
  if (!isReasoningModel || !apiModelId.includes("deepseek-r1")) {
    body.temperature = options.temperature ?? 0.7;
  }

  // JSON mode support varies by model
  if (options.responseFormat === "json") {
    // OpenRouter supports response_format for compatible models
    body.response_format = { type: "json_object" };
  }

  // For Claude 4.5 models, prefer providers with higher output limits (64K)
  // Anthropic and Google Vertex support 64K, Amazon Bedrock only supports 32K
  if (apiModelId.includes("claude") && apiModelId.includes("4.5")) {
    body.provider = {
      order: ["Anthropic", "Google Vertex"], // Prefer providers with 64K output limit
      allow_fallbacks: true, // Fall back to Bedrock if needed
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.SITE_URL || "https://ppr.academy",
      "X-Title": "PPR Academy AI Assistant",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message?: { content?: string }; finish_reason?: string }>;
    model: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
  
  return {
    content: data.choices[0]?.message?.content || "",
    model: data.model,
    tokensUsed: data.usage ? {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    } : undefined,
    finishReason: data.choices[0]?.finish_reason,
  };
}

/**
 * Fallback to GPT-4o-mini if OpenRouter is not configured
 */
async function callOpenAIFallback(options: LLMOptions): Promise<LLMResponse> {
  return callOpenAI({
    ...options,
    model: "gpt-4o-mini",
  });
}

// ============================================================================
// STREAMING SUPPORT (for Final Writer)
// ============================================================================

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (response: LLMResponse) => void;
  onError: (error: Error) => void;
}

/**
 * Stream LLM response - used for the Final Writer stage
 */
export async function streamLLM(
  options: LLMOptions,
  callbacks: StreamCallbacks
): Promise<void> {
  const modelConfig = AVAILABLE_MODELS[options.model];
  
  if (modelConfig.provider === "openai") {
    return streamOpenAI(options, callbacks);
  } else {
    return streamOpenRouter(options, callbacks);
  }
}

async function streamOpenAI(options: LLMOptions, callbacks: StreamCallbacks): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    callbacks.onError(new Error("OPENAI_API_KEY not configured"));
    return;
  }

  const modelConfig = AVAILABLE_MODELS[options.model];
  const apiModelId = modelConfig.apiId;

  // Reasoning models (o1) don't support streaming
  const isReasoningModel = options.model.startsWith("o1");
  if (isReasoningModel) {
    try {
      const response = await callOpenAI(options);
      callbacks.onToken(response.content);
      callbacks.onComplete(response);
    } catch (error) {
      callbacks.onError(error as Error);
    }
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiModelId,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      callbacks.onError(new Error(`OpenAI API error: ${error}`));
      return;
    }

    await processStream(response, options.model, callbacks);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

async function streamOpenRouter(options: LLMOptions, callbacks: StreamCallbacks): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Fall back to OpenAI streaming
    console.warn("OPENROUTER_API_KEY not configured, falling back to OpenAI");
    return streamOpenAI({ ...options, model: "gpt-4o-mini" }, callbacks);
  }

  const modelConfig = AVAILABLE_MODELS[options.model];
  const apiModelId = modelConfig.apiId;

  // Some reasoning models don't support streaming well
  const isReasoningModel = modelConfig.reasoning && apiModelId.includes("r1");
  if (isReasoningModel) {
    try {
      const response = await callOpenRouter(options);
      callbacks.onToken(response.content);
      callbacks.onComplete(response);
    } catch (error) {
      callbacks.onError(error as Error);
    }
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://ppr.academy",
        "X-Title": "PPR Academy AI Assistant",
      },
      body: JSON.stringify({
        model: apiModelId,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      callbacks.onError(new Error(`OpenRouter API error: ${error}`));
      return;
    }

    await processStream(response, options.model, callbacks);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

/**
 * Process SSE stream from OpenAI-compatible API
 */
async function processStream(
  response: Response,
  model: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(line => line.startsWith("data: "));

    for (const line of lines) {
      const data = line.replace("data: ", "");
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          callbacks.onToken(delta);
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  callbacks.onComplete({
    content: fullContent,
    model,
  });
}
