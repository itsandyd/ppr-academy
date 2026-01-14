"use client";

import MuxPlayerComponent from "@mux/mux-player-react";

interface MuxPlayerProps {
  playbackId: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  startTime?: number;
  accentColor?: string;
}

export function MuxPlayer({
  playbackId,
  title,
  className,
  autoPlay = false,
  muted = false,
  onTimeUpdate,
  onEnded,
  onPlay,
  onPause,
  startTime = 0,
  accentColor = "#10b981", // emerald-500
}: MuxPlayerProps) {
  return (
    <MuxPlayerComponent
      playbackId={playbackId}
      metadata={{
        video_title: title,
      }}
      streamType="on-demand"
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      startTime={startTime}
      accentColor={accentColor}
      onTimeUpdate={(e) => {
        const target = e.target as HTMLVideoElement;
        onTimeUpdate?.(target.currentTime);
      }}
      onEnded={onEnded}
      onPlay={onPlay}
      onPause={onPause}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        borderRadius: "0.5rem",
      }}
    />
  );
}

// Thumbnail component for video previews
interface MuxThumbnailProps {
  playbackId: string;
  time?: number;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export function MuxThumbnail({
  playbackId,
  time = 0,
  width = 640,
  height = 360,
  className,
  alt = "Video thumbnail",
}: MuxThumbnailProps) {
  const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=${width}&height=${height}`;

  return (
    <img
      src={thumbnailUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
    />
  );
}

// Animated GIF preview
interface MuxGifProps {
  playbackId: string;
  start?: number;
  end?: number;
  width?: number;
  fps?: number;
  className?: string;
}

export function MuxGif({
  playbackId,
  start = 0,
  end = 5,
  width = 320,
  fps = 15,
  className,
}: MuxGifProps) {
  const gifUrl = `https://image.mux.com/${playbackId}/animated.gif?start=${start}&end=${end}&width=${width}&fps=${fps}`;

  return (
    <img
      src={gifUrl}
      alt="Video preview"
      width={width}
      className={className}
      loading="lazy"
    />
  );
}
