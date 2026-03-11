import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// Sanitize numeric props — LLM-generated code may pass undefined/NaN
const n = (v: unknown, fallback = 0): number => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

// ─── FadeUp: Spring-animated fade + translate entrance ──────────────────
export const FadeUp: React.FC<{
  children: React.ReactNode;
  delay: number;
  style?: React.CSSProperties;
}> = ({ children, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    fps,
    frame: frame - n(delay),
    config: { damping: 60, stiffness: 180 },
  });
  const y = interpolate(s, [0, 1], [45, 0]);
  const op = interpolate(s, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity: op, ...style }}>
      {children}
    </div>
  );
};

// ─── useExit: Hook for scene exit animation ─────────────────────────────
// Returns { op, y } for opacity and translateY exit values
export const useExit = (
  exitStart: number,
  exitEnd: number,
  exitY: number = -30
) => {
  const frame = useCurrentFrame();
  const safeStart = n(exitStart);
  const safeEnd = n(exitEnd, safeStart + 1);
  const op = interpolate(frame, [safeStart, safeEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [safeStart, safeEnd], [0, n(exitY, -30)], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { op, y };
};
