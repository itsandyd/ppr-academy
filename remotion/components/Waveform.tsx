import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";

// ─── WaveformVisual: Accurate SVG sine wave with tanh soft-clip saturation
// Used by SaturationCourseVideo for clean vs saturated waveform comparison
export const WaveformVisual: React.FC<{
  delay: number;
  distorted?: boolean;
}> = ({ delay, distorted = false }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Draw an SVG sine wave — clean or saturated
  const width = 900;
  const height = 120;
  const mid = height / 2;
  const amp = 48;
  const points = 200;

  // Soft-clip function (tanh-style saturation)
  const softClip = (x: number, drive: number) => {
    return Math.tanh(x * drive) / Math.tanh(drive);
  };

  let pathD = "";
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const phase = (i / points) * Math.PI * 4 + frame * 0.06;
    let val = Math.sin(phase);

    if (distorted) {
      // Apply soft clipping — peaks get flattened
      val = softClip(val * 1.8, 2.5);
    }

    const y = mid - val * amp;
    pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  // Zero line
  const zeroLine = `M 0 ${mid} L ${width} ${mid}`;

  return (
    <div
      style={{
        opacity: enter,
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: 100 }}
      >
        {/* Zero crossing line */}
        <path
          d={zeroLine}
          stroke={distorted ? `${C.orange}25` : `${C.primary}25`}
          strokeWidth={1}
          fill="none"
        />
        {/* Clipping threshold lines (only on saturated) */}
        {distorted && (
          <>
            <path
              d={`M 0 ${mid - amp * 0.72} L ${width} ${mid - amp * 0.72}`}
              stroke={`${C.red}30`}
              strokeWidth={1}
              strokeDasharray="6 4"
              fill="none"
            />
            <path
              d={`M 0 ${mid + amp * 0.72} L ${width} ${mid + amp * 0.72}`}
              stroke={`${C.red}30`}
              strokeWidth={1}
              strokeDasharray="6 4"
              fill="none"
            />
          </>
        )}
        {/* The waveform */}
        <path
          d={pathD}
          stroke={distorted ? C.orange : C.primary}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow effect */}
        <path
          d={pathD}
          stroke={distorted ? C.orange : C.primary}
          strokeWidth={8}
          fill="none"
          opacity={0.15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
