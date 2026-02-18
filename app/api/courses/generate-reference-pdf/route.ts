import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { generateCheatSheetPDF, type Outline, type OutlineSection } from "@/lib/pdf-generator";

export const maxDuration = 120; // Multiple LLM calls + PDF generation + upload

// =============================================================================
// LLM CONFIG
// =============================================================================

const MODEL_MAP: Record<string, string> = {
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  "gpt-4.1-mini": "gpt-4.1-mini",
};

const VALID_SECTION_TYPES = [
  "key_takeaways",
  "quick_reference",
  "step_by_step",
  "tips",
  "comparison",
  "glossary",
  "custom",
];

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are an expert educational content transformer for PPR Academy, a music production learning platform. Your job is to take raw course chapter content and transform it into a structured reference guide optimized for a professionally branded PDF document.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, just pure JSON.

CONTENT TRANSFORMATION RULES:
- Distill verbose lesson content into concise, scannable bullet points
- Preserve ALL technical specifics: exact values, settings, frequencies, shortcuts, formulas
- Convert narrative paragraphs into actionable reference items
- Identify and flag pro tips (mark as isTip: true)
- Identify and flag common mistakes or dangers (mark as isWarning: true)
- Use subItems for supporting details under a main point
- Each item.text should be one clear, complete thought (max ~120 chars ideal)
- Each subItem should be a brief supporting detail (max ~80 chars)

SECTION ORGANIZATION:
- Group related content into logical sections (3-8 sections per module)
- Use appropriate section types:
  "key_takeaways" - The most important concepts and facts to remember
  "quick_reference" - Settings, values, shortcuts, parameter ranges, formulas
  "step_by_step" - Ordered workflows, processes, signal chains
  "tips" - Pro tips, best practices, insider techniques
  "comparison" - Contrasting approaches, before/after, good vs bad
  "glossary" - Key terms with concise definitions
  "custom" - Anything that doesn't fit above (specify heading)
- Each section should have 3-8 items maximum
- Target 3-6 sections total for a tight, focused reference

OUTPUT FORMAT - Respond ONLY with valid JSON matching this exact structure:
{
  "sections": [
    {
      "heading": "Section Title",
      "type": "key_takeaways|quick_reference|step_by_step|tips|comparison|glossary|custom",
      "items": [
        {
          "text": "Main point or reference item",
          "subItems": ["Supporting detail 1", "Supporting detail 2"],
          "isTip": false,
          "isWarning": false
        }
      ]
    }
  ]
}

QUALITY REQUIREMENTS:
- Every item must be ACTIONABLE or REFERENCE-WORTHY (skip fluff, intros, filler)
- Preserve exact numbers, settings, and technical details
- If content mentions specific DAW settings, include the exact values
- Audio frequency ranges, dB values, ms timings — keep them all
- Do NOT add information that isn't in the source content
- Do NOT use generic advice — everything should be specific to what's taught`;

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

function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();

  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```")) {
    const firstLineEnd = cleaned.indexOf("\n");
    if (firstLineEnd !== -1) {
      cleaned = cleaned.substring(firstLineEnd + 1);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
  }

  return cleaned;
}

function safeParseJson<T>(content: string): T {
  const cleaned = cleanJsonResponse(content);
  return JSON.parse(cleaned) as T;
}

function validateSections(raw: any): OutlineSection[] {
  if (!raw?.sections || !Array.isArray(raw.sections)) {
    throw new Error("Invalid response: missing sections array");
  }

  return raw.sections.map((section: any) => ({
    heading: section.heading || "Untitled Section",
    type: VALID_SECTION_TYPES.includes(section.type) ? section.type : "custom",
    items: (section.items || []).map((item: any) => ({
      text: item.text || "",
      subItems: Array.isArray(item.subItems) ? item.subItems : undefined,
      isTip: item.isTip || false,
      isWarning: item.isWarning || false,
    })),
  }));
}

// =============================================================================
// OPENAI LLM CALL
// =============================================================================

async function callLLM(
  courseTitle: string,
  moduleName: string,
  chapterCount: number,
  chaptersContent: string,
  modelId: string = "gpt-4o-mini"
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const model = MODEL_MAP[modelId] || MODEL_MAP["gpt-4o-mini"];

  const userPrompt = `Course: "${courseTitle}"
Module: "${moduleName}"

Transform these ${chapterCount} chapters into a reference guide:

${chaptersContent}

Generate a focused, scannable reference guide with 3-6 sections. Prioritize practical, actionable content that a music producer would keep open while working. Preserve all specific technical details, values, and settings.`;

  console.log(`[RefPDF] Calling OpenAI model=${model} module="${moduleName}" chapters=${chapterCount} promptLen=${userPrompt.length}`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  const responseText = await response.text();

  console.log(`[RefPDF] OpenAI response status=${response.status} bodyLen=${responseText.length} bodyPreview=${responseText.substring(0, 200)}`);

  if (!response.ok) {
    throw new Error(`OpenAI API error (${response.status}): ${responseText.substring(0, 500)}`);
  }

  let data: { choices: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`OpenAI returned invalid JSON (${response.status}): ${responseText.substring(0, 200)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  console.log(`[RefPDF] LLM content length=${content.length}`);
  return content;
}

// =============================================================================
// API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const body = await request.json();
    const { courseId, modelId = "gpt-4o-mini" } = body;

    console.log(`[RefPDF] Starting generation courseId=${courseId} modelId=${modelId}`);
    console.log(`[RefPDF] OPENAI_API_KEY set=${!!process.env.OPENAI_API_KEY} keyPrefix=${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    if (modelId && !MODEL_MAP[modelId]) {
      return NextResponse.json(
        { error: `Invalid modelId. Supported: ${Object.keys(MODEL_MAP).join(", ")}` },
        { status: 400 }
      );
    }

    // ─── Step 1: Fetch course data from Convex ───
    const { fetchQuery, fetchMutation } = await import("convex/nextjs");
    const { api } = await import("@/convex/_generated/api");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [courseWithInstructor, chapters] = await Promise.all([
      fetchQuery(api.courses.getCourseWithInstructor as any, { courseId }),
      fetchQuery(api.courses.getCourseChaptersEnriched as any, { courseId }),
    ]);

    if (!courseWithInstructor) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseInfo = (courseWithInstructor as any).course;

    console.log(`[RefPDF] Course: "${(courseInfo as any).title}" chapters=${chapters?.length ?? 0}`);

    if (!chapters || chapters.length === 0) {
      return NextResponse.json({ error: "Course has no chapters" }, { status: 400 });
    }

    // ─── Step 2: Group chapters by module ───
    const moduleGroups = new Map<string, typeof chapters>();
    for (const ch of chapters) {
      const key = (ch as any).moduleTitle || "General";
      if (!moduleGroups.has(key)) moduleGroups.set(key, []);
      moduleGroups.get(key)!.push(ch);
    }

    console.log(`[RefPDF] Grouped into ${moduleGroups.size} modules: ${[...moduleGroups.keys()].join(", ")}`);

    // ─── Step 3: Call Claude for each module (sequentially) ───
    const allSections: OutlineSection[] = [];
    const warnings: string[] = [];

    for (const [moduleName, moduleChapters] of moduleGroups) {
      try {
        // Sort chapters by position within each module
        const sorted = [...moduleChapters].sort(
          (a, b) => (a as any).position - (b as any).position
        );

        // Build chapter content: strip HTML, truncate, format
        const chaptersContent = sorted
          .map((ch: any) => {
            const plainText = ch.description ? stripHtmlTags(ch.description) : "";
            const truncated = plainText.substring(0, 4000);
            const loc = ch.lessonTitle ? ` (${ch.lessonTitle})` : "";
            return `### ${ch.title}${loc}\n${truncated}${plainText.length > 4000 ? "... [truncated]" : ""}`;
          })
          .join("\n\n");

        // Skip modules with no real content
        if (chaptersContent.trim().length < 50) {
          warnings.push(`Skipped module "${moduleName}" — no meaningful content`);
          continue;
        }

        const llmResponse = await callLLM(
          (courseInfo as any).title,
          moduleName,
          sorted.length,
          chaptersContent,
          modelId
        );

        const parsed = safeParseJson<{ sections: any[] }>(llmResponse);
        const validated = validateSections(parsed);
        allSections.push(...validated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to transform module "${moduleName}":`, msg);
        warnings.push(`Module "${moduleName}" failed: ${msg}`);
      }
    }

    if (allSections.length === 0) {
      const detail = warnings.length > 0 ? `: ${warnings[0]}` : "";
      return NextResponse.json(
        {
          error: `Failed to generate content for any module${detail}`,
          warnings,
        },
        { status: 500 }
      );
    }

    // ─── Step 4: Assemble final Outline ───
    const outline: Outline = {
      title: `${(courseInfo as any).title} — Reference Guide`,
      subtitle: `Complete reference covering ${chapters.length} chapters across ${moduleGroups.size} module${moduleGroups.size === 1 ? "" : "s"}`,
      sections: allSections,
      footer: "PPR Academy — ppr.academy",
    };

    // ─── Step 5: Generate PDF ───
    const pdfBytes = await generateCheatSheetPDF(outline);

    // ─── Step 6: Upload to Convex storage ───
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadUrl = await fetchMutation(api.files.generateUploadUrl as any, {});

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: pdfBytes,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload PDF to storage");
    }

    const { storageId } = await uploadResponse.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfUrl = await fetchMutation(api.files.getUrl as any, { storageId });

    if (!pdfUrl) {
      throw new Error("Failed to get PDF URL from storage");
    }

    // ─── Step 7: Persist PDF info on course record ───
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetchMutation(api.referenceGuides.updateReferencePdfInfo as any, {
      courseId,
      pdfStorageId: storageId,
      pdfUrl,
    });

    // ─── Step 8: Return response ───
    return NextResponse.json({
      success: true,
      pdfUrl,
      storageId,
      stats: {
        modules: moduleGroups.size,
        chapters: chapters.length,
        sections: allSections.length,
        model: modelId,
      },
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("Reference PDF generation error:", error);
    return NextResponse.json(
      {
        error: `Failed to generate reference PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
