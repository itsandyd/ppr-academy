import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// Sanitize numeric props — LLM-generated code may pass undefined/NaN
const n = (v: unknown, fallback = 0): number => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

// ─── ConnectorLine: Animated vertical connector between steps ───────────
// Used by EmailAutomationVideo between StepRow components
export const ConnectorLine: React.FC<{
  delay: number;
  color: string;
}> = ({ delay, color }) => {
  const frame = useCurrentFrame();
  const d = n(delay);
  const h = interpolate(frame, [d, d + 10], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 2,
          height: h,
          background: `linear-gradient(180deg, ${color}40, transparent)`,
          marginLeft: 50,
        }}
      />
    </div>
  );
};
