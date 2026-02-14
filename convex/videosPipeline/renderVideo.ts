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
    console.log(
      `🎬 Starting ${mode} render: ${args.totalFrames} frames at ${args.width}x${args.height}`
    );

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

  const region = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as "us-east-1";
  const serveUrl = process.env.REMOTION_SERVE_URL!;
  const functionName = process.env.REMOTION_FUNCTION_NAME!;

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

  console.log(`☁️ Lambda render started: renderId=${renderId}`);

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
      console.log(`   Lambda render progress: ${pct}%`);
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

  console.log("✅ Lambda render complete, downloading to upload to Convex storage...");

  // Download the rendered MP4 from S3 and re-upload to Convex storage
  const videoResponse = await fetch(outputFile);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download rendered video from S3: ${videoResponse.statusText}`);
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

  console.log(
    `✅ Video uploaded: ${videoStorageId} (${(fileSize / 1024 / 1024).toFixed(1)}MB, rendered in ${renderDurationSeconds.toFixed(1)}s via Lambda)`
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
    console.log("📦 Bundling Remotion project...");

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

    console.log(`   Entry point: ${resolvedEntry}`);

    const bundleLocation = await bundle({ entryPoint: resolvedEntry });
    console.log(`   Bundle complete: ${bundleLocation}`);

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
    console.log("🎥 Rendering video locally...");

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
          console.log(`   Render progress: ${pct}%`);
          const pipelineProgress = 70 + Math.round(progress * 25);
          await ctx.runMutation(
            internal.videosPipeline.jobMutations.updateJobStatus,
            { jobId: args.jobId, status: "rendering", progress: pipelineProgress }
          );
        }
      },
    });

    console.log("✅ Local render complete");

    // Upload the MP4 to Convex storage
    console.log("📤 Uploading video to storage...");

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

    console.log(
      `✅ Video uploaded: ${videoStorageId} (${(fileSize / 1024 / 1024).toFixed(1)}MB, rendered in ${renderDurationSeconds.toFixed(1)}s locally)`
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
