import React from "react";
import { F } from "../theme";

// ─── GradientText: Inline gradient text span ────────────────────────────
export const GradientText: React.FC<{
  children: React.ReactNode;
  from: string;
  to: string;
  style?: React.CSSProperties;
}> = ({ children, from, to, style }) => (
  <span
    style={{
      background: `linear-gradient(135deg, ${from}, ${to})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

// ─── SectionLabel: Uppercase colored label (e.g. "FEATURES", "THE PROBLEM")
export const SectionLabel: React.FC<{
  children: React.ReactNode;
  color: string;
  style?: React.CSSProperties;
}> = ({ children, color, style }) => (
  <div
    style={{
      fontSize: 15,
      color,
      fontWeight: 700,
      letterSpacing: 4,
      textTransform: "uppercase" as const,
      fontFamily: F,
      marginBottom: 12,
      ...style,
    }}
  >
    {children}
  </div>
);
