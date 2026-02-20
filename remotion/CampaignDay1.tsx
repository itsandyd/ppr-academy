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
// CAMPAIGN DAY 1: "Made for Music Producers"
// Narrative: Plant the flag. Establish identity. No selling yet.
// AIDA: Attention → Interest → Desire → Action (30s total)
// ═══════════════════════════════════════════════════════════════════════

// ─── ATTENTION (0:00–0:05) — Generic vs You ────────────────────────────
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const genericItems = [
    { label: "Digital Product", w: 200 },
    { label: "Online Course", w: 180 },
    { label: "Template", w: 140 },
  ];

  const genericOp = interpolate(frame, [3, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const genericExit = interpolate(frame, [70, 82], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headOp = interpolate(frame, [6, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "You don't make generic products."
  const smashOp = interpolate(frame, [85, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const smashSpring = spring({
    fps,
    frame: frame - 87,
    config: { damping: 45, stiffness: 200 },
  });
  const smashScale = interpolate(smashSpring, [0, 1], [1.4, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Generic platform cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          opacity: genericOp * genericExit,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            opacity: headOp,
            fontSize: 28,
            fontWeight: 800,
            color: "#6b7280",
            fontFamily: F,
            marginBottom: 32,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Generic platforms sell{"\n"}generic products.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
          }}
        >
          {genericItems.map((item, i) => {
            const cardDelay = 16 + i * 14;
            const cardOp = interpolate(
              frame,
              [cardDelay, cardDelay + 10],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div
                key={i}
                style={{
                  opacity: cardOp,
                  padding: "16px 22px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#e5e7eb",
                  }}
                />
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#9ca3af",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smash cut */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: C.bg,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: smashOp,
          zIndex: 10,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            transform: `scale(${smashScale})`,
            fontSize: 40,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
            textShadow: `0 0 60px ${C.primary}40`,
          }}
        >
          You don't make{"\n"}
          <GradientText from={C.primary} to={C.pink}>
            generic products.
          </GradientText>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── INTEREST (0:05–0:13) — Music-specific product types ──────────────
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(218, 240);

  // REAL product types from the codebase
  const products = [
    { name: "Sample Packs", icon: "🥁", color: C.orange },
    { name: "Preset Packs", icon: "🎛️", color: C.cyan },
    { name: "Beat Leases", icon: "🎵", color: C.pink },
    { name: "MIDI Packs", icon: "🎹", color: C.purple },
    { name: "Mixing Templates", icon: "🎚️", color: C.green },
    { name: "Effect Chains", icon: "⚡", color: C.gold },
    { name: "Project Files", icon: "📂", color: C.primary },
    { name: "Courses", icon: "🎓", color: C.warmOrange },
  ];

  const taglineOp = interpolate(frame, [190, 208], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineSpring = spring({
    fps,
    frame: frame - 195,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={2}>
      <FadeUp delay={0}>
        <SectionLabel color={C.primary}>SELL WHAT YOU MAKE</SectionLabel>
      </FadeUp>

      <div style={{ width: "100%", marginBottom: 14, opacity: 0.35 }}>
        <WaveformVisual delay={5} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          width: "100%",
        }}
      >
        {products.map((prod, i) => {
          const cardDelay = 14 + i * 18;
          const enterSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: { damping: 55, stiffness: 180 },
          });
          const enterOp = interpolate(enterSpring, [0, 1], [0, 1]);
          const enterScale = interpolate(enterSpring, [0, 1], [0.7, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: enterOp,
                transform: `scale(${enterScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "13px 8px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${prod.color}30`,
                boxShadow: `0 0 18px ${prod.color}10`,
              }}
            >
              <div style={{ fontSize: 26 }}>{prod.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: prod.color,
                  fontFamily: F,
                  textAlign: "center",
                }}
              >
                {prod.name}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          opacity: taglineOp,
          transform: `translateY(${interpolate(taglineSpring, [0, 1], [25, 0])}px)`,
          marginTop: 18,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          <GradientText from={C.primary} to={C.cyan}>
            Every product type a producer
          </GradientText>
          <div style={{ color: C.white, marginTop: 2 }}>actually sells.</div>
        </div>
      </div>
    </CenterScene>
  );
};

// ─── DESIRE — AI advantage in music context (0:13–0:22) ───────────────
const Desire: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

  // Phase A: AI Social Script (frames 0–120)
  const scriptPhase = frame < 130;
  // Phase B: AI Cheat Sheet (frames 130–210)
  const cheatPhase = frame >= 130 && frame < 220;
  // Phase C: Storefront comparison (frames 220–270)
  const storePhase = frame >= 220;

  const scriptLines = [
    "Your low end is muddy because",
    "you're boosting where you",
    "should be cutting.",
    "",
    "Here's the 30-second fix:",
    "High-pass at 30 Hz.",
    "Cut 200–400 Hz by 2-3 dB.",
  ];

  const cheatItems = [
    { section: "EQ Quick Reference", items: ["Sub Bass: 20–60 Hz", "Mud Zone: 200–400 Hz", "Presence: 2–5 kHz"] },
    { section: "Compression", items: ["Vocals: 3:1, 5ms attack", "Drums: 4:1, 1ms attack"] },
  ];

  const scriptOp = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scriptExit = interpolate(frame, [115, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cheatOp = interpolate(frame, [130, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cheatExit = interpolate(frame, [205, 220], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const storeOp = interpolate(frame, [220, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const closerOp = interpolate(frame, [240, 255], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const closerSpring = spring({
    fps,
    frame: frame - 245,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={3}>
      {/* Phase A: AI Social Script */}
      {scriptPhase && (
        <div style={{ opacity: scriptOp * scriptExit, width: "100%" }}>
          <FadeUp delay={3}>
            <SectionLabel color={C.cyan}>AI SOCIAL SCRIPTS</SectionLabel>
          </FadeUp>
          <div
            style={{
              width: "100%",
              padding: "18px 22px",
              borderRadius: 16,
              background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
              border: `1px solid ${C.cyan}25`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.cyan,
                fontFamily: F,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              🤖 AI-GENERATED TIKTOK SCRIPT
            </div>
            {scriptLines.map((line, i) => {
              const lineDelay = 14 + i * 8;
              const lineOp = interpolate(frame, [lineDelay, lineDelay + 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              if (line === "") return <div key={i} style={{ height: 8 }} />;
              return (
                <div
                  key={i}
                  style={{
                    opacity: lineOp,
                    fontSize: 15,
                    fontWeight: i < 3 ? 800 : 600,
                    color: i < 3 ? C.white : C.gray,
                    fontFamily: F,
                    lineHeight: 1.6,
                  }}
                >
                  {line}
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.gray,
              fontFamily: F,
              marginTop: 10,
              textAlign: "center",
              opacity: interpolate(frame, [80, 90], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Generated from your course content
          </div>
        </div>
      )}

      {/* Phase B: AI Cheat Sheet */}
      {cheatPhase && (
        <div style={{ opacity: cheatOp * cheatExit, width: "100%" }}>
          <SectionLabel color={C.gold}>AI CHEAT SHEETS</SectionLabel>
          <div
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 16,
              background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
              border: `1px solid ${C.gold}25`,
            }}
          >
            {cheatItems.map((section, si) => {
              const sDelay = si * 20;
              const sOp = interpolate(frame - 130, [sDelay + 5, sDelay + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div key={si} style={{ opacity: sOp, marginBottom: si < cheatItems.length - 1 ? 14 : 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: C.gold,
                      fontFamily: F,
                      marginBottom: 8,
                    }}
                  >
                    {section.section}
                  </div>
                  {section.items.map((item, ii) => (
                    <div
                      key={ii}
                      style={{
                        fontSize: 14,
                        color: C.white,
                        fontFamily: "monospace",
                        lineHeight: 1.7,
                        paddingLeft: 10,
                        borderLeft: `2px solid ${C.gold}30`,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase C: Tagline */}
      {storePhase && (
        <div style={{ opacity: storeOp, width: "100%" }}>
          <div
            style={{
              opacity: closerOp,
              transform: `translateY(${interpolate(closerSpring, [0, 1], [25, 0])}px)`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                fontFamily: F,
                lineHeight: 1.3,
              }}
            >
              <GradientText from={C.gold} to={C.orange}>
                Built for this.
              </GradientText>
            </div>
            <div
              style={{
                color: C.white,
                marginTop: 6,
                fontSize: 22,
                fontWeight: 800,
                fontFamily: F,
              }}
            >
              Not adapted for it.
            </div>
          </div>
        </div>
      )}
    </CenterScene>
  );
};

// ─── ACTION (0:22–0:30) — CTA ─────────────────────────────────────────
const Action: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const speed = 1.5 + (i % 4);
    const progress = Math.max(0, frame - 8) / 35;
    const dist = progress * speed * 40;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: Math.max(0, 1 - progress),
      size: 3 + (i % 3) * 2,
    };
  });

  return (
    <CenterScene>
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
            backgroundColor: [C.primary, C.pink, C.cyan, C.purple][i % 4],
            opacity: p.opacity * 0.4,
            boxShadow: `0 0 ${p.size * 3}px ${[C.primary, C.pink, C.cyan, C.purple][i % 4]}`,
            zIndex: 0,
          }}
        />
      ))}

      <LogoIcon delay={6} size={95} />

      <FadeUp delay={18}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: C.white,
            fontFamily: F,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          The platform built for
        </div>
      </FadeUp>

      <FadeUp delay={25}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: F,
            lineHeight: 1.2,
            marginTop: 4,
            textAlign: "center",
            background: `linear-gradient(135deg, ${C.primary}, ${C.pink})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          music producers.
        </div>
      </FadeUp>

      <FadeUp delay={40}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            marginTop: 12,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          Not adapted.{" "}
          <span style={{ color: C.white, fontWeight: 900 }}>Built.</span>
        </div>
      </FadeUp>

      <FadeUp delay={55}>
        <div style={{ marginTop: 14 }}>
          <CTAButton delay={55}>Start Free →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={70}>
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
// MAIN COMPOSITION — Campaign Day 1: "Made for Music Producers" (30s)
//
// Timing breakdown:
//   0.5s  buffer          15 fr
//   5.0s  Attention       150 fr  (generic → smash cut)
//   8.0s  Interest        240 fr  (8 product types grid)
//   9.0s  Desire          270 fr  (AI script → cheat sheet → tagline)
//   7.0s  Action          210 fr  (CTA + logo)
//   0.5s  buffer          15 fr
//   ─────────────────────────────
//   30.0s total           900 fr
// ═══════════════════════════════════════════════════════════════════════
export const CampaignDay1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
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
