"use client";

import React, { useMemo } from "react";
import { Player } from "@remotion/player";
import { DynamicVideoPlayerShell } from "./DynamicVideoPlayerShell";

interface VideoPreviewProps {
  generatedCode: string;
  images: string[];
  audioUrl: string | null;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * In-browser video preview using @remotion/player.
 *
 * Shows a playable preview of the generated Remotion composition
 * without needing a full MP4 render. Creators see their video
 * instantly after code generation (~25s) instead of waiting for
 * the full render (~60s+).
 */
export function VideoPreview({
  generatedCode,
  images,
  audioUrl,
  durationInFrames,
  fps,
  width,
  height,
}: VideoPreviewProps) {
  const inputProps = useMemo(
    () => ({
      generatedCode,
      images,
      audioUrl,
    }),
    [generatedCode, images, audioUrl]
  );

  return (
    <div className="w-full">
      <Player
        component={DynamicVideoPlayerShell}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        style={{
          width: "100%",
          aspectRatio:
            width > height
              ? `${width}/${height}`
              : width === height
                ? "1/1"
                : `${width}/${height}`,
          maxHeight: 600,
        }}
        controls
        autoPlay={false}
        loop
        clickToPlay
      />
    </div>
  );
}
