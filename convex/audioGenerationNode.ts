"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Internal Node.js action to call ElevenLabs API
export const generateSoundEffectFromText = internalAction({
  args: {
    description: v.string(),
    duration: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    filePath: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    audioUrl: v.optional(v.string()),
    format: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      
      // Check for API key
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error(
          "ELEVENLABS_API_KEY environment variable is required. " +
          "Add it to your Convex deployment settings at https://dashboard.convex.dev"
        );
      }
      
      // Initialize ElevenLabs client
      const elevenlabs = new ElevenLabsClient({
        apiKey,
      });
      
      // Generate sound effect
      const audio = await elevenlabs.textToSoundEffects.convert({
        text: args.description,
        durationSeconds: args.duration,
        promptInfluence: 0.3, // Balance between description and natural sound
      });
      
      // Create temporary directory
      const tmpDir = path.join(os.tmpdir(), "convex-samples");
      await fs.mkdir(tmpDir, { recursive: true });
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = args.description
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .substring(0, 50);
      const fileName = `sfx_${sanitizedName}_${timestamp}.mp3`;
      const filePath = path.join(tmpDir, fileName);
      
      // Convert audio stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = audio.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      
      // Concatenate chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const buffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }
      
      await fs.writeFile(filePath, buffer);
      // Upload to Convex storage for preview
      const storageId = await ctx.storage.store(
        new Blob([buffer], { type: "audio/mpeg" })
      );
      
      // Get preview URL
      const audioUrl = await ctx.storage.getUrl(storageId);
      return {
        success: true,
        filePath,
        storageId,
        audioUrl: audioUrl || undefined,
        format: "mp3",
        fileSize: buffer.length,
      };
      
    } catch (error: any) {
      console.error("❌ ElevenLabs generation failed:", error);
      return {
        success: false,
        error: error.message || "Failed to generate sound effect",
      };
    }
  },
});

