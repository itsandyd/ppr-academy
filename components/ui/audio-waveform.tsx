"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";

interface AudioWaveformProps {
  src: string;
  className?: string;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  waveColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  showPlayButton?: boolean;
  interactive?: boolean;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function AudioWaveform({
  src,
  className,
  height = 64,
  barWidth = 3,
  barGap = 2,
  barRadius = 2,
  waveColor = "hsl(var(--muted-foreground) / 0.3)",
  progressColor = "hsl(var(--primary))",
  backgroundColor = "transparent",
  showPlayButton = true,
  interactive = true,
  onSeek,
  onPlay,
  onPause,
  onEnded,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  // Generate waveform data from audio
  const generateWaveform = useCallback(async (audioUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get audio data from the first channel
      const channelData = audioBuffer.getChannelData(0);
      const samples = 100; // Number of bars
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }

      // Normalize the waveform
      const maxValue = Math.max(...waveform);
      const normalized = waveform.map((v) => v / maxValue);

      setWaveformData(normalized);
      setDuration(audioBuffer.duration);
      audioContext.close();
    } catch (err) {
      console.error("Error generating waveform:", err);
      setError("Failed to load audio");
      // Generate fallback random waveform
      const fallback = Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
      setWaveformData(fallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize waveform on mount
  useEffect(() => {
    if (src) {
      generateWaveform(src);
    }
  }, [src, generateWaveform]);

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const centerY = height / 2;
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.floor(width / totalBarWidth);

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Resample waveform data to match number of bars
    const resampledData: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const index = Math.floor((i / numBars) * waveformData.length);
      resampledData.push(waveformData[index] || 0);
    }

    // Draw bars
    resampledData.forEach((value, i) => {
      const x = i * totalBarWidth;
      const barHeight = Math.max(4, value * (height - 8)); // Min height of 4px
      const y = centerY - barHeight / 2;

      // Determine if this bar is before or after the progress point
      const progressX = progress * width;
      const isBeforeProgress = x + barWidth <= progressX;
      const isPartiallyFilled = x < progressX && x + barWidth > progressX;

      if (isBeforeProgress) {
        // Fully colored bar
        ctx.fillStyle = progressColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      } else if (isPartiallyFilled) {
        // Draw background bar
        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();

        // Draw progress overlay
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, 0, progressX - x, height);
        ctx.clip();
        ctx.fillStyle = progressColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
        ctx.restore();
      } else {
        // Background bar
        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      }
    });
  }, [waveformData, progress, height, barWidth, barGap, barRadius, waveColor, progressColor, backgroundColor]);

  // Redraw on changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => drawWaveform();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawWaveform]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      onEnded?.();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onPlay, onPause, onEnded]);

  // Handle click to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !audioRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickProgress = clickX / rect.width;
    const newTime = clickProgress * duration;

    audioRef.current.currentTime = newTime;
    setProgress(clickProgress);
    onSeek?.(newTime);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Failed to play:", err);
        setError("Failed to play audio");
      });
    }
  };

  // Format time
  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {showPlayButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={togglePlay}
            disabled={isLoading || !!error}
            className="h-10 w-10 p-0 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        )}

        <div
          ref={containerRef}
          className="flex-1 relative"
          style={{ height: `${height}px` }}
        >
          <canvas
            ref={canvasRef}
            className={cn(
              "w-full h-full",
              interactive && "cursor-pointer hover:opacity-90 transition-opacity"
            )}
            onClick={handleCanvasClick}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{formatTime(progress * duration)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
