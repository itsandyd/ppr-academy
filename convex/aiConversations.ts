import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// ============================================================================
// CONVERSATION QUERIES
// ============================================================================

/**
 * Get all conversations for a user, ordered by most recent
 */
export const getUserConversations = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
    agentId: v.optional(v.id("aiAgents")), // Filter by agent
  },
  returns: v.array(
    v.object({
      _id: v.id("aiConversations"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      preview: v.optional(v.string()),
      lastMessageAt: v.number(),
      messageCount: v.number(),
      // Conversation goal anchor - prevents context drift in long conversations
      conversationGoal: v.optional(
        v.object({
          originalIntent: v.string(),
          deliverableType: v.optional(v.string()),
          keyConstraints: v.optional(v.array(v.string())),
          extractedAt: v.number(),
        })
      ),
      preset: v.optional(v.string()),
      responseStyle: v.optional(v.string()),
      settings: v.optional(
        v.object({
          preset: v.string(),
          maxFacets: v.number(),
          chunksPerFacet: v.number(),
          similarityThreshold: v.number(),
          enableCritic: v.boolean(),
          enableCreativeMode: v.boolean(),
          enableWebResearch: v.boolean(),
          enableFactVerification: v.boolean(),
          autoSaveWebResearch: v.boolean(),
          qualityThreshold: v.optional(v.number()),
          maxRetries: v.optional(v.number()),
          webSearchMaxResults: v.optional(v.number()),
          responseStyle: v.string(),
          agenticMode: v.optional(v.boolean()),
        })
      ),
      // Agent info
      agentId: v.optional(v.id("aiAgents")),
      agentSlug: v.optional(v.string()),
      agentName: v.optional(v.string()),
      archived: v.optional(v.boolean()),
      starred: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let conversations;

    // If filtering by agent, use the agent index
    if (args.agentId) {
      conversations = await ctx.db
        .query("aiConversations")
        .withIndex("by_userId_agentId", (q) =>
          q.eq("userId", args.userId).eq("agentId", args.agentId)
        )
        .order("desc")
        .collect();
    } else {
      conversations = await ctx.db
        .query("aiConversations")
        .withIndex("by_userId_lastMessageAt", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    // Filter out archived unless requested
    if (!args.includeArchived) {
      conversations = conversations.filter((c) => !c.archived);
    }

    return conversations.slice(0, limit);
  },
});

/**
 * Get a single conversation by ID
 */
export const getConversation = query({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("aiConversations"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      preview: v.optional(v.string()),
      lastMessageAt: v.number(),
      messageCount: v.number(),
      // Conversation goal anchor - prevents context drift in long conversations
      conversationGoal: v.optional(
        v.object({
          originalIntent: v.string(),
          deliverableType: v.optional(v.string()),
          keyConstraints: v.optional(v.array(v.string())),
          extractedAt: v.number(),
        })
      ),
      preset: v.optional(v.string()),
      responseStyle: v.optional(v.string()),
      settings: v.optional(
        v.object({
          preset: v.string(),
          maxFacets: v.number(),
          chunksPerFacet: v.number(),
          similarityThreshold: v.number(),
          enableCritic: v.boolean(),
          enableCreativeMode: v.boolean(),
          enableWebResearch: v.boolean(),
          enableFactVerification: v.boolean(),
          autoSaveWebResearch: v.boolean(),
          qualityThreshold: v.optional(v.number()),
          maxRetries: v.optional(v.number()),
          webSearchMaxResults: v.optional(v.number()),
          responseStyle: v.string(),
          agenticMode: v.optional(v.boolean()),
        })
      ),
      // Agent info
      agentId: v.optional(v.id("aiAgents")),
      agentSlug: v.optional(v.string()),
      agentName: v.optional(v.string()),
      archived: v.optional(v.boolean()),
      starred: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

/**
 * Get messages for a conversation
 */
export const getConversationMessages = query({
  args: {
    conversationId: v.id("aiConversations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiMessages"),
      _creationTime: v.number(),
      conversationId: v.id("aiConversations"),
      userId: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      citations: v.optional(
        v.array(
          v.object({
            id: v.number(),
            title: v.string(),
            sourceType: v.string(),
            sourceId: v.optional(v.string()),
          })
        )
      ),
      facetsUsed: v.optional(v.array(v.string())),
      pipelineMetadata: v.optional(
        v.object({
          processingTimeMs: v.number(),
          totalChunksProcessed: v.number(),
          plannerModel: v.optional(v.string()),
          summarizerModel: v.optional(v.string()),
          finalWriterModel: v.optional(v.string()),
        })
      ),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Default to 1000 to support long conversations
    // UI can pass a lower limit for performance if needed
    const limit = args.limit || 1000;

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(limit);

    return messages;
  },
});

/**
 * Get recent messages for short-term context (last N messages)
 */
export const getRecentContext = query({
  args: {
    conversationId: v.id("aiConversations"),
    messageCount: v.optional(v.number()), // Default 10
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const count = args.messageCount || 10;

    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(count);

    // Reverse to get chronological order and map to simple format
    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));
  },
});

// ============================================================================
// CONVERSATION MUTATIONS
// ============================================================================

/**
 * Create a new conversation
 */
export const createConversation = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    preset: v.optional(v.string()),
    responseStyle: v.optional(v.string()),
    // Agent support
    agentId: v.optional(v.id("aiAgents")),
    agentSlug: v.optional(v.string()),
    agentName: v.optional(v.string()),
  },
  returns: v.id("aiConversations"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // If agentId provided, fetch agent details
    let agentSlug = args.agentSlug;
    let agentName = args.agentName;

    if (args.agentId && (!agentSlug || !agentName)) {
      const agent = await ctx.db.get(args.agentId);
      if (agent) {
        agentSlug = agent.slug;
        agentName = agent.name;
      }
    }

    const conversationId = await ctx.db.insert("aiConversations", {
      userId: args.userId,
      title: args.title || (agentName ? `Chat with ${agentName}` : "New Conversation"),
      lastMessageAt: now,
      messageCount: 0,
      preset: args.preset,
      responseStyle: args.responseStyle,
      agentId: args.agentId,
      agentSlug,
      agentName,
      archived: false,
      starred: false,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

/**
 * Save a message to a conversation
 */
export const saveMessage = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          id: v.number(),
          title: v.string(),
          sourceType: v.string(),
          sourceId: v.optional(v.string()),
        })
      )
    ),
    facetsUsed: v.optional(v.array(v.string())),
    pipelineMetadata: v.optional(
      v.object({
        processingTimeMs: v.number(),
        totalChunksProcessed: v.number(),
        plannerModel: v.optional(v.string()),
        summarizerModel: v.optional(v.string()),
        finalWriterModel: v.optional(v.string()),
      })
    ),
  },
  returns: v.union(v.id("aiMessages"), v.null()), // Can return null if duplicate
  handler: async (ctx, args) => {
    const now = Date.now();

    // DEDUPLICATION: Check if a similar message was recently added (within 60 seconds)
    // This prevents duplicate saves from both backend auto-save and frontend save
    const recentMessages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(5);

    const oneMinuteAgo = now - 60000;
    for (const msg of recentMessages) {
      // Skip if same role, similar content, and within last minute
      if (
        msg.role === args.role &&
        msg.createdAt > oneMinuteAgo &&
        msg.content.substring(0, 200) === args.content.substring(0, 200)
      ) {
        console.log(`⏭️ Skipping duplicate ${args.role} message (already saved)`);
        return msg._id; // Return existing message ID
      }
    }

    // Save the message
    const messageId = await ctx.db.insert("aiMessages", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: args.role,
      content: args.content,
      citations: args.citations,
      facetsUsed: args.facetsUsed,
      pipelineMetadata: args.pipelineMetadata,
      createdAt: now,
    });

    // Get conversation to update
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      // Generate title from first user message if not set
      let title = conversation.title;
      let preview = conversation.preview;

      if (args.role === "user" && conversation.messageCount === 0) {
        // Auto-generate title from first message
        title = args.content.length > 50 ? args.content.substring(0, 47) + "..." : args.content;
        preview = args.content.substring(0, 100);
      }

      // Update conversation metadata
      await ctx.db.patch(args.conversationId, {
        title,
        preview,
        lastMessageAt: now,
        messageCount: conversation.messageCount + 1,
        updatedAt: now,
      });
    }

    return messageId;
  },
});

/**
 * Update conversation title
 */
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Update conversation settings
 */
export const updateConversationSettings = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    settings: v.object({
      preset: v.string(),
      maxFacets: v.number(),
      chunksPerFacet: v.number(),
      similarityThreshold: v.number(),
      enableCritic: v.boolean(),
      enableCreativeMode: v.boolean(),
      enableWebResearch: v.boolean(),
      enableFactVerification: v.boolean(),
      autoSaveWebResearch: v.boolean(),
      qualityThreshold: v.optional(v.number()),
      maxRetries: v.optional(v.number()),
      webSearchMaxResults: v.optional(v.number()),
      responseStyle: v.string(),
      agenticMode: v.optional(v.boolean()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      settings: args.settings,
      // Also update legacy fields for backward compatibility
      preset: args.settings.preset,
      responseStyle: args.settings.responseStyle,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Toggle conversation starred status
 */
export const toggleStarred = mutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        starred: !conversation.starred,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Archive a conversation
 */
export const archiveConversation = mutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      archived: true,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Unarchive a conversation
 */
export const unarchiveConversation = mutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      archived: false,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Delete a conversation and all its messages
 */
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);

    return null;
  },
});

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

/**
 * Search conversations by title, preview, and message content
 * Returns conversations that match the search query
 */
export const searchConversations = query({
  args: {
    userId: v.string(),
    searchQuery: v.string(),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiConversations"),
      _creationTime: v.number(),
      userId: v.string(),
      title: v.string(),
      preview: v.optional(v.string()),
      lastMessageAt: v.number(),
      messageCount: v.number(),
      conversationGoal: v.optional(
        v.object({
          originalIntent: v.string(),
          deliverableType: v.optional(v.string()),
          keyConstraints: v.optional(v.array(v.string())),
          extractedAt: v.number(),
        })
      ),
      preset: v.optional(v.string()),
      responseStyle: v.optional(v.string()),
      settings: v.optional(
        v.object({
          preset: v.string(),
          maxFacets: v.number(),
          chunksPerFacet: v.number(),
          similarityThreshold: v.number(),
          enableCritic: v.boolean(),
          enableCreativeMode: v.boolean(),
          enableWebResearch: v.boolean(),
          enableFactVerification: v.boolean(),
          autoSaveWebResearch: v.boolean(),
          qualityThreshold: v.optional(v.number()),
          maxRetries: v.optional(v.number()),
          webSearchMaxResults: v.optional(v.number()),
          responseStyle: v.string(),
          agenticMode: v.optional(v.boolean()),
        })
      ),
      agentId: v.optional(v.id("aiAgents")),
      agentSlug: v.optional(v.string()),
      agentName: v.optional(v.string()),
      archived: v.optional(v.boolean()),
      starred: v.optional(v.boolean()),
      createdAt: v.number(),
      updatedAt: v.number(),
      // Search-specific fields
      matchedMessageCount: v.number(), // Number of messages that matched
      matchedMessagePreview: v.optional(v.string()), // Preview of first matching message
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const searchLower = args.searchQuery.toLowerCase().trim();

    if (!searchLower) {
      return [];
    }

    // Get all user's conversations
    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_userId_lastMessageAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter by archived status
    const filteredConversations = args.includeArchived
      ? conversations
      : conversations.filter((c) => !c.archived);

    // Search through each conversation's title, preview, and messages
    const results: Array<{
      conversation: (typeof filteredConversations)[0];
      matchedMessageCount: number;
      matchedMessagePreview?: string;
      relevanceScore: number;
    }> = [];

    for (const conversation of filteredConversations) {
      let matchedMessageCount = 0;
      let matchedMessagePreview: string | undefined;
      let relevanceScore = 0;

      // Check title match (highest weight)
      if (conversation.title.toLowerCase().includes(searchLower)) {
        relevanceScore += 100;
      }

      // Check preview match
      if (conversation.preview?.toLowerCase().includes(searchLower)) {
        relevanceScore += 50;
      }

      // Check conversation goal
      if (conversation.conversationGoal?.originalIntent.toLowerCase().includes(searchLower)) {
        relevanceScore += 75;
      }

      // Search through messages
      const messages = await ctx.db
        .query("aiMessages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .collect();

      for (const message of messages) {
        if (message.content.toLowerCase().includes(searchLower)) {
          matchedMessageCount++;
          relevanceScore += 10; // Each message match adds to relevance

          // Capture the first matching message preview with context
          if (!matchedMessagePreview) {
            const lowerContent = message.content.toLowerCase();
            const matchIndex = lowerContent.indexOf(searchLower);
            const start = Math.max(0, matchIndex - 30);
            const end = Math.min(message.content.length, matchIndex + searchLower.length + 50);
            const preview = message.content.substring(start, end);
            matchedMessagePreview =
              (start > 0 ? "..." : "") + preview + (end < message.content.length ? "..." : "");
          }
        }
      }

      // Only include conversations with matches
      if (relevanceScore > 0) {
        results.push({
          conversation,
          matchedMessageCount,
          matchedMessagePreview,
          relevanceScore,
        });
      }
    }

    // Sort by relevance score (highest first), then by last message time
    results.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.conversation.lastMessageAt - a.conversation.lastMessageAt;
    });

    // Return limited results
    return results.slice(0, limit).map((r) => ({
      ...r.conversation,
      matchedMessageCount: r.matchedMessageCount,
      matchedMessagePreview: r.matchedMessagePreview,
    }));
  },
});

// ============================================================================
// AI TITLE GENERATION
// ============================================================================

/**
 * Generate a better title for a conversation using AI
 * This is an action because it calls external AI APIs
 */

// Type for OpenAI response
interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export const generateConversationTitle = action({
  args: {
    conversationId: v.id("aiConversations"),
    userId: v.string(),
  },
  returns: v.object({
    title: v.string(),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get the conversation using the public query
    const conversation = await ctx.runQuery(api.aiConversations.getConversation, {
      conversationId: args.conversationId,
    });

    if (!conversation || conversation.userId !== args.userId) {
      return { title: "", success: false };
    }

    // Get the first few messages for context using the public query
    const messages = await ctx.runQuery(api.aiConversations.getConversationMessages, {
      conversationId: args.conversationId,
      limit: 10,
    });

    if (messages.length === 0) {
      return { title: "New Conversation", success: false };
    }

    // Build context from messages
    const context = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.substring(0, 200)}`)
      .join("\n");

    // Call OpenAI to generate a title
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a title generator. Generate a concise, descriptive title (3-7 words) for the following conversation. 
The title should capture the main topic or intent of the conversation.
Return ONLY the title, nothing else. No quotes, no explanation.
Examples:
- "Creating Tourist-Style UKG Course"
- "Mixing Vocals with Reverb Techniques"
- "Building Automated Fanbase Growth"
- "Mastering Chain Settings Discussion"`,
          },
          {
            role: "user",
            content: `Generate a title for this conversation:\n\n${context}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate title:", await response.text());
      return { title: "", success: false };
    }

    const data = (await response.json()) as OpenAIResponse;
    const generatedTitle = data.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedTitle) {
      return { title: "", success: false };
    }

    // Update the conversation title using the public mutation
    await ctx.runMutation(api.aiConversations.updateConversationTitle, {
      conversationId: args.conversationId,
      title: generatedTitle,
    });

    return { title: generatedTitle, success: true };
  },
});
