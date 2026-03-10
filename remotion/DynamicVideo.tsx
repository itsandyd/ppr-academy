import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";
import { transform } from "sucrase";
// Explicit named imports prevent tree-shaking from removing components
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
} from "./components";
import { C, F } from "./theme";

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
  const result = useMemo<{
    component: React.FC | null;
    error: string | null;
  }>(() => {
    // Step 1: Transpile JSX → React.createElement calls
    let jsCode: string;
    try {
      jsCode = transpileCode(generatedCode);
    } catch (err: any) {
      console.error(
        "DynamicVideo: Transpilation failed:",
        err.message,
        "\nCode (first 300 chars):",
        generatedCode.substring(0, 300)
      );
      return {
        component: null,
        error: `Transpilation error: ${err.message}`,
      };
    }

    // Step 2: Execute the transpiled code
    try {
      const factory = new Function(
        "React",
        "Remotion",
        "Components",
        "Theme",
        "images",
        "audioUrl",
        jsCode
      );

      const Component = factory(
        React,
        RemotionLib,
        ComponentLib,
        ThemeLib,
        images,
        audioUrl
      );

      if (!Component) {
        console.error(
          "DynamicVideo: Code did not return a component.",
          "\nCode (first 300 chars):",
          generatedCode.substring(0, 300)
        );
        return { component: null, error: "Generated code did not return a component" };
      }
      return { component: Component, error: null };
    } catch (err: any) {
      console.error(
        "DynamicVideo: Execution failed:",
        err.message,
        "\nCode (first 300 chars):",
        generatedCode.substring(0, 300)
      );
      return { component: null, error: `Execution error: ${err.message}` };
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
            maxWidth: 800,
          }}
        >
          {result.error || "The generated composition could not be loaded."}
        </div>
      </AbsoluteFill>
    );
  }

  return <result.component />;
};
