"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { createFalClient } from "@fal-ai/client";

const ASPECT_RATIO_SIZES: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
};

/**
 * Step 3: Generate images for each scene using Fal.ai Flux model.
 *
 * Runs all image generations in parallel. If an individual image fails,
 * the pipeline continues — null is stored for that slot so the video
 * can still render with missing images.
 */
export const generateImages = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    imagePrompts: v.array(v.string()),
    aspectRatio: v.string(), // "9:16" | "16:9" | "1:1"
  },
  returns: v.object({
    storageIds: v.array(v.union(v.id("_storage"), v.null())),
    successCount: v.number(),
    failCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      throw new Error("FAL_KEY not configured. Add it to your Convex deployment settings.");
    }

    const falClient = createFalClient();
    const size = ASPECT_RATIO_SIZES[args.aspectRatio] || ASPECT_RATIO_SIZES["9:16"];

    console.log(
      `🎨 Generating ${args.imagePrompts.length} images at ${size.width}x${size.height}`
    );

    // Generate all images in parallel
    const results = await Promise.allSettled(
      args.imagePrompts.map(async (prompt, index) => {
        const enhancedPrompt = `${prompt}, high quality, cinematic lighting, dark moody atmosphere, professional, 8k`;
        console.log(`   [${index + 1}/${args.imagePrompts.length}] Generating: "${prompt.substring(0, 60)}..."`);

        const result = await falClient.run("fal-ai/flux/dev", {
          input: {
            prompt: enhancedPrompt,
            image_size: size,
            num_inference_steps: 28,
            num_images: 1,
          },
        });

        const imageData = result.data as any;
        if (!imageData?.images?.[0]?.url) {
          throw new Error("No image URL in Fal.ai response");
        }

        return imageData.images[0].url as string;
      })
    );

    // Upload successful images to Convex storage
    const storageIds: (Id<"_storage"> | null)[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        try {
          const storageId = await uploadImageToStorage(ctx, result.value);
          storageIds.push(storageId);
          successCount++;
          console.log(`   ✅ Image ${i + 1} uploaded: ${storageId}`);
        } catch (uploadErr: any) {
          console.error(`   ❌ Image ${i + 1} upload failed:`, uploadErr.message);
          storageIds.push(null);
          failCount++;
        }
      } else {
        console.error(`   ❌ Image ${i + 1} generation failed:`, result.reason?.message);
        storageIds.push(null);
        failCount++;
      }
    }

    // Update job with image IDs (filter out nulls for the DB field)
    const validIds = storageIds.filter((id): id is Id<"_storage"> => id !== null);
    await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobImages, {
      jobId: args.jobId,
      imageIds: validIds,
    });

    console.log(`🎨 Image generation complete: ${successCount} succeeded, ${failCount} failed`);

    return { storageIds, successCount, failCount };
  },
});

// ─── Upload Helper ──────────────────────────────────────────────────────────

async function uploadImageToStorage(ctx: any, imageUrl: string): Promise<Id<"_storage">> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  // Get upload URL from Convex
  const uploadUrl: string = await ctx.runMutation(
    internal.videosPipeline.jobMutations.generateUploadUrl,
    {}
  );

  // Upload to Convex storage
  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: arrayBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error(`Failed to upload image to Convex: ${uploadResult.statusText}`);
  }

  const uploadJson: any = await uploadResult.json();
  return uploadJson.storageId as Id<"_storage">;
}
