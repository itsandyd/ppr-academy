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
// ATTENTION — Generic platforms vs you (0s–6s, 180 frames)
// ═══════════════════════════════════════════════════════════════════════
const Attention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const genericItems = [
    { label: "Digital Product", w: 200 },
    { label: "Online Course", w: 180 },
    { label: "Template", w: 140 },
  ];

  const genericOp = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const genericExit = interpolate(frame, [80, 95], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headOp = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const smashOp = interpolate(frame, [98, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const smashSpring = spring({
    fps,
    frame: frame - 100,
    config: { damping: 45, stiffness: 200 },
  });
  const smashScale = interpolate(smashSpring, [0, 1], [1.4, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          opacity: genericOp * genericExit,
          padding: "0 48px",
        }}
      >
        <div
          style={{
            opacity: headOp,
            fontSize: 30,
            fontWeight: 800,
            color: "#6b7280",
            fontFamily: F,
            marginBottom: 36,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Generic platforms sell{"\n"}generic products.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          {genericItems.map((item, i) => {
            const cardDelay = 20 + i * 16;
            const cardOp = interpolate(frame, [cardDelay, cardDelay + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity: cardOp,
                  padding: "18px 24px",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "#e5e7eb",
                  }}
                />
                <div
                  style={{
                    fontSize: 20,
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
            fontSize: 44,
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

// ═══════════════════════════════════════════════════════════════════════
// INTEREST — Music-specific product types (6s–15s, 270 frames)
// ═══════════════════════════════════════════════════════════════════════
const Interest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(248, 270);

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

  const taglineOp = interpolate(frame, [210, 228], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineSpring = spring({
    fps,
    frame: frame - 215,
    config: { damping: 50, stiffness: 160 },
  });

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={2}>
      <FadeUp delay={0}>
        <SectionLabel color={C.primary}>SELL WHAT YOU MAKE</SectionLabel>
      </FadeUp>

      <div style={{ width: "100%", marginBottom: 16, opacity: 0.4 }}>
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
          const cardDelay = 18 + i * 22;
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
                gap: 6,
                padding: "14px 10px",
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.darkGray}dd, ${C.bg}dd)`,
                border: `1px solid ${prod.color}30`,
                boxShadow: `0 0 20px ${prod.color}10`,
              }}
            >
              <div style={{ fontSize: 28 }}>{prod.icon}</div>
              <div
                style={{
                  fontSize: 15,
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
          marginTop: 20,
        }}
      >
        <div
          style={{
            fontSize: 24,
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

// ═══════════════════════════════════════════════════════════════════════
// DESIRE A — AI-generated social script (15s–20s, 150 frames)
// ═══════════════════════════════════════════════════════════════════════
const DesireAIScript: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(128, 150);

  const scriptLines = [
    "Your low end is muddy because",
    "you're boosting where you",
    "should be cutting.",
    "",
    "Here's the 30-second fix:",
    "High-pass at 30 Hz.",
    "Cut 200-400 Hz by 2-3 dB.",
    "Boost 60 Hz shelf, gently.",
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.cyan} seed={3}>
      <FadeUp delay={3}>
        <SectionLabel color={C.cyan}>AI SOCIAL SCRIPTS</SectionLabel>
      </FadeUp>

      <FadeUp delay={10}>
        <div
          style={{
            width: "100%",
            padding: "22px 26px",
            borderRadius: 18,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.cyan}25`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.cyan,
                fontFamily: F,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              🤖 AI-GENERATED TIKTOK SCRIPT
            </div>
          </div>

          {scriptLines.map((line, i) => {
            const lineDelay = 18 + i * 10;
            const lineOp = interpolate(frame, [lineDelay, lineDelay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            if (line === "") return <div key={i} style={{ height: 10 }} />;
            return (
              <div
                key={i}
                style={{
                  opacity: lineOp,
                  fontSize: 17,
                  fontWeight: i < 3 ? 800 : 600,
                  color: i < 3 ? C.white : C.gray,
                  fontFamily: F,
                  lineHeight: 1.6,
                  textAlign: "left",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </FadeUp>

      <FadeUp delay={100}>
        <div
          style={{
            fontSize: 15,
            color: C.gray,
            fontFamily: F,
            marginTop: 14,
          }}
        >
          Generated from your course content
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE B — Cheat sheet with real production terms (20s–25s, 150 frames)
// ═══════════════════════════════════════════════════════════════════════
const DesireCheatSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(128, 150);

  const sections = [
    {
      title: "EQ Quick Reference",
      items: [
        "Sub Bass: 20-60 Hz",
        "Mud Zone: 200-400 Hz (cut here)",
        "Presence: 2-5 kHz",
        "Air: 10-16 kHz (shelf boost)",
      ],
    },
    {
      title: "Compression Settings",
      items: [
        "Vocals: 3:1 ratio, 5ms attack",
        "Drums: 4:1 ratio, 1ms attack",
        "Bus: 2:1 ratio, 30ms attack",
      ],
    },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.gold} seed={4}>
      <FadeUp delay={3}>
        <SectionLabel color={C.gold}>AI CHEAT SHEETS</SectionLabel>
      </FadeUp>

      <FadeUp delay={10}>
        <div
          style={{
            width: "100%",
            padding: "22px 24px",
            borderRadius: 18,
            background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
            border: `1px solid ${C.gold}25`,
          }}
        >
          {sections.map((section, si) => {
            const sectionDelay = 16 + si * 40;
            const sOp = interpolate(frame, [sectionDelay, sectionDelay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div key={si} style={{ opacity: sOp, marginBottom: si < sections.length - 1 ? 18 : 0 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.gold,
                    fontFamily: F,
                    marginBottom: 10,
                    textAlign: "left",
                  }}
                >
                  {section.title}
                </div>
                {section.items.map((item, ii) => {
                  const itemDelay = sectionDelay + 10 + ii * 8;
                  const iOp = interpolate(frame, [itemDelay, itemDelay + 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
                  return (
                    <div
                      key={ii}
                      style={{
                        opacity: iOp,
                        fontSize: 15,
                        color: C.white,
                        fontFamily: "monospace",
                        lineHeight: 1.8,
                        textAlign: "left",
                        paddingLeft: 12,
                        borderLeft: `2px solid ${C.gold}30`,
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </FadeUp>

      <FadeUp delay={100}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: F,
            marginTop: 22,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          <GradientText from={C.gold} to={C.orange}>
            Built for this.
          </GradientText>
          <div style={{ color: C.white, marginTop: 4, fontSize: 18 }}>
            Not adapted for it.
          </div>
        </div>
      </FadeUp>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DESIRE C — Storefront comparison (25s–29s, 120 frames)
// ═══════════════════════════════════════════════════════════════════════
const DesireStorefront: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { op, y } = useExit(100, 120);

  const pprProducts = [
    { name: "Serum Preset Pack", price: "$25", icon: "🎛️" },
    { name: "Lo-Fi Beat Lease", price: "$35", icon: "🎵" },
    { name: "Mixing Masterclass", price: "$49", icon: "🎓" },
  ];

  return (
    <CenterScene opacity={op} translateY={y} tint={C.primary} seed={5}>
      <FadeUp delay={3}>
        <SectionLabel color={C.primary}>YOUR STOREFRONT</SectionLabel>
      </FadeUp>

      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        {/* Generic side */}
        <FadeUp delay={10} style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.gray,
              fontFamily: F,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            GENERIC
          </div>
          <div
            style={{
              padding: "16px 14px",
              borderRadius: 14,
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
            }}
          >
            {["Product 1", "Product 2", "Product 3"].map((name, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid #e5e7eb" : "none",
                  fontSize: 13,
                  color: "#9ca3af",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </FadeUp>

        {/* PPR side */}
        <FadeUp delay={22} style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.primary,
              fontFamily: F,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            PPR ACADEMY
          </div>
          <div
            style={{
              padding: "16px 14px",
              borderRadius: 14,
              background: `linear-gradient(180deg, ${C.darkGray}ee, ${C.bg}ee)`,
              border: `1px solid ${C.primary}25`,
            }}
          >
            {pprProducts.map((prod, i) => {
              const prodDelay = 30 + i * 14;
              const prodOp = interpolate(frame, [prodDelay, prodDelay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: prodOp,
                    padding: "8px 0",
                    borderBottom: i < 2 ? `1px solid ${C.primary}15` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{prod.icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.white,
                        fontFamily: F,
                      }}
                    >
                      {prod.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.primary,
                      fontFamily: F,
                    }}
                  >
                    {prod.price}
                  </span>
                </div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </CenterScene>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACTION — CTA (29s–36s, 210 frames)
// ═══════════════════════════════════════════════════════════════════════
const Action: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 1.5 + (i % 4);
    const progress = Math.max(0, frame - 10) / 35;
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

      <LogoIcon delay={8} size={100} />

      <FadeUp delay={25}>
        <div
          style={{
            fontSize: 34,
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

      <FadeUp delay={32}>
        <div
          style={{
            fontSize: 42,
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

      <FadeUp delay={50}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: C.gray,
            fontFamily: F,
            marginTop: 14,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          Not adapted.{" "}
          <span style={{ color: C.white, fontWeight: 900 }}>Built.</span>
        </div>
      </FadeUp>

      <FadeUp delay={68}>
        <div style={{ marginTop: 16 }}>
          <CTAButton delay={68}>Start Free →</CTAButton>
        </div>
      </FadeUp>

      <FadeUp delay={85}>
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
// MAIN COMPOSITION — "Made for Music Producers" (~37s)
//
// Timing breakdown:
//   0.5s  buffer         15 fr
//   6.0s  Attention      180 fr   (generic → smash cut)
//   9.0s  Interest       270 fr   (8 product types)
//   5.0s  Desire A       150 fr   (AI social script)
//   5.0s  Desire B       150 fr   (AI cheat sheet)
//   4.0s  Desire C       120 fr   (storefront comparison)
//   7.0s  Action         210 fr   (CTA)
//   0.5s  buffer         15 fr
//   ─────────────────────────────
//   37.0s total          1110 fr
// ═══════════════════════════════════════════════════════════════════════
export const PromoMadeForProducers: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Sequence from={15} durationInFrames={180}>
        <Attention />
      </Sequence>
      <Sequence from={195} durationInFrames={270}>
        <Interest />
      </Sequence>
      <Sequence from={465} durationInFrames={150}>
        <DesireAIScript />
      </Sequence>
      <Sequence from={615} durationInFrames={150}>
        <DesireCheatSheet />
      </Sequence>
      <Sequence from={765} durationInFrames={120}>
        <DesireStorefront />
      </Sequence>
      <Sequence from={885} durationInFrames={210}>
        <Action />
      </Sequence>
    </AbsoluteFill>
  );
};
