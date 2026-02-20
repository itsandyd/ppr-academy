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
// TIMER OVERLAY — Persistent timer rendered across the entire video
// ═══════════════════════════════════════════════════════════════════════
const TimerOverlay: React.FC<{ globalFrame: number }> = ({ globalFrame }) => {
  const timerStart = 120;
  const timerEnd = 540;
  const elapsed = Math.max(0, globalFrame - timerStart);

  const timerSeconds = interpolate(
    globalFrame,
    [timerStart, timerEnd],
    [0, 600],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = Math.floor(timerSeconds % 60);
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const timerOp = interpolate(globalFrame, [timerStart - 10, timerStart], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isFrozen = globalFrame >= timerEnd;
  const pulse = isFrozen ? Math.sin(globalFrame * 0.08) * 0.1 + 1 : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 40,
        zIndex: 100,
        opacity: timerOp,
        transform: `scale(${pulse})`,
      }}
    >
      <div
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          background: isFrozen
            ? `linear-gradient(135deg, ${C.green}20, ${C.cyan}20)`
            : `${C.darkGray}cc`,
          border: `1px solid ${isFrozen ? C.green : C.gray}30`,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: C.gray,
            fontFamily: "monospace",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          TIMER
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: isFrozen ? C.green : C.white,
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          {display}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ATTENTION — "How fast can you start?" (0s–5s, frames 0–150)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(125, 150);

  const line1Spring = spring({
    fps,
    frame: frame - 10,
    config: { damping: 55, stiffness: 170 },
  });
  const line2Spring = spring({
    fps,
    frame: frame - 55,
    config: { damping: 55, stiffness: 170 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.orange}>
      <FadeUp delay={3}>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 18,
            background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 0 60px ${C.orange}40`,
            marginBottom: 50,
            fontSize: 36,
          }}
        >
          ⚡
        </div>
      </FadeUp>

      <div
        style={{
          opacity: interpolate(line1Spring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(line1Spring, [0, 1], [40, 0])}px)`,
          fontSize: 40,
          fontWeight: 900,
          color: C.white,
          fontFamily: F,
          lineHeight: 1.2,
          marginBottom: 20,
        }}
      >
        How fast can you{"\n"}start selling?
      </div>

      <div
        style={{
          opacity: interpolate(line2Spring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(line2Spring, [0, 1], [30, 0])}px)`,
        }}
      >
        <GradientText from={C.orange} to={C.gold}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            Let's find out.
          </div>
        </GradientText>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — 5-step walkthrough (5s–18s, frames 150–540)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(365, 390);

  const steps = [
    {
      num: 1,
      title: "Sign Up",
      desc: "Create your account in seconds",
      icon: "✉️",
      color: C.primary,
      start: 5,
      duration: 60,
    },
    {
      num: 2,
      title: "Brand Your Store",
      desc: "Logo, colors, custom domain",
      icon: "🎨",
      color: C.purple,
      start: 65,
      duration: 60,
    },
    {
      num: 3,
      title: "Upload a Product",
      desc: "Title, price, files — AI writes the description",
      icon: "📦",
      color: C.cyan,
      start: 125,
      duration: 90,
    },
    {
      num: 4,
      title: "AI Generates Marketing",
      desc: "Social post, email, PDF — all at once",
      icon: "🤖",
      color: C.green,
      start: 215,
      duration: 60,
    },
    {
      num: 5,
      title: "Go Live",
      desc: "Hit publish — you're selling",
      icon: "🚀",
      color: C.gold,
      start: 275,
      duration: 60,
    },
  ];

  const confettiStart = 320;
  const confettiPieces = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const speed = 1.5 + (i % 4) * 0.8;
    const progress = Math.max(0, frame - confettiStart) / 40;
    return {
      x: Math.cos(angle) * progress * speed * 80,
      y: Math.sin(angle) * progress * speed * 60 + progress * progress * 40,
      opacity: Math.max(0, 1 - progress * 0.8),
      color: [C.primary, C.pink, C.cyan, C.green, C.gold, C.orange][i % 6],
      size: 6 + (i % 3) * 3,
      rotation: progress * (i % 2 === 0 ? 360 : -360),
    };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <BG seed={8} tint={C.orange} />

      {/* Confetti */}
      {confettiPieces.map((piece, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + piece.x - piece.size / 2,
            top: 1200 + piece.y - piece.size / 2,
            width: piece.size,
            height: piece.size,
            borderRadius: piece.size > 8 ? 2 : "50%",
            backgroundColor: piece.color,
            opacity: piece.opacity,
            transform: `rotate(${piece.rotation}deg)`,
            zIndex: 10,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 42px 80px",
          zIndex: 1,
        }}
      >
        <FadeUp delay={0}>
          <SectionLabel color={C.orange}>SPEED RUN</SectionLabel>
        </FadeUp>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 16,
          }}
        >
          {steps.map((step, i) => {
            const localFrame = frame - step.start;
            const enterSpring = spring({
              fps,
              frame: localFrame,
              config: { damping: 55, stiffness: 170 },
            });
            const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
            const enterX = interpolate(enterSpring, [0, 1], [60, 0]);

            const isActive = localFrame >= 0 && localFrame < step.duration;
            const isDone = localFrame >= step.duration * 0.6;

            const checkSpring = spring({
              fps,
              frame: localFrame - step.duration * 0.5,
              config: { damping: 40, stiffness: 200 },
            });
            const checkScale = interpolate(checkSpring, [0, 1], [0, 1]);

            const progressWidth = interpolate(
              localFrame,
              [5, step.duration * 0.55],
              [0, 100],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  opacity: enterOp,
                  transform: `translateX(${enterX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: isActive
                    ? `linear-gradient(135deg, ${C.darkGray}ee, ${step.color}12)`
                    : `${C.darkGray}88`,
                  border: `1px solid ${isActive ? step.color + "40" : step.color + "12"}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Progress bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 3,
                    width: `${progressWidth}%`,
                    background: `linear-gradient(90deg, ${step.color}, ${step.color}60)`,
                    borderRadius: 2,
                  }}
                />

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isDone ? C.green : `${step.color}20`,
                    border: `1px solid ${isDone ? C.green : step.color}40`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: isDone ? 16 : 14,
                    fontWeight: 800,
                    color: isDone ? C.white : step.color,
                    fontFamily: "monospace",
                    flexShrink: 0,
                    transform: isDone ? `scale(${checkScale})` : undefined,
                  }}
                >
                  {isDone ? "✓" : step.num}
                </div>

                <div style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</div>

                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: C.white,
                      fontFamily: F,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isActive ? step.color : C.gray,
                      fontFamily: F,
                      lineHeight: 1.3,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: C.gray,
                    fontFamily: "monospace",
                    fontWeight: 600,
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  Step {step.num}/5
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE — "10 minutes" reveal + montage (18s–27s, frames 540–810)
// ═══════════════════════════════════════════════════════════════════════
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(245, 270);

  const bigNumberSpring = spring({
    fps,
    frame: frame - 8,
    config: { damping: 40, stiffness: 140 },
  });
  const bigScale = interpolate(bigNumberSpring, [0, 1], [0.5, 1]);

  const lines = [
    { text: "Your store is live.", delay: 40 },
    { text: "Your product is listed.", delay: 60 },
    { text: "Your marketing is written.", delay: 80 },
    { text: "Your link-in-bio is ready.", delay: 100 },
  ];

  const imagineSpring = spring({
    fps,
    frame: frame - 135,
    config: { damping: 55, stiffness: 170 },
  });

  const montageItems = [
    { icon: "📦", text: "12 products", color: C.primary },
    { icon: "📧", text: "847 subscribers", color: C.cyan },
    { icon: "💰", text: "$2,400 revenue", color: C.green },
    { icon: "📱", text: "30 posts scheduled", color: C.pink },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={9}>
      {/* Big "10 minutes" */}
      <div
        style={{
          opacity: interpolate(bigNumberSpring, [0, 1], [0, 1]),
          transform: `scale(${bigScale})`,
          marginBottom: 32,
        }}
      >
        <GradientText from={C.orange} to={C.gold}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1,
            }}
          >
            10 minutes.
          </div>
        </GradientText>
      </div>

      {/* Sequential lines */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        {lines.map((line, i) => {
          const lineSpring = spring({
            fps,
            frame: frame - line.delay,
            config: { damping: 55, stiffness: 170 },
          });
          return (
            <div
              key={i}
              style={{
                opacity: interpolate(lineSpring, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(lineSpring, [0, 1], [20, 0])}px)`,
                fontSize: 22,
                fontWeight: 600,
                color: C.gray,
                fontFamily: F,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>

      {/* "Imagine" + montage */}
      <div
        style={{
          opacity: interpolate(imagineSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(imagineSpring, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Now imagine{" "}
          <GradientText from={C.orange} to={C.gold}>a week.</GradientText>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {montageItems.map((item, i) => {
            const itemSpring = spring({
              fps,
              frame: frame - 145 - i * 8,
              config: { damping: 50, stiffness: 170 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(itemSpring, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(itemSpring, [0, 1], [0.8, 1])})`,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: `${C.darkGray}cc`,
                  border: `1px solid ${item.color}25`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 18 }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: item.color,
                    fontFamily: F,
                  }}
                >
                  {item.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACTION — CTA (27s–33s, frames 810–990)
// ═══════════════════════════════════════════════════════════════════════
const Action: React.FC = () => {
  return (
    <CenterScene>
      <LogoIcon delay={8} size={100} gradientFrom={C.orange} gradientVia={C.gold} gradientTo={C.green} glowColor={C.orange} />

      <FadeUp delay={20}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
          }}
        >
          10 minutes to
        </div>
        <GradientText from={C.orange} to={C.gold}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1.2,
            }}
          >
            your first product.
          </div>
        </GradientText>
      </FadeUp>

      <FadeUp delay={35}>
        <div style={{ marginTop: 10 }}>
          <CTAButton delay={35} gradientFrom={C.orange} gradientTo={C.gold} glowColor={C.orange}>
            Start Selling Free →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={48}>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            color: C.gray,
            fontFamily: "monospace",
            letterSpacing: 1.5,
          }}
        >
          academy.pauseplayrepeat.com
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION — "From $0 to Selling in 10 Minutes" (33s)
// ═══════════════════════════════════════════════════════════════════════
export const PromoCreatorToolkit: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={0} durationInFrames={150}>
        <Attention />
      </Sequence>
      <Sequence from={150} durationInFrames={390}>
        <Interest />
      </Sequence>
      <Sequence from={540} durationInFrames={270}>
        <Desire />
      </Sequence>
      <Sequence from={810} durationInFrames={180}>
        <Action />
      </Sequence>

      {/* Persistent timer overlay across Attention + Interest */}
      <TimerOverlay globalFrame={frame} />
    </AbsoluteFill>
  );
};
