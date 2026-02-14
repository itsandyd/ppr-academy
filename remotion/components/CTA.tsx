import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

// ─── CTAButton: Pulsing gradient call-to-action button ──────────────────
export const CTAButton: React.FC<{
  children: React.ReactNode;
  delay: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}> = ({ children, delay, gradientFrom, gradientTo, glowColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaSpring = spring({
    fps,
    frame: frame - delay,
    config: { damping: 50, stiffness: 160 },
  });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
  const from = gradientFrom || C.primary;
  const to = gradientTo || C.purple;
  const glow = glowColor || from;

  return (
    <div style={{ transform: `scale(${ctaScale})` }}>
      <div
        style={{
          padding: "18px 44px",
          borderRadius: 60,
          background: `linear-gradient(135deg, ${from}, ${to})`,
          color: C.white,
          fontSize: 22,
          fontWeight: 700,
          fontFamily: F,
          boxShadow: `0 0 ${36 * pulse}px ${glow}50, 0 4px 20px rgba(0,0,0,0.3)`,
          letterSpacing: 0.5,
          textAlign: "center" as const,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── LogoIcon: The ▶ play icon in gradient rounded box ──────────────────
export const LogoIcon: React.FC<{
  delay: number;
  size?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  glowColor?: string;
}> = ({ delay, size = 110, gradientFrom, gradientTo, gradientVia, glowColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({
    fps,
    frame: frame - delay,
    config: { damping: 40, stiffness: 150 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const from = gradientFrom || C.primary;
  const via = gradientVia || C.purple;
  const to = gradientTo || C.pink;
  const glow = glowColor || from;

  return (
    <div style={{ transform: `scale(${logoScale})`, marginBottom: 36 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.255,
          background: `linear-gradient(135deg, ${from}, ${via}, ${to})`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: `0 0 70px ${glow}50`,
        }}
      >
        <div style={{ fontSize: size * 0.5, color: C.white }}>▶</div>
      </div>
    </div>
  );
};
