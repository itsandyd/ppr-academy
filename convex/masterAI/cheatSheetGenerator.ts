// @ts-nocheck - Convex type instantiation is too deep
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { callLLM, safeParseJson } from "./llmClient";
import { type ModelId } from "./types";

// Workaround for TypeScript deep instantiation issue with internal references
// eslint-disable-next-line @typescript-eslint/no-var-requires
const internalRef = require("../_generated/api").internal;

// =============================================================================
// TYPES
// =============================================================================

export type SectionType =
  | "key_takeaways"
  | "quick_reference"
  | "step_by_step"
  | "tips"
  | "comparison"
  | "glossary"
  | "custom";

export interface CheatSheetOutlineItem {
  text: string;
  subItems?: string[];
  isTip?: boolean;
  isWarning?: boolean;
}

export interface CheatSheetSection {
  heading: string;
  type: SectionType;
  items: CheatSheetOutlineItem[];
}

export interface CheatSheetOutline {
  title: string;
  subtitle?: string;
  sections: CheatSheetSection[];
  footer?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// =============================================================================
// PUBLIC ACTION
// =============================================================================

/**
 * Generate a structured cheat sheet outline from selected course chapters.
 * Uses Gemini 2.5 Flash for fast, cheap structured JSON output.
 */
export const generateOutline = action({
  args: {
    courseId: v.id("courses"),
    chapterIds: v.array(v.string()),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CheatSheetOutline> => {
    const { courseId, chapterIds, customInstructions } = args;
    const startTime = Date.now();

    console.log(`📝 Generating cheat sheet outline for course: ${courseId}`);
    console.log(`   Selected ${chapterIds.length} chapters`);

    // Fetch course info
    const courseInfo = await ctx.runQuery(
      internalRef.courses.getCourseForLeadMagnet,
      { courseId }
    ) as { _id: Id<"courses">; title: string } | null;

    if (!courseInfo) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Fetch all chapters with enriched info
    const allChapters = await ctx.runQuery(
      internalRef.courses.getChaptersForLeadMagnet,
      { courseId }
    ) as Array<{
      _id: Id<"courseChapters">;
      title: string;
      description?: string;
      position: number;
      lessonId?: string;
      lessonTitle?: string;
      moduleTitle?: string;
    }>;

    // Filter to selected chapters only
    const selectedChapters = allChapters.filter(ch =>
      chapterIds.includes(ch._id.toString())
    );

    if (selectedChapters.length === 0) {
      throw new Error("No matching chapters found for the provided IDs");
    }

    console.log(`   Found ${selectedChapters.length} matching chapters with content`);

    // Build chapter content for the prompt
    const chapterContent = selectedChapters
      .map((ch) => {
        const plainText = ch.description ? stripHtmlTags(ch.description) : "";
        const truncated = plainText.substring(0, 3000);
        const location = [ch.moduleTitle, ch.lessonTitle].filter(Boolean).join(" > ");
        return `## ${ch.title}${location ? ` (${location})` : ""}\n${truncated}${plainText.length > 3000 ? "... [truncated]" : ""}`;
      })
      .join("\n\n");

    const modelId: ModelId = "gemini-2.5-flash";

    const systemPrompt = `You are an expert at creating educational cheat sheets for music production students. You specialize in distilling complex course content into scannable, actionable PDF reference guides.

Given chapter content from a music production course, create a structured cheat sheet outline optimized for a 1-2 page PDF.

Guidelines:
- Make it CONCISE and SCANNABLE - bullet points, not paragraphs
- Focus on ACTIONABLE content - what to DO, not just theory
- Include practical quick-reference items (settings, shortcuts, values)
- Add pro tips that show insider knowledge
- Flag common mistakes as warnings
- Organize logically with clear section headers
- Each section should have 3-8 items maximum
- Target 3-6 sections total for a tight, focused cheat sheet

Section types you can use:
- "key_takeaways" - The most important points to remember
- "quick_reference" - Settings, values, shortcuts, formulas
- "step_by_step" - Ordered process steps
- "tips" - Pro tips and best practices
- "comparison" - Side-by-side comparisons (e.g., good vs bad, before/after)
- "glossary" - Key term definitions
- "custom" - Any other section type

For each item, you can optionally mark:
- "isTip": true - for pro tips (will be highlighted in the PDF)
- "isWarning": true - for common mistakes/warnings (will be highlighted differently)
- "subItems" - for nested bullet points under an item

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "Catchy, specific title for the cheat sheet",
  "subtitle": "Brief description of what this covers",
  "sections": [
    {
      "heading": "Section Title",
      "type": "key_takeaways|quick_reference|step_by_step|tips|comparison|glossary|custom",
      "items": [
        {
          "text": "Main point or item text",
          "subItems": ["Detail 1", "Detail 2"],
          "isTip": false,
          "isWarning": false
        }
      ]
    }
  ],
  "footer": "Download more at ppr.academy"
}`;

    const userPrompt = `Course: "${courseInfo.title}"

Create a cheat sheet from these ${selectedChapters.length} chapters:

${chapterContent}

${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ""}

Generate a focused, scannable 1-2 page cheat sheet with 3-6 sections. Prioritize practical, actionable content that a music producer would pin to their wall or keep open while working.`;

    try {
      const response = await callLLM({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        maxTokens: 4000,
        responseFormat: "json",
      });

      const parsed = safeParseJson<CheatSheetOutline>(response.content);

      // Validate structure
      if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error("Invalid outline structure returned from LLM");
      }

      // Ensure each section has required fields
      const validatedSections = parsed.sections.map((section: any) => ({
        heading: section.heading || "Untitled Section",
        type: ["key_takeaways", "quick_reference", "step_by_step", "tips", "comparison", "glossary", "custom"].includes(section.type)
          ? section.type
          : "custom",
        items: (section.items || []).map((item: any) => ({
          text: item.text || "",
          subItems: item.subItems,
          isTip: item.isTip || false,
          isWarning: item.isWarning || false,
        })),
      }));

      const outline: CheatSheetOutline = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        sections: validatedSections,
        footer: parsed.footer || "Download more at ppr.academy",
      };

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Outline generated in ${elapsed}s - ${outline.sections.length} sections`);

      return outline;
    } catch (error) {
      console.error("❌ Failed to generate cheat sheet outline:", error);
      throw new Error(`Failed to generate outline: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
