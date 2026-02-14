/**
 * Render a video on Remotion Lambda.
 *
 * This module exports `renderOnLambda` — a function that triggers a render on AWS Lambda,
 * polls for completion, and returns the output URL (S3 public/presigned URL).
 *
 * Used by convex/videosPipeline/renderVideo.ts in production mode.
 *
 * Required env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   REMOTION_SERVE_URL       — S3 URL of the deployed Remotion site
 *   REMOTION_FUNCTION_NAME   — name of the deployed Lambda function
 *
 * Optional env vars:
 *   REMOTION_AWS_REGION (default: us-east-1)
 */

import {
  renderMediaOnLambda,
  getRenderProgress,
  presignUrl,
} from "@remotion/lambda/client";
import type { AwsRegion } from "@remotion/lambda/client";

const REGION = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as AwsRegion;
const POLL_INTERVAL_MS = 2000;

export interface LambdaRenderInput {
  generatedCode: string;
  imageUrls: string[];
  audioUrl: string | null;
  totalFrames: number;
  width: number;
  height: number;
  /** Called with progress 0-1 */
  onProgress?: (progress: number) => void | Promise<void>;
}

export interface LambdaRenderOutput {
  /** Public or presigned URL of the rendered MP4 */
  outputUrl: string;
  /** S3 bucket where the render is stored */
  bucketName: string;
  /** Unique render ID for this job */
  renderId: string;
  /** Render duration in seconds */
  renderDurationSeconds: number;
}

/**
 * Trigger a render on Remotion Lambda and wait for completion.
 */
export async function renderOnLambda(
  input: LambdaRenderInput
): Promise<LambdaRenderOutput> {
  const serveUrl = process.env.REMOTION_SERVE_URL;
  const functionName = process.env.REMOTION_FUNCTION_NAME;

  if (!serveUrl) {
    throw new Error(
      "REMOTION_SERVE_URL is not set. Run `npx tsx remotion/lambda/deploy.ts` first."
    );
  }
  if (!functionName) {
    throw new Error(
      "REMOTION_FUNCTION_NAME is not set. Run `npx tsx remotion/lambda/deploy.ts` first."
    );
  }

  const startTime = Date.now();

  // Start the render
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName,
    serveUrl,
    composition: "DynamicVideo",
    codec: "h264",
    inputProps: {
      generatedCode: input.generatedCode,
      images: input.imageUrls,
      audioUrl: input.audioUrl,
      duration: input.totalFrames,
      width: input.width,
      height: input.height,
    },
    imageFormat: "jpeg",
    maxRetries: 2,
    framesPerLambda: 20,
    privacy: "no-acl",
    downloadBehavior: {
      type: "download",
      fileName: "video.mp4",
    },
  });

  console.log(`Lambda render started: renderId=${renderId}, bucket=${bucketName}`);

  // Poll for completion
  let outputFile: string | null = null;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region: REGION,
    });

    if (progress.fatalErrorEncountered) {
      const errorMessages = progress.errors.map((e) =>
        typeof e === "string" ? e : JSON.stringify(e)
      );
      throw new Error(
        `Lambda render failed: ${errorMessages.join("; ")}`
      );
    }

    // Report progress
    if (input.onProgress) {
      await input.onProgress(progress.overallProgress);
    }

    if (progress.done) {
      outputFile = progress.outputFile ?? null;
      break;
    }
  }

  const renderDurationSeconds = (Date.now() - startTime) / 1000;

  // If the file is private, generate a presigned URL (valid for 1 hour)
  let outputUrl: string;
  if (outputFile) {
    outputUrl = outputFile;
  } else {
    // Fallback: generate a presigned URL from the render output key
    const finalProgress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region: REGION,
    });

    if (finalProgress.outKey) {
      const signed = await presignUrl({
        region: REGION,
        bucketName,
        objectKey: finalProgress.outKey,
        expiresInSeconds: 3600,
        checkIfObjectExists: true,
      });
      if (!signed) {
        throw new Error("Rendered file not found in S3 after completion.");
      }
      outputUrl = signed;
    } else {
      throw new Error("Lambda render completed but no output file was produced.");
    }
  }

  console.log(`Lambda render complete in ${renderDurationSeconds.toFixed(1)}s: ${outputUrl}`);

  return {
    outputUrl,
    bucketName,
    renderId,
    renderDurationSeconds,
  };
}
