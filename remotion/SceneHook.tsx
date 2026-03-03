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

// Scene 1: The Hook — 150 frames (5 seconds) at 30fps
// "Someone downloads your free sample pack. You get their email. Then nothing happens."

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Notification card slides down from top at frame 15 ──
  const cardSpring = spring({
    fps,
    frame: frame - 15,
    config: { damping: 60, stiffness: 140 },
  });
  const cardY = interpolate(cardSpring, [0, 1], [-400, 0]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // ── "You get their email." fades in at frame 45 ──
  const textSpring = spring({
    fps,
    frame: frame - 45,
    config: { damping: 200 },
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [20, 0]);

  // ── Cursor blink starts at frame 75 ──
  const cursorVisible = frame >= 75;
  // Blink cycle: 15 frames on, 15 frames off
  const blinkCycle = cursorVisible ? Math.floor((frame - 75) / 15) % 2 === 0 : false;

  // ── Card dims to 60% opacity from frame 90-150 ──
  const cardDim = interpolate(frame, [90, 130], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Indigo glow behind card
  const glowOpacity = interpolate(cardSpring, [0, 1], [0, 0.4]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#18181b",
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Indigo glow behind card */}
      <div
        style={{
          position: "absolute",
          top: 760,
          width: 600,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)",
          filter: "blur(60px)",
          opacity: glowOpacity,
        }}
      />

      {/* Notification card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity * cardDim,
          backgroundColor: "#27272a",
          border: "1px solid #3f3f46",
          borderRadius: 20,
          padding: "24px 36px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 8px 40px rgba(99,102,241,0.2)",
        }}
      >
        {/* Mail icon */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>

        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          New Subscriber
        </span>
      </div>

      {/* "You get their email." text */}
      <div
        style={{
          marginTop: 60,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "#ffffff",
          }}
        >
          You get their email.
        </span>
      </div>

      {/* Cursor blink - represents "nothing happens" */}
      {cursorVisible && (
        <div
          style={{
            marginTop: 40,
            width: 2,
            height: 36,
            backgroundColor: "#ffffff",
            opacity: blinkCycle ? 0.8 : 0,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
