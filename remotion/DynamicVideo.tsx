import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";
import * as ComponentLib from "./components";
import * as ThemeLib from "./theme";

/**
 * DynamicVideo — The shell that executes LLM-generated code at render time.
 *
 * The generated code is a function body that receives:
 *   - React (the React library)
 *   - Remotion (all remotion exports: AbsoluteFill, Sequence, spring, etc.)
 *   - Components (the component library: FadeUp, CenterScene, etc.)
 *   - Theme (C colors + F font family)
 *   - images (string[] of image URLs)
 *   - audioUrl (string | null)
 *
 * And returns a React component that is the video composition.
 */
export const DynamicVideo: React.FC<{
  generatedCode: string;
  images: string[];
  audioUrl: string | null;
}> = ({ generatedCode, images, audioUrl }) => {
  const VideoComponent = useMemo(() => {
    try {
      // Create a function from the generated code string.
      // The function receives React, Remotion, Components, Theme, images, audioUrl
      // and must return a React component.
      const factory = new Function(
        "React",
        "Remotion",
        "Components",
        "Theme",
        "images",
        "audioUrl",
        generatedCode
      );

      const Component = factory(
        React,
        RemotionLib,
        ComponentLib,
        ThemeLib,
        images,
        audioUrl
      );

      return Component;
    } catch (err) {
      console.error("DynamicVideo: Failed to create component from code:", err);
      return null;
    }
  }, [generatedCode, images, audioUrl]);

  // Error fallback — show a dark frame instead of crashing the render
  if (!VideoComponent) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#ef4444",
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          Render Error
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            marginTop: 16,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          The generated composition could not be loaded.
        </div>
      </AbsoluteFill>
    );
  }

  // Wrap in error boundary behavior — if the component throws during render,
  // catch it and show the fallback. Since React error boundaries don't work
  // in Remotion's render pipeline the same way, we use try/catch in useMemo above.
  return <VideoComponent />;
};
