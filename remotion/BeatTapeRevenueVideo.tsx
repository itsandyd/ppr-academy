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
  WaveformVisual,
  useExit,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════
// CONTENT VIDEO: "10 Beats → 5 Revenue Streams"
// Based on Content Brief 10.1: "You Just Finished a Beat Tape"
// Educational scenario post — teaches producers how to monetize a beat
// tape into 5 revenue streams on one platform.
// 1080x1920 vertical · 60s @ 30fps = 1800 frames
// ═══════════════════════════════════════════════════════════════════════

// ─── SCENE 1: Hook (0:00–0:04) — Stop the scroll ────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "10 beats." big number slam
  const numSpring = spring({
    fps,
    frame: frame - 8,
    config: { damping: 40, stiffness: 200 },
  });
  const numScale = interpolate(numSpring, [0, 1], [2.5, 1]);
  const numOp = interpolate(numSpring, [0, 1], [0, 1]);

  // Subtitle fade
  const subOp = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "5 revenue streams" punch
  const fiveSpring = spring({
    fps,
    frame: frame - 55,
    config: { damping: 35, stiffness: 180 },
  });
  const fiveScale = interpolate(fiveSpring, [0, 1], [1.8, 1]);
  const fiveOp = interpolate(fiveSpring, [0, 1], [0, 1]);

  // "One platform." closer
  const oneOp = interpolate(frame, [85, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene tint={C.orange} orbColors={[C.pink, C.purple]}>
      {/* Big number */}
      <div
        style={{
          transform: `scale(${numScale})`,
          opacity: numOp,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${C.orange}, ${C.warmOrange})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          10
        </div>
      </div>

      <div
        style={{
          opacity: subOp,
          fontSize: 30,
          fontWeight: 700,
          color: C.gray,
          fontFamily: F,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        beats in a tape.
      </div>

      <div
        style={{
          opacity: fiveOp,
          transform: `scale(${fiveScale})`,
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          5
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
            marginTop: 4,
          }}
        >
          revenue streams.
        </div>
      </div>

      <div
        style={{
          opacity: oneOp,
          marginTop: 32,
          fontSize: 20,
          fontWeight: 600,
          color: C.gray,
          fontFamily: F,
          letterSpacing: 2,
        }}
      >
        One platform.
      </div>
    </CenterScene>
  );
};

// ─── SCENE 2: The Problem (0:04–0:10) — What most producers do ──────
const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(150, 175);

  const steps = [
    { text: "Upload to BeatStars", icon: "📤", color: C.gray },
    { text: "Share the link once", icon: "🔗", color: C.gray },
    { text: "Wait...", icon: "⏳", color: C.gray },
    { text: "...and wait", icon: "😴", color: C.gray },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.red} seed={1} orbColors={[C.orange, C.pink]}>
      <FadeUp delay={0}>
        <SectionLabel color={C.red}>WHAT MOST PRODUCERS DO</SectionLabel>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Finish a beat tape.{"\n"}
          <span style={{ color: C.gray }}>Upload it somewhere.</span>{"\n"}
          <span style={{ color: C.gray }}>Hope for the best.</span>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        {steps.map((step, i) => {
          const cardDelay = 30 + i * 20;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 55, stiffness: 170 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [80, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${C.red}15`,
              }}
            >
              <div style={{ fontSize: 24 }}>{step.icon}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: step.color,
                  fontFamily: F,
                }}
              >
                {step.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strikethrough / result */}
      <FadeUp delay={110}>
        <div
          style={{
            marginTop: 24,
            fontSize: 20,
            fontWeight: 700,
            color: C.red,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          Result: 10 products → 1 revenue stream.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 3: Revenue Stream 1 — Beat Leases (0:10–0:20) ────────────
const Stream1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(270, 295);

  const tiers = [
    { name: "BASIC", price: "$25", color: C.primary, features: ["MP3 + WAV", "5K distribution"] },
    { name: "PREMIUM", price: "$75", color: C.cyan, features: ["+ Stems", "Commercial use"] },
    { name: "EXCLUSIVE", price: "$500", color: C.gold, features: ["All files", "Auto-removes listing"] },
  ];

  // Math counter
  const mathDelay = 200;
  const mathOp = interpolate(frame, [mathDelay, mathDelay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={2} orbColors={[C.cyan, C.purple]}>
      <FadeUp delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
            }}
          >
            1
          </div>
          <SectionLabel color={C.primary} style={{ marginBottom: 0 }}>
            BEAT LEASES
          </SectionLabel>
        </div>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Each beat × 3 tiers = <span style={{ color: C.white, fontWeight: 800 }}>30 products</span>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        {tiers.map((tier, i) => {
          const cardDelay = 20 + i * 35;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 50, stiffness: 160 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterScale = interpolate(enterSpring, [0, 1], [0.8, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `scale(${enterScale})`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${tier.color}30`,
                boxShadow: `0 0 16px ${tier.color}10`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: tier.color,
                    fontFamily: F,
                    letterSpacing: 2,
                  }}
                >
                  {tier.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.gray,
                    fontFamily: F,
                  }}
                >
                  {tier.features.join(" · ")}
                </div>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {tier.price}
              </div>
            </div>
          );
        })}
      </div>

      {/* Exclusive highlight */}
      <FadeUp delay={130}>
        <div
          style={{
            marginTop: 16,
            padding: "10px 20px",
            borderRadius: 12,
            background: `${C.gold}15`,
            border: `1px solid ${C.gold}30`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.gold,
              fontFamily: F,
              textAlign: "center",
            }}
          >
            Exclusive auto-removes from marketplace
          </div>
        </div>
      </FadeUp>

      {/* Math */}
      <div style={{ opacity: mathOp, marginTop: 20 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          10 beats × $25 basic ={" "}
          <GradientText from={C.primary} to={C.cyan}>
            $250 minimum
          </GradientText>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── SCENE 4: Revenue Stream 2 — Bundle (0:20–0:28) ─────────────────
const Stream2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(210, 235);

  // Price comparison animation
  const fullPriceOp = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const strikeDelay = 80;
  const strikeWidth = interpolate(frame, [strikeDelay, strikeDelay + 15], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bundlePriceSpring = spring({
    fps,
    frame: frame - 100,
    config: { damping: 40, stiffness: 170 },
  });
  const bundleScale = interpolate(bundlePriceSpring, [0, 1], [1.6, 1]);
  const bundleOp = interpolate(bundlePriceSpring, [0, 1], [0, 1]);

  // Save badge
  const saveOp = interpolate(frame, [125, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.green} seed={3} orbColors={[C.cyan, C.primary]}>
      <FadeUp delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
            }}
          >
            2
          </div>
          <SectionLabel color={C.green} style={{ marginBottom: 0 }}>
            BEAT TAPE BUNDLE
          </SectionLabel>
        </div>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          All 10 beats. One checkout.
        </div>
      </FadeUp>

      {/* Price comparison card */}
      <div
        style={{
          width: "100%",
          padding: "28px 28px",
          borderRadius: 20,
          background: `linear-gradient(135deg, ${C.darkGray}ee, ${C.bg}ee)`,
          border: `1px solid ${C.green}25`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Individual price */}
        <div style={{ opacity: fullPriceOp, position: "relative" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: C.gray,
              fontFamily: F,
              textAlign: "center",
            }}
          >
            Individual: 10 × $25
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: C.gray,
              fontFamily: F,
              textAlign: "center",
              position: "relative",
            }}
          >
            $250
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: `${strikeWidth}%`,
                height: 3,
                background: C.red,
                transform: "translateY(-50%)",
              }}
            />
          </div>
        </div>

        {/* Bundle price */}
        <div style={{ opacity: bundleOp, transform: `scale(${bundleScale})` }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: C.green,
              fontFamily: F,
              textAlign: "center",
            }}
          >
            Bundle price:
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              fontFamily: F,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${C.green}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
            }}
          >
            $149
          </div>
        </div>

        {/* Save badge */}
        <div
          style={{
            opacity: saveOp,
            padding: "8px 24px",
            borderRadius: 30,
            background: `${C.green}20`,
            border: `1px solid ${C.green}40`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.green,
              fontFamily: F,
            }}
          >
            Auto-calculated: Save $101
          </div>
        </div>
      </div>

      <FadeUp delay={155}>
        <div
          style={{
            marginTop: 20,
            fontSize: 16,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          One product. Higher perceived value.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 5: Revenue Stream 3 — Project Files (0:28–0:35) ──────────
const Stream3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(180, 205);

  const fileTypes = [
    { name: ".als", label: "Ableton", color: C.cyan },
    { name: ".flp", label: "FL Studio", color: C.orange },
    { name: ".logicx", label: "Logic Pro", color: C.purple },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.purple} seed={4} orbColors={[C.pink, C.primary]}>
      <FadeUp delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
            }}
          >
            3
          </div>
          <SectionLabel color={C.purple} style={{ marginBottom: 0 }}>
            PROJECT FILES
          </SectionLabel>
        </div>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Producers studying your workflow{"\n"}
          pay <span style={{ color: C.white, fontWeight: 800 }}>$15–25 per session</span>
        </div>
      </FadeUp>

      {/* File type cards */}
      <div
        style={{
          display: "flex",
          gap: 12,
          width: "100%",
          justifyContent: "center",
        }}
      >
        {fileTypes.map((ft, i) => {
          const cardDelay = 25 + i * 20;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 50, stiffness: 160 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterY = interpolate(enterSpring, [0, 1], [40, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateY(${enterY}px)`,
                flex: 1,
                padding: "20px 12px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${ft.color}30`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: ft.color,
                  fontFamily: "monospace",
                }}
              >
                {ft.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.gray,
                  fontFamily: F,
                }}
              >
                {ft.label}
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={90}>
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          10 sessions × $20 ={" "}
          <GradientText from={C.purple} to={C.pink}>
            $200 more
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={115}>
        <div
          style={{
            marginTop: 12,
            fontSize: 15,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
          }}
        >
          10 more products from the same tape.
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 6: Revenue Stream 4 — Free Lead Magnets (0:35–0:42) ──────
const Stream4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(180, 205);

  // Follow gate steps
  const gateSteps = [
    { icon: "🎵", text: "Pick 2 weakest beats", color: C.primary },
    { icon: "🔒", text: "Gate behind email + follow", color: C.pink },
    { icon: "📧", text: "Every download = new lead", color: C.green },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.pink} seed={5} orbColors={[C.purple, C.primary]}>
      <FadeUp delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
            }}
          >
            4
          </div>
          <SectionLabel color={C.pink} style={{ marginBottom: 0 }}>
            FREE LEAD MAGNETS
          </SectionLabel>
        </div>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 1.3,
          }}
        >
          Give away 2 beats.{"\n"}
          <span style={{ color: C.gray, fontWeight: 600 }}>Build an audience for the other 8.</span>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
        }}
      >
        {gateSteps.map((step, i) => {
          const cardDelay = 30 + i * 28;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 50, stiffness: 160 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterX = interpolate(enterSpring, [0, 1], [80, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `translateX(${enterX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 22px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${step.color}25`,
              }}
            >
              <div style={{ fontSize: 28 }}>{step.icon}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {step.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel visualization */}
      <FadeUp delay={120}>
        <div
          style={{
            marginTop: 24,
            padding: "16px 24px",
            borderRadius: 14,
            background: `${C.pink}12`,
            border: `1px solid ${C.pink}25`,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.pink,
              fontFamily: F,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Free beat download → email captured →{"\n"}
            they see your paid beats next.
          </div>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 7: Revenue Stream 5 — Email Sequence (0:42–0:50) ─────────
const Stream5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(200, 225);

  const emails = [
    { day: "Day 1", subject: "Here's your beat", icon: "📩", color: C.cyan },
    { day: "Day 3", subject: "Check out these other beats", icon: "🎵", color: C.primary },
    { day: "Day 5", subject: "The exclusive is still available", icon: "👑", color: C.gold },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={6} orbColors={[C.primary, C.green]}>
      <FadeUp delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.green})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 18,
              fontWeight: 900,
              color: C.white,
              fontFamily: F,
            }}
          >
            5
          </div>
          <SectionLabel color={C.cyan} style={{ marginBottom: 0 }}>
            AUTOMATED EMAIL SEQUENCE
          </SectionLabel>
        </div>
      </FadeUp>

      <FadeUp delay={8}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 1.3,
          }}
        >
          Free beat download triggers a{"\n"}
          <span style={{ color: C.white, fontWeight: 800 }}>3-email sequence over 5 days.</span>
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
        }}
      >
        {emails.map((email, i) => {
          const cardDelay = 30 + i * 35;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 50, stiffness: 160 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterScale = interpolate(enterSpring, [0, 1], [0.85, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `scale(${enterScale})`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${email.color}25`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: email.color,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                  minWidth: 50,
                }}
              >
                {email.day}
              </div>
              <div
                style={{
                  width: 2,
                  height: 28,
                  background: `linear-gradient(180deg, transparent, ${email.color}50, transparent)`,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 22 }}>{email.icon}</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.white,
                  fontFamily: F,
                }}
              >
                {email.subject}
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={145}>
        <div
          style={{
            marginTop: 24,
            fontSize: 17,
            fontWeight: 700,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Zero manual work.{" "}
          <GradientText from={C.cyan} to={C.green}>
            Runs while you sleep.
          </GradientText>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ─── SCENE 8: The Recap (0:50–0:55) — Numbers summary ───────────────
const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(120, 145);

  const stats = [
    { value: "22", label: "products", color: C.primary },
    { value: "2", label: "lead magnets", color: C.pink },
    { value: "1", label: "email sequence", color: C.cyan },
    { value: "1", label: "storefront", color: C.green },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={7}>
      <FadeUp delay={0}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 32,
          }}
        >
          From 10 beats:{"\n"}
          <span style={{ opacity: 0.5 }}>one tape → one platform</span>
        </div>
      </FadeUp>

      <div style={{ width: "100%", opacity: 0.3, marginBottom: 20 }}>
        <WaveformVisual delay={15} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
        }}
      >
        {stats.map((stat, i) => {
          const statDelay = 20 + i * 18;
          const statSpring = spring({
            fps,
            frame: frame - statDelay,
            config: { damping: 45, stiffness: 160 },
          });
          const statScale = interpolate(statSpring, [0, 1], [0, 1]);
          const statOp = interpolate(statSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: statOp,
                transform: `scale(${statScale})`,
                textAlign: "center",
                padding: "18px 12px",
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.darkGray}cc, ${C.bg}cc)`,
                border: `1px solid ${stat.color}25`,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  fontFamily: F,
                  lineHeight: 1,
                  background: `linear-gradient(135deg, ${stat.color}, ${C.white})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.gray,
                  fontFamily: F,
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </CenterScene>
  );
};

// ─── SCENE 9: CTA (0:55–1:00) — Comment BEATS ──────────────────────
const CTA: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 1.2 + (i % 5);
    const progress = Math.max(0, frame - 10) / 40;
    const dist = progress * speed * 45;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: Math.max(0, 1 - progress),
      size: 3 + (i % 3) * 2,
    };
  });

  return (
    <CenterScene>
      {/* Burst particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + p.x - p.size / 2,
            top: 860 + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: [C.orange, C.primary, C.cyan, C.pink, C.green][i % 5],
            opacity: p.opacity * 0.4,
            boxShadow: `0 0 ${p.size * 3}px ${[C.orange, C.primary, C.cyan, C.pink, C.green][i % 5]}`,
            zIndex: 0,
          }}
        />
      ))}

      <LogoIcon delay={6} size={90} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Got beats sitting on a hard drive?
        </div>
      </FadeUp>

      <FadeUp delay={30}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.2,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          <GradientText from={C.orange} to={C.pink}>
            Comment BEATS
          </GradientText>
        </div>
      </FadeUp>

      <FadeUp delay={42}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.white,
            fontFamily: F,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          and I'll DM you how to start listing yours.
        </div>
      </FadeUp>

      <FadeUp delay={55}>
        <div style={{ marginTop: 20 }}>
          <CTAButton
            delay={55}
            gradientFrom={C.orange}
            gradientTo={C.pink}
            glowColor={C.orange}
          >
            DM me "BEATS" →
          </CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={70}>
        <div
          style={{
            marginTop: 28,
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
// MAIN COMPOSITION — "10 Beats → 5 Revenue Streams" (60s)
//
// Timing breakdown:
//   0.5s  buffer               15 fr
//   4.0s  Hook                120 fr  (10 beats → 5 streams → 1 platform)
//   6.0s  Problem             180 fr  (what most producers do)
//  10.0s  Stream 1            300 fr  (beat leases with 3 tiers)
//   8.0s  Stream 2            240 fr  (bundle pricing)
//   7.0s  Stream 3            210 fr  (project files)
//   7.0s  Stream 4            210 fr  (free lead magnets)
//   8.0s  Stream 5            240 fr  (email sequence)
//   5.0s  Recap               150 fr  (stats summary)
//   4.5s  CTA                 135 fr  (comment BEATS)
//   ────────────────────────────────
//  60.0s  total              1800 fr
// ═══════════════════════════════════════════════════════════════════════
export const BeatTapeRevenueVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={15} durationInFrames={120}>
        <Hook />
      </Sequence>
      <Sequence from={135} durationInFrames={180}>
        <Problem />
      </Sequence>
      <Sequence from={315} durationInFrames={300}>
        <Stream1 />
      </Sequence>
      <Sequence from={615} durationInFrames={240}>
        <Stream2 />
      </Sequence>
      <Sequence from={855} durationInFrames={210}>
        <Stream3 />
      </Sequence>
      <Sequence from={1065} durationInFrames={210}>
        <Stream4 />
      </Sequence>
      <Sequence from={1275} durationInFrames={240}>
        <Stream5 />
      </Sequence>
      <Sequence from={1515} durationInFrames={150}>
        <Recap />
      </Sequence>
      <Sequence from={1665} durationInFrames={135}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
