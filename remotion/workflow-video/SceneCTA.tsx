import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";
import { CenterScene } from "../components";

// ═══════════════════════════════════════════════════════════════════════════
// SCENE 6 — CTA (53-60s, frames 1590-1800)
// "Comment PPR and I'll show you how to build this."
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowSceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Comment PPR" springs in big
  const mainSpring = spring({
    fps,
    frame: frame - 15,
    config: { damping: 12, stiffness: 120 },
  });
  const mainScale = interpolate(mainSpring, [0, 1], [0.6, 1]);
  const mainOp = interpolate(mainSpring, [0, 1], [0, 1]);

  // Subtitle fades up
  const subSpring = spring({
    fps,
    frame: frame - 40,
    config: { damping: 200 },
  });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOp = interpolate(subSpring, [0, 1], [0, 1]);

  // Brand fades in
  const brandOp = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle glow pulse on "PPR"
  const glowPulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

  return (
    <CenterScene tint={C.primary}>
      {/* Main CTA */}
      <div
        style={{
          opacity: mainOp,
          transform: `scale(${mainScale})`,
          textAlign: "center" as const,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            fontFamily: F,
            color: C.white,
            lineHeight: 1.1,
          }}
        >
          Comment{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 ${20 * glowPulse}px ${C.primary}50)`,
            }}
          >
            PPR
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          fontSize: 24,
          color: "#a1a1aa",
          fontFamily: F,
          fontWeight: 400,
          textAlign: "center" as const,
          lineHeight: 1.5,
          maxWidth: 380,
        }}
      >
        and I'll show you how
        <br />
        to build this.
      </div>

      {/* PausePlayRepeat branding */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: brandOp,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Simple logo mark — play triangle */}
        <svg width="32" height="32" viewBox="0 0 32 32">
          <polygon
            points="10,6 26,16 10,26"
            fill={C.primary}
            opacity={0.8}
          />
        </svg>
        <span
          style={{
            fontSize: 15,
            color: "#52525b",
            fontFamily: F,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
          }}
        >
          PausePlayRepeat
        </span>
      </div>
    </CenterScene>
  );
};
