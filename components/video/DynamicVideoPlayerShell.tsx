"use client";

import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";
import * as ComponentLib from "../../remotion/components";
import * as ThemeLib from "../../remotion/theme";

/**
 * A client-side shell component for the @remotion/player.
 *
 * This mirrors the DynamicVideo composition from remotion/DynamicVideo.tsx
 * but is designed to run in the browser via the Player component
 * (not in the Remotion Lambda render pipeline).
 *
 * It receives generatedCode as a prop and executes it in a sandboxed
 * Function constructor, passing React, Remotion, Components, Theme,
 * images, and audioUrl as parameters.
 */
export const DynamicVideoPlayerShell: React.FC<{
  generatedCode: string;
  images: string[];
  audioUrl: string | null;
}> = ({ generatedCode, images, audioUrl }) => {
  const VideoComponent = useMemo(() => {
    try {
      const factory = new Function(
        "React",
        "Remotion",
        "Components",
        "Theme",
        "images",
        "audioUrl",
        generatedCode
      );

      return factory(
        React,
        RemotionLib,
        ComponentLib,
        ThemeLib,
        images,
        audioUrl
      );
    } catch (err) {
      console.error(
        "DynamicVideoPlayerShell: Failed to create component:",
        err
      );
      return null;
    }
  }, [generatedCode, images, audioUrl]);

  if (!VideoComponent) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: "#ef4444",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          Preview Error
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            marginTop: 12,
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          The composition could not be loaded for preview.
        </div>
      </AbsoluteFill>
    );
  }

  return <VideoComponent />;
};
