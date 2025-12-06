"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// MEMORY RETRIEVAL FOR PIPELINE
// ============================================================================

/**
 * Memory representation for the pipeline
 */
export interface MemoryForPipeline {
  content: string;
  type: "preference" | "fact" | "skill_level" | "context" | "correction";
  importance: number;
}

// NOTE: The actual query `getMemoriesForPipeline` is defined in queries.ts
// This file only contains Node.js actions for memory extraction

/**
 * Format memories as context string for LLM prompts
 */
export function formatMemoriesForPrompt(memories: MemoryForPipeline[]): string {
  if (memories.length === 0) return "";
  
  const grouped: Record<string, string[]> = {};
  
  for (const memory of memories) {
    if (!grouped[memory.type]) {
      grouped[memory.type] = [];
    }
    grouped[memory.type].push(memory.content);
  }
  
  const sections: string[] = [];
  
  if (grouped.preference?.length) {
    sections.push(`User Preferences:\n${grouped.preference.map(p => `• ${p}`).join("\n")}`);
  }
  if (grouped.fact?.length) {
    sections.push(`Known Facts:\n${grouped.fact.map(f => `• ${f}`).join("\n")}`);
  }
  if (grouped.skill_level?.length) {
    sections.push(`Skill Level:\n${grouped.skill_level.map(s => `• ${s}`).join("\n")}`);
  }
  if (grouped.context?.length) {
    sections.push(`Current Context:\n${grouped.context.map(c => `• ${c}`).join("\n")}`);
  }
  if (grouped.correction?.length) {
    sections.push(`Corrections/Clarifications:\n${grouped.correction.map(c => `• ${c}`).join("\n")}`);
  }
  
  return `<user_memory>\n${sections.join("\n\n")}\n</user_memory>`;
}

// ============================================================================
// AUTO MEMORY EXTRACTION
// ============================================================================

/**
 * Extract memories from a conversation using LLM
 * Called after significant conversations to build user knowledge
 */
export const extractMemoriesFromConversation = internalAction({
  args: {
    userId: v.string(),
    conversationId: v.id("aiConversations"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
  },
  returns: v.object({
    extracted: v.number(),
    memories: v.array(v.object({
      content: v.string(),
      type: v.string(),
      importance: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    if (args.messages.length < 4) {
      return { extracted: 0, memories: [] };
    }

    // Query memories directly to avoid type instantiation issues
    // This duplicates the query logic but avoids circular Convex type issues
    const memories = await ctx.runQuery(
      // @ts-ignore - Avoiding circular type instantiation
      internal.masterAI.queries.getUserMemoriesInternal,
      { userId: args.userId, limit: 20 }
    );
    
    const existingMemories = (memories || []) as MemoryForPipeline[];

    const existingContent = existingMemories.map(m => m.content.toLowerCase());

    // Use LLM to extract new memories
    const { callLLM } = await import("./llmClient");
    
    const conversationText = args.messages.map(m => 
      `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
    ).join("\n\n");

    const prompt = `Analyze this conversation and extract any new facts about the user that should be remembered for future conversations. 

Focus on extracting:
1. User preferences (how they like responses, what style they prefer)
2. Facts about them (tools they use, their role, their projects)
3. Skill level indicators (beginner/intermediate/advanced at specific things)
4. Current context (what they're working on, their goals)
5. Corrections they made (things to remember not to do)

EXISTING MEMORIES (don't duplicate):
${existingMemories.map(m => `- ${m.content}`).join("\n")}

CONVERSATION:
${conversationText}

Return a JSON array of new memories to save. Each memory should have:
- content: The specific fact to remember (be concise, 1 sentence max)
- type: One of "preference", "fact", "skill_level", "context", "correction"
- importance: 1-10 score (10 = critical to remember)

Only extract genuinely useful, non-obvious facts. Return empty array if nothing worth remembering.

JSON:`;

    try {
      const response = await callLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return { extracted: 0, memories: [] };
      }

      const newMemories = JSON.parse(jsonMatch[0]) as Array<{
        content: string;
        type: "preference" | "fact" | "skill_level" | "context" | "correction";
        importance: number;
      }>;

      // Filter out duplicates and validate
      const uniqueMemories = newMemories.filter(m => 
        m.content && 
        m.type &&
        m.importance >= 1 &&
        m.importance <= 10 &&
        !existingContent.includes(m.content.toLowerCase())
      );

      // Save to database
      if (uniqueMemories.length > 0) {
        await ctx.runMutation(
          internal.aiMemories.saveExtractedMemories,
          {
            userId: args.userId,
            conversationId: args.conversationId,
            memories: uniqueMemories.map(m => ({
              content: m.content,
              type: m.type,
              importance: m.importance,
              summary: m.content.substring(0, 100),
            })),
          }
        );
      }

      return {
        extracted: uniqueMemories.length,
        memories: uniqueMemories,
      };
    } catch (error) {
      console.error("Memory extraction failed:", error);
      return { extracted: 0, memories: [] };
    }
  },
});

// ============================================================================
// PIPELINE CACHE MANAGEMENT
// ============================================================================

/**
 * Cache key for retrieval results
 */
export const getCacheKey = (
  userId: string,
  facets: string[],
  settings: { maxFacets: number; chunksPerFacet: number }
): string => {
  return `${userId}:${facets.sort().join(",")}:${settings.maxFacets}:${settings.chunksPerFacet}`;
};

// In-memory cache for recent retrievals (per conversation)
const retrievalCache = new Map<string, {
  timestamp: number;
  buckets: any[];
  totalChunks: number;
}>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached retrieval results if available
 */
export function getCachedRetrieval(
  conversationId: string,
  facetNames: string[]
): { buckets: any[]; totalChunks: number } | null {
  const cacheKey = `${conversationId}:${facetNames.sort().join(",")}`;
  const cached = retrievalCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { buckets: cached.buckets, totalChunks: cached.totalChunks };
  }
  
  return null;
}

/**
 * Store retrieval results in cache
 */
export function cacheRetrieval(
  conversationId: string,
  facetNames: string[],
  buckets: any[],
  totalChunks: number
): void {
  const cacheKey = `${conversationId}:${facetNames.sort().join(",")}`;
  retrievalCache.set(cacheKey, {
    timestamp: Date.now(),
    buckets,
    totalChunks,
  });
  
  // Clean old entries periodically
  if (retrievalCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of retrievalCache.entries()) {
      if (now - value.timestamp > CACHE_TTL_MS) {
        retrievalCache.delete(key);
      }
    }
  }
}

/**
 * Clear cache for a conversation
 */
export function clearConversationCache(conversationId: string): void {
  for (const key of retrievalCache.keys()) {
    if (key.startsWith(conversationId)) {
      retrievalCache.delete(key);
    }
  }
}

