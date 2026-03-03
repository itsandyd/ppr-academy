import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

// Scene 3: The Three Emails — 540 frames (18 seconds) at 30fps
// "Email one: deliver the freebie. Email two: show them something paid.
//  Email three: give them a reason to act."
//
// Local frame 0 = global frame 360
// Steps appear at: 0-180, 180-360, 360-540

const COLORS = {
  bg: "#18181b",
  card: "#27272a",
  border: "#3f3f46",
  white: "#ffffff",
  zinc400: "#a1a1aa",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  green: "#22c55e",
};

// SVG icons as components
const DownloadIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DollarIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.violet} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface StepData {
  number: number;
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const steps: StepData[] = [
  {
    number: 1,
    accent: COLORS.indigo,
    icon: <DownloadIcon />,
    title: "Deliver the freebie",
    subtitle: "Send the pack. Say thanks.\nInclude a quick tip.",
  },
  {
    number: 2,
    accent: COLORS.violet,
    icon: <DollarIcon />,
    title: "Show something paid",
    subtitle: "Here's the full bundle\nI use in my tracks.",
  },
  {
    number: 3,
    accent: COLORS.green,
    icon: <ClockIcon />,
    title: "Give a reason to act",
    subtitle: "20% off. 48 hours. Done.",
  },
];

export const SceneThreeEmails: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Layout constants
  const startY = 380;
  const stepHeight = 320;
  const lineX = 160;
  const nodeRadius = 22;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily }}>
      {steps.map((step, i) => {
        const stepStart = i * 180;

        // Circle node pops in
        const nodeSpring = spring({
          fps,
          frame: frame - stepStart,
          config: { damping: 20, stiffness: 200 },
        });
        const nodeScale = interpolate(nodeSpring, [0, 1], [0, 1]);
        const nodeOpacity = interpolate(nodeSpring, [0, 1], [0, 1]);

        // Vertical line draws from this node to the next
        const lineStart = stepStart + 30;
        const lineDrawProgress = interpolate(
          frame,
          [lineStart, lineStart + 60],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }
        );

        // Card slides in from right
        const cardSpring = spring({
          fps,
          frame: frame - (stepStart + 40),
          config: { damping: 60, stiffness: 140 },
        });
        const cardX = interpolate(cardSpring, [0, 1], [200, 0]);
        const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

        const nodeY = startY + i * stepHeight;

        return (
          <React.Fragment key={i}>
            {/* Vertical line to next node */}
            {i < 2 && lineDrawProgress > 0 && (
              <svg
                style={{
                  position: "absolute",
                  left: lineX - 1,
                  top: nodeY + nodeRadius + 4,
                  width: 4,
                  height: stepHeight - nodeRadius * 2 - 8,
                }}
              >
                <line
                  x1={2}
                  y1={0}
                  x2={2}
                  y2={(stepHeight - nodeRadius * 2 - 8) * lineDrawProgress}
                  stroke={step.accent}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              </svg>
            )}

            {/* Circle node */}
            <div
              style={{
                position: "absolute",
                left: lineX - nodeRadius,
                top: nodeY - nodeRadius,
                width: nodeRadius * 2,
                height: nodeRadius * 2,
                borderRadius: "50%",
                border: `2px solid ${step.accent}`,
                backgroundColor: COLORS.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${nodeScale})`,
                opacity: nodeOpacity,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: step.accent,
                }}
              >
                {step.number}
              </span>
            </div>

            {/* Card */}
            <div
              style={{
                position: "absolute",
                left: 220,
                top: nodeY - 50,
                right: 80,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                borderLeft: `4px solid ${step.accent}`,
                border: `1px solid ${COLORS.border}`,
                borderLeftWidth: 4,
                borderLeftColor: step.accent,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transform: `translateX(${cardX}px)`,
                opacity: cardOpacity,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {step.icon}
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: COLORS.white,
                  }}
                >
                  {step.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: COLORS.zinc400,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {step.subtitle}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
