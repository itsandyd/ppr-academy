"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Search for similar content using vector similarity (Node.js action)
export const searchSimilar = action({
  args: {
    query: v.string(),
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    )),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("embeddings"),
    content: v.string(),
    title: v.optional(v.string()),
    similarity: v.number(),
    userId: v.string(),
    category: v.optional(v.string()),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    metadata: v.any(),
  })),
  handler: async (ctx, args) => {
    return await performSimilaritySearch(ctx, args);
  },
});

// RAG-powered Q&A (Node.js action)
export const askQuestion = action({
  args: {
    question: v.string(),
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    )),
    systemPrompt: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    answer: v.string(),
    sources: v.array(v.object({
      title: v.optional(v.string()),
      content: v.string(),
      similarity: v.number(),
      sourceType: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    // Search for relevant content using helper function
    const relevantContent = await performSimilaritySearch(ctx, {
      query: args.question,
      userId: args.userId,
      category: args.category,
      sourceType: args.sourceType,
      limit: args.limit || 3,
      threshold: 0.7,
    });

    // Build context from relevant documents
    const context: string = relevantContent
      .map((doc: any) => `${doc.title ? `${doc.title}:\n` : ''}${doc.content}`)
      .join('\n\n---\n\n');

    // Generate answer using OpenAI
    const response: Response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: args.systemPrompt || 
              'You are a helpful assistant. Use the provided context to answer questions accurately. If the context doesn\'t contain relevant information, say so.',
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${args.question}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: any = await response.json();
    
    return {
      answer: data.choices[0].message.content,
      sources: relevantContent.map((doc: any) => ({
        title: doc.title,
        content: doc.content,
        similarity: doc.similarity,
        sourceType: doc.sourceType,
      })),
    };
  },
});

// Helper functions
// text-embedding-3-small produces 1536-dimensional vectors
const EMBEDDING_DIMENSIONS = 1536;

async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small' // Best price/performance embedding model
      })
    });

    const data = await response.json();
    return (data as any)?.data?.[0]?.embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() - 0.5);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper function for similarity search (shared between actions)
async function performSimilaritySearch(ctx: any, args: {
  query: string;
  userId?: string;
  category?: string;
  sourceType?: string;
  limit?: number;
  threshold?: number;
}): Promise<Array<{
  _id: any;
  content: string;
  title?: string;
  similarity: number;
  userId: string;
  category?: string;
  sourceType?: string;
  sourceId?: string;
  metadata: any;
}>> {
  // Generate embedding for the query
  const queryEmbedding: number[] = await generateQueryEmbedding(args.query);

  // Get relevant embeddings from Convex (limited to avoid 16MB read limit)
  // We fetch more than needed to account for similarity filtering
  const fetchLimit = Math.min((args.limit || 5) * 20, 200);
  const embeddings = await ctx.runQuery(internal.rag.getEmbeddings, {
    userId: args.userId,
    category: args.category,
    sourceType: args.sourceType,
    limit: fetchLimit,
  });

  // Calculate similarities and sort
  const results = embeddings
    .map((item: any) => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .filter((item: any) => item.similarity >= (args.threshold || 0.7))
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, args.limit || 5)
    .map(({ embedding, ...item }: any) => ({
      _id: item._id,
      content: item.content,
      title: item.title,
      similarity: item.similarity,
      userId: item.userId,
      category: item.category,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      metadata: item.metadata || {},
    }));

  return results;
}
