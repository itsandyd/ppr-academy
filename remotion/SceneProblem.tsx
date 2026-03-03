import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

// Scene 4: The Problem — 300 frames (10 seconds) at 30fps
// "Most producers never send email two or three.
//  They send the free download and disappear."
//
// Local frame 0 = global frame 900
// Frame 0: full three-step timeline visible
// Frame 60: cards 2 and 3 fade + red strikethrough
// Frame 120: card 1 pulses
// Frame 180: "Most producers stop here." text

const COLORS = {
  bg: "#18181b",
  card: "#27272a",
  border: "#3f3f46",
  white: "#ffffff",
  zinc400: "#a1a1aa",
  zinc700: "#3f3f46",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  green: "#22c55e",
  red: "#ef4444",
};

// Simplified step data (same layout as SceneThreeEmails)
const steps = [
  { number: 1, accent: COLORS.indigo, title: "Deliver the freebie", subtitle: "Send the pack. Say thanks." },
  { number: 2, accent: COLORS.violet, title: "Show something paid", subtitle: "Here's the full bundle." },
  { number: 3, accent: COLORS.green, title: "Give a reason to act", subtitle: "20% off. 48 hours. Done." },
];

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startY = 380;
  const stepHeight = 280;
  const lineX = 160;
  const nodeRadius = 22;

  // ── Cards 2 & 3 fade at frame 60 ──
  const fadeProgress = interpolate(frame, [60, 90], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Red strikethrough draws across cards 2 & 3 at frame 60 ──
  const strikeProgress = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Card 1 pulse glow at frame 120 ──
  const pulseSpring = spring({
    fps,
    frame: frame - 120,
    config: { damping: 15, stiffness: 100 },
  });
  const pulseGlow = interpolate(pulseSpring, [0, 1], [0, 0.5]);

  // ── "Most producers stop here." text at frame 180 ──
  const textSpring = spring({
    fps,
    frame: frame - 180,
    config: { damping: 200 },
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
      {steps.map((step, i) => {
        const nodeY = startY + i * stepHeight;
        const isDimmed = i > 0;
        const currentOpacity = isDimmed ? fadeProgress : 1;
        const nodeAccent = isDimmed && frame >= 90 ? COLORS.zinc700 : step.accent;

        return (
          <React.Fragment key={i}>
            {/* Vertical line between nodes */}
            {i < 2 && (
              <svg
                style={{
                  position: "absolute",
                  left: lineX - 1,
                  top: nodeY + nodeRadius + 4,
                  width: 4,
                  height: stepHeight - nodeRadius * 2 - 8,
                  opacity: i === 0 ? 1 : fadeProgress,
                }}
              >
                <line
                  x1={2}
                  y1={0}
                  x2={2}
                  y2={stepHeight - nodeRadius * 2 - 8}
                  stroke={i === 0 ? step.accent : COLORS.zinc700}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              </svg>
            )}

            {/* Circle node */}
            <div
              style={{
                position: "absolute",
                left: lineX - nodeRadius,
                top: nodeY - nodeRadius,
                width: nodeRadius * 2,
                height: nodeRadius * 2,
                borderRadius: "50%",
                border: `2px solid ${nodeAccent}`,
                backgroundColor: COLORS.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: currentOpacity,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: nodeAccent }}>
                {step.number}
              </span>
            </div>

            {/* Card */}
            <div
              style={{
                position: "absolute",
                left: 220,
                top: nodeY - 40,
                right: 80,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                borderLeft: `4px solid ${isDimmed && frame >= 90 ? COLORS.zinc700 : step.accent}`,
                border: `1px solid ${COLORS.border}`,
                borderLeftWidth: 4,
                borderLeftColor: isDimmed && frame >= 90 ? COLORS.zinc700 : step.accent,
                padding: "20px 24px",
                opacity: currentOpacity,
                overflow: "hidden",
              }}
            >
              {/* Card 1 glow */}
              {i === 0 && pulseGlow > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: 20,
                    boxShadow: `0 0 30px rgba(99,102,241,${pulseGlow})`,
                    pointerEvents: "none",
                  }}
                />
              )}

              <span style={{ fontSize: 26, fontWeight: 700, color: COLORS.white }}>
                {step.title}
              </span>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 20, color: COLORS.zinc400 }}>
                  {step.subtitle}
                </span>
              </div>

              {/* Red strikethrough for cards 2 & 3 */}
              {isDimmed && strikeProgress > 0 && (
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2={`${strikeProgress * 100}%`}
                    y2={`${strikeProgress * 100}%`}
                    stroke={COLORS.red}
                    strokeWidth={3}
                    strokeOpacity={0.8}
                  />
                </svg>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {/* ── "Most producers stop here." ── */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <span style={{ fontSize: 44, fontWeight: 700, color: COLORS.white }}>
          Most producers stop here.
        </span>
      </div>
    </AbsoluteFill>
  );
};
