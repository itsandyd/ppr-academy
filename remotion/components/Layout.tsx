import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { BG } from "./Background";

// ─── CenterScene: Centered flexbox wrapper with BG ──────────────────────
// Used as the standard scene wrapper in Email, BeatLease, FollowGates, Saturation
export const CenterScene: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  translateY?: number;
  seed?: number;
  tint?: string;
  orbColors?: [string, string];
  padding?: string;
}> = ({ children, opacity = 1, translateY = 0, seed = 0, tint, orbColors, padding = "0 56px" }) => (
  <AbsoluteFill
    style={{
      backgroundColor: C.bg,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      opacity,
      transform: `translateY(${translateY}px)`,
    }}
  >
    <BG seed={seed} tint={tint} orbColors={orbColors} />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center" as const,
        padding,
        zIndex: 1,
        width: "100%",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// ─── Content: Centered overlay wrapper for image-backed scenes ──────────
// Used by SaturationCourseV2 where CinematicBG provides the background
export const Content: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  translateY?: number;
}> = ({ children, opacity = 1, translateY = 0 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      opacity,
      transform: `translateY(${translateY}px)`,
      zIndex: 2,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center" as const,
        padding: "0 56px",
        width: "100%",
      }}
    >
      {children}
    </div>
  </div>
);
