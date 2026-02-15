"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

/**
 * Step 4: Generate voiceover audio using ElevenLabs TTS.
 *
 * Generates MP3 audio with word-level timestamps for sync.
 * If voiceId is not provided or the API key is missing, this step is skipped gracefully.
 */
export const generateVoice = internalAction({
  args: {
    jobId: v.id("videoJobs"),
    voiceoverScript: v.string(),
    voiceId: v.optional(v.string()),
  },
  returns: v.object({
    audioStorageId: v.optional(v.id("_storage")),
    duration: v.optional(v.number()),
    words: v.optional(
      v.array(
        v.object({
          word: v.string(),
          start: v.number(),
          end: v.number(),
        })
      )
    ),
    skipped: v.boolean(),
    skipReason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Skip if no voice ID provided
    if (!args.voiceId) {
      return { skipped: true, skipReason: "no_voice_id" };
    }

    // Skip if no API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { skipped: true, skipReason: "no_api_key" };
    }

    const elevenlabs = new ElevenLabsClient({ apiKey });

    try {
      // Generate audio with timestamps for word-level sync
      const result = await elevenlabs.textToSpeech.convertWithTimestamps(args.voiceId, {
        text: args.voiceoverScript,
        modelId: "eleven_multilingual_v2",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.3,
          useSpeakerBoost: true,
        },
      });

      // Extract audio bytes and word timestamps from the streaming response
      const audioChunks: Buffer[] = [];
      const words: Array<{ word: string; start: number; end: number }> = [];
      let audioDuration = 0;

      // The response contains alignment data with character-level timestamps
      // and audio chunks. We need to process both.
      const resultData = result as any;

      if (resultData.audio_base64) {
        // Direct base64 audio response
        audioChunks.push(Buffer.from(resultData.audio_base64, "base64"));
      }

      // Extract word-level alignment if available
      if (resultData.alignment) {
        const alignment = resultData.alignment;
        if (alignment.characters && alignment.character_start_times_seconds && alignment.character_end_times_seconds) {
          // Group characters into words
          let currentWord = "";
          let wordStart = 0;
          let wordEnd = 0;

          for (let i = 0; i < alignment.characters.length; i++) {
            const char = alignment.characters[i];
            const start = alignment.character_start_times_seconds[i];
            const end = alignment.character_end_times_seconds[i];

            if (char === " " || i === alignment.characters.length - 1) {
              if (i === alignment.characters.length - 1 && char !== " ") {
                currentWord += char;
                wordEnd = end;
              }
              if (currentWord.trim()) {
                words.push({
                  word: currentWord.trim(),
                  start: wordStart,
                  end: wordEnd,
                });
              }
              currentWord = "";
              wordStart = end;
            } else {
              if (currentWord === "") {
                wordStart = start;
              }
              currentWord += char;
              wordEnd = end;
            }
          }

          // Duration is the end time of the last character
          const lastEnd = alignment.character_end_times_seconds;
          audioDuration = lastEnd[lastEnd.length - 1] || 0;
        }
      }

      // If we got audio chunks, upload to Convex storage
      if (audioChunks.length > 0) {
        const audioBuffer = Buffer.concat(audioChunks);
        const storageId = await uploadAudioToStorage(ctx, audioBuffer);

        // Update job with audio ID
        await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobAudio, {
          jobId: args.jobId,
          audioId: storageId,
        });

        return {
          audioStorageId: storageId,
          duration: audioDuration,
          words: words.length > 0 ? words : undefined,
          skipped: false,
        };
      }

      // Fallback: generate audio without timestamps using convert()
      const basicAudio = await elevenlabs.textToSpeech.convert(args.voiceId, {
        text: args.voiceoverScript,
        modelId: "eleven_multilingual_v2",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.3,
          useSpeakerBoost: true,
        },
      });

      // Read the stream into a buffer
      const chunks: Uint8Array[] = [];
      const reader = (basicAudio as ReadableStream<Uint8Array>).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const fullBuffer = Buffer.alloc(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const storageId = await uploadAudioToStorage(ctx, fullBuffer);

      await ctx.runMutation(internal.videosPipeline.jobMutations.updateJobAudio, {
        jobId: args.jobId,
        audioId: storageId,
      });

      return {
        audioStorageId: storageId,
        skipped: false,
      };
    } catch (err: any) {
      console.error("❌ Voice generation failed:", err.message);
      // Don't throw — voice is optional, pipeline should continue
      return {
        skipped: true,
        skipReason: `error: ${err.message}`,
      };
    }
  },
});

// ─── Upload Helper ──────────────────────────────────────────────────────────

async function uploadAudioToStorage(ctx: any, audioBuffer: Buffer): Promise<Id<"_storage">> {
  const uploadUrl: string = await ctx.runMutation(
    internal.videosPipeline.jobMutations.generateUploadUrl,
    {}
  );

  const uploadResult = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: audioBuffer,
  });

  if (!uploadResult.ok) {
    throw new Error(`Failed to upload audio to Convex: ${uploadResult.statusText}`);
  }

  const uploadJson: any = await uploadResult.json();
  return uploadJson.storageId as Id<"_storage">;
}
