import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { evolvePath } from "@remotion/paths";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

// Scene 5: The PPR Tie-In — 300 frames (10 seconds) at 30fps
// "PausePlayRepeat makes this easy. Set those three emails once and let it run."
//
// Local frame 0 = global frame 1200
// Frame 0: three-step timeline returns, all lit
// Frame 60: curved arrow animates from below card 3 back to card 1
// Frame 120: "runs automatically" pill badge
// Frame 180: "PausePlayRepeat" text + URL

const COLORS = {
  bg: "#18181b",
  card: "#27272a",
  border: "#3f3f46",
  white: "#ffffff",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  green: "#22c55e",
};

const steps = [
  { number: 1, accent: COLORS.indigo, title: "Deliver the freebie" },
  { number: 2, accent: COLORS.violet, title: "Show something paid" },
  { number: 3, accent: COLORS.green, title: "Give a reason to act" },
];

export const ScenePPR: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startY = 380;
  const stepHeight = 260;
  const lineX = 140;
  const nodeRadius = 20;

  // ── Timeline fades in at start ──
  const timelineSpring = spring({
    fps,
    frame,
    config: { damping: 200 },
  });
  const timelineOpacity = interpolate(timelineSpring, [0, 1], [0, 1]);

  // ── Curved arrow from below card 3 back up to card 1 (frame 60-120) ──
  // Arrow path runs along the left side of the timeline
  const arrowPath = `M ${lineX + 60} ${startY + 2 * stepHeight + 40} C ${lineX - 80} ${startY + 2 * stepHeight} ${lineX - 80} ${startY - 40} ${lineX + 60} ${startY - 60}`;
  const arrowProgress = interpolate(frame, [60, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  let arrowStroke: { strokeDasharray: string; strokeDashoffset: string } | null = null;
  if (arrowProgress > 0) {
    const evolved = evolvePath(arrowProgress, arrowPath);
    arrowStroke = {
      strokeDasharray: evolved.strokeDasharray,
      strokeDashoffset: String(evolved.strokeDashoffset),
    };
  }

  // ── "runs automatically" pill at frame 120 ──
  const pillSpring = spring({
    fps,
    frame: frame - 120,
    config: { damping: 20, stiffness: 200 },
  });
  const pillScale = interpolate(pillSpring, [0, 1], [0, 1]);
  const pillOpacity = interpolate(pillSpring, [0, 1], [0, 1]);

  // ── "PausePlayRepeat" text at frame 180 ──
  const brandSpring = spring({
    fps,
    frame: frame - 180,
    config: { damping: 200 },
  });
  const brandOpacity = interpolate(brandSpring, [0, 1], [0, 1]);

  // ── Subtle EQ bars as background texture ──
  const eqBars = Array.from({ length: 12 }, (_, i) => {
    const barHeight = interpolate(
      Math.sin(frame * 0.08 + i * 1.2),
      [-1, 1],
      [20, 80]
    );
    return barHeight;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
      {/* Subtle EQ bars background */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 0,
          right: 0,
          height: 100,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 12,
          opacity: 0.06,
        }}
      >
        {eqBars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: h,
              backgroundColor: COLORS.indigo,
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {/* Timeline */}
      <div style={{ opacity: timelineOpacity }}>
        {steps.map((step, i) => {
          const nodeY = startY + i * stepHeight;

          return (
            <React.Fragment key={i}>
              {/* Line between nodes */}
              {i < 2 && (
                <svg
                  style={{
                    position: "absolute",
                    left: lineX - 1,
                    top: nodeY + nodeRadius + 4,
                    width: 4,
                    height: stepHeight - nodeRadius * 2 - 8,
                  }}
                >
                  <line
                    x1={2}
                    y1={0}
                    x2={2}
                    y2={stepHeight - nodeRadius * 2 - 8}
                    stroke={step.accent}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                  />
                </svg>
              )}

              {/* Node */}
              <div
                style={{
                  position: "absolute",
                  left: lineX - nodeRadius,
                  top: nodeY - nodeRadius,
                  width: nodeRadius * 2,
                  height: nodeRadius * 2,
                  borderRadius: "50%",
                  border: `2px solid ${step.accent}`,
                  backgroundColor: COLORS.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: step.accent }}>
                  {step.number}
                </span>
              </div>

              {/* Card (compact) */}
              <div
                style={{
                  position: "absolute",
                  left: 200,
                  top: nodeY - 28,
                  right: 100,
                  backgroundColor: COLORS.card,
                  borderRadius: 14,
                  borderLeft: `4px solid ${step.accent}`,
                  border: `1px solid ${COLORS.border}`,
                  borderLeftWidth: 4,
                  borderLeftColor: step.accent,
                  padding: "18px 22px",
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.white }}>
                  {step.title}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Curved arrow SVG */}
      {arrowStroke && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: 1080,
            height: 1920,
          }}
        >
          <path
            d={arrowPath}
            fill="none"
            stroke={COLORS.indigo}
            strokeWidth={3}
            strokeDasharray={arrowStroke.strokeDasharray}
            strokeDashoffset={arrowStroke.strokeDashoffset}
          />
          {/* Arrow head at end */}
          {arrowProgress > 0.9 && (
            <polygon
              points={`${lineX + 60},${startY - 60} ${lineX + 48},${startY - 46} ${lineX + 72},${startY - 46}`}
              fill={COLORS.indigo}
              opacity={interpolate(arrowProgress, [0.9, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          )}
        </svg>
      )}

      {/* "runs automatically" pill badge */}
      <div
        style={{
          position: "absolute",
          left: lineX - 40,
          top: startY + stepHeight - 10,
          transform: `scale(${pillScale})`,
          opacity: pillOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.indigo,
            color: COLORS.white,
            fontSize: 18,
            fontWeight: 600,
            padding: "8px 20px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          runs automatically
        </div>
      </div>

      {/* PausePlayRepeat brand */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: brandOpacity,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: COLORS.white }}>
          PausePlayRepeat
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: COLORS.zinc500,
            marginTop: 10,
          }}
        >
          pauseplayrepeat.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
