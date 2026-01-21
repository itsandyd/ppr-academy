/**
 * Audio Analyzer - BPM and Key Detection
 *
 * Uses Web Audio API for audio analysis and heuristics for music metadata detection.
 * This is a client-side implementation that provides approximate results.
 */

export interface AudioMetadata {
  bpm: number | null;
  key: string | null;
  duration: number;
  sampleRate: number;
}

export interface DetectionProgress {
  stage: "loading" | "decoding" | "analyzing" | "complete" | "error";
  progress: number;
  message: string;
}

// Musical key names
const KEY_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/**
 * Detect BPM using onset detection and autocorrelation
 */
async function detectBPM(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: number) => void
): Promise<number | null> {
  try {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Downsample for faster processing
    const downsampleFactor = 4;
    const downsampled = new Float32Array(
      Math.floor(channelData.length / downsampleFactor)
    );
    for (let i = 0; i < downsampled.length; i++) {
      downsampled[i] = channelData[i * downsampleFactor];
    }

    const effectiveSampleRate = sampleRate / downsampleFactor;

    // Calculate onset detection function using energy differences
    const hopSize = Math.floor(effectiveSampleRate * 0.01); // 10ms hops
    const frameSize = Math.floor(effectiveSampleRate * 0.04); // 40ms frames
    const numFrames = Math.floor(downsampled.length / hopSize) - 1;

    const onsets = new Float32Array(numFrames);
    let prevEnergy = 0;

    for (let i = 0; i < numFrames; i++) {
      const start = i * hopSize;
      const end = Math.min(start + frameSize, downsampled.length);
      let energy = 0;

      for (let j = start; j < end; j++) {
        energy += downsampled[j] * downsampled[j];
      }

      // Half-wave rectified spectral flux
      const flux = Math.max(0, energy - prevEnergy);
      onsets[i] = flux;
      prevEnergy = energy;

      if (onProgress && i % 100 === 0) {
        onProgress((i / numFrames) * 0.5);
      }
    }

    // Autocorrelation to find periodic tempo
    const minBPM = 60;
    const maxBPM = 200;
    const minLag = Math.floor((60 / maxBPM) * (effectiveSampleRate / hopSize));
    const maxLag = Math.floor((60 / minBPM) * (effectiveSampleRate / hopSize));

    let bestCorrelation = 0;
    let bestLag = minLag;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      const numSamples = Math.min(onsets.length - lag, 1000);

      for (let i = 0; i < numSamples; i++) {
        correlation += onsets[i] * onsets[i + lag];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }

      if (onProgress && lag % 10 === 0) {
        onProgress(0.5 + ((lag - minLag) / (maxLag - minLag)) * 0.5);
      }
    }

    // Convert lag to BPM
    const bpm = (60 * effectiveSampleRate) / (hopSize * bestLag);

    // Round to nearest integer and ensure reasonable range
    const roundedBPM = Math.round(bpm);
    if (roundedBPM >= 60 && roundedBPM <= 200) {
      return roundedBPM;
    }

    // Try double/half tempo if out of range
    if (roundedBPM < 60 && roundedBPM * 2 <= 200) {
      return Math.round(roundedBPM * 2);
    }
    if (roundedBPM > 200 && roundedBPM / 2 >= 60) {
      return Math.round(roundedBPM / 2);
    }

    return null;
  } catch (error) {
    console.error("BPM detection error:", error);
    return null;
  }
}

/**
 * Simple key detection using chroma features
 */
async function detectKey(audioBuffer: AudioBuffer): Promise<string | null> {
  try {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Take a sample from the middle of the track (more likely to have melody)
    const sampleLength = Math.min(
      sampleRate * 10,
      Math.floor(channelData.length / 2)
    );
    const startOffset = Math.floor(channelData.length / 4);
    const sample = channelData.slice(startOffset, startOffset + sampleLength);

    // Simple frequency analysis using zero-crossing rate and energy
    // This is a simplified approach - real key detection would use FFT and chroma features
    let zeroCrossings = 0;
    let energy = 0;

    for (let i = 1; i < sample.length; i++) {
      if ((sample[i] >= 0 && sample[i - 1] < 0) || (sample[i] < 0 && sample[i - 1] >= 0)) {
        zeroCrossings++;
      }
      energy += sample[i] * sample[i];
    }

    // Estimate fundamental frequency from zero-crossing rate
    const avgZeroCrossingRate = zeroCrossings / (sample.length / sampleRate);
    const estimatedFreq = avgZeroCrossingRate / 2;

    // Map frequency to musical note (A4 = 440Hz reference)
    const a4 = 440;
    const semitones = 12 * Math.log2(estimatedFreq / a4);
    const noteIndex = Math.round(semitones) % 12;
    const normalizedIndex = noteIndex < 0 ? noteIndex + 12 : noteIndex;

    // A is index 9 in our KEY_NAMES array (starting from C)
    const keyIndex = (normalizedIndex + 9) % 12;

    // Determine major/minor based on energy distribution (simplified heuristic)
    const avgEnergy = energy / sample.length;
    const isMinor = avgEnergy < 0.01; // Lower energy often correlates with minor keys (very rough heuristic)

    return `${KEY_NAMES[keyIndex]} ${isMinor ? "minor" : "major"}`;
  } catch (error) {
    console.error("Key detection error:", error);
    return null;
  }
}

/**
 * Main function to analyze audio file and detect metadata
 */
export async function detectMetadata(
  file: File,
  onProgress?: (progress: DetectionProgress) => void
): Promise<AudioMetadata> {
  const report = (
    stage: DetectionProgress["stage"],
    progress: number,
    message: string
  ) => {
    onProgress?.({ stage, progress, message });
  };

  try {
    report("loading", 0, "Loading audio file...");

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    report("decoding", 0.1, "Decoding audio...");

    // Create audio context and decode
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    report("analyzing", 0.2, "Analyzing BPM...");

    // Detect BPM
    const bpm = await detectBPM(audioBuffer, (p) => {
      report("analyzing", 0.2 + p * 0.5, "Analyzing BPM...");
    });

    report("analyzing", 0.75, "Detecting musical key...");

    // Detect key
    const key = await detectKey(audioBuffer);

    report("complete", 1, "Analysis complete!");

    // Close audio context
    await audioContext.close();

    return {
      bpm,
      key,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  } catch (error) {
    report("error", 0, `Analysis failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Check if file is a supported audio format
 */
export function isAudioFile(file: File): boolean {
  const audioTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/aiff",
    "audio/x-aiff",
    "audio/ogg",
    "audio/flac",
  ];

  return (
    audioTypes.includes(file.type) ||
    /\.(mp3|wav|aiff|ogg|flac)$/i.test(file.name)
  );
}
