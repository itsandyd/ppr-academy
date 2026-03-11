"use client";

import React, { Component, useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as RemotionLib from "remotion";

// ─── Error boundary to catch render-time errors (e.g., NaN frame values) ────
class RenderErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) {
    return { error: `${err.name}: ${err.message}` };
  }
  componentDidCatch(err: Error) {
    console.error("DynamicVideoPlayerShell: RENDER ERROR\n", err.message, "\n", err.stack);
  }
  render() {
    if (this.state.error) {
      return (
        <AbsoluteFill
          style={{
            backgroundColor: "#0a0a0a",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            padding: "40px",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>
            Render Error
          </div>
          <div
            style={{
              color: "#f59e0b",
              fontSize: 13,
              fontFamily: "monospace",
              marginTop: 16,
              textAlign: "left",
              padding: "12px 16px",
              backgroundColor: "#1a1a2e",
              borderRadius: 8,
              border: "1px solid #f59e0b33",
              maxWidth: 600,
              maxHeight: 200,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.error}
          </div>
          <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginTop: 8 }}>
            Check browser console (F12) for full stack trace
          </div>
        </AbsoluteFill>
      );
    }
    return this.props.children;
  }
}
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
 * Diagnose which expected variables are missing from the provided scope objects.
 * Returns a list of names that are undefined, helping pinpoint what the generated
 * code references that the shell doesn't provide.
 */
function diagnoseMissingScope(
  remotion: Record<string, unknown>,
  components: Record<string, unknown>,
  theme: Record<string, unknown>
): string[] {
  const missing: string[] = [];
  const expectedRemotionKeys = [
    "AbsoluteFill", "Sequence", "useCurrentFrame", "useVideoConfig",
    "spring", "interpolate", "Img", "Audio",
  ];
  const expectedComponentKeys = [
    "CenterScene", "Content", "FadeUp", "useExit", "BG", "CinematicBG",
    "GlowOrb", "GridPattern", "ScanLine", "FeatureCard", "StepRow",
    "ReasonCard", "TierCard", "StatCounter", "StatBlock", "StatBig",
    "WaveformVisual", "GradientText", "SectionLabel", "CTAButton",
    "LogoIcon", "ConnectorLine",
  ];
  for (const k of expectedRemotionKeys) {
    if (remotion[k] === undefined) missing.push(`Remotion.${k}`);
  }
  for (const k of expectedComponentKeys) {
    if (components[k] === undefined) missing.push(`Components.${k}`);
  }
  if (theme.C === undefined) missing.push("Theme.C");
  if (theme.F === undefined) missing.push("Theme.F");
  return missing;
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
    // ── Scope diagnostic: verify nothing was tree-shaken or is undefined ──
    const missingKeys = diagnoseMissingScope(
      RemotionLib as unknown as Record<string, unknown>,
      ComponentLib as unknown as Record<string, unknown>,
      ThemeLib as unknown as Record<string, unknown>
    );
    if (missingKeys.length > 0) {
      const msg = `Scope missing: ${missingKeys.join(", ")}`;
      console.error("DynamicVideoPlayerShell: " + msg);
      return { component: null, error: msg };
    }

    // Step 1: Transpile JSX → React.createElement calls
    let jsCode: string;
    try {
      jsCode = transpileCode(generatedCode);
    } catch (err: any) {
      const msg = `Transpilation error: ${err.message}`;
      console.error(
        "DynamicVideoPlayerShell: TRANSPILE FAILED\n",
        "Error:", err.message, "\n",
        "Stack:", err.stack, "\n",
        "Code (first 500 chars):", generatedCode.substring(0, 500)
      );
      return { component: null, error: msg };
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

      const comp = factory(
        React,
        RemotionLib,
        ComponentLib,
        ThemeLib,
        images,
        audioUrl
      );

      if (!comp) {
        const msg = "Generated code did not return a component (return value is falsy)";
        console.error(
          "DynamicVideoPlayerShell: NO RETURN VALUE\n",
          "typeof result:", typeof comp, "\n",
          "Transpiled code (first 500 chars):", jsCode.substring(0, 500), "\n",
          "Original code (first 500 chars):", generatedCode.substring(0, 500)
        );
        return { component: null, error: msg };
      }
      if (typeof comp !== "function") {
        const msg = `Generated code returned ${typeof comp} instead of a function/component`;
        console.error("DynamicVideoPlayerShell: BAD RETURN TYPE\n", msg);
        return { component: null, error: msg };
      }
      return { component: comp, error: null };
    } catch (err: any) {
      const msg = `Execution error: ${err.message}`;
      console.error(
        "DynamicVideoPlayerShell: EXECUTION FAILED\n",
        "Error:", err.message, "\n",
        "Stack:", err.stack, "\n",
        "Original code (first 500 chars):", generatedCode.substring(0, 500), "\n",
        "Transpiled code (first 500 chars):",
        (() => { try { return transpileCode(generatedCode).substring(0, 500); } catch { return "(transpile also failed)"; } })()
      );
      return { component: null, error: msg };
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
          padding: "40px",
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
            color: "#f59e0b",
            fontSize: 13,
            fontFamily: "monospace",
            marginTop: 16,
            textAlign: "left",
            padding: "12px 16px",
            backgroundColor: "#1a1a2e",
            borderRadius: 8,
            border: "1px solid #f59e0b33",
            maxWidth: 600,
            maxHeight: 200,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {result.error || "The composition could not be loaded for preview."}
        </div>
        <div
          style={{
            color: "#64748b",
            fontSize: 11,
            fontFamily: "monospace",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Check browser console (F12) for full stack trace and code dump
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <RenderErrorBoundary>
      <result.component />
    </RenderErrorBoundary>
  );
};
