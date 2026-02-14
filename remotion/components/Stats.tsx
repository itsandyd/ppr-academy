import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

// ─── StatCounter: Animated stat with gradient value ─────────────────────
// Used by PausePlayRepeatVideo in the stats scene (2x2 grid)
export const StatCounter: React.FC<{
  value: string;
  label: string;
  delay: number;
}> = ({ value, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 60, stiffness: 200 },
  });

  const scale = interpolate(enter, [0, 1], [0, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        textAlign: "center" as const,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: F,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 16,
          color: C.gray,
          fontWeight: 500,
          marginTop: 2,
          fontFamily: F,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ─── StatBlock: Stat with customizable gradient color ───────────────────
// Used by EmailAutomationVideo in the stats scene
export const StatBlock: React.FC<{
  value: string;
  label: string;
  color: string;
  delay: number;
}> = ({ value, label, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 50, stiffness: 160 },
  });
  const sc = interpolate(enter, [0, 1], [0, 1]);
  const op = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `scale(${sc})`,
        opacity: op,
        textAlign: "center" as const,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          fontFamily: F,
          background: `linear-gradient(135deg, ${color}, ${C.white})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 15,
          color: C.gray,
          fontFamily: F,
          fontWeight: 500,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ─── StatBig: Large stat with gradient — used for hero numbers ──────────
// Used by FollowGatesVideo in the numbers scene
export const StatBig: React.FC<{
  value: string;
  label: string;
  color: string;
  delay: number;
}> = ({ value, label, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 45, stiffness: 150 },
  });
  const sc = interpolate(enter, [0, 1], [0, 1]);
  return (
    <div
      style={{
        transform: `scale(${sc})`,
        opacity: interpolate(enter, [0, 1], [0, 1]),
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          fontFamily: F,
          background: `linear-gradient(135deg, ${color}, ${C.white})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 16,
          color: C.gray,
          fontFamily: F,
          fontWeight: 500,
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
};
