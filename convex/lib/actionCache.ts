import { ActionCache } from "@convex-dev/action-cache";
import { components } from "../_generated/api";

/**
 * Action cache instances for expensive operations.
 * Caches results to reduce API calls and costs.
 */

// 1 hour in milliseconds
const ONE_HOUR = 1000 * 60 * 60;
// 24 hours in milliseconds
const ONE_DAY = ONE_HOUR * 24;

/**
 * Cache for LLM responses.
 * Caches similar prompts to reduce OpenAI/OpenRouter API costs.
 *
 * Note: You need to create the actual cached action wrapper when integrating.
 * This is a factory function to create caches for specific actions.
 */
export function createLLMCache(action: any) {
  return new ActionCache(components.actionCache, {
    action,
    name: "llmResponsesV1",
    ttl: ONE_HOUR,
  });
}

/**
 * Cache for web search results.
 * Caches Tavily search results to reduce API calls.
 */
export function createWebSearchCache(action: any) {
  return new ActionCache(components.actionCache, {
    action,
    name: "webSearchV1",
    ttl: ONE_DAY,
  });
}

/**
 * Cache for course outline generation.
 * Caches AI-generated course structures.
 */
export function createCourseOutlineCache(action: any) {
  return new ActionCache(components.actionCache, {
    action,
    name: "courseOutlinesV1",
    ttl: ONE_DAY,
  });
}

/**
 * Cache for email template generation.
 * Caches AI-generated email templates.
 */
export function createEmailTemplateCache(action: any) {
  return new ActionCache(components.actionCache, {
    action,
    name: "emailTemplatesV1",
    ttl: ONE_HOUR,
  });
}

// Export cache configuration for reference
export const CACHE_CONFIG = {
  llm: { name: "llmResponsesV1", ttl: ONE_HOUR },
  webSearch: { name: "webSearchV1", ttl: ONE_DAY },
  courseOutline: { name: "courseOutlinesV1", ttl: ONE_DAY },
  emailTemplate: { name: "emailTemplatesV1", ttl: ONE_HOUR },
};
