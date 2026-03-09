"use client";

import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";
import { transform } from "sucrase";
// Explicit named imports prevent production tree-shaking from removing components
// that are only referenced dynamically inside `new Function()` generated code.
import {
  GlowOrb,
  GridPattern,
  ScanLine,
  BG,
  CinematicBG,
  CenterScene,
  Content,
  FadeUp,
  useExit,
  FeatureCard,
  StepRow,
  ReasonCard,
  TierCard,
  StatCounter,
  StatBlock,
  StatBig,
  WaveformVisual,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  ConnectorLine,
} from "../../remotion/components";
import { C, F } from "../../remotion/theme";

// Build objects explicitly so the bundler sees every export is used.
const ComponentLib = {
  GlowOrb,
  GridPattern,
  ScanLine,
  BG,
  CinematicBG,
  CenterScene,
  Content,
  FadeUp,
  useExit,
  FeatureCard,
  StepRow,
  ReasonCard,
  TierCard,
  StatCounter,
  StatBlock,
  StatBig,
  WaveformVisual,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  ConnectorLine,
};

const ThemeLib = { C, F };

/**
 * Transpile JSX/TypeScript in generated code to plain JS so `new Function()` can execute it.
 * The LLM outputs JSX (<AbsoluteFill>, <Sequence>, etc.) but `new Function()` only
 * understands plain JavaScript. Sucrase handles this fast and without config.
 */
function transpileCode(code: string): string {
  const { code: transpiled } = transform(code, {
    transforms: ["jsx", "typescript"],
    jsxRuntime: "classic",
    production: true,
  });
  return transpiled;
}

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
  const result = useMemo<{
    component: React.FC | null;
    error: string | null;
  }>(() => {
    try {
      // Transpile JSX → React.createElement calls
      const jsCode = transpileCode(generatedCode);

      const factory = new Function(
        "React",
        "Remotion",
        "Components",
        "Theme",
        "images",
        "audioUrl",
        jsCode
      );

      const comp = factory(
        React,
        RemotionLib,
        ComponentLib,
        ThemeLib,
        images,
        audioUrl
      );

      if (!comp) {
        return {
          component: null,
          error: "Generated code did not return a component",
        };
      }
      return { component: comp, error: null };
    } catch (err: any) {
      console.error(
        "DynamicVideoPlayerShell: Failed to create component:",
        err
      );
      return { component: null, error: err.message || String(err) };
    }
  }, [generatedCode, images, audioUrl]);

  if (!result.component) {
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
            maxWidth: 500,
          }}
        >
          {result.error || "The composition could not be loaded for preview."}
        </div>
      </AbsoluteFill>
    );
  }

  return <result.component />;
};
