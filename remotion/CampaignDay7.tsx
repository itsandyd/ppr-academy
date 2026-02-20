import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { C, F } from "./theme";
import {
  BG,
  CenterScene,
  FadeUp,
  GradientText,
  SectionLabel,
  CTAButton,
  LogoIcon,
  useExit,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN DAY 7: "From $0 to Selling in 10 Minutes"
// Narrative: Overcome "this looks complicated." Speed is the sell.
// AIDA: Attention → Interest → Desire → Action (30s total)
// ═══════════════════════════════════════════════════════════════════════

// Helper: format timer display
const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ─── Timer overlay — persistent across all scenes ─────────────────────
const TimerOverlay: React.FC<{ frame: number; totalFrames: number }> = ({
  frame,
  totalFrames,
}) => {
  // Timer runs from 0:00 to 10:00 over the video
  const timerSeconds = interpolate(frame, [0, totalFrames - 60], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const timerOp = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        right: 40,
        zIndex: 100,
        opacity: timerOp,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 10,
        background: `${C.bg}dd`,
        border: `1px solid ${C.primary}30`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: C.red,
          opacity: Math.sin(frame * 0.1) > 0 ? 1 : 0.3,
        }}
      />
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.white,
          fontFamily: "monospace",
          letterSpacing: 2,
        }}
      >
        {formatTimer(timerSeconds)}
      </div>
    </div>
  );
};

// ─── ATTENTION (0:00–0:05) — "How fast?" ──────────────────────────────
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headSpring = spring({
    fps,
    frame: frame - 8,
    config: { damping: 50, stiffness: 170 },
  });

  const subOp = interpolate(frame, [55, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subSpring = spring({
    fps,
    frame: frame - 58,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene tint={C.green}>
      <div
        style={{
          opacity: interpolate(headSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(headSpring, [0, 1], [30, 0])}px)`,
          fontSize: 36,
          fontWeight: 900,
          color: C.white,
          fontFamily: F,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        How fast can you{"\n"}
        <GradientText from={C.green} to={C.cyan}>
          start selling?
        </GradientText>
      </div>

      <div
        style={{
          opacity: subOp,
          transform: `translateY(${interpolate(subSpring, [0, 1], [20, 0])}px)`,
          fontSize: 24,
          fontWeight: 700,
          color: C.gray,
          fontFamily: F,
          marginTop: 18,
          textAlign: "center",
        }}
      >
        Let's find out.
      </div>
    </CenterScene>
  );
};

// ─── INTEREST (0:05–0:13) — 5-step rapid walkthrough ──────────────────
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(218, 240);

  // REAL setup steps from the codebase
  const steps = [
    {
      num: "1",
      label: "Sign Up",
      detail: "Clerk auth + store created",
      color: C.primary,
      start: 5,
    },
    {
      num: "2",
      label: "Brand Your Store",
      detail: "Logo, banner, bio, colors",
      color: C.pink,
      start: 40,
    },
    {
      num: "3",
      label: "Upload a Product",
      detail: "Sample pack, preset, course...",
      color: C.orange,
      start: 75,
    },
    {
      num: "4",
      label: "AI Generates Marketing",
      detail: "Scripts, PDFs, email copy",
      color: C.cyan,
      start: 110,
    },
    {
      num: "5",
      label: "Go Live",
      detail: "Your storefront is live!",
      color: C.green,
      start: 145,
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={2}>
      <FadeUp delay={0}>
        <SectionLabel color={C.green}>SETUP WALKTHROUGH</SectionLabel>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        {steps.map((step, i) => {
          const enterSpring = spring({
            fps,
            frame: frame - step.start,
            config: { damping: 55, stiffness: 175 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [60, 0]);

          const checkDelay = step.start + 20;
          const checkSpring = spring({
            fps,
            frame: frame - checkDelay,
            config: { damping: 35, stiffness: 200 },
          });
          const checkScale = interpolate(checkSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${step.color}25`,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: `${step.color}20`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 14,
                  fontWeight: 900,
                  color: step.color,
                  fontFamily: F,
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.white,
                    fontFamily: F,
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.gray,
                    fontFamily: F,
                    opacity: interpolate(
                      frame,
                      [step.start + 8, step.start + 16],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }
                    ),
                  }}
                >
                  {step.detail}
                </div>
              </div>
              <div
                style={{
                  transform: `scale(${checkScale})`,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ✅
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── DESIRE (0:13–0:22) — 10 minutes result ──────────────────────────
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

  const timerSpring = spring({
    fps,
    frame: frame - 8,
    config: { damping: 45, stiffness: 150 },
  });

  const achievements = [
    "Store live",
    "Product listed",
    "Marketing written",
    "Link-in-bio ready",
  ];

  const futureOp = interpolate(frame, [170, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const futureItems = [
    { icon: "📦", label: "10+ products" },
    { icon: "👥", label: "500 subscribers" },
    { icon: "💰", label: "First $1,000" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={3}>
      {/* Timer display */}
      <div
        style={{
          opacity: interpolate(timerSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(timerSpring, [0, 1], [0.7, 1])})`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            fontFamily: "monospace",
            textAlign: "center",
            background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          10:00
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          That's all it took.
        </div>
      </div>

      {/* Achievement list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
          marginBottom: 20,
        }}
      >
        {achievements.map((ach, i) => {
          const achDelay = 30 + i * 16;
          const achSpring = spring({
            fps,
            frame: frame - achDelay,
            config: { damping: 55, stiffness: 180 },
          });
          return (
            <div
              key={i}
              style={{
                opacity: interpolate(achSpring, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(achSpring, [0, 1], [40, 0])}px)`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 10,
                background: `${C.darkGray}cc`,
                border: `1px solid ${C.green}20`,
              }}
            >
              <div style={{ fontSize: 14 }}>✅</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {ach}
              </div>
            </div>
          );
        })}
      </div>

      {/* Future montage */}
      <div
        style={{
          opacity: futureOp,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            marginBottom: 14,
          }}
        >
          Now imagine a week...
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {futureItems.map((item, i) => {
            const fDelay = 190 + i * 12;
            const fSpring = spring({
              fps,
              frame: frame - fDelay,
              config: { damping: 50, stiffness: 170 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(fSpring, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(fSpring, [0, 1], [0.8, 1])})`,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${C.green}10`,
                  border: `1px solid ${C.green}25`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 20 }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.green,
                    fontFamily: F,
                    marginTop: 4,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenterScene>
  );
};

// ─── ACTION (0:22–0:30) — CTA ─────────────────────────────────────────
const Action: React.FC = () => {
  return (
    <CenterScene>
      <LogoIcon
        delay={6}
        size={90}
        gradientFrom={C.green}
        gradientVia={C.cyan}
        gradientTo={C.primary}
        glowColor={C.green}
      />

      <FadeUp delay={16}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          <GradientText from={C.green} to={C.cyan}>
            10 minutes
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={24}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          to your first product.
        </div>
      </FadeUp>

      <FadeUp delay={38}>
        <div style={{ marginTop: 14 }}>
          <CTAButton
            delay={38}
            gradientFrom={C.green}
            gradientTo={C.cyan}
            glowColor={C.green}
          >
            Start Free →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={50}>
        <div
          style={{
            marginTop: 24,
            fontSize: 17,
            color: C.gray,
            fontFamily: "monospace",
            letterSpacing: 1.5,
          }}
        >
          pauseplayrepeat.com
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — Campaign Day 7: "From $0 to Selling in 10 Min"
//
// Timing breakdown:
//   0.5s  buffer          15 fr
//   5.0s  Attention       150 fr  ("How fast?" + timer starts)
//   8.0s  Interest        240 fr  (5 steps rapid walkthrough)
//   9.0s  Desire          270 fr  (10:00 result + achievements)
//   7.0s  Action          210 fr  (CTA)
//   0.5s  buffer          15 fr
//   ─────────────────────────────
//   30.0s total           900 fr
// ═══════════════════════════════════════════════════════════════════════
export const CampaignDay7: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Timer overlay across entire video */}
      <TimerOverlay frame={frame} totalFrames={900} />

      <Sequence from={15} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={165} durationInFrames={240}>
        <Interest />
      </Sequence>
      <Sequence from={405} durationInFrames={270}>
        <Desire />
      </Sequence>
      <Sequence from={675} durationInFrames={210}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
