"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Render mode is determined by environment:
 *   - If REMOTION_SERVE_URL and REMOTION_FUNCTION_NAME are set → Lambda (production)
 *   - Otherwise → local rendering via @remotion/renderer (development)
 *
 * Lambda rendering is 3-5x faster (10-30s vs 60-90s) and scales to 100+ concurrent renders.
 */
function isLambdaMode(): boolean {
  return !!(process.env.REMOTION_SERVE_URL && process.env.REMOTION_FUNCTION_NAME);
}

export const renderVideo = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    generatedCode: v.string(),
    imageUrls: v.array(v.string()),
    audioUrl: v.optional(v.string()),
    totalFrames: v.number(),
    width: v.number(),
    height: v.number(),
  },
  returns: v.object({
    videoStorageId: v.id("_storage"),
    renderDurationSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    const mode = isLambdaMode() ? "lambda" : "local";

    if (mode === "lambda") {
      return await renderViaLambda(ctx, args);
    } else {
      return await renderLocally(ctx, args);
    }
  },
});

// ---------------------------------------------------------------------------
// Lambda rendering (production)
// ---------------------------------------------------------------------------

async function renderViaLambda(
  ctx: any,
  args: {
    jobId: Id<"videoJobs">;
    generatedCode: string;
    imageUrls: string[];
    audioUrl?: string;
    totalFrames: number;
    width: number;
    height: number;
  }
): Promise<{ videoStorageId: Id<"_storage">; renderDurationSeconds: number }> {
  const {
    renderMediaOnLambda,
    getRenderProgress,
  } = await import("@remotion/lambda/client");
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const region = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as "us-east-1";
  const serveUrl = process.env.REMOTION_SERVE_URL!;
  const functionName = process.env.REMOTION_FUNCTION_NAME!;

  // Ensure AWS credentials are available in the environment for the Remotion Lambda client.
  // Convex actions have env vars in process.env, but the Remotion SDK looks for specific keys.
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials not configured. Set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY in your Convex deployment environment variables."
    );
  }
  // Remotion Lambda client reads these from process.env automatically
  process.env.REMOTION_AWS_ACCESS_KEY_ID = accessKeyId;
  process.env.REMOTION_AWS_SECRET_ACCESS_KEY = secretAccessKey;

  const startTime = Date.now();

  // Start the Lambda render
  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: "DynamicVideo",
    codec: "h264",
    inputProps: {
      generatedCode: args.generatedCode,
      images: args.imageUrls,
      audioUrl: args.audioUrl ?? null,
      duration: args.totalFrames,
      width: args.width,
      height: args.height,
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

  // Poll for completion
  let lastReportedProgress = 0;
  let outputFile: string | null = null;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region,
    });

    if (progress.fatalErrorEncountered) {
      const errorMessages = progress.errors.map((e: unknown) =>
        typeof e === "string" ? e : JSON.stringify(e)
      );
      throw new Error(`Lambda render failed: ${errorMessages.join("; ")}`);
    }

    // Report progress every ~10%
    const pct = Math.round(progress.overallProgress * 100);
    if (pct >= lastReportedProgress + 10) {
      lastReportedProgress = pct;
      // Map render progress (0-100) to pipeline progress (70-95)
      const pipelineProgress = 70 + Math.round(progress.overallProgress * 25);
      await ctx.runMutation(
        internal.videosPipeline.jobMutations.updateJobStatus,
        { jobId: args.jobId, status: "rendering", progress: pipelineProgress }
      );
    }

    if (progress.done) {
      outputFile = progress.outputFile ?? null;
      break;
    }
  }

  if (!outputFile) {
    throw new Error("Lambda render completed but no output file URL was returned.");
  }

  console.log("[renderVideo] outputFile URL:", outputFile);
  console.log("[renderVideo] bucketName:", bucketName);
  console.log("[renderVideo] AWS creds defined:", {
    accessKeyId: !!accessKeyId,
    secretAccessKey: !!secretAccessKey,
  });

  // Try fetching the outputFile URL directly first (it may already be accessible).
  let videoResponse = await fetch(outputFile);

  if (!videoResponse.ok) {
    console.log(`[renderVideo] Direct fetch failed (${videoResponse.status}), falling back to presigned URL`);

    // Generate a presigned URL to download the rendered MP4 from S3.
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Extract the S3 object key from the outputFile URL.
    // Handle both virtual-hosted-style (bucket.s3.region.amazonaws.com/key)
    // and path-style (s3.region.amazonaws.com/bucket/key) URLs.
    const outputUrl = new URL(outputFile);
    let objectKey: string;

    if (outputUrl.hostname.includes(".s3.") && !outputUrl.hostname.startsWith("s3.")) {
      // Virtual-hosted-style: bucket is in the hostname
      objectKey = outputUrl.pathname.startsWith("/")
        ? outputUrl.pathname.slice(1)
        : outputUrl.pathname;
    } else {
      // Path-style: bucket is the first segment of the path
      const pathParts = outputUrl.pathname.replace(/^\//, "").split("/");
      // First segment is the bucket name, rest is the key
      objectKey = pathParts.slice(1).join("/");
    }

    // URL-decode the key (S3 keys may contain encoded characters)
    objectKey = decodeURIComponent(objectKey);

    console.log("[renderVideo] Extracted objectKey:", objectKey);

    const presignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
      { expiresIn: 900 }
    );

    videoResponse = await fetch(presignedUrl);
    if (!videoResponse.ok) {
      throw new Error(
        `Failed to download rendered video from S3: ${videoResponse.statusText} (status: ${videoResponse.status}, bucket: ${bucketName}, key: ${objectKey})`
      );
    }
  }

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  const fileSize = videoBuffer.length;

  const uploadUrl: string = await ctx.runMutation(
    internal.videosPipeline.jobMutations.generateUploadUrl,
    {}
  );

  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "video/mp4" },
    body: videoBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error(`Failed to upload video to Convex: ${uploadResult.statusText}`);
  }

  const uploadJson: any = await uploadResult.json();
  const videoStorageId = uploadJson.storageId as Id<"_storage">;

  const renderDurationSeconds = (Date.now() - startTime) / 1000;

  await ctx.runMutation(
    internal.videosPipeline.jobMutations.updateJobVideo,
    {
      jobId: args.jobId,
      videoId: videoStorageId,
      videoDuration: args.totalFrames / 30,
      fileSize,
      renderDuration: renderDurationSeconds,
    }
  );

  return { videoStorageId, renderDurationSeconds };
}

// ---------------------------------------------------------------------------
// Local rendering (development)
// ---------------------------------------------------------------------------

async function renderLocally(
  ctx: any,
  args: {
    jobId: Id<"videoJobs">;
    generatedCode: string;
    imageUrls: string[];
    audioUrl?: string;
    totalFrames: number;
    width: number;
    height: number;
  }
): Promise<{ videoStorageId: Id<"_storage">; renderDurationSeconds: number }> {
  const startTime = Date.now();

  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const path = await import("path");
  const fs = await import("fs");
  const os = await import("os");

  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `ppr-video-${args.jobId}-${Date.now()}.mp4`);

  try {
    // Bundle the Remotion project
    const entryPoint = path.resolve(process.cwd(), "..", "remotion", "index.ts");
    const alternatePaths = [
      path.resolve("remotion", "index.ts"),
      path.resolve("..", "remotion", "index.ts"),
      path.resolve(process.cwd(), "remotion", "index.ts"),
    ];

    let resolvedEntry = entryPoint;
    for (const p of [entryPoint, ...alternatePaths]) {
      if (fs.existsSync(p)) {
        resolvedEntry = p;
        break;
      }
    }

    const bundleLocation = await bundle({ entryPoint: resolvedEntry });

    // Select the composition
    const inputProps = {
      generatedCode: args.generatedCode,
      images: args.imageUrls,
      audioUrl: args.audioUrl ?? null,
      duration: args.totalFrames,
      width: args.width,
      height: args.height,
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "DynamicVideo",
      inputProps,
    });

    // Render the video
    let lastProgress = 0;
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      onProgress: async ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct >= lastProgress + 10) {
          lastProgress = pct;
          const pipelineProgress = 70 + Math.round(progress * 25);
          await ctx.runMutation(
            internal.videosPipeline.jobMutations.updateJobStatus,
            { jobId: args.jobId, status: "rendering", progress: pipelineProgress }
          );
        }
      },
    });

    // Upload the MP4 to Convex storage
    const videoBuffer = fs.readFileSync(outputPath);
    const fileSize = videoBuffer.length;

    const uploadUrl: string = await ctx.runMutation(
      internal.videosPipeline.jobMutations.generateUploadUrl,
      {}
    );

    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "video/mp4" },
      body: videoBuffer,
    });

    if (!uploadResult.ok) {
      throw new Error(`Failed to upload video to Convex: ${uploadResult.statusText}`);
    }

    const uploadJson: any = await uploadResult.json();
    const videoStorageId = uploadJson.storageId as Id<"_storage">;

    const renderDurationSeconds = (Date.now() - startTime) / 1000;

    await ctx.runMutation(
      internal.videosPipeline.jobMutations.updateJobVideo,
      {
        jobId: args.jobId,
        videoId: videoStorageId,
        videoDuration: args.totalFrames / 30,
        fileSize,
        renderDuration: renderDurationSeconds,
      }
    );

    return { videoStorageId, renderDurationSeconds };
  } finally {
    try {
      const fs = await import("fs");
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}
