"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { createFalClient } from "@fal-ai/client";
import OpenAI from "openai";

// ============================================================================
// CHAPTER IMAGE AUTO-GENERATION & INSERTION
// ============================================================================

/**
 * Represents a section of chapter HTML content that can receive an image.
 */
interface ContentSection {
  sectionIndex: number;
  textContent: string;
  /** Character offset in the HTML where the image should be inserted */
  insertAtOffset: number;
  /** Whether this section already has an AI-generated image */
  hasExistingImage: boolean;
}

// ============================================================================
// HTML SECTION SPLITTING
// ============================================================================

/**
 * Strip HTML tags to get plain text content.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Parse HTML into logical sections for image insertion.
 *
 * Strategy:
 * 1. Split on heading tags (h1-h6) — each heading + following content = one section
 * 2. If no headings exist, group every 2-3 paragraphs into a section
 * 3. Skip sections with less than 50 chars of text content
 * 4. Detect existing AI-generated images to skip those sections
 */
function splitHtmlIntoSections(html: string): ContentSection[] {
  const sections: ContentSection[] = [];

  // Regex to match heading tags or paragraph/block boundaries
  const headingRegex = /<(h[1-6])[^>]*>[\s\S]*?<\/\1>/gi;
  const headingMatches = [...html.matchAll(headingRegex)];

  if (headingMatches.length > 0) {
    // Strategy 1: Split by headings
    for (let i = 0; i < headingMatches.length; i++) {
      const match = headingMatches[i];
      const sectionStart = match.index!;
      const sectionEnd =
        i + 1 < headingMatches.length
          ? headingMatches[i + 1].index!
          : html.length;

      const sectionHtml = html.slice(sectionStart, sectionEnd);
      const textContent = stripHtml(sectionHtml);

      if (textContent.length < 50) continue;

      // Check if this section already has an AI-generated image
      const hasExistingImage = /data-ai-generated="true"/.test(sectionHtml);

      // Insert point is right after the closing heading tag
      const headingEndMatch = sectionHtml.match(/<\/h[1-6]>/i);
      const insertAtOffset = headingEndMatch
        ? sectionStart + headingEndMatch.index! + headingEndMatch[0].length
        : sectionStart + match[0].length;

      sections.push({
        sectionIndex: sections.length,
        textContent,
        insertAtOffset,
        hasExistingImage,
      });
    }
  } else {
    // Strategy 2: Group paragraphs (no headings found)
    const blockRegex = /<(p|div|li|blockquote)[^>]*>[\s\S]*?<\/\1>/gi;
    const blockMatches = [...html.matchAll(blockRegex)];

    if (blockMatches.length === 0) {
      // No block elements at all — treat entire content as one section
      const textContent = stripHtml(html);
      if (textContent.length >= 50) {
        sections.push({
          sectionIndex: 0,
          textContent,
          insertAtOffset: html.length,
          hasExistingImage: /data-ai-generated="true"/.test(html),
        });
      }
      return sections;
    }

    // Group every 2-3 paragraphs
    const GROUP_SIZE = 2;
    for (let i = 0; i < blockMatches.length; i += GROUP_SIZE) {
      const groupEnd = Math.min(i + GROUP_SIZE, blockMatches.length);
      const firstMatch = blockMatches[i];
      const lastMatch = blockMatches[groupEnd - 1];

      const sectionStart = firstMatch.index!;
      const sectionEnd = lastMatch.index! + lastMatch[0].length;
      const sectionHtml = html.slice(sectionStart, sectionEnd);
      const textContent = stripHtml(sectionHtml);

      if (textContent.length < 50) continue;

      const hasExistingImage = /data-ai-generated="true"/.test(sectionHtml);

      sections.push({
        sectionIndex: sections.length,
        textContent,
        insertAtOffset: sectionEnd,
        hasExistingImage,
      });
    }
  }

  return sections;
}

/**
 * Insert image tags into HTML at the specified offsets.
 * Processes from last to first to preserve earlier offsets.
 */
function insertImagesIntoHtml(
  html: string,
  images: Array<{
    insertAtOffset: number;
    imageUrl: string;
    altText: string;
  }>
): string {
  // Sort by offset descending so we don't shift earlier offsets
  const sorted = [...images].sort(
    (a, b) => b.insertAtOffset - a.insertAtOffset
  );

  let result = html;
  for (const img of sorted) {
    const imgTag = `<img src="${img.imageUrl}" alt="${img.altText}" class="rounded-lg max-w-full h-auto my-4" data-ai-generated="true">`;
    result =
      result.slice(0, img.insertAtOffset) +
      imgTag +
      result.slice(img.insertAtOffset);
  }

  return result;
}

// ============================================================================
// IMAGE PROMPT GENERATION (educational style)
// ============================================================================

const CHAPTER_IMAGE_PROMPT_SYSTEM = `You are an expert at creating image prompts for educational course content illustrations.

Given a section of text from a music production / audio engineering course chapter, create a clear, detailed prompt for generating an illustration.

# MANDATORY VISUAL STYLE: Excalidraw Hand-Drawn Aesthetic

- Simple hand-drawn sketch appearance (Excalidraw-style)
- Slightly wobbly, imperfect outlines
- Flat colors from PPR Academy brand palette:
  - Primary: Indigo Blue (#818CF8), Rich Purple (#7C6CEF), Deep Purple (#6366F1)
  - Accents: Sky Cyan (#7DD3FC), Vibrant Pink (#EC4899), Warm Orange (#F97316)
- Pure white background
- Clean, uncluttered composition

# AVOID
- Musical notation, treble/bass clefs, sheet music
- Piano keys (AI renders them incorrectly)
- Photorealistic style — keep it sketchy and diagrammatic

# PREFER
- DAW interfaces, waveforms, audio meters, mixing consoles
- Knobs, faders, sliders, speakers, headphones, microphones
- Frequency spectrums, equalizer bars, abstract audio visualizations
- Flow charts, process diagrams, comparison tables
- Simple icons and labeled diagrams

# OUTPUT
Return ONLY the image prompt text (1-2 sentences). No explanation, no JSON.

Example input: "The compressor reduces the dynamic range by attenuating loud sounds above the threshold."
Example output: "Excalidraw-style hand-drawn diagram showing an audio waveform being compressed, with a clearly labeled threshold line in indigo blue and gain reduction arrows in vibrant pink, white background, clean educational illustration."`;

async function generateChapterImagePrompt(
  sectionText: string,
  style?: string
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = style || CHAPTER_IMAGE_PROMPT_SYSTEM;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate an image prompt for this course section:\n\n${sectionText.slice(0, 1000)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content || sectionText.slice(0, 100);
}

// ============================================================================
// IMAGE GENERATION (reuse existing FAL pattern)
// ============================================================================

async function generateImageWithFAL(
  prompt: string,
  model: string = "fal-ai/flux/schnell"
): Promise<{ url: string }> {
  const falClient = createFalClient();

  const result = await falClient.run(model, {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
    },
  });

  const imageData = result.data as any;
  if (!imageData?.images?.[0]?.url) {
    throw new Error("No image URL in FAL response");
  }

  return { url: imageData.images[0].url };
}

async function uploadImageToConvex(
  ctx: any,
  imageUrl: string
): Promise<Id<"_storage">> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  const uploadUrl = await ctx.runMutation(
    internal.scriptIllustrationMutations.generateUploadUrl,
    {}
  );

  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload to Convex storage");
  }

  const { storageId } = (await uploadResult.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}

// ============================================================================
// MAIN ACTION: Generate & Insert Images for a Single Chapter
// ============================================================================

export const generateAndInsertChapterImages = action({
  args: {
    chapterId: v.id("courseChapters"),
    style: v.optional(v.string()),
    forceRegenerate: v.optional(v.boolean()),
  },
  returns: v.object({
    chapterId: v.string(),
    imagesGenerated: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // 1. Read the chapter
      const chapter = await ctx.runQuery(
        internal.courses.getChapterByIdInternal,
        { chapterId: args.chapterId }
      );

      if (!chapter) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: false,
          error: "Chapter not found",
        };
      }

      const html = chapter.description || "";
      if (stripHtml(html).length < 50) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: true,
          error: "Chapter has insufficient text content",
        };
      }

      // 2. If force regenerate, strip existing AI images first
      let workingHtml = html;
      if (args.forceRegenerate) {
        workingHtml = workingHtml.replace(
          /<img[^>]*data-ai-generated="true"[^>]*>/gi,
          ""
        );
      }

      // 3. Split into sections
      const sections = splitHtmlIntoSections(workingHtml);
      const sectionsToProcess = sections.filter((s) => !s.hasExistingImage);

      if (sectionsToProcess.length === 0) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: true,
          error: "All sections already have images",
        };
      }

      // 4. Generate prompts and images for each section
      const imagesToInsert: Array<{
        insertAtOffset: number;
        imageUrl: string;
        altText: string;
      }> = [];

      for (const section of sectionsToProcess) {
        try {
          // Generate prompt
          const prompt = await generateChapterImagePrompt(
            section.textContent,
            args.style
          );

          // Generate image
          const falResult = await generateImageWithFAL(prompt);

          // Upload to Convex storage
          const storageId = await uploadImageToConvex(ctx, falResult.url);
          const publicUrl = await ctx.runQuery(
            internal.scriptIllustrationMutations.getStorageUrl,
            { storageId }
          );

          if (!publicUrl) {
            console.error(
              `Failed to get public URL for storage ID: ${storageId}`
            );
            continue;
          }

          // Brief description for alt text
          const altText = `Illustration for: ${section.textContent
            .slice(0, 80)
            .replace(/"/g, "&quot;")}`;

          imagesToInsert.push({
            insertAtOffset: section.insertAtOffset,
            imageUrl: publicUrl,
            altText,
          });

          // Rate limit between FAL calls
          if (section !== sectionsToProcess[sectionsToProcess.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (err: any) {
          console.error(
            `Image generation failed for section ${section.sectionIndex}:`,
            err.message
          );
          // Continue with other sections
        }
      }

      if (imagesToInsert.length === 0) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: false,
          error: "All image generations failed",
        };
      }

      // 5. Insert images into HTML
      const updatedHtml = insertImagesIntoHtml(workingHtml, imagesToInsert);

      // 6. Save updated content
      await ctx.runMutation(internal.courses.updateChapterDescription, {
        chapterId: args.chapterId,
        description: updatedHtml,
      });

      return {
        chapterId: args.chapterId,
        imagesGenerated: imagesToInsert.length,
        success: true,
      };
    } catch (error: any) {
      console.error("generateAndInsertChapterImages error:", error);
      return {
        chapterId: args.chapterId,
        imagesGenerated: 0,
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// BATCH ACTION: Generate & Insert Images for All Chapters in a Course
// ============================================================================

export const generateAndInsertCourseImages = action({
  args: {
    courseId: v.id("courses"),
    forceRegenerate: v.optional(v.boolean()),
  },
  returns: v.object({
    courseId: v.string(),
    totalChapters: v.number(),
    chaptersProcessed: v.number(),
    totalImagesGenerated: v.number(),
    success: v.boolean(),
    results: v.array(
      v.object({
        chapterId: v.string(),
        chapterTitle: v.string(),
        imagesGenerated: v.number(),
        success: v.boolean(),
        error: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    try {
      // Fetch all chapters for the course
      const chapters: Array<{
        _id: Id<"courseChapters">;
        title: string;
        description?: string;
      }> = await ctx.runQuery(
        internal.chapterImageGenerationQueries.getCourseChaptersInternal,
        { courseId: args.courseId }
      );

      if (!chapters || chapters.length === 0) {
        return {
          courseId: args.courseId,
          totalChapters: 0,
          chaptersProcessed: 0,
          totalImagesGenerated: 0,
          success: true,
          results: [],
        };
      }

      // Filter to chapters that have content and (optionally) don't already have images
      const chaptersToProcess = chapters.filter((ch) => {
        const html = ch.description || "";
        const hasContent = stripHtml(html).length >= 50;
        if (!hasContent) return false;
        if (args.forceRegenerate) return true;
        // Skip chapters that already have AI-generated images
        return !/<img[^>]*data-ai-generated="true"/.test(html);
      });

      const results: Array<{
        chapterId: string;
        chapterTitle: string;
        imagesGenerated: number;
        success: boolean;
        error?: string;
      }> = [];

      let totalImagesGenerated = 0;

      // Process chapters sequentially to respect rate limits
      for (const chapter of chaptersToProcess) {
        try {
          const result = await ctx.runAction(
            internal.chapterImageGeneration.generateAndInsertChapterImagesInternal,
            {
              chapterId: chapter._id,
              forceRegenerate: args.forceRegenerate ?? false,
            }
          );

          results.push({
            chapterId: chapter._id,
            chapterTitle: chapter.title,
            imagesGenerated: result.imagesGenerated,
            success: result.success,
            error: result.error,
          });

          totalImagesGenerated += result.imagesGenerated;

          // Rate limit between chapters
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err: any) {
          results.push({
            chapterId: chapter._id,
            chapterTitle: chapter.title,
            imagesGenerated: 0,
            success: false,
            error: err.message,
          });
        }
      }

      return {
        courseId: args.courseId,
        totalChapters: chapters.length,
        chaptersProcessed: chaptersToProcess.length,
        totalImagesGenerated,
        success: true,
        results,
      };
    } catch (error: any) {
      console.error("generateAndInsertCourseImages error:", error);
      return {
        courseId: args.courseId,
        totalChapters: 0,
        chaptersProcessed: 0,
        totalImagesGenerated: 0,
        success: false,
        results: [],
      };
    }
  },
});

// ============================================================================
// INTERNAL version (no auth check — called by batch action)
// ============================================================================

export const generateAndInsertChapterImagesInternal = internalAction({
  args: {
    chapterId: v.id("courseChapters"),
    style: v.optional(v.string()),
    forceRegenerate: v.boolean(),
  },
  returns: v.object({
    chapterId: v.string(),
    imagesGenerated: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const chapter = await ctx.runQuery(
        internal.courses.getChapterByIdInternal,
        { chapterId: args.chapterId }
      );

      if (!chapter) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: false,
          error: "Chapter not found",
        };
      }

      const html = chapter.description || "";
      if (stripHtml(html).length < 50) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: true,
          error: "Chapter has insufficient text content",
        };
      }

      let workingHtml = html;
      if (args.forceRegenerate) {
        workingHtml = workingHtml.replace(
          /<img[^>]*data-ai-generated="true"[^>]*>/gi,
          ""
        );
      }

      const sections = splitHtmlIntoSections(workingHtml);
      const sectionsToProcess = sections.filter((s) => !s.hasExistingImage);

      if (sectionsToProcess.length === 0) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: true,
          error: "All sections already have images",
        };
      }

      const imagesToInsert: Array<{
        insertAtOffset: number;
        imageUrl: string;
        altText: string;
      }> = [];

      for (const section of sectionsToProcess) {
        try {
          const prompt = await generateChapterImagePrompt(
            section.textContent,
            args.style
          );
          const falResult = await generateImageWithFAL(prompt);
          const storageId = await uploadImageToConvex(ctx, falResult.url);
          const publicUrl = await ctx.runQuery(
            internal.scriptIllustrationMutations.getStorageUrl,
            { storageId }
          );

          if (!publicUrl) continue;

          const altText = `Illustration for: ${section.textContent
            .slice(0, 80)
            .replace(/"/g, "&quot;")}`;

          imagesToInsert.push({
            insertAtOffset: section.insertAtOffset,
            imageUrl: publicUrl,
            altText,
          });

          if (section !== sectionsToProcess[sectionsToProcess.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (err: any) {
          console.error(
            `Image generation failed for section ${section.sectionIndex}:`,
            err.message
          );
        }
      }

      if (imagesToInsert.length === 0) {
        return {
          chapterId: args.chapterId,
          imagesGenerated: 0,
          success: false,
          error: "All image generations failed",
        };
      }

      const updatedHtml = insertImagesIntoHtml(workingHtml, imagesToInsert);

      await ctx.runMutation(internal.courses.updateChapterDescription, {
        chapterId: args.chapterId,
        description: updatedHtml,
      });

      return {
        chapterId: args.chapterId,
        imagesGenerated: imagesToInsert.length,
        success: true,
      };
    } catch (error: any) {
      return {
        chapterId: args.chapterId,
        imagesGenerated: 0,
        success: false,
        error: error.message,
      };
    }
  },
});
