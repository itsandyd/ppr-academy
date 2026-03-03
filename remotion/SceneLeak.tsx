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

// Scene 2: The Leak — 210 frames (7 seconds) at 30fps
// "That's the leak. The freebie just opens the door.
//  If you don't say anything after that, people forget you exist in about three days."
//
// Local frame 0 = global frame 150
// Local frame 15: dimmed card from Scene 1 visible at top
// Local frame 15-75: dotted line draws down
// Local frame 75-95: line fades from 100% to 15%
// Local frame 120: "People forget you exist" text
// Local frame 150: "in about 3 days" text

export const SceneLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Dimmed notification card (already present) ──
  const cardOpacity = 0.4;

  // ── Dotted line draws from frame 15 over 60 frames ──
  const lineLength = 500;
  const lineProgress = interpolate(frame, [15, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineDrawn = lineProgress * lineLength;

  // Line fades: full opacity while drawing, then fades 100% → 15%
  const lineFadeOpacity = interpolate(frame, [75, 95], [1, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = frame < 15 ? 0 : lineFadeOpacity;

  // ── "People forget you exist" at frame 120 ──
  const mainTextSpring = spring({
    fps,
    frame: frame - 120,
    config: { damping: 200 },
  });
  const mainTextOpacity = interpolate(mainTextSpring, [0, 1], [0, 1]);
  const mainTextScale = interpolate(mainTextSpring, [0, 1], [0.95, 1]);

  // ── "in about 3 days" at frame 150 ──
  const subTextSpring = spring({
    fps,
    frame: frame - 150,
    config: { damping: 200 },
  });
  const subTextOpacity = interpolate(subTextSpring, [0, 1], [0, 1]);

  const cardCenterY = 420;
  const lineTopY = cardCenterY + 60;
  const textCenterY = 1100;

  return (
    <AbsoluteFill style={{ backgroundColor: "#18181b", fontFamily }}>
      {/* ── Dimmed notification card ── */}
      <div
        style={{
          position: "absolute",
          top: cardCenterY,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: cardOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "#27272a",
            border: "1px solid #3f3f46",
            borderRadius: 20,
            padding: "24px 36px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
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
          <span style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
            New Subscriber
          </span>
        </div>
      </div>

      {/* ── Dotted vertical line ── */}
      {lineProgress > 0 && (
        <svg
          style={{
            position: "absolute",
            left: 540 - 1,
            top: lineTopY,
            width: 4,
            height: lineLength,
            opacity: lineOpacity,
          }}
        >
          <line
            x1={2}
            y1={0}
            x2={2}
            y2={lineDrawn}
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="6 10"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* ── Main text ── */}
      <div
        style={{
          position: "absolute",
          top: textCenterY,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            opacity: mainTextOpacity,
            transform: `scale(${mainTextScale})`,
          }}
        >
          People forget you exist
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#a1a1aa",
            textAlign: "center",
            opacity: subTextOpacity,
          }}
        >
          in about 3 days
        </div>
      </div>
    </AbsoluteFill>
  );
};
