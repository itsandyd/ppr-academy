import { api } from "@/convex/_generated/api";
import { ConvexReactClient } from "convex/react";

// Client-side helpers for using the Convex RAG system
export class ConvexRAG {
  constructor(private convex: ConvexReactClient) {}

  // Add content to RAG system
  async addContent(params: {
    content: string;
    userId: string;
    title?: string;
    category?: string;
    sourceType?: "course" | "chapter" | "lesson" | "document" | "custom";
    sourceId?: string;
    metadata?: any;
  }) {
    return await this.convex.mutation(api.rag.addContent, params);
  }

  // Search for similar content
  async search(params: {
    query: string;
    userId?: string;
    category?: string;
    sourceType?: "course" | "chapter" | "lesson" | "document" | "custom";
    limit?: number;
    threshold?: number;
  }) {
    return await this.convex.action(api.rag.searchSimilar, params);
  }

  // Ask a question using RAG
  async ask(params: {
    question: string;
    userId?: string;
    category?: string;
    sourceType?: "course" | "chapter" | "lesson" | "document" | "custom";
    systemPrompt?: string;
    limit?: number;
  }) {
    return await this.convex.action(api.rag.askQuestion, params);
  }

  // Import course content
  async importCourse(courseId: string, userId: string) {
    return await this.convex.mutation(api.rag.importCourseContent, {
      courseId: courseId as any,
      userId,
    });
  }
}

// Hook for easy usage in React components
export function useConvexRAG(convex: ConvexReactClient) {
  return new ConvexRAG(convex);
}
