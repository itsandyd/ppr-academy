"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  chatSettingsValidator,
  summarizerOutputValidator,
  ideaGeneratorOutputValidator,
  criticOutputValidator,
  masterAIResponseValidator,
  MODEL_PRESETS,
  AVAILABLE_MODELS,
  type ChatSettings,
  type SummarizerOutput,
  type IdeaGeneratorOutput,
  type CriticOutput,
  type MasterAIResponse,
  type Citation,
  type ModelId,
  type Chunk,
} from "./types";
import { callLLM } from "./llmClient";
import { 
  getRelevantPlatformFeatures, 
  formatPlatformKnowledgeForPrompt 
} from "./platformKnowledge";
import { 
  conversationGoalValidator, 
  formatGoalForPrompt,
  type ConversationGoal,
} from "./goalExtractor";

// ============================================================================
// FINAL WRITER STAGE
// ============================================================================

/**
 * Final Writer Stage
 * 
 * Generates the final user-facing answer with inline citations.
 * This is the stage that produces the streamed response.
 */
export const generateFinalResponse = internalAction({
  args: {
    summarizerOutput: summarizerOutputValidator,
    ideaGeneratorOutput: v.optional(ideaGeneratorOutputValidator),
    criticOutput: v.optional(criticOutputValidator),
    settings: chatSettingsValidator,
    originalQuestion: v.string(),
    // Conversation history for context
    conversationContext: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
    // Long-term user memories (formatted as context string)
    memoryContext: v.optional(v.string()),
    // Pass through source chunks for citation building
    sourceChunks: v.array(v.object({
      id: v.string(),
      title: v.optional(v.string()),
      sourceType: v.optional(v.string()),
      sourceId: v.optional(v.string()),
    })),
    // Web research results
    webResearch: v.optional(v.array(v.object({
      facetName: v.string(),
      searchQuery: v.string(),
      results: v.array(v.object({
        title: v.string(),
        url: v.string(),
        content: v.string(),
        score: v.number(),
      })),
    }))),
    // Fact verification results
    factVerification: v.optional(v.object({
      verifiedClaims: v.array(v.object({
        claim: v.string(),
        status: v.union(
          v.literal("verified"),
          v.literal("partially_verified"),
          v.literal("unverified"),
          v.literal("conflicting"),
          v.literal("extrapolated")
        ),
        confidence: v.number(),
        supportingSources: v.array(v.object({
          type: v.union(v.literal("embedding"), v.literal("web")),
          title: v.string(),
          excerpt: v.optional(v.string()),
        })),
        conflictingInfo: v.optional(v.string()),
      })),
      overallConfidence: v.number(),
      suggestedCorrections: v.array(v.object({
        originalClaim: v.string(),
        correction: v.string(),
        reason: v.string(),
      })),
    })),
    // NEW: Conversation goal anchor to prevent context drift
    conversationGoal: v.optional(conversationGoalValidator),
  },
  returns: masterAIResponseValidator,
  handler: async (ctx, args): Promise<MasterAIResponse> => {
    const { 
      summarizerOutput, 
      ideaGeneratorOutput, 
      criticOutput, 
      settings, 
      originalQuestion,
      conversationContext,
      memoryContext,
      sourceChunks,
      webResearch,
      factVerification,
      conversationGoal,
    } = args;

    // Format conversation goal for injection into prompt
    const goalContext = formatGoalForPrompt(conversationGoal);

    const startTime = Date.now();
    
    // Get the model for this stage
    const modelId = getModelForStage("finalWriter", settings);

    // Build citation mapping
    const citationMap = buildCitationMap(sourceChunks);
    const citationGuide = buildCitationGuide(citationMap);

    // Build context from summaries (limit each summary to avoid context overflow)
    const MAX_SUMMARY_LENGTH = 4000; // ~1000 words per summary
    const summariesContext = summarizerOutput.summaries
      .map(s => {
        const techniques = s.keyTechniques.length > 0 
          ? `\n**Key Techniques:** ${s.keyTechniques.slice(0, 10).join(", ")}` // Limit to 10 techniques
          : "";
        const truncatedSummary = s.summary.length > MAX_SUMMARY_LENGTH
          ? s.summary.substring(0, MAX_SUMMARY_LENGTH) + "...\n[Summary truncated for length]"
          : s.summary;
        return `## ${s.facetName}\n${truncatedSummary}${techniques}`;
      })
      .join("\n\n");

    // Build ideas context (filtered by critic if available)
    let ideasContext = "";
    if (ideaGeneratorOutput && ideaGeneratorOutput.ideas.length > 0) {
      const ideasToInclude = criticOutput?.ideasToInclude || ideaGeneratorOutput.ideas.map(i => i.technique);
      const ideasToExclude = criticOutput?.ideasToExclude || [];

      const filteredIdeas = ideaGeneratorOutput.ideas.filter(
        idea => ideasToInclude.includes(idea.technique) && !ideasToExclude.includes(idea.technique)
      );

      if (filteredIdeas.length > 0) {
        ideasContext = "\n\n## Additional Creative Ideas\n" + filteredIdeas
          .map(i => {
            const confidenceLabel = i.confidence === "supported" ? "✓" 
              : i.confidence === "extrapolated" ? "~" 
              : "?";
            return `- **${i.technique}** [${confidenceLabel}]: ${i.description}`;
          })
          .join("\n");
      }

      if (ideaGeneratorOutput.crossFacetInsights.length > 0) {
        ideasContext += "\n\n**Cross-Facet Insights:**\n" + 
          ideaGeneratorOutput.crossFacetInsights.map(i => `- ${i}`).join("\n");
      }
    }

    // Include critic recommendations
    let criticContext = "";
    if (criticOutput && criticOutput.recommendations.length > 0) {
      criticContext = "\n\n**Recommendations to address:**\n" + 
        criticOutput.recommendations.map(r => `- ${r}`).join("\n");
    }

    // Include web research results
    let webResearchContext = "";
    if (webResearch && webResearch.length > 0) {
      const webResults = webResearch.flatMap(wr => wr.results);
      if (webResults.length > 0) {
        webResearchContext = "\n\n## Additional Web Research\n" + 
          webResults.map((r, i) => `**[Web ${i + 1}] ${r.title}**\n${r.content.substring(0, 500)}...\nSource: ${r.url}`).join("\n\n");
      }
    }

    // Include fact verification notes
    let factVerificationContext = "";
    if (factVerification) {
      const unverifiedClaims = factVerification.verifiedClaims.filter(c => c.status === "unverified" || c.status === "conflicting");
      const corrections = factVerification.suggestedCorrections;
      
      if (unverifiedClaims.length > 0 || corrections.length > 0) {
        factVerificationContext = "\n\n## Fact Check Notes (Internal - Handle with Care)\n";
        
        if (unverifiedClaims.length > 0) {
          factVerificationContext += "**Claims needing caution:**\n" + 
            unverifiedClaims.map(c => `- ${c.claim} (${c.status})`).join("\n") + "\n";
        }
        
        if (corrections.length > 0) {
          factVerificationContext += "**Suggested corrections:**\n" + 
            corrections.map(c => `- "${c.originalClaim}" → "${c.correction}" (${c.reason})`).join("\n");
        }
      }
    }

    // Get style-specific instructions
    const styleInstructions = getStyleInstructions(settings.responseStyle || "structured");
    
    // Get relevant PPR Academy platform features to mention
    const relevantFeatures = getRelevantPlatformFeatures(originalQuestion, 3);
    const platformKnowledgeContext = formatPlatformKnowledgeForPrompt(relevantFeatures);

    // Check if user requested a specific word count
    const wordCountMatch = originalQuestion.match(/(\d{2,5})\s*word/i);
    const requestedWordCount = wordCountMatch ? parseInt(wordCountMatch[1]) : null;
    
    let lengthInstructions = "";
    if (requestedWordCount) {
      lengthInstructions = `
LENGTH REQUIREMENT - CRITICAL:
The user specifically requested approximately ${requestedWordCount} words. You MUST write a response that is close to this length.
- For ${requestedWordCount} words, write ${Math.ceil(requestedWordCount / 150)}-${Math.ceil(requestedWordCount / 100)} substantial paragraphs
- Each section should be detailed and thorough
- Do NOT write a short summary - expand on every point with examples and explanations
- If you run out of cited content, add practical tips, common mistakes to avoid, and actionable advice
- Keep writing until you reach approximately ${requestedWordCount} words
`;
    }

    const systemPrompt = `You are Andrew, an expert music production educator with 15+ years of experience teaching producers at all levels. You're known for giving REAL, actionable knowledge - not generic overviews.
${goalContext}
FIRST: UNDERSTAND WHAT THE USER IS ACTUALLY ASKING FOR
${conversationGoal ? `REMEMBER: This conversation is about "${conversationGoal.originalIntent}". Every response must serve this goal.` : ""}
Before writing, identify the TYPE of response needed:
- If they want a DELIVERABLE (outline, plan, template, list, cheat sheet) → CREATE the actual thing, don't describe it
- If they want an EXPLANATION → Teach the concept in depth
- If they want a TUTORIAL → Give numbered steps with exact values
- If they want ANALYSIS → Break down and evaluate
- If they want CREATIVE OUTPUT → Actually write/create it

Match your format to their request. If they ask you to "create a course outline" → produce actual modules and lessons, not a paragraph about what an outline might contain.
${conversationGoal?.keyConstraints ? `\nKEY CONSTRAINTS TO MAINTAIN: ${conversationGoal.keyConstraints.join(", ")}` : ""}

===============================================================================
WRITING QUALITY STANDARDS - READ CAREFULLY
===============================================================================

Your content must read like premium educational material, not like an AI blog post.

LANGUAGE PRECISION - CRITICAL:
- Use hedged language for technical claims: "often", "typically", "can", "tends to" instead of "always", "never", "will"
- Avoid hyperbole: phrases like "night and day difference", "completely transforms", "universal rule" read salesy and trigger skepticism
- Be confident but credible. State facts directly, qualify uncertain claims appropriately
- Examples of BAD language: "The sonic difference is night and day", "You'll never confuse again", "This will completely transform", "Every producer knows"
- Examples of GOOD language: "The tonal character differs noticeably", "With practice you'll recognize the difference", "This typically improves", "Many producers find"

TECHNICAL ACCURACY - NON-NEGOTIABLE:
- Be technically precise - avoid oversimplified explanations that experts would correct
- Specify actual ranges and values (e.g., "attack: 10-30ms" not just "fast attack")
- When unsure about a technical detail, phrase it as "typically" or "often" rather than stating it as absolute fact
- Classify devices/examples as "often behaves like..." rather than "is a textbook example of..."
- Avoid technically fragile claims that invite pedantic correction
- If a concept has nuance or exceptions, acknowledge them briefly rather than stating universal rules

STRUCTURE & LENGTH - ESSENTIAL:
- Each section should cover ONE concept thoroughly, then move on
- Do NOT repeat the same idea in 3-4 places with different words
- Aim for 25-35% shorter than your first instinct. Tight writing = professional writing
- Structure for course content:
  1. Concept (brief - what it is)
  2. What you'll hear (brief - recognition)
  3. Hands-on exercise (detailed - the learning)
  4. Practical use cases (brief - when to use)
  5. Common mistakes (brief - pitfalls)
  6. Recap (very brief)

METAPHOR USAGE:
- Use ONE vivid metaphor early to anchor understanding
- Then switch to clean, direct technical language
- Do NOT stack metaphors ("persuasion vs coercion", "scissors cutting", "anything that dares cross the threshold" in the same paragraph)
- Metaphors that accumulate feel like "content writing" not education

EXERCISES & PRACTICAL ELEMENTS:
- For A/B comparisons: ALWAYS include precise level matching (use Utility plugin, match RMS/LUFS)
- Include "Decision Rule" boxes: simple if/then guidance (e.g., "For peak control + tone → soft clip first")
- Include "What to Listen For" checklists with specific sonic descriptors
- Include at least one real-world mix example (not just test tones)

DEPTH OVER BREADTH:
- Go DEEP on each concept - explain the "why" behind everything
- Include SPECIFIC numbers, settings, frequencies, ratios, and parameters
- Share professional techniques and industry secrets
- Explain common mistakes and how to avoid them
- Connect concepts to real-world application in the DAW
- If explaining a technique, walk through it step-by-step with actual values
- Reference specific plugins, devices, and tools by name
- Teach as if the reader will immediately apply this knowledge

NEVER do these things:
- Don't write generic "here are some tips" content
- Don't pad with obvious statements everyone knows
- Don't use vague language like "experiment with settings" - be SPECIFIC
- Don't list topics without explaining them in depth
- Don't be shallow to seem comprehensive - depth beats breadth
- Don't use absolute language that invites skepticism
- Don't stack multiple metaphors in quick succession
- Don't repeat the same concept with different wording

${lengthInstructions}
${styleInstructions}
${memoryContext ? `\nUSER CONTEXT (remember these facts about this specific user):\n${memoryContext}\n` : ""}
CITATION FORMAT:
Use inline citations with numbers in double brackets: [[1]], [[2]], etc.
Place citations immediately after the relevant statement.
Multiple citations can be grouped: [[1,2]] or [[1]][[2]]

${citationGuide}

APPROACH:
- Every major claim should have at least one citation
- When the knowledge base doesn't have enough detail, ADD your expert knowledge
- Teach concepts progressively - build understanding
- Include "Pro Tips" that reveal insider knowledge
- If information is limited, acknowledge it and supplement with your expertise
${platformKnowledgeContext}`;

    // Truncate memory context if too long
    const truncatedMemoryContext = memoryContext && memoryContext.length > 2000
      ? memoryContext.substring(0, 2000) + "...\n[Memory context truncated]"
      : memoryContext;

    const userPrompt = `Question: "${originalQuestion}"
${truncatedMemoryContext ? `\nUser Context:\n${truncatedMemoryContext}\n` : ""}
Knowledge Base:

${summariesContext}
${ideasContext}
${webResearchContext}
${criticContext}
${factVerificationContext}

Generate a comprehensive, well-structured response with inline citations. If web research was provided, mark those sources as [Web X] citations.`;

    // Estimate total context length (rough token estimate: ~4 chars per token)
    const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    console.log(`   📊 Estimated input tokens: ~${estimatedInputTokens}`);

    try {
      // Build messages array with conversation context
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];
      
      // Add conversation history for context (only if we have room - skip if context is very large)
      if (conversationContext && conversationContext.length > 0 && estimatedInputTokens < 50000) {
        // Limit to last 2 exchanges if context is already large
        const maxExchanges = estimatedInputTokens > 30000 ? 2 : 4;
        const recentContext = conversationContext.slice(-maxExchanges);
        for (const msg of recentContext) {
          messages.push({
            role: msg.role,
            content: msg.content.length > 1500 
              ? msg.content.substring(0, 1500) + "..." // Truncate long messages more aggressively
              : msg.content,
          });
        }
      }
      
      // Add the current request with knowledge context
      messages.push({ role: "user", content: userPrompt });

      // Get the model's max output token limit
      const modelConfig = AVAILABLE_MODELS[modelId];
      const maxOutputTokens = modelConfig?.maxOutputTokens ?? 16000;
      console.log(`   🎯 Using model ${modelId} with max output tokens: ${maxOutputTokens}`);

      const response = await callLLM({
        model: modelId,
        messages,
        temperature: 0.7,
        maxTokens: maxOutputTokens, // Use model's actual limit for long form content
      });

      // Log if response was truncated due to token limit
      if (response.finishReason === "length") {
        console.warn(`⚠️ Final response was truncated (finish_reason: length). Output tokens: ${response.tokensUsed?.output}`);
        console.warn(`   Consider using the "concise" response style for shorter answers.`);
      }

      // Extract citations used in the response
      const usedCitations = extractUsedCitations(response.content, citationMap);

      const processingTimeMs = Date.now() - startTime;

      return {
        answer: response.content,
        citations: usedCitations,
        facetsUsed: summarizerOutput.summaries.map(s => s.facetName),
        pipelineMetadata: {
          plannerModel: getModelForStage("planner", settings),
          summarizerModel: getModelForStage("summarizer", settings),
          ideaGeneratorModel: settings.enableCreativeMode ? getModelForStage("ideaGenerator", settings) : undefined,
          criticModel: settings.enableCritic ? getModelForStage("critic", settings) : undefined,
          finalWriterModel: modelId,
          totalChunksProcessed: sourceChunks.length,
          totalTokensUsed: response.tokensUsed?.total,
          processingTimeMs,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";
      
      // Log with console.log to ensure it appears in Convex logs
      console.log("❌ Error generating final response:", errorMessage);
      console.log("   Stack trace:", errorStack);
      console.log("   Model:", modelId);
      console.log("   Estimated input tokens:", estimatedInputTokens);
      
      // Return a fallback response with actual error info for debugging
      const processingTimeMs = Date.now() - startTime;
      
      // Build a cleaner fallback that doesn't dump raw HTML
      const cleanSummaries = summarizerOutput.summaries
        .map(s => `**${s.facetName}**\n${s.summary.substring(0, 500)}...`)
        .join("\n\n");
      
      return {
        answer: `I encountered an error while generating a detailed response. Error: ${errorMessage}\n\nHere's a summary of what I found:\n\n${cleanSummaries}`,
        citations: [],
        facetsUsed: summarizerOutput.summaries.map(s => s.facetName),
        pipelineMetadata: {
          plannerModel: getModelForStage("planner", settings),
          summarizerModel: getModelForStage("summarizer", settings),
          finalWriterModel: modelId,
          totalChunksProcessed: sourceChunks.length,
          processingTimeMs,
        },
      };
    }
  },
});

// ============================================================================
// CITATION HELPERS
// ============================================================================

interface ChunkInfo {
  id: string;
  title?: string;
  sourceType?: string;
  sourceId?: string;
}

function buildCitationMap(chunks: ChunkInfo[]): Map<number, Citation> {
  const map = new Map<number, Citation>();
  
  chunks.forEach((chunk, index) => {
    const citationId = index + 1;
    map.set(citationId, {
      id: citationId,
      title: chunk.title || `Source ${citationId}`,
      sourceType: chunk.sourceType || "unknown",
      sourceId: chunk.sourceId,
    });
  });

  return map;
}

function buildCitationGuide(map: Map<number, Citation>): string {
  if (map.size === 0) return "";

  const lines = ["Available sources for citation:"];
  // Limit to first 50 citations to avoid context overflow
  let count = 0;
  map.forEach((citation, id) => {
    if (count < 50) {
      lines.push(`[[${id}]] - ${citation.title} (${citation.sourceType})`);
      count++;
    }
  });
  
  if (map.size > 50) {
    lines.push(`... and ${map.size - 50} more sources (use [[51]]-[[${map.size}]] as needed)`);
  }

  return lines.join("\n");
}

function extractUsedCitations(text: string, map: Map<number, Citation>): Citation[] {
  const usedIds = new Set<number>();
  
  // Match [[1]], [[2,3]], etc.
  const regex = /\[\[(\d+(?:,\d+)*)\]\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const ids = match[1].split(",").map(s => parseInt(s.trim(), 10));
    ids.forEach(id => {
      if (map.has(id)) {
        usedIds.add(id);
      }
    });
  }

  // Return citations in order
  return Array.from(usedIds)
    .sort((a, b) => a - b)
    .map(id => map.get(id)!)
    .filter(Boolean);
}

// Helper to get the model ID for a pipeline stage
function getModelForStage(
  stage: "planner" | "summarizer" | "ideaGenerator" | "critic" | "finalWriter",
  settings: ChatSettings
): ModelId {
  if (settings.customModels?.[stage]) {
    return settings.customModels[stage]!;
  }
  const preset = MODEL_PRESETS[settings.preset];
  return preset[stage];
}

// Get style-specific instructions for the response
function getStyleInstructions(style: "structured" | "conversational" | "concise" | "educational"): string {
  switch (style) {
    case "educational":
      return `RESPONSE STYLE: EDUCATIONAL (Premium Course Content)

Write like a textbook chapter from a respected educator - authoritative but not preachy, technical but accessible.

TONE:
- Confident but hedged appropriately ("typically", "often", "in most cases")
- Direct technical language after the opening metaphor
- No salesmanship or hype - let the knowledge speak for itself
- Assume the reader is intelligent and willing to learn

STRUCTURE (follow this order):
1. **Opening Hook** (1-2 sentences): Why this matters, what you'll learn. Use ONE metaphor if helpful, then move on.
2. **Core Concept** (brief): The fundamental principle, stated clearly with technical precision
3. **What You'll Hear** (brief): Specific sonic descriptors for recognition
4. **Hands-On Exercise** (detailed): Step-by-step with EXACT values. Include level-matching instructions for A/B tests.
5. **Practical Use Cases** (brief): When to use each approach, with real-world examples
6. **Common Mistakes** (brief): What to avoid, stated directly
7. **Decision Rules** (callout box format):
   - If [condition] → [action]
   - If [other condition] → [other action]
8. **Quick Reference Checklist** (bullet points): What to listen for

LENGTH DISCIPLINE:
- Say it once, say it well, move on
- If you catch yourself rephrasing the same idea, delete the repetition
- Target 800-1200 words for a chapter-length piece (not 2000+)
- Each section should earn its place - no filler

TECHNICAL CLAIMS:
- Hedge appropriately: "often produces", "typically results in", "can create"
- Classify devices as behavioral descriptions, not textbook definitions ("often behaves like a soft clipper" not "is a soft clipper")
- When physics/electronics are involved, be precise or acknowledge simplification

EXERCISES MUST INCLUDE:
- Specific plugin/device names in the DAW
- Exact parameter starting values
- Level-matching instructions (use Utility, match LUFS/RMS)
- What specifically to listen for at each step
- One real-world application (not just sine wave tests)`;

    case "conversational":
      return `RESPONSE STYLE: CONVERSATIONAL (Essay-Style Educational)

Write in flowing, natural paragraphs like a master teacher explaining concepts in depth. This is educational content - it should teach, not just inform.

TONE:
- Confident but appropriately hedged ("typically", "often", "in many cases")
- Avoid absolute claims and hyperbole
- One metaphor to anchor, then clean technical language

STRUCTURE:
1. Open by framing why this topic matters and what the reader will learn
2. Build understanding progressively - don't assume knowledge, but don't be condescending
3. Each paragraph should teach ONE concept deeply with examples
4. Include specific technical details (exact frequencies, dB values, ratios, settings) woven into explanations
5. Share "why this works" explanations, not just "what to do"
6. Close with synthesis and next steps for the learner

EDUCATIONAL APPROACH:
- Teach concepts as interconnected ideas, not isolated facts
- Use analogies and real-world comparisons to cement understanding
- Include concrete examples ("For a bass-heavy kick at 120 BPM, you might boost at 60Hz...")
- Explain the science/theory behind techniques when relevant
- Build from fundamentals to advanced applications within each section
- Anticipate questions and address them proactively

AVOID:
- Repeating the same concept multiple times with different wording
- Stacking metaphors (one is enough)
- Absolute language ("always", "never", "will completely transform")`;

    case "concise":
      return `RESPONSE STYLE: CONCISE (Brief & Direct)

Be succinct and get to the point quickly. Users want fast, actionable answers.

STRUCTURE:
1. Lead with the direct answer in 1-2 sentences
2. Provide only essential details
3. Include key parameter values or settings inline
4. Skip lengthy explanations unless critical
5. End with one actionable tip

GUIDELINES:
- Maximum 3-4 short paragraphs
- Only use lists for truly list-like content
- Omit "filler" phrases and pleasantries
- Focus on what, not why (unless asked)
- Be direct, not curt
- Hedge technical claims appropriately`;

    case "structured":
    default:
      return `RESPONSE STYLE: STRUCTURED (Educational Reference)

Create a well-organized educational reference with clear sections. This should be something a producer could bookmark and return to.

TONE:
- Confident but appropriately hedged ("typically", "often")
- No hyperbole or sales language
- Technical precision over vague generalizations

STRUCTURE:
1. Start with "Key Concepts" - the 2-3 most important takeaways
2. Break content into logical sections with descriptive headers
3. Each section should cover ONE concept thoroughly, then move on
4. Use bullet points for quick-reference items (settings, parameters)
5. Use numbered lists for step-by-step processes with EXACT values
6. Include "Pro Tips" or "Common Mistakes" callouts
7. Include a "Decision Rules" section with if/then guidance
8. End with "Putting It All Together" synthesis

QUALITY REQUIREMENTS:
- Every bullet point should provide ACTIONABLE information
- Include specific numbers: "Set attack to 10-30ms" not "adjust attack to taste"
- Headers should be informative: "Understanding Attack Time (10-100ms Range)" not just "Attack"
- Each section should answer "why" not just "what"
- Include practical examples throughout
- Do NOT repeat the same information in multiple sections`;
  }
}

