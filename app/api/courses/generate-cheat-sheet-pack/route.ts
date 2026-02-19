import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimiters,
} from "@/lib/rate-limit";
import { renderReferenceGuidePDF } from "@/lib/pdf-templates/render";
import type { OutlineSection } from "@/lib/pdf-templates/components";
import { enforceCheatSheetLimits } from "@/lib/cheat-sheet-limits";

export const maxDuration = 300; // 5 min — processing up to 10+ modules sequentially

// =============================================================================
// LLM CONFIG (Claude via OpenRouter)
// =============================================================================

const MODEL_MAP: Record<string, string> = {
  "claude-3.5-haiku": "anthropic/claude-3.5-haiku",
  "claude-4-sonnet": "anthropic/claude-sonnet-4",
  "claude-4.5-sonnet": "anthropic/claude-sonnet-4.5",
};

const DEFAULT_MODEL = "claude-3.5-haiku";

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
// SYSTEM PROMPT — optimized for focused 1-2 page per-module cheat sheets
// =============================================================================

const SYSTEM_PROMPT = `You are a cheat sheet distiller for PPR Academy, a music production education platform.

THE MID-SESSION TEST: A producer is in the middle of a session working on this topic. They glance at this cheat sheet pinned next to their monitor. If the information helps them RIGHT NOW — a setting, a value, a workflow step, a frequency range — KEEP IT. If it requires "understanding" or "context" — CUT IT.

HARD CONSTRAINTS (violating these = failure):
- MAXIMUM 4 sections
- MAXIMUM 6 items per section
- MAXIMUM 3 subItems per item
- Each item.text MUST be under 100 characters
- Each subItem MUST be under 80 characters
- Total items across all sections: 20-25 (target 22)
- ZERO filler, intros, or conceptual items

PRIORITIZATION (in order):
1. Specific values: frequencies (Hz), dB levels, ms timings, percentages, ratios
2. Signal chains / workflow steps: exact order of operations
3. Quick comparisons: "X vs Y → use X when..."
4. Critical warnings: things that will ruin the mix
5. Non-obvious pro tips: techniques that aren't intuitive
6. EVERYTHING ELSE → CUT IT

SECTION TYPES (use these only):
- "quick_reference" — settings, values, ranges (PREFERRED — 50%+ of sections)
- "step_by_step" — ordered workflows, signal chains
- "comparison" — A vs B decisions with clear guidance
- "tips" — ONLY genuinely non-obvious techniques (max 1 section)
- NEVER use "glossary"
- NEVER use "key_takeaways" unless every item contains a specific number/value

FORMATTING:
- item.text: one fact, one setting, or one step. Period.
  GOOD: "HPF vocals at 80-100 Hz before compression"
  BAD: "Understanding high-pass filtering is essential for clean vocals"
- subItems: supporting specifics only
  GOOD: "Ratio 4:1 for gentle, 8:1+ for limiting"
  BAD: "This helps create a more polished sound"
- isTip: true ONLY for non-obvious techniques
- isWarning: true ONLY for things that audibly damage the mix

Respond ONLY with valid JSON:
{
  "sections": [
    {
      "heading": "Section Title",
      "type": "quick_reference|step_by_step|comparison|tips",
      "items": [
        {
          "text": "Concise item under 100 chars",
          "subItems": ["Detail under 80 chars"],
          "isTip": false,
          "isWarning": false
        }
      ]
    }
  ]
}`;

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

function validateSections(raw: { sections?: unknown[] }): OutlineSection[] {
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
// CLAUDE LLM CALL (via OpenRouter)
// =============================================================================

async function callClaude(
  courseTitle: string,
  moduleName: string,
  chapterCount: number,
  chaptersContent: string,
  modelId: string = DEFAULT_MODEL
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const model = MODEL_MAP[modelId] || MODEL_MAP[DEFAULT_MODEL];

  const userPrompt = `Course: "${courseTitle}"
Module: "${moduleName}" (${chapterCount} chapters)

Distill into a 1-2 page cheat sheet a producer would pin next to their DAW:

${chaptersContent}

MAXIMUM 4 sections, ~22 items total. Every item must pass the mid-session test.`;

  console.log(
    `[CheatPack] Calling Claude model=${model} module="${moduleName}" chapters=${chapterCount} promptLen=${userPrompt.length}`
  );

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ppr.academy",
      "X-Title": "PPR Academy",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenRouter API error (${response.status}): ${responseText.substring(0, 500)}`
    );
  }

  let data: { choices: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `OpenRouter returned invalid JSON (${response.status}): ${responseText.substring(0, 200)}`
    );
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Claude returned empty content");
  }

  return content;
}

// =============================================================================
// API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const body = await request.json();
    const { courseId, modelId = DEFAULT_MODEL } = body;

    console.log(
      `[CheatPack] Starting generation courseId=${courseId} modelId=${modelId}`
    );

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    if (modelId && !MODEL_MAP[modelId]) {
      return NextResponse.json(
        {
          error: `Invalid modelId. Supported: ${Object.keys(MODEL_MAP).join(", ")}`,
        },
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
    const courseTitle = (courseInfo as any).title;

    console.log(
      `[CheatPack] Course: "${courseTitle}" chapters=${chapters?.length ?? 0}`
    );

    if (!chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: "Course has no chapters" },
        { status: 400 }
      );
    }

    // ─── Step 2: Group chapters by module ───
    const moduleGroups = new Map<
      string,
      { chapters: typeof chapters; moduleId?: string }
    >();
    for (const ch of chapters) {
      const key = (ch as any).moduleTitle || "General";
      if (!moduleGroups.has(key)) {
        moduleGroups.set(key, {
          chapters: [],
          moduleId: (ch as any).moduleId,
        });
      }
      moduleGroups.get(key)!.chapters.push(ch);
    }

    console.log(
      `[CheatPack] Grouped into ${moduleGroups.size} modules: ${[...moduleGroups.keys()].join(", ")}`
    );

    // ─── Step 3: Create pack record ───
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packId = await fetchMutation(api.cheatSheetPacks.createPack as any, {
      courseId,
      courseTitle,
      userId: (user as any).id || (user as any).userId,
      totalModules: moduleGroups.size,
      modelId,
    });

    // ─── Step 4: Process each module sequentially ───
    const warnings: string[] = [];
    const sheets: Array<{
      moduleTitle: string;
      pdfUrl: string;
      cheatSheetId: string;
    }> = [];
    let completedCount = 0;

    for (const [moduleName, moduleData] of moduleGroups) {
      try {
        // Sort chapters by position
        const sorted = [...moduleData.chapters].sort(
          (a, b) => (a as any).position - (b as any).position
        );

        // Build chapter content: strip HTML, truncate, format
        const chaptersContent = sorted
          .map((ch: any) => {
            const plainText = ch.description
              ? stripHtmlTags(ch.description)
              : "";
            const truncated = plainText.substring(0, 3000);
            const loc = ch.lessonTitle ? ` (${ch.lessonTitle})` : "";
            return `### ${ch.title}${loc}\n${truncated}${plainText.length > 3000 ? "... [truncated]" : ""}`;
          })
          .join("\n\n");

        // Skip modules with no real content
        if (chaptersContent.trim().length < 50) {
          warnings.push(
            `Skipped module "${moduleName}" — no meaningful content`
          );
          await fetchMutation(api.cheatSheetPacks.markPackFailed as any, {
            packId,
            moduleName,
          });
          continue;
        }

        // Call Claude
        const llmResponse = await callClaude(
          courseTitle,
          moduleName,
          sorted.length,
          chaptersContent,
          modelId
        );

        // Parse and validate
        const parsed = safeParseJson<{ sections: unknown[] }>(llmResponse);
        const validated = validateSections(parsed);

        // Run through limits enforcer
        const enforced = enforceCheatSheetLimits(
          validated as any
        ) as OutlineSection[];

        // Assemble outline
        const outline = {
          title: moduleName,
          subtitle: `${courseTitle} — Module Cheat Sheet`,
          sections: enforced,
          footer: "PPR Academy — ppr.academy",
        };

        // Generate PDF
        const pdfBytes = await renderReferenceGuidePDF(outline);

        // Upload to Convex storage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uploadUrl = await fetchMutation(
          api.files.generateUploadUrl as any,
          {}
        );

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
        const pdfUrl = await fetchMutation(api.files.getUrl as any, {
          storageId,
        });

        if (!pdfUrl) {
          throw new Error("Failed to get PDF URL from storage");
        }

        // Create cheat sheet record
        const cheatSheetId = await fetchMutation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          api.cheatSheetMutations.createCheatSheetForPack as any,
          {
            packId,
            courseId,
            courseTitle,
            moduleTitle: moduleName,
            moduleId: moduleData.moduleId,
            outline,
            userId: (user as any).id || (user as any).userId,
            pdfStorageId: storageId,
            pdfUrl,
            aiModel: modelId,
          }
        );

        // Update pack
        await fetchMutation(api.cheatSheetPacks.addSheetToPack as any, {
          packId,
          cheatSheetId,
        });

        sheets.push({
          moduleTitle: moduleName,
          pdfUrl,
          cheatSheetId,
        });

        completedCount++;
        console.log(
          `[CheatPack] ✓ Module "${moduleName}" done (${completedCount}/${moduleGroups.size})`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[CheatPack] ✗ Module "${moduleName}" failed:`, msg);
        warnings.push(`Module "${moduleName}" failed: ${msg}`);

        await fetchMutation(api.cheatSheetPacks.markPackFailed as any, {
          packId,
          moduleName,
        });
      }
    }

    // ─── Step 5: Complete pack ───
    await fetchMutation(api.cheatSheetPacks.completePackGeneration as any, {
      packId,
    });

    // ─── Step 6: Return response ───
    return NextResponse.json({
      success: true,
      packId,
      totalModules: moduleGroups.size,
      completedModules: completedCount,
      sheets,
      warnings,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("[CheatPack] Generation error:", error);
    return NextResponse.json(
      {
        error: `Failed to generate cheat sheet pack: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
