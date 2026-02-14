import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// ─── ConnectorLine: Animated vertical connector between steps ───────────
// Used by EmailAutomationVideo between StepRow components
export const ConnectorLine: React.FC<{
  delay: number;
  color: string;
}> = ({ delay, color }) => {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [delay, delay + 10], [0, 20], {
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
