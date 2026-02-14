import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

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
    frame: frame - delay,
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
  const op = interpolate(frame, [exitStart, exitEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [exitStart, exitEnd], [0, exitY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { op, y };
};
