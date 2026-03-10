"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Step 7: Post-processing — generate thumbnail, SRT subtitles, and social caption.
 *
 * - Thumbnail: render a still frame at ~30% through the video
 * - SRT: generate subtitles from word-level timestamps
 * - Caption: generate a social media caption from the script content
 */
export const postProcess = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    generatedCode: v.string(),
    imageUrls: v.array(v.string()),
    audioUrl: v.optional(v.string()),
    totalFrames: v.number(),
    width: v.number(),
    height: v.number(),
    scriptId: v.id("videoScripts"),
    audioWords: v.optional(
      v.array(
        v.object({
          word: v.string(),
          start: v.number(),
          end: v.number(),
        })
      )
    ),
  },
  returns: v.object({
    thumbnailId: v.optional(v.id("_storage")),
    srtContent: v.optional(v.string()),
    caption: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let thumbnailId: Id<"_storage"> | undefined;
    let srtContent: string | undefined;
    let caption: string | undefined;

    // Fetch script for caption generation
    const script = await ctx.runQuery(internal.videos.getScriptInternal, {
      scriptId: args.scriptId,
    });

    // ── Generate Thumbnail ────────────────────────────────────────────
    // Use Remotion Lambda to render a still frame (avoids needing local Chrome/Puppeteer).
    // Falls back gracefully if Lambda env vars are not configured.
    try {
      const serveUrl = process.env.REMOTION_SERVE_URL;
      const functionName = process.env.REMOTION_FUNCTION_NAME;
      const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

      if (!serveUrl || !functionName || !accessKeyId || !secretAccessKey) {
        console.warn("⚠️ Skipping thumbnail: Lambda env vars not configured");
      } else {
        // Ensure Remotion Lambda client can find credentials
        process.env.REMOTION_AWS_ACCESS_KEY_ID = accessKeyId;
        process.env.REMOTION_AWS_SECRET_ACCESS_KEY = secretAccessKey;

        const region = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as "us-east-1";
        const thumbnailFrame = Math.round(args.totalFrames * 0.3);

        const inputProps = {
          generatedCode: args.generatedCode,
          images: args.imageUrls,
          audioUrl: args.audioUrl ?? null,
          duration: args.totalFrames,
          width: args.width,
          height: args.height,
        };

        let stillUrl: string | null = null;

        try {
          const { renderStillOnLambda } = await import("@remotion/lambda/client");
          console.log("[postProcess] renderStillOnLambda type:", typeof renderStillOnLambda);

          const result = await renderStillOnLambda({
            region,
            functionName,
            serveUrl,
            composition: "DynamicVideo",
            inputProps,
            frame: thumbnailFrame,
            imageFormat: "png",
            privacy: "no-acl",
          });

          console.log("[postProcess] renderStillOnLambda result keys:", Object.keys(result));

          // Remotion v4 returns { url, bucketName, renderId, ... }
          // Use the URL directly if available
          if ('url' in result && typeof (result as any).url === 'string') {
            stillUrl = (result as any).url;
          } else {
            // Fall back to constructing a presigned URL
            const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
            const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

            const s3Client = new S3Client({
              region,
              credentials: { accessKeyId, secretAccessKey },
            });

            const objectKey = `stills/${result.renderId}/out.png`;
            console.log("[postProcess] Constructed still objectKey:", objectKey);

            stillUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({ Bucket: result.bucketName, Key: objectKey }),
              { expiresIn: 300 }
            );
          }
        } catch (stillErr: any) {
          console.error("⚠️ renderStillOnLambda failed:", stillErr.message, stillErr.stack);
          // Non-fatal — skip thumbnail
        }

        if (stillUrl) {
          const thumbResponse = await fetch(stillUrl);
          if (thumbResponse.ok) {
            const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());

            const uploadUrl: string = await ctx.runMutation(
              internal.videosPipeline.jobMutations.generateUploadUrl,
              {}
            );

            const uploadResult = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": "image/png" },
              body: thumbBuffer,
            });

            if (uploadResult.ok) {
              const uploadJson: any = await uploadResult.json();
              thumbnailId = uploadJson.storageId as Id<"_storage">;
            } else {
              console.warn("⚠️ Thumbnail upload failed:", uploadResult.status, uploadResult.statusText);
            }
          } else {
            console.warn("⚠️ Thumbnail download failed:", thumbResponse.status, thumbResponse.statusText);
          }
        }
      }
    } catch (err: any) {
      console.error("⚠️ Thumbnail generation failed:", err.message);
      // Non-fatal — continue
    }

    // ── Generate SRT Subtitles ────────────────────────────────────────
    if (args.audioWords && args.audioWords.length > 0) {
      try {
        srtContent = generateSRT(args.audioWords);
      } catch (err: any) {
        console.error("⚠️ SRT generation failed:", err.message);
      }
    }

    // ── Generate Social Media Caption ─────────────────────────────────
    if (script) {
      try {
        caption = generateCaption(script);
      } catch (err: any) {
        console.error("⚠️ Caption generation failed:", err.message);
      }
    }

    // Store all artifacts on the job
    await ctx.runMutation(
      internal.videosPipeline.jobMutations.updateJobPostProcess,
      {
        jobId: args.jobId,
        thumbnailId,
        srtContent,
        caption,
      }
    );

    return { thumbnailId, srtContent, caption };
  },
});

// ─── SRT Generation ─────────────────────────────────────────────────────────

/**
 * Generate SRT subtitles from word-level timestamps.
 * Groups words into ~6-8 word chunks timed to the audio.
 */
function generateSRT(
  words: Array<{ word: string; start: number; end: number }>
): string {
  const WORDS_PER_CUE = 7;
  const cues: string[] = [];
  let cueIndex = 1;

  for (let i = 0; i < words.length; i += WORDS_PER_CUE) {
    const chunk = words.slice(i, i + WORDS_PER_CUE);
    if (chunk.length === 0) continue;

    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end;
    const text = chunk.map((w) => w.word).join(" ");

    cues.push(
      `${cueIndex}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${text}`
    );
    cueIndex++;
  }

  return cues.join("\n\n");
}

function formatSRTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// ─── Caption Generation ─────────────────────────────────────────────────────

/**
 * Generate a social media caption from the video script.
 * Uses the script content directly rather than calling an LLM (fast + cheap).
 */
function generateCaption(script: any): string {
  const scenes = script.scenes || [];
  const hookScene = scenes.find((s: any) => s.id === "hook") || scenes[0];
  const ctaScene =
    scenes.find((s: any) => s.id === "cta") || scenes[scenes.length - 1];

  let caption = "";

  // Hook line
  if (hookScene?.onScreenText?.headline) {
    caption += hookScene.onScreenText.headline;
  } else if (hookScene?.voiceover) {
    // Take first sentence of voiceover
    const firstSentence = hookScene.voiceover.split(/[.!?]/)[0];
    caption += firstSentence;
  }

  caption += "\n\n";

  // Add voiceover summary or key bullet points
  const solutionScene = scenes.find(
    (s: any) => s.id === "solution" || s.id === "features"
  );
  if (solutionScene?.onScreenText?.bulletPoints) {
    for (const bp of solutionScene.onScreenText.bulletPoints.slice(0, 3)) {
      caption += `→ ${bp}\n`;
    }
    caption += "\n";
  }

  // CTA
  if (ctaScene?.onScreenText?.headline) {
    caption += ctaScene.onScreenText.headline;
  }

  caption += "\n\n";

  // Hashtags based on content
  const hashtags = [
    "#musicproduction",
    "#musicproducer",
    "#beatmaker",
    "#producertips",
    "#mixingtips",
  ];

  // Add topic-specific hashtags based on palette colors or keywords
  const fullText = scenes.map((s: any) => s.voiceover || "").join(" ");
  if (/saturat|distort/i.test(fullText)) hashtags.push("#saturation", "#mixing");
  if (/beat|lease|licens/i.test(fullText)) hashtags.push("#beatlease", "#beatstars");
  if (/email|automat/i.test(fullText)) hashtags.push("#emailmarketing", "#musicbusiness");
  if (/course|learn/i.test(fullText)) hashtags.push("#musiccourse", "#learnmusic");
  if (/sample|808|drum/i.test(fullText)) hashtags.push("#samples", "#drums");

  caption += hashtags.slice(0, 15).join(" ");

  return caption.trim();
}
