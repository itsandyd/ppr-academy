import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

// ─── FeatureCard: Icon + title + description horizontal card ────────────
// Used by PausePlayRepeatVideo for feature showcase scenes
export const FeatureCard: React.FC<{
  icon: string;
  title: string;
  desc: string;
  delay: number;
}> = ({ icon, title, desc, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 60, stiffness: 180 },
  });

  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [80, 0]);

  const glow = Math.sin((frame - delay) * 0.08) * 0.15 + 0.85;

  return (
    <div
      style={{
        transform: `translateX(${x}px) scale(${scale})`,
        opacity,
        background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.bg}ee)`,
        border: `1px solid ${C.primary}30`,
        borderRadius: 20,
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: `0 0 ${30 * glow}px ${C.primary}15, inset 0 1px 0 ${C.primary}15`,
      }}
    >
      <div style={{ fontSize: 40, flexShrink: 0 }}>{icon}</div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.white,
            marginBottom: 4,
            fontFamily: F,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 15,
            color: C.gray,
            lineHeight: 1.4,
            fontFamily: F,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
};

// ─── StepRow: Timeline step with time, icon, text, and color ────────────
// Used by EmailAutomationVideo for the automation flow scene
export const StepRow: React.FC<{
  step: { time: string; icon: string; text: string; color: string };
  delay: number;
}> = ({ step, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 50, stiffness: 160 },
  });
  const x = interpolate(enter, [0, 1], [100, 0]);
  const op = interpolate(enter, [0, 1], [0, 1]);
  const sc = interpolate(enter, [0, 1], [0.9, 1]);
  const glow = Math.sin(Math.max(0, frame - delay - 15) * 0.06) * 0.2 + 0.8;

  return (
    <div
      style={{
        transform: `translateX(${x}px) scale(${sc})`,
        opacity: op,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
        border: `1px solid ${step.color}20`,
        boxShadow: `0 0 ${20 * glow}px ${step.color}10`,
        width: "100%",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 62,
          textAlign: "center" as const,
          fontSize: 12,
          fontWeight: 700,
          color: step.color,
          fontFamily: "monospace",
          letterSpacing: 0.5,
        }}
      >
        {step.time}
      </div>
      <div
        style={{
          width: 2,
          height: 32,
          background: `linear-gradient(180deg, transparent, ${step.color}50, transparent)`,
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 26, flexShrink: 0 }}>{step.icon}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: C.white,
          fontFamily: F,
          lineHeight: 1.3,
        }}
      >
        {step.text}
      </div>
    </div>
  );
};

// ─── ReasonCard: Icon + title + description vertical card ───────────────
// Used by EmailAutomationVideo for the "why" scene
export const ReasonCard: React.FC<{
  item: { icon: string; title: string; desc: string };
  delay: number;
}> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 55, stiffness: 170 },
  });
  const sc = interpolate(enter, [0, 1], [0.8, 1]);
  const op = interpolate(enter, [0, 1], [0, 1]);
  const yy = interpolate(enter, [0, 1], [40, 0]);

  return (
    <div
      style={{
        transform: `translateY(${yy}px) scale(${sc})`,
        opacity: op,
        background: `linear-gradient(135deg, ${C.darkGray}cc, ${C.bg}cc)`,
        border: `1px solid ${C.primary}20`,
        borderRadius: 18,
        padding: "22px 24px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 30 }}>{item.icon}</div>
        <div
          style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: F }}
        >
          {item.title}
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          color: C.gray,
          fontFamily: F,
          lineHeight: 1.45,
          paddingLeft: 44,
        }}
      >
        {item.desc}
      </div>
    </div>
  );
};

// ─── TierCard: Pricing tier with name, price, and feature list ──────────
// Used by BeatLeaseVideo for the license tiers scene
export const TierCard: React.FC<{
  tier: {
    name: string;
    price: string;
    color: string;
    features: string[];
  };
  delay: number;
}> = ({ tier, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    fps,
    frame: frame - delay,
    config: { damping: 45, stiffness: 150 },
  });
  const sc = interpolate(enter, [0, 1], [0.7, 1]);
  const op = interpolate(enter, [0, 1], [0, 1]);
  const yy = interpolate(enter, [0, 1], [60, 0]);
  const glow =
    Math.sin(Math.max(0, frame - delay - 20) * 0.05) * 0.2 + 0.8;

  return (
    <div
      style={{
        transform: `translateY(${yy}px) scale(${sc})`,
        opacity: op,
        background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
        border: `2px solid ${tier.color}35`,
        borderRadius: 20,
        padding: "24px 24px 20px",
        width: "100%",
        boxShadow: `0 0 ${24 * glow}px ${tier.color}12`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: tier.color,
            fontFamily: F,
            letterSpacing: 3,
          }}
        >
          {tier.name}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
          }}
        >
          {tier.price}
        </div>
      </div>
      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tier.features.map((feat, i) => {
          const fd = delay + 12 + i * 6;
          const fop = interpolate(frame, [fd, fd + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity: fop,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 14, color: tier.color }}>✓</div>
              <div
                style={{
                  fontSize: 15,
                  color: C.gray,
                  fontFamily: F,
                  fontWeight: 500,
                }}
              >
                {feat}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
