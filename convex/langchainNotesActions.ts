"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

// ==================== YOUTUBE TRANSCRIPT EXTRACTION ====================

export const extractYoutubeTranscript = internalAction({
  args: {
    sourceId: v.id("noteSources"),
    videoUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Update status to processing
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "processing",
      });

      // Extract video ID from URL
      const videoId = extractYoutubeVideoId(args.videoUrl);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      // Try different language codes to fetch transcript
      // YouTube auto-generated captions often need specific language codes
      const languagesToTry = ["en", "en-US", "en-GB", "a.en", undefined];
      let transcriptItems: Array<{ text: string }> | null = null;
      let lastError: Error | null = null;

      for (const lang of languagesToTry) {
        try {
          if (lang) {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang });
          } else {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
          }
          if (transcriptItems && transcriptItems.length > 0) {
            break; // Success!
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          // Continue trying other languages
        }
      }

      if (!transcriptItems || transcriptItems.length === 0) {
        // If youtube-transcript fails, provide helpful error message
        const errorMsg = lastError?.message || "Unknown error";
        if (errorMsg.includes("disabled")) {
          throw new Error(
            `Could not fetch transcript for this video. The transcript may be:\n` +
              `• Auto-generated and temporarily unavailable\n` +
              `• Restricted by the video owner\n` +
              `• Only available in a different language\n\n` +
              `Try copying the transcript manually from YouTube (click "...more" under the video, then "Show transcript") and paste it using the "Text" option instead.`
          );
        }
        throw new Error(`Failed to fetch transcript: ${errorMsg}`);
      }

      const transcript = transcriptItems.map((item) => item.text).join(" ");

      // Split content into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitText(transcript);

      // Update source with extracted content
      await ctx.runMutation(internal.langchainNotes.updateSourceContent, {
        sourceId: args.sourceId,
        rawContent: transcript,
        contentChunks: chunks,
        youtubeVideoId: videoId,
        status: "completed",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "failed",
        errorMessage,
      });
    }
    return null;
  },
});

// ==================== WEBSITE CONTENT EXTRACTION ====================

export const extractWebsiteContent = internalAction({
  args: {
    sourceId: v.id("noteSources"),
    websiteUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Update status to processing
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "processing",
      });

      // Fetch website content
      const response = await fetch(args.websiteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PPRAcademy/1.0; +https://ppracademy.com)",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }

      const html = await response.text();

      // Use cheerio to extract text content
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);

      // Remove scripts, styles, and navigation
      $("script, style, nav, header, footer, aside, .sidebar, .menu, .ad, .advertisement").remove();

      // Extract main content
      const title = $("title").text() || $("h1").first().text();
      const mainContent = $("article, main, .content, .post, .entry-content, body").first();
      const textContent = mainContent.text().replace(/\s+/g, " ").trim();

      // Extract metadata
      const author =
        $('meta[name="author"]').attr("content") ||
        $('[rel="author"]').text() ||
        $(".author").first().text();
      const publishedDate =
        $('meta[property="article:published_time"]').attr("content") ||
        $('meta[name="date"]').attr("content") ||
        $("time").first().attr("datetime");
      const domain = new URL(args.websiteUrl).hostname;

      // Split content into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitText(textContent);

      // Update source with extracted content
      await ctx.runMutation(internal.langchainNotes.updateSourceContent, {
        sourceId: args.sourceId,
        rawContent: textContent,
        contentChunks: chunks,
        title: title || undefined,
        websiteDomain: domain,
        websiteAuthor: author || undefined,
        websitePublishedDate: publishedDate || undefined,
        status: "completed",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "failed",
        errorMessage,
      });
    }
    return null;
  },
});

// ==================== PDF CONTENT EXTRACTION ====================

export const extractPdfContent = internalAction({
  args: {
    sourceId: v.id("noteSources"),
    pdfUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Update status to processing
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "processing",
      });

      // Fetch the PDF file from URL
      const response = await fetch(args.pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const pdfBuffer = await response.arrayBuffer();

      // Extract text from PDF using basic approach
      const pdfText = await extractTextFromPdf(pdfBuffer);

      if (!pdfText || pdfText.length < 50) {
        throw new Error(
          "Could not extract readable text from PDF. The PDF may be image-based or protected."
        );
      }

      // Split content into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.splitText(pdfText);

      // Update source with extracted content
      await ctx.runMutation(internal.langchainNotes.updateSourceContent, {
        sourceId: args.sourceId,
        rawContent: pdfText,
        contentChunks: chunks,
        status: "completed",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.langchainNotes.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "failed",
        errorMessage,
      });
    }
    return null;
  },
});

// ==================== AI NOTE GENERATION ====================

type GenerateNotesResult = {
  success: boolean;
  noteId?: Id<"notes">;
  error?: string;
};

export const generateNotesFromSource = action({
  args: {
    sourceId: v.id("noteSources"),
    userId: v.string(),
    storeId: v.string(),
    folderId: v.optional(v.id("noteFolders")),
    noteStyle: v.optional(
      v.union(
        v.literal("summary"),
        v.literal("detailed"),
        v.literal("bullet_points"),
        v.literal("study_guide"),
        v.literal("outline")
      )
    ),
    customPrompt: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    noteId: v.optional(v.id("notes")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<GenerateNotesResult> => {
    try {
      // Get the source
      // @ts-ignore Convex type instantiation too deep
      const source = await ctx.runQuery(internal.langchainNotes.getSource, {
        sourceId: args.sourceId,
      });

      if (!source) {
        return { success: false, error: "Source not found" };
      }

      if (source.status !== "completed" || !source.rawContent) {
        return { success: false, error: "Source content not yet processed" };
      }

      // Initialize OpenAI
      const openai = new OpenAI();

      // Generate note content based on style
      const noteStyle = args.noteStyle || "detailed";
      const systemPrompt = getNoteGenerationPrompt(noteStyle, args.customPrompt);

      // Prepare content (use chunks if too long)
      const content =
        source.rawContent.length > 15000
          ? source.contentChunks?.slice(0, 8).join("\n\n---\n\n") ||
            source.rawContent.slice(0, 15000)
          : source.rawContent;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Source Title: ${source.title}\nSource Type: ${source.sourceType}\n\nContent:\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedContent = completion.choices[0]?.message?.content;
      if (!generatedContent) {
        return { success: false, error: "Failed to generate note content" };
      }

      // Generate summary and key points
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a summarization expert. Extract: 1) A one-paragraph summary, 2) 5-7 key takeaways as bullet points. Format as JSON: {"summary": "...", "keyPoints": ["...", "..."]}',
          },
          { role: "user", content: content.slice(0, 8000) },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      let summary = "";
      let keyPoints: Array<string> = [];
      try {
        const summaryJson = JSON.parse(summaryCompletion.choices[0]?.message?.content || "{}");
        summary = summaryJson.summary || "";
        keyPoints = summaryJson.keyPoints || [];
      } catch {
        summary = summaryCompletion.choices[0]?.message?.content || "";
      }

      // Create the note with HTML formatting
      const noteTitle = generateNoteTitle(source.title, source.sourceType);
      const htmlContent = formatAsHtml(generatedContent, source);

      // Create the note
      // @ts-ignore - Type instantiation is excessively deep
      const noteId = await ctx.runMutation(api.notes.createNote, {
        title: noteTitle,
        content: htmlContent,
        userId: args.userId,
        storeId: args.storeId,
        folderId: args.folderId,
        tags: source.tags || [],
        category: source.sourceType,
        priority: "medium",
        icon: getSourceIcon(source.sourceType),
      });

      // Update the source with generated note info
      await ctx.runMutation(internal.langchainNotes.updateSourceSummary, {
        sourceId: args.sourceId,
        summary,
        keyPoints,
        generatedNoteId: noteId,
      });

      return { success: true, noteId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

// ==================== BATCH NOTE GENERATION ====================

export const generateMultipleNotesFromSource = action({
  args: {
    sourceId: v.id("noteSources"),
    userId: v.string(),
    storeId: v.string(),
    folderId: v.optional(v.id("noteFolders")),
    noteTypes: v.array(
      v.union(
        v.literal("summary"),
        v.literal("detailed"),
        v.literal("bullet_points"),
        v.literal("study_guide"),
        v.literal("outline")
      )
    ),
  },
  returns: v.object({
    success: v.boolean(),
    noteIds: v.array(v.id("notes")),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const noteIds: Array<Id<"notes">> = [];
    const errors: Array<string> = [];

    for (const noteType of args.noteTypes) {
      const result = await ctx.runAction(api.langchainNotesActions.generateNotesFromSource, {
        sourceId: args.sourceId,
        userId: args.userId,
        storeId: args.storeId,
        folderId: args.folderId,
        noteStyle: noteType,
      });

      if (result.success && result.noteId) {
        noteIds.push(result.noteId);
      } else if (result.error) {
        errors.push(`${noteType}: ${result.error}`);
      }
    }

    return {
      success: noteIds.length > 0,
      noteIds,
      errors,
    };
  },
});

// ==================== SOURCE MANAGEMENT ====================

export const createNoteSource = action({
  args: {
    userId: v.string(),
    storeId: v.string(),
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    rawContent: v.optional(v.string()), // For text input
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    sourceId: v.optional(v.id("noteSources")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; sourceId?: Id<"noteSources">; error?: string }> => {
    try {
      const sourceId: Id<"noteSources"> = await ctx.runMutation(internal.langchainNotes.insertNoteSource, {
        userId: args.userId,
        storeId: args.storeId,
        sourceType: args.sourceType,
        title: args.title,
        url: args.url,
        storageId: args.storageId,
        fileName: args.fileName,
        fileSize: args.fileSize,
        rawContent: args.rawContent,
        tags: args.tags,
      });

      if (args.sourceType === "youtube" && args.url) {
        await ctx.scheduler.runAfter(0, internal.langchainNotesActions.extractYoutubeTranscript, {
          sourceId,
          videoUrl: args.url,
        });
      } else if (args.sourceType === "website" && args.url) {
        await ctx.scheduler.runAfter(0, internal.langchainNotesActions.extractWebsiteContent, {
          sourceId,
          websiteUrl: args.url,
        });
      } else if (args.sourceType === "pdf" && args.url) {
        await ctx.scheduler.runAfter(0, internal.langchainNotesActions.extractPdfContent, {
          sourceId,
          pdfUrl: args.url,
        });
      } else if (args.sourceType === "text" && args.rawContent) {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 2000,
          chunkOverlap: 200,
        });
        const chunks = await splitter.splitText(args.rawContent);

        await ctx.runMutation(internal.langchainNotes.updateSourceContent, {
          sourceId,
          rawContent: args.rawContent,
          contentChunks: chunks,
          status: "completed",
        });
      }

      return { success: true, sourceId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

// ==================== HELPER FUNCTIONS ====================

function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = decoder.decode(uint8Array);

  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  const streamMatch = text.match(/stream[\s\S]*?endstream/g);
  if (streamMatch) {
    text = streamMatch
      .map((s) => s.replace(/stream|endstream/g, ""))
      .join(" ")
      .replace(/[^\x20-\x7E\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    text ||
    "PDF content extraction requires additional processing. Please use the text input option to paste your content."
  );
}

function getNoteGenerationPrompt(style: string, customPrompt?: string): string {
  // Base instruction for handling transcripts and poorly formatted content
  const transcriptHandling = `
IMPORTANT: The content may be from an auto-generated transcript or raw text. Please:
- Fix obvious spelling and grammar errors
- Infer correct technical terms and proper nouns based on context
- Clean up repetitions, filler words, and transcription artifacts
- Structure the content logically even if the original is disorganized
`;

  if (customPrompt) {
    return `You are an expert note-taker and educator. 

Context provided by user: ${customPrompt}

Use this context to better understand the content and fix any transcription errors or unclear parts.
${transcriptHandling}
Format your response as rich HTML with proper headings (h2, h3), paragraphs, lists (ul, ol, li), and emphasis (strong, em) where appropriate. Make the content scannable and easy to read.`;
  }

  const prompts: Record<string, string> = {
    summary: `You are an expert note-taker. Create a concise summary of the following content.
${transcriptHandling}
Focus on the main ideas and key takeaways. Format as rich HTML with:
- A brief introduction paragraph
- Key points as a bulleted list
- A conclusion paragraph
Keep it to about 300-500 words.`,

    detailed: `You are an expert note-taker and educator. Create comprehensive, detailed notes from the following content.
${transcriptHandling}
Include:
- All major concepts and ideas with explanations
- Important details and examples
- Connections between ideas
- Definitions of key terms
Format as rich HTML with proper headings (h2, h3), paragraphs, lists, and emphasis. Make it scannable but thorough.`,

    bullet_points: `You are an expert note-taker. Convert the following content into clear, organized bullet points.
${transcriptHandling}
Structure:
- Group related points under topic headings (h2)
- Use nested bullets for sub-points
- Keep each point concise but informative
- Include all important information
Format as rich HTML with headings and nested unordered lists.`,

    study_guide: `You are an expert educator. Create a study guide from the following content.
${transcriptHandling}
Include:
- Learning objectives at the start
- Key concepts with explanations
- Important terms and definitions
- Review questions at the end
- Summary of main takeaways
Format as rich HTML with clear sections, definitions, and numbered/bulleted lists.`,

    outline: `You are an expert note-taker. Create a hierarchical outline of the following content.
${transcriptHandling}
Structure:
- Main topics as h2 headings
- Sub-topics as h3 headings
- Key points as bullets under each section
- Keep it structured and scannable
Format as rich HTML with proper heading hierarchy and nested lists.`,
  };

  return prompts[style] || prompts.detailed;
}

function generateNoteTitle(sourceTitle: string, sourceType: string): string {
  const prefix: Record<string, string> = {
    youtube: "📺 ",
    website: "🌐 ",
    pdf: "📄 ",
    audio: "🎧 ",
    text: "📝 ",
  };

  const cleanTitle = sourceTitle
    .replace(/^\s*-\s*YouTube$/, "")
    .replace(/\s*\|.*$/, "")
    .trim();

  return `${prefix[sourceType] || ""}Notes: ${cleanTitle}`;
}

function getSourceIcon(sourceType: string): string {
  const icons: Record<string, string> = {
    youtube: "📺",
    website: "🌐",
    pdf: "📄",
    audio: "🎧",
    text: "📝",
  };
  return icons[sourceType] || "📝";
}

function formatAsHtml(content: string, source: Record<string, unknown>): string {
  if (content.includes("<h") || content.includes("<p>") || content.includes("<ul>")) {
    return content;
  }

  let html = content
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.*$)/gm, "<li>$2</li>")
    .split("\n\n")
    .map((para) => {
      if (para.includes("<h") || para.includes("<li>")) return para;
      return `<p>${para}</p>`;
    })
    .join("\n");

  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  const sourceInfo: Array<string> = [];
  if (source.url)
    sourceInfo.push(`<a href="${source.url}" target="_blank" rel="noopener">Original Source</a>`);
  if (source.websiteAuthor) sourceInfo.push(`Author: ${source.websiteAuthor}`);
  if (source.youtubeChannel) sourceInfo.push(`Channel: ${source.youtubeChannel}`);

  if (sourceInfo.length > 0) {
    html = `<p class="source-info text-sm text-muted-foreground mb-4">${sourceInfo.join(" • ")}</p>\n${html}`;
  }

  return html;
}
