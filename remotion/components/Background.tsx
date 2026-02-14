import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Img } from "remotion";
import { C } from "../theme";

// ─── GlowOrb: Floating ambient background orb ──────────────────────────
export const GlowOrb: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}> = ({ x, y, size, color, delay }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin((frame + delay) * 0.03) * 0.3 + 0.7;
  const drift = Math.sin((frame + delay) * 0.015) * 30;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + drift,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        opacity: pulse * 0.6,
        filter: `blur(${size * 0.3}px)`,
      }}
    />
  );
};

// ─── GridPattern: Subtle grid background lines ──────────────────────────
export const GridPattern: React.FC<{ opacity?: number; color?: string }> = ({
  opacity = 0.1,
  color,
}) => {
  const c = color || C.primary;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundImage: `
        linear-gradient(${c}12 1px, transparent 1px),
        linear-gradient(90deg, ${c}12 1px, transparent 1px)
      `,
        backgroundSize: "50px 50px",
      }}
    />
  );
};

// ─── ScanLine: Animated horizontal scan line ────────────────────────────
export const ScanLine: React.FC<{ color?: string; speed?: number }> = ({
  color,
  speed = 4,
}) => {
  const frame = useCurrentFrame();
  const c = color || C.primary;
  const y = (frame * speed) % 2100 - 100;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${c}25, transparent)`,
      }}
    />
  );
};

// ─── BG: Combined background with grid, orbs, and scanline ──────────────
// Used by EmailAutomation, BeatLease, FollowGates, SaturationCourse
export const BG: React.FC<{
  seed?: number;
  tint?: string;
  orbColors?: [string, string];
}> = ({ seed = 0, tint, orbColors }) => {
  const frame = useCurrentFrame();
  const baseColor = tint || C.primary;
  const scanY = (frame * 4) % 2100 - 100;
  const orbs = [
    { x: 80 + seed * 55, y: 480, s: 500, c: baseColor, d: 0 },
    { x: 520 + seed * 25, y: 1200, s: 420, c: orbColors?.[0] ?? C.purple, d: 40 },
    { x: 30, y: 860, s: 360, c: orbColors?.[1] ?? C.pink, d: 80 },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: `linear-gradient(${baseColor}12 1px, transparent 1px), linear-gradient(90deg, ${baseColor}12 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      {orbs.map((o, i) => {
        const p = Math.sin((frame + o.d) * 0.03) * 0.3 + 0.7;
        const dr = Math.sin((frame + o.d) * 0.015) * 25;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y + dr,
              width: o.s,
              height: o.s,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${o.c}30, transparent 70%)`,
              opacity: p * 0.5,
              filter: `blur(${o.s * 0.3}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanY,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${baseColor}25, transparent)`,
        }}
      />
    </>
  );
};

// ─── CinematicBG: Ken Burns image background with slow zoom/pan ─────────
// Used by SaturationCourseV2 for image-backed scenes
export const CinematicBG: React.FC<{
  src: string;
  startScale?: number;
  endScale?: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  overlayOpacity?: number;
}> = ({
  src,
  startScale = 1.05,
  endScale = 1.15,
  startX = 0,
  endX = 0,
  startY = 0,
  endY = 0,
  overlayOpacity = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  const scale = interpolate(progress, [0, 1], [startScale, endScale]);
  const x = interpolate(progress, [0, 1], [startX, endX]);
  const y = interpolate(progress, [0, 1], [startY, endY]);

  return (
    <>
      <Img
        src={src}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        }}
      />
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity + 0.1}) 0%, rgba(0,0,0,${overlayOpacity - 0.1}) 40%, rgba(0,0,0,${overlayOpacity + 0.15}) 100%)`,
        }}
      />
    </>
  );
};
