import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";
import {
  BEAT_LEASE_VOICEOVER_COMPOSITION_ID,
  beatLeaseVoiceoverScenes,
} from "./compositions/social/beatLeaseVoiceover";

// Load environment variables from .env
dotenv.config();

const outputDirectory = path.join(
  process.cwd(),
  "public",
  "voiceover",
  BEAT_LEASE_VOICEOVER_COMPOSITION_ID,
);

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const preferredVoiceName = process.env.ELEVENLABS_VOICE_NAME?.trim() || "Andrew 1";
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

const assertEnv = () => {
  if (!elevenLabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY is required to generate voiceover.");
  }
};

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
};

const fetchVoices = async (): Promise<ElevenLabsVoice[]> => {
  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "xi-api-key": elevenLabsApiKey!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { voices?: ElevenLabsVoice[] };
  return data.voices ?? [];
};

const pickVoice = async () => {
  const voices = await fetchVoices();

  if (voices.length === 0) {
    throw new Error("No ElevenLabs voices are available for this account.");
  }

  if (!preferredVoiceName) {
    return voices[0];
  }

  const matched = voices.find(
    (voice) => voice.name.toLowerCase() === preferredVoiceName.toLowerCase(),
  );

  if (!matched) {
    throw new Error(
      `Could not find ElevenLabs voice named "${preferredVoiceName}". Available voices: ${voices
        .map((voice) => voice.name)
        .join(", ")}`,
    );
  }

  return matched;
};

const generateSceneAudio = async (voiceId: string, sceneId: string, text: string) => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": elevenLabsApiKey!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate ${sceneId}: ${response.status} ${await response.text()}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(outputDirectory, `${sceneId}.mp3`);
  await writeFile(outputPath, audioBuffer);
  return outputPath;
};

const main = async () => {
  assertEnv();
  await mkdir(outputDirectory, { recursive: true });

  const voice = await pickVoice();
  console.log(`Using ElevenLabs voice: ${voice.name}`);

  for (const scene of beatLeaseVoiceoverScenes) {
    const outputPath = await generateSceneAudio(voice.voice_id, scene.id, scene.text);
    console.log(`Generated ${scene.id}: ${outputPath}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
