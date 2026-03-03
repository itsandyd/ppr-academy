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

// Scene 6: The CTA — 300 frames (10 seconds) at 30fps
// "Comment PPR and we'll DM you the link."
//
// Local frame 0 = global frame 1500
// Frame 0-15: everything fades out (handled by sequence, start clean)
// Frame 30: dark empty screen beat
// Frame 60: "Comment PPR" springs in
// Frame 120: "and we'll DM you the link" fades in
// Frame 180: comment bubble icon pops in
// Frame 210: "pauseplayrepeat.com" fades in at bottom

const COLORS = {
  bg: "#18181b",
  white: "#ffffff",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  indigo: "#6366f1",
};

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── "Comment PPR" springs in at frame 60 ──
  const mainSpring = spring({
    fps,
    frame: frame - 60,
    config: { damping: 30, stiffness: 160 },
  });
  const mainScale = interpolate(mainSpring, [0, 1], [0.85, 1]);
  const mainOpacity = interpolate(mainSpring, [0, 1], [0, 1]);

  // ── Subtitle fades in at frame 120 ──
  const subSpring = spring({
    fps,
    frame: frame - 120,
    config: { damping: 200 },
  });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // ── Comment bubble icon pops in at frame 180 ──
  const bubbleSpring = spring({
    fps,
    frame: frame - 180,
    config: { damping: 20, stiffness: 200 },
  });
  const bubbleScale = interpolate(bubbleSpring, [0, 1], [0, 1]);
  const bubbleOpacity = interpolate(bubbleSpring, [0, 1], [0, 1]);

  // ── URL fades in at frame 210 ──
  const urlSpring = spring({
    fps,
    frame: frame - 210,
    config: { damping: 200 },
  });
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);

  // ── Subtle radial indigo glow ──
  const glowOpacity = interpolate(mainSpring, [0, 1], [0, 0.08]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Radial indigo glow background */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.indigo}, transparent 70%)`,
          opacity: glowOpacity,
          filter: "blur(40px)",
        }}
      />

      {/* Comment bubble icon */}
      <div
        style={{
          transform: `scale(${bubbleScale})`,
          opacity: bubbleOpacity,
          marginBottom: 40,
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.indigo}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* "Comment PPR" */}
      <div
        style={{
          transform: `scale(${mainScale})`,
          opacity: mainOpacity,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.white,
          }}
        >
          Comment PPR
        </span>
      </div>

      {/* "and we'll DM you the link" */}
      <div style={{ marginTop: 24, opacity: subOpacity }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: COLORS.zinc400,
          }}
        >
          and we&apos;ll DM you the link
        </span>
      </div>

      {/* pauseplayrepeat.com */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          opacity: urlOpacity,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: COLORS.zinc500,
          }}
        >
          pauseplayrepeat.com
        </span>
      </div>
    </AbsoluteFill>
  );
};
